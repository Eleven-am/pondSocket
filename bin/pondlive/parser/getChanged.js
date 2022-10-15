"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeObjects = exports.getChanges = void 0;
var getChanges = function (diffedObject) {
    var changed = {};
    for (var key in diffedObject) {
        if (diffedObject[key] === undefined || diffedObject[key] === null)
            continue;
        else if (diffedObject[key].type === "created" || diffedObject[key].type === "updated")
            changed[key] = diffedObject[key].data;
        else if (diffedObject[key].type === "deleted")
            changed[key] = null;
        else if (typeof diffedObject[key] === "object") {
            var data = (0, exports.getChanges)(diffedObject[key]);
            if (data && Object.keys(data).length > 0)
                changed[key] = data;
        }
    }
    return changed;
};
exports.getChanges = getChanges;
var mergeObjects = function (obj1, obj2) {
    if (obj1 === undefined)
        return obj2;
    if (obj2 === undefined)
        return obj1;
    for (var key in obj2) {
        if (obj2[key] instanceof Object)
            obj1[key] = (0, exports.mergeObjects)(obj1[key], obj2[key]);
        else if (obj2[key] === null)
            delete obj1[key];
        else
            obj1[key] = obj2[key];
    }
    if (obj1 instanceof Array)
        return obj1.filter(function (item) { return item !== undefined && item !== null; });
    return obj1;
};
exports.mergeObjects = mergeObjects;
