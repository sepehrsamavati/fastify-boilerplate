import { Expose, Type } from "class-transformer";
import { IsDefined, IsString, MaxLength, MinLength } from "class-validator";

export default class Login {
    @Expose()
    @Type(() => String)
    @IsDefined()
    @IsString()
    @MinLength(3)
    @MaxLength(64)
    username!: string;

    @Expose()
    @Type(() => String)
    @IsDefined()
    @IsString()
    @MinLength(8)
    @MaxLength(128)
    password!: string;
}
