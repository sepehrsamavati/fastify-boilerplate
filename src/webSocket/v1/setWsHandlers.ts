import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyPluginCallback } from "fastify";
import type { WebSocket, WebsocketHandler } from "@fastify/websocket";
import type { IUserViewModel } from "../../types/entities/user.js";
import config from "../../config.js";
import { logger } from "../../helpers/logger.js";

type SocketConnectionContext = {
    id: string;
    socket: WebSocket;
    user: IUserViewModel;
}

const socketStorage = new Map<string, SocketConnectionContext>();
const generateSocketId = () => randomUUID();
const MAX_CONNECTIONS_PER_USER = config.apiServer.ws.maxConnectionsPerUser;

export const getSocketById = (id: string) => socketStorage.get(id);

export const setWsHandlers = (fastifyInstance: FastifyInstance, controller: Parameters<FastifyPluginCallback>['0']) => {

    controller
        .get("/", { websocket: true }, () => null);

    controller
        .websocketServer
        .on("connection", async (socket: Parameters<WebsocketHandler>[0], request: Parameters<WebsocketHandler>[1]) => {
            if (!request.headers.cookie)
                return socket.close();

            const cookies = fastifyInstance.parseCookie(request.headers.cookie);
            const accessToken = cookies[config.apiServer.accessTokenCookieKey];

            if (!accessToken)
                return socket.close();

            const payload = fastifyInstance.jwt.verify(accessToken);

            if (!payload)
                return socket.close();

            const userViewModel = payload as IUserViewModel;

            const userCurrentConnections = [...socketStorage.values()].filter(connection => connection.user.id === userViewModel.id).length;

            if (userCurrentConnections + 1 > MAX_CONNECTIONS_PER_USER)
                return socket.close();

            // const scope = coreServices.createApplicationScope();
            // const applications = scope.applications;

            const socketId = generateSocketId();

            const context: SocketConnectionContext = {
                socket,
                id: socketId,
                user: userViewModel,
            };

            socketStorage.set(socketId, context);

            socket.once("close", () => {
                socketStorage.delete(socketId);
                // scope.dispose();
            });

            socket.send(JSON.stringify(
                {
                    name: "helloResponse",
                    value: {
                        connectionId: socketId
                    }
                }
            ));
        });

    logger.info("Web socket listener attached");
};