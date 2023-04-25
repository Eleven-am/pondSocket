import { JoinRequest } from './joinRequest';
import { createChannelEngine } from '../channel/eventResponse.test';
import { RequestCache } from '../endpoint/endpoint';

const createMockSocket = (params = {}) => {
    const channelEngine = createChannelEngine();

    const socket: RequestCache = {
        clientId: 'sender',
        assigns: { assign: 'assign' },
        channelName: 'channel',
        socket: {
            send: jest.fn(),
        } as any,
    };

    const request = new JoinRequest(socket, params, channelEngine);

    return {
        channelEngine,
        socket,
        request,
    };
};

describe('JoinRequest', () => {
    it('should create a new PondChannelResponse', () => {
        const { request } = createMockSocket();

        expect(request).toBeDefined();
    });

    it('should return the join params', () => {
        const { request } = createMockSocket({ params: 'params' });

        expect(request.joinParams).toEqual({ params: 'params' });
    });

    it('should return the user data', () => {
        const { request } = createMockSocket();

        expect(request.user).toEqual({
            id: 'sender',
            assigns: { assign: 'assign' },
            presence: {},
        });
    });
});
