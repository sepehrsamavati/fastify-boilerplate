import process from "node:process";
import { ExitCode } from "../types/enums/exitCodes.js";

export default (errorMessage: string, condition: boolean) => {
    if (condition) {
        console.error(`Config error\n${errorMessage}`);
        process.exit(ExitCode.ConfigError);
    }
};
