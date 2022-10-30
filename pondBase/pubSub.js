"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventPubSub = exports.Subject = exports.Broadcast = void 0;
class Broadcast {
    constructor() {
        this._subscribers = new Set();
    }
    /**
     * @desc Subscribe to the broadcast
     * @param handler - The handler to call when the broadcast is published
     */
    subscribe(handler) {
        this._subscribers.add(handler);
        return {
            /**
             * @desc Unsubscribe from the broadcast
             */
            unsubscribe: () => {
                this._subscribers.delete(handler);
            }
        };
    }
    /**
     * @desc Publish to the broadcast
     * @param data - The data to publish
     */
    publish(data) {
        let result;
        for (const subscriber of this._subscribers) {
            try {
                result = subscriber(data);
                if (result)
                    break;
            }
            catch (e) {
                throw e;
            }
        }
        return result;
    }
    /**
     * @dec clears all subscribers
     */
    clear() {
        this._subscribers.clear();
    }
}
exports.Broadcast = Broadcast;
class Subject extends Broadcast {
    constructor(value) {
        super();
        this._value = value;
    }
    /**
     * @desc Get the current value of the subject
     */
    get value() {
        return this._value;
    }
    /**
     * @desc Get the list of observers
     * @returns The list of observers
     */
    get observers() {
        return this._subscribers;
    }
    /**
     * @desc Subscribe to the subject
     */
    subscribe(handler) {
        handler(this._value);
        return super.subscribe(handler);
    }
    /**
     * @desc Publish to the subject
     */
    publish(data) {
        if (this._value !== data) {
            this._value = data;
            return super.publish(data);
        }
    }
}
exports.Subject = Subject;
class EventPubSub {
    constructor() {
        this._subscribers = new Set();
    }
    /**
     * @desc Subscribe to the event subject
     * @param event - The event to subscribe to
     * @param handler - The handler to call when the event subject is published
     */
    subscribe(event, handler) {
        const subscriber = (eventData) => {
            if (eventData.type === event)
                return handler(eventData.data);
        };
        this._subscribers.add(subscriber);
        return {
            /**
             * @desc Unsubscribe from the event subject
             */
            unsubscribe: () => {
                this._subscribers.delete(subscriber);
            }
        };
    }
    /**
     * @desc Publish to the event subject
     * @param event - The event to publish
     * @param data - The data to publish
     */
    publish(event, data) {
        for (const subscriber of this._subscribers) {
            try {
                subscriber({ type: event, data });
            }
            catch (e) {
                throw e;
            }
        }
    }
    /**
     * @desc Subscribe to all events
     * @param handler - The handler to call when the event subject is published
     */
    subscribeAll(handler) {
        const subscriber = (eventData) => {
            return handler(eventData.data);
        };
        this._subscribers.add(subscriber);
        return {
            /**
             * @desc Unsubscribe from the event subject
             */
            unsubscribe: () => {
                this._subscribers.delete(subscriber);
            }
        };
    }
    /**
     * @desc Complete the event subject
     */
    complete() {
        this._subscribers.clear();
        if (this._onComplete)
            this._onComplete();
    }
    /**
     * @desc Subscribe to the event subject completion
     * @param handler - The handler to call when the event subject is completed
     */
    onComplete(handler) {
        this._onComplete = handler;
    }
}
exports.EventPubSub = EventPubSub;
