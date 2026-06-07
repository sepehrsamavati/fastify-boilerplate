import type { RouteHandlerMethod } from "fastify";
import { OperationResultWithData } from "../../../dto/OperationResult.js";
import type { IUserViewModel } from "../../../types/entities/user.js";

export const getMe: RouteHandlerMethod = async (request, reply) => {
    const result = new OperationResultWithData<IUserViewModel>();

    if (!request.locals.user)
        return reply.status(200).send(result.failed("noAccess"));

    return reply.status(200).send(result.succeeded().setData(request.locals.user));
};
