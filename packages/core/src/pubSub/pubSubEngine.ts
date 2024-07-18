import {
    Subject,
    uuid,
    PondPath,
    PubSubEvent,
    ChannelReceivers,
    ChannelEvent,
    UserPresences,
    pubSubEventSchema,
    PubSubEvents,
    Unsubscribe,
} from '@eleven-am/pondsocket-common';
import Redis from 'ioredis';

interface Options {
    redisUrl: string;
    db: number;
}

export interface PubSubClient {
    getPresence: (channel: string) => Promise<UserPresences[]>;
    publish: (recipients: ChannelReceivers, data: ChannelEvent) => void;
    subscribeToPresence: (channel: string, callback: () => UserPresences) => Unsubscribe;
    subscribe: (channel: string, callback: (recipients: ChannelReceivers, data: ChannelEvent) => void) => Unsubscribe;
}

export class PubSubEngine {
    readonly #subscriber: Subject<PubSubEvent>;

    readonly #redis: Redis | null;

    readonly #pubSub: Redis | null;

    readonly #id = uuid();

    readonly #expirationTime = 60;

    readonly #heartbeatInterval = 5000;

    readonly #interval: NodeJS.Timeout;

    constructor (options: Options | null = null) {
        this.#subscriber = new Subject();
        this.#redis = options ? new Redis(options.redisUrl, { db: options.db }) : null;
        this.#pubSub = options ? new Redis(options.redisUrl, { db: options.db }) : null;

        this.#subscribeToChannel();
        this.#interval = setInterval(() => this.#registerInstance(), this.#heartbeatInterval);
    }

    /**
     * @desc Builds a client for the given endpoint
     * @param endpoint - the endpoint to build the client for
     */
    buildClient (endpoint: PondPath<string>) {
        const subscribeToPresence = this.#subscribeToPresence.bind(this, endpoint);
        const getPresence = this.#getPresence.bind(this, endpoint);
        const subscribe = this.#subscribe.bind(this, endpoint);
        const publish = this.#publish.bind(this, endpoint);

        const client: PubSubClient = {
            getPresence,
            publish,
            subscribeToPresence,
            subscribe,
        };

        return client;
    }

    /**
     * @desc Closes the connection
     */
    close () {
        clearInterval(this.#interval);
        this.#redis?.quit();
        this.#pubSub?.quit();
    }

    /**
     * @desc Gets the presence of all active instances
     * @param endpoint - the endpoint to get the presence for
     * @param channel - the channel to get the presence for
     * @private
     */
    async #getPresence (endpoint: PondPath<string>, channel: string) {
        const instances = await this.#getActiveInstances();

        return Promise.all(instances.map((instance) => this.#getPresenceFromInstance(endpoint, channel, instance)));
    }

    /**
     * @desc Registers the instance with the pubSub
     * @private
     */
    #registerInstance () {
        if (!this.#redis) {
            return;
        }

        this.#redis.setex(`app:instance:${this.#id}`, this.#expirationTime, 'active');
    }

    /**
     * @desc Gets all active instances
     * @private
     */
    async #getActiveInstances () {
        if (!this.#redis) {
            return [] as string[];
        }

        const keys = await this.#redis.keys('app:instance:*');

        return keys.map((key) => key.replace('app:instance:', ''))
            .filter((key) => key !== this.#id);
    }

    /**
     * @desc Subscribes to the pubSub channel
     * @private
     */
    #subscribeToChannel () {
        if (!this.#pubSub) {
            return;
        }

        this.#pubSub.subscribe('app:messages', (err) => {
            if (err) {
                console.error('Failed to subscribe: ', err);
            }
        });

        this.#pubSub.on('message', (channel, message) => {
            const data = pubSubEventSchema.parse(JSON.parse(message));

            if (data.pubSubId === this.#id) {
                return;
            }

            this.#subscriber.publish(data as PubSubEvent);
        });
    }

    /**
     * @desc Gets the presence of an instance
     * @param endpoint - the endpoint to get the presence for
     * @param channel - the channel to get the presence for
     * @param instance - the instance to get the presence for
     * @private
     */
    #getPresenceFromInstance (endpoint: PondPath<string>, channel: string, instance: string) {
        return new Promise<UserPresences>((resolve) => {
            const unsubscribe = this.#subscriber.subscribe((data) => {
                if (data.endpoint === endpoint && data.channel === channel && data.event === PubSubEvents.PRESENCE && data.pubSubId === instance) {
                    resolve(data.presence);
                    unsubscribe();
                }
            });
        });
    }

    /**
     * @desc Subscribes to the presence of a channel
     * @param endpoint - the endpoint to subscribe to
     * @param channel - the channel to subscribe to
     * @param handler - the handler to call when the presence is received
     * @private
     */
    #subscribeToPresence (endpoint: PondPath<string>, channel: string, handler: () => UserPresences) {
        return this.#subscriber.subscribe((data) => {
            if (data.endpoint === endpoint && data.channel === channel && data.event === PubSubEvents.GET_PRESENCE) {
                const presence = handler();

                const message: PubSubEvent = {
                    event: PubSubEvents.PRESENCE,
                    pubSubId: this.#id,
                    endpoint,
                    channel,
                    presence,
                };

                this.#pubSub?.publish('app:messages', JSON.stringify(message));
            }
        });
    }

    /**
     * @desc Subscribes to a channel
     * @param endpoint - the endpoint to subscribe to
     * @param channel - the channel to subscribe to
     * @param handler - the handler to call when a message is received
     * @private
     */
    #subscribe (endpoint: PondPath<string>, channel: string, handler: (recipients: ChannelReceivers, data: ChannelEvent) => void) {
        return this.#subscriber.subscribe((data) => {
            if (data.endpoint === endpoint && data.channel === channel && data.event === PubSubEvents.MESSAGE) {
                handler(data.recipient, data.message);
            }
        });
    }

    /**
     * @desc Publishes a message to the channel
     * @param endpoint - the endpoint to publish to
     * @param recipients - the recipients to send the message to
     * @param data - the data to send
     * @private
     */
    #publish (endpoint: PondPath<string>, recipients: ChannelReceivers, data: ChannelEvent) {
        const message: PubSubEvent = {
            event: PubSubEvents.MESSAGE,
            pubSubId: this.#id,
            endpoint,
            channel: data.channelName,
            message: data,
            recipient: recipients,
        };

        this.#redis?.publish('app:messages', JSON.stringify(message));
    }
}
