import { Expose, Type } from "class-transformer";
import TelegramOtpRequest from "./TelegramOtpRequest.js";
import { IsDefined, IsString, MaxLength, MinLength } from "class-validator";

export default class TelegramOtpLogin extends TelegramOtpRequest {
    @Expose()
    @Type(() => String)
    @IsDefined()
    @IsString()
    @MinLength(3)
    @MaxLength(10)
    otp!: string;
}