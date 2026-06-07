import type { UserType } from "../enums/userType.js";

export type IUser = {
    id: string;
    username: string;
    passwordHash: string;
    type: typeof UserType[keyof typeof UserType];
    createdAt: number;
};

export type IUserViewModel = {
    id: string;
    username: string;
    type: typeof UserType[keyof typeof UserType];
};
