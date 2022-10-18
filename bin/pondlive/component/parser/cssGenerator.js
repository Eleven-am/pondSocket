"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
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
exports.CssGenerator = void 0;
var parser_1 = require("./parser");
var CssGenerator = function (id) {
    var scopeCss = function (css) {
        return css.replace(/(\.[a-zA-Z]+)/g, "$1-".concat(id));
    };
    var getClasses = function (css) {
        var e_1, _a;
        var classes = new Set();
        css.replace(/\.([a-zA-Z0-9_-]+)/g, function (_, className) {
            classes.add(className);
            return '';
        });
        var result = {};
        try {
            for (var classes_1 = __values(classes), classes_1_1 = classes_1.next(); !classes_1_1.done; classes_1_1 = classes_1.next()) {
                var className = classes_1_1.value;
                result[className] = "".concat(className, "-").concat(id);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (classes_1_1 && !classes_1_1.done && (_a = classes_1.return)) _a.call(classes_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return result;
    };
    function css(statics) {
        var dynamics = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            dynamics[_i - 1] = arguments[_i];
        }
        var oldCSS = parser_1.html.apply(void 0, __spreadArray([statics], __read(dynamics), false)).toString();
        var newStatics = statics.map(function (css) { return scopeCss(css); });
        var temp = (0, parser_1.html)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["<style>", "</style>"], ["<style>", "</style>"])), new parser_1.HtmlSafeString(newStatics, dynamics));
        return {
            string: temp,
            classes: getClasses(oldCSS.toString())
        };
    }
    return css;
};
exports.CssGenerator = CssGenerator;
var templateObject_1;
