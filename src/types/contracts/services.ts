export type ICacheStorage<T> = {
    get(key: string): T | null;
    set(key: string, value: T): void;
    unset(key: string): boolean;
    exists(key: string): boolean;
    getAllKeys(): string[];
}

export type ExpirableEntity<T> = T & { _expiry: number; };

export type IExpirableCacheStorage<T extends ExpirableEntity<B>, B> = ICacheStorage<T> & {
    getWithExpiryCheck: ICacheStorage<T>['get'];
};
