import type { FastifyRequest } from "fastify";
import type CoreServices from "../Container.ts";
import type { IUserViewModel } from "./entities/user";

declare module 'fastify' {
    interface FastifyRequest {
        locals: {
            /** May be null - Be sure to call jwt middleware */
            user: IUserViewModel | null;
            dto: unknown;
            services: CoreServices['exposedServices'];
            applications: CoreServices['applications'];
        };
    }
}
