import { createParamDecorator } from '../helpers/createParamDecorator';

export const GetConnectionHeaders = createParamDecorator(
    (data: void, context) => {
        const connection = context.connection;

        if (!connection) {
            throw new Error('Invalid decorator usage: GetConnectionHeaders');
        }

        return connection.headers;
    },
);
