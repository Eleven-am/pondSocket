import { uuid, PondObject, Subject, Unsubscribe } from '@eleven-am/pondsocket-common';
import Redis from 'ioredis';

import {
    InternalChannelEvent,
    LeaveRedisEvent,
    StateChange,
    ChannelMessage,
    Client,
    StateEvent,
    RedisOptions,
} from './types';

export class RedisClient {
    readonly TTL_REFRESH_INTERVAL = 30 * 1000;

    readonly INSTANCE_TTL = 90;

    readonly #redisClient: Redis;

    readonly #pubClient: Redis;

    readonly #subClient: Redis;

    readonly #instanceId: string;

    readonly #assignsPublisher: Subject<StateChange>;

    readonly #presencePublisher: Subject<StateChange>;

    #userLeavesPublisher: Subject<LeaveRedisEvent>;

    #channelMessagePublisher: Subject<ChannelMessage>;

    #ttlRefreshInterval: NodeJS.Timeout | undefined;

    constructor (redisOptions: RedisOptions) {
        this.#redisClient = new Redis(redisOptions);
        this.#pubClient = new Redis(redisOptions);
        this.#subClient = new Redis(redisOptions);
        this.#assignsPublisher = new Subject<StateChange>();
        this.#presencePublisher = new Subject<StateChange>();
        this.#userLeavesPublisher = new Subject<LeaveRedisEvent>();
        this.#channelMessagePublisher = new Subject<ChannelMessage>();
        this.#instanceId = uuid();
    }

