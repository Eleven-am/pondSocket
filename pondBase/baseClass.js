"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseClass = void 0;
class BaseClass {
    /**
     * @desc checks if the pattern is matchable
     * @param pattern - the pattern to check
     */
    static isPatternMatchable(pattern) {
        return typeof pattern === 'string' && pattern.includes(':');
    }
    /**
     * @desc compares string to string | regex
     * @param string - the string to compare to the pattern
     * @param pattern - the pattern to compare to the string
     */
    compareStringToPattern(string, pattern) {
        if (typeof pattern === 'string')
            return string.split('?')[0] === pattern;
        else
            return pattern.test(string);
    }
    /**
     * @desc Checks if the given object is empty
     * @param obj - the object to check
     */
    isObjectEmpty(obj) {
        return Object.keys(obj).length === 0;
    }
    /**
     * @desc Generates a pond request resolver object
     * @param path - the path to resolve
     * @param address - the address to resolve
     */
    generateEventRequest(path, address) {
        const match = this._matchStringToPattern(address, path);
        if (match)
            return {
                params: match, query: this._parseQueries(address), address: address
            };
        return null;
    }
    /**
     * @desc Compares if two objects are equal
     * @param obj1 - the first object
     * @param obj2 - the second object
     */
    areEqual(obj1, obj2) {
        return JSON.stringify(obj1) === JSON.stringify(obj2);
    }
    /**
     * @desc Creates an object from the params of a path
     * @param path - the path to create the object from
     *
     * @example
     * /api/id?name=abc should return { name: 'abc' }
     * /api/id?name=abc&age=123 should return { name: 'abc', age: '123' }
     */
    _parseQueries(path) {
        const obj = {};
        const params = path.split('?')[1];
        if (params) {
            params.split('&').forEach(param => {
                const [key, value] = param.split('=');
                obj[key] = value;
            });
        }
        return obj;
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
    _matchString(string, pattern) {
        const replace = pattern.replace(/:[^/]+/g, '([^/]+)');
        const regExp = new RegExp(`^${replace}$`);
        const matches = string.split('?')[0].match(regExp);
        if (matches) {
            const keys = pattern.match(/:[^/]+/g);
            if (keys) {
                const obj = {};
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
    _matchStringToPattern(string, pattern) {
        if (BaseClass.isPatternMatchable(pattern))
            return this._matchString(string, pattern);
        const valid = this.compareStringToPattern(string, pattern);
        if (valid)
            return {};
        return null;
    }
}
exports.BaseClass = BaseClass;
