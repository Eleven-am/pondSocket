import { Channel } from './channel';
import {
    ClientActions,
    ChannelState,
    PresenceEventTypes,
    ServerActions,
    Events,
    ChannelReceiver,
} from '../enums';
import { SimpleBehaviorSubject, SimpleSubject } from '../subjects/subject';
// eslint-disable-next-line import/no-unresolved
import { ChannelEvent } from '../types';

const createChannel = (params?: Record<string, any>) => {
    const publisher = jest.fn();
    const state = new SimpleBehaviorSubject<boolean>(true);
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
        expect(state.value).toBe(true);

        channel.join();

        expect(publisher).toHaveBeenCalledWith({
            action: ClientActions.JOIN_CHANNEL,
            channelName: 'test',
            event: ClientActions.JOIN_CHANNEL,
            payload: {},
        });

        const { channel: channel2, publisher: publisher2, state: state2 } = createChannel();

        state2.publish(false);
        expect(state2.value).toBe(false);
        expect(publisher2).not.toHaveBeenCalled();

        channel2.join();

        expect(publisher2).not.toHaveBeenCalled();

        state2.publish(true);

        expect(publisher2).toHaveBeenCalledWith({
            action: ClientActions.JOIN_CHANNEL,
            channelName: 'test',
            event: ClientActions.JOIN_CHANNEL,
            payload: {},
        });
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

        receiver.publish({
            action: ServerActions.SYSTEM,
            channelName: 'test',
            event: 'SYSTEM',
            payload: {
                event: 'JOIN',
            },
        });

        expect(channel.channelState).toBe(ChannelState.JOINING);
        // once the server responds with an ack, the channel state should be joined
        receiver.publish({
            action: ServerActions.SYSTEM,
            channelName: 'test',
            event: Events.ACKNOWLEDGE,
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

        receiver.publish({
            action: 'SYSTEM',
            channelName: 'test',
            event: Events.ACKNOWLEDGE,
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

        expect(channel.isConnected()).toBe(false);

        channel.join();

        expect(channel.isConnected()).toBe(false);

        receiver.publish({
            action: 'SYSTEM',
            channelName: 'test',
            event: Events.ACKNOWLEDGE,
            payload: {
                event: 'JOIN',
            },
        });

        expect(stateListener).toHaveBeenCalledWith(true);
        expect(channel.isConnected()).toBe(true);

        channel.leave();

        expect(stateListener).toHaveBeenCalledWith(false);
    });

    it('should correctly send a message', () => {
        const { channel, publisher, state, receiver } = createChannel();

        expect(channel.channelState).toBe(ChannelState.IDLE);
        expect(publisher).not.toHaveBeenCalled();

        // when the socket is connected but the channel is not joined, the message would not be queued
        channel.broadcast('test', { test: false });
        expect(publisher).not.toHaveBeenCalled();

        channel.join();

        publisher.mockClear();
        receiver.publish({
            action: 'SYSTEM',
            channelName: 'test',
            event: Events.ACKNOWLEDGE,
            payload: {
                event: 'JOIN',
            },
        });

        // however once the channel is joined, the message should be sent
        channel.broadcast('test', { test: true });
        expect(publisher).toHaveBeenCalledWith({
            action: ClientActions.BROADCAST,
            addresses: ChannelReceiver.ALL_USERS,
            channelName: 'test',
            event: 'test',
            payload: {
                test: true,
            },
        });

        // if for some reason the socket is disconnected, the message should be queued
        publisher.mockClear();
        state.publish(false);

        expect(state.value).toBe(false);

        channel.broadcast('test', { test: true });
        expect(publisher).not.toHaveBeenCalled();

        // once the socket is reconnected, a join message should be sent and the queued messages should be sent
        publisher.mockClear();
        state.publish(true);

        expect(publisher).toHaveBeenCalledWith({
            action: ClientActions.JOIN_CHANNEL,
            channelName: 'test',
            event: ClientActions.JOIN_CHANNEL,
            payload: {},
        });

        // until it receives an ack message the queued messages should not be sent
        expect(publisher).toHaveBeenCalledTimes(1);

        receiver.publish({
            action: 'SYSTEM',
            channelName: 'test',
            event: Events.ACKNOWLEDGE,
            payload: {
                event: 'JOIN',
            },
        });

        expect(publisher).toHaveBeenCalledWith({
            action: ClientActions.BROADCAST,
            addresses: ChannelReceiver.ALL_USERS,
            channelName: 'test',
            event: 'test',
            payload: {
                test: true,
            },
        });

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

        receiver.publish({
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

        receiver.publish({
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
        receiver.publish({
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

        receiver.publish({
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

        receiver.publish({
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
        receiver.publish({
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

        receiver.publish({
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
        receiver.publish({
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
        receiver.publish({
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
        receiver.publish({
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

    it('should notify subscribers when any presence event occurs', () => {
        const { channel, receiver } = createChannel();

        const presenceListener = jest.fn();

        channel.onPresenceChange(presenceListener);

        expect(presenceListener).not.toHaveBeenCalled();

        // usually the server wouldn't send a presence if the channel is not joined
        // but for testing purposes, we'll just send it anyway

        receiver.publish({
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

        expect(presenceListener).toHaveBeenCalledWith({
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
        });
    });

    // message events

    it('should notify subscribers when a message is received', () => {
        const { channel, receiver } = createChannel();

        const messageListener = jest.fn();

        channel.onMessage(messageListener);

        expect(messageListener).not.toHaveBeenCalled();

        receiver.publish({
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
        receiver.publish({
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

        receiver.publish({
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
        receiver.publish({
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
        receiver.publish({
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

    it('should be able to broadcast a message', () => {
        const { channel, receiver, publisher } = createChannel();

        channel.join();

        publisher.mockClear();
        receiver.publish({
            action: 'SYSTEM',
            channelName: 'test',
            event: Events.ACKNOWLEDGE,
            payload: {
                event: 'JOIN',
            },
        });

        channel.sendMessage('test', {
            test: 'test',
        }, ['test1']);

        expect(publisher).toHaveBeenCalledWith({
            action: ClientActions.BROADCAST,
            channelName: 'test',
            event: 'test',
            payload: {
                test: 'test',
            },
            addresses: ['test1'],
        });

        publisher.mockClear();

        channel.broadcastFrom('test', {
            test: 'test',
        });

        expect(publisher).toHaveBeenCalledWith({
            action: ClientActions.BROADCAST,
            channelName: 'test',
            event: 'test',
            payload: {
                test: 'test',
            },
            addresses: ChannelReceiver.ALL_EXCEPT_SENDER,
        });

        publisher.mockClear();

        channel.broadcast('test', {
            test: 'test',
        });

        expect(publisher).toHaveBeenCalledWith({
            action: ClientActions.BROADCAST,
            channelName: 'test',
            event: 'test',
            payload: {
                test: 'test',
            },
            addresses: ChannelReceiver.ALL_USERS,
        });
    });
});
