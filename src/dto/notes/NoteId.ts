import { Expose, Type } from "class-transformer";
import { IsDefined, IsString, MaxLength, MinLength } from "class-validator";

export default class NoteId {
    @Expose()
    @Type(() => String)
    @IsDefined()
    @IsString()
    @MinLength(1)
    @MaxLength(64)
    noteId!: string;
}
