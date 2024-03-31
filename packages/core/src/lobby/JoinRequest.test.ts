import { JoinRequest } from './joinRequest';
import { createChannelEngine } from '../channel/eventResponse.test';
import { RequestCache } from '../endpoint/endpoint';

export const createMockSocket = () => {
    const { channelEngine } = createChannelEngine();

    const socket: RequestCache = {
        clientId: 'sender',
        assigns: { assign: 'assign' },
        channelName: 'channel',
        requestId: 'requestId',
        subscriptions: new Map(),
        socket: {
            send: jest.fn(),
        } as any,
    };

    return {
        channelEngine,
        socket,
    };
};

const createJoinRequest = (params = {}) => {
    const { channelEngine, socket } = createMockSocket();
    const request = new JoinRequest(socket, params, channelEngine);

    return {
        channelEngine,
        socket,
        request,
    };
};

describe('JoinRequest', () => {
    it('should create a new PondChannelResponse', () => {
        const { request } = createJoinRequest();

        expect(request).toBeDefined();
    });

    it('should return the join params', () => {
        const { request } = createJoinRequest({ params: 'params' });

        expect(request.joinParams).toEqual({ params: 'params' });
    });

    it('should return the user data', () => {
        const { request } = createJoinRequest();

        expect(request.user).toEqual({
            id: 'sender',
            assigns: { assign: 'assign' },
            presence: {},
        });
    });
});
