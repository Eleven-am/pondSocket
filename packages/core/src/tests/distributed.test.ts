import Redis from 'ioredis';

import { RedisClient } from '../abstracts/redisClient';
import { ChannelEngine } from '../engines/channelEngine';
import { EndpointEngine } from '../engines/endpointEngine';
import { LobbyEngine } from '../engines/lobbyEngine';
import { DistributedManager } from '../managers/distributedManager';

describe('PondSocket Redis Presence Tracking Test', () => {
    // Test configuration
    const REDIS_CONFIG = {
        host: 'redis.maix.ovh',
        port: 6379,
        db: 5,
        instanceTtl: 2,
    };

    // Our test components
    let redisClient: RedisClient;
    let redisInspector: Redis;
    let distributedManager: DistributedManager;

    const CHANNEL_ID = 'test-channel';
    const ENDPOINT_ID = 'test-endpoint';
    const USER_ID = 'test-user';

    // Helper to directly check presence in Redis
    const getRedisPresenceData = async (): Promise<Record<string, any>> => {
        const keys = await redisInspector.keys('presence_cache:*');

        const result: Record<string, any> = {};

        for (const key of keys) {
            const data = await redisInspector.hgetall(key);

            Object.entries(data).forEach(([userId, presenceData]) => {
                result[userId] = JSON.parse(presenceData);
            });
        }

        return result;
    };

    beforeEach(() => {
        const clientFactory = redisClient.buildClient(ENDPOINT_ID);
        const client = clientFactory(CHANNEL_ID);

        distributedManager = new DistributedManager(client);
        distributedManager.initialize(() => {});
    });

    beforeAll(async () => {
        // Set up Redis inspector first
        redisInspector = new Redis(REDIS_CONFIG);
        await redisInspector.flushdb();

        // Create the RedisClient
        redisClient = new RedisClient(REDIS_CONFIG);
        await redisClient.initialize();

        // Get a client factory from the Redis client
        const clientFactory = redisClient.buildClient(ENDPOINT_ID);

        // Create a client for our test channel
        const client = clientFactory(CHANNEL_ID);

        // Create DistributedManager with the client
        distributedManager = new DistributedManager(client);

        // Initialize the manager
        const unsubscribe = () => {};

        distributedManager.initialize(unsubscribe);
    }, 30000);

    afterAll(async () => {
        await redisClient.shutdown();
        await redisInspector.flushdb();
        await redisInspector.quit();
    });

    test('Should properly add, update, and remove presence from Redis', async () => {
        // 1. Add a user with presence
        const initialPresence = {
            status: 'online',
            lastActive: Date.now(),
        };

        distributedManager.trackPresence(USER_ID, initialPresence);

        // Wait for Redis to update
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Check presence data in Redis
        let presenceData = await getRedisPresenceData();

        expect(presenceData).toHaveProperty(USER_ID);
        expect(presenceData[USER_ID].status).toBe('online');

        // 2. Update the user's presence
        const updatedPresence = {
            status: 'away',
            lastActive: Date.now(),
        };

        distributedManager.updatePresence(USER_ID, updatedPresence);

        // Wait for Redis to update
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Check updated presence data in Redis
        presenceData = await getRedisPresenceData();
        expect(presenceData).toHaveProperty(USER_ID);
        expect(presenceData[USER_ID].status).toBe('away');

        // 3. Remove the user's presence
        distributedManager.removePresence(USER_ID);

        // Wait for Redis to update
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Check that presence data is gone from Redis
        presenceData = await getRedisPresenceData();
        expect(presenceData).not.toHaveProperty(USER_ID);
    });

    test('Should handle user disconnect properly', async () => {
        // First, add a user
        const initialPresence = {
            status: 'online',
            lastActive: Date.now(),
        };

        // Need to also add the user to assigns so it shows up in userIds
        distributedManager.addUser(USER_ID, { role: 'user' }, () => {});
        distributedManager.trackPresence(USER_ID, initialPresence);

        // Wait for Redis to update
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Verify presence is in Redis
        let presenceData = await getRedisPresenceData();

        expect(presenceData).toHaveProperty(USER_ID);

        // Now remove the user (simulating disconnect)
        distributedManager.removeUser(USER_ID);

        // Wait for Redis to update
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Verify presence is removed from Redis
        presenceData = await getRedisPresenceData();
        expect(presenceData).not.toHaveProperty(USER_ID);
    });

    test('Should handle "untracked" users correctly', async () => {
        // 1. Add a tracked user
        const USER_ID = 'untracked-test-user';

        distributedManager.addUser(USER_ID, { role: 'user' }, () => {});
        distributedManager.trackPresence(USER_ID, { status: 'online' });

        // Wait for Redis to update
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Verify presence is in Redis
        let presenceData = await getRedisPresenceData();

        expect(presenceData).toHaveProperty(USER_ID);

        // 2. Now imagine we stop tracking but don't call removePresence
        // This is a deliberate no-op to simulate what happens when code doesn't
        // explicitly remove presence

        // 3. Explicitly remove presence (this is what should happen)
        distributedManager.removePresence(USER_ID);

        // Wait for Redis to update
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Verify presence is gone from Redis
        presenceData = await getRedisPresenceData();
        expect(presenceData).not.toHaveProperty(USER_ID);
    });
});

