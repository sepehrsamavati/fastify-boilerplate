import type { ICacheStorage } from "../../types/contracts/services.js";

export default class CacheStorage<T> implements ICacheStorage<T> {
    #storage = new Map<string, T>();

    get(key: string): T | null {
        return this.#storage.get(key) ?? null;
    }

    set(key: string, value: T): void {
        this.#storage.set(key, value);
        return;
    }

    unset(key: string): boolean {
        return this.#storage.delete(key);
    }

    exists(key: string): boolean {
        return this.#storage.has(key);
    }

    getAllKeys(): string[] {
        return Array.from(this.#storage.keys());
    }
}