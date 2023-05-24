import type { Params, PondPath, EventParams } from '../types';

/**
 * @desc Returns the {key: value} matches of a string
 * @param path - the string to create the regex from
 * @param address - the pattern to match
 *
 * @example
 * /api/:id should match /api/123 and return { id: 123 }
 * /api/:id/:name should match /api/123/abc and return { id: 123, name: abc }
 * hello:id should match hello:123 and return { id: 123 }
 * @private
 */
function matchPath (path: string, address: string) {
    const pathParts = path.split('/');
    const addressParts = address.split('/');

    const params: Record<string, string> = {};
    const length = Math.max(pathParts.length, addressParts.length);

    for (let i = 0; i < length; i++) {
        const pathPart = pathParts[i];
        const addressPart = addressParts[i];

        if (pathPart === undefined || addressPart === undefined) {
            return null;
        } else if (pathPart === '*') {
            return params as Params<typeof path>;
        } else if (pathPart.startsWith(':')) {
            params[pathPart.slice(1)] = addressPart;
        } else if (pathPart !== addressPart) {
            return null;
        }
    }

    return params as Params<typeof path>;
}

/**
 * @desc Given a Regex expression it returns an empty object if the address matches
 * @param regex - The regex to match the address against
 * @param address - The address ot match
 */
function matchRegex (regex: RegExp, address: string) {
    if (address.match(regex)) {
        return {};
    }

    return null;
}

/**
 * @desc Creates an object from the params of a path
 * @param address - the path to create the object from
 *
 * @example
 * /api/id?name=abc should return { name: 'abc' }
 * /api/id?name=abc&age=123 should return { name: 'abc', age: '123' }
 */
function getQuery (address: string) {
    const obj: { [p: string]: string } = {};
    const params = address.split('?')[1];

    if (params) {
        params.split('&').forEach((param) => {
            const [key, value] = param.split('=');

            obj[key] = value;
        });
    }

    return obj;
}

/**
 * @desc Generates a pond request resolver object
 * @param path - the path to resolve
 * @param address - the address to resolve
 */
export function parseAddress <Path extends string> (path: PondPath<Path>, address: string) {
    let params: Record<string, string> | null;
    const [paramsPath] = address.split('?');

    if (typeof path === 'string') {
        params = matchPath(path, paramsPath);

        if (params === null) {
            return null;
        }
    } else {
        params = matchRegex(path, paramsPath);

        if (params === null) {
            return null;
        }
    }

    const query = getQuery(address);

    return {
        params,
        query,
    } as EventParams<Path>;
}
