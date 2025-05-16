# PondSocket

PondSocket is a high-performance, minimalist, and bidirectional socket framework designed for Node.js. It provides a seamless way to handle real-time communication between server and client applications, making it an ideal choice for building WebSocket-based projects.

## Installation

To integrate PondSocket into your Node.js project, simply install it via npm:

```bash
npm install @eleven-am/pondsocket
```

## Overview

PondSocket simplifies the complexity of handling WebSocket connections by abstracting the communication process into individual requests rather than dealing with intricate callbacks within the connection event. It offers a lightweight yet powerful solution for managing bidirectional communication channels, enabling real-time updates and collaboration between server and client components.

## Server-side Usage

When setting up the server, PondSocket allows you to create multiple endpoints, each serving as a gateway for sockets to connect and communicate. Each endpoint operates independently, ensuring that sockets from one endpoint cannot interact with sockets from another. This isolation enhances security and simplifies resource management.

```javascript
import PondSocket from "@eleven-am/pondsocket";

const pond = new PondSocket();

// Create an endpoint for handling socket connections
const endpoint = pond.createEndpoint('/api/socket', (req, res) => {
    // Handle socket connection and authentication
});

// Start the server
pond.listen(3000);

// Or alternatively, working with express
import pondSocket from "@eleven-am/pondsocket-express";
import express from "express";

const app = pondSocket(express());

const endpoint = app.upgrade('/api/socket', (req, res) => {
    // Handle socket connection and authentication
});

app.listen(3000);
```

Within each endpoint, sockets interact through channels. Channels provide an organized way to group users and manage efficient communication among them. When users join a channel, they can participate in real-time events and exchange information with other users in the same channel.

```javascript
const channel = endpoint.createChannel('/channel/:id', (req, res) => {
    // Handle the join request, which is sent when a user attempts to join the channel
});
```

## Client-side Usage

On the client-side, PondSocket provides the PondClient class to establish connections with the server. Clients can easily initiate connections, join channels, and participate in real-time interactions.

```javascript
import PondClient from "@eleven-am/pondsocket-client";

const socket = new PondClient('/api/socket', {});
socket.connect();
```

Once connected, clients can create and join channels to engage in real-time communication with other users and the server.

```javascript
const channel = socket.createChannel('/channel/123');
channel.join();
```

### Node Client

PondSocket also offers a Node.js client, which can be imported using:

```javascript
import PondClient from "@eleven-am/pondsocket-client";
```

This node client allows you to turn another server into a client, enabling easy communication between different server instances.

## Key Features

- **Simple and Efficient API**: PondSocket offers an easy-to-use API, making WebSocket communication straightforward and hassle-free.
- **Organized Channels**: Channels provide a structured approach for grouping users and facilitating efficient communication.
- **Assigns**: PondSocket allows the storage of private information for users and channels, enhancing data security.
- **Presence**: The presence feature keeps track of users' current states and notifies other users about any changes.
- **Broadcasting**: PondSocket enables broadcasting messages to all users or specific groups within a channel, facilitating real-time updates.
- **Typed and Well-documented**: The codebase is thoroughly documented and typed, providing a seamless development experience with improved IDE suggestions.

## Examples

### Client-side Example with Authentication

To connect to the PondSocket server and send messages while associating a username with the client connection, follow the steps below:

```javascript
import PondClient from "@eleven-am/pondsocket-client";

// Your server URL
const serverUrl = 'ws://your-server-url/api/socket';

// Your authenticated user's token (replace with actual token)
const authToken = 'your-auth-token';

// Your username (replace with actual username)
const username = 'user123';

// Create a new PondClient instance
const socket = new PondClient(serverUrl, { token: authToken });

// Connect to the server
socket.connect();

// Add event listeners to handle various scenarios
socket.onConnectionChange((connected) => {
    if (connected) {
        console.log('Connected to the server.');
    } else {
        console.log('Disconnected from the server.');
    }
});

// Create a channel and join it
const channel = socket.createChannel('/channel/123', { username });
channel.join();

// Send a message to the server
const message = "Hello, PondSocket!";
channel.broadcast('message', { text: message });

// Handle received messages
// Certain methods in the channel instance returns a subscription function, which can be used to unsubscribe from the event
const subscription = channel.onMessage((event, message) => {
    console.log(`Received message from server: ${message.text}`);
});

// Unsubscribe from the event
subscription();
```

