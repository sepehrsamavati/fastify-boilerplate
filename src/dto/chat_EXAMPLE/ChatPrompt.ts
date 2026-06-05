import ChatID from "./ChatID.js";
import { Expose, Type } from "class-transformer";
import { IsDefined, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

type IPromptRequest = {
    chatId: string;
    promptText: string;
    attachmentFileId?: string;
    streamSocketId?: string;
    clientRequestId?: string;
}

export default class ChatPrompt extends ChatID implements IPromptRequest {
    @Expose()
    @Type(() => String)
    @IsDefined()
    @IsString()
    @MinLength(1)
    @MaxLength(2048)
    promptText!: string;

    @Expose()
    @Type(() => String)
    @IsOptional()
    @IsString()
    @MinLength(15)
    @MaxLength(55)
    attachmentFileId?: string;

    @Expose()
    @Type(() => String)
    @IsOptional()
    @IsString()
    @IsUUID()
    streamSocketId?: string;

    @Expose()
    @Type(() => String)
    @IsOptional()
    @IsString()
    @IsUUID()
    clientRequestId?: string;
}