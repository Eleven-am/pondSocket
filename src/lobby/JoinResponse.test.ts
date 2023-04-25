import { JoinResponse } from './joinResponse';
import { createChannelEngine } from '../channel/eventResponse.test';
import { RequestCache } from '../endpoint/endpoint';
import { ErrorTypes, ServerActions, ChannelReceiver } from '../enums';

const createPondResponse = () => {
    const channelEngine = createChannelEngine();

    const socket: RequestCache = {
        clientId: 'sender',
        assigns: { assign: 'assign' },
        channelName: 'channel',
        socket: {
            send: jest.fn(),
        } as any,
    };

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
        response.reject();

        // check if the response was sent
        expect(channelEngine.addUser).not.toHaveBeenCalled();
        expect(channelEngine.getUserData(socket.clientId)).toBeUndefined();

        // also check if the socket was sent a message
        expect(socket.socket.send).toHaveBeenCalledWith(JSON.stringify({
            event: ErrorTypes.UNAUTHORIZED_JOIN_REQUEST,
            payload: {
                message: 'Request to join channel test rejected: Unauthorized request',
                code: 403,
            },
            channelName: 'test',
            action: ServerActions.ERROR,
        }));
    });

    it('should send a direct message', () => {
        const { response, channelEngine, socket } = createPondResponse();
        // spy on the channelEngine to see if the user was added

        jest.spyOn(channelEngine, 'addUser');
        response.send('POND_MESSAGE', { message: 'message' });

        // check if the response was sent
        expect(channelEngine.addUser).toHaveBeenCalled();
        expect(channelEngine.getUserData(socket.clientId)).toStrictEqual({ assigns: { assign: 'assign' },
            id: 'sender',
            presence: {} });

        // also check if the socket was sent a message
        expect(socket.socket.send).toHaveBeenCalledWith(JSON.stringify({
            action: ServerActions.SYSTEM,
            event: 'POND_MESSAGE',
            payload: {
                message: 'message',
            },
            channelName: 'test',
        }));
    });

    // auxiliary functions
    it('should send messages to different users', () => {
        const { response, channelEngine } = createPondResponse();
        // spy on the channelEngine to see if any messages were published
        const broadcast = jest.spyOn(channelEngine, 'sendMessage');

        // add a second user to the channel
        channelEngine.addUser('user2', { assign: 'assign' }, () => {});

        // send a message to a single user
        // this is because the sender does not exist in the channel yet
        expect(() => response.sendToUsers('hello_everyone', { message: 'hello' }, ['user2'])).toThrow();

        // clear the spy
        broadcast.mockClear();

        // add the sender to the channel by using the response.accept() method
        response.accept().sendToUsers('hello_everyone', { message: 'hello' }, ['user2']);

        // check if the message was sent
        expect(broadcast).toHaveBeenCalledWith('sender', ['user2'], ServerActions.BROADCAST, 'hello_everyone', { message: 'hello' });

        // clear the spy
        broadcast.mockClear();

        // send a message to all users
        response.broadcast('hello_everyone', { message: 'hello' });
        expect(broadcast).toHaveBeenCalledWith('sender', ChannelReceiver.ALL_USERS, ServerActions.BROADCAST, 'hello_everyone', { message: 'hello' });

        // clear the spy
        broadcast.mockClear();

        // send a message to all users except the sender
        response.broadcastFromUser('hello_everyone', { message: 'hello' });
        expect(broadcast).toHaveBeenCalledWith('sender', ChannelReceiver.ALL_EXCEPT_SENDER, ServerActions.BROADCAST, 'hello_everyone', { message: 'hello' });
    });

    it('should be able to track the presence of users', () => {
        const { response, channelEngine } = createPondResponse();

        // spy on the channelEngine to see if the trackPresence method was called
        const trackPresence = jest.spyOn(channelEngine, 'trackPresence');

        // add a second user to the channel
        response.accept()
            .trackPresence({
                status: 'online',
            });

        // check if the trackPresence method was called
        expect(trackPresence).toHaveBeenCalledWith('sender', { status: 'online' });
    });
});
