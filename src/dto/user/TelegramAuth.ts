import { Expose, Type } from "class-transformer";
import { IsDefined, IsNumber, IsPositive, IsString, MaxLength, MinLength } from "class-validator";

export default class TelegramAuth {
    @Expose()
    @Type(() => String)
    @IsDefined()
    @IsString()
    @MinLength(100)
    @MaxLength(2048)
    initData!: string;
}