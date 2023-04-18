import { Subject, BehaviorSubject, SimpleSubject, SimpleBehaviorSubject } from './subjectUtils';

describe('Subject', () => {
    let testSubject: Subject<number>;
    let observer1: jest.Mock;
    let observer2: jest.Mock;

    beforeEach(() => {
        testSubject = new Subject<number>();
        observer1 = jest.fn();
        observer2 = jest.fn();
        testSubject.subscribe('observer1', observer1);
        testSubject.subscribe('observer2', observer2);
    });

    afterEach(() => {
        testSubject.unsubscribe('observer1');
        testSubject.unsubscribe('observer2');
    });

    it('should notify all subscribers when next is called', () => {
        const message = 10;

        testSubject.next(message);
        expect(observer1).toHaveBeenCalledWith(message);
        expect(observer2).toHaveBeenCalledWith(message);
    });

    it('should unsubscribe an observer when unsubscribe is called', () => {
        const identifier = 'observer1';

        testSubject.unsubscribe(identifier);
        expect(testSubject['_observers'].has(identifier)).toBe(false);
    });
});

describe('BehaviorSubject', () => {
    let testSubject: BehaviorSubject<number>;
    let observer1: jest.Mock;
    let observer2: jest.Mock;

    beforeEach(() => {
        testSubject = new BehaviorSubject<number>();
        observer1 = jest.fn();
        observer2 = jest.fn();
        testSubject.subscribe('observer1', observer1);
        testSubject.subscribe('observer2', observer2);
    });

    afterEach(() => {
        testSubject.unsubscribe('observer1');
        testSubject.unsubscribe('observer2');
    });

    it('should notify all subscribers when next is called', () => {
        const message = 10;

        testSubject.next(message);
        expect(observer1).toHaveBeenCalledWith(message);
        expect(observer2).toHaveBeenCalledWith(message);
    });

    it('should unsubscribe an observer when unsubscribe is called', () => {
        const identifier = 'observer1';

        testSubject.unsubscribe(identifier);
        expect(testSubject['_observers'].has(identifier)).toBe(false);
    });

    it('should notify new subscribers with the last message when subscribe is called', () => {
        const message = 10;

        testSubject.next(message);
        const newObserver: jest.Mock = jest.fn();

        testSubject.subscribe('newObserver', newObserver);
        expect(newObserver).toHaveBeenCalledWith(message);
    });
});

describe('SimpleSubject', () => {
    let testSubject: SimpleSubject<number>;
    let observer1: jest.Mock;
    let observer2: jest.Mock;

    beforeEach(() => {
        testSubject = new SimpleSubject<number>();
        observer1 = jest.fn();
        observer2 = jest.fn();
        testSubject.subscribe(observer1);
        testSubject.subscribe(observer2);
    });

    afterEach(() => {
        testSubject.next(0);
    });

    it('should notify all subscribers when publish is called', () => {
        const message = 10;

        testSubject.next(message);
        expect(observer1).toHaveBeenCalledWith(message);
        expect(observer2).toHaveBeenCalledWith(message);
    });

    it('should unsubscribe an observer when unsubscribe is called', () => {
        const unsubscribe = testSubject.subscribe(observer1);

        unsubscribe();
        expect(testSubject['_observers'].size).toBe(1);
    });
});


describe('SimpleBehaviorSubject', () => {
    let testSubject: SimpleBehaviorSubject<number>;
    let observer1: jest.Mock;
    let observer2: jest.Mock;

    beforeEach(() => {
        testSubject = new SimpleBehaviorSubject<number>(0);
        observer1 = jest.fn();
        observer2 = jest.fn();
        testSubject.subscribe(observer1);
        testSubject.subscribe(observer2);
    });

    afterEach(() => {
        testSubject.next(0);
    });

    it('should notify all subscribers when publish is called', () => {
        const message = 10;

        testSubject.next(message);
        expect(observer1).toHaveBeenCalledWith(message);
        expect(observer2).toHaveBeenCalledWith(message);
    });

    it('should unsubscribe an observer when unsubscribe is called', () => {
        const unsubscribe = testSubject.subscribe(observer1);

        unsubscribe();
        expect(testSubject['_observers'].size).toBe(1);
    });

    it('should notify new subscribers with the last message when subscribe is called', () => {
        const message = 10;

        testSubject.next(message);
        const newObserver: jest.Mock = jest.fn();

        testSubject.subscribe(newObserver);
        expect(newObserver).toHaveBeenCalledWith(message);
    });

    it('should return the last message when value is called', () => {
        const message = 10;

        testSubject.next(message);
        expect(testSubject.value).toBe(message);
    });
});

