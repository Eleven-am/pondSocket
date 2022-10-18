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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.html = exports.HtmlSafeString = exports.join = void 0;
var deepDiff_1 = require("./deepDiff");
var getChanged_1 = require("./getChanged");
var ENTITIES = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '/': '&#x2F;', '`': '&#x60;', '=': '&#x3D;'
};
var ENT_REGEX = new RegExp(Object.keys(ENTITIES).join('|'), 'g');
function join(array, separator) {
    if (separator === undefined || separator === null) {
        separator = ',';
    }
    if (array.length <= 0) {
        return new HtmlSafeString([''], []);
    }
    return new HtmlSafeString(__spreadArray(__spreadArray([''], __read(Array(array.length - 1).fill(separator)), false), [''], false), array);
}
exports.join = join;
function escapeHTML(unsafe) {
    if (unsafe === undefined || unsafe === null) {
        return '';
    }
    if (unsafe instanceof HtmlSafeString) {
        return unsafe.toString();
    }
    if (Array.isArray(unsafe)) {
        return join(unsafe, '').toString();
    }
    return String(unsafe).replace(ENT_REGEX, function (char) { return ENTITIES[char]; });
}
var HtmlSafeString = /** @class */ (function () {
    function HtmlSafeString(statics, dynamics) {
        this.statics = statics;
        this.dynamics = dynamics;
    }
    HtmlSafeString.prototype.toString = function () {
        var result = this.statics[0];
        for (var i = 0; i < this.dynamics.length; i++) {
            if (this.dynamics[i] instanceof HtmlSafeString)
                result += this.dynamics[i].toString() + this.statics[i + 1];
            else if (Array.isArray(this.dynamics[i]))
                result += join(this.dynamics[i], '').toString() + this.statics[i + 1];
            else if (typeof this.dynamics[i] === 'object')
                result += this.parsedHtmlToString(this.dynamics[i]) + this.statics[i + 1];
            else
                result += escapeHTML(this.dynamics[i]) + this.statics[i + 1];
        }
        return result;
    };
    HtmlSafeString.prototype.getParts = function () {
        var result = {
            s: this.statics
        };
        for (var i = 0; i < this.dynamics.length; i++)
            if (this.dynamics[i] instanceof HtmlSafeString)
                result[i] = this.dynamics[i].getParts();
            else if (Array.isArray(this.dynamics[i]))
                result[i] = join(this.dynamics[i], '').getParts();
            else if (this.dynamics[i] === undefined)
                result[i] = null;
            else
                result[i] = this.dynamics[i];
        return result;
    };
    HtmlSafeString.prototype.parsedHtmlToString = function (parsed) {
        var _a;
        var data = parsed;
        var result = '';
        if (Array.isArray(data))
            return join(data, '').toString();
        if (((_a = data === null || data === void 0 ? void 0 : data.s) === null || _a === void 0 ? void 0 : _a.length) > 0) {
            var stat = data.s.filter(function (s) { return s !== undefined && s !== null; });
            result = data.s[0];
            for (var i = 0; i < stat.length - 1; i++) {
                if (typeof data[i] === 'object')
                    result += this.parsedHtmlToString(parsed[i]) + data.s[i + 1];
                else
                    result += escapeHTML(parsed[i]) + data.s[i + 1];
            }
        }
        return result;
    };
    HtmlSafeString.prototype.differentiate = function (parsed) {
        var newParsed = parsed.getParts();
        var oldParsed = this.getParts();
        var mapped = (0, deepDiff_1.DeepDiffMapper)(oldParsed, newParsed);
        return (0, getChanged_1.getChanges)(mapped);
    };
    HtmlSafeString.prototype.reconstruct = function (changes) {
        var data = (0, getChanged_1.mergeObjects)(this.getParts(), changes);
        return this.parse(data);
    };
    HtmlSafeString.prototype.parse = function (parts) {
        var data = parts;
        var statics = data.s || [""];
        delete data.s;
        var dynamics = Object.values(data).filter(function (d) { return d !== undefined && d !== null; });
        return new HtmlSafeString(statics, dynamics);
    };
    return HtmlSafeString;
}());
exports.HtmlSafeString = HtmlSafeString;
function html(statics) {
    var dynamics = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        dynamics[_i - 1] = arguments[_i];
    }
    return new HtmlSafeString(statics, dynamics);
}
exports.html = html;
