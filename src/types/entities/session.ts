import type { ExpirableEntity } from "../contracts/services.js";

export type ISession = ExpirableEntity<{
    userId: string;
    tokenId: string;
}>;
