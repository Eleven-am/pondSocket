import { createParamDecorator } from '../helpers/createParamDecorator';

export const GetConnectionRequest = createParamDecorator(
    (data: void, context) => {
        const connectionRequest = context.connection;

        if (!connectionRequest) {
            throw new Error('Invalid decorator usage: GetConnectionRequest');
        }

        return connectionRequest;
    },
);
