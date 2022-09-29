"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subject = exports.Broadcast = void 0;
class Broadcast {
    _subscribers = new Set();
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
            result = subscriber(data);
            if (result)
                break;
        }
        return result;
    }
}
exports.Broadcast = Broadcast;
class Subject extends Broadcast {
    _value;
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