describe('PondSocket Redis Presence Tracking Test with ChannelEngine', () => {
    // Test configuration
    const REDIS_CONFIG = {
        host: 'redis.maix.ovh',
        port: 6379,
        db: 5,
        instanceTtl: 2,
    };

    // Our test components
    let redisClient: RedisClient;
    let redisInspector: Redis;
    let channelEngine: ChannelEngine;
    let lobbyEngine: LobbyEngine;
    let endpointEngine: EndpointEngine;

    const CHANNEL_ID = 'test-channel';
    const ENDPOINT_ID = 'test-endpoint';
    const USER_ID = 'test-user';

    // Helper to directly check presence in Redis
    const getRedisPresenceData = async (): Promise<Record<string, any>> => {
        const keys = await redisInspector.keys('presence_cache:*');

        const result: Record<string, any> = {};

        for (const key of keys) {
            const data = await redisInspector.hgetall(key);

            Object.entries(data).forEach(([userId, presenceData]) => {
                result[userId] = JSON.parse(presenceData);
            });
        }

        return result;
    };

    beforeAll(async () => {
        // Set up Redis inspector first
        redisInspector = new Redis(REDIS_CONFIG);
        await redisInspector.flushdb();

        // Create the RedisClient
        redisClient = new RedisClient(REDIS_CONFIG);
        await redisClient.initialize();
    }, 30000);

    afterAll(async () => {
        await redisClient.shutdown();
        await redisInspector.flushdb();
        await redisInspector.quit();
    });

    // Create a fresh ChannelEngine for each test
    beforeEach(() => {
        // Create the EndpointEngine with Redis support
        const clientFactory = redisClient.buildClient(ENDPOINT_ID);

        endpointEngine = new EndpointEngine(clientFactory);

        // Create the LobbyEngine
        lobbyEngine = new LobbyEngine(endpointEngine);

        // Create the ChannelEngine with the test channel
        channelEngine = new ChannelEngine(lobbyEngine, CHANNEL_ID, endpointEngine.createManager(CHANNEL_ID, () => {}));
    });

    test('Should properly add, update, and remove presence from Redis', async () => {
        // 1. Add a user with presence
        const initialPresence = {
            status: 'online',
            lastActive: Date.now(),
        };

        // Mock onMessage function required by addUser
        const onMessage = jest.fn();

        // Add the user to the channel first
        channelEngine.addUser(USER_ID, { role: 'user' }, onMessage);

        // Track presence
        channelEngine.trackPresence(USER_ID, initialPresence);

        // Wait for Redis to update
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Check presence data in Redis
        let presenceData = await getRedisPresenceData();

        expect(presenceData).toHaveProperty(USER_ID);
        expect(presenceData[USER_ID].status).toBe('online');

        // 2. Update the user's presence
        const updatedPresence = {
            status: 'away',
            lastActive: Date.now(),
        };

        channelEngine.updatePresence(USER_ID, updatedPresence);

        // Wait for Redis to update
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Check updated presence data in Redis
        presenceData = await getRedisPresenceData();
        expect(presenceData).toHaveProperty(USER_ID);
        expect(presenceData[USER_ID].status).toBe('away');

        // 3. Remove the user's presence
        channelEngine.removePresence(USER_ID);

        // Wait for Redis to update
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Check that presence data is gone from Redis
        presenceData = await getRedisPresenceData();
        expect(presenceData).not.toHaveProperty(USER_ID);
    });

    test('Should handle user disconnect properly', async () => {
        // Add a user with presence
        const initialPresence = {
            status: 'online',
            lastActive: Date.now(),
        };

        // Mock onMessage function
        const onMessage = jest.fn();

        // Add the user to the channel
        channelEngine.addUser(USER_ID, { role: 'user' }, onMessage);

        // Track presence
        channelEngine.trackPresence(USER_ID, initialPresence);

        // Wait for Redis to update
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Verify presence is in Redis
        let presenceData = await getRedisPresenceData();

        expect(presenceData).toHaveProperty(USER_ID);

        // Now remove the user (simulating disconnect)
        channelEngine.removeUser(USER_ID);

        // Wait for Redis to update
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Verify presence is removed from Redis
        presenceData = await getRedisPresenceData();
        expect(presenceData).not.toHaveProperty(USER_ID);
    });

    test('Should handle "untracked" users correctly', async () => {
        // Add a user with presence
        const USER_ID = 'untracked-test-user';
        const onMessage = jest.fn();

        // Add the user to the channel
        channelEngine.addUser(USER_ID, { role: 'user' }, onMessage);

        // Track presence
        channelEngine.trackPresence(USER_ID, { status: 'online' });

        // Wait for Redis to update
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Verify presence is in Redis
        let presenceData = await getRedisPresenceData();

        expect(presenceData).toHaveProperty(USER_ID);

        // 2. Now explicitly remove presence
        channelEngine.removePresence(USER_ID);

        // Wait for Redis to update
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Verify presence is gone from Redis
        presenceData = await getRedisPresenceData();
        expect(presenceData).not.toHaveProperty(USER_ID);

        // User is still in the channel even though presence is removed
        // You could test this by checking if the user still receives messages
    });
});

