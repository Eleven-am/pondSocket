import { createParamDecorator } from '../helpers/createParamDecorator';

export const GetJoinResponse = createParamDecorator(
    (data: void, context) => {
        const joinResponse = context.joinResponse;

        if (!joinResponse) {
            throw new Error('Invalid decorator usage: GetJoinResponse');
        }

        return joinResponse;
    },
);
