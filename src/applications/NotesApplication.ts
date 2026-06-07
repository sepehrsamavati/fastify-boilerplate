import { randomUUID } from "node:crypto";
import config from "../config.js";
import type { INote, INoteViewModel } from "../types/entities/note.js";
import type { ServicesType } from "../Container.js";
import CacheStorage from "../infrastructure/services/CacheStorage.js";
import ExpirableCacheStorage from "../infrastructure/services/ExpirableCacheStorage.js";
import { OperationResult, OperationResultWithData } from "../dto/OperationResult.js";
import CreateNote from "../dto/notes/CreateNote.js";
import UpdateNote from "../dto/notes/UpdateNote.js";
import { dtoValidator } from "../middlewares/dtoValidator.js";
import type { ISession } from "../types/entities/session.js";
import { getSocketById } from "../webSocket/v1/setWsHandlers.js";

export default class NotesApplication {
    #notes: CacheStorage<INote>;
    #sessions: ExpirableCacheStorage<ISession, { userId: string; tokenId: string; }>;

    constructor(container: ServicesType) {
        this.#notes = container.notesCache;
        this.#sessions = container.sessionCache;
    }

    #noteKey(userId: string, noteId: string) {
        return `${userId}:${noteId}`;
    }

    #toViewModel(note: INote): INoteViewModel {
        return {
            id: note.id,
            title: note.title,
            content: note.content,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
        };
    }

    #notifySocket(streamSocketId: string | undefined, payload: unknown) {
        if (!streamSocketId)
            return;

        const connection = getSocketById(streamSocketId);
        if (connection && connection.socket.readyState === connection.socket.OPEN)
            connection.socket.send(JSON.stringify(payload));
    }

    listByUser(userId: string): INoteViewModel[] {
        return this.#notes
            .getAllKeys()
            .filter(key => key.startsWith(`${userId}:`))
            .map(key => this.#notes.get(key))
            .filter((note): note is INote => note !== null)
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .map(note => this.#toViewModel(note));
    }

    getById(userId: string, noteId: string): INote | null {
        return this.#notes.get(this.#noteKey(userId, noteId));
    }

    create(userId: string, rawDto: unknown): OperationResultWithData<INoteViewModel> {
        const result = new OperationResultWithData<INoteViewModel>();

        let validatedDto: CreateNote | null = null;
        dtoValidator(CreateNote, rawDto, (dto) => {
            validatedDto = dto;
        });

        if (!validatedDto)
            return result.failed("invalidInput");

        const dto = validatedDto as CreateNote;
        const now = Date.now();
        const note: INote = {
            id: randomUUID(),
            userId,
            title: dto.title,
            content: dto.content,
            createdAt: now,
            updatedAt: now,
        };

        this.#notes.set(this.#noteKey(userId, note.id), note);

        const viewModel = this.#toViewModel(note);
        this.#notifySocket(dto.streamSocketId, {
            name: "noteCreated",
            value: viewModel,
        });

        return result.succeeded().setData(viewModel);
    }

    update(userId: string, noteId: string, rawDto: unknown): OperationResultWithData<INoteViewModel> {
        const result = new OperationResultWithData<INoteViewModel>();
        const note = this.getById(userId, noteId);

        if (!note)
            return result.failed("notFound");

        let validatedDto: UpdateNote | null = null;
        dtoValidator(UpdateNote, rawDto, (dto) => {
            validatedDto = dto;
        });

        if (!validatedDto)
            return result.failed("invalidInput");

        const dto = validatedDto as UpdateNote;

        if (dto.title)
            note.title = dto.title;

        if (dto.content)
            note.content = dto.content;

        note.updatedAt = Date.now();
        this.#notes.set(this.#noteKey(userId, note.id), note);

        const viewModel = this.#toViewModel(note);
        this.#notifySocket(dto.streamSocketId, {
            name: "noteUpdated",
            value: viewModel,
        });

        return result.succeeded().setData(viewModel);
    }

    delete(userId: string, noteId: string): OperationResult {
        const result = new OperationResult();
        const key = this.#noteKey(userId, noteId);

        if (!this.#notes.unset(key))
            return result.failed("notFound");

        return result.succeeded();
    }

    storeRefreshSession(tokenId: string, userId: string): void {
        this.#sessions.set(tokenId, {
            userId,
            tokenId,
            _expiry: Date.now() + config.apiServer.auth.refreshTokenMaxAgeSeconds * 1000,
        });
    }

    revokeRefreshSession(tokenId: string): void {
        this.#sessions.unset(tokenId);
    }

    getRefreshSession(tokenId: string): ISession | null {
        return this.#sessions.getWithExpiryCheck(tokenId);
    }
}
