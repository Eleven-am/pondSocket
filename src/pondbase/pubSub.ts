export type Anything<A = any> = A | undefined | void | Promise<void> | null;

interface EventSubjectEvent<T> {
    type: string;
    data: T;
}

export type Subscription = {
    unsubscribe: () => void;
}

export class Broadcast<T, A> {
    private _subscribers = new Set<(data: T) => Anything<A>>();

    /**
     * @desc Subscribe to the broadcast
     * @param handler - The handler to call when the broadcast is published
     */
    public subscribe(handler: (data: T) => Anything<A>): Subscription {
        this._subscribers.add(handler);

        return {
            /**
             * @desc Unsubscribe from the broadcast
             */
            unsubscribe: () => {
                this._subscribers.delete(handler);
            }
        }
    }

    /**
     * @desc Publish to the broadcast
     * @param data - The data to publish
     */
    public publish(data: T) {
        let result: Anything<A>;
        for (const subscriber of this._subscribers) {
            try {
                result = subscriber(data);
                if (result)
                    break;
            } catch (e) {
                throw e;
            }
        }

        return result;
    }
}

export class Subject<T, A> extends Broadcast<T, A> {
    private _value: T | undefined;

    constructor(value: T) {
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
    public subscribe(handler: (data: T) => Anything<A>): Subscription {
        handler(this._value!);
        return super.subscribe(handler);
    }

    /**
     * @desc Publish to the subject
     */
    public publish(data: T) {
        if (this._value !== data) {
            this._value = data;
            return super.publish(data);
        }
    }
}

export class EventPubSub<T, A> {
    private _subscribers = new Set<(event: EventSubjectEvent<T>) => Anything<A>>();
    private _onComplete: (() => void) | undefined;

    /**
     * @desc Subscribe to the event subject
     * @param event - The event to subscribe to
     * @param handler - The handler to call when the event subject is published
     */
    public subscribe(event: string, handler: (data: T) => Anything<A>): Subscription {
        const subscriber = (eventData: EventSubjectEvent<T>) => {
            if (eventData.type === event)
                return handler(eventData.data);
        }

        this._subscribers.add(subscriber);

        return {
            /**
             * @desc Unsubscribe from the event subject
             */
            unsubscribe: () => {
                this._subscribers.delete(subscriber);
            }
        }
    }

    /**
     * @desc Publish to the event subject
     * @param event - The event to publish
     * @param data - The data to publish
     */
    public publish(event: string, data: T) {
        for (const subscriber of this._subscribers) {
            try {
               subscriber({type: event, data});
            } catch (e) {
                throw e;
            }
        }
    }

    /**
     * @desc Subscribe to all events
     * @param handler - The handler to call when the event subject is published
     */
    public subscribeAll(handler: (event: T) => Anything<A>): Subscription {
        const subscriber = (eventData: EventSubjectEvent<T>) => {
            return handler(eventData.data);
        }

        this._subscribers.add(subscriber);

        return {
            /**
             * @desc Unsubscribe from the event subject
             */
            unsubscribe: () => {
                this._subscribers.delete(subscriber);
            }
        }
    }

    /**
     * @desc Complete the event subject
     */
    public complete() {
        this._subscribers.clear();
        if (this._onComplete)
            this._onComplete();
    }

    /**
     * @desc Subscribe to the event subject completion
     * @param handler - The handler to call when the event subject is completed
     */
    public onComplete(handler: () => void) {
        this._onComplete = handler;
    }
}
