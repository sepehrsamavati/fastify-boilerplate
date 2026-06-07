import { createReadStream } from "node:fs";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import config from "../../../config.js";
import type { RouteHandlerMethod } from "fastify";
import { OperationResult, OperationResultWithData } from "../../../dto/OperationResult.js";
import { errorLogger } from "../../../helpers/logger.js";

const tempDir = path.join(config.storageBasePath, "temp");

const ensureTempDir = () => {
    if (!fs.existsSync(tempDir))
        fs.mkdirSync(tempDir, { recursive: true });
};

export const getTempFile: RouteHandlerMethod = async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const filePath = path.join(tempDir, id);

    if (!fs.existsSync(filePath))
        return reply.status(404).send(new OperationResult().failed("notFound"));

    return reply.send(createReadStream(filePath));
};

export const uploadTempFile: RouteHandlerMethod = async (request, reply) => {
    const result = new OperationResultWithData<string>();
    ensureTempDir();

    const data = await request.file({
        limits: {
            fileSize: 10 * 1024 * 1024,
        }
    });

    if (!data)
        return reply.status(400).send(result.failed("invalidInput"));

    const fileId = randomUUID();
    const filePath = path.join(tempDir, fileId);

    try {
        const buffer = await data.toBuffer();
        fs.writeFileSync(filePath, buffer);
        return reply.status(200).send(result.succeeded().setData(fileId));
    } catch (err) {
        errorLogger("HTTP server saving temp file", err);
        return reply.status(500).send(result.failed("operationFailed"));
    }
};
