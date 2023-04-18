import { ChannelEngine, InternalChannelEvent, ServerActions } from './channelEngine';
import { createParentEngine } from './channelEngine.test';
import { EventResponse } from './eventResponse';
import { ErrorTypes, SystemSender } from '../../enums';

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

    it('should return the responseSent', () => {
        const { response } = createChannelResponse();

        expect(response.responseSent).toEqual(false);
    });

    it('should accept the request', () => {
        const { response } = createChannelResponse();

        response.accept();
        expect(response.responseSent).toEqual(true);
    });

    it('should reject the request', () => {
        const { response, channelEngine, event } = createChannelResponse();

        jest.spyOn(channelEngine, 'sendMessage');
        response.reject();
        expect(response.responseSent).toEqual(true);
        expect(channelEngine.sendMessage).toHaveBeenCalledWith(SystemSender.CHANNEL, [event.sender], ServerActions.ERROR, ErrorTypes.UNAUTHORIZED_BROADCAST, { message: 'Unauthorized request',
            code: 403 });
    });

    it('should send a direct message', () => {
        const { response, channelEngine, event } = createChannelResponse();

        jest.spyOn(channelEngine, 'sendMessage');
        response.send('event', { payload: 'payload' });
        expect(response.responseSent).toEqual(true);
        expect(channelEngine.sendMessage).toHaveBeenCalledWith(SystemSender.CHANNEL, [event.sender], ServerActions.SYSTEM, 'event', { payload: 'payload' });
    });

    it('should broadcast a message', () => {
        const { response, channelEngine } = createChannelResponse();

        jest.spyOn(channelEngine, 'sendMessage');
        response.broadcast('event', { payload: 'payload' });
        expect(channelEngine.sendMessage).toHaveBeenCalledWith('sender', 'all_users', ServerActions.BROADCAST, 'event', { payload: 'payload' });
    });

    it('should broadcastFromUser a message', () => {
        const { response, channelEngine } = createChannelResponse();

        jest.spyOn(channelEngine, 'sendMessage');
        response.broadcastFromUser('event', { payload: 'payload' });
        expect(channelEngine.sendMessage).toHaveBeenCalledWith('sender', 'all_except_sender', ServerActions.BROADCAST, 'event', { payload: 'payload' });
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

        expect(() => response.accept()).toThrowError(new Error('ChannelEngine: Users non_existing_user are not in channel test'));
        expect(channelEngine.sendMessage).toHaveBeenCalledWith(event.sender, ['non_existing_user'], ServerActions.BROADCAST, event.event, event.payload);

        expect(() => response.sendToUsers('event', { payload: 'payload' }, ['non_existing_user']))
            .toThrowError(new Error('ChannelEngine: Users non_existing_user are not in channel test'));
    });

    it('should track a trackPresence', () => {
        const { response, channelEngine } = createChannelResponse();

        jest.spyOn(channelEngine, 'trackPresence');
        response.trackPresence({ status: 'online' });
        expect(channelEngine.trackPresence).toHaveBeenCalledWith('sender', { status: 'online' });
    });

    it('should untrack a trackPresence', () => {
        const { response, channelEngine } = createChannelResponse();

        jest.spyOn(channelEngine, 'unTrackPresence');
        response.unTrackPresence();
        expect(channelEngine.unTrackPresence).toHaveBeenCalledWith('sender');
    });

    it('should broadcast an error if untrackPresence is called twice', () => {
        const { response, channelEngine } = createChannelResponse();

        jest.spyOn(channelEngine, 'sendMessage');
        // because by default the user is not tracked and the presence engine only exists after a first trackPresence
        // we need to call trackPresence first
        response.trackPresence({ status: 'online' });
        response.unTrackPresence();
        response.unTrackPresence();
        expect(channelEngine.sendMessage).toHaveBeenCalledWith(SystemSender.CHANNEL, ['sender'], ServerActions.ERROR, ErrorTypes.PRESENCE_LEAVE_FAILED, {
            message: 'PresenceEngine: Presence with key sender does not exist',
            code: 500,
        });
    });

    it('should updatePresence', () => {
        const { response, channelEngine } = createChannelResponse();

        jest.spyOn(channelEngine, 'updatePresence');
        response.trackPresence({ status: 'online' });
        response.updatePresence({ status: 'updated' });
        expect(channelEngine.updatePresence).toHaveBeenCalledWith('sender', { status: 'updated' });
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
        expect(response.responseSent).toEqual(true);
    });

    it('should destroy the channel', () => {
        const { response, channelEngine } = createChannelResponse();

        jest.spyOn(channelEngine, 'destroy');
        response.closeChannel('recipient');
        expect(channelEngine.destroy).toHaveBeenCalledWith('recipient');
        expect(response.responseSent).toEqual(true);
    });

    it('should set hasResponseSent to true when calling send, accept, reject, end', () => {
        const { response } = createChannelResponse();

        expect(response.responseSent).toEqual(false);
        response.send('event', { payload: 'payload' });
        expect(response.responseSent).toEqual(true);

        const { response: response2 } = createChannelResponse();

        expect(response2.responseSent).toEqual(false);
        response2.accept();
        expect(response2.responseSent).toEqual(true);

        const { response: response3 } = createChannelResponse();

        expect(response3.responseSent).toEqual(false);
        response3.reject();
        expect(response3.responseSent).toEqual(true);

        const { response: response4 } = createChannelResponse();

        expect(response4.responseSent).toEqual(false);
        response4.end();
        expect(response4.responseSent).toEqual(true);
    });
});
