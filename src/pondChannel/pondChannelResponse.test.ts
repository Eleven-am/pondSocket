import { JoinResponse } from './joinResponse';
import { SocketCache } from './pondChannel';
import { createChannelEngine } from '../channel/channelResponse.test';


const createPondResponse = () => {
    const channelEngine = createChannelEngine();

    const socket: SocketCache = {
        clientId: 'sender',
        assigns: { assign: 'assign' },
        socket: {
            send: jest.fn(),
        } as any,
    };

    const response = new JoinResponse(socket, channelEngine);


    return { channelEngine,
        socket,
        response };
};

/* eslint-disable line-comment-position, no-inline-comments */

describe('pondChannelResponse', () => {
    it('should create a new PondChannelResponse', () => {
        const { response } = createPondResponse();

        expect(response).toBeDefined();
    });

    it('should return the responseSent', () => {
        const { response } = createPondResponse();

        expect(response.responseSent).toEqual(false);
    });

    it('should accept the request', () => {
        const { response, channelEngine, socket } = createPondResponse();
        // spy on the channelEngine to see if the user was added

        jest.spyOn(channelEngine, 'addUser');
        response.accept();

        // check if the response was sent
        expect(response.responseSent).toEqual(true);
        expect(response.responseSent).toEqual(true);
        expect(channelEngine.addUser).toHaveBeenCalledWith(socket.clientId, socket.assigns, expect.any(Function));
        expect(channelEngine.getUserData(socket.clientId)).not.toBeNull();
    });

    it('should reject the request', () => {
        const { response, channelEngine, socket } = createPondResponse();
        // spy on the channelEngine to see if the user was added

        jest.spyOn(channelEngine, 'addUser');
        response.reject();

        // check if the response was sent
        expect(response.responseSent).toEqual(true);
        expect(channelEngine.addUser).not.toHaveBeenCalled();
        expect(channelEngine.getUserData(socket.clientId)).toBeUndefined();

        // also check if the socket was sent a message
        expect(socket.socket.send).toHaveBeenCalledWith(JSON.stringify({
            event: 'POND_ERROR',
            payload: {
                message: 'Request to join channel test rejected: Unauthorized request',
                code: 403,
            },
            channelName: 'test',
        }));
    });

    it('should send a direct message', () => {
        const { response, channelEngine, socket } = createPondResponse();
        // spy on the channelEngine to see if the user was added

        jest.spyOn(channelEngine, 'addUser');
        response.send('POND_MESSAGE', { message: 'message' });

        // check if the response was sent
        expect(response.responseSent).toEqual(true);
        expect(channelEngine.addUser).toHaveBeenCalled();
        expect(channelEngine.getUserData(socket.clientId)).toStrictEqual({ assigns: { assign: 'assign' },
            id: 'sender',
            presence: {} });

        // also check if the socket was sent a message
        expect(socket.socket.send).toHaveBeenCalledWith(JSON.stringify({
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
        expect(() => response.sendToUsers('hello_everyone', { message: 'hello' }, ['user2'])).toThrow(); // this is because the sender does not exist in the channel yet

        // clear the spy
        broadcast.mockClear();

        // add the sender to the channel by using the response.accept() method
        response.accept().sendToUsers('hello_everyone', { message: 'hello' }, ['user2']);

        // check if the message was sent
        expect(broadcast).toHaveBeenCalledWith('sender', ['user2'], 'hello_everyone', { message: 'hello' });

        // clear the spy
        broadcast.mockClear();

        // send a message to all users
        response.broadcast('hello_everyone', { message: 'hello' });
        expect(broadcast).toHaveBeenCalledWith('sender', 'all_users', 'hello_everyone', { message: 'hello' });

        // clear the spy
        broadcast.mockClear();

        // send a message to all users except the sender
        response.broadcastFromUser('hello_everyone', { message: 'hello' });
        expect(broadcast).toHaveBeenCalledWith('sender', 'all_except_sender', 'hello_everyone', { message: 'hello' });
    });
});
