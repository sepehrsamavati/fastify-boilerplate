import type { RouteHandlerMethod } from "fastify";
import CreateNote from "../../../dto/notes/CreateNote.js";
import NoteId from "../../../dto/notes/NoteId.js";
import UpdateNote from "../../../dto/notes/UpdateNote.js";
import { OperationResult, OperationResultWithData } from "../../../dto/OperationResult.js";
import type { INoteViewModel } from "../../../types/entities/note.js";

export const listNotes: RouteHandlerMethod = async (request, reply) => {
    const result = new OperationResultWithData<INoteViewModel[]>();

    if (!request.locals.user)
        return reply.status(401).send(result.failed("noAccess"));

    const notes = request.locals.applications.notesApplication.listByUser(request.locals.user.id);

    return reply.status(200).send(result.succeeded().setData(notes));
};

export const createNote: RouteHandlerMethod = async (request, reply) => {
    if (!request.locals.user)
        return reply.status(401).send(new OperationResult().failed("noAccess"));

    const result = request.locals.applications.notesApplication.create(
        request.locals.user.id,
        request.locals.dto as CreateNote
    );

    return reply.status(200).send(result ?? new OperationResult().failed("operationFailed"));
};

export const getNote: RouteHandlerMethod = async (request, reply) => {
    const result = new OperationResultWithData<INoteViewModel>();

    if (!request.locals.user)
        return reply.status(401).send(result.failed("noAccess"));

    const noteId = (request.locals.dto as NoteId).noteId;
    const note = request.locals.applications.notesApplication.getById(request.locals.user.id, noteId);

    if (!note)
        return reply.status(200).send(result.failed("notFound"));

    return reply.status(200).send(result.succeeded().setData({
        id: note.id,
        title: note.title,
        content: note.content,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
    }));
};

export const updateNote: RouteHandlerMethod = async (request, reply) => {
    if (!request.locals.user)
        return reply.status(401).send(new OperationResult().failed("noAccess"));

    const noteId = (request.params as { noteId: string }).noteId;
    const result = request.locals.applications.notesApplication.update(
        request.locals.user.id,
        noteId,
        request.body
    );

    return reply.status(200).send(result ?? new OperationResult().failed("operationFailed"));
};

export const deleteNote: RouteHandlerMethod = async (request, reply) => {
    if (!request.locals.user)
        return reply.status(401).send(new OperationResult().failed("noAccess"));

    const noteId = (request.locals.dto as NoteId).noteId;
    const result = request.locals.applications.notesApplication.delete(request.locals.user.id, noteId);

    return reply.status(200).send(result ?? new OperationResult().failed("operationFailed"));
};
