import { uuid, Subject, PondObject, Unsubscribe } from '@eleven-am/pondsocket-common';
import Redis from 'ioredis';

import {
    RedisStateEvent,
    ChannelMessage,
    Client,
    StateEvent,
    RedisOptions,
    RedisUserLeaveEvent,
    RedisStateSyncEvent,
    StateSyncEvent,
    InternalChannelEvent,
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

    readonly #assignsPublisher: Subject<RedisStateEvent>;

    readonly #presencePublisher: Subject<RedisStateEvent>;

    readonly #userLeavesPublisher: Subject<RedisUserLeaveEvent>;

    readonly #channelMessagePublisher: Subject<ChannelMessage>;

    readonly #stateSyncPublisher: Subject<RedisStateSyncEvent>;

    #heartbeatTimer: NodeJS.Timeout | undefined;

    #cleanupTimer: NodeJS.Timeout | undefined;

    constructor (config: RedisOptions) {
        this.#instanceTtl = config.instanceTtl ?? 90;
        this.#heartbeatInterval = config.heartbeatInterval ?? 10 * 1000;
        this.#cleanupInterval = config.cleanupInterval ?? 60 * 1000;

        this.#redisClient = new Redis(config);
        this.#pubClient = new Redis(config);
        this.#subClient = new Redis(config);
        this.#assignsPublisher = new Subject<RedisStateEvent>();
        this.#presencePublisher = new Subject<RedisStateEvent>();
        this.#userLeavesPublisher = new Subject<RedisUserLeaveEvent>();
        this.#channelMessagePublisher = new Subject<ChannelMessage>();
        this.#stateSyncPublisher = new Subject<RedisStateSyncEvent>();
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
            publishPresenceChange: this.#publishPresenceChange.bind(this, endpointId, channelId),
            publishAssignsChange: this.#publishAssignsChange.bind(this, endpointId, channelId),
            publishChannelMessage: this.#publishChannelMessage.bind(this, endpointId, channelId),
            publishUserLeave: this.#publishUserLeave.bind(this, endpointId, channelId),
            subscribeToUserLeaves: this.#subscribeToUserLeaves.bind(this, endpointId, channelId),
            subscribeToPresenceChanges: this.#subscribeToCacheChanges.bind(this, endpointId, channelId, true),
            subscribeToAssignsChanges: this.#subscribeToCacheChanges.bind(this, endpointId, channelId, false),
            subscribeToChannelMessages: this.#subscribeToChannelMessages.bind(this, endpointId, channelId),
            subscribeToStateSync: this.#subscribeToStateSync.bind(this, endpointId, channelId),
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
        const batchSize = 1000;

        clearInterval(this.#heartbeatTimer);
        clearInterval(this.#cleanupTimer);
        await this.#unsubscribeFromChannels();
        await this.#unregisterInstance();
        await this.#deleteKeysByPattern(`*_cache:${this.#instanceId}:*`, batchSize);
    }

    #handleErrors () {
        this.#redisClient.on('error', (err) => console.error('Redis client error:', err));
        this.#pubClient.on('error', (err) => console.error('Redis pub client error:', err));
        this.#subClient.on('error', (err) => console.error('Redis sub client error:', err));
    }

    async #registerInstance () {
        const multi = this.#redisClient.multi();
        const now = Date.now().toString();

        multi
            .sadd('distributed_instances', this.#instanceId)
            .set(`heartbeat:${this.#instanceId}`, now, 'EX', this.#instanceTtl)
            .hset(`instance_metadata:${this.#instanceId}`, 'last_seen', now);

        try {
            await multi.exec();
        } catch (error) {
            throw new RedisError('Error registering instance');
        }
    }

    async #unregisterInstance () {
        const multi = this.#redisClient.multi();

        multi
            .srem('distributed_instances', this.#instanceId)
            .del(`heartbeat:${this.#instanceId}`)
            .del(`instance_metadata:${this.#instanceId}`);

        try {
            await multi.exec();
        } catch {
            // no-op as we're shutting down
        }
    }

    async #cleanupDisconnectedClients () {
        const script = `
            local instances = redis.call('SMEMBERS', 'distributed_instances')
            local expired = {}
            
            for _, instance in ipairs(instances) do
                local heartbeat = redis.call('GET', 'heartbeat:' .. instance)
                if not heartbeat then
                    table.insert(expired, instance)
                    redis.call('SREM', 'distributed_instances', instance)
                    redis.call('DEL', 'instance_metadata:' .. instance)
                    
                    -- Cleanup instance data
                    local pattern = '*_cache:' .. instance .. ':*'
                    local cursor = '0'
                    repeat
                        local result = redis.call('SCAN', cursor, 'MATCH', pattern, 'COUNT', 100)
                        cursor = result[1]
                        local keys = result[2]
                        if #keys > 0 then
                            redis.call('DEL', unpack(keys))
                        end
                    until cursor == '0'
                end
            end
            
            return expired
        `;

        try {
            const expiredInstances = await this.#redisClient.eval(script, 0) as string[];

            if (expiredInstances.length > 0) {
                await this.#handleExpiredInstances(expiredInstances);
            }
        } catch (error) {
            console.error('Error cleaning up disconnected clients:', error);
        }
    }

    async #handleExpiredInstances (expiredInstances: string[]) {
        const pattern = `*_cache:(${expiredInstances.join('|')}):*`;
        const keys = await this.#redisClient.keys(pattern);

        const channelPairs = new Set<string>();

        for (const key of keys) {
            const [, , endpointId, channelId] = key.split(':');

            channelPairs.add(`${endpointId}:${channelId}`);
        }

        const promises = Array.from(channelPairs).map((pair) => {
            const [endpointId, channelId] = pair.split(':');


            return this.#emitStateSyncEvent(endpointId, channelId);
        });

        await Promise.all(promises);
    }

    async #performConsistencyCheck () {
        const multi = this.#redisClient.multi();

        // Get both active instances and keys in the same transaction
        const [[, activeInstances], [, allKeys]] = await multi
            .smembers('distributed_instances')
            .keys('*_cache:*')
            .exec() || [];

        const activeSet = new Set(activeInstances as string[]);
        const inactiveKeys = [];
        const uniquePairs = new Set<string>();

        for (const key of allKeys as string[]) {
            const [, instanceId, endpointId, channelId] = key.split(':');

            if (!activeSet.has(instanceId)) {
                inactiveKeys.push(key);
                uniquePairs.add(`${endpointId}:${channelId}`);
            }
        }

        if (inactiveKeys.length > 0) {
            // Use pipeline for batch deletion
            const pipeline = this.#redisClient.pipeline();

            for (const key of inactiveKeys) {
                pipeline.del(key);
            }
            await pipeline.exec();
        }

        const promises = Array.from(uniquePairs).map((pair) => {
            const [endpointId, channelId] = pair.split(':');


            return this.#emitStateSyncEvent(endpointId, channelId);
        });

        await Promise.all(promises);
    }

    #startPeriodicCleanup () {
        this.#cleanupTimer = setInterval(async () => {
            try {
                await this.#cleanupDisconnectedClients();
                await this.#performConsistencyCheck();
            } catch (error) {
                console.error('Error in periodic cleanup:', error);
            }
        }, this.#cleanupInterval);
    }

    #startHeartbeat () {
        this.#heartbeatTimer = setInterval(async () => {
            const multi = this.#redisClient.multi();
            const now = Date.now().toString();

            multi
                .set(`heartbeat:${this.#instanceId}`, now, 'EX', this.#instanceTtl)
                .hset(`instance_metadata:${this.#instanceId}`, 'last_seen', now);

            try {
                await multi.exec();
            } catch (error) {
                console.error('Error updating heartbeat:', error);
            }
        }, this.#heartbeatInterval);
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

    #getPresenceCacheChannel (endpointId: string, channelId: string) {
        return `presence_cache:${this.#instanceId}:${endpointId}:${channelId}`;
    }

    #getAssignsCacheChannel (endpointId: string, channelId: string) {
        return `assigns_cache:${this.#instanceId}:${endpointId}:${channelId}`;
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

    #subscribeToStateSync (endpoint: string, channel: string, callback: (data: StateSyncEvent) => void): Unsubscribe {
        const interval = setInterval(() => this.#emitStateSyncEvent(endpoint, channel), this.#heartbeatInterval * 10);

        const subscription = this.#stateSyncPublisher.subscribe(({ endpointId, channelId, ...data }) => {
            if (endpointId === endpoint && channelId === channel) {
                return callback(data);
            }
        });

        void this.#emitStateSyncEvent(endpoint, channel, true);

        return () => {
            clearInterval(interval);
            subscription();
        };
    }

    #publishPresenceChange (endpointId: string, channelId: string, userId: string, state: PondObject | null) {
        const message: RedisStateEvent = {
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
        const message: RedisStateEvent = {
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

    async #publishCacheMessage (key: string, cacheKey: string, message: StateEvent) {
        const script = `
            local messageData = ARGV[1]
            local userId = ARGV[2]
            local state = ARGV[3]
            
            if state ~= '' then
                redis.call('HSET', KEYS[1], userId, state)
                -- Set TTL on cache key
                redis.call('EXPIRE', KEYS[1], ${this.#instanceTtl})
            else
                redis.call('HDEL', KEYS[1], userId)
            end
            
            redis.call('PUBLISH', KEYS[2], messageData)
            
            return 1
        `;

        const messageData = JSON.stringify(message);
        const state = message.state ? JSON.stringify(message.state) : '';

        await this.#redisClient.eval(
            script,
            2,
            cacheKey,
            key,
            messageData,
            message.userId,
            state,
        );
    }

    async #emitStateSyncEvent (endpointId: string, channelId: string, initialFetch = false) {
        const script = `
            local active_instances = redis.call('SMEMBERS', 'distributed_instances')
            local presence_data = {}
            local assigns_data = {}
            
            for _, instance in ipairs(active_instances) do
                -- Check if instance is still active
                local heartbeat = redis.call('GET', 'heartbeat:' .. instance)
                if heartbeat then
                    local presence_key = 'presence_cache:' .. instance .. ':' .. ARGV[1] .. ':' .. ARGV[2]
                    local assigns_key = 'assigns_cache:' .. instance .. ':' .. ARGV[1] .. ':' .. ARGV[2]
                    
                    local presence = redis.call('HGETALL', presence_key)
                    local assigns = redis.call('HGETALL', assigns_key)
                    
                    for i = 1, #presence, 2 do
                        presence_data[presence[i]] = presence[i+1]
                    end
                    
                    for i = 1, #assigns, 2 do
                        assigns_data[assigns[i]] = assigns[i+1]
                    end
                end
            end
            
            return {cjson.encode(presence_data), cjson.encode(assigns_data)}
        `;

        const [presenceData, assignsData] = await this.#redisClient.eval(
            script,
            0,
            endpointId,
            channelId,
        ) as [string, string];

        const event: RedisStateSyncEvent = {
            endpointId,
            channelId,
            initialFetch,
            presence: this.#generateCache(presenceData),
            assigns: this.#generateCache(assignsData),
        };

        this.#stateSyncPublisher.publish(event);
    }

    #generateCache (data: string) {
        const first = Object.entries(JSON.parse(data));
        const second: [string, PondObject][] = first.map(([key, value]) => [key, JSON.parse(String(value))]);


        return new Map(second);
    }

    async #handleExit () {
        try {
            await this.shutdown();
            process.exit(0);
        } catch (error) {
            process.exit(1);
        }
    }

    async #deleteKeysByPattern (pattern: string, batchSize: number) {
        let cursor = '0';

        do {
            const [newCursor, keys] = await this.#redisClient.scan(
                cursor,
                'MATCH',
                pattern,
                'COUNT',
                batchSize,
            );

            cursor = newCursor;

            if (keys.length > 0) {
                await this.#redisClient.del(...keys);
            }
        } while (cursor !== '0');
    }
}
