"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseClass = void 0;
var BaseClass = /** @class */ (function () {
    function BaseClass() {
    }
    /**
     * @desc checks if the pattern is matchable
     * @param pattern - the pattern to check
     */
    BaseClass.isPatternMatchable = function (pattern) {
        return typeof pattern === 'string' && pattern.includes(':');
    };
    /**
     * @desc compares string to string | regex
     * @param string - the string to compare to the pattern
     * @param pattern - the pattern to compare to the string
     */
    BaseClass.prototype.compareStringToPattern = function (string, pattern) {
        if (typeof pattern === 'string')
            return string.split('?')[0] === pattern;
        else
            return pattern.test(string);
    };
    /**
     * @desc Checks if the given object is empty
     * @param obj - the object to check
     */
    BaseClass.prototype.isObjectEmpty = function (obj) {
        return Object.keys(obj).length === 0;
    };
    /**
     * @desc Generates a pond request resolver object
     * @param path - the path to resolve
     * @param address - the address to resolve
     */
    BaseClass.prototype.generateEventRequest = function (path, address) {
        var match = this._matchStringToPattern(address, path);
        if (match)
            return {
                params: match, query: this._parseQueries(address), address: address
            };
        return null;
    };
    /**
     * @desc Compares if two objects are equal
     * @param obj1 - the first object
     * @param obj2 - the second object
     */
    BaseClass.prototype.areEqual = function (obj1, obj2) {
        return JSON.stringify(obj1) === JSON.stringify(obj2);
    };
    /**
     * @desc Creates an object from the params of a path
     * @param path - the path to create the object from
     *
     * @example
     * /api/id?name=abc should return { name: 'abc' }
     * /api/id?name=abc&age=123 should return { name: 'abc', age: '123' }
     */
    BaseClass.prototype._parseQueries = function (path) {
        var obj = {};
        var params = path.split('?')[1];
        if (params) {
            params.split('&').forEach(function (param) {
                var _a = __read(param.split('='), 2), key = _a[0], value = _a[1];
                obj[key] = value;
            });
        }
        return obj;
    };
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
    BaseClass.prototype._matchString = function (string, pattern) {
        var replace = pattern.replace(/:[^/]+/g, '([^/]+)');
        var regExp = new RegExp("^".concat(replace, "$"));
        var matches = string.split('?')[0].match(regExp);
        if (matches) {
            var keys = pattern.match(/:[^/]+/g);
            if (keys) {
                var obj_1 = {};
                keys.forEach(function (key, index) {
                    obj_1[key.replace(':', '')] = matches[index + 1].replace(/\?.*$/, '');
                });
                return obj_1;
            }
        }
        return null;
    };
    /**
     * @desc matches a string to a pattern and returns its params if any
     * @param string - the string to match
     * @param pattern - the pattern to match to
     */
    BaseClass.prototype._matchStringToPattern = function (string, pattern) {
        if (BaseClass.isPatternMatchable(pattern))
            return this._matchString(string, pattern);
        var valid = this.compareStringToPattern(string, pattern);
        if (valid)
            return {};
        return null;
    };
    return BaseClass;
}());
exports.BaseClass = BaseClass;
