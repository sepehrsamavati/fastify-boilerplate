import { createContainer, asValue, asFunction } from "awilix";
import GracefulShutdown from "./infrastructure/GracefulShutdown.js";
import CacheStorage from "./infrastructure/services/CacheStorage.js";
import ExpirableCacheStorage from "./infrastructure/services/ExpirableCacheStorage.js";
import { errorCatcher } from "./infrastructure/proxy/errorCatcher.js";
import UserApplication from "./applications/UserApplication.js";
import NotesApplication from "./applications/NotesApplication.js";
import type { IUser } from "./types/entities/user.js";
import type { INote } from "./types/entities/note.js";
import type { ISession } from "./types/entities/session.js";

type Constants = {
    projectName: string;
};

type Connections = {};

type Repositories = {};

type Applications = {
    userApplication: UserApplication;
    notesApplication: NotesApplication;
    gracefulShutdown: GracefulShutdown;
};

type Services = {
    userCache: CacheStorage<IUser>;
    notesCache: CacheStorage<INote>;
    sessionCache: ExpirableCacheStorage<ISession, { userId: string; tokenId: string; }>;
};

type ExposedServices = {};

export type ServicesType = Constants & Connections & Repositories & Applications & Services & ExposedServices;

const UserApplicationClass = errorCatcher(UserApplication);
const NotesApplicationClass = errorCatcher(NotesApplication);

export default class CoreServices {

    private readonly container = createContainer<ServicesType>({
        strict: true,
        injectionMode: "PROXY"
    });

    public readonly applications: Applications = this.container.cradle;
    public readonly repositories: Repositories = this.container.cradle;
    /** Requires DI ready */
    public exposedServices!: Readonly<ExposedServices>;

    #diReadyQueue = new Set<() => void>([
        () => {
            this.exposedServices = Object.freeze({});
        }
    ]);

    async diReady(): Promise<void> {
        const promise = new Promise<void>(resolve => this.#diReadyQueue.add(resolve));
        this.#diReadyQueue.forEach(cb => cb());
        return promise;
    }

    async #rootInitialize() {
        // Initialize jobs, external connections, ...
    }

    constructor(autoSetup = true) {
        this.container.register({
            projectName: asValue("httpServer"),
            gracefulShutdown: asValue(GracefulShutdown.getInstance()),
            userCache: asValue(new CacheStorage<IUser>()),
            notesCache: asValue(new CacheStorage<INote>()),
            sessionCache: asValue(new ExpirableCacheStorage<ISession, { userId: string; tokenId: string; }>()),
            userApplication: asFunction((cradle: ServicesType) => new UserApplicationClass(cradle)).singleton(),
            notesApplication: asFunction((cradle: ServicesType) => new NotesApplicationClass(cradle)).singleton(),
        });

        if (autoSetup) {
            this.#diReadyQueue.forEach(cb => cb());
            void this.#rootInitialize();
        }
    }

    createApplicationScope(opts?: {
        projectName?: string;
    }) {
        const scope = this.container.createScope();

        if (opts?.projectName)
            scope.register({
                projectName: asValue(opts.projectName)
            });

        return {
            applications: scope.cradle as Applications,
            dispose: scope.dispose,
        } as const;
    }

    destroy() {
        return this.container.dispose();
    }
}