The client will now connect to the server, and the server will receive the necessary headers automatically, including any authentication tokens or cookies, as required by the browser.

### Server-side Example with Authentication and check for profanity before broadcasting

To create a PondSocket server that accepts authenticated connections and checks for profanity before broadcasting messages, follow the steps below:

```javascript
import PondSocket from "@eleven-am/pondsocket";

// Helper functions for token validation
function isValidToken(token) {
    // Implement your token validation logic here
    // Return true if the token is valid, false otherwise
    return true;
}

function getRoleFromToken(token) {
    // Implement the logic to extract the user's role from the token
    // Return the user's role
    return 'user';
}

function isTextProfane(text) {
    // Implement your profanity check logic here
    // Return true if the text is profane, false otherwise
    return false;
}

function getMessagesFromDatabase(channelId) {
    // Implement your logic to retrieve messages from the database
    // Return an array of messages
    return [];
}

const pond = new PondSocket();

// Create an endpoint for handling socket connections
const endpoint = pond.createEndpoint('/api/socket', (req, res) => {
    // Depending if the user already has cookies set, they can be accessed from the request headers or the request address
    const token = req.query.token; // If the token is passed as a query parameter

    // Perform token validation here
    if (isValidToken(token)) {
        // Extract the authenticated user's username
        const role = getRoleFromToken(token);

        // Handle socket connection and authentication for valid users
        res.accept({ role }); // Assign the user's role to the socket
    } else {
        // Reject the connection for invalid users or without a token
        res.decline('Invalid token', 401);
    }
});

// Create a channel, providing a callback that is called when a user attempts to join the channel
const profanityChannel = endpoint.createChannel('/channel/:id', async (req, res) => {
    // When joining the channel, any joinParams passed from the client will be available in the request payload
    // Also any previous assigns on the socket will be available in the request payload as well
    const { role } = req.user.assigns;
    const { username } = req.joinParams;
    const { id } = req.event.params;

    // maybe retrieve the previous messages from the database
    const messages = await getMessagesFromDatabase(id);

    // Check if the user has the required role to join the channel
    if (role === 'admin') {
        // Accept the join request
        res.accept({ username, profanityCount: 0 })
            // optionally you can track the presence of the user in the channel
            .trackPresence({
                username,
                role,
                status: 'online',
                onlineSince: Date.now(),
            })
            // and send the user the channel history
            .reply('history', { messages });
    } else {
        // Reject the join request
        res.decline('You do not have the required role to join this channel', 403);
    }
});

// Attach message event listener to the profanityChannel
profanityChannel.onEvent('message', (req, res) => {
    const { text } = req.event.payload;

    // Check for profanity
    if (isTextProfane(text)) {
        // Reject the message if it contains profanity
        res.assign({ profanityCount: req.user.assigns.profanityCount + 1 })
            .reply('profanity-warning', { message: 'Profanity is not allowed' });

        // note that profanityCount is updated so req.user.assigns.profanityCount will be updated
        if (req.user.assigns.profanityCount >= 3) {
            // Kick the user from the channel if they have used profanity more than 3 times
            res.evictUser('You have been kicked from the channel for using profanity');
        } else {
            // you can broadcast a message to all users or In the channel that profanity is not allowed
            res.broadcast('profanity-warning', { message: 'Profanity is not allowed' })
                // or you can send a message to the user that profanity is not allowed
                .reply('profanity-warning', { message: `You have used profanity ${profanityCount} times. You will be kicked from the channel if you use profanity more than 3 times.` });
        }
    } else {
        // Accept the message to allow broadcasting to other clients in the channel
        res.accept();
    }

    // for more complete access to the channel, you can use the channel instance
    // const channel = req.channel;
});

profanityChannel.onEvent('presence/:presence', (req, res) => {
    const { presence } = req.event.params;
    const { username } = req.user.assigns;

    // Handle presence events
    res.updatePresence({
        username,
        role,
        onlineSince: Date.now(),
        status: presence,
    });
});

profanityChannel.onLeave((event) => {
    const { username } = event.assigns;

    // When a user leaves the channel, PondSocket will automatically remove the user from the presence list and inform other users in the channel

    // perform a cleanup operation here
});

// Start the server
pond.listen(3000, () => {
    console.log('PondSocket server listening on port 3000');
});
```
## Using With NestJS

