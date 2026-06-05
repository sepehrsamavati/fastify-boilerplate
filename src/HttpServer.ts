import "reflect-metadata";
import Fastify from 'fastify';
import config from "./config.js";
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import { logger } from "./helpers/logger.js";
import type { IServices } from "./types/services.js";

export default class HttpServer {
    constructor(private services: IServices) {
        this.#init();
    }

    #fastify = Fastify({
        logger: true,
    });

    #init() {
        const coreServices = this.services.core;

        this.#fastify.addHook('onRequest', (req, res, done) => {
            const scope = coreServices.createApplicationScope();

            req.locals = {
                user: null,
                dto: null,
                services: coreServices.exposedServices,
                applications: scope.applications,
            };

            res.raw.once('finish', async () => {
                await scope.dispose();
            });

            done();
        });

        this.#setupAuth();

        /** @todo */
        // setRoutes(this.#fastify);

        this.#fastify.listen({
            port: config.apiServer.port,
        })
            .then(() => {
                logger.info("Server started");
            });
    }

    #setupAuth() {
        this.#fastify.register(fastifyCookie)

        this.#fastify.register(fastifyJwt, {
            secret: config.apiServer.tokenSignSecret,
            cookie: {
                cookieName: config.apiServer.accessTokenCookieKey,
                signed: true
            },
            verify: { extractToken: (req) => req.cookies[config.apiServer.accessTokenCookieKey] },
            decode: { complete: true },
        });
    }
}
