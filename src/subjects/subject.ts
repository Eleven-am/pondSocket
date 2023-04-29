// eslint-disable-next-line import/no-unresolved
import { Unsubscribe } from '../types';

type Subscriber<T> = (message: T) => void;

export class SimpleSubject<T> {
    readonly #observers: Set<Subscriber<T>>;

    constructor () {
        this.#observers = new Set<Subscriber<T>>();
    }

    /**
     * @desc Subscribes to a subject
     * @param observer - The observer to subscribe
     */
    subscribe (observer: Subscriber<T>): Unsubscribe {
        this.#observers.add(observer);

        return () => this.#observers.delete(observer);
    }

    /**
     * @desc Publishes a message to all subscribers
     * @param message - The message to publish
     */
    publish (message: T) {
        this.#observers.forEach((observer) => observer(message));
    }

    /**
     * @desc Returns the number of subscribers
     */
    get size () {
        return this.#observers.size;
    }
}

export class SimpleBehaviorSubject<T> extends SimpleSubject<T> {
    #lastMessage: T | undefined;

    constructor (initialValue?: T) {
        super();

        this.#lastMessage = initialValue;
    }

    /**
     * @desc Returns the last message published
     */
    public get value () {
        return this.#lastMessage;
    }

    /**
     * @desc Publishes a message to all subscribers
     * @param message - The message to publish
     */
    publish (message: T) {
        this.#lastMessage = message;
        super.publish(message);
    }

    /**
     * @desc Subscribes to a subject
     * @param observer - The observer to subscribe
     */
    subscribe (observer: Subscriber<T>): Unsubscribe {
        if (this.#lastMessage) {
            observer(this.#lastMessage);
        }

        return super.subscribe(observer);
    }
}

export class Subject<T> extends SimpleSubject<T> {
    readonly #subscriptions: Record<string, Unsubscribe> = {};

    /**
     * @desc Subscribes to a subject
     * @param identifier - The identifier of the subscription
     * @param observer - The observer to subscribe
     */
    subscribeWith (identifier: string, observer: Subscriber<T>): void {
        this.#subscriptions[identifier] = super.subscribe(observer);
    }

    /**
     * @desc Unsubscribes from a subject
     * @param identifier - The identifier of the subscription
     */
    unsubscribe (identifier: string) {
        this.#subscriptions[identifier]?.();
        delete this.#subscriptions[identifier];
    }

    /**
     * @desc Checks if a subscription exists
     * @param identifier - The identifier of the subscription
     */
    has (identifier: string) {
        return Boolean(this.#subscriptions[identifier]);
    }
}

export class BehaviorSubject<T> extends Subject<T> {
    #lastMessage: T | undefined;

    constructor (initialValue?: T) {
        super();

        this.#lastMessage = initialValue;
    }

    /**
     * @desc Subscribes to a subject
     * @param identifier - The identifier of the subscription
     * @param observer - The observer to subscribe
     */
    subscribeWith (identifier: string, observer: Subscriber<T>): void {
        if (this.#lastMessage) {
            observer(this.#lastMessage);
        }

        super.subscribeWith(identifier, observer);
    }

    /**
     * @desc Publishes a message to all subscribers
     * @param message - The message to publish
     */
    publish (message: T) {
        this.#lastMessage = message;
        super.publish(message);
    }
}
