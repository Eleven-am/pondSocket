import { Client } from '../../abstracts/types';

export class MockClient implements Client {
    channelId: string;

    publishUserLeave = jest.fn();

    getAssignsCache = jest.fn().mockResolvedValue(new Map());

    getPresenceCache = jest.fn().mockResolvedValue(new Map());

    publishChannelMessage = jest.fn();

    subscribeToUserLeaves = jest.fn().mockReturnValue(jest.fn());

    publishAssignsChange = jest.fn();

    publishPresenceChange = jest.fn();

    subscribeToAssignsChanges = jest.fn().mockReturnValue(jest.fn());

    subscribeToPresenceChanges = jest.fn().mockReturnValue(jest.fn());

    subscribeToChannelMessages = jest.fn().mockReturnValue(jest.fn());

    constructor (channelId: string) {
        this.channelId = channelId;
    }
}

