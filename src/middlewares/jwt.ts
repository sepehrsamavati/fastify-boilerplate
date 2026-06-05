import type { onRequestHookHandler } from "fastify";
import type { IUserExample } from "../types/entities/user.js";

export default (async function jwtValidator(request, _reply) {
    try {
        await request.jwtVerify();
    } catch {
        return;
    }

    const payload = request.user;

    if (!payload)
        return;

    const userInfo = payload as IUserExample;

    request.locals.user = userInfo;
}) as onRequestHookHandler;