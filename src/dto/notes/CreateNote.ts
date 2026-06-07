import { Expose, Type } from "class-transformer";
import { IsDefined, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export default class CreateNote {
    @Expose()
    @Type(() => String)
    @IsDefined()
    @IsString()
    @MinLength(1)
    @MaxLength(128)
    title!: string;

    @Expose()
    @Type(() => String)
    @IsDefined()
    @IsString()
    @MinLength(1)
    @MaxLength(2048)
    content!: string;

    @Expose()
    @Type(() => String)
    @IsOptional()
    @IsString()
    @IsUUID()
    streamSocketId?: string;
}
