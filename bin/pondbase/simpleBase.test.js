"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var simpleBase_1 = require("./simpleBase");
var enums_1 = require("./enums");
describe('SimpleBase', function () {
    it('should create a new database', function () {
        var db = new simpleBase_1.SimpleBase();
        expect(db.size).toBe(0);
    });
    it('should get a document', function () {
        var _a;
        var db = new simpleBase_1.SimpleBase();
        var doc = db.set('test', { test: 1 });
        expect((_a = db.get('test')) === null || _a === void 0 ? void 0 : _a.doc).toEqual(doc.doc);
    });
    it('should get a document with a default value', function () {
        var _a;
        var db = new simpleBase_1.SimpleBase();
        var doc = db.getOrCreate('test', function () { return ({ test: 1 }); });
        expect((_a = db.get('test')) === null || _a === void 0 ? void 0 : _a.doc).toEqual(doc === null || doc === void 0 ? void 0 : doc.doc);
    });
    it('should get a document with a default value', function () {
        var _a;
        var db = new simpleBase_1.SimpleBase();
        db.set('test', { test: 1 });
        var doc = db.getOrCreate('test', function () { return ({ test: 1 }); });
        expect((_a = db.get('test')) === null || _a === void 0 ? void 0 : _a.doc).toBe(doc === null || doc === void 0 ? void 0 : doc.doc);
    });
    it('should merge two databases', function () {
        var db1 = new simpleBase_1.SimpleBase();
        var db2 = new simpleBase_1.SimpleBase();
        db1.set('test', { test: 1 });
        db2.set('test2', { test: 2 });
        db1.merge(db2);
        expect(db1.size).toBe(2);
    });
    it('should generate all documents', function () {
        var db = new simpleBase_1.SimpleBase();
        db.set('test', { test: 1 });
        db.set('test2', { test: 2 });
        var docs = db.generate();
        expect(docs.next().value).toEqual({ test: 1 });
        expect(docs.next().value).toEqual({ test: 2 });
    });
    it('should be able to find a document', function () {
        var db = new simpleBase_1.SimpleBase();
        db.set('test', { test: 1 });
        db.set('test2', { test: 2 });
        var doc = db.find(function (doc) { return doc.test === 1; });
        expect(doc === null || doc === void 0 ? void 0 : doc.doc).toEqual({ test: 1 });
        var noDoc = db.find(function (doc) { return doc.test === 3; });
        expect(noDoc).toBeNull();
    });
    it('should be able to query documents', function () {
        var _a;
        var db = new simpleBase_1.SimpleBase();
        db.set('test', { test: 1 });
        db.set('test2', { test: 2 });
        var docs = db.query(function (doc) { return doc.test === 1; });
        expect((_a = docs[0]) === null || _a === void 0 ? void 0 : _a.doc).toEqual({ test: 1 });
    });
    it('should be able to reduce documents to a single output', function () {
        var db = new simpleBase_1.SimpleBase();
        db.set('test', { test: 1 });
        db.set('test2', { test: 2 });
        var result = db.reduce(function (prev, doc) { return prev + doc.test; }, 0);
        expect(result).toBe(3);
    });
    it('should be able to map documents to a new output', function () {
        var db = new simpleBase_1.SimpleBase();
        db.set('test', { test: 1 });
        db.set('test2', { test: 2 });
        var result = db.map(function (doc) { return doc.test; });
        expect(result).toEqual([1, 2]);
    });
    it('should be able convert documents to array', function () {
        var db = new simpleBase_1.SimpleBase();
        db.set('test', { test: 1 });
        db.set('test2', { test: 2 });
        var result = db.toArray().map(function (doc) { return doc.doc; });
        expect(result).toEqual([{ test: 1 }, { test: 2 }]);
    });
    it('should be able to delete a document', function () {
        var db = new simpleBase_1.SimpleBase();
        var doc = db.set('test', { test: 1 });
        doc.removeDoc();
        expect(db.size).toBe(0);
    });
    it('should be able to clear the database', function () {
        var db = new simpleBase_1.SimpleBase();
        db.set('test', { test: 1 });
        db.set('test2', { test: 2 });
        db.clear();
        expect(db.size).toBe(0);
    });
    it('should be able to join databases on a key', function () {
        var db1 = new simpleBase_1.SimpleBase();
        var db2 = new simpleBase_1.SimpleBase();
        db1.set('test', { test: 1 });
        db2.set('test', { value: 1 });
        db1.set('test2', { test: 2 });
        db2.set('test2', { value: 2 });
        db1.set('test3', { test: 3 });
        db2.set('test3', { value: 3 });
        var joinedDocs = db1.join(db2, "test", "value");
        expect(joinedDocs[0]).toEqual({ test: 1, value: 1 });
        expect(joinedDocs[1]).toEqual({ test: 2, value: 2 });
        expect(joinedDocs[2]).toEqual({ test: 3, value: 3 });
    });
    it('should allow subscriptions to the pond that return a function to unsubscribe', function () {
        var pond = new simpleBase_1.SimpleBase();
        var mock = jest.fn();
        var sub = pond.subscribe(mock);
        pond.set('bar', 'RFJPOERFJEPROJP');
        expect(mock).toBeCalled();
        sub.unsubscribe();
        pond.set('baz', 'RFJPOERFJEPROJP');
        expect(mock).toBeCalledTimes(1);
    });
    it('should allow subscriptions to the pond that return a function to unsubscribe 2', function (done) {
        var pond = new simpleBase_1.SimpleBase();
        pond.set('eufhuwoefhowiufh', 'bar');
        pond.set('eufhuwohowiufh', 'chips');
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
        pond.set('eufhhowiufh', 'dog');
    });
    it('should allow subscriptions to the pond that return a function to unsubscribe 3', function (done) {
        var pond = new simpleBase_1.SimpleBase();
        var baseUnset = pond.set('1', 'bar');
        pond.set('2', 'chips');
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
        var pond = new simpleBase_1.SimpleBase();
        pond.set('ww', 'bar');
        var val = pond.set('w2w', 'chips');
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
});
