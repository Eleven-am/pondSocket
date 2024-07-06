import { z } from 'zod';

import { ClientActions, PresenceEventTypes, ServerActions, PubSubEvents, ChannelReceiver } from './enums';

export const clientMessageSchema = z.object({
    event: z.string(),
    requestId: z.string(),
    channelName: z.string(),
    payload: z.record(z.any()),
    action: z.nativeEnum(ClientActions),
});

export type ClientMessage = z.infer<typeof clientMessageSchema>;

export const presenceMessageSchema = z.object({
    requestId: z.string(),
    channelName: z.string(),
    event: z.nativeEnum(PresenceEventTypes),
    action: z.literal(ServerActions.PRESENCE),
    payload: z.object({
        presence: z.array(z.record(z.any())),
        changed: z.record(z.any()),
    }),
});

export const serverMessageSchema = z.object({
    event: z.string(),
    requestId: z.string(),
    channelName: z.string(),
    payload: z.record(z.any()),
    action: z.enum([ServerActions.BROADCAST, ServerActions.CONNECT, ServerActions.ERROR, ServerActions.SYSTEM]),
});

export const channelEventSchema = z.union([serverMessageSchema, presenceMessageSchema]);

const presenceCommandSchema = z.object({
    event: z.literal(PubSubEvents.GET_PRESENCE),
    pubSubId: z.string(),
    endpoint: z.string(),
    channel: z.string(),
});

const presenceEventSchema = z.object({
    channel: z.string(),
    pubSubId: z.string(),
    endpoint: z.string(),
    presence: z.record(z.any()),
    event: z.literal(PubSubEvents.PRESENCE),
});

const messageEventSchema = z.object({
    pubSubId: z.string(),
    channel: z.string(),
    message: channelEventSchema,
    recipient: z.union([z.nativeEnum(ChannelReceiver), z.array(z.string())]),
    event: z.literal(PubSubEvents.MESSAGE),
    endpoint: z.string(),
});

export const pubSubEventSchema = z.union([presenceCommandSchema, presenceEventSchema, messageEventSchema]);
