import { ConnectionResponse } from './connectionResponse';

describe('EndpointResponse', () => {
    it('should be able to accept', () => {
        const handler = jest.fn();
        const response = new ConnectionResponse(handler);

        response.accept();
        expect(handler).toBeCalledWith({}, {});
    });

    it('should be able to reject', () => {
        const handler = jest.fn();
        const response = new ConnectionResponse(handler);

        response.reject();
        expect(handler).toBeCalledWith({}, { error: { message: 'Message rejected',
            code: 403 } });
    });

    it('should be able to send', () => {
        const handler = jest.fn();
        const response = new ConnectionResponse(handler);

        response.send('test', { test: 'test' });
        expect(handler).toBeCalledWith({}, { message: { event: 'test',
            payload: { test: 'test' } } });
    });

    it('should throw if accept is called twice', () => {
        const handler = jest.fn();
        const response = new ConnectionResponse(handler);

        response.accept();
        expect(() => response.accept()).toThrow();
    });

    it('should throw if reject is called twice', () => {
        const handler = jest.fn();
        const response = new ConnectionResponse(handler);

        response.reject();
        expect(() => response.reject()).toThrow();
    });

    it('should throw if send is called twice', () => {
        const handler = jest.fn();
        const response = new ConnectionResponse(handler);

        response.send('test', { test: 'test' });
        expect(() => response.send('test', { test: 'test' })).toThrow();
    });
});
