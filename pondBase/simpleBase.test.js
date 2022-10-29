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
Object.defineProperty(exports, "__esModule", { value: true });
var simpleBase_1 = require("./simpleBase");
describe('SimpleBase', function () {
    it('should ba instantiated', function () {
        var base = new simpleBase_1.SimpleBase();
        expect(base).toBeTruthy();
    });
    it('should set a value', function () {
        var base = new simpleBase_1.SimpleBase();
        base.set('test', { name: 'test' });
        expect(base.size).toBe(1);
    });
    it('should get a value', function () {
        var _a;
        var base = new simpleBase_1.SimpleBase();
        base.set('test', { name: 'test' });
        expect((_a = base.get('test')) === null || _a === void 0 ? void 0 : _a.doc).toStrictEqual({ name: 'test' });
    });
    it('should upsert a value', function () {
        var _a, _b;
        var base = new simpleBase_1.SimpleBase();
        expect((_a = base.get('test')) === null || _a === void 0 ? void 0 : _a.doc).toBeUndefined();
        expect(base.size).toBe(0);
        base.getOrCreate('test', function () { return ({ name: 'test' }); });
        expect(base.size).toBe(1);
        expect((_b = base.get('test')) === null || _b === void 0 ? void 0 : _b.doc).toStrictEqual({ name: 'test' });
    });
    it('should tell if a document exists', function () {
        var base = new simpleBase_1.SimpleBase();
        expect(base.has('test')).toBe(false);
        base.set('test', { name: 'test' });
        expect(base.has('test')).toBe(true);
    });
    it('should return an array of filtered documents', function () {
        var base = new simpleBase_1.SimpleBase();
        base.set('test', { name: 'test' });
        base.set('test2', { name: 'test2' });
        base.set('test3', { name: 'test3' });
        expect(base.filter(function (doc) { return doc.name === 'test'; }).map(function (doc) { return doc.doc.name; })).toEqual(['test']);
    });
    it('should return an array of mapped documents', function () {
        var base = new simpleBase_1.SimpleBase();
        base.set('test', { name: 'test' });
        base.set('test2', { name: 'test2' });
        base.set('test3', { name: 'test3' });
        expect(base.map(function (doc) { return doc.name; })).toEqual(['test', 'test2', 'test3']);
    });
    it('should return an empty array of  documents', function () {
        var base = new simpleBase_1.SimpleBase();
        expect(base.map(function (doc) { return doc.name; })).toEqual([]);
        expect(base.filter(function (doc) { return doc.name === 'test'; }).map(function (doc) { return doc.doc.name; })).toEqual([]);
    });
    it('should return a document by a query function', function () {
        var _a;
        var base = new simpleBase_1.SimpleBase();
        base.set('test', { name: 'test' });
        base.set('test2', { name: 'test2' });
        base.set('test3', { name: 'test3' });
        expect((_a = base.find(function (doc) { return doc.name === 'test2'; })) === null || _a === void 0 ? void 0 : _a.doc.name).toBe('test2');
    });
    it('should return null if no document is found by a query function', function () {
        var base = new simpleBase_1.SimpleBase();
        base.set('test', { name: 'test' });
        base.set('test2', { name: 'test2' });
        base.set('test3', { name: 'test3' });
        expect(base.find(function (doc) { return doc.name === 'test4'; })).toBeNull();
    });
    it('should reduce the pond to a single value', function () {
        var base = new simpleBase_1.SimpleBase();
        base.set('test', { name: 'test' });
        base.set('test2', { name: 'test2' });
        base.set('test3', { name: 'test3' });
        expect(base.reduce(function (acc, doc) { return acc + doc.name; }, '')).toBe('testtest2test3');
    });
    it('should return the size of the pond', function () {
        var base = new simpleBase_1.SimpleBase();
        base.set('test', { name: 'test' });
        base.set('test2', { name: 'test2' });
        base.set('test3', { name: 'test3' });
        expect(base.size).toBe(3);
    });
    it('should provide an empty document', function () {
        var base = new simpleBase_1.SimpleBase();
        var test = base.createGenericDocument();
        expect(test).toBeInstanceOf(simpleBase_1.PondDocument);
        expect(test.doc).toBeNull();
    });
    it('should provide a document with a value', function () {
        var base = new simpleBase_1.SimpleBase();
        var test = base.createGenericDocument('test');
        expect(base.size).toBe(0);
        expect(test).toBeInstanceOf(simpleBase_1.PondDocument);
        expect(test.id).toBe('test');
    });
    it('should be iterable', function () {
        var base = new simpleBase_1.SimpleBase();
        base.set('test', { name: 'test' });
        base.set('test2', { name: 'test2' });
        base.set('test3', { name: 'test3' });
        expect(__spreadArray([], __read(base), false).map(function (doc) { return doc.doc.name; })).toEqual(['test', 'test2', 'test3']);
    });
    it('should be iterable with a for of loop', function () {
        var e_1, _a;
        var base = new simpleBase_1.SimpleBase();
        base.set('test', { name: 'test' });
        base.set('test2', { name: 'test2' });
        base.set('test3', { name: 'test3' });
        var docs = [];
        try {
            for (var base_1 = __values(base), base_1_1 = base_1.next(); !base_1_1.done; base_1_1 = base_1.next()) {
                var doc = base_1_1.value;
                docs.push(doc.doc.name);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (base_1_1 && !base_1_1.done && (_a = base_1.return)) _a.call(base_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        expect(docs).toEqual(['test', 'test2', 'test3']);
    });
    it('should be have a generator', function () {
        var e_2, _a;
        var base = new simpleBase_1.SimpleBase();
        base.set('test', { name: 'test' });
        base.set('test2', { name: 'test2' });
        base.set('test3', { name: 'test3' });
        var docs = [];
        try {
            for (var _b = __values(base.generator()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var doc = _c.value;
                docs.push(doc.doc.name);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        expect(docs).toEqual(['test', 'test2', 'test3']);
    });
});
describe('PondDocument', function () {
    it('should be able to set a value', function () {
        var _a;
        var base = new simpleBase_1.SimpleBase();
        var test = base.createGenericDocument('test');
        test.updateDoc({ name: 'test' });
        expect((_a = base.get('test')) === null || _a === void 0 ? void 0 : _a.doc).toStrictEqual({ name: 'test' });
    });
    it('should be able to get a value', function () {
        var base = new simpleBase_1.SimpleBase();
        var test = base.createGenericDocument('test');
        test.updateDoc({ name: 'test' });
        expect(test.doc).toStrictEqual({ name: 'test' });
    });
    it('should be able to delete a value', function () {
        var base = new simpleBase_1.SimpleBase();
        var test = base.createGenericDocument('test');
        test.updateDoc({ name: 'test' });
        expect(base.size).toBe(1);
        test.removeDoc();
        expect(base.size).toBe(0);
    });
    it('should be able to get the id', function () {
        var base = new simpleBase_1.SimpleBase();
        var test = base.createGenericDocument('test');
        expect(test.id).toBe('test');
    });
});
