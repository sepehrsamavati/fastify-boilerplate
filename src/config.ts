import fs from "node:fs";
import * as dotenv from "dotenv";
import asciiArts from "./helpers/asciiArts.js";
import configError from "./helpers/configError.js";
import configWarn from "./helpers/configWarn.js";
import { setGlobalDispatcher, ProxyAgent } from "undici";
import { projectVersion, projectsVersions } from "./helpers/configVersion.js";

dotenv.config({
    path: [
        ".env",
        /** @todo useful for monorepos */
        // "../core/.env",
        // "../.env",
        // "../../.env",
        // "../../../.env",
    ]
});

const isDevelopment = process.env.NODE_ENV !== "production";

if (isDevelopment)
    console.debug(
        `\n${asciiArts.FapiBoilerplate}`
        + `\n v${projectVersion}`
        + `\n\n${projectsVersions.map(info => `${`${info.project.toUpperCase()}:`.padEnd(15, ' ')} v${info.version}`).join('\n')}\n`
    );

const parsePositiveInt = (value: string | undefined, fallback: number) => {
    const parsed = Number.parseInt(value ?? "");
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const config = {
    version: projectVersion,
    alwaysConsoleLog: false,
    isDevelopment: isDevelopment,
    storageBasePath: process.env.FAPI_STORAGE_BASE_PATH ?? "./data/cache",
    httpProxyUri: process.env.FAPI_HTTP_PROXY ? new URL(process.env.FAPI_HTTP_PROXY).toString() : undefined,
    bootstrapAdminUsername: process.env.FAPI_BOOTSTRAP_ADMIN_USERNAME?.trim() || undefined,
    apiServer: {
        domain: "",
        port: Number.parseInt(process.env.FAPI_API_SERVER_PORT ?? "3017"),
        baseAddress: process.env.FAPI_API_SERVER_BASE_ADDRESS ?? "",
        accessTokenCookieKey: process.env.FAPI_ACCESS_TOKEN_COOKIE_KEY ?? "access_token",
        refreshTokenCookieKey: process.env.FAPI_REFRESH_TOKEN_COOKIE_KEY ?? "refresh_token",
        tokenSignSecret: process.env.FAPI_API_SERVER_COOKIE_SIGN_SECRET || "",
        auth: {
            accessTokenMaxAgeSeconds: parsePositiveInt(process.env.FAPI_ACCESS_TOKEN_MAX_AGE_SECONDS, 900),
            refreshTokenMaxAgeSeconds: parsePositiveInt(process.env.FAPI_REFRESH_TOKEN_MAX_AGE_SECONDS, 5184000),
            refreshTokenPath: process.env.FAPI_REFRESH_TOKEN_PATH ?? "/api/v1/auth/refresh",
            accessTokenExpiresIn: process.env.FAPI_ACCESS_TOKEN_EXPIRES_IN ?? "15m",
            refreshTokenExpiresIn: process.env.FAPI_REFRESH_TOKEN_EXPIRES_IN ?? "60d",
        },
        ws: {
            maxConnectionsPerUser: parsePositiveInt(process.env.FAPI_WS_MAX_CONNECTIONS_PER_USER, 5),
        },
        v1: {
            baseAddress: process.env.FAPI_API_V1_BASE_ADDRESS ?? "/api/v1",
            tempFile: {
                path: process.env.FAPI_TEMP_FILE_PATH ?? "tempFile"
            }
        }
    },
    log: {
        disable: process.argv.includes("--silent-logger"),
        maxLogSize: 10 * 1024 * 1024,
        maxLogFiles: 10
    }
};

configError(
    "API server base address is not defined/valid URL",
    !URL.canParse(config.apiServer.baseAddress)
);

config.apiServer.domain = config.isDevelopment ? 'localhost' : new URL(config.apiServer.baseAddress).host;

// Freeze Start
for (const key of Object.keys(config)) {
    const value = config[key as keyof typeof config];
    if (value && typeof value === "object")
        Object.freeze(value);
}

Object.freeze(config);
// Freeze End

configError(
    "API server port is not valid (1-65535 integer range)",
    !Number.isInteger(config.apiServer.port) || config.apiServer.port <= 0 || config.apiServer.port > 65535
);

configError(
    "API server cookie/token sign secret is not defined",
    !config.apiServer.tokenSignSecret
);

configWarn(
    "FAPI_BOOTSTRAP_ADMIN_USERNAME is not set — the first registered user will be a regular member",
    !config.isDevelopment && !config.bootstrapAdminUsername
);

if (!fs.existsSync(config.storageBasePath))
    fs.mkdirSync(config.storageBasePath, { recursive: true });

if (config.httpProxyUri) {
    // Corporate proxy uses CA not in undici's certificate store
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    const dispatcher = new ProxyAgent({ uri: config.httpProxyUri });
    setGlobalDispatcher(dispatcher);
}

export default config;