    get #presence_changes_channel () {
        return 'presence_changes';
    }

    get #assigns_changes_channel () {
        return 'assigns_changes';
    }

    get #channel_messages_channel () {
        return 'channel_messages';
    }

    get #user_leaves_channel () {
        return 'user_leaves';
    }

    buildClient (endpointId: string) {
        return (channelId: string): Client => ({
            channelId,
            getPresenceCache: this.#getPresenceCache.bind(this, endpointId, channelId),
            getAssignsCache: this.#getAssignsCache.bind(this, endpointId, channelId),
            publishPresenceChange: this.#publishPresenceChange.bind(this, endpointId, channelId),
            publishAssignsChange: this.#publishAssignsChange.bind(this, endpointId, channelId),
            publishChannelMessage: this.#publishChannelMessage.bind(this, endpointId, channelId),
            publishUserLeave: this.#publishUserLeave.bind(this, endpointId, channelId),
            subscribeToUserLeaves: this.#subscribeToUserLeaves.bind(this, endpointId, channelId),
            subscribeToPresenceChanges: this.#subscribeToCacheChanges.bind(this, endpointId, channelId, true),
            subscribeToAssignsChanges: this.#subscribeToCacheChanges.bind(this, endpointId, channelId, false),
            subscribeToChannelMessages: this.#subscribeToChannelMessages.bind(this, endpointId, channelId),
        });
    }

    async initialize () {
        this.#handleErrors();
        this.#startTTLRefresh();

        await this.#registerInstance();
        await this.#subscribeToChannels();

        process.on('SIGINT', this.#handleExit.bind(this));
        process.on('SIGTERM', this.#handleExit.bind(this));
    }

    async shutdown () {
        clearInterval(this.#ttlRefreshInterval);
        await this.#unsubscribeFromChannels();
        await this.#unregisterInstance();
        await this.#cleanup();
    }

    async #cleanup () {
        const pipeline = this.#redisClient.pipeline();
        const presenceKeys = await this.#redisClient.keys('presence_cache:*');

        presenceKeys.forEach((key) => pipeline.del(key));
        const assignsKeys = await this.#redisClient.keys('assigns_cache:*');

        assignsKeys.forEach((key) => pipeline.del(key));
        await pipeline.exec();
    }

    #handleErrors () {
        this.#redisClient.on('error', (err) => console.error('Redis client error:', err));
        this.#pubClient.on('error', (err) => console.error('Redis pub client error:', err));
        this.#subClient.on('error', (err) => console.error('Redis sub client error:', err));
    }

    #getPresenceCacheChannel (endpointId: string, channelId: string) {
        return `presence_cache:${endpointId}:${channelId}`;
    }

    #getAssignsCacheChannel (endpointId: string, channelId: string) {
        return `assigns_cache:${endpointId}:${channelId}`;
    }

    #publishPresenceChange (endpointId: string, channelId: string, userId: string, state: PondObject | null) {
        const message: StateChange = {
            userId,
            channelId,
            endpointId,
            state,
        };

        const key = this.#presence_changes_channel;
        const cacheKey = this.#getPresenceCacheChannel(message.endpointId, message.channelId);

        return this.#publishCacheMessage(key, cacheKey, message);
    }

    #publishAssignsChange (endpointId: string, channelId: string, userId: string, state: PondObject | null) {
        const message: StateChange = {
            userId,
            channelId,
            endpointId,
            state,
        };

        const key = this.#assigns_changes_channel;
        const cacheKey = this.#getAssignsCacheChannel(message.endpointId, message.channelId);

        return this.#publishCacheMessage(key, cacheKey, message);
    }

    async #publishChannelMessage (endpointId: string, channelId: string, message: InternalChannelEvent) {
        const messageData = JSON.stringify({
            endpointId,
            channelId,
            message,
        });

        await this.#pubClient.publish(this.#channel_messages_channel, messageData);
    }

    async #publishUserLeave (endpointId: string, channelId: string, userId: string) {
        const message = JSON.stringify({
            endpointId,
            channelId,
            userId,
        });

        await this.#pubClient.publish(this.#user_leaves_channel, message);
    }

    #getPresenceCache (endpointId: string, channelId: string) {
        const cacheKey = this.#getPresenceCacheChannel(endpointId, channelId);

        return this.#readCachedData(cacheKey);
    }

    #getAssignsCache (endpointId: string, channelId: string) {
        const cacheKey = this.#getAssignsCacheChannel(endpointId, channelId);

        return this.#readCachedData(cacheKey);
    }

    async #sendHeartbeat () {
        await this.#redisClient.expire(`instance:${this.#instanceId}`, this.INSTANCE_TTL);
    }

    #startTTLRefresh () {
        this.#ttlRefreshInterval = setInterval(() => this.#sendHeartbeat(), this.TTL_REFRESH_INTERVAL);
    }

    async #registerInstance () {
        const multi = this.#redisClient.multi();

        multi.sadd('distributed_instances:', this.#instanceId);
        multi.setex(`instance:${this.#instanceId}`, this.INSTANCE_TTL, '1');
        await multi.exec();
    }

    async #unregisterInstance () {
        const multi = this.#redisClient.multi();

        multi.srem('distributed_instances', this.#instanceId);
        multi.del(`instance:${this.#instanceId}`);
        multi.scard('distributed_instances');
        const results = await multi.exec();

        if (results && results[2] && results[2][1] === 0) {
            // No more instances, clean up
        }
    }

    async #unsubscribeFromChannels () {
        await this.#subClient.unsubscribe(
            this.#presence_changes_channel,
            this.#assigns_changes_channel,
            this.#channel_messages_channel,
            this.#user_leaves_channel,
        );
    }

    #subscribeToChannels () {
        return new Promise<void>((resolve, reject) => {
            this.#subClient.subscribe(
                this.#presence_changes_channel,
                this.#assigns_changes_channel,
                this.#channel_messages_channel,
                this.#user_leaves_channel,
                (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                },
            );

            this.#subClient.on('message', this.#handleRedisMessage.bind(this));
        });
    }

    #handleRedisMessage (channel: string, message: string) {
        const data = JSON.parse(message);

        switch (channel) {
            case this.#presence_changes_channel:
                this.#presencePublisher.publish(data);
                break;
            case this.#assigns_changes_channel:
                this.#assignsPublisher.publish(data);
                break;
            case this.#channel_messages_channel:
                this.#channelMessagePublisher.publish(data);
                break;
            case this.#user_leaves_channel:
                this.#userLeavesPublisher.publish(data);
                break;
            default:
                throw new Error(`Unknown channel: ${channel}`);
        }
    }

    async #publishCacheMessage (key: string, cacheKey: string, message: StateChange) {
        const messageData = JSON.stringify(message);

        if (message.state) {
            await this.#redisClient.hset(cacheKey, message.userId, JSON.stringify(message.state));
        } else {
            await this.#redisClient.hdel(cacheKey, message.userId);
        }

        await this.#pubClient.publish(key, messageData);
    }

    async #readCachedData (cacheKey: string) {
        try {
            const data = await this.#redisClient.hgetall(cacheKey);

            return new Map<string, PondObject>(Object.entries(data).map(([key, value]) => [key, JSON.parse(value)]));
        } catch (error) {
            console.error(error);

            return new Map<string, PondObject>();
        }
    }

    #subscribeToCacheChanges (endpoint: string, channel: string, presence: boolean, callback: (data: StateEvent) => void): Unsubscribe {
        const subject = presence ? this.#presencePublisher : this.#assignsPublisher;

        return subject.subscribe(({ endpointId, channelId, ...data }) => {
            if (endpointId === endpoint && channelId === channel) {
                return callback(data);
            }
        });
    }

    #subscribeToChannelMessages (endpoint: string, channel: string, callback: (data: InternalChannelEvent) => void): Unsubscribe {
        return this.#channelMessagePublisher.subscribe(({ endpointId, channelId, message }) => {
            if (endpointId === endpoint && channelId === channel) {
                return callback(message);
            }
        });
    }

    #subscribeToUserLeaves (endpoint: string, channel: string, callback: (data: string) => void): Unsubscribe {
        return this.#userLeavesPublisher.subscribe(({ endpointId, channelId, userId }) => {
            if (endpointId === endpoint && channelId === channel) {
                return callback(userId);
            }
        });
    }

    async #handleExit () {
        try {
            await this.shutdown();
            process.exit(0);
        } catch (error) {
            process.exit(1);
        }
    }
}
