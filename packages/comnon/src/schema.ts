import { z } from 'zod';

import { ClientActions } from './enums';

export const clientMessageSchema = z.object({
    event: z.string(),
    requestId: z.string(),
    channelName: z.string(),
    payload: z.record(z.any()),
    action: z.nativeEnum(ClientActions),
});

export type ClientMessage = z.infer<typeof clientMessageSchema>;
