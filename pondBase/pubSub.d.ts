export declare class Subscription {
    unsubscribe(): void;
}

export declare class Broadcast<T, A> {

    /**
     * @desc Subscribe to the broadcast
     * @param handler - The handler to call when the broadcast is published
     */
    subscribe(handler: (data: T) => A): Subscription;

    /**
     * @desc Gets the number of subscribers
     */
    public get subscriberCount(): number;

    /**
     * @desc Publish to the broadcast
     * @param data - The data to publish
     */
    publish(data: T): A | undefined;
}

export declare class Subject<T, A> extends Broadcast<T, A> {
    constructor(value: T);

    /**
     * @desc Get the current value of the subject
     */
    get value(): T;

    /**
     * @desc Subscribe to the subject
     * @param handler - The handler to call when the subject is published
     */
    subscribe(handler: (data: T) => A): Subscription;

    /**
     * @desc Publish to the subject
     * @param data - The data to publish
     */
    publish(data: T): A | undefined;
}

export declare class EventPubSub<T, A> {

    /**
     * @desc Subscribe to the event subject
     * @param event - The event to subscribe to
     * @param handler - The handler to call when the event subject is published
     */
    subscribe(event: string, handler: (data: T) => A): Subscription;

    /**
     * @desc Publish to the event subject
     * @param event - The event to publish
     * @param data - The data to publish
     */
    publish(event: string, data: T): void;

    /**
     * @desc Subscribe to all events
     * @param handler - The handler to call when the event subject is published
     */
    subscribeAll(handler: (event: T) => A): Subscription;

    /**
     * @desc Complete the event subject
     */
    complete(): void;

    /**
     * @desc Subscribe to the event subject completion
     * @param handler - The handler to call when the event subject is completed
     */
    onComplete(handler: () => void): void;
}
