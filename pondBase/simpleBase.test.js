"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const simpleBase_1 = require("./simpleBase");
describe('SimpleBase', () => {
    it('should ba instantiated', () => {
        const base = new simpleBase_1.SimpleBase();
        expect(base).toBeTruthy();
    });
    it('should set a value', () => {
        const base = new simpleBase_1.SimpleBase();
        base.set('test', { name: 'test' });
        expect(base.size).toBe(1);
    });
    it('should get a value', () => {
        var _a;
        const base = new simpleBase_1.SimpleBase();
        base.set('test', { name: 'test' });
        expect((_a = base.get('test')) === null || _a === void 0 ? void 0 : _a.doc).toStrictEqual({ name: 'test' });
    });
    it('should upsert a value', () => {
        var _a, _b;
        const base = new simpleBase_1.SimpleBase();
        expect((_a = base.get('test')) === null || _a === void 0 ? void 0 : _a.doc).toBeUndefined();
        expect(base.size).toBe(0);
        base.getOrCreate('test', () => ({ name: 'test' }));
        expect(base.size).toBe(1);
        expect((_b = base.get('test')) === null || _b === void 0 ? void 0 : _b.doc).toStrictEqual({ name: 'test' });
    });
    it('should tell if a document exists', () => {
        const base = new simpleBase_1.SimpleBase();
        expect(base.has('test')).toBe(false);
        base.set('test', { name: 'test' });
        expect(base.has('test')).toBe(true);
    });
    it('should return an array of filtered documents', () => {
        const base = new simpleBase_1.SimpleBase();
        base.set('test', { name: 'test' });
        base.set('test2', { name: 'test2' });
        base.set('test3', { name: 'test3' });
        expect(base.filter(doc => doc.name === 'test').map(doc => doc.doc.name)).toEqual(['test']);
    });
    it('should return an array of mapped documents', () => {
        const base = new simpleBase_1.SimpleBase();
        base.set('test', { name: 'test' });
        base.set('test2', { name: 'test2' });
        base.set('test3', { name: 'test3' });
        expect(base.map(doc => doc.name)).toEqual(['test', 'test2', 'test3']);
    });
    it('should return an empty array of  documents', () => {
        const base = new simpleBase_1.SimpleBase();
        expect(base.map(doc => doc.name)).toEqual([]);
        expect(base.filter(doc => doc.name === 'test').map(doc => doc.doc.name)).toEqual([]);
    });
    it('should return a document by a query function', () => {
        var _a;
        const base = new simpleBase_1.SimpleBase();
        base.set('test', { name: 'test' });
        base.set('test2', { name: 'test2' });
        base.set('test3', { name: 'test3' });
        expect((_a = base.find(doc => doc.name === 'test2')) === null || _a === void 0 ? void 0 : _a.doc.name).toBe('test2');
    });
    it('should return null if no document is found by a query function', () => {
        const base = new simpleBase_1.SimpleBase();
        base.set('test', { name: 'test' });
        base.set('test2', { name: 'test2' });
        base.set('test3', { name: 'test3' });
        expect(base.find(doc => doc.name === 'test4')).toBeNull();
    });
    it('should reduce the pond to a single value', () => {
        const base = new simpleBase_1.SimpleBase();
        base.set('test', { name: 'test' });
        base.set('test2', { name: 'test2' });
        base.set('test3', { name: 'test3' });
        expect(base.reduce((acc, doc) => acc + doc.name, '')).toBe('testtest2test3');
    });
    it('should return the size of the pond', () => {
        const base = new simpleBase_1.SimpleBase();
        base.set('test', { name: 'test' });
        base.set('test2', { name: 'test2' });
        base.set('test3', { name: 'test3' });
        expect(base.size).toBe(3);
    });
    it('should provide an empty document', () => {
        const base = new simpleBase_1.SimpleBase();
        const test = base.createGenericDocument();
        expect(test).toBeInstanceOf(simpleBase_1.PondDocument);
        expect(test.doc).toBeNull();
    });
    it('should provide a document with a value', () => {
        const base = new simpleBase_1.SimpleBase();
        const test = base.createGenericDocument('test');
        expect(base.size).toBe(0);
        expect(test).toBeInstanceOf(simpleBase_1.PondDocument);
        expect(test.id).toBe('test');
    });
    it('should be iterable', () => {
        const base = new simpleBase_1.SimpleBase();
        base.set('test', { name: 'test' });
        base.set('test2', { name: 'test2' });
        base.set('test3', { name: 'test3' });
        expect([...base].map(doc => doc.doc.name)).toEqual(['test', 'test2', 'test3']);
    });
    it('should be iterable with a for of loop', () => {
        const base = new simpleBase_1.SimpleBase();
        base.set('test', { name: 'test' });
        base.set('test2', { name: 'test2' });
        base.set('test3', { name: 'test3' });
        const docs = [];
        for (const doc of base) {
            docs.push(doc.doc.name);
        }
        expect(docs).toEqual(['test', 'test2', 'test3']);
    });
    it('should be have a generator', () => {
        const base = new simpleBase_1.SimpleBase();
        base.set('test', { name: 'test' });
        base.set('test2', { name: 'test2' });
        base.set('test3', { name: 'test3' });
        const docs = [];
        for (const doc of base.generator()) {
            docs.push(doc.doc.name);
        }
        expect(docs).toEqual(['test', 'test2', 'test3']);
    });
});
describe('PondDocument', () => {
    it('should be able to set a value', () => {
        var _a;
        const base = new simpleBase_1.SimpleBase();
        const test = base.createGenericDocument('test');
        test.updateDoc({ name: 'test' });
        expect((_a = base.get('test')) === null || _a === void 0 ? void 0 : _a.doc).toStrictEqual({ name: 'test' });
    });
    it('should be able to get a value', () => {
        const base = new simpleBase_1.SimpleBase();
        const test = base.createGenericDocument('test');
        test.updateDoc({ name: 'test' });
        expect(test.doc).toStrictEqual({ name: 'test' });
    });
    it('should be able to delete a value', () => {
        const base = new simpleBase_1.SimpleBase();
        const test = base.createGenericDocument('test');
        test.updateDoc({ name: 'test' });
        expect(base.size).toBe(1);
        test.removeDoc();
        expect(base.size).toBe(0);
    });
    it('should be able to get the id', () => {
        const base = new simpleBase_1.SimpleBase();
        const test = base.createGenericDocument('test');
        expect(test.id).toBe('test');
    });
});
