// A Subject CLASS that sends a message to all subscribers

type Subscriber<T> = (message: T) => void;
export type Unsubscribe = () => void;

export class Subject<T> {
    private readonly _observers: Map<string, Subscriber<T>>;

    constructor () {
        this._observers = new Map<string, Subscriber<T>>();
    }

    subscribe (identifier: string, observer: Subscriber<T>): void {
        this._observers.set(identifier, observer);
    }

    next (message: T) {
        this._observers.forEach((observer) => observer(message));
    }

    unsubscribe (identifier: string) {
        this._observers.delete(identifier);
    }
}

// A behavior subject CLASS that sends the last message to new subscribers

export class BehaviorSubject<T> extends Subject<T> {
    private _lastMessage: T | undefined;

    next (message: T) {
        this._lastMessage = message;
        super.next(message);
    }

    subscribe (identifier: string, observer: Subscriber<T>): void {
        if (this._lastMessage) {
            observer(this._lastMessage);
        }

        return super.subscribe(identifier, observer);
    }
}


// Simple Subject CLASS
export class SimpleSubject<T> {
    private readonly _observers: Set<Subscriber<T>>;

    constructor () {
        this._observers = new Set<Subscriber<T>>();
    }

    subscribe (observer: Subscriber<T>): Unsubscribe {
        this._observers.add(observer);

        return () => this._observers.delete(observer);
    }

    next (message: T) {
        this._observers.forEach((observer) => observer(message));
    }
}

// Simple BehaviorSubject CLASS
export class SimpleBehaviorSubject<T> extends SimpleSubject<T> {
    private _lastMessage: T;

    constructor (initialValue: T) {
        super();

        this._lastMessage = initialValue;
    }

    public get value () {
        return this._lastMessage;
    }

    next (message: T) {
        this._lastMessage = message;
        super.next(message);
    }

    subscribe (observer: Subscriber<T>): Unsubscribe {
        if (this._lastMessage) {
            observer(this._lastMessage);
        }

        return super.subscribe(observer);
    }
}
