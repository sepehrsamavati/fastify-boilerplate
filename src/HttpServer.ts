import "reflect-metadata";
import Fastify from 'fastify';
import config from "./config.js";
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import url from 'node:url';
import { logger } from "./helpers/logger.js";
import { setRoutes } from "./routes/router.js";
import type { IServices } from "./types/services.js";
import GracefulShutdown from "./infrastructure/GracefulShutdown.js";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export default class HttpServer {
    constructor(private services: IServices) {
        void this.#init();
    }

    #fastify = Fastify({
        logger: true,
    });

    async #init() {
        const coreServices = this.services.core;
        const gracefulShutdown = GracefulShutdown.getInstance();

        await coreServices.diReady();

        this.#fastify.addHook('onRequest', (req, res, done) => {
            if (!gracefulShutdown.startRequest()) {
                res.status(503).send({ message: "Server is shutting down" });
                return;
            }

            const scope = coreServices.createApplicationScope();

            req.locals = {
                user: null,
                dto: null,
                services: coreServices.exposedServices,
                applications: scope.applications,
            };

            res.raw.once('finish', async () => {
                gracefulShutdown.endRequest();
                await scope.dispose();
            });

            done();
        });

        await this.#setupAuth();
        await this.#fastify.register(fastifyStatic, {
            root: path.join(__dirname, '../data/public'),
            prefix: '/public/',
            decorateReply: true,
        });

        setRoutes(this.#fastify);

        await this.#fastify.listen({
            port: config.apiServer.port,
            host: "0.0.0.0",
        });

        logger.info(`Server started on port ${config.apiServer.port}`);
    }

    async #setupAuth() {
        await this.#fastify.register(fastifyCookie);

        await this.#fastify.register(fastifyJwt, {
            secret: config.apiServer.tokenSignSecret,
            cookie: {
                cookieName: config.apiServer.accessTokenCookieKey,
                signed: true
            },
            verify: { extractToken: (req) => req.cookies[config.apiServer.accessTokenCookieKey] },
            decode: { complete: true },
        });
    }

    async close() {
        await this.#fastify.close();
    }
}
