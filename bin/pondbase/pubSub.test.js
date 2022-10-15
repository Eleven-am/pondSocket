"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var pubSub_1 = require("./pubSub");
describe('Broadcast', function () {
    it('should be defined', function () {
        expect(pubSub_1.Broadcast).toBeDefined();
    });
    it('should be a class', function () {
        expect(pubSub_1.Broadcast).toBeInstanceOf(Function);
    });
    it('should have a method called publish', function () {
        expect(new pubSub_1.Broadcast().publish).toBeDefined();
    });
    it('should have a method called subscribe', function () {
        expect(new pubSub_1.Broadcast().subscribe).toBeDefined();
    });
    // Functionality tests
    it('should publish a message to all subscribers', function () {
        var broadcast = new pubSub_1.Broadcast();
        var subscriber = jest.fn();
        broadcast.subscribe(subscriber); // test with one subscriber
        broadcast.publish('Hello');
        expect(subscriber).toHaveBeenCalledWith('Hello');
    });
    it('should publish a message to all subscribers', function () {
        var broadcast = new pubSub_1.Broadcast();
        var subscriber1 = jest.fn();
        var subscriber2 = jest.fn();
        broadcast.subscribe(subscriber1); // test with two subscribers
        broadcast.subscribe(subscriber2);
        broadcast.publish('Hello');
        expect(subscriber1).toHaveBeenCalledWith('Hello');
        expect(subscriber2).toHaveBeenCalledWith('Hello');
    });
    it('should publish a message to all subscribers', function () {
        // including subscribers that subscribe after the first message is published
        var broadcast = new pubSub_1.Broadcast();
        var subscriber1 = jest.fn();
        var subscriber2 = jest.fn();
        broadcast.subscribe(subscriber1);
        broadcast.publish('Hello');
        broadcast.subscribe(subscriber2);
        broadcast.publish('Hello Again');
        expect(subscriber1).toHaveBeenCalledWith('Hello');
        expect(subscriber1).toHaveBeenCalledWith('Hello Again');
        expect(subscriber2).toHaveBeenCalledWith('Hello Again');
    });
    it('should unsubscribe a subscriber and thus not receive new messagea', function () {
        var broadcast = new pubSub_1.Broadcast();
        var subscriber1 = jest.fn();
        var subscriber2 = jest.fn();
        broadcast.subscribe(subscriber1);
        broadcast.subscribe(subscriber2);
        broadcast.publish('Hello');
        var subscription = broadcast.subscribe(subscriber2);
        subscription.unsubscribe();
        broadcast.publish('Hello Again');
        expect(subscriber1).toHaveBeenCalledWith('Hello');
        expect(subscriber1).toHaveBeenCalledWith('Hello Again');
        expect(subscriber2).toHaveBeenCalledWith('Hello');
        expect(subscriber2).not.toHaveBeenCalledWith('Hello Again');
    });
    it('should stop the broadcast midway if a subscription returns a value', function () {
        var broadcast = new pubSub_1.Broadcast();
        var subscriber1 = jest.fn();
        var subscriber2 = jest.fn(function () { return true; });
        var subscriber3 = jest.fn();
        broadcast.subscribe(subscriber1);
        broadcast.subscribe(subscriber2);
        broadcast.subscribe(subscriber3);
        broadcast.publish('Hello');
        expect(subscriber1).toHaveBeenCalledWith('Hello');
        expect(subscriber2).toHaveBeenCalledWith('Hello');
        expect(subscriber3).not.toHaveBeenCalled();
    });
    it('should throw an error if one of its subscribers throws an error', function () {
        var broadcast = new pubSub_1.Broadcast();
        var subscriber1 = jest.fn();
        var subscriber2 = jest.fn(function () {
            throw new Error('Something went wrong');
        });
        var subscriber3 = jest.fn();
        broadcast.subscribe(subscriber1);
        broadcast.subscribe(subscriber2);
        broadcast.subscribe(subscriber3);
        expect(function () { return broadcast.publish('Hello'); }).toThrowError('Something went wrong');
        expect(subscriber1).toHaveBeenCalledWith('Hello');
        expect(subscriber2).toHaveBeenCalledWith('Hello');
        expect(subscriber3).not.toHaveBeenCalled();
    });
});
describe('Subject', function () {
    it('should be defined', function () {
        expect(pubSub_1.Subject).toBeDefined();
    });
    it('should be a class', function () {
        expect(pubSub_1.Subject).toBeInstanceOf(Function);
    });
    it('should have a method called next', function () {
        expect(new pubSub_1.Subject('hello').publish).toBeDefined();
    });
    it('should have a method called subscribe', function () {
        expect(new pubSub_1.Subject('hello').subscribe).toBeDefined();
    });
    // Functionality tests
    it('should publish a message to all subscribers', function () {
        var subject = new pubSub_1.Subject('hi');
        var subscriber = jest.fn();
        subject.subscribe(subscriber); // test with one subscriber
        subject.publish('Hello');
        expect(subscriber).toHaveBeenCalledWith('Hello');
    });
    it('should publish a message to all subscribers', function () {
        var subject = new pubSub_1.Subject('hi');
        var subscriber1 = jest.fn();
        var subscriber2 = jest.fn();
        subject.subscribe(subscriber1); // test with two subscribers
        subject.subscribe(subscriber2);
        subject.publish('Hello');
        expect(subscriber1).toHaveBeenCalledWith('Hello');
        expect(subscriber2).toHaveBeenCalledWith('Hello');
    });
    it('should prvoide the initial value to new subscribers', function () {
        var subject = new pubSub_1.Subject('hi');
        var subscriber = jest.fn();
        subject.subscribe(subscriber); // test with one subscriber
        expect(subscriber).toHaveBeenCalledWith('hi');
    });
    it('should publish a message to all subscribers', function () {
        // including subscribers that subscribe after the first message is published
        var subject = new pubSub_1.Subject('hi');
        var subscriber1 = jest.fn();
        var subscriber2 = jest.fn();
        subject.subscribe(subscriber1);
        subject.publish('Hello');
        subject.subscribe(subscriber2);
        subject.publish('Hello Again');
        expect(subscriber1).toHaveBeenCalledWith('Hello');
        expect(subscriber1).toHaveBeenCalledWith('Hello Again');
        expect(subscriber2).toHaveBeenCalledWith('Hello Again');
    });
    it('should return the current value when the getter is called', function () {
        var subject = new pubSub_1.Subject('hi');
        expect(subject.value).toEqual('hi');
    });
    it('should throw an error if one of its subscribers throws an error', function () {
        var subject = new pubSub_1.Subject('hi');
        var subscriber1 = jest.fn();
        var subscriber2 = jest.fn(function () {
            throw new Error('Something went wrong');
        });
        var subscriber3 = jest.fn();
        subject.subscribe(subscriber1);
        // because the subject immediately calls the subscriber with the initial value
        expect(function () { return subject.subscribe(subscriber2); }).toThrowError('Something went wrong');
        subscriber2.mockClear();
        subject.subscribe(subscriber3);
        // since ths subscriber throws an error, the subject should not call it
        subject.publish('Hello'); // this should not call subscriber2 and should not throw an error
        expect(subscriber1).toHaveBeenCalledWith('Hello');
        expect(subscriber3).toHaveBeenCalledWith('Hello');
        expect(subscriber2).not.toHaveBeenCalled();
    });
});
describe('EventSubject', function () {
    it('should be defined', function () {
        expect(pubSub_1.EventPubSub).toBeDefined();
    });
    it('should be a class', function () {
        expect(pubSub_1.EventPubSub).toBeInstanceOf(Function);
    });
    it('should have a method called next', function () {
        expect(new pubSub_1.EventPubSub().publish).toBeDefined();
    });
    it('should have a method called subscribe', function () {
        expect(new pubSub_1.EventPubSub().subscribe).toBeDefined();
    });
    // Functionality tests
    it('should publish a message to all subscribers', function () {
        var subject = new pubSub_1.EventPubSub();
        var subscriber = jest.fn();
        subject.subscribe('test', subscriber); // test with one subscriber
        subject.publish('test', 'Hello');
        expect(subscriber).toHaveBeenCalledWith('Hello');
    });
    it('should publish a message to all subscribers', function () {
        var subject = new pubSub_1.EventPubSub();
        var subscriber1 = jest.fn();
        var subscriber2 = jest.fn();
        subject.subscribe('test', subscriber1); // test with two subscribers
        subject.subscribe('test', subscriber2);
        subject.publish('test', 'Hello');
        expect(subscriber1).toHaveBeenCalledWith('Hello');
        expect(subscriber2).toHaveBeenCalledWith('Hello');
    });
    it('should publish a message to all subscribers', function () {
        // including subscribers that subscribe after the first message is published
        var subject = new pubSub_1.EventPubSub();
        var subscriber1 = jest.fn();
        var subscriber2 = jest.fn();
        subject.subscribe('test', subscriber1);
        subject.publish('test', 'Hello');
        subject.subscribe('test', subscriber2);
        subject.publish('test', 'Hello Again');
        expect(subscriber1).toHaveBeenCalledWith('Hello');
        expect(subscriber1).toHaveBeenCalledWith('Hello Again');
        expect(subscriber2).toHaveBeenCalledWith('Hello Again');
    });
    it('should not call a function if the event name does not match', function () {
        var subject = new pubSub_1.EventPubSub();
        var subscriber = jest.fn();
        subject.subscribe('test', subscriber);
        subject.publish('test2', 'Hello');
        expect(subscriber).not.toHaveBeenCalled();
    });
    it('should not call a function if the event name does not match', function () {
        // including subscribers that subscribe after the first message is published
        var subject = new pubSub_1.EventPubSub();
        var subscriber1 = jest.fn();
        var subscriber2 = jest.fn();
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
    it('should accept a generic subscriber', function () {
        var subject = new pubSub_1.EventPubSub();
        var subscriber = jest.fn();
        subject.subscribeAll(subscriber);
        subject.publish('test', 'Hello');
        expect(subscriber).toHaveBeenCalledWith('Hello');
    });
    it('should accept a generic subscriber', function () {
        var subject = new pubSub_1.EventPubSub();
        var subscriber = jest.fn();
        subject.subscribeAll(subscriber);
        subject.publish('test', 'Hello');
        subject.publish('test2', 'Hello Again');
        expect(subscriber).toHaveBeenCalledWith('Hello');
        expect(subscriber).toHaveBeenCalledWith('Hello Again');
    });
    it('should be able to unsubscribe from a specific event', function () {
        var subject = new pubSub_1.EventPubSub();
        var subscriber = jest.fn();
        var sub = subject.subscribe('test', subscriber);
        subject.publish('test', 'Hello');
        expect(subscriber).toHaveBeenCalledWith('Hello');
        subscriber.mockClear();
        sub.unsubscribe();
        subject.publish('test', 'Hello Again');
        expect(subscriber).not.toHaveBeenCalledWith('Hello Again');
    });
    it('should complete the subscription when unsubscribed', function () {
        var subject = new pubSub_1.EventPubSub();
        var subscriber = jest.fn();
        var subscriber2 = jest.fn();
        var subscriber3 = jest.fn();
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
    it('should throw an error if one of its subscribers throw an error', function () {
        var subject = new pubSub_1.EventPubSub();
        var subscriber1 = jest.fn();
        var subscriber2 = jest.fn(function () {
            throw new Error('Something went wrong');
        });
        var subscriber3 = jest.fn();
        subject.subscribeAll(subscriber1);
        subject.subscribeAll(subscriber2);
        subject.subscribe('event', subscriber3);
        expect(function () { return subject.publish('event', 'Hello'); }).toThrowError('Something went wrong');
        expect(subscriber1).toHaveBeenCalledWith('Hello');
        expect(subscriber2).toHaveBeenCalledWith('Hello');
        expect(subscriber3).not.toHaveBeenCalled();
    });
    it('should be possible to unsubscribe from a generic subscriber', function () {
        var subject = new pubSub_1.EventPubSub();
        var subscriber = jest.fn();
        var sub = subject.subscribeAll(subscriber);
        subject.publish('test', 'Hello');
        expect(subscriber).toHaveBeenCalledWith('Hello');
        subscriber.mockClear();
        sub.unsubscribe();
        subject.publish('test', 'Hello Again');
        expect(subscriber).not.toHaveBeenCalledWith('Hello Again');
    });
    it('should be able to add an oncomplete callback', function () {
        var subject = new pubSub_1.EventPubSub();
        var subscriber = jest.fn();
        var subscriber2 = jest.fn();
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
