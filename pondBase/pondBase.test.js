"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pondBase_1 = require("./pondBase");
const enums_1 = require("./enums");
describe('PondBase', () => {
    it('should be able to take in a subscriber', () => {
        const base = new pondBase_1.PondBase();
        expect(base['_broadcast']['_subscribers'].size).toBe(0);
        const mockSubscriber = jest.fn();
        base.subscribe(mockSubscriber);
        expect(base['_broadcast']['_subscribers'].size).toBe(1);
    });
    it('should be able to remove a subscriber', () => {
        const base = new pondBase_1.PondBase();
        expect(base['_broadcast']['_subscribers'].size).toBe(0);
        const mockSubscriber = jest.fn();
        const subscription = base.subscribe(mockSubscriber);
        expect(base['_broadcast']['_subscribers'].size).toBe(1);
        subscription.unsubscribe();
        expect(base['_broadcast']['_subscribers'].size).toBe(0);
    });
    it('should fire the subscriber when a document is added', () => {
        const base = new pondBase_1.PondBase();
        const mockSubscriber = jest.fn();
        base.subscribe(mockSubscriber);
        base.set('test', { name: 'test' });
        expect(mockSubscriber).toBeCalled();
        expect(mockSubscriber).toBeCalledWith([{ name: "test" }], { name: "test" }, enums_1.PondBaseActions.ADD_TO_POND);
    });
    it('should fire the subscriber when a document is removed', () => {
        const base = new pondBase_1.PondBase();
        const mockSubscriber = jest.fn();
        base.subscribe(mockSubscriber);
        const data = base.set('test', { name: 'test' });
        expect(mockSubscriber).toBeCalledWith([{ name: "test" }], { name: "test" }, enums_1.PondBaseActions.ADD_TO_POND);
        mockSubscriber.mockClear();
        data.removeDoc();
        expect(mockSubscriber).toBeCalledWith([], { name: "test" }, enums_1.PondBaseActions.REMOVE_FROM_POND);
    });
    it('should fire the subscriber when a document is updated', () => {
        const base = new pondBase_1.PondBase();
        const mockSubscriber = jest.fn();
        base.subscribe(mockSubscriber);
        const data = base.set('test', { name: 'test' });
        expect(mockSubscriber).toBeCalledWith([{ name: "test" }], { name: "test" }, enums_1.PondBaseActions.ADD_TO_POND);
        mockSubscriber.mockClear();
        data.updateDoc({ name: 'test2' });
        expect(mockSubscriber).toBeCalledWith([{ name: "test2" }], { name: "test2" }, enums_1.PondBaseActions.UPDATE_IN_POND);
    });
    it('should add a document to the database', () => {
        var _a, _b;
        const base = new pondBase_1.PondBase();
        const data = base.addDoc({ name: 'test' });
        expect(data.id).toBeDefined();
        expect((_a = base.get(data.id)) === null || _a === void 0 ? void 0 : _a.doc).toEqual(data.doc);
        expect((_b = base.get(data.id)) === null || _b === void 0 ? void 0 : _b.doc).toEqual({ name: 'test' });
    });
    it('should left join with another pond', () => {
        const owners = new pondBase_1.PondBase();
        const pets = new pondBase_1.PondBase();
        owners.addDoc({ name: 'test', age: 10 });
        owners.set('test2', { name: 'test2', age: 12 });
        pets.addDoc({ name: 'test', owner: 'test' });
        pets.addDoc({ name: 'test2', owner: 'test2' });
        pets.set('test3', { name: 'test3', owner: 'test3' });
        const joined = pets.leftJoin(owners, 'owner', 'name');
        expect([...joined].map(({ doc }) => doc)).toEqual([
            { name: 'test', owner: { name: 'test', age: 10 } },
            { name: 'test2', owner: { name: 'test2', age: 12 } },
            { name: 'test3', owner: null }
        ]);
    });
    it('should be able to get the keys', () => {
        const base = new pondBase_1.PondBase();
        base.set('test', { name: 'test' });
        base.set('test2', { name: 'test2' });
        expect(base.keys).toEqual(['test', 'test2']);
    });
    it('should be able to get the values', () => {
        const base = new pondBase_1.PondBase();
        base.addDoc({ name: 'test' });
        base.set('test2', { name: 'test2' });
        expect(base.values).toEqual([{ name: 'test' }, { name: 'test2' }]);
    });
    it('should be able to upsert a document', () => {
        var _a, _b;
        const base = new pondBase_1.PondBase();
        base.upsert('test', { name: 'test' });
        expect((_a = base.get('test')) === null || _a === void 0 ? void 0 : _a.doc).toEqual({ name: 'test' });
        base.upsert('test', { name: 'test2' });
        expect((_b = base.get('test')) === null || _b === void 0 ? void 0 : _b.doc).toEqual({ name: 'test2' });
    });
    it('should be able to getOrCreate a document with a function', () => {
        var _a, _b;
        const base = new pondBase_1.PondBase();
        base.getOrCreate('test', () => ({ name: 'test' }));
        expect((_a = base.get('test')) === null || _a === void 0 ? void 0 : _a.doc).toEqual({ name: 'test' });
        base.getOrCreate('test', () => ({ name: 'test2' }));
        expect((_b = base.get('test')) === null || _b === void 0 ? void 0 : _b.doc).toEqual({ name: 'test' });
    });
});
