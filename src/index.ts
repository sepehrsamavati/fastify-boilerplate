import "reflect-metadata";
import CoreServices from "./Container.js";
import HttpServer from "./HttpServer.js";
import { logger } from "./helpers/logger.js";

const core = new CoreServices();
const server = new HttpServer({
    core,
    dispose: () => core.destroy(),
});

const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down`);
    await server.close();
    await core.destroy();
    process.exit(0);
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

export { server, core };
