import { errorLogger } from "../../helpers/logger.js";
import type { ServicesType } from "../../Container.js";

const proxyHandler: ProxyHandler<any> = {
    get(target, prop, receiver) {
        if (typeof target[prop] === 'function') {
            return function (...args: unknown[]) {
                const className = target.constructor.name;
                const methodName = prop.toString();
                const result = target[prop].apply(target, args);

                if (result instanceof Promise) {
                    return new Promise(resolve => {
                        result
                            .then(res => {
                                resolve(res); // return (resolve) after success
                            })
                            .catch(err => {
                                errorLogger(`${className} / ${methodName}`, err);
                                resolve(null);
                            });
                    });
                }

                return result;
            };
        }
        return Reflect.get(target, prop, receiver);
    },
    set(target, prop, value, receiver) {
        return Reflect.set(target, prop, value, receiver);
    }
};

/** Proxy for async methods / Returns untouched result on success or null on error (and log) */
export const errorCatcher = <T extends new (container: ServicesType) => InstanceType<T>>(Class: T) => {
    return new Proxy(Class, {
        construct(Target: T, args: [ServicesType]) {
            const container = args[0];
            const instance = new Target(container);
            return new Proxy(instance, proxyHandler);
        }
    });
};
