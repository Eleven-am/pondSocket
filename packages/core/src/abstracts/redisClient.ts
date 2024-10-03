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
import { RedisError } from '../errors/redisError';


export class RedisClient {
    readonly #heartbeatInterval: number;

    readonly #cleanupInterval: number;

    readonly #instanceTtl: number;

    readonly #redisClient: Redis;

    readonly #pubClient: Redis;

    readonly #subClient: Redis;

    readonly #instanceId: string;

    readonly #assignsPublisher: Subject<StateChange>;

    readonly #presencePublisher: Subject<StateChange>;

    #userLeavesPublisher: Subject<LeaveRedisEvent>;

    #channelMessagePublisher: Subject<ChannelMessage>;

    #heartbeatTimer: NodeJS.Timeout | undefined;

    #cleanupTimer: NodeJS.Timeout | undefined;

    constructor (config: RedisOptions) {
        this.#instanceTtl = config.instanceTtl ?? 90;
        this.#heartbeatInterval = config.heartbeatInterval ?? 10 * 1000;
        this.#cleanupInterval = config.cleanupInterval ?? 60 * 1000;

        this.#redisClient = new Redis(config);
        this.#pubClient = new Redis(config);
        this.#subClient = new Redis(config);
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
        await this.#registerInstance();
        this.#startHeartbeat();
        this.#startPeriodicCleanup();
        await this.#subscribeToChannels();

        process.on('SIGINT', this.#handleExit.bind(this));
        process.on('SIGTERM', this.#handleExit.bind(this));
    }

    async shutdown () {
        clearInterval(this.#heartbeatTimer);
        clearInterval(this.#cleanupTimer);
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
        return `presence_cache:${this.#instanceId}:${endpointId}:${channelId}`;
    }

    #getAssignsCacheChannel (endpointId: string, channelId: string) {
        return `assigns_cache:${this.#instanceId}:${endpointId}:${channelId}`;
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
        return this.#readCachedData(endpointId, channelId, 'presence_cache:*');
    }

    #getAssignsCache (endpointId: string, channelId: string) {
        return this.#readCachedData(endpointId, channelId, 'assigns_cache:*');
    }

    async #registerInstance () {
        const multi = this.#redisClient.multi();

        multi.sadd('distributed_instances', this.#instanceId);
        multi.set(`heartbeat:${this.#instanceId}`, Date.now().toString(), 'EX', this.#instanceTtl);

        try {
            await multi.exec();
        } catch (error) {
            throw new RedisError('Error registering instance');
        }
    }

    async #unregisterInstance () {
        const multi = this.#redisClient.multi();

        multi.srem('distributed_instances', this.#instanceId);
        multi.del(`heartbeat:${this.#instanceId}`);

        try {
            await multi.exec();
        } catch {
            // no-op as we're shutting down
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

    #startHeartbeat () {
        this.#heartbeatTimer = setInterval(async () => {
            try {
                await this.#redisClient.set(`heartbeat:${this.#instanceId}`, Date.now().toString(), 'EX', this.#instanceTtl);
            } catch (error) {
                throw new RedisError('Error setting heartbeat');
            }
        }, this.#heartbeatInterval);
    }

    #startPeriodicCleanup () {
        this.#cleanupTimer = setInterval(async () => {
            try {
                await this.#performConsistencyCheck();
            } catch (error) {
                throw new RedisError('Error performing consistency check');
            }
        }, this.#cleanupInterval);
    }

    async #performConsistencyCheck () {
        const activeInstances = await this.#getActiveInstances();
        const allKeys = await this.#redisClient.keys('*_cache:*');

        for (const key of allKeys) {
            const [_, instanceId] = key.split(':');

            if (!activeInstances.has(instanceId)) {
                await this.#redisClient.del(key);
            }
        }
    }

    async #getActiveInstances (): Promise<Set<string>> {
        const instances = await this.#redisClient.smembers('distributed_instances');
        const activeInstances = new Set<string>();

        for (const instanceId of instances) {
            const lastHeartbeat = await this.#redisClient.get(`heartbeat:${instanceId}`);

            if (lastHeartbeat && Date.now() - parseInt(lastHeartbeat, 10) < this.#instanceTtl * 1000) {
                activeInstances.add(instanceId);
            } else {
                await this.#redisClient.srem('distributed_instances', instanceId);
                await this.#redisClient.del(`heartbeat:${instanceId}`);
            }
        }

        return activeInstances;
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

    async #readCachedData (endpointId: string, channelId: string, cacheKey: 'presence_cache:*' | 'assigns_cache:*'): Promise<Map<string, PondObject>> {
        const response = new Map<string, PondObject>();
        const activeInstances = new Set(await this.#redisClient.smembers('distributed_instances'));

        let cursor = '0';

        do {
            const [nextCursor, keys] = await this.#redisClient.scan(cursor, 'MATCH', cacheKey, 'COUNT', '100');

            cursor = nextCursor;

            const pipeline = this.#redisClient.pipeline();

            keys.forEach((key) => {
                const [_, instanceId, keyEndpointId, keyChannelId] = key.split(':');

                if (keyEndpointId === endpointId && keyChannelId === channelId) {
                    if (activeInstances.has(instanceId)) {
                        pipeline.hgetall(key);
                    } else {
                        pipeline.del(key);
                    }
                }
            });

            const results = await pipeline.exec();

            if (results) {
                results.forEach(([error, data]) => {
                    if (!error && data && typeof data === 'object') {
                        Object.entries(data)
                            .forEach(([userId, value]) => {
                                try {
                                    const parsedData = JSON.parse(value as string);

                                    if (typeof parsedData === 'object' && parsedData !== null) {
                                        response.set(userId, parsedData as PondObject);
                                    }
                                } catch (e) {
                                    throw new RedisError('Error parsing cached data');
                                }
                            });
                    }
                });
            }
        } while (cursor !== '0');

        return response;
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
