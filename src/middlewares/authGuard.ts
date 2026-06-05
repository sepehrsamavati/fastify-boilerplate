import type { onRequestHookHandler } from "fastify";

export default (function authGuard(request, reply, done) {
    if (request.locals.user)
        return done();

    reply.status(401).send({ message: "Authorization required!" });
}) as onRequestHookHandler;
