"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var getChanged_1 = require("./getChanged");
describe('getChanges', function () {
    it('should be able to get only changed properties1', function () {
        var obj = {
            a: {
                type: 'unchanged',
                data: 1,
            }
        };
        var result = (0, getChanged_1.getChanges)(obj);
        expect(result).toEqual({});
    });
    it('should be able to get only changed properties2', function () {
        var obj = {
            0: {
                a: {
                    type: 'updated',
                    data: 2,
                }
            },
            1: {
                type: 'created',
                data: 3,
            }
        };
        var result = (0, getChanged_1.getChanges)(obj);
        expect(result).toEqual({ 0: { a: 2 }, 1: 3 });
    });
    it('should be able to get only changed properties3', function () {
        var obj = {
            3: {
                a: {
                    type: 'created',
                    data: 2,
                },
                b: {
                    type: 'deleted',
                    data: 3,
                },
                c: {
                    type: 'unchanged',
                    data: 4,
                },
                d: {
                    type: 'updated',
                    data: 5,
                }
            }
        };
        var result = (0, getChanged_1.getChanges)(obj);
        expect(result).toEqual({ 3: { a: 2, b: null, d: 5 } });
    });
    it('should be able to get only changed properties4', function () {
        var obj = {
            '0': { type: 'unchanged', data: 'test' },
            '1': { type: 'updated', data: 'Hello World 2' },
            s: {
                '0': { type: 'unchanged', data: '<div class="' },
                '1': { type: 'unchanged', data: '">' },
                '2': { type: 'unchanged', data: '</div>' }
            }
        };
        var result = (0, getChanged_1.getChanges)(obj);
        expect(result).toEqual({ '1': 'Hello World 2' });
    });
});
describe('mergeObjects', function () {
    it('should be able to merge two objects1', function () {
        var obj1 = {
            a: 1,
            b: 2,
            c: 3,
        };
        var obj2 = {
            a: 2,
            d: 4,
        };
        var result = (0, getChanged_1.mergeObjects)(obj1, obj2);
        expect(result).toEqual({
            a: 2,
            b: 2,
            c: 3,
            d: 4,
        });
    });
    it('should be able to merge two objects2', function () {
        var obj1 = {
            a: 1,
            b: {
                c: 2,
                d: 3,
            },
        };
        var obj2 = {
            a: 2,
            b: {
                c: 4,
                e: 5,
            },
        };
        var result = (0, getChanged_1.mergeObjects)(obj1, obj2);
        expect(result).toEqual({
            a: 2,
            b: {
                c: 4,
                d: 3,
                e: 5,
            },
        });
    });
    it('should be able to merge two objects3', function () {
        var obj1 = undefined;
        var obj2 = {
            a: 2,
            b: {
                c: 4,
            }
        };
        var result = (0, getChanged_1.mergeObjects)(obj1, obj2);
        expect(result).toEqual(obj2);
        var result2 = (0, getChanged_1.mergeObjects)(obj2, obj1);
        expect(result2).toEqual(obj2);
    });
    it('should remove null values from original object1', function () {
        var obj1 = {
            a: 1,
            b: 2,
            c: 3,
        };
        var obj2 = {
            a: 2,
            b: null,
        };
        var result = (0, getChanged_1.mergeObjects)(obj1, obj2);
        expect(result).toEqual({
            a: 2,
            c: 3,
        });
    });
    it('should remove null values from original object2', function () {
        var obj1 = {
            a: 1,
            b: {
                c: 2,
                d: 3,
            },
        };
        var obj2 = {
            a: 2,
            b: {
                c: null,
                e: 5,
            },
        };
        var result = (0, getChanged_1.mergeObjects)(obj1, obj2);
        expect(result).toEqual({
            a: 2,
            b: {
                d: 3,
                e: 5,
            },
        });
    });
});
