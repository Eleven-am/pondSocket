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
var buffer_1 = require("buffer");
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
     * @desc creates an uuid v4 string
     */
    BaseClass.prototype.uuid = function () {
        var dt = new Date().getTime();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (dt + Math.random() * 16) % 16 | 0;
            dt = Math.floor(dt / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    };
    /**
     * @desc Generates an 8 character long random string
     */
    BaseClass.prototype.nanoId = function () {
        var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return Array.from({ length: 8 })
            .map(function () { return chars.charAt(Math.floor(Math.random() * chars.length)); })
            .join('');
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
     * @desc Matches a string to a pattern
     * @param path - the path to match
     * @param address - the address to match
     */
    BaseClass.prototype.getLiveRequest = function (path, address) {
        var match = this._matchPartialPattern(address, path);
        if (match)
            return {
                params: match.params, query: this._parseQueries(address), nextPath: match.rest, address: address
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
     * @desc decodes a string using it's secret key
     * @param salt - the secret key
     * @param encoded - the encoded string
     */
    BaseClass.prototype.decrypt = function (salt, encoded) {
        var textToChars = function (text) { return text.split("").map(function (c) { return c.charCodeAt(0); }); };
        var applySaltToChar = function (code) { return textToChars(salt).reduce(function (a, b) { return a ^ b; }, code); };
        try {
            var response = JSON.parse((buffer_1.Buffer.from(encoded, 'base64').toString()
                .match(/.{1,2}/g))
                .map(function (hex) { return parseInt(hex, 16); })
                .map(applySaltToChar)
                .map(function (charCode) { return String.fromCharCode(charCode); })
                .join(""));
            return response;
        }
        catch (e) {
            return null;
        }
    };
    /**
     * @desc encodes an object using into a string using it's secret key
     * @param salt - the secret key
     * @param text - the object to encode
     */
    BaseClass.prototype.encrypt = function (salt, text) {
        var textToChars = function (text) { return text.split("").map(function (c) { return c.charCodeAt(0); }); };
        var byteHex = function (n) { return ("0" + Number(n).toString(16)).substr(-2); };
        var applySaltToChar = function (code) { return textToChars(salt).reduce(function (a, b) { return a ^ b; }, code); };
        var token = JSON.stringify(text)
            .split("")
            .map(textToChars)
            .map(applySaltToChar)
            .map(byteHex)
            .join("");
        return buffer_1.Buffer.from(token).toString('base64');
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
        var replace = pattern.replace(/:[^\/]+/g, '([^\/]+)');
        var regExp = new RegExp("^".concat(replace, "$"));
        var matches = string.split('?')[0].match(regExp);
        if (matches) {
            var keys = pattern.match(/:[^\/]+/g);
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
     * @desc Returns the {key: value} matches of a string
     * @param string - the string to create the regex from
     * @param pattern - the pattern to match
     *
     * @example
     * /:id should match /123 and return { id: 123, rest: '' }
     * /:id should match /123/abc and return { id: 123, rest: /abc }
     * /:id/:name should match /123/abc and return { id: 123, name: abc, rest: '' }
     * /:id/:name should match /123/abc/def and return { id: 123, name: abc, rest: /def }
     * /name/:id should match /name/123 and return { id: 123, rest: '' }
     * /name should match /name/123 and return { rest: /123 }
     * @private
     */
    BaseClass.prototype._matchPartialPattern = function (string, pattern) {
        if (BaseClass.isPatternMatchable(pattern)) {
            var regex = new RegExp(pattern.replace(/:[^\/]+/g, '([^\/?]+)'));
            var matches_1 = string.match(regex);
            if (matches_1) {
                var keys = pattern.match(/:[^\/]+/g);
                if (keys) {
                    var obj_2 = {};
                    keys.forEach(function (key, index) {
                        obj_2[key.replace(':', '')] = matches_1[index + 1].replace(/\?.*$/, '');
                    });
                    return {
                        params: obj_2, rest: string.replace(matches_1[0], '')
                    };
                }
            }
        }
        var valid = this.compareStringToPattern(string, pattern);
        if (valid)
            return { params: {}, rest: '' };
        if (string.startsWith(pattern)) {
            return { params: {}, rest: string.replace(pattern, '') };
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
