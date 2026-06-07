import jwt from "../middlewares/jwt.js";
import websocket from '@fastify/websocket';
import fileHandler from '@fastify/multipart';
import type { FastifyInstance } from "fastify";
import roleGuard from '../middlewares/roleGuard.js';
import authGuard from "../middlewares/authGuard.js";
import Login from "../dto/auth/Login.js";
import Register from "../dto/auth/Register.js";
import NoteId from "../dto/notes/NoteId.js";
import CreateNote from "../dto/notes/CreateNote.js";
import { UserType } from "../types/enums/userType.js";
import { fastifyPayloadValidator } from "../middlewares/dtoValidator.js";

import * as auth from "./api/v1/auth.js";
import * as user from "./api/v1/user.js";
import * as notes from "./api/v1/notes.js";
import * as tempFile from "./api/v1/tempFile.js";
import * as gracefulShutdown from "./api/v1/gracefulShutdown.js";
import { setWsHandlers } from '../webSocket/v1/setWsHandlers.js';
import config from "../config.js";

export const setRoutes = (fastifyInstance: FastifyInstance) => {

    fastifyInstance.register((wsController, _, next) => {
        wsController.register(websocket, {
            prefix: config.apiServer.v1.baseAddress + "/ws"
        })
            .after(() => {
                setWsHandlers(fastifyInstance, wsController);
            });

        next();
    }, {
        prefix: config.apiServer.v1.baseAddress + "/ws",
    });

    fastifyInstance.register((authController, _, next) => {
        authController.post("/register", { preValidation: fastifyPayloadValidator(Register) }, auth.register);
        authController.post("/login", { preValidation: fastifyPayloadValidator(Login) }, auth.login);
        authController.post("/logout", auth.logout);
        authController.post("/refresh", auth.refreshAccessToken);

        next();
    }, { prefix: config.apiServer.v1.baseAddress + "/auth" });

    fastifyInstance.register((userController, _, next) => {
        userController.addHook('onRequest', jwt);
        userController.addHook('onRequest', authGuard);

        userController.get("/me", user.getMe);

        next();
    }, { prefix: config.apiServer.v1.baseAddress + "/user" });

    fastifyInstance.register((notesController, _, next) => {
        notesController.addHook('onRequest', jwt);
        notesController.addHook('onRequest', authGuard);

        notesController.get("/", notes.listNotes);
        notesController.post("/", { preValidation: fastifyPayloadValidator(CreateNote) }, notes.createNote);
        notesController.get("/:noteId", { preValidation: fastifyPayloadValidator(NoteId, 'params') }, notes.getNote);
        notesController.patch("/:noteId", notes.updateNote);
        notesController.delete("/:noteId", { preValidation: fastifyPayloadValidator(NoteId, 'params') }, notes.deleteNote);

        next();
    }, { prefix: config.apiServer.v1.baseAddress + "/notes" });

    fastifyInstance.register((fileController, _, next) => {
        fileController.addHook('onRequest', jwt);
        fileController.addHook('onRequest', authGuard);
        fileController.register(fileHandler);
        fileController.put("/upload", tempFile.uploadTempFile);

        next();
    }, { prefix: config.apiServer.v1.baseAddress + "/file" });

    fastifyInstance.register((baseController, _, next) => {
        baseController.get("/health", gracefulShutdown.health);
        baseController.get(`/${config.apiServer.v1.tempFile.path}/:id`, tempFile.getTempFile);

        next();
    }, { prefix: config.apiServer.v1.baseAddress });

    fastifyInstance.register((adminController, _, next) => {
        adminController.addHook('onRequest', jwt);
        adminController.addHook('onRequest', authGuard);

        adminController.post("/shutdown", { preValidation: roleGuard([UserType.Admin]) }, gracefulShutdown.requestShutdown);
        adminController.get("/requests", { preValidation: roleGuard([UserType.Admin]) }, gracefulShutdown.getInfo);

        next();
    }, { prefix: config.apiServer.v1.baseAddress });

    fastifyInstance.setNotFoundHandler(function (_req, res) {
        void res.status(404).send({
            ok: false,
            message: "Not found"
        });
    });
};
