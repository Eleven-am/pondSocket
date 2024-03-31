import { EventRequest } from './eventRequest';
import { createChannelEngine, createChannelEvent } from './eventResponse.test';

describe('ChannelRequest', () => {
    it('should create a new ChannelRequest', () => {
        const { channelEngine } = createChannelEngine();
        const event = createChannelEvent(channelEngine.name);
        const channelRequest = new EventRequest(event, channelEngine);

        expect(channelRequest).toBeDefined();
    });

    it('should return the payload', () => {
        const { channelEngine } = createChannelEngine();
        const event = createChannelEvent(channelEngine.name);
        const channelRequest = new EventRequest(event, channelEngine);

        channelRequest._parseQueries('event');

        expect(channelRequest.event.payload).toEqual(event.payload);
    });

    it('should return the user', () => {
        const { channelEngine } = createChannelEngine();
        const event = createChannelEvent(channelEngine.name);
        const channelRequest = new EventRequest(event, channelEngine);

        // because the user in the event does not exist in the channel, this should throw an error
        expect(() => channelRequest.user).toThrow();

        // add the user to the channel
        channelEngine.addUser(event.sender, { assign: 'assign' }, () => {});

        // now the user should be returned
        expect(channelRequest.user).toEqual(channelEngine.getUserData(event.sender));
    });
});
