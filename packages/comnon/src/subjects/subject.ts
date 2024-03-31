import { Subscriber, Unsubscribe } from './types';

export class Subject<T> {
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
