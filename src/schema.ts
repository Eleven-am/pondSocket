import { z } from 'zod';

import { ClientActions, ChannelReceiver } from './enums';

export const clientMessageSchema = z.object({
    event: z.string(),
    requestId: z.string(),
    channelName: z.string(),
    payload: z.record(z.any()),
    action: z.nativeEnum(ClientActions),
    addresses: z.union([z.nativeEnum(ChannelReceiver), z.array(z.string())]).optional(),
});

export type ClientMessage = z.infer<typeof clientMessageSchema>;
