import { BaseClass } from "./baseClass";

describe('BaseClass', () => {
    const baseClass = new BaseClass();
    it('should always return a uuid v4 string', () => {
        expect(baseClass.uuid()).toMatch(/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/);
    });

    it('should return true when object is empty', () => {
        expect(baseClass.isObjectEmpty({})).toBe(true);
    });

    it('should return false when object is not empty', () => {
        expect(baseClass.isObjectEmpty({test: 5})).toBe(false);
    })

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

        expect(baseClass['_matchString'](string, pattern)).toEqual({id: '5'});
        expect(baseClass['_matchString'](secondString, secondPattern)).toEqual({id: '5', id2: '6'});

        // this function fails if the pattern is not a string or regex
        expect(baseClass['_matchString'](secondString, pattern)).toEqual(null);

        // But will return null if the string is smaller than the pattern
        expect(baseClass['_matchString'](string, secondPattern)).toEqual(null);

        //it should also match patterns without the slash
        const thirdPattern = 'test:id';
        const thirdString = 'test5';
        expect(baseClass['_matchString'](thirdString, thirdPattern)).toEqual({id: '5'});
    })

    it('should return the query of string', () => {
        const string = '/test/5?test=5';
        const secondString = '/test/5?test=5&test2=6';

        expect(baseClass['_parseQueries'](string)).toEqual({test: '5'});
        expect(baseClass['_parseQueries'](secondString)).toEqual({test: '5', test2: '6'});
    });

    it('should return true if an object matches another object', () => {
        const object = {test: 5};
        const secondObject = {test: 5, test2: 6};

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
            params: {test: 'hello'},
            query: {test: '5', test2: '6'}
        });

        const unMatchingString = 'pondXocket2hello?test=5&test2=6';
        expect(baseClass.generateEventRequest(pattern, unMatchingString)).toEqual(null);
    })

    it('should be able to match partial strings to patterns', () => {
        const pattern = 'pondSocket:test';
        const string = 'pondSockethello?test=5&test2=6';

        const unMatchingString = 'pondXocket2hello?test=5&test2=6';

        const secondPattern = 'pondSocket:test/:id';
        const secondString = 'pondSockethello/5?test=5&test2=6';

        expect(baseClass['_matchPartialPattern'](string, pattern)).toEqual({
            params: {test: 'hello'},
            rest: '?test=5&test2=6'
        });

        expect(baseClass['_matchPartialPattern'](secondString, pattern)).toEqual({
            params: {test: 'hello'},
            rest: '/5?test=5&test2=6'
        });

        expect(baseClass['_matchPartialPattern'](unMatchingString, pattern)).toEqual(null);

        expect(baseClass['_matchPartialPattern'](secondString, secondPattern)).toEqual({
            params: {test: 'hello', id: '5'},
            rest: '?test=5&test2=6'
        });
    });

    it('should be capable of encrypting and decrypting a string', () => {
        const string = 'hello';
        const salt = 'test';
        const encryptedString = baseClass.encrypt(salt, string);
        expect(baseClass.decrypt(salt, encryptedString)).toEqual(string);
    });

    it('should not be capable of encrypting and decrypting a string with a different salt', () => {
        const string = {test: 5};
        const salt = 'test';
        const secondSalt = 'test2';
        const encryptedString = baseClass.encrypt(salt, string);
        expect(baseClass.decrypt(secondSalt, encryptedString)).toEqual(null);
    });

    it('should generate a random nanoId string', () => {
        const string = baseClass.nanoId();
        expect(string.length).toEqual(8);

        const secondString = baseClass.nanoId();
        expect(secondString.length).toEqual(8);

        expect(string).not.toEqual(secondString);
    });

    it('should match strings a little loosely with the getLiveRequest function', () => {
        const pattern = 'pondSocket:test';
        const string = 'pondSockethello?test=5&test2=6';

        const unMatchingString = 'pondXocket2hello?test=5&test2=6';

        const secondPattern = 'pondSocket:test/:id';
        const secondString = 'pondSockethello/5?test=5&test2=6';

        expect(baseClass.getLiveRequest(pattern, string)).toEqual({
            address: string,
            params: {test: 'hello'},
            query: {test: '5', test2: '6'},
            nextPath: '?test=5&test2=6'
        });

        expect(baseClass.getLiveRequest(pattern, secondString)).toEqual({
            address: secondString,
            params: {test: 'hello'},
            query: {test: '5', test2: '6'},
            nextPath: '/5?test=5&test2=6'
        });

        expect(baseClass.getLiveRequest(pattern, unMatchingString)).toEqual(null);

        expect(baseClass.getLiveRequest(secondPattern, secondString)).toEqual({
            address: secondString,
            params: {test: 'hello', id: '5'},
            query: {test: '5', test2: '6'},
            nextPath: '?test=5&test2=6'
        });

        const newPattern = '/pondSocket/test';
        const newString = '/pondSocket/test/test?james=5&test2=6';

        expect(baseClass.getLiveRequest(newPattern, newString)).toEqual({
            address: newString,
            params: {},
            query: {james: '5', test2: '6'},
            nextPath: '/test?james=5&test2=6'
        });

        const thirdPattern = '/pondSocket';
        const thirdString = '/pondSocket';

        expect(baseClass.getLiveRequest(thirdPattern, thirdString)).toEqual({
            address: thirdString,
            params: {},
            query: {},
            nextPath: ''
        });
    });
});
