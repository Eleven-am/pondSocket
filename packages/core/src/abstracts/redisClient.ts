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
        clearInterval(this.#heartbeatTimer);
        clearInterval(this.#cleanupTimer);
        await this.#unsubscribeFromChannels();
        await this.#unregisterInstance();
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

    async #unregisterInstance (instanceId = this.#instanceId) {
        const script = `
            -- Remove instance registration
            redis.call('SREM', 'distributed_instances', ARGV[1])
            redis.call('DEL', 'heartbeat:' .. ARGV[1])
            redis.call('DEL', 'instance_metadata:' .. ARGV[1])
            
            -- Delete all cache keys in one SCAN operation
            local cursor = '0'
            repeat
                local result = redis.call('SCAN', cursor, 'MATCH', '{presence_cache,assigns_cache}:' .. ARGV[1] .. ':*', 'COUNT', 100)
                cursor = result[1]
                local keys = result[2]
                if #keys > 0 then
                    redis.call('DEL', unpack(keys))
                end
            until cursor == '0'
            
            return 1
        `;

        try {
            await this.#redisClient.eval(script, 0, instanceId);
        } catch {
            // no-op as we're shutting down
        }
    }

    async #cleanupDisconnectedClients () {
        const script = `
            -- Helper function to check if instance is alive
            local function is_instance_alive(instance_id)
                local heartbeat = redis.call('GET', 'heartbeat:' .. instance_id)
                local in_set = redis.call('SISMEMBER', 'distributed_instances', instance_id)
                return heartbeat and in_set == 1
            end
    
            -- Get array of instance IDs passed as argument
            local instance_ids = cjson.decode(ARGV[1])
            
            -- Track affected channels and keys to delete
            local affected_channels = {}
            local keys_to_delete = {}
            local batch_size = 100
            
            -- Process each instance
            for _, instance_id in ipairs(instance_ids) do
                -- If instance is not alive, clean it up
                if not is_instance_alive(instance_id) then
                    -- Queue instance metadata keys for deletion
                    table.insert(keys_to_delete, 'heartbeat:' .. instance_id)
                    table.insert(keys_to_delete, 'instance_metadata:' .. instance_id)
                    
                    -- Remove from distributed_instances
                    redis.call('SREM', 'distributed_instances', instance_id)
                    
                    -- Find and process all cache keys for this instance
                    local cache_cursor = '0'
                    repeat
                        local result = redis.call('SCAN', cache_cursor, 'MATCH', '*_cache:' .. instance_id .. ':*', 'COUNT', batch_size)
                        cache_cursor = result[1]
                        
                        for _, key in ipairs(result[2]) do
                            -- Extract channel info before deletion
                            local _, _, endpoint_id, channel_id = string.match(key, '_cache:[^:]+:([^:]+):([^:]+)')
                            if endpoint_id and channel_id then
                                affected_channels[endpoint_id .. ":" .. channel_id] = true
                            end
                            
                            -- Add to deletion batch
                            table.insert(keys_to_delete, key)
                            
                            -- If batch is full, process it
                            if #keys_to_delete >= batch_size then
                                redis.call('DEL', unpack(keys_to_delete))
                                keys_to_delete = {}
                            end
                        end
                    until cache_cursor == '0'
                end
            end
            
            -- Delete any remaining keys
            if #keys_to_delete > 0 then
                redis.call('DEL', unpack(keys_to_delete))
            end
            
            -- Convert affected_channels to array
            local channels = {}
            for pair in pairs(affected_channels) do
                table.insert(channels, pair)
            end
            
            return channels
        `;

        try {
            // Get all instance IDs first
            const instanceIds = await this.#getAllInstanceIds();

            // Run cleanup script with the instance IDs
            const affectedChannels = await this.#redisClient.eval(
                script,
                0,
                JSON.stringify(instanceIds),
            ) as string[];

            // Process affected channels
            if (affectedChannels.length > 0) {
                const promises = affectedChannels.map((pair) => {
                    const [endpointId, channelId] = pair.split(':');

                    return this.#emitStateSyncEvent(endpointId, channelId);
                });

                await Promise.all(promises);
            }
        } catch (error) {
            console.error('Error cleaning up disconnected clients:', error);
        }
    }

    async #getAllInstanceIds () {
        const script = `
            local instance_ids = {}
            local seen = {}  -- For deduplication
            
            -- 1. Get instances from distributed_instances set
            local registered = redis.call('SMEMBERS', 'distributed_instances')
            for _, id in ipairs(registered) do
                if not seen[id] then
                    seen[id] = true
                    table.insert(instance_ids, id)
                end
            end
            
            -- 2. Get instances from heartbeat keys
            local cursor = '0'
            repeat
                local result = redis.call('SCAN', cursor, 'MATCH', 'heartbeat:*', 'COUNT', 100)
                cursor = result[1]
                local keys = result[2]
                
                for _, key in ipairs(keys) do
                    local id = string.match(key, 'heartbeat:([^:]+)')
                    if id and not seen[id] then
                        seen[id] = true
                        table.insert(instance_ids, id)
                    end
                end
            until cursor == '0'
            
            -- 3. Get instances from metadata keys
            cursor = '0'
            repeat
                local result = redis.call('SCAN', cursor, 'MATCH', 'instance_metadata:*', 'COUNT', 100)
                cursor = result[1]
                local keys = result[2]
                
                for _, key in ipairs(keys) do
                    local id = string.match(key, 'instance_metadata:([^:]+)')
                    if id and not seen[id] then
                        seen[id] = true
                        table.insert(instance_ids, id)
                    end
                end
            until cursor == '0'
            
            -- 4. Get instances from cache keys
            cursor = '0'
            repeat
                local result = redis.call('SCAN', cursor, 'MATCH', '*_cache:*', 'COUNT', 100)
                cursor = result[1]
                local keys = result[2]
                
                for _, key in ipairs(keys) do
                    local id = string.match(key, '_cache:([^:]+)')
                    if id and not seen[id] then
                        seen[id] = true
                        table.insert(instance_ids, id)
                    end
                end
            until cursor == '0'
            
            return instance_ids
        `;

        let response: string[] = [];

        try {
            response = await this.#redisClient.eval(script, 0) as string[];
        } catch (error) {
            console.error('Error getting all instance IDs:', error);
        }

        return response;
    }

    #startPeriodicCleanup () {
        this.#cleanupTimer = setInterval(async () => {
            try {
                await this.#cleanupDisconnectedClients();
            } catch (error) {
                console.error('Error in periodic cleanup:', error);
            }
        }, this.#cleanupInterval);
    }

    #startHeartbeat () {
        this.#heartbeatTimer = setInterval(async () => {
            try {
                await this.#performHeartbeat();
            } catch (error) {
                console.error('Error performing heartbeat:', error);
            }
        }, this.#heartbeatInterval);
    }

    #performHeartbeat () {
        const now = Date.now().toString();

        const multi = this.#redisClient.multi();

        multi
            .set(`heartbeat:${this.#instanceId}`, now, 'EX', this.#instanceTtl)
            .hset(`instance_metadata:${this.#instanceId}`, 'last_seen', now);

        return multi.exec();
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
            -- Helper function to check if an instance is truly alive
            -- Returns true only if:
            -- 1. Instance has a valid heartbeat AND
            -- 2. Instance is in the distributed_instances set
            local function is_instance_alive(instance_id)
                -- Both checks in one atomic operation
                local exists = redis.call('EXISTS', 'heartbeat:' .. instance_id)
                if exists == 0 then
                    return false
                end
                
                local is_registered = redis.call('SISMEMBER', 'distributed_instances', instance_id)
                return is_registered == 1
            end
    
            -- Get all registered instances
            local active_instances = redis.call('SMEMBERS', 'distributed_instances')
            local presence_data = {}
            local assigns_data = {}
            
            for _, instance in ipairs(active_instances) do
                -- Only process data from instances that are truly alive
                if is_instance_alive(instance) then
                    local presence_key = 'presence_cache:' .. instance .. ':' .. ARGV[1] .. ':' .. ARGV[2]
                    local assigns_key = 'assigns_cache:' .. instance .. ':' .. ARGV[1] .. ':' .. ARGV[2]
                    
                    -- Fetch data atomically for this instance
                    local presence = redis.call('HGETALL', presence_key)
                    local assigns = redis.call('HGETALL', assigns_key)
                    
                    -- Process presence data
                    for i = 1, #presence, 2 do
                        presence_data[presence[i]] = presence[i+1]
                    end
                    
                    -- Process assigns data
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
}
