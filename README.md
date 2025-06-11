# PondSocket

PondSocket is a high-performance, minimalist, and bidirectional socket framework designed for Node.js. It provides a seamless way to handle real-time communication between server and client applications, making it an ideal choice for building WebSocket-based projects.

## Core Concepts

PondSocket is built around four main entities:

1. **Server**: The main instance that manages all WebSocket connections and endpoints
2. **Endpoint**: A WebSocket gateway that handles client connections and authentication
3. **Channel**: A communication group where users can interact and exchange messages
4. **Client**: The client-side implementation that connects to endpoints and joins channels

### Server
The server is the main entry point for PondSocket. It manages all WebSocket connections and provides methods to create endpoints.

```typescript
import PondSocket from "@eleven-am/pondsocket";

// Create a new PondSocket server
const pond = new PondSocket({
    // Optional: Use an existing HTTP server
    server: httpServer,
    // Optional: Use an existing WebSocket server
    socketServer: wsServer,
    // Optional: Whether to create an exclusive server
    exclusiveServer: true,
    // Optional: Distributed backend for scaling
    distributedBackend: new RedisDistributedBackend({
        host: 'localhost',
        port: 6379
    })
});

// Start the server
pond.listen(3000);
```

### Endpoint
Endpoints are WebSocket gateways that handle client connections. Each endpoint:
- Manages its own set of connections
- Handles authentication
- Creates channels
- Is isolated from other endpoints

```typescript
// Create an endpoint
const endpoint = pond.createEndpoint('/api/socket', (ctx, next) => {
    // Handle authentication
    const token = ctx.request.query.token;
    
    if (isValidToken(token)) {
        // Accept the connection and assign user data
        ctx.accept({
            userId: getUserIdFromToken(token),
            role: getRoleFromToken(token)
        });
    } else {
        // Reject invalid connections
        ctx.reject('Invalid token', 401);
    }
});

// Endpoints can have middleware
endpoint.use(async (ctx, next) => {
    // Log all connections
    console.log(`New connection from ${ctx.request.ip}`);
    await next();
});
```

### Channel
Channels are communication groups where users can interact. Each channel:
- Has a unique path (can include parameters)
- Manages its own set of users
- Handles join requests
- Tracks user presence
- Manages message broadcasting

```typescript
// Create a channel with path parameters
const channel = endpoint.createChannel('/chat/:roomId', (ctx, next) => {
    const { role } = ctx.user.assigns;
    const { username } = ctx.joinParams;
    const { roomId } = ctx.event.params;

    // Handle join requests
    if (role === 'user') {
        // Accept the join request
        ctx.accept({ username })
            // Track user presence
            .trackPresence({
                username,
                status: 'online',
                joinedAt: Date.now()
            })
            // Send channel history
            .sendToUsers('history', {
                messages: await getChannelHistory(roomId)
            });
    } else {
        ctx.decline('Unauthorized', 403);
    }
});

// Handle channel events
channel.onEvent('message', (ctx, next) => {
    const { text } = ctx.event.payload;
    const { username } = ctx.user.assigns;
    
    // Broadcast to all users in the channel
    ctx.broadcast('message', {
        text,
        username,
        timestamp: Date.now()
    });
});

// Handle user presence
channel.onEvent('presence', (ctx, next) => {
    const { status } = ctx.event.payload;
    ctx.updatePresence({
        status,
        lastSeen: Date.now()
    });
});

// Handle user leaves
channel.onLeave((ctx) => {
    console.log(`User ${ctx.user.assigns.username} left the channel`);
});
```

### Client
The client connects to endpoints and joins channels. It provides:
- Connection management
- Channel management
- Event handling
- Presence tracking

```typescript
import PondClient from "@eleven-am/pondsocket-client";

// Create a client instance
const socket = new PondClient('ws://localhost:3000/api/socket', {
    // Connection parameters (e.g., authentication token)
    token: 'your-auth-token'
});

// Handle connection state
socket.onConnectionChange((connected) => {
    if (connected) {
        console.log('Connected to server');
    } else {
        console.log('Disconnected from server');
    }
});

// Connect to the server
socket.connect();

// Create a channel
const channel = socket.createChannel('/chat/123', {
    // Join parameters
    username: 'user123'
});

// Handle channel state
channel.onChannelStateChange((state) => {
    switch (state) {
        case 'joining':
            console.log('Joining channel...');
            break;
        case 'joined':
            console.log('Joined channel');
            break;
        case 'left':
            console.log('Left channel');
            break;
    }
});

// Handle presence updates
channel.onPresenceChange((presence) => {
    console.log('Presence updated:', presence);
});

// Handle user changes
channel.onUsersChange((users) => {
    console.log('Users in channel:', users);
});

// Join the channel
channel.join();

// Send a message
channel.sendMessage('message', {
    text: 'Hello, World!'
});

// Listen for messages
channel.onMessage('message', (message) => {
    console.log(`${message.username}: ${message.text}`);
});

// Update presence
channel.sendMessage('presence', {
    status: 'away'
});

// Leave the channel
channel.leave();
```

