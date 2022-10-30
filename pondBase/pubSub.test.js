"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pubSub_1 = require("./pubSub");
describe('Broadcast', () => {
    it('should be defined', () => {
        expect(pubSub_1.Broadcast).toBeDefined();
    });
    it('should be a class', () => {
        expect(pubSub_1.Broadcast).toBeInstanceOf(Function);
    });
    // Functionality tests
    it('should publish a message to all subscribers', () => {
        const broadcast = new pubSub_1.Broadcast();
        const subscriber = jest.fn();
        broadcast.subscribe(subscriber); // test with one subscriber
        broadcast.publish('Hello');
        expect(subscriber).toHaveBeenCalledWith('Hello');
    });
    it('should publish a message to all subscribers', () => {
        const broadcast = new pubSub_1.Broadcast();
        const subscriber1 = jest.fn();
        const subscriber2 = jest.fn();
        broadcast.subscribe(subscriber1); // test with two subscribers
        broadcast.subscribe(subscriber2);
        broadcast.publish('Hello');
        expect(subscriber1).toHaveBeenCalledWith('Hello');
        expect(subscriber2).toHaveBeenCalledWith('Hello');
    });
    it('should publish a message to all subscribers', () => {
        // including subscribers that subscribe after the first message is published
        const broadcast = new pubSub_1.Broadcast();
        const subscriber1 = jest.fn();
        const subscriber2 = jest.fn();
        broadcast.subscribe(subscriber1);
        broadcast.publish('Hello');
        broadcast.subscribe(subscriber2);
        broadcast.publish('Hello Again');
        expect(subscriber1).toHaveBeenCalledWith('Hello');
        expect(subscriber1).toHaveBeenCalledWith('Hello Again');
        expect(subscriber2).toHaveBeenCalledWith('Hello Again');
    });
    it('should unsubscribe a subscriber and thus not receive new message', () => {
        const broadcast = new pubSub_1.Broadcast();
        const subscriber1 = jest.fn();
        const subscriber2 = jest.fn();
        broadcast.subscribe(subscriber1);
        broadcast.subscribe(subscriber2);
        broadcast.publish('Hello');
        const subscription = broadcast.subscribe(subscriber2);
        subscription.unsubscribe();
        broadcast.publish('Hello Again');
        expect(subscriber1).toHaveBeenCalledWith('Hello');
        expect(subscriber1).toHaveBeenCalledWith('Hello Again');
        expect(subscriber2).toHaveBeenCalledWith('Hello');
        expect(subscriber2).not.toHaveBeenCalledWith('Hello Again');
    });
    it('should stop the broadcast midway if a subscription returns a value', () => {
        const broadcast = new pubSub_1.Broadcast();
        const subscriber1 = jest.fn();
        const subscriber2 = jest.fn(() => true);
        const subscriber3 = jest.fn();
        broadcast.subscribe(subscriber1);
        broadcast.subscribe(subscriber2);
        broadcast.subscribe(subscriber3);
        broadcast.publish('Hello');
        expect(subscriber1).toHaveBeenCalledWith('Hello');
        expect(subscriber2).toHaveBeenCalledWith('Hello');
        expect(subscriber3).not.toHaveBeenCalled();
    });
    it('should throw an error if one of its subscribers throws an error', () => {
        const broadcast = new pubSub_1.Broadcast();
        const subscriber1 = jest.fn();
        const subscriber2 = jest.fn(() => {
            throw new Error('Something went wrong');
        });
        const subscriber3 = jest.fn();
        broadcast.subscribe(subscriber1);
        broadcast.subscribe(subscriber2);
        broadcast.subscribe(subscriber3);
        expect(() => broadcast.publish('Hello')).toThrowError('Something went wrong');
        expect(subscriber1).toHaveBeenCalledWith('Hello');
        expect(subscriber2).toHaveBeenCalledWith('Hello');
        expect(subscriber3).not.toHaveBeenCalled();
    });
    it('should clear all subscribers', () => {
        const broadcast = new pubSub_1.Broadcast();
        const subscriber1 = jest.fn();
        const subscriber2 = jest.fn();
        broadcast.subscribe(subscriber1);
        broadcast.subscribe(subscriber2);
        broadcast.publish('Hello');
        broadcast.clear();
        broadcast.publish('Hello Again');
        expect(subscriber1).toHaveBeenCalledWith('Hello');
        expect(subscriber1).not.toHaveBeenCalledWith('Hello Again');
        expect(subscriber2).toHaveBeenCalledWith('Hello');
        expect(subscriber2).not.toHaveBeenCalledWith('Hello Again');
    });
});
describe('Subject', () => {
    it('should be defined', () => {
        expect(pubSub_1.Subject).toBeDefined();
    });
    it('should be a class', () => {
        expect(pubSub_1.Subject).toBeInstanceOf(Function);
    });
    // Functionality tests
    it('should publish a message to all subscribers', () => {
        const subject = new pubSub_1.Subject('hi');
        const subscriber = jest.fn();
        subject.subscribe(subscriber); // test with one subscriber
        subject.publish('Hello');
        expect(subscriber).toHaveBeenCalledWith('Hello');
    });
    it('should publish a message to all subscribers', () => {
        const subject = new pubSub_1.Subject('hi');
        const subscriber1 = jest.fn();
        const subscriber2 = jest.fn();
        subject.subscribe(subscriber1); // test with two subscribers
        subject.subscribe(subscriber2);
        subject.publish('Hello');
        expect(subscriber1).toHaveBeenCalledWith('Hello');
        expect(subscriber2).toHaveBeenCalledWith('Hello');
    });
    it('should provide the initial value to new subscribers', () => {
        const subject = new pubSub_1.Subject('hi');
        const subscriber = jest.fn();
        subject.subscribe(subscriber); // test with one subscriber
        expect(subscriber).toHaveBeenCalledWith('hi');
    });
    it('should publish a message to all subscribers', () => {
        // including subscribers that subscribe after the first message is published
        const subject = new pubSub_1.Subject('hi');
        const subscriber1 = jest.fn();
        const subscriber2 = jest.fn();
        subject.subscribe(subscriber1);
        subject.publish('Hello');
        subject.subscribe(subscriber2);
        subject.publish('Hello Again');
        expect(subscriber1).toHaveBeenCalledWith('Hello');
        expect(subscriber1).toHaveBeenCalledWith('Hello Again');
        expect(subscriber2).toHaveBeenCalledWith('Hello Again');
    });
    it('should return the current value when the getter is called', () => {
        const subject = new pubSub_1.Subject('hi');
        expect(subject.value).toEqual('hi');
    });
    it('should throw an error if one of its subscribers throws an error', () => {
        const subject = new pubSub_1.Subject('hi');
        const subscriber1 = jest.fn();
        const subscriber2 = jest.fn(() => {
            throw new Error('Something went wrong');
        });
        const subscriber3 = jest.fn();
        subject.subscribe(subscriber1);
        // because the subject immediately calls the subscriber with the initial value
        expect(() => subject.subscribe(subscriber2)).toThrowError('Something went wrong');
        subscriber2.mockClear();
        subject.subscribe(subscriber3);
        // since ths subscriber throws an error, the subject should not call it
        subject.publish('Hello'); // this should not call subscriber2 and should not throw an error
        expect(subscriber1).toHaveBeenCalledWith('Hello');
        expect(subscriber3).toHaveBeenCalledWith('Hello');
        expect(subscriber2).not.toHaveBeenCalled();
    });
    it('should provide the current list of observers', () => {
        const subject = new pubSub_1.Subject('hi');
        const subscriber1 = jest.fn();
        const subscriber2 = jest.fn();
        subject.subscribe(subscriber1);
        subject.subscribe(subscriber2);
        const set = new Set([subscriber1, subscriber2]);
        expect(subject.observers).toEqual(set);
    });
});
describe('EventSubject', () => {
    it('should be defined', () => {
        expect(pubSub_1.EventPubSub).toBeDefined();
    });
    it('should be a class', () => {
        expect(pubSub_1.EventPubSub).toBeInstanceOf(Function);
    });
    // Functionality tests
    it('should publish a message to all subscribers', () => {
        const subject = new pubSub_1.EventPubSub();
        const subscriber = jest.fn();
        subject.subscribe('test', subscriber); // test with one subscriber
        subject.publish('test', 'Hello');
        expect(subscriber).toHaveBeenCalledWith('Hello');
    });
    it('should publish a message to all subscribers', () => {
        const subject = new pubSub_1.EventPubSub();
        const subscriber1 = jest.fn();
        const subscriber2 = jest.fn();
        subject.subscribe('test', subscriber1); // test with two subscribers
        subject.subscribe('test', subscriber2);
        subject.publish('test', 'Hello');
        expect(subscriber1).toHaveBeenCalledWith('Hello');
        expect(subscriber2).toHaveBeenCalledWith('Hello');
    });
    it('should publish a message to all subscribers', () => {
        // including subscribers that subscribe after the first message is published
        const subject = new pubSub_1.EventPubSub();
        const subscriber1 = jest.fn();
        const subscriber2 = jest.fn();
        subject.subscribe('test', subscriber1);
        subject.publish('test', 'Hello');
        subject.subscribe('test', subscriber2);
        subject.publish('test', 'Hello Again');
        expect(subscriber1).toHaveBeenCalledWith('Hello');
        expect(subscriber1).toHaveBeenCalledWith('Hello Again');
        expect(subscriber2).toHaveBeenCalledWith('Hello Again');
    });
    it('should not call a function if the event name does not match', () => {
        const subject = new pubSub_1.EventPubSub();
        const subscriber = jest.fn();
        subject.subscribe('test', subscriber);
        subject.publish('test2', 'Hello');
        expect(subscriber).not.toHaveBeenCalled();
    });
    it('should not call a function if the event name does not match', () => {
        // including subscribers that subscribe after the first message is published
        const subject = new pubSub_1.EventPubSub();
        const subscriber1 = jest.fn();
        const subscriber2 = jest.fn();
        subject.subscribe('test', subscriber1);
        subject.publish('test', 'Hello');
        expect(subscriber1).toHaveBeenCalledWith('Hello');
        expect(subscriber2).not.toHaveBeenCalled();
        subscriber1.mockClear();
        subscriber2.mockClear();
        subject.subscribe('test2', subscriber2);
        subject.publish('test2', 'Hello Again');
        expect(subscriber1).not.toHaveBeenCalled();
        expect(subscriber2).toHaveBeenCalledWith('Hello Again');
    });
    it('should accept a generic subscriber', () => {
        const subject = new pubSub_1.EventPubSub();
        const subscriber = jest.fn();
        subject.subscribeAll(subscriber);
        subject.publish('test', 'Hello');
        expect(subscriber).toHaveBeenCalledWith('Hello');
    });
    it('should accept a generic subscriber', () => {
        const subject = new pubSub_1.EventPubSub();
        const subscriber = jest.fn();
        subject.subscribeAll(subscriber);
        subject.publish('test', 'Hello');
        subject.publish('test2', 'Hello Again');
        expect(subscriber).toHaveBeenCalledWith('Hello');
        expect(subscriber).toHaveBeenCalledWith('Hello Again');
    });
    it('should be able to unsubscribe from a specific event', () => {
        const subject = new pubSub_1.EventPubSub();
        const subscriber = jest.fn();
        const sub = subject.subscribe('test', subscriber);
        subject.publish('test', 'Hello');
        expect(subscriber).toHaveBeenCalledWith('Hello');
        subscriber.mockClear();
        sub.unsubscribe();
        subject.publish('test', 'Hello Again');
        expect(subscriber).not.toHaveBeenCalledWith('Hello Again');
    });
    it('should complete the subscription when unsubscribed', () => {
        const subject = new pubSub_1.EventPubSub();
        const subscriber = jest.fn();
        const subscriber2 = jest.fn();
        const subscriber3 = jest.fn();
        subject.subscribe('test', subscriber);
        subject.subscribe('test1', subscriber2);
        subject.subscribe('test2', subscriber3);
        subject.publish('test', 'Hello');
        expect(subscriber).toHaveBeenCalledWith('Hello');
        subscriber.mockClear();
        subject.publish('test1', 'Hello Again');
        expect(subscriber).not.toHaveBeenCalledWith('Hello Again');
        expect(subscriber2).toHaveBeenCalledWith('Hello Again');
        subscriber2.mockClear();
        subject.publish('test2', 'Hello Again');
        expect(subscriber).not.toHaveBeenCalledWith('Hello Again');
        expect(subscriber2).not.toHaveBeenCalledWith('Hello Again');
        expect(subscriber3).toHaveBeenCalledWith('Hello Again');
        subscriber3.mockClear();
        subject.complete(); // complete all subscriptions
        subject.publish('test', 'Hello Again');
        expect(subscriber).not.toHaveBeenCalledWith('Hello Again');
        subject.publish('test1', 'Hello Again');
        expect(subscriber2).not.toHaveBeenCalledWith('Hello Again');
        subject.publish('test2', 'Hello Again');
        expect(subscriber3).not.toHaveBeenCalledWith('Hello Again');
    });
    it('should throw an error if one of its subscribers throw an error', () => {
        const subject = new pubSub_1.EventPubSub();
        const subscriber1 = jest.fn();
        const subscriber2 = jest.fn(() => {
            throw new Error('Something went wrong');
        });
        const subscriber3 = jest.fn();
        subject.subscribeAll(subscriber1);
        subject.subscribeAll(subscriber2);
        subject.subscribe('event', subscriber3);
        expect(() => subject.publish('event', 'Hello')).toThrowError('Something went wrong');
        expect(subscriber1).toHaveBeenCalledWith('Hello');
        expect(subscriber2).toHaveBeenCalledWith('Hello');
        expect(subscriber3).not.toHaveBeenCalled();
    });
    it('should be possible to unsubscribe from a generic subscriber', () => {
        const subject = new pubSub_1.EventPubSub();
        const subscriber = jest.fn();
        const sub = subject.subscribeAll(subscriber);
        subject.publish('test', 'Hello');
        expect(subscriber).toHaveBeenCalledWith('Hello');
        subscriber.mockClear();
        sub.unsubscribe();
        subject.publish('test', 'Hello Again');
        expect(subscriber).not.toHaveBeenCalledWith('Hello Again');
    });
    it('should be able to add an oncomplete callback', () => {
        const subject = new pubSub_1.EventPubSub();
        const subscriber = jest.fn();
        const subscriber2 = jest.fn();
        subject.onComplete(subscriber2);
        subject.subscribe('test', subscriber);
        subject.publish('test', 'Hello');
        expect(subscriber).toHaveBeenCalledWith('Hello');
        subscriber.mockClear();
        subject.complete();
        expect(subscriber2).toHaveBeenCalled();
        subject.publish('test', 'Hello Again');
        expect(subscriber).not.toHaveBeenCalledWith('Hello Again');
    });
});
