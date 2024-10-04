import { uuid, PondObject, Subject, Unsubscribe } from '@eleven-am/pondsocket-common';
import Redis from 'ioredis';

import {
    InternalChannelEvent,
    RedisStateEvent,
    ChannelMessage,
    Client,
    StateEvent,
    RedisOptions,
    RedisUserLeaveEvent,
    RedisStateSyncEvent,
    StateSyncEvent,
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
        const consistencyCheckScript = `
            local active_instances = redis.call('SMEMBERS', 'distributed_instances')
            local all_keys = redis.call('KEYS', '*_cache:*')
            local inactive_keys = {}
            local unique_pairs = {}
            
            for _, key in ipairs(all_keys) do
                local parts = {}
                for part in string.gmatch(key, '[^:]+') do
                    table.insert(parts, part)
                end
                local instance_id, endpoint_id, channel_id = parts[2], parts[3], parts[4]
                
                if not (active_instances[instance_id]) then
                    table.insert(inactive_keys, key)
                    local pair = endpoint_id .. ':' .. channel_id
                    unique_pairs[pair] = true
                end
            end
            
            if #inactive_keys > 0 then
                redis.call('DEL', unpack(inactive_keys))
            end
            
            local unique_pairs_list = {}
            for pair in pairs(unique_pairs) do
                table.insert(unique_pairs_list, pair)
            end
            
            return unique_pairs_list
        `;

        const [uniquePairs] = await this.#redisClient.eval(consistencyCheckScript, 0) as [string[]];

        const promises = uniquePairs.map((pair) => {
            const [endpointId, channelId] = pair.split(':');

            return this.#emitStateSyncEvent(endpointId, channelId);
        });

        await Promise.all(promises);
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

    async #publishCacheMessage (key: string, cacheKey: string, message: StateEvent) {
        const script = `
            local messageData = ARGV[1]
            local userId = ARGV[2]
            local state = ARGV[3]
            
            if state ~= '' then
                redis.call('HSET', KEYS[1], userId, state)
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

    async #emitStateSyncEvent (endpointId: string, channelId: string) {
        const script = `
            local active_instances = redis.call('SMEMBERS', 'distributed_instances')
            local presence_data = {}
            local assigns_data = {}
            
            for _, instance in ipairs(active_instances) do
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
            
            return {cjson.encode(presence_data), cjson.encode(assigns_data)}
        `;

        const [presenceData, assignsData] = await this.#redisClient.eval(script, 0, endpointId, channelId) as [string, string];

        const event: RedisStateSyncEvent = {
            endpointId,
            channelId,
            presence: new Map(Object.entries(JSON.parse(presenceData))),
            assigns: new Map(Object.entries(JSON.parse(assignsData))),
        };

        this.#stateSyncPublisher.publish(event);
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

        void this.#emitStateSyncEvent(endpoint, channel);

        return () => {
            clearInterval(interval);
            subscription();
        };
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
