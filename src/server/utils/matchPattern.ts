export interface Resolver {
    params: Record<string, string>;
    query: Record<string, string>;
    address: string;
}

export type PondPath = string | RegExp;

export class MatchPattern {
    /**
     * @desc Generates a pond request resolver object
     * @param path - the path to resolve
     * @param address - the address to resolve
     */
    public parseEvent (path: PondPath, address: string): Resolver | null {
        if (path === '*') {
            return {
                params: {},
                address,
                query: this._parseQueries(address),
            };
        }

        const match = this._matchStringToPattern(address, path);

        if (match) {
            return {
                params: match,
                address,
                query: this._parseQueries(address),
            };
        }

        return null;
    }

    /**
     * @desc Creates an object from the params of a path
     * @param path - the path to create the object from
     *
     * @example
     * /api/id?name=abc should return { name: 'abc' }
     * /api/id?name=abc&age=123 should return { name: 'abc', age: '123' }
     */
    private _parseQueries (path: string) {
        const obj: { [p: string]: string } = {};
        const params = path.split('?')[1];

        if (params) {
            params.split('&').forEach((param) => {
                const [key, value] = param.split('=');

                obj[key] = value;
            });
        }

        return obj;
    }

    /**
     * @desc checks if the pattern is matchable
     * @param pattern - the pattern to check
     */
    private _isPatternMatchable (pattern: PondPath) {
        return typeof pattern === 'string' && pattern.includes(':');
    }

    /**
     * @desc compares string to string | regex
     * @param string - the string to compare to the pattern
     * @param pattern - the pattern to compare to the string
     */
    private _compareStringToPattern (string: string, pattern: PondPath) {
        if (typeof pattern === 'string') {
            return string.split('?')[0] === pattern;
        }

        return pattern.test(string);
    }

    /**
     * @desc Returns the {key: value} matches of a string
     * @param string - the string to create the regex from
     * @param pattern - the pattern to match
     *
     * @example
     * /api/:id should match /api/123 and return { id: 123 }
     * /api/:id/:name should match /api/123/abc and return { id: 123, name: abc }
     * hello:id should match hello:123 and return { id: 123 }
     * @private
     */
    private _matchString (string: string, pattern: string) {
        const replace = pattern.replace(/:[^/]+/g, '([^/]+)');
        const regExp = new RegExp(`^${replace}$`);
        const matches = string.split('?')[0].match(regExp);

        if (matches) {
            const keys = pattern.match(/:[^/]+/g);

            if (keys) {
                const obj: { [p: string]: string } = {};

                keys.forEach((key, index) => {
                    obj[key.replace(':', '')] = matches[index + 1].replace(/\?.*$/, '');
                });

                return obj;
            }
        }

        return null;
    }

    /**
     * @desc matches a string to a pattern and returns its params if any
     * @param string - the string to match
     * @param pattern - the pattern to match to
     */
    private _matchStringToPattern (string: string, pattern: PondPath) {
        if (this._isPatternMatchable(pattern)) {
            return this._matchString(string, pattern as string);
        }

        const valid = this._compareStringToPattern(string, pattern);

        if (valid) {
            return {};
        }

        return null;
    }
}