To use PondSocket with NestJS, you can create a custom provider to handle the PondSocket server instance and endpoints. Here's an example of how you can set up a PondSocket server in a NestJS application:

```typescript
import {Injectable} from '@nestjs/common';
import {
    Endpoint,
    Channel,
    OnConnection,
    OnJoin,
    OnEvent,
    GetConnectionContext,
    GetConnectionResponse,
    // GetJoinRequest,
    // GetJoinResponse,
    GetEventRequest,
    GetEventResponse,
    GetEventParams,
    ChannelInstance,
} from '@eleven-am/pondsocket-nest';
import {
    JoinRequest,
    JoinResponse,
    PondChannel,
    Params,
    IncomingConnection,
    ConnectionResponse
} from "@eleven-am/pondsocket/types";
import {MessageService} from './message.service';

@Injectable()
@Endpoint('/api/socket')
export class SocketEndpoint {
    @OnConnection()
    onConnection(@GetConnectionContext() req: IncomingConnection, @GetConnectionResponse() res: ConnectionResponse) {
        // Handle socket connection and authentication
        res.accept()
            .assign({role: 'user'});
    }
}

@Injectable()
@Channel('/channel/:id')
export class ChannelHandler {
    @ChannelInstance()
    channel: PondChannel;

    constructor(private readonly messageService: MessageService) {
    }

    @OnJoin()
    // async onJoin(@GetJoinRequest() req: JoinRequest<'/channel/:id'>, @GetJoinResponse() res: JoinResponse) {
    // There are a lot of decorators that can be used to get specific information from the request object
    async onJoin(@GetEventParams() params: Params<'/channel/:id'>) {
        // Returning an object from the any handler will perform certainn actions
        // if the object has an assign property, the assign property will be assigned to the user
        // if the object has a presence property, the presence property will be tracked for the user
        // if the object has an event property (MUST BE STRING), the event will be replied to the user with the rest of the object as the payload
        // if the object has a broadcast property (MUST BE STRING), the event will be broadcasted to the channel with the rest of the object as the payload

        const history = await this.messageService.getMessages(req.event.params.id);

        if (!history) {
            // Any error thrown will be sent to the client as a decline
            throw new Error('Channel not found');
        }

        // for example
        return {
            assign: {username: req.joinParams.username},
            presence: {username: req.joinParams.username, status: 'online'},
            event: 'history',
            history,
        };
    }

    @OnEvent('message')
    onMessage(req, res) {
        // Handle the message event
    }
}
```

Add both classes as providers in your NestJS module: This does not have to be the AppModule, it can be any module that you want to use the socket in.
```typescript
import { Module } from '@nestjs/common';
import { PondSocketModule } from '@eleven-am/pondsocket-nest';
import { SocketEndpoint, ChannelHandler } from './socket.endpoint';

@Module({
    imports: [PondSocketModule.forRoot()], // Import the PondSocketModule and call the forRoot method in the AppModule to initialize the PondSocket server
    providers: [SocketEndpoint, ChannelHandler],
})
export class AppModule {}
```

## License

PondSocket is released under the GPL-3.0 License. Please refer to the `LICENSE` file for detailed licensing information.

## Conclusion

PondSocket is a powerful and versatile solution for building real-time applications that require efficient bidirectional communication between server and client components. Its minimalist design and comprehensive feature set make it an excellent choice for WebSocket-based projects, providing developers with a straightforward and reliable tool for building real-time communication systems. With the Node.js client, it also allows for easy communication between multiple server instances, expanding its capabilities even further.
