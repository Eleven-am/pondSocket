import {PondResponse} from "./pondResponse";
import {ResponseResolver} from "./types";
import {ResponsePicker} from "../pondbase";

describe('PondResponse', () => {
    it('should be defined', () => {
        expect(PondResponse).toBeDefined();
    });

    it('should call the resolver function on reject', (done) => {
        const resolver = jest.fn()

        const assigns = {
            assigns: {},
            presence: {},
            channelData: {},
        }

        const response = new PondResponse({}, assigns, resolver);
        response.reject();

        setTimeout(() => {
            expect(resolver).toBeCalled();
            done();
        }, 100);
    });

    it('should return an error object on reject', () => {
        const resolver = (data: any) => {
            expect(data.error).toBeDefined();
        }

        const assigns = {
            assigns: {},
            presence: {},
            channelData: {},
        }

        const response = new PondResponse({}, assigns, resolver);
        response.reject();
    });

    it('should return specified error object on reject', () => {
        const resolver = (data: ResponseResolver) => {
            expect(data.error?.errorMessage).toBe('test');
            expect(data.error?.errorCode).toBe(403);
        }

        const assigns = {
            assigns: {},
            presence: {},
            channelData: {},
        }

        const response = new PondResponse({}, assigns, resolver);
        response.reject('test');
    });

    it('should not return an error object when not rejected', () => {
        const resolver = (data: ResponseResolver) => {
            expect(data.error).toBeUndefined();
        }

        const assigns = {
            assigns: {},
            presence: {},
            channelData: {},
        }

        const response = new PondResponse({}, assigns, resolver);
        response.accept();
    });

    it('should return the specified assigns', () => {
        const resolver = (data: ResponseResolver) => {
            expect(data.assigns.assigns).toEqual({test: 'test1'});
            expect(data.assigns.presence).toEqual({test: 'test2'});
            expect(data.assigns.channelData).toEqual({test: 'test3'});
        }

        const assigns = {
            assigns: {},
            presence: {},
            channelData: {},
        }

        const response = new PondResponse({}, assigns, resolver);
        response.accept({
            assigns: {
                test: 'test1'
            },
            presence: {
                test: 'test2'
            },
            channelData: {
                test: 'test3'
            }
        });
    });

    it('should return the specified assigns but with the message applied CHANNEL', () => {
        const resolver = async (data: ResponseResolver) => {
            expect(data.assigns.assigns).toEqual({test: 'test1'});
            expect(data.assigns.presence).toEqual({test: 'test2'});
            expect(data.assigns.channelData).toEqual({test: 'test3'});
            expect(data.message).toEqual({event: 'test', payload: {message: 'testMessage'}});
            expect(data.error).toBeUndefined();
        }

        const assigns = {
            assigns: {},
            presence: {},
            channelData: {},
        }

        const response = new PondResponse({}, assigns, resolver)
        response.send('test', {message: 'testMessage'}, {
            assigns: {
                test: 'test1'
            },
            presence: {
                test: 'test2'
            },
            channelData: {
                test: 'test3'
            }
        });
    });

    it('should return the specified assigns but with the message applied POND', () => {
        const secondResolver = async (data: ResponseResolver<ResponsePicker.POND>) => {
            expect(data.assigns.assigns).toEqual({test: 'test1'});
            expect(data.message).toEqual({event: 'test', payload: {message: 'testMessage'}});
            expect(data.error).toBeUndefined();
        }

        const assigns = {
            assigns: {},
            presence: {},
            channelData: {},
        }

        const response2 = new PondResponse({}, assigns, secondResolver);
        response2.send('test', {message: 'testMessage'}, {
            assigns: {
                test: 'test1'
            },
        });
    });

    it('should throw an error when you try to double send', () => {
        const resolver = (data: ResponseResolver) => {
            expect(data.assigns.assigns).toEqual({test: 'test1'});
            expect(data.assigns.presence).toEqual({test: 'test2'});
        }

        const assigns = {
            assigns: {},
            presence: {},
            channelData: {},
        }

        const response = new PondResponse({}, assigns, resolver);
        response.accept({
            assigns: {
                test: 'test1'
            },
            presence: {
                test: 'test2'
            },
            channelData: {
                test: 'test3'
            }
        });

        expect(() => {
            response.accept({
                assigns: {
                    test: 'test1'
                },
                presence: {
                    test: 'test2'
                },
                channelData: {
                    test: 'test3'
                }
            });
        }).toThrow();
    })
});
