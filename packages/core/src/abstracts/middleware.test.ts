import { Middleware } from './middleware';

describe('Middleware', () => {
    it('should be able to add middleware to the stack', () => {
        const middleware = new Middleware();

        middleware.use(() => {});
        expect(middleware.length).toBe(1);
    });

    it('should be able to run middleware', async () => {
        const middleware = new Middleware();
        const mock = jest.fn();

        middleware.use(mock);
        await middleware.run({}, {} as any, () => {});
        expect(mock).toHaveBeenCalled();
    });

    it('should be able to run multiple middleware', async () => {
        const middleware = new Middleware();
        const mock = jest.fn();

        middleware.use((_, __, next) => {
            mock('first');
            next();
        });

        middleware.use((_, __, next) => {
            mock('second');
            next();
        });
        await middleware.run({}, {} as any, () => {});
        expect(mock).toHaveBeenCalledTimes(2);
        expect(mock.mock.calls[0][2]).toBe(mock.mock.calls[1][2]);
    });

    it('should be merge middleware in the correct order', () => {
        const middleware = new Middleware();
        const mock = jest.fn();

        middleware.use(mock);
        middleware.use(mock);
        const middleware2 = new Middleware(middleware);

        expect(middleware2.length).toBe(2);
    });

    it('should call the final function when the middleware stack is empty', async () => {
        const middleware = new Middleware();
        const mock = jest.fn();

        await middleware.run({}, {} as any, mock);
        expect(mock).toHaveBeenCalled();
    });

    it('should be able to run middleware in the correct order when using a second middleware', async () => {
        const middleware = new Middleware();
        const mock = jest.fn();

        middleware.use((_, __, next) => {
            mock('first');
            next();
        });

        middleware.use((_, __, next) => {
            mock('second');
            next();
        });
        const middleware2 = new Middleware(middleware);

        await middleware2.run({}, {} as any, () => {});
        expect(mock.mock.calls[0][2]).toBe(mock.mock.calls[1][2]);
    });
});
