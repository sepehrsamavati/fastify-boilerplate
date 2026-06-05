import type { onRequestHookHandler } from "fastify";
import { UserType } from "../types/enums/userType.js";

export default function roleGuard(allow: typeof UserType[keyof typeof UserType][]) {
    return (
        (function (request, reply, done) {
            if (request.locals.user?.type === UserType.Owner || allow.includes(request.locals.user!?.type))
                return done();

            reply.status(403).send({ message: "No access" });
        }) as onRequestHookHandler
    );
};
