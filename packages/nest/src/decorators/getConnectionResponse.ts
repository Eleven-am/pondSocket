import { createParamDecorator } from '../helpers/createParamDecorator';

export const GetConnectionResponse = createParamDecorator(
    (data: void, context) => {
        const connectionResponse = context.connectionResponse;

        if (!connectionResponse) {
            throw new Error('Invalid decorator usage: GetConnectionResponse');
        }

        return connectionResponse;
    },
);
