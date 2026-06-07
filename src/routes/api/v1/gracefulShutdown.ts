import config from "../../../config.js";
import type { RouteHandlerMethod } from "fastify";
import { OperationResult, OperationResultWithData } from "../../../dto/OperationResult.js";

export const requestShutdown: RouteHandlerMethod = async (request, reply) => {
    const result = new OperationResult();

    request.locals.applications.gracefulShutdown.initiateShutdown();

    result.succeeded();

    return reply.status(200).send(result);
};

export const getInfo: RouteHandlerMethod = async (request, reply) => {
    const result = new OperationResultWithData<{ activeRequests: number; lastRequestStart: number; }>();

    result
        .succeeded()
        .setData({
            activeRequests: request.locals.applications.gracefulShutdown.activeRequests,
            lastRequestStart: request.locals.applications.gracefulShutdown.lastRequestStart,
        });

    return reply.status(200).send(result);
};

export const health: RouteHandlerMethod = async (_request, reply) => {
    return reply.status(200).send({
        ok: true,
        version: config.version,
    });
};
