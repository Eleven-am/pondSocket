import { ChannelEngine, InternalChannelEvent } from './channel';
import { createParentEngine } from './channel.test';
import { EventResponse } from './eventResponse';
import { ServerActions, SystemSender, ErrorTypes, ChannelReceiver } from '../enums';

export const createChannelEngine = () => {
    const parentEngine = createParentEngine();

    return new ChannelEngine('test', parentEngine);
};

export const createChannelEvent = () => {
    const responseEvent: InternalChannelEvent = {
        event: 'event',
        payload: {
            payload: 'payload',
        },
        sender: 'sender',
        action: ServerActions.BROADCAST,
        recipients: ['recipient'],
    };

    return responseEvent;
};

const createChannelResponse = () => {
    const channelEngine = createChannelEngine();
    const event = createChannelEvent();

    channelEngine.addUser(event.sender, { assign: 'assign' }, () => {});
    channelEngine.addUser(event.recipients[0], { assign: 'assign' }, () => {});
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

    it('should accept the request', () => {
        const { response, channelEngine } = createChannelResponse();

        jest.spyOn(channelEngine, 'sendMessage');

        response.accept();
        expect(channelEngine.sendMessage).toHaveBeenCalledWith('sender', ['recipient'], ServerActions.BROADCAST, 'event', { payload: 'payload' });
    });

    it('should reject the request', () => {
        const { response, channelEngine, event } = createChannelResponse();

        jest.spyOn(channelEngine, 'sendMessage');
        response.reject();
        expect(channelEngine.sendMessage).toHaveBeenCalledWith(SystemSender.CHANNEL, [event.sender], ServerActions.ERROR, ErrorTypes.UNAUTHORIZED_BROADCAST, {
            message: 'Unauthorized request',
            code: 403,
        });
    });

    it('should send a direct message', () => {
        const { response, channelEngine, event } = createChannelResponse();

        jest.spyOn(channelEngine, 'sendMessage');
        response.send('event', { payload: 'payload' });
        expect(channelEngine.sendMessage).toHaveBeenCalledWith(SystemSender.CHANNEL, [event.sender], ServerActions.SYSTEM, 'event', { payload: 'payload' });
    });

    it('should broadcast a message', () => {
        const { response, channelEngine } = createChannelResponse();

        jest.spyOn(channelEngine, 'sendMessage');
        response.broadcast('event', { payload: 'payload' });
        expect(channelEngine.sendMessage).toHaveBeenCalledWith('sender', ChannelReceiver.ALL_USERS, ServerActions.BROADCAST, 'event', { payload: 'payload' });
    });

    it('should broadcastFromUser a message', () => {
        const { response, channelEngine } = createChannelResponse();

        jest.spyOn(channelEngine, 'sendMessage');
        response.broadcastFromUser('event', { payload: 'payload' });
        expect(channelEngine.sendMessage).toHaveBeenCalledWith('sender', ChannelReceiver.ALL_EXCEPT_SENDER, ServerActions.BROADCAST, 'event', { payload: 'payload' });
    });

    it('should sendToUsers a message', () => {
        const { response, channelEngine } = createChannelResponse();

        jest.spyOn(channelEngine, 'sendMessage');
        response.sendToUsers('event', { payload: 'payload' }, ['recipient']);
        expect(channelEngine.sendMessage).toHaveBeenCalledWith('sender', ['recipient'], ServerActions.BROADCAST, 'event', { payload: 'payload' });
    });

    it('should fail to send to non existing users', () => {
        const { event, response, channelEngine } = createChannelResponse();

        jest.spyOn(channelEngine, 'sendMessage');
        event.recipients = ['non_existing_user'];

        expect(() => response.accept()).toThrowError('ChannelEngine: Users non_existing_user are not in channel test');
        expect(channelEngine.sendMessage).toHaveBeenCalledWith(event.sender, ['non_existing_user'], ServerActions.BROADCAST, event.event, event.payload);

        expect(() => response.sendToUsers('event', { payload: 'payload' }, ['non_existing_user']))
            .toThrowError('ChannelEngine: Users non_existing_user are not in channel test');
    });

    it('should track a trackPresence', () => {
        const { response, channelEngine } = createChannelResponse();

        jest.spyOn(channelEngine, 'trackPresence');
        response.trackPresence({ status: 'online' });
        expect(channelEngine.trackPresence).toHaveBeenCalledWith('sender', { status: 'online' });
    });

    it('should update a users assign data', () => {
        const { response, channelEngine } = createChannelResponse();

        jest.spyOn(channelEngine, 'updateAssigns');
        response.accept({ assign: 'updated' });
        expect(channelEngine.updateAssigns).toHaveBeenCalledWith('sender', { assign: 'updated' });
    });

    it('should evict a user', () => {
        const { response, channelEngine } = createChannelResponse();

        jest.spyOn(channelEngine, 'kickUser');
        response.evictUser('recipient');
        expect(channelEngine.kickUser).toHaveBeenCalledWith('sender', 'recipient');
    });

    it('should destroy the channel', () => {
        const { response, channelEngine } = createChannelResponse();

        jest.spyOn(channelEngine, 'destroy');
        response.closeChannel('recipient');
        expect(channelEngine.destroy).toHaveBeenCalledWith('recipient');
    });

    it('should call the presence engine when the trackPresence is called', () => {
        const { response, channelEngine } = createChannelResponse();

        jest.spyOn(channelEngine, 'trackPresence');
        expect(channelEngine.trackPresence).not.toHaveBeenCalled();
        expect(channelEngine.presenceEngine).toBeUndefined();
        response.accept();
        response.trackPresence({ status: 'online' });
        expect(channelEngine.trackPresence).toHaveBeenCalledWith('sender', { status: 'online' });
    });

    it('should throw an error if trackPresence is called twice', () => {
        const { response, channelEngine } = createChannelResponse();

        jest.spyOn(channelEngine, 'trackPresence');
        expect(channelEngine.trackPresence).not.toHaveBeenCalled();
        expect(channelEngine.presenceEngine).toBeUndefined();
        response.accept();
        response.trackPresence({ status: 'online' });
        expect(channelEngine.trackPresence).toHaveBeenCalledWith('sender', { status: 'online' });
        expect(() => response.trackPresence({ status: 'online' })).toThrowError('PresenceEngine: Presence with key sender already exists');
    });

    it('should throw an error if trackPresence is called for a non existing user', () => {
        const { response, channelEngine } = createChannelResponse();

        jest.spyOn(channelEngine, 'trackPresence');
        expect(channelEngine.trackPresence).not.toHaveBeenCalled();
        expect(channelEngine.presenceEngine).toBeUndefined();
        response.accept();
        expect(() => response.trackPresence({ status: 'online' }, 'non_existent_user'))
            .toThrowError('ChannelEngine: User with id non_existent_user does not exist in channel test');
    });

    it('should update the presence of a user that is already tracked', () => {
        const { response, channelEngine } = createChannelResponse();

        jest.spyOn(channelEngine, 'trackPresence');
        expect(channelEngine.trackPresence).not.toHaveBeenCalled();
        expect(channelEngine.presenceEngine).toBeUndefined();
        response.accept();
        expect(channelEngine.presenceEngine?.getPresence()).toBeUndefined();
        response.trackPresence({ status: 'online' });
        expect(channelEngine.trackPresence).toHaveBeenCalledWith('sender', { status: 'online' });
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

        jest.spyOn(channelEngine, 'trackPresence');
        expect(channelEngine.trackPresence).not.toHaveBeenCalled();
        expect(channelEngine.presenceEngine).toBeUndefined();
        response.accept();
        expect(channelEngine.presenceEngine?.getPresence()).toBeUndefined();
        response.trackPresence({ status: 'online' });
        expect(() => response.updatePresence({ status: 'online' }, 'non_existent_user'))
            .toThrowError('PresenceEngine: Presence with key non_existent_user does not exist');
    });

    it('should unTrack a trackPresence', () => {
        const { response, channelEngine } = createChannelResponse();

        expect(channelEngine.presenceEngine).toBeUndefined();
        response.trackPresence({ status: 'online' });
        expect(channelEngine.presenceEngine?.getPresence()).toEqual({
            sender: { status: 'online' },
        });

        response.unTrackPresence();
        expect(channelEngine.presenceEngine?.getPresence()).toEqual({});
    });

    it('should throw an error if unTrackPresence is called for a non existing user', () => {
        const { response, channelEngine } = createChannelResponse();

        expect(channelEngine.presenceEngine).toBeUndefined();
        response.trackPresence({ status: 'online' });
        expect(channelEngine.presenceEngine?.getPresence()).toEqual({
            sender: { status: 'online' },
        });

        expect(() => response.unTrackPresence('non_existent_user'))
            .toThrowError('PresenceEngine: Presence with key non_existent_user does not exist');
    });
});
