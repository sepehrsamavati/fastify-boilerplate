import type CoreServices from "../Container.js";

export type IServices = {
    core: CoreServices;
    dispose: () => void;
};