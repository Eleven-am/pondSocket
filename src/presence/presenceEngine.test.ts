import { PondPresence, PresenceEngine, PresenceEvent } from './presenceEngine';

/* eslint-disable @typescript-eslint/ban-ts-comment */

describe('PresenceEngine', () => {
    let presenceEngine: PresenceEngine;
    let presence: PondPresence;
    let presenceKey: string;
    let onPresenceChange: (presence: PresenceEvent) => void;

    beforeEach(() => {
        presenceEngine = new PresenceEngine();
        presence = {
            id: 'id',
            name: 'name',
            color: 'color',
            type: 'type',
            location: 'location',
        };
        presenceKey = 'presenceKey';
        onPresenceChange = jest.fn();
    });

    describe('trackPresence', () => {
        it('should insert a presence into the presence engine', () => {
            // spy on the private method _insertPresence
            // @ts-ignore
            jest.spyOn(presenceEngine, '_insertPresence');
            presenceEngine.trackPresence(presenceKey, presence, onPresenceChange);
            // @ts-ignore
            expect(presenceEngine._insertPresence).toHaveBeenCalledWith(presenceKey, presence);
            expect(onPresenceChange).toHaveBeenCalledWith({
                type: 'join',
                changed: presence,
                presence: [presence],
            });
        });

        it('should subscribe to the presence engine', () => {
            // spy on the private method _subscribe
            // @ts-ignore
            jest.spyOn(presenceEngine, '_subscribe');
            presenceEngine.trackPresence(presenceKey, presence, onPresenceChange);
            // @ts-ignore
            expect(presenceEngine._subscribe).toHaveBeenCalledWith(presenceKey, onPresenceChange);
            expect(onPresenceChange).toHaveBeenCalledWith({
                type: 'join',
                changed: presence,
                presence: [presence],
            });
        });

        it('should throw an error if the presence already exists', () => {
            presenceEngine.trackPresence(presenceKey, presence, onPresenceChange);
            expect(() => presenceEngine.trackPresence(presenceKey, presence, onPresenceChange)).toThrowError(`PresenceEngine: Presence with key ${presenceKey} already exists`);
        });
    });

    describe('updatePresence', () => {
        it('should update a presence', () => {
            presenceEngine.trackPresence(presenceKey, presence, onPresenceChange);
            const newPresence = {
                id: 'id',
                name: 'name',
                color: 'color',
                type: 'type',
                location: 'location',
            };

            presenceEngine.updatePresence(presenceKey, newPresence);
            expect(onPresenceChange).toHaveBeenCalledWith({
                type: 'update',
                changed: { ...presence,
                    ...newPresence },
                presence: [newPresence],
            });
        });

        it('should throw an error if the presence does not exist', () => {
            expect(() => presenceEngine.updatePresence(presenceKey, presence)).toThrowError(`PresenceEngine: Presence with key ${presenceKey} does not exist`);
        });
    });

    describe('removePresence', () => {
        it('should remove a presence from the presence engine', () => {
            presenceEngine.trackPresence(presenceKey, presence, onPresenceChange);
            presenceEngine.trackPresence('presenceKey2', { ...presence,
                key: 'presence2' }, onPresenceChange);
            presenceEngine.removePresence(presenceKey);
            expect(onPresenceChange).toHaveBeenCalledWith({
                type: 'leave',
                changed: presence,
                presence: [
                    { ...presence,
                        key: 'presence2' },
                ],
            });
            // @ts-ignore
            onPresenceChange.mockClear();
            presenceEngine.removePresence('presenceKey2');
            expect(onPresenceChange).not.toHaveBeenCalled();
        });

        it('should throw an error if the presence does not exist', () => {
            expect(() => presenceEngine.removePresence(presenceKey)).toThrowError(`PresenceEngine: Presence with key ${presenceKey} does not exist`);
        });
    });

    describe('getPresence', () => {
        it('should return the presence', () => {
            presenceEngine.trackPresence(presenceKey, presence, onPresenceChange);
            const data: any = {};

            data[presenceKey] = presence;
            expect(presenceEngine.getPresence()).toEqual(data);
        });
    });
});
