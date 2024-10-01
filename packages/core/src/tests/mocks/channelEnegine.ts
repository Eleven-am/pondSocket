import { MockLobbyEngine } from './lobbyEngine';
import { ChannelEngine } from '../../engines/channelEngine';
import { LobbyEngine } from '../../engines/lobbyEngine';

export class MockChannelEngine extends ChannelEngine {
    addUser = jest.fn();

    sendMessage = jest.fn();

    broadcastMessage = jest.fn();

    trackPresence = jest.fn();

    updatePresence = jest.fn();

    removePresence = jest.fn();

    upsertPresence = jest.fn();

    updateAssigns = jest.fn();

    kickUser = jest.fn();

    getAssigns = jest.fn();

    getPresence = jest.fn();

    destroy = jest.fn();

    removeUser = jest.fn();

    getUser = jest.fn();

    parent = new MockLobbyEngine();

    name = 'mockChannel';

    constructor () {
        super({} as LobbyEngine, 'mockChannel', {} as any);
    }
}