describe('PondSocket Multiple Instance Test', () => {
    // Test configuration
    const REDIS_CONFIG = {
        host: 'redis.maix.ovh',
        port: 6379,
        db: 5,
        instanceTtl: 2,
    };

    // Our test components
    let redisClient1: RedisClient;
    let redisClient2: RedisClient;
    let redisInspector: Redis;

    // First instance components
    let channelEngine1: ChannelEngine;
    let lobbyEngine1: LobbyEngine;
    let endpointEngine1: EndpointEngine;

    // Second instance components
    let channelEngine2: ChannelEngine;
    let lobbyEngine2: LobbyEngine;
    let endpointEngine2: EndpointEngine;

    const CHANNEL_ID = 'test-channel';
    const ENDPOINT_ID = 'test-endpoint';
    const USER_ID_1 = 'user-instance1';
    const USER_ID_2 = 'user-instance2';

    // Helper to directly check presence in Redis
    const getRedisPresenceData = async (): Promise<Record<string, any>> => {
        const keys = await redisInspector.keys('presence_cache:*');
        const result: Record<string, any> = {};

        for (const key of keys) {
            const data = await redisInspector.hgetall(key);

            Object.entries(data).forEach(([userId, presenceData]) => {
                result[userId] = JSON.parse(presenceData);
            });
        }

        return result;
    };

    beforeAll(async () => {
        // Set up Redis inspector first
        redisInspector = new Redis(REDIS_CONFIG);
        await redisInspector.flushdb();

        // Create the RedisClients for both instances
        redisClient1 = new RedisClient(REDIS_CONFIG);
        redisClient2 = new RedisClient(REDIS_CONFIG);

        // Initialize both Redis clients
        await redisClient1.initialize();
        await redisClient2.initialize();

        // Create first instance components
        const clientFactory1 = redisClient1.buildClient(ENDPOINT_ID);

        endpointEngine1 = new EndpointEngine(clientFactory1);
        lobbyEngine1 = new LobbyEngine(endpointEngine1);
        channelEngine1 = new ChannelEngine(
            lobbyEngine1,
            CHANNEL_ID,
            endpointEngine1.createManager(CHANNEL_ID, () => {}),
        );

        // Create second instance components
        const clientFactory2 = redisClient2.buildClient(ENDPOINT_ID);

        endpointEngine2 = new EndpointEngine(clientFactory2);
        lobbyEngine2 = new LobbyEngine(endpointEngine2);
        channelEngine2 = new ChannelEngine(
            lobbyEngine2,
            CHANNEL_ID,
            endpointEngine2.createManager(CHANNEL_ID, () => {}),
        );

        // Give Redis clients time to fully initialize and connect to each other
        await new Promise((resolve) => setTimeout(resolve, 500));
    }, 30000);

    afterAll(async () => {
        await redisClient1.shutdown();
        await redisClient2.shutdown();
        await redisInspector.flushdb();
        await redisInspector.quit();
    });

    test('Presence changes should be visible across instances', async () => {
        // Mock message handlers
        const onMessage1 = jest.fn();
        const onMessage2 = jest.fn();

        // First instance: add a user and set presence
        channelEngine1.addUser(USER_ID_1, { role: 'user' }, onMessage1);
        channelEngine1.trackPresence(USER_ID_1, {
            status: 'online',
            instance: 'instance1',
        });

        // Second instance: add a different user and set presence
        channelEngine2.addUser(USER_ID_2, { role: 'admin' }, onMessage2);
        channelEngine2.trackPresence(USER_ID_2, {
            status: 'busy',
            instance: 'instance2',
        });

        // Wait for Redis synchronization
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Check Redis for both users' presence
        const redisPresence = await getRedisPresenceData();

        expect(redisPresence).toHaveProperty(USER_ID_1);
        expect(redisPresence).toHaveProperty(USER_ID_2);
        expect(redisPresence[USER_ID_1].instance).toBe('instance1');
        expect(redisPresence[USER_ID_2].instance).toBe('instance2');

        // Check that instance 1 can see instance 2's user
        const presenceFromInstance1 = channelEngine1.getPresence();

        expect(presenceFromInstance1).toHaveProperty(USER_ID_2);
        expect(presenceFromInstance1[USER_ID_2].status).toBe('busy');

        // Check that instance 2 can see instance 1's user
        const presenceFromInstance2 = channelEngine2.getPresence();

        expect(presenceFromInstance2).toHaveProperty(USER_ID_1);
        expect(presenceFromInstance2[USER_ID_1].status).toBe('online');
    });

    test('Presence updates should propagate between instances', async () => {
        // Update presence on instance 1
        channelEngine1.updatePresence(USER_ID_1, {
            status: 'away',
            instance: 'instance1',
            lastUpdate: Date.now(),
        });

        // Wait for Redis synchronization
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Check that the update is visible on instance 2
        const presenceFromInstance2 = channelEngine2.getPresence();

        expect(presenceFromInstance2[USER_ID_1].status).toBe('away');
    });

    test('Presence removal should propagate between instances', async () => {
        // Remove presence on instance 1
        channelEngine1.removePresence(USER_ID_1);

        // Wait for Redis synchronization
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Check that the user's presence is gone from Redis
        const redisPresence = await getRedisPresenceData();

        expect(redisPresence).not.toHaveProperty(USER_ID_1);

        // Check that the user's presence is gone from instance 2
        const presenceFromInstance2 = channelEngine2.getPresence();

        expect(presenceFromInstance2).not.toHaveProperty(USER_ID_1);
    });

    test('Instance shutdown should clean up its presence data', async () => {
        // First verify both users exist
        const initialPresence = await getRedisPresenceData();

        expect(initialPresence).toHaveProperty(USER_ID_2);

        // Shutdown instance 2
        await redisClient2.shutdown();

        // Need to wait longer for cleanup operations
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Verify instance 2's user presence is cleaned up
        const finalPresence = await getRedisPresenceData();

        expect(finalPresence).not.toHaveProperty(USER_ID_2);
    });
});
