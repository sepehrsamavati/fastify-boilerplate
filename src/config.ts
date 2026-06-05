import fs from "node:fs";
import * as dotenv from "dotenv";
import asciiArts from "./helpers/asciiArts.js";
import configError from "./helpers/configError.js";
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

const config = {
    version: projectVersion,
    alwaysConsoleLog: false,
    isDevelopment: isDevelopment,
    storageBasePath: process.env.FAPI_STORAGE_BASE_PATH ?? "./data/cache",
    httpProxyUri: process.env.FAPI_HTTP_PROXY ? new URL(process.env.FAPI_HTTP_PROXY).toString() : undefined,
    apiServer: {
        domain: "",
        port: Number.parseInt(process.env.FAPI_API_SERVER_PORT ?? "3017"),
        baseAddress: process.env.FAPI_API_SERVER_BASE_ADDRESS ?? "",
        cookieKey: "Auth",
        accessTokenCookieKey: "access_token",
        refreshTokenCookieKey: "refresh_token",
        sessionSecretHexKey: process.env.FAPI_API_SERVER_SESSION_COOKIE_SIGN_KEY,
        tokenSignSecret: process.env.FAPI_API_SERVER_COOKIE_SIGN_SECRET || "",
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

if (!fs.existsSync(config.storageBasePath))
    fs.mkdirSync(config.storageBasePath, { recursive: true });

if (config.httpProxyUri) {
    // Corporate proxy uses CA not in undici's certificate store
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    const dispatcher = new ProxyAgent({ uri: config.httpProxyUri });
    setGlobalDispatcher(dispatcher);
}

export default config;
