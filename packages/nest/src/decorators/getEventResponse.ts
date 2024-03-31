import { createParamDecorator } from '../helpers/createParamDecorator';

export const GetEventResponse = createParamDecorator(
    (data: void, context) => {
        const eventResponse = context.eventResponse;

        if (!eventResponse) {
            throw new Error('Invalid decorator usage: GetEventResponse');
        }

        return eventResponse;
    },
);
