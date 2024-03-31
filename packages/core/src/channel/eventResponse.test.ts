import { ChannelReceiver, ServerActions, SystemSender } from '@eleven-am/pondsocket-common';

import { BroadcastEvent, ChannelEngine } from './channel';
import { createParentEngine } from './channel.test';
import { EventResponse } from './eventResponse';

export const createChannelEngine = () => {
    const { parentEngine, socket } = createParentEngine();

    const channelEngine = new ChannelEngine('test', parentEngine);

    return {
        channelEngine,
        parentEngine,
        socket,
    };
};

export const createChannelEvent = (name: string) => {
    const responseEvent: BroadcastEvent = {
        event: 'event',
        payload: {
            payload: 'payload',
        },
        sender: 'sender',
        action: ServerActions.BROADCAST,
        channelName: name,
        requestId: 'requestId',
    };

    return responseEvent;
};

const createChannelResponse = () => {
    const { channelEngine, socket } = createChannelEngine();
    const event = createChannelEvent(channelEngine.name);

    const unsub = channelEngine.addUser(event.sender, { assign: 'assign' }, () => {});

    socket.subscriptions.set(channelEngine.name, unsub);
    channelEngine.addUser('tester', { assign: 'assign' }, () => {});
    const response = new EventResponse(event, channelEngine);

    return {
        channelEngine,
        event,
        response,
    };
};

