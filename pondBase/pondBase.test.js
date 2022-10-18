"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var pondBase_1 = require("./pondBase");
var enums_1 = require("./enums");
var basePromise_1 = require("./basePromise");
describe('PondBase', function () {
    it('should be defined', function () {
        expect(pondBase_1.PondBase).toBeDefined();
    });
    it('should be a class', function () {
        expect(pondBase_1.PondBase).toBeInstanceOf(Function);
    });
    it('should have a set method', function () {
        expect(new pondBase_1.PondBase().set).toBeDefined();
    });
    it('should have a get method', function () {
        expect(new pondBase_1.PondBase().get).toBeDefined();
    });
    it('should have a generate method', function () {
        expect(new pondBase_1.PondBase().generate).toBeDefined();
    });
    it('should have a query method', function () {
        expect(new pondBase_1.PondBase().query).toBeDefined();
    });
    it('should have a subscribe method', function () {
        expect(new pondBase_1.PondBase().subscribe).toBeDefined();
    });
    it('should have a size getter', function () {
        expect(new pondBase_1.PondBase().size).toBeDefined();
    });
    // Functionality tests
    it('should set and get a value', function () {
        var _a, _b;
        var pond = new pondBase_1.PondBase();
        var doc = pond.set('bar'); // one value set
        expect((_a = pond.get(doc.id)) === null || _a === void 0 ? void 0 : _a.doc).toBe('bar');
        expect((_b = pond.get(doc.id)) === null || _b === void 0 ? void 0 : _b.doc).toEqual(doc.doc);
        expect(pond.size).toBe(1);
        doc.removeDoc(); // the value removed from the pond
        expect(pond.size).toBe(0);
        expect(pond.get(doc.id)).toBeNull();
    });
    it('should set and get a value', function () {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        var pond = new pondBase_1.PondBase();
        var doc = pond.set('bar'); // multiple value set
        var doc2 = pond.set('foo');
        var doc3 = pond.set('baz');
        expect((_a = pond.get(doc.id)) === null || _a === void 0 ? void 0 : _a.doc).toBe('bar');
        expect((_b = pond.get(doc.id)) === null || _b === void 0 ? void 0 : _b.doc).toEqual(doc.doc);
        expect((_c = pond.get(doc2.id)) === null || _c === void 0 ? void 0 : _c.doc).toBe('foo');
        expect((_d = pond.get(doc2.id)) === null || _d === void 0 ? void 0 : _d.doc).toEqual(doc2.doc);
        expect((_e = pond.get(doc3.id)) === null || _e === void 0 ? void 0 : _e.doc).toBe('baz');
        expect((_f = pond.get(doc3.id)) === null || _f === void 0 ? void 0 : _f.doc).toEqual(doc3.doc);
        expect(pond.size).toBe(3);
        doc.removeDoc(); // the value removed from the pond
        expect(pond.size).toBe(2);
        expect(pond.get(doc.id)).toBeNull();
        expect((_g = pond.get(doc2.id)) === null || _g === void 0 ? void 0 : _g.doc).toBe('foo');
        expect((_h = pond.get(doc3.id)) === null || _h === void 0 ? void 0 : _h.doc).toBe('baz');
    });
    it('should call a subscriber when a value is set', function () {
        var pond = new pondBase_1.PondBase();
        var mock = jest.fn();
        pond.subscribe(mock);
        pond.set('bar');
        expect(mock).toBeCalled();
    });
    it('should return an array of matching values when queried', function () {
        var pond = new pondBase_1.PondBase();
        var one = pond.set('bar');
        var two = pond.set('barman');
        pond.set('dog');
        pond.set('chips');
        // because the docs include functions we need to use JSON.stringify to compare the values
        expect(JSON.stringify(pond.query(function (doc) { return doc.startsWith('bar'); })))
            .toStrictEqual(JSON.stringify([one, two]));
    });
    it('should yield a new value when generate is called', function () {
        var pond = new pondBase_1.PondBase();
        pond.set(1);
        pond.set(2);
        pond.set(3);
        pond.set(4);
        expect(pond.generate().next().value).toEqual(1);
    });
    it('should return null if a value is not found', function () {
        var pond = new pondBase_1.PondBase();
        expect(pond.get('foo')).toBe(null);
    });
    it('should return an array of all the values in the pond', function () {
        var pond = new pondBase_1.PondBase();
        pond.set('bar');
        pond.set('barman');
        pond.set('dog');
        pond.set('chips');
        expect(pond.toArray().map(function (a) { return a.doc; })).toEqual(['bar', 'barman', 'dog', 'chips']);
    });
    it('should return the accurate size of the pond', function () {
        var pond = new pondBase_1.PondBase();
        expect(pond.size).toBe(0);
        pond.set('bar');
        pond.set('barman');
        expect(pond.size).toBe(2);
        pond.set('dog');
        pond.set('chips');
        expect(pond.size).toEqual(4);
    });
    it('should allow subscriptions to the pond that return a function to unsubscribe', function () {
        var pond = new pondBase_1.PondBase();
        var mock = jest.fn();
        var sub = pond.subscribe(mock);
        pond.set('bar');
        expect(mock).toBeCalled();
        sub.unsubscribe();
        pond.set('baz');
        expect(mock).toBeCalledTimes(1);
    });
    it('should allow subscriptions to the pond that return a function to unsubscribe 2', function (done) {
        var pond = new pondBase_1.PondBase();
        pond.set('bar');
        pond.set('chips');
        function subscriber(data, data2, action) {
            try {
                expect(data).toEqual(["bar", "chips", "dog"]);
                expect(data2).toEqual('dog');
                expect(action).toEqual(enums_1.PondBaseActions.ADD_TO_POND);
                done();
            }
            catch (error) {
                done(error);
            }
        }
        pond.subscribe(subscriber);
        pond.set('dog');
    });
    it('should allow subscriptions to the pond that return a function to unsubscribe 3', function (done) {
        var pond = new pondBase_1.PondBase();
        var baseUnset = pond.set('bar');
        pond.set('chips');
        function subscriber(data, data2, action) {
            try {
                expect(data).toEqual(["chips"]);
                expect(data2).toEqual(null);
                expect(action).toEqual(enums_1.PondBaseActions.REMOVE_FROM_POND);
                done();
            }
            catch (error) {
                done(error);
            }
        }
        pond.subscribe(subscriber);
        baseUnset.removeDoc();
    });
    it('should allow subscriptions to the pond that return a function to unsubscribe 4', function (done) {
        var pond = new pondBase_1.PondBase();
        pond.set('bar');
        var val = pond.set('chips');
        function subscriber(data, data2, action) {
            try {
                expect(data).toEqual(["bar", "dog"]);
                expect(data2).toEqual('dog');
                expect(action).toEqual(enums_1.PondBaseActions.UPDATE_IN_POND);
                done();
            }
            catch (error) {
                done(error);
            }
        }
        pond.subscribe(subscriber);
        val.updateDoc('dog');
    });
    it('should clear all data from the pond', function () {
        var pond = new pondBase_1.PondBase();
        pond.set('bar');
        pond.set('chips');
        pond.clear();
        expect(pond.size).toBe(0);
    });
    it('should map the pond to a new array of values', function () {
        var pond = new pondBase_1.PondBase();
        pond.set('bar');
        pond.set('chips');
        pond.set('dog');
        var mapped = pond.map(function (doc) { return doc.toUpperCase(); });
        expect(mapped).toEqual(['BAR', 'CHIPS', 'DOG']);
    });
    it('should be able to find a value in the pond', function () {
        var pond = new pondBase_1.PondBase();
        pond.set('bar');
        pond.set('chips');
        pond.set('dog');
        var found = pond.find(function (doc) { return doc.startsWith('c'); });
        expect(found === null || found === void 0 ? void 0 : found.doc).toEqual('chips');
        var notFound = pond.find(function (doc) { return doc.startsWith('z'); });
        expect(notFound).toBeNull();
    });
    it('should be able to query the pond for values by their keys', function () {
        var pond = new pondBase_1.PondBase();
        pond.set('bar');
        var val = pond.set('chips');
        pond.set('dog');
        var found = pond.queryByKeys([val.id]);
        expect(JSON.stringify(found)).toEqual(JSON.stringify([val]));
    });
    it('should be able to create a document in the pond', function () {
        var pond = new pondBase_1.PondBase();
        var docId = '';
        var doc = pond.createDocument(function (doc1) {
            docId = doc1.id;
            return 'bar';
        });
        expect(doc.doc).toEqual('bar');
        expect(doc.id).toEqual(docId);
        var doc2 = pond.createDocument(function (_doc1) {
            return 'bar';
        });
        expect(doc2.id).not.toEqual(docId);
        expect(doc2.doc).toEqual('bar');
        expect(pond.size).toEqual(2);
        doc2.removeDoc();
        expect(pond.size).toEqual(1);
        expect(pond.get(doc2.id)).toBeNull();
    });
    it('should update a document in the pond', function () {
        var _a, _b, _c;
        var pond = new pondBase_1.PondBase();
        var temp = pond.set('temp');
        var chips = pond.set('chips');
        pond.set('dog');
        var doc = pond.createDocument(function (_doc1) {
            return 'bar';
        });
        doc.updateDoc('baz');
        chips.updateDoc('chips2');
        pond.update(temp.id, 'temp2');
        expect((_a = pond.get(doc.id)) === null || _a === void 0 ? void 0 : _a.doc).toEqual('baz');
        expect((_b = pond.get(chips.id)) === null || _b === void 0 ? void 0 : _b.doc).toEqual('chips2');
        expect((_c = pond.get(temp.id)) === null || _c === void 0 ? void 0 : _c.doc).toEqual('temp2');
        expect(function () { return pond.update('not-a-real-id', 'temp2'); }).toThrowError(basePromise_1.PondError);
    });
    it('should be capable of merging one pond base into another', function () {
        var pond1 = new pondBase_1.PondBase();
        pond1.set('bar');
        pond1.set('chips');
        pond1.set('dog');
        var pond2 = new pondBase_1.PondBase();
        pond2.set('bar');
        pond2.set('chips');
        pond2.set('dog');
        pond1.merge(pond2);
        expect(pond1.size).toEqual(6);
        expect(pond2.size).toEqual(3);
        expect(pond1.toArray().map(function (c) { return c.doc; })).toEqual(['bar', 'chips', 'dog', 'bar', 'chips', 'dog']);
    });
    it('should be capable of querying the data by id', function () {
        var _a;
        var pond = new pondBase_1.PondBase();
        pond.set('bar');
        var doc = pond.set('chips');
        pond.set('dog');
        expect((_a = pond.get(doc.id)) === null || _a === void 0 ? void 0 : _a.doc).toEqual('chips');
        expect(pond.get('not-a-real-id')).toBeNull();
        // Used JSON.stringify to compare the arrays because the order of the array is not guaranteed
        // Also each doc contains bound functions that could be different
        expect(JSON.parse(JSON.stringify(pond.queryById(function (c) { return c === doc.id; })))).toStrictEqual(JSON.parse(JSON.stringify([doc])));
        expect(pond.queryById(function (c) { return c === 'not-a-real-id'; })).toEqual([]);
    });
    it('should be able to reduce the pond to a single value', function () {
        var pond = new pondBase_1.PondBase();
        pond.set('bar');
        pond.set('chips');
        pond.set('dog');
        var reduced = pond.reduce(function (acc, doc) { return acc + doc; }, '');
        expect(reduced).toEqual('barchipsdog');
    });
});
