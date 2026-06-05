import winston from "winston";
import config from "../config.js";

const commonConfig: Partial<winston.transports.FileTransportOptions> = {
    maxsize: config.log.maxLogSize,
    maxFiles: config.log.maxLogFiles
}, format = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.json()
);

export const logger = winston.createLogger({
    format,
    transports: [
        new winston.transports.File({ ...commonConfig, filename: './logs/core.log', level: 'info' }),
        new winston.transports.File({ ...commonConfig, filename: './logs/error.log', level: 'error' }),
    ],
});

logger.add(new winston.transports.File({ ...commonConfig, filename: './logs/debug.log', level: 'silly' }));

if (!config.log.disable && (config.isDevelopment || config.alwaysConsoleLog)) {
    [logger].forEach(l =>
        l.add(
            new winston.transports.Console({
                level: "silly",
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
            })
        )
    );
} else if (config.log.disable) {
    logger.silent = true;
}

export const errorLogger = (title: string, err: unknown) => {
    logger.error(`${title}, ${err instanceof Error ? err.message : err}`);
};