## Framework Integration

### Express.js

```typescript
import express from 'express';
import pondSocket from '@eleven-am/pondsocket-express';

const app = express();
const pondApp = pondSocket(app);

// Create a WebSocket endpoint
const endpoint = pondApp.createEndpoint('/api/socket', (ctx, next) => {
    const token = ctx.request.query.token;
    if (isValidToken(token)) {
        ctx.accept({ role: 'user' });
    } else {
        ctx.reject('Invalid token', 401);
    }
});

// Create a channel
const channel = endpoint.createChannel('/chat/:roomId', (ctx, next) => {
    ctx.accept()
        .trackPresence({
            username: ctx.joinParams.username,
            status: 'online'
        });
});

// Handle messages
channel.onEvent('message', (ctx, next) => {
    ctx.broadcast('message', ctx.event.payload);
});

app.listen(3000);
```

### NestJS

```typescript
import { Module } from '@nestjs/common';
import { PondSocketModule } from '@eleven-am/pondsocket-nest';

@Module({
    imports: [
        PondSocketModule.forRoot({
            isGlobal: true,
            guards: [AuthGuard],
            pipes: [ValidationPipe]
        })
    ]
})
export class AppModule {}

// Create a WebSocket endpoint
@PondSocketEndpoint('/api/socket')
export class SocketController {
    @PondSocketConnection()
    async handleConnection(ctx: Context) {
        const token = ctx.request.query.token;
        if (isValidToken(token)) {
            ctx.accept({ role: 'user' });
        } else {
            ctx.reject('Invalid token', 401);
        }
    }
}

// Create a channel
@PondSocketChannel('/chat/:roomId')
export class ChatController {
    @PondSocketJoin()
    async handleJoin(ctx: Context) {
        // You can return an object with specific properties to trigger actions
        return {
            // Send an event to the user
            event: 'welcome',
            message: 'Welcome to the channel!',
            
            // Broadcast to all users in the channel
            broadcast: 'user_joined',
            username: ctx.joinParams.username,
            
            // Broadcast to all users except the sender
            broadcastFrom: 'user_joined',
            username: ctx.joinParams.username,
            
            // Update user assigns
            assigns: {
                username: ctx.joinParams.username,
                joinedAt: Date.now()
            },
            
            // Update user presence
            presence: {
                username: ctx.joinParams.username,
                status: 'online',
                lastSeen: Date.now()
            }
        };
    }

    @PondSocketEvent('message')
    async handleMessage(ctx: Context) {
        const { text } = ctx.event.payload;
        
        // Return an object to broadcast the message
        return {
            broadcast: 'message',
            text,
            username: ctx.user.assigns.username,
            timestamp: Date.now()
        };
    }

    @PondSocketEvent('presence')
    async handlePresence(ctx: Context) {
        const { status } = ctx.event.payload;
        
        // Return an object to update presence
        return {
            presence: {
                status,
                lastSeen: Date.now()
            }
        };
    }
}
```

The NestJS integration provides a convenient way to handle WebSocket events by returning objects with specific properties. When you return an object with any of these properties, the corresponding action will be taken automatically:

- `event`: Sends an event to the user
- `broadcast`: Broadcasts an event to all users in the channel
- `broadcastFrom`: Broadcasts an event to all users except the sender
- `assigns`: Updates the user's assigns
- `presence`: Updates the user's presence

This allows you to write cleaner, more declarative code without having to use the context object directly for common operations.

## Advanced Features

For detailed information about advanced features, please refer to the specific package documentation:

- [Core Package Documentation](packages/core/README.md) - Learn about channels, presence, broadcasting, and distributed deployment
- [Express Integration Documentation](packages/express/README.md) - Discover how to integrate with Express.js applications
- [NestJS Integration Documentation](packages/nest/README.md) - Explore decorators, guards, and dependency injection
- [Client Package Documentation](packages/client/README.md) - Master client-side implementation and event handling

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the GPL-3.0 License - see the LICENSE file for details.
