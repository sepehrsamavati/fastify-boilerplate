export default class GracefulShutdown {
    static #instance: GracefulShutdown;
    #shouldShutdown = false;
    #activeRequests = 0;
    #lastRequestStart = 0;

    private constructor() { }

    public static getInstance(): GracefulShutdown {
        if (!GracefulShutdown.#instance) {
            GracefulShutdown.#instance = new GracefulShutdown();
        }
        return GracefulShutdown.#instance;
    }

    public startRequest(): boolean {
        if (this.#shouldShutdown) {
            return false;
        }
        this.#activeRequests++;
        this.#lastRequestStart = Date.now();
        return true;
    }

    public endRequest(): void {
        this.#activeRequests--;
    }

    public async initiateShutdown(): Promise<void> {
        this.#shouldShutdown = true;
    }

    get activeRequests() {
        return this.#activeRequests;
    }

    get lastRequestStart() {
        return this.#lastRequestStart;
    }
}