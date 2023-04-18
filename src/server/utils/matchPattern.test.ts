import { MatchPattern } from './matchPattern';

describe('BaseClass', () => {
    const baseClass = new MatchPattern();

    it('should return true if a string matches a regex | string', () => {
        const regex = new RegExp(/^test/);

        expect(baseClass['_compareStringToPattern']('test', regex)).toBe(true);

        const string = 'test';

        expect(baseClass['_compareStringToPattern']('test', string)).toBe(true);
    });

    it('should return false if a string does not match a regex | string', () => {
        const regex = new RegExp(/^test$/);

        expect(baseClass['_compareStringToPattern']('test2', regex)).toBe(false);

        const string = 'test';

        expect(baseClass['_compareStringToPattern']('test2', string)).toBe(false);
    });

    it('should return the params of a string matching the pattern', () => {
        const pattern = '/test/:id';
        const secondPattern = '/test/:id/:id2';
        const string = '/test/5';
        const secondString = '/test/5/6';

        expect(baseClass['_matchString'](string, pattern)).toEqual({ id: '5' });
        expect(baseClass['_matchString'](secondString, secondPattern)).toEqual({ id: '5',
            id2: '6' });

        // this function fails if the pattern is not a string or regex
        expect(baseClass['_matchString'](secondString, pattern)).toEqual(null);

        // But will return null if the string is smaller than the pattern
        expect(baseClass['_matchString'](string, secondPattern)).toEqual(null);

        // it should also match patterns without the slash
        const thirdPattern = 'test:id';
        const thirdString = 'test5';

        expect(baseClass['_matchString'](thirdString, thirdPattern)).toEqual({ id: '5' });
    });

    it('should return the query of string', () => {
        const string = '/test/5?test=5';
        const secondString = '/test/5?test=5&test2=6';

        expect(baseClass['_parseQueries'](string)).toEqual({ test: '5' });
        expect(baseClass['_parseQueries'](secondString)).toEqual({ test: '5',
            test2: '6' });
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

        expect(baseClass.parseEvent(pattern, string)).toEqual({
            address: string,
            params: { test: 'hello' },
            query: { test: '5',
                test2: '6' },
        });

        const unMatchingString = 'pondocket2hello?test=5&test2=6';

        expect(baseClass.parseEvent(pattern, unMatchingString)).toEqual(null);
    });

    it('should match any string if the path is *', () => {
        const pattern = '*';
        const string = 'pondSockethello?test=5&test2=6';

        expect(baseClass.parseEvent(pattern, string)).toEqual({
            address: string,
            params: {},
            query: {
                test: '5',
                test2: '6',
            },
        });
    });
});
