import { Manager } from '../../managers/manager';

export class MockManager extends Manager {
    addUser = jest.fn();

    removeUser = jest.fn();

    trackPresence = jest.fn();

    updatePresence = jest.fn();

    removePresence = jest.fn();

    upsertPresence = jest.fn();

    updateAssigns = jest.fn();

    getAllAssigns = jest.fn();

    getAllPresence = jest.fn();

    getUserData = jest.fn();

    broadcast = jest.fn();

    close = jest.fn();

    setAssigns = jest.fn();

    removeAssigns = jest.fn();

    constructor () {
        super('test-channel');
    }

    private _userIds = new Set<string>();

    get userIds () {
        return this._userIds;
    }

    set userIds (value) {
        this._userIds = value;
    }
}
