import {LiveSocket} from "./liveSocket";
import {PondLiveChannelManager} from "./pondLiveChannel";

const createSocket = () => {
    const pondChannel = new PondLiveChannelManager();
    const manager = {
        handleInfo: jest.fn(),
    } as any;

    return new LiveSocket<any>('123', pondChannel, manager, () => {});
}

describe('LiveSocket', () => {
    it('should be able to assign data to a context', () => {
        const socket = createSocket();
        expect(socket.context).toEqual({});

        socket.assign({test: 'test'});
        expect(socket.context).toEqual({test: 'test'});
    });

    it('should be able to subscribe to a channel', () => {
        const socket = createSocket();

        socket.subscribe('/pond', 'testEvent');

        // The default behavior of the pond channel is to create a new channel when a client subscribes to it.
        expect(socket['_pond'].getChannel('/pond')?.topic).toEqual('/pond')
        expect(socket['_pond'].channels).toHaveLength(1);
    });

    it('should be able to able to accept a channel', () => {
        const socket = createSocket();

        socket.subscribe('/pond', 'testEvent');
        const chan = socket['_pond'].getChannel('/pond');
        expect(chan).not.toBeNull();

        // When the socket receives a message it should call the channel's createPondResponse method
        socket['_channel'] = {
            broadcast: jest.fn(),
            info: { // We get the socket identifier for the client, we can send a response to the client
                assigns: {
                    '123': {}
                }
            }
        } as any;

        // if we broadcast through chan or the socket it should attempt to generate a response
        // When the response is generated it should call the manager's handleInfo method as well
        chan?.broadcast('testEvent', {test: 'test'});
        socket.broadcast('/pond', 'testEvent', {test: 'test'});

        // Although 2 broadcasts were made, the manager's handleInfo method should only be called once
        // this is because even though the socket subscribed to a specific event, it doesn't handle
        // an event that it emits itself
        expect(socket['_manager'].handleInfo).toHaveBeenCalledTimes(1);

        // if we tried to broadcast to a different event, the manager's handleInfo method should not be called
        chan?.broadcast('testEvent2', {test: 'test'});
        socket.broadcast('/pond', 'testEvent2', {test: 'test'});
        expect(socket['_manager'].handleInfo).toHaveBeenCalledTimes(1);
    });

    it('should be able to assign data to a channel', () => {
        const socket = createSocket();

        socket.subscribe('/pond', 'testEvent'); // Subscribe to the pond channel to create a new channel
        const chan = socket['_pond'].getChannel('/pond');
        expect(chan).not.toBeNull();

        socket.assignToChannel('/pond', {test: 'test'});
        expect(chan?.data).toEqual({test: 'test'});
    });

    it('should be able to get data from a channel', () => {
        const socket = createSocket();

        socket.subscribe('/pond', 'testEvent'); // Subscribe to the pond channel to create a new channel
        const chan = socket['_pond'].getChannel('/pond');
        expect(chan).not.toBeNull();

        socket.assignToChannel('/pond', {test: 'test'});
        expect(socket.getChannelData('/pond')).toEqual({test: 'test'});

        // If the channel does not exist it should return null
        expect(socket.getChannelData('/test')).toBeNull();
    });

    it('should be able to unsubscribe from a channel', () => {
        const socket = createSocket();

        socket.subscribe('/pond', 'testEvent'); // Subscribe to the pond channel to create a new channel
        const chan = socket['_pond'].getChannel('/pond');
        expect(socket['_subscriptions']).toHaveLength(1);
        expect(chan).not.toBeNull();

        socket.unsubscribe('/pond');
        expect(socket['_pond'].channels).toHaveLength(0);
        // the pond channel is removed from the pond channel when we unsubscribe
        // and the socket is no longer subscribed to the channel
        expect(socket['_subscriptions']).toHaveLength(0);
    });
});