describe('ChannelResponse', () => {
    it('should create a new ChannelResponse', () => {
        const { response } = createChannelResponse();

        expect(response).toBeDefined();
    });


    it('should send a direct message', () => {
        const { response, channelEngine, event } = createChannelResponse();

        jest.spyOn(channelEngine, 'sendMessage');
        response.reply('event', { payload: 'payload' });
        expect(channelEngine.sendMessage).toHaveBeenCalledWith(SystemSender.CHANNEL, [event.sender], ServerActions.SYSTEM, 'event', { payload: 'payload' }, 'requestId');
    });

    it('should broadcast a message', () => {
        const { response, channelEngine } = createChannelResponse();

        jest.spyOn(channelEngine, 'sendMessage');
        response.broadcast('event', { payload: 'payload' });
        expect(channelEngine.sendMessage).toHaveBeenCalledWith('sender', ChannelReceiver.ALL_USERS, ServerActions.BROADCAST, 'event', { payload: 'payload' }, 'requestId');
    });

    it('should broadcastFromUser a message', () => {
        const { response, channelEngine } = createChannelResponse();

        jest.spyOn(channelEngine, 'sendMessage');
        response.broadcastFrom('event', { payload: 'payload' });
        expect(channelEngine.sendMessage).toHaveBeenCalledWith('sender', ChannelReceiver.ALL_EXCEPT_SENDER, ServerActions.BROADCAST, 'event', { payload: 'payload' }, 'requestId');
    });

    it('should sendToUsers a message', () => {
        const { response, channelEngine } = createChannelResponse();

        jest.spyOn(channelEngine, 'sendMessage');
        response.broadcastTo('event', { payload: 'payload' }, 'tester');
        expect(channelEngine.sendMessage).toHaveBeenCalledWith('sender', ['tester'], ServerActions.BROADCAST, 'event', { payload: 'payload' }, 'requestId');

        (channelEngine.sendMessage as any).mockClear();

        response.broadcastTo('event', { payload: 'payload' }, ['tester', 'sender']);
        expect(channelEngine.sendMessage).toHaveBeenCalledWith('sender', ['tester', 'sender'], ServerActions.BROADCAST, 'event', { payload: 'payload' }, 'requestId');
    });

    it('should fail to send to non existing users', () => {
        const { response } = createChannelResponse();

        expect(() => response.broadcastTo('event', { payload: 'payload' }, ['non_existing_user']))
            .toThrow('ChannelEngine: Invalid recipients non_existing_user some users do not exist in channel test');
    });

    it('should track a trackPresence', () => {
        const { response, channelEngine } = createChannelResponse();

        jest.spyOn(channelEngine.presenceEngine, 'trackPresence');
        response.trackPresence({ status: 'online' });
        expect(channelEngine.presenceEngine.trackPresence).toHaveBeenCalledWith('sender', { status: 'online' });
    });

    it('should update a users assign data', () => {
        const { response, channelEngine } = createChannelResponse();

        jest.spyOn(channelEngine, 'updateAssigns');
        response.assign({ assign: 'updated' });
        expect(channelEngine.updateAssigns).toHaveBeenCalledWith('sender', { assign: 'updated' });
    });

    it('should evict a user', () => {
        const { response, channelEngine } = createChannelResponse();

        jest.spyOn(channelEngine, 'kickUser');
        response.evictUser('recipient');
        expect(channelEngine.kickUser).toHaveBeenCalledWith('sender', 'recipient');
    });

    it('should destroy the channel', () => {
        const { channelEngine, socket } = createChannelEngine();
        const event = createChannelEvent(channelEngine.name);

        const unsub = channelEngine.addUser(event.sender, { assign: 'assign' }, () => {});

        socket.subscriptions.set(channelEngine.name, unsub);
        const response = new EventResponse(event, channelEngine);

        jest.spyOn(channelEngine, 'destroy');
        response.closeChannel('recipient');
        expect(channelEngine.destroy).toHaveBeenCalledWith('recipient');
    });

    it('should call the presence engine when the trackPresence is called', () => {
        const { response, channelEngine } = createChannelResponse();

        jest.spyOn(channelEngine.presenceEngine, 'trackPresence');
        expect(channelEngine.presenceEngine.trackPresence).not.toHaveBeenCalled();
        response.trackPresence({ status: 'online' });
        expect(channelEngine.presenceEngine.trackPresence).toHaveBeenCalledWith('sender', { status: 'online' });
    });

    it('should throw an error if trackPresence is called twice', () => {
        const { response, channelEngine } = createChannelResponse();

        jest.spyOn(channelEngine.presenceEngine, 'trackPresence');
        expect(channelEngine.presenceEngine.trackPresence).not.toHaveBeenCalled();
        response.trackPresence({ status: 'online' });
        expect(channelEngine.presenceEngine.trackPresence).toHaveBeenCalledWith('sender', { status: 'online' });
        expect(() => response.trackPresence({ status: 'online' })).toThrow('PresenceEngine: Presence with key sender already exists');
    });

    it('should throw an error if trackPresence is called for a non existing user', () => {
        const { response, channelEngine } = createChannelResponse();

        jest.spyOn(channelEngine.presenceEngine, 'trackPresence');
        expect(channelEngine.presenceEngine.trackPresence).not.toHaveBeenCalled();
        expect(() => response.trackPresence({ status: 'online' }, 'non_existent_user'))
            .toThrow('ChannelEngine: Invalid recipients non_existent_user some users do not exist in channel test');
    });

    it('should update the presence of a user that is already tracked', () => {
        const { response, channelEngine } = createChannelResponse();

        jest.spyOn(channelEngine.presenceEngine, 'trackPresence');
        expect(channelEngine.presenceEngine.trackPresence).not.toHaveBeenCalled();
        response.trackPresence({ status: 'online' });
        expect(channelEngine.presenceEngine.trackPresence).toHaveBeenCalledWith('sender', { status: 'online' });
        expect(channelEngine.presenceEngine?.getPresence()).toEqual({
            sender: { status: 'online' },
        });
        response.updatePresence({ status: 'offline' });
        expect(channelEngine.presenceEngine?.getPresence()).toEqual({
            sender: { status: 'offline' },
        });
    });

    it('should throw an error if updatePresence is called for a non existing user', () => {
        const { response, channelEngine } = createChannelResponse();

        jest.spyOn(channelEngine.presenceEngine, 'trackPresence');
        expect(channelEngine.presenceEngine.trackPresence).not.toHaveBeenCalled();
        response.trackPresence({ status: 'online' });
        expect(() => response.updatePresence({ status: 'online' }, 'non_existent_user'))
            .toThrow('PresenceEngine: Presence with key non_existent_user does not exist');
    });

    it('should unTrack a trackPresence', () => {
        const { response, channelEngine } = createChannelResponse();

        response.trackPresence({ status: 'online' });
        expect(channelEngine.presenceEngine?.getPresence()).toEqual({
            sender: { status: 'online' },
        });

        response.removePresence();
        expect(channelEngine.presenceEngine?.getPresence()).toEqual({});
    });

    it('should throw an error if unTrackPresence is called for a non existing user', () => {
        const { response, channelEngine } = createChannelResponse();

        response.trackPresence({ status: 'online' });
        expect(channelEngine.presenceEngine?.getPresence()).toEqual({
            sender: { status: 'online' },
        });

        expect(() => response.removePresence('non_existent_user'))
            .toThrow('PresenceEngine: Presence with key non_existent_user does not exist');
    });
});
