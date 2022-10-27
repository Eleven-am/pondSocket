"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const baseClass_1 = require("./baseClass");
describe('BaseClass', () => {
    const baseClass = new baseClass_1.BaseClass();
    it('should return true when object is empty', () => {
        expect(baseClass.isObjectEmpty({})).toBe(true);
    });
    it('should return false when object is not empty', () => {
        expect(baseClass.isObjectEmpty({ test: 5 })).toBe(false);
    });
    it('should return true if a string matches a regex | string', () => {
        const regex = new RegExp(/^test/);
        expect(baseClass.compareStringToPattern('test', regex)).toBe(true);
        const string = 'test';
        expect(baseClass.compareStringToPattern('test', string)).toBe(true);
    });
    it('should return false if a string does not match a regex | string', () => {
        const regex = new RegExp(/^test$/);
        expect(baseClass.compareStringToPattern('test2', regex)).toBe(false);
        const string = 'test';
        expect(baseClass.compareStringToPattern('test2', string)).toBe(false);
    });
    it('should return the params of a string matching the pattern', () => {
        const pattern = '/test/:id';
        const secondPattern = '/test/:id/:id2';
        const string = '/test/5';
        const secondString = '/test/5/6';
        expect(baseClass['_matchString'](string, pattern)).toEqual({ id: '5' });
        expect(baseClass['_matchString'](secondString, secondPattern)).toEqual({ id: '5', id2: '6' });
        // this function fails if the pattern is not a string or regex
        expect(baseClass['_matchString'](secondString, pattern)).toEqual(null);
        // But will return null if the string is smaller than the pattern
        expect(baseClass['_matchString'](string, secondPattern)).toEqual(null);
        //it should also match patterns without the slash
        const thirdPattern = 'test:id';
        const thirdString = 'test5';
        expect(baseClass['_matchString'](thirdString, thirdPattern)).toEqual({ id: '5' });
    });
    it('should return the query of string', () => {
        const string = '/test/5?test=5';
        const secondString = '/test/5?test=5&test2=6';
        expect(baseClass['_parseQueries'](string)).toEqual({ test: '5' });
        expect(baseClass['_parseQueries'](secondString)).toEqual({ test: '5', test2: '6' });
    });
    it('should return true if an object matches another object', () => {
        const object = { test: 5 };
        const secondObject = { test: 5, test2: 6 };
        expect(baseClass.areEqual(object, object)).toBe(true);
        expect(baseClass.areEqual(object, secondObject)).toBe(false);
    });
    it('should return null if the string does not match the pattern', () => {
        const pattern = 'pondSocket';
        const string = '/test2/5';
        expect(baseClass['_matchStringToPattern'](string, pattern)).toBe(null);
    });
    it('should return the params of a string matching the pattern', () => {
        const pattern = 'pondSocket';
        const string = 'pondSocket';
        expect(baseClass['_matchStringToPattern'](string, pattern)).toEqual({});
    });
    it('should generateEventRequest', () => {
        const pattern = 'pondSocket:test';
        const string = 'pondSockethello?test=5&test2=6';
        expect(baseClass.generateEventRequest(pattern, string)).toEqual({
            address: string,
            params: { test: 'hello' },
            query: { test: '5', test2: '6' }
        });
        const unMatchingString = 'pondXocket2hello?test=5&test2=6';
        expect(baseClass.generateEventRequest(pattern, unMatchingString)).toEqual(null);
    });
});
