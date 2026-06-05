import { Expose, Type } from "class-transformer";
import { IsDefined, IsMongoId, IsString } from "class-validator";

export default class ChatID {
    @Expose()
    @Type(() => String)
    @IsDefined()
    @IsString()
    @IsMongoId()
    chatId!: string;
}