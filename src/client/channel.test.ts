import { Channel } from './channel';
import { PondState, ClientActions, ChannelState, PresenceEventTypes } from '../enums';
import { SimpleBehaviorSubject, SimpleSubject } from '../subjects/subject';
// eslint-disable-next-line import/no-unresolved
import { ChannelEvent } from '../types';

const createChannel = (params?: Record<string, any>) => {
    const publisher = jest.fn();
    const state = new SimpleBehaviorSubject<PondState>(PondState.OPEN);
    const receiver = new SimpleSubject<ChannelEvent>();

    const channel = new Channel(
        publisher,
        state,
        'test',
        receiver,
        params,
    );

    return {
        channel,
        publisher,
        state,
        receiver,
    };
};

describe('Channel', () => {
    it('should correctly send a join message', () => {
        const { channel, publisher, state } = createChannel();

        expect(publisher).not.toHaveBeenCalled();
        expect(state.value).toBe(PondState.OPEN);

        channel.join();

        expect(publisher).toHaveBeenCalledWith({
            action: ClientActions.JOIN_CHANNEL,
            channelName: 'test',
            event: ClientActions.JOIN_CHANNEL,
            payload: {},
        });

        const { channel: channel2, publisher: publisher2, state: state2 } = createChannel();

        state2.next(PondState.CLOSED);
        expect(state2.value).toBe(PondState.CLOSED);
        expect(publisher2).not.toHaveBeenCalled();
        expect(channel2['_queue']).toEqual([]);

        channel2.join();

        expect(publisher2).not.toHaveBeenCalled();
        expect(channel2['_queue']).toEqual([
            {
                action: ClientActions.JOIN_CHANNEL,
                channelName: 'test',
                event: ClientActions.JOIN_CHANNEL,
                payload: {},
            },
        ]);

        state2.next(PondState.OPEN);

        expect(publisher2).toHaveBeenCalledWith({
            action: ClientActions.JOIN_CHANNEL,
            channelName: 'test',
            event: ClientActions.JOIN_CHANNEL,
            payload: {},
        });

        expect(channel2['_queue']).toEqual([]);

        const { channel: channel3 } = createChannel();

        channel3.leave();

        expect(() => channel3.join())
            .toThrowError('This channel has been closed');
    });

    it('should correctly send a leave message', () => {
        const { channel, publisher, receiver } = createChannel();

        expect(channel.channelState).toBe(ChannelState.IDLE);

        channel.join();

        expect(channel.channelState).toBe(ChannelState.JOINING);

        // once the server responds with a join message, the channel should be connected
        receiver.next({
            action: 'SYSTEM',
            channelName: 'test',
            event: 'SYSTEM',
            payload: {
                event: 'JOIN',
            },
        });

        expect(channel.channelState).toBe(ChannelState.JOINED);

        channel.leave();

        expect(channel.channelState).toBe(ChannelState.CLOSED);

        expect(publisher).toHaveBeenCalledWith({
            action: ClientActions.LEAVE_CHANNEL,
            channelName: 'test',
            event: ClientActions.LEAVE_CHANNEL,
            payload: {},
        });
    });

    it('should notify subscribers when the channel state changes', () => {
        const { channel, receiver } = createChannel();

        const stateListener = jest.fn();

        channel.onChannelStateChange(stateListener);

        expect(stateListener).toHaveBeenCalledWith(ChannelState.IDLE);

        channel.join();

        receiver.next({
            action: 'SYSTEM',
            channelName: 'test',
            event: 'SYSTEM',
            payload: {
                event: 'JOIN',
            },
        });

        expect(stateListener).toHaveBeenCalledWith(ChannelState.JOINED);

        channel.leave();

        expect(stateListener).toHaveBeenCalledWith(ChannelState.CLOSED);
    });

    it('should notify subscribers when state changes BOOLEAN', () => {
        const { channel, receiver } = createChannel();

        const stateListener = jest.fn();

        channel.onConnectionChange(stateListener);

        expect(stateListener).toHaveBeenCalledWith(false);

        channel.join();

        receiver.next({
            action: 'SYSTEM',
            channelName: 'test',
            event: 'SYSTEM',
            payload: {
                event: 'JOIN',
            },
        });

        expect(stateListener).toHaveBeenCalledWith(true);

        channel.leave();

        expect(stateListener).toHaveBeenCalledWith(false);
    });

    it('should correctly send a message', () => {
        const { channel, publisher, state } = createChannel();

        expect(channel.channelState).toBe(ChannelState.IDLE);
        expect(publisher).not.toHaveBeenCalled();
        expect(channel['_queue']).toEqual([]);

        // when the socket is connected but the channel is not joined, the message would not be queued
        channel.broadcast('test', { test: true });
        expect(publisher).not.toHaveBeenCalled();
        expect(channel['_queue']).toEqual([]);

        channel.join();

        publisher.mockClear();

        // however once the channel is joined, the message should be sent
        channel.broadcast('test', { test: true });
        expect(publisher).toHaveBeenCalledWith({
            action: ClientActions.BROADCAST,
            addresses: 'all_users',
            channelName: 'test',
            event: 'test',
            payload: {
                test: true,
            },
        });

        // if for some reason the socket is disconnected, the message should be queued
        publisher.mockClear();
        state.next(PondState.CLOSED);

        expect(state.value).toBe(PondState.CLOSED);

        channel.broadcast('test', { test: true });
        expect(publisher).not.toHaveBeenCalled();
        expect(channel['_queue']).toEqual([
            {
                action: ClientActions.BROADCAST,
                addresses: 'all_users',
                channelName: 'test',
                event: 'test',
                payload: {
                    test: true,
                },
            },
        ]);

        // once the socket is reconnected, a join message should be sent and the queued messages should be sent
        publisher.mockClear();
        state.next(PondState.OPEN);

        expect(publisher).toHaveBeenCalledWith({
            action: ClientActions.JOIN_CHANNEL,
            channelName: 'test',
            event: ClientActions.JOIN_CHANNEL,
            payload: {},
        });

        expect(publisher).toHaveBeenCalledWith({
            action: ClientActions.BROADCAST,
            addresses: 'all_users',
            channelName: 'test',
            event: 'test',
            payload: {
                test: true,
            },
        });

        expect(channel['_queue']).toEqual([]);

        // if the channel is closed, the message should not be sent, and should not be queued
        publisher.mockClear();
        channel.leave();

        // the leave message should be sent
        expect(publisher).toHaveBeenCalledWith({
            action: ClientActions.LEAVE_CHANNEL,
            channelName: 'test',
            event: ClientActions.LEAVE_CHANNEL,
            payload: {},
        });

        expect(channel.channelState).toBe(ChannelState.CLOSED);
        channel.broadcast('test', { test: true });
        expect(channel['_queue']).toEqual([]);
        expect(publisher).toBeCalledTimes(1);
    });

    // The presence system tests
    it('should notify subscribers when a user joins the channel', () => {
        const { channel, receiver } = createChannel();

        const presenceListener = jest.fn();

        channel.onJoin(presenceListener);

        expect(presenceListener).not.toHaveBeenCalled();

        // usually the server wouldn't send a presence if the channel is not joined
        // but for testing purposes, we'll just send it anyway

        receiver.next({
            action: ServerActions.PRESENCE,
            event: PresenceEventTypes.JOIN,
            channelName: 'test',
            payload: {
                changed: {
                    id: 'test',
                    status: 'online',
                },
                presence: [
                    {
                        id: 'test',
                        status: 'online',
                    },
                    {
                        id: 'test2',
                        status: 'online',
                    },
                ],
            },
        });

        expect(presenceListener).toHaveBeenCalledWith({
            id: 'test',
            status: 'online',
        });

        presenceListener.mockClear();

        receiver.next({
            action: ServerActions.PRESENCE,
            event: PresenceEventTypes.UPDATE,
            channelName: 'test',
            payload: {
                changed: {
                    id: 'test',
                    status: 'online',
                },
                presence: [
                    {
                        id: 'test',
                        status: 'online',
                    },
                    {
                        id: 'test2',
                        status: 'online',
                    },
                ],
            },
        });

        expect(presenceListener).not.toHaveBeenCalled();

        // also, if a presence event is received for a different channel, it should not be sent to the listener
        receiver.next({
            action: ServerActions.PRESENCE,
            event: PresenceEventTypes.JOIN,
            channelName: 'test2',
            payload: {
                changed: {
                    id: 'test',
                    status: 'online',
                },
                presence: [
                    {
                        id: 'test',
                        status: 'online',
                    },
                    {
                        id: 'test2',
                        status: 'online',
                    },
                ],
            },
        });

        expect(presenceListener).not.toHaveBeenCalled();
    });

    it('should notify subscribers when a user leaves the channel', () => {
        const { channel, receiver } = createChannel();

        const presenceListener = jest.fn();

        channel.onLeave(presenceListener);

        expect(presenceListener).not.toHaveBeenCalled();

        // usually the server wouldn't send a presence if the channel is not joined
        // but for testing purposes, we'll just send it anyway

        receiver.next({
            action: ServerActions.PRESENCE,
            event: PresenceEventTypes.LEAVE,
            channelName: 'test',
            payload: {
                changed: {
                    id: 'test',
                    status: 'online',
                },
                presence: [
                    {
                        id: 'test',
                        status: 'online',
                    },
                    {
                        id: 'test2',
                        status: 'online',
                    },
                ],
            },
        });

        expect(presenceListener).toHaveBeenCalledWith({
            id: 'test',
            status: 'online',
        });

        presenceListener.mockClear();

        receiver.next({
            action: ServerActions.PRESENCE,
            event: PresenceEventTypes.UPDATE,
            channelName: 'test',
            payload: {
                changed: {
                    id: 'test',
                    status: 'online',
                },
                presence: [
                    {
                        id: 'test',
                        status: 'online',
                    },
                    {
                        id: 'test2',
                        status: 'online',
                    },
                ],
            },
        });

        expect(presenceListener).not.toHaveBeenCalled();

        // also, if a presence event is received for a different channel, it should not be sent to the listener
        receiver.next({
            action: ServerActions.PRESENCE,
            event: PresenceEventTypes.LEAVE,
            channelName: 'test2',
            payload: {
                changed: {
                    id: 'test',
                    status: 'online',
                },
                presence: [
                    {
                        id: 'test',
                        status: 'online',
                    },
                    {
                        id: 'test2',
                        status: 'online',
                    },
                ],
            },
        });

        expect(presenceListener).not.toHaveBeenCalled();
    });

    it('should notify subscribers when a user updates their presence', () => {
        const { channel, receiver } = createChannel();

        const presenceListener = jest.fn();

        channel.onUsersChange(presenceListener);

        expect(presenceListener).not.toHaveBeenCalled();

        // usually the server wouldn't send a presence if the channel is not joined
        // but for testing purposes, we'll just send it anyway

        receiver.next({
            action: ServerActions.PRESENCE,
            event: PresenceEventTypes.UPDATE,
            channelName: 'test',
            payload: {
                changed: {
                    id: 'test',
                    status: 'online',
                },
                presence: [
                    {
                        id: 'test',
                        status: 'online',
                    },
                    {
                        id: 'test2',
                        status: 'online',
                    },
                ],
            },
        });

        expect(presenceListener).toHaveBeenCalledWith([
            {
                id: 'test',
                status: 'online',
            },
            {
                id: 'test2',
                status: 'online',
            },
        ]);

        expect(channel.getPresence()).toBe(presenceListener.mock.calls[0][0]);

        presenceListener.mockClear();

        // if we receive a leave or join event, it should be sent to the listener
        // this is because we are listening for all presence events
        receiver.next({
            action: ServerActions.PRESENCE,
            event: PresenceEventTypes.JOIN,
            channelName: 'test',
            payload: {
                changed: {
                    id: 'test',
                    status: 'online',
                },
                presence: [
                    {
                        id: 'test',
                        status: 'online',
                    },
                ],
            },
        });

        expect(presenceListener).toHaveBeenCalledWith([
            {
                id: 'test',
                status: 'online',
            },
        ]);

        expect(channel.getPresence()).toBe(presenceListener.mock.calls[0][0]);

        presenceListener.mockClear();

        // also, if a presence event is received for a different channel, it should not be sent to the listener
        receiver.next({
            action: ServerActions.PRESENCE,
            event: PresenceEventTypes.UPDATE,
            channelName: 'test2',
            payload: {
                changed: {
                    id: 'test',
                    status: 'online',
                },
                presence: [
                    {
                        id: 'test',
                        status: 'online',
                    },
                    {
                        id: 'test2',
                        status: 'online',
                    },
                ],
            },
        });

        expect(presenceListener).not.toHaveBeenCalled();

        // we once again send a presence event for the same channel, but this time it should be sent to the listener
        receiver.next({
            action: ServerActions.PRESENCE,
            event: PresenceEventTypes.UPDATE,
            channelName: 'test',
            payload: {
                changed: {
                    id: 'test',
                    status: 'away',
                },
                presence: [
                    {
                        id: 'test',
                        status: 'away',
                    },
                    {
                        id: 'test2',
                        status: 'online',
                    },
                ],
            },
        });

        expect(presenceListener).toHaveBeenCalledWith([
            {
                id: 'test',
                status: 'away',
            },
            {
                id: 'test2',
                status: 'online',
            },
        ]);

        expect(channel.getPresence()).toBe(presenceListener.mock.calls[0][0]);
    });

    // message events

    it('should notify subscribers when a message is received', () => {
        const { channel, receiver } = createChannel();

        const messageListener = jest.fn();

        channel.onMessage(messageListener);

        expect(messageListener).not.toHaveBeenCalled();

        receiver.next({
            action: ServerActions.BROADCAST,
            event: 'message',
            channelName: 'test',
            payload: {
                id: 'test',
                message: 'test',
            },
        });

        expect(messageListener).toHaveBeenCalledWith('message', {
            id: 'test',
            message: 'test',
        });

        // if a message event is received for a different channel, it should not be sent to the listener
        receiver.next({
            action: ServerActions.BROADCAST,
            event: 'message',
            channelName: 'test2',
            payload: {
                id: 'test',
                message: 'test',
            },
        });

        expect(messageListener).toHaveBeenCalledTimes(1);

        // we can also subscribe to a specific message event
        const specificMessageListener = jest.fn();

        channel.onMessageEvent('test', specificMessageListener);

        expect(specificMessageListener).not.toHaveBeenCalled();

        receiver.next({
            action: ServerActions.BROADCAST,
            event: 'test',
            channelName: 'test',
            payload: {
                id: 'test',
                message: 'test',
            },
        });

        expect(specificMessageListener).toHaveBeenCalledWith({
            id: 'test',
            message: 'test',
        });

        specificMessageListener.mockClear();
        // if a message event is received for the same channel, but a different event, it should not be sent to the listener
        receiver.next({
            action: ServerActions.BROADCAST,
            event: 'test2',
            channelName: 'test',
            payload: {
                id: 'test',
                message: 'test',
            },
        });

        expect(specificMessageListener).not.toHaveBeenCalled();

        // if a message event is received for a different channel, it should not be sent to the listener
        receiver.next({
            action: ServerActions.BROADCAST,
            event: 'test',
            channelName: 'test2',
            payload: {
                id: 'test',
                message: 'test',
            },
        });

        expect(specificMessageListener).not.toHaveBeenCalled();
    });
});
