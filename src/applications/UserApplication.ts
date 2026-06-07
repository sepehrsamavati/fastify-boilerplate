import { randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import config from "../config.js";
import { UserType } from "../types/enums/userType.js";
import type { IUser, IUserViewModel } from "../types/entities/user.js";
import type { ServicesType } from "../Container.js";
import CacheStorage from "../infrastructure/services/CacheStorage.js";
import { OperationResultWithData } from "../dto/OperationResult.js";
import Register from "../dto/auth/Register.js";
import { dtoValidator } from "../middlewares/dtoValidator.js";

const scryptAsync = promisify(scrypt);

const hashPassword = async (password: string) => {
    const salt = randomUUID();
    const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
    return `${salt}:${derivedKey.toString("hex")}`;
};

const verifyPassword = async (password: string, passwordHash: string) => {
    const [salt, storedHash] = passwordHash.split(":");
    if (!salt || !storedHash)
        return false;

    const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
    const storedBuffer = Buffer.from(storedHash, "hex");

    return storedBuffer.length === derivedKey.length
        && timingSafeEqual(storedBuffer, derivedKey);
};

export default class UserApplication {
    #users: CacheStorage<IUser>;

    constructor(container: ServicesType) {
        this.#users = container.userCache;
    }

    toViewModel(user: IUser): IUserViewModel {
        return {
            id: user.id,
            username: user.username,
            type: user.type,
        };
    }

    async register(rawDto: unknown): Promise<OperationResultWithData<IUserViewModel>> {
        const result = new OperationResultWithData<IUserViewModel>();

        let validatedDto: Register | null = null;
        dtoValidator(Register, rawDto, (dto) => {
            validatedDto = dto;
        });

        if (!validatedDto)
            return result.failed("invalidInput");

        const dto = validatedDto as Register;
        const usernameKey = dto.username.toLowerCase();

        if (this.#users.exists(usernameKey))
            return result.failed("usernameAlreadyExists");

        const isBootstrapAdmin = config.bootstrapAdminUsername
            && config.bootstrapAdminUsername.toLowerCase() === usernameKey;

        const user: IUser = {
            id: randomUUID(),
            username: dto.username,
            passwordHash: await hashPassword(dto.password),
            type: isBootstrapAdmin ? UserType.Admin : UserType.Member,
            createdAt: Date.now(),
        };

        this.#users.set(usernameKey, user);
        this.#users.set(user.id, user);

        return result.succeeded().setData(this.toViewModel(user));
    }

    async authenticate(username: string, password: string): Promise<IUser | null> {
        const user = this.#users.get(username.toLowerCase());
        if (!user)
            return null;

        const valid = await verifyPassword(password, user.passwordHash);
        return valid ? user : null;
    }

    getById(userId: string): IUser | null {
        return this.#users.get(userId);
    }

    getByUsername(username: string): IUser | null {
        return this.#users.get(username.toLowerCase());
    }
}
