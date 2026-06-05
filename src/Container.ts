import GracefulShutdown from "./infrastructure/GracefulShutdown.js";
import type { IUserExample } from "./types/entities/user.js";
import { createContainer, asClass, asValue } from "awilix";

type Constants = {
    projectName: string;
    mongoDbConnectionStringUri: string;
};

type Connections = {};

type Repositories = {};

type Applications = {};

type Services = {};

type ExposedServices = {};

export type ServicesType = Constants & Connections & Repositories & Applications & Services & ExposedServices;

export default class CoreServices {

    private readonly container = createContainer<ServicesType>({
        strict: true,
        injectionMode: "PROXY"
    });

    /** @todo */
    // public get databaseConnection() {
    //     return this.container.cradle.databaseConnection;
    // }

    public readonly applications: Applications = this.container.cradle;
    public readonly repositories: Repositories = this.container.cradle;
    /** Requires DI ready */
    public exposedServices!: Readonly<ExposedServices>;

    #diReadyQueue = new Set<() => void>([
        () => {
            this.exposedServices = Object.freeze({
                // exampleService: this.container.cradle.exampleService,
            });
        }
    ]);

    async diReady(): Promise<void> {
        /** @todo */
        // if (this.databaseConnection.con) return;
        const promise = new Promise<void>(resolve => this.#diReadyQueue.add(resolve));
        return promise;
    }

    /** @todo */
    async #rootInitialize() {
        // Initialize jobs, get settings from DB, ...
    }

    constructor(autoSetup = true) {
        this.container.register({
            projectName: asValue("httpServer"),
            gracefulShutdown: asValue(GracefulShutdown.getInstance()),
        });

        if (autoSetup) {
            this.#diReadyQueue.forEach(cb => cb());
            this.#rootInitialize();

            /** @todo */
            // this.databaseConnection
            //     .connect()
            //     .then(() => {
            //         this.#diReadyQueue.forEach(cb => cb());
            //         this.#rootInitialize();
            //     });
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
