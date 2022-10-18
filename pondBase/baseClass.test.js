"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var baseClass_1 = require("./baseClass");
describe('BaseClass', function () {
    var baseClass = new baseClass_1.BaseClass();
    it('should always return a uuid v4 string', function () {
        expect(baseClass.uuid()).toMatch(/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/);
    });
    it('should return true when object is empty', function () {
        expect(baseClass.isObjectEmpty({})).toBe(true);
    });
    it('should return false when object is not empty', function () {
        expect(baseClass.isObjectEmpty({ test: 5 })).toBe(false);
    });
    it('should return true if a string matches a regex | string', function () {
        var regex = new RegExp(/^test/);
        expect(baseClass.compareStringToPattern('test', regex)).toBe(true);
        var string = 'test';
        expect(baseClass.compareStringToPattern('test', string)).toBe(true);
    });
    it('should return false if a string does not match a regex | string', function () {
        var regex = new RegExp(/^test$/);
        expect(baseClass.compareStringToPattern('test2', regex)).toBe(false);
        var string = 'test';
        expect(baseClass.compareStringToPattern('test2', string)).toBe(false);
    });
    it('should return the params of a string matching the pattern', function () {
        var pattern = '/test/:id';
        var secondPattern = '/test/:id/:id2';
        var string = '/test/5';
        var secondString = '/test/5/6';
        expect(baseClass['_matchString'](string, pattern)).toEqual({ id: '5' });
        expect(baseClass['_matchString'](secondString, secondPattern)).toEqual({ id: '5', id2: '6' });
        // this function fails if the pattern is not a string or regex
        expect(baseClass['_matchString'](secondString, pattern)).toEqual(null);
        // But will return null if the string is smaller than the pattern
        expect(baseClass['_matchString'](string, secondPattern)).toEqual(null);
        //it should also match patterns without the slash
        var thirdPattern = 'test:id';
        var thirdString = 'test5';
        expect(baseClass['_matchString'](thirdString, thirdPattern)).toEqual({ id: '5' });
    });
    it('should return the query of string', function () {
        var string = '/test/5?test=5';
        var secondString = '/test/5?test=5&test2=6';
        expect(baseClass['_parseQueries'](string)).toEqual({ test: '5' });
        expect(baseClass['_parseQueries'](secondString)).toEqual({ test: '5', test2: '6' });
    });
    it('should return true if an object matches another object', function () {
        var object = { test: 5 };
        var secondObject = { test: 5, test2: 6 };
        expect(baseClass.areEqual(object, object)).toBe(true);
        expect(baseClass.areEqual(object, secondObject)).toBe(false);
    });
    it('should return null if the string does not match the pattern', function () {
        var pattern = 'pondSocket';
        var string = '/test2/5';
        expect(baseClass['_matchStringToPattern'](string, pattern)).toBe(null);
    });
    it('should return the params of a string matching the pattern', function () {
        var pattern = 'pondSocket';
        var string = 'pondSocket';
        expect(baseClass['_matchStringToPattern'](string, pattern)).toEqual({});
    });
    it('should generateEventRequest', function () {
        var pattern = 'pondSocket:test';
        var string = 'pondSockethello?test=5&test2=6';
        expect(baseClass.generateEventRequest(pattern, string)).toEqual({
            address: string,
            params: { test: 'hello' },
            query: { test: '5', test2: '6' }
        });
        var unMatchingString = 'pondXocket2hello?test=5&test2=6';
        expect(baseClass.generateEventRequest(pattern, unMatchingString)).toEqual(null);
    });
    it('should be able to match partial strings to patterns', function () {
        var pattern = 'pondSocket:test';
        var string = 'pondSockethello?test=5&test2=6';
        var unMatchingString = 'pondXocket2hello?test=5&test2=6';
        var secondPattern = 'pondSocket:test/:id';
        var secondString = 'pondSockethello/5?test=5&test2=6';
        expect(baseClass['_matchPartialPattern'](string, pattern)).toEqual({
            params: { test: 'hello' },
            rest: '?test=5&test2=6'
        });
        expect(baseClass['_matchPartialPattern'](secondString, pattern)).toEqual({
            params: { test: 'hello' },
            rest: '/5?test=5&test2=6'
        });
        expect(baseClass['_matchPartialPattern'](unMatchingString, pattern)).toEqual(null);
        expect(baseClass['_matchPartialPattern'](secondString, secondPattern)).toEqual({
            params: { test: 'hello', id: '5' },
            rest: '?test=5&test2=6'
        });
    });
    it('should be capable of encrypting and decrypting a string', function () {
        var string = 'hello';
        var salt = 'test';
        var encryptedString = baseClass.encrypt(salt, string);
        expect(baseClass.decrypt(salt, encryptedString)).toEqual(string);
    });
    it('should not be capable of encrypting and decrypting a string with a different salt', function () {
        var string = { test: 5 };
        var salt = 'test';
        var secondSalt = 'test2';
        var encryptedString = baseClass.encrypt(salt, string);
        expect(baseClass.decrypt(secondSalt, encryptedString)).toEqual(null);
    });
    it('should generate a random nanoId string', function () {
        var string = baseClass.nanoId();
        expect(string.length).toEqual(8);
        var secondString = baseClass.nanoId();
        expect(secondString.length).toEqual(8);
        expect(string).not.toEqual(secondString);
    });
    it('should match strings a little loosely with the getLiveRequest function', function () {
        var pattern = 'pondSocket:test';
        var string = 'pondSockethello?test=5&test2=6';
        var unMatchingString = 'pondXocket2hello?test=5&test2=6';
        var secondPattern = 'pondSocket:test/:id';
        var secondString = 'pondSockethello/5?test=5&test2=6';
        expect(baseClass.getLiveRequest(pattern, string)).toEqual({
            address: string,
            params: { test: 'hello' },
            query: { test: '5', test2: '6' },
            nextPath: '?test=5&test2=6'
        });
        expect(baseClass.getLiveRequest(pattern, secondString)).toEqual({
            address: secondString,
            params: { test: 'hello' },
            query: { test: '5', test2: '6' },
            nextPath: '/5?test=5&test2=6'
        });
        expect(baseClass.getLiveRequest(pattern, unMatchingString)).toEqual(null);
        expect(baseClass.getLiveRequest(secondPattern, secondString)).toEqual({
            address: secondString,
            params: { test: 'hello', id: '5' },
            query: { test: '5', test2: '6' },
            nextPath: '?test=5&test2=6'
        });
        var newPattern = '/pondSocket/test';
        var newString = '/pondSocket/test/test?james=5&test2=6';
        expect(baseClass.getLiveRequest(newPattern, newString)).toEqual({
            address: newString,
            params: {},
            query: { james: '5', test2: '6' },
            nextPath: '/test?james=5&test2=6'
        });
        var thirdPattern = '/pondSocket';
        var thirdString = '/pondSocket';
        expect(baseClass.getLiveRequest(thirdPattern, thirdString)).toEqual({
            address: thirdString,
            params: {},
            query: {},
            nextPath: ''
        });
    });
});
