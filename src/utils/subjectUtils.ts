// A Subject CLASS that sends a message to all subscribers

type Subscriber<T> = (message: T) => void;

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
