import { createParamDecorator } from '../helpers/createParamDecorator';

export const GetJoinRequest = createParamDecorator(
    (data: void, context) => {
        const joinRequest = context.joinRequest;

        if (!joinRequest) {
            throw new Error('Invalid decorator usage: GetJoinRequest');
        }

        return joinRequest;
    },
);
