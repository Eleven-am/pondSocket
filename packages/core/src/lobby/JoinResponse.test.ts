import { ChannelReceiver, ErrorTypes, Events, ServerActions } from '@eleven-am/pondsocket-common';

import { createMockSocket } from './JoinRequest.test';
import { JoinResponse } from './joinResponse';

const createPondResponse = () => {
    const { channelEngine, socket } = createMockSocket();

    const response = new JoinResponse(socket, channelEngine);

    return {
        channelEngine,
        socket,
        response,
    };
};

describe('JoinResponse', () => {
    it('should create a new PondChannelResponse', () => {
        const { response } = createPondResponse();

        expect(response).toBeDefined();
    });

    it('should accept the request', () => {
        const { response, channelEngine, socket } = createPondResponse();
        // spy on the channelEngine to see if the user was added

        jest.spyOn(channelEngine, 'addUser');
        response.accept();

        // check if the response was sent
        expect(channelEngine.addUser).toHaveBeenCalledWith(socket.clientId, socket.assigns, expect.any(Function));
        expect(channelEngine.getUserData(socket.clientId)).not.toBeNull();
    });

    it('should reject the request', () => {
        const { response, channelEngine, socket } = createPondResponse();
        // spy on the channelEngine to see if the user was added

        jest.spyOn(channelEngine, 'addUser');
        response.decline();

        // check if the response was sent
        expect(channelEngine.addUser).not.toHaveBeenCalled();
        expect(channelEngine.getUserData(socket.clientId)).toBeUndefined();

        // also check if the socket was sent a message
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error - we are mocking the socket
        const params = socket.socket.send.mock.calls[0][0];

        expect(JSON.parse(params)).toEqual(
            expect.objectContaining({
                event: ErrorTypes.UNAUTHORIZED_JOIN_REQUEST,
                payload: {
                    message: 'Unauthorized connection',
                    code: 401,
                },
                channelName: 'test',
                action: ServerActions.ERROR,
            }),
        );
    });

    it('should send a direct message', () => {
        const { response, channelEngine, socket } = createPondResponse();
        // spy on the channelEngine to see if the user was added

        jest.spyOn(channelEngine, 'addUser');
        const endpoint = channelEngine.parent.parent;

        jest.spyOn(endpoint, 'sendMessage');

        response
            .accept()
            .reply('POND_MESSAGE', { message: 'message' })
            .assign({ assign: 'assign' });

        expect(channelEngine.addUser).toHaveBeenCalled();

        // check if the response was sent
        expect(channelEngine.getUserData(socket.clientId)).toStrictEqual({
            assigns: {
                assign: 'assign',
            },
            id: 'sender',
            presence: {},
        });

        // also check if the socket was sent a message
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error - we are mocking the socket
        const first = endpoint.sendMessage.mock.calls[0][1];

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error - we are mocking the socket
        const params = endpoint.sendMessage.mock.calls[1][1];

        expect(first).toEqual(
            expect.objectContaining({
                channelName: 'test',
                action: ServerActions.SYSTEM,
                payload: {},
                event: Events.ACKNOWLEDGE,
            }),
        );

        expect(params).toEqual(
            expect.objectContaining({
                channelName: 'test',
                action: ServerActions.SYSTEM,
                payload: {
                    message: 'message',
                },
                event: 'POND_MESSAGE',
            }),
        );
    });

    // auxiliary functions
    it('should send messages to different users', () => {
        const { response, channelEngine } = createPondResponse();
        // spy on the channelEngine to see if any messages were published
        const broadcast = jest.spyOn(channelEngine, 'sendMessage');

        const receiver = jest.fn() as any;

        // add a second user to the channel
        channelEngine.addUser('user2', { assign: 'assign' }, receiver);

        // send a message to a single user
        // this is because the sender does not exist in the channel yet
        expect(() => response.broadcastTo('hello_everyone', { message: 'hello' }, ['user2'])).toThrow();

        // clear the spy
        broadcast.mockClear();

        // add the sender to the channel by using the response.accept() method
        response.accept().broadcastTo('hello_everyone', { message: 'hello' }, ['user2']);

        // check if the message was sent
        expect(broadcast).toHaveBeenCalledWith('sender', ['user2'], ServerActions.BROADCAST, 'hello_everyone', { message: 'hello' }, 'requestId');

        // clear the spy
        broadcast.mockClear();

        // send a message to all users
        response.broadcast('hello_everyone', { message: 'hello' });
        expect(broadcast).toHaveBeenCalledWith('sender', ChannelReceiver.ALL_USERS, ServerActions.BROADCAST, 'hello_everyone', { message: 'hello' }, 'requestId');

        // clear the spy
        broadcast.mockClear();

        // send a message to all users except the sender
        response.broadcastFrom('hello_everyone', { message: 'hello' });
        expect(broadcast).toHaveBeenCalledWith('sender', ChannelReceiver.ALL_EXCEPT_SENDER, ServerActions.BROADCAST, 'hello_everyone', { message: 'hello' }, 'requestId');
    });

    it('should be able to track the presence of users', () => {
        const { response, channelEngine } = createPondResponse();

        // spy on the channelEngine to see if the trackPresence method was called
        const trackPresence = jest.spyOn(channelEngine.presenceEngine, 'trackPresence');

        // add a second user to the channel
        response.accept()
            .trackPresence({
                status: 'online',
            });

        // check if the trackPresence method was called
        expect(trackPresence).toHaveBeenCalledWith('sender', { status: 'online' });
    });

    it('should throw an error if accept, reject / send is called more than once', () => {
        const { response, channelEngine, socket } = createPondResponse();

        jest.spyOn(channelEngine, 'addUser');
        expect(channelEngine.addUser).not.toHaveBeenCalled();
        response.accept();
        expect(channelEngine.addUser).toHaveBeenCalledWith(socket.clientId, socket.assigns, expect.any(Function));
        expect(() => response.accept()).toThrow('Request to join channel test rejected: Request already executed');
        expect(() => response.decline()).toThrow('Request to join channel test rejected: Request already executed');
        expect(() => response.reply('event', { payload: 'payload' })).not.toThrow();
    });
});
