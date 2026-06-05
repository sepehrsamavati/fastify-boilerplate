import { Expose, Type } from "class-transformer";
import { IsDefined, IsEnum, IsString, MaxLength, MinLength } from "class-validator";

const langCodes = ["fa", "en"] as const;

export default class ChangeLanguage {
    @Expose()
    @Type(() => String)
    @IsDefined()
    @IsString()
    @MinLength(1)
    @MaxLength(3)
    @IsEnum(langCodes)
    lang!: string;
}