import { validateSync } from "class-validator";
import { plainToInstance } from "class-transformer";
import type { preValidationHookHandler } from "fastify";

export const fastifyPayloadValidator = <T extends object>(
    Model: new () => T,
    source?: 'body' | 'query' | 'params'
): preValidationHookHandler => {
    const createInstance = (rawData: unknown): T => plainToInstance(Model, rawData,
        {
            excludeExtraneousValues: true,
            exposeDefaultValues: true
        }) ?? new Model();

    return (request, reply, done) => {
        const rawData = source === 'params'
            ? request.params
            : source === 'query'
                ? request.query
                : ['GET', 'DELETE'].includes(request.method)
                    ? request.query
                    : request.body;

        const instance = createInstance(rawData);
        const errors = validateSync(instance);
        if (errors.length)
            return reply.status(400).send(errors);
        else {
            request.locals.dto = instance;
            done();
        }
    };
};

export const dtoValidator = <T extends object>(Model: new () => T, dto: unknown, onValid: (dto: T) => unknown) => {
    const createInstance = (rawData: unknown): T => plainToInstance(Model, rawData,
        {
            excludeExtraneousValues: true,
            exposeDefaultValues: true
        }) ?? new Model();

    const instance = createInstance(dto);
    const errors = validateSync(instance);

    if (errors.length === 0)
        onValid(instance);
};
