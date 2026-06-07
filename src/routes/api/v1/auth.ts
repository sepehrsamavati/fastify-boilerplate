import { randomUUID } from "node:crypto";
import config from "../../../config.js";
import type { FastifyInstance, FastifyReply } from "fastify";
import type { RouteHandlerMethod } from "fastify";
import { type CookieSerializeOptions } from "@fastify/cookie";
import Login from "../../../dto/auth/Login.js";
import Register from "../../../dto/auth/Register.js";
import { OperationResult, OperationResultWithData } from "../../../dto/OperationResult.js";
import type { IUserViewModel } from "../../../types/entities/user.js";
import type NotesApplication from "../../../applications/NotesApplication.js";

const cookieBase = {
    httpOnly: true,
    secure: !config.isDevelopment,
    sameSite: "strict" as const,
    domain: config.apiServer.domain,
};

const setCookieOptions = {
    accessToken: {
        ...cookieBase,
        path: '/',
        maxAge: config.apiServer.auth.accessTokenMaxAgeSeconds,
    } as CookieSerializeOptions,
    refreshToken: {
        ...cookieBase,
        path: config.apiServer.auth.refreshTokenPath,
        maxAge: config.apiServer.auth.refreshTokenMaxAgeSeconds,
    } as CookieSerializeOptions,
};

const issueTokens = (
    fastify: FastifyInstance,
    reply: FastifyReply,
    user: IUserViewModel,
    notesApplication: NotesApplication,
) => {
    const accessToken = fastify.jwt.sign(
        user,
        { expiresIn: config.apiServer.auth.accessTokenExpiresIn }
    );

    const refreshTokenId = randomUUID();
    const refreshToken = fastify.jwt.sign(
        { userId: user.id, tokenId: refreshTokenId },
        { expiresIn: config.apiServer.auth.refreshTokenExpiresIn }
    );

    notesApplication.storeRefreshSession(refreshTokenId, user.id);

    reply.setCookie(config.apiServer.accessTokenCookieKey, accessToken, setCookieOptions.accessToken);
    reply.setCookie(config.apiServer.refreshTokenCookieKey, refreshToken, setCookieOptions.refreshToken);
};

export const register: RouteHandlerMethod = async (request, reply) => {
    const result = new OperationResultWithData<IUserViewModel>();
    const registration = await request.locals.applications.userApplication.register(request.locals.dto as Register);

    if (!registration?.ok || !registration.data)
        return reply.status(200).send(registration ?? result.failed("operationFailed"));

    issueTokens(request.server, reply, registration.data, request.locals.applications.notesApplication);

    return reply.status(200).send(registration);
};

export const login: RouteHandlerMethod = async function (request, reply) {
    const result = new OperationResultWithData<IUserViewModel>();
    const query = request.locals.dto as Login;

    const user = await request.locals.applications.userApplication.authenticate(query.username, query.password);

    if (!user)
        return reply.status(200).send(result.failed("invalidCredentials"));

    const userInfo = request.locals.applications.userApplication.toViewModel(user);
    issueTokens(request.server, reply, userInfo, request.locals.applications.notesApplication);

    return reply.status(200).send(result.succeeded().setData(userInfo));
};

export const logout: RouteHandlerMethod = async (request, reply) => {
    const result = new OperationResult();
    const refreshToken = request.cookies[config.apiServer.refreshTokenCookieKey];

    if (refreshToken) {
        try {
            const decoded = request.server.jwt.verify(refreshToken);
            if (
                typeof decoded === "object"
                && decoded
                && "tokenId" in decoded
                && typeof decoded.tokenId === "string"
            )
                request.locals.applications.notesApplication.revokeRefreshSession(decoded.tokenId);
        } catch {
            // ignore invalid refresh token on logout
        }
    }

    reply.clearCookie(config.apiServer.accessTokenCookieKey);
    reply.clearCookie(config.apiServer.refreshTokenCookieKey);

    return reply.status(200).send(result.succeeded());
};

export const refreshAccessToken: RouteHandlerMethod = async function (request, reply) {
    const result = new OperationResult();

    const refreshToken = request.cookies[config.apiServer.refreshTokenCookieKey];
    if (!refreshToken)
        return reply.status(200).send(result.failed());

    let decoded: unknown;
    try {
        decoded = this.jwt.verify(refreshToken);
    } catch {
        return reply.status(200).send(result.failed());
    }

    if (!(
        typeof decoded === "object"
        && decoded
        && "userId" in decoded
        && typeof decoded.userId === "string"
        && "tokenId" in decoded
        && typeof decoded.tokenId === "string"
    ))
        return reply.status(200).send(result.failed());

    const session = request.locals.applications.notesApplication.getRefreshSession(decoded.tokenId);
    if (!session || session.userId !== decoded.userId)
        return reply.status(200).send(result.failed());

    const user = request.locals.applications.userApplication.getById(decoded.userId);
    if (!user)
        return reply.status(200).send(result.failed());

    const newAccessToken = this.jwt.sign(
        request.locals.applications.userApplication.toViewModel(user),
        { expiresIn: config.apiServer.auth.accessTokenExpiresIn }
    );

    reply.setCookie(config.apiServer.accessTokenCookieKey, newAccessToken, setCookieOptions.accessToken);

    return reply.status(200).send(result.succeeded());
};
