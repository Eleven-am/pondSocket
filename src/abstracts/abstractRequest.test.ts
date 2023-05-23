import { AbstractRequest } from './abstractRequest';

const createMockChannelEngine = () => ({
    name: 'test',
    getAssigns: () => ({}),
    getPresence: () => ({}),
} as any);

describe('AbstractRequest', () => {
    it('should be able to be instantiated', () => {
        const request = new AbstractRequest('/test', createMockChannelEngine(), {});

        expect(request).toBeTruthy();
        expect(request.channelName).toBe('test');
        expect(request.assigns).toEqual({});
        expect(request.presence).toEqual({});
    });

    it('should be able to parse queries', () => {
        const request = new AbstractRequest('/1234?choke=balls', createMockChannelEngine(), {});

        expect(() => request.event).toThrowError('Event was not parsed');
        expect(request['_parseQueries']('/:id')).toBe(true);
        expect(request.event).toEqual({
            event: '/1234?choke=balls',
            params: { id: '1234' },
            query: { choke: 'balls' },
            payload: {},
        });
    });

    it('should be return the value of the payload', () => {
        const request = new AbstractRequest('/test', createMockChannelEngine(), { test: 'test' });

        expect(request['_parseQueries']('/:id')).toBe(true);
        expect(request.event.payload).toEqual({ test: 'test' });

        const request2 = new AbstractRequest('/test', createMockChannelEngine(), {
            test: 'test',
            test2: 'test2',
        });

        expect(request2['_parseQueries']('/:id')).toBe(true);
        expect(request2.event.payload).toEqual({
            test: 'test',
            test2: 'test2',
        });
    });
});
