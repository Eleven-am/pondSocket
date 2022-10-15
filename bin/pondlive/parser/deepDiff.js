"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeepDiffMapper = void 0;
var DeepDiffMapper = function (obj1, obj2) {
    var isFunction = function (x) {
        return Object.prototype.toString.call(x) === '[object Function]';
    };
    var isArray = function (x) {
        return Object.prototype.toString.call(x) === '[object Array]';
    };
    var isDate = function (x) {
        return Object.prototype.toString.call(x) === '[object Date]';
    };
    var isObject = function (x) {
        return Object.prototype.toString.call(x) === '[object Object]';
    };
    var isValue = function (x) {
        return !isObject(x) && !isArray(x);
    };
    var compareValues = function (value1, value2) {
        if (value1 === value2) {
            return 'unchanged';
        }
        if (isDate(value1) && isDate(value2) && value1.getTime() === value2.getTime()) {
            return 'unchanged';
        }
        if (value1 === undefined) {
            return 'created';
        }
        if (value2 === undefined) {
            return 'deleted';
        }
        return 'updated';
    };
    var map = function (obj1, obj2) {
        if (isFunction(obj1) || isFunction(obj2)) {
            throw 'Invalid argument. Function given, object expected.';
        }
        if (isValue(obj1) || isValue(obj2)) {
            var newType = compareValues(obj1, obj2);
            if (newType === 'updated') {
                return {
                    type: newType,
                    data: obj2,
                };
            }
            return {
                type: newType,
                data: obj1 === undefined ? obj2 : obj1
            };
        }
        var diff = {};
        for (var key in obj1) {
            if (isFunction(obj1[key])) {
                continue;
            }
            var value2 = undefined;
            if (obj2[key] !== undefined) {
                value2 = obj2[key];
            }
            diff[key] = map(obj1[key], value2);
        }
        for (var key in obj2) {
            if (isFunction(obj2[key]) || diff[key] !== undefined) {
                continue;
            }
            diff[key] = map(undefined, obj2[key]);
        }
        return diff;
    };
    return map(obj1, obj2);
};
exports.DeepDiffMapper = DeepDiffMapper;
