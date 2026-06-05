import { Expose, Type } from "class-transformer";
import { IsDefined, IsPhoneNumber, IsString, MaxLength, MinLength } from "class-validator";

export default class TelegramOtpRequest {
    @Expose()
    @Type(() => String)
    @IsDefined()
    @IsString()
    @IsPhoneNumber()
    @MinLength(4)
    @MaxLength(35)
    phoneNumber!: string;
}