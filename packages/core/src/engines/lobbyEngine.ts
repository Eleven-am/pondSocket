import { PondPath, ChannelEvent } from '@eleven-am/pondsocket-common';

import { ChannelEngine } from './channelEngine';
import { EndpointEngine } from './endpointEngine';
import { Middleware } from '../abstracts/middleware';
import {
    EventHandler,
    BroadcastEvent,
    LeaveCallback,
    OutgoingEventHandler,
    InternalOutgoingEventHandler,
    OutgoingEvent,
} from '../abstracts/types';
import { EventContext } from '../contexts/eventContext';
import { HttpError } from '../errors/httpError';
import { parseAddress } from '../matcher/matcher';
import { Channel } from '../wrappers/channel';


export class LobbyEngine {
    readonly middleware: Middleware<BroadcastEvent, ChannelEngine>;

    leaveCallback: LeaveCallback | undefined;

    readonly #channels: Map<string, ChannelEngine>;

    readonly #outGoingEvents: InternalOutgoingEventHandler[];

    constructor (public parent: EndpointEngine) {
        this.middleware = new Middleware();
        this.#channels = new Map();
        this.#outGoingEvents = [];
    }

    /**
     * Sets the callback for when users leave channels
     */
    onLeave (callback: LeaveCallback) {
        this.leaveCallback = callback;
    }

    /**
     * Attaches a handler for a specific event pattern
     */
    onEvent<Event extends string> (event: PondPath<Event>, handler: EventHandler<Event>) {
        this.middleware.use((requestEvent, channel, next) => {
            const params = parseAddress(event, requestEvent.event);

            if (!params) {
                return next();
            }

            const context = new EventContext(requestEvent, params, channel);


            return handler(context, next);
        });
    }

    /**
     * Attaches a handler for outgoing events
     */
    handleOutgoingEvent<Event extends string> (event: PondPath<Event>, handler: OutgoingEventHandler<Event>) {
        const handlerWrapper: InternalOutgoingEventHandler = async (request, channel, userId) => {
            try {
                const params = parseAddress(event, request.event);

                if (!params) {
                    return true;
                }

                const userData = channel.getUserData(userId);

                const newEvent: OutgoingEvent<any> = {
                    channel,
                    userData,
                    event: params,
                    payload: request.payload,
                };

                const response = await handler(newEvent);

                if (response) {
                    return response;
                }

                return false;
            } catch (error) {
                return false;
            }
        };

        this.#outGoingEvents.push(handlerWrapper);
    }

    /**
     * Internal method to handle outgoing events
     * @param request - The request object
     * @param userId - The user ID
     * @param channel - The channel engine
     */
    async manageOutgoingEvents (request: ChannelEvent, userId: string, channel: ChannelEngine) {
        if (!this.#outGoingEvents.length) {
            return request;
        }

        const promises = this.#outGoingEvents.map((handler) => handler(request, this.wrapChannel(channel), userId));
        const results = await Promise.all(promises);

        if (results.some((result) => result === false)) {
            return null;
        }

        request.payload = results
            .filter((result) => typeof result !== 'boolean')
            .reduce((acc, result) => Object.assign(acc, result), {});

        return request;
    }

    /**
     * Gets or creates a channel by name
     */
    getOrCreateChannel (channelName: string) {
        const oldChannel = this.#getChannel(channelName);

        if (oldChannel) {
            return oldChannel;
        }

        return this.#createChannel(channelName);
    }

    /**
     * Gets a channel by name
     * @throws HttpError if channel not found
     */
    getChannel (channelName: string): ChannelEngine {
        const channel = this.#channels.get(channelName);

        if (!channel) {
            throw new HttpError(404, `Channel ${channelName} not found`);
        }

        return channel;
    }

    /**
     * Creates a Channel wrapper from a ChannelEngine
     * Used by the channel engine for the leave callback
     */
    wrapChannel (engine: ChannelEngine): Channel {
        return new Channel(engine);
    }

    /**
     * Broadcasts an event to all users in a channel
     */
    deleteChannel (channelName: string) {
        const channel = this.#channels.get(channelName);

        if (channel) {
            this.#channels.delete(channelName);
        }
    }

    /**
     * Gets a channel by name or null if not found
     */
    #getChannel (channelName: string): ChannelEngine | null {
        return this.#channels.get(channelName) || null;
    }

    /**
     * Creates a new channel
     */
    #createChannel (channelName: string) {
        // Create the channel engine
        const channel = new ChannelEngine(this, channelName);

        // Add it to the channels map
        this.#channels.set(channelName, channel);

        // Set up a way to remove the channel when it's closed
        // (We'll handle this in the ChannelEngine's close method)
        const handleChannelClosed = () => {
            this.#channels.delete(channelName);
        };

        // Return the new channel engine
        return channel;
    }
}
