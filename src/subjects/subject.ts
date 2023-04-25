// eslint-disable-next-line import/no-unresolved
import { Unsubscribe } from '../types';

type Subscriber<T> = (message: T) => void;

export class SimpleSubject<T> {
    readonly #observers: Set<Subscriber<T>>;

    constructor () {
        this.#observers = new Set<Subscriber<T>>();
    }

    subscribe (observer: Subscriber<T>): Unsubscribe {
        this.#observers.add(observer);

        return () => this.#observers.delete(observer);
    }

    publish (message: T) {
        this.#observers.forEach((observer) => observer(message));
    }

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

    public get value () {
        return this.#lastMessage;
    }

    publish (message: T) {
        this.#lastMessage = message;
        super.publish(message);
    }

    subscribe (observer: Subscriber<T>): Unsubscribe {
        if (this.#lastMessage) {
            observer(this.#lastMessage);
        }

        return super.subscribe(observer);
    }
}

export class Subject<T> extends SimpleSubject<T> {
    readonly #subscriptions: Record<string, Unsubscribe> = {};

    subscribeWith (identifier: string, observer: Subscriber<T>): void {
        this.#subscriptions[identifier] = super.subscribe(observer);
    }

    unsubscribe (identifier: string) {
        this.#subscriptions[identifier]?.();
        delete this.#subscriptions[identifier];
    }

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

    subscribeWith (identifier: string, observer: Subscriber<T>): void {
        if (this.#lastMessage) {
            observer(this.#lastMessage);
        }

        super.subscribeWith(identifier, observer);
    }

    publish (message: T) {
        this.#lastMessage = message;
        super.publish(message);
    }
}
