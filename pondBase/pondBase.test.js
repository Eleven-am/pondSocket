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
var pondBase_1 = require("./pondBase");
var enums_1 = require("./enums");
describe('PondBase', function () {
    it('should be able to take in a subscriber', function () {
        var base = new pondBase_1.PondBase();
        expect(base['_broadcast']['_subscribers'].size).toBe(0);
        var mockSubscriber = jest.fn();
        base.subscribe(mockSubscriber);
        expect(base['_broadcast']['_subscribers'].size).toBe(1);
    });
    it('should be able to remove a subscriber', function () {
        var base = new pondBase_1.PondBase();
        expect(base['_broadcast']['_subscribers'].size).toBe(0);
        var mockSubscriber = jest.fn();
        var subscription = base.subscribe(mockSubscriber);
        expect(base['_broadcast']['_subscribers'].size).toBe(1);
        subscription.unsubscribe();
        expect(base['_broadcast']['_subscribers'].size).toBe(0);
    });
    it('should fire the subscriber when a document is added', function () {
        var base = new pondBase_1.PondBase();
        var mockSubscriber = jest.fn();
        base.subscribe(mockSubscriber);
        base.set('test', { name: 'test' });
        expect(mockSubscriber).toBeCalled();
        expect(mockSubscriber).toBeCalledWith([{ name: "test" }], { name: "test" }, enums_1.PondBaseActions.ADD_TO_POND);
    });
    it('should fire the subscriber when a document is removed', function () {
        var base = new pondBase_1.PondBase();
        var mockSubscriber = jest.fn();
        base.subscribe(mockSubscriber);
        var data = base.set('test', { name: 'test' });
        expect(mockSubscriber).toBeCalledWith([{ name: "test" }], { name: "test" }, enums_1.PondBaseActions.ADD_TO_POND);
        mockSubscriber.mockClear();
        data.removeDoc();
        expect(mockSubscriber).toBeCalledWith([], { name: "test" }, enums_1.PondBaseActions.REMOVE_FROM_POND);
    });
    it('should fire the subscriber when a document is updated', function () {
        var base = new pondBase_1.PondBase();
        var mockSubscriber = jest.fn();
        base.subscribe(mockSubscriber);
        var data = base.set('test', { name: 'test' });
        expect(mockSubscriber).toBeCalledWith([{ name: "test" }], { name: "test" }, enums_1.PondBaseActions.ADD_TO_POND);
        mockSubscriber.mockClear();
        data.updateDoc({ name: 'test2' });
        expect(mockSubscriber).toBeCalledWith([{ name: "test2" }], { name: "test2" }, enums_1.PondBaseActions.UPDATE_IN_POND);
    });
    it('should add a document to the database', function () {
        var _a, _b;
        var base = new pondBase_1.PondBase();
        var data = base.addDoc({ name: 'test' });
        expect(data.id).toBeDefined();
        expect((_a = base.get(data.id)) === null || _a === void 0 ? void 0 : _a.doc).toEqual(data.doc);
        expect((_b = base.get(data.id)) === null || _b === void 0 ? void 0 : _b.doc).toEqual({ name: 'test' });
    });
    it('should left join with another pond', function () {
        var owners = new pondBase_1.PondBase();
        var pets = new pondBase_1.PondBase();
        owners.addDoc({ name: 'test', age: 10 });
        owners.set('test2', { name: 'test2', age: 12 });
        pets.addDoc({ name: 'test', owner: 'test' });
        pets.addDoc({ name: 'test2', owner: 'test2' });
        pets.set('test3', { name: 'test3', owner: 'test3' });
        var joined = pets.leftJoin(owners, 'owner', 'name');
        expect(__spreadArray([], __read(joined), false).map(function (_a) {
            var doc = _a.doc;
            return doc;
        })).toEqual([
            { name: 'test', owner: { name: 'test', age: 10 } },
            { name: 'test2', owner: { name: 'test2', age: 12 } },
            { name: 'test3', owner: null }
        ]);
    });
    it('should be able to get the keys', function () {
        var base = new pondBase_1.PondBase();
        base.set('test', { name: 'test' });
        base.set('test2', { name: 'test2' });
        expect(base.keys).toEqual(['test', 'test2']);
    });
    it('should be able to get the values', function () {
        var base = new pondBase_1.PondBase();
        base.addDoc({ name: 'test' });
        base.set('test2', { name: 'test2' });
        expect(base.values).toEqual([{ name: 'test' }, { name: 'test2' }]);
    });
    it('should be able to upsert a document', function () {
        var _a, _b;
        var base = new pondBase_1.PondBase();
        base.upsert('test', { name: 'test' });
        expect((_a = base.get('test')) === null || _a === void 0 ? void 0 : _a.doc).toEqual({ name: 'test' });
        base.upsert('test', { name: 'test2' });
        expect((_b = base.get('test')) === null || _b === void 0 ? void 0 : _b.doc).toEqual({ name: 'test2' });
    });
    it('should be able to getOrCreate a document with a function', function () {
        var _a, _b;
        var base = new pondBase_1.PondBase();
        base.getOrCreate('test', function () { return ({ name: 'test' }); });
        expect((_a = base.get('test')) === null || _a === void 0 ? void 0 : _a.doc).toEqual({ name: 'test' });
        base.getOrCreate('test', function () { return ({ name: 'test2' }); });
        expect((_b = base.get('test')) === null || _b === void 0 ? void 0 : _b.doc).toEqual({ name: 'test' });
    });
});
