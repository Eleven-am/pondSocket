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
```

Within each endpoint, sockets interact through channels. Channels provide an organized way to group users and manage efficient communication among them. When users join a channel, they can participate in real-time events and exchange information with other users in the same channel.

```javascript
const channel = endpoint.createChannel('/channel/:id', (req, res) => {
    // Handle channel-specific events and actions
});
```

## Client-side Usage

On the client-side, PondSocket provides the PondClient class to establish connections with the server. Clients can easily initiate connections, join channels, and participate in real-time interactions.

```javascript
import PondClient from "@eleven-am/pondsocket/client";

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
import PondClient from "@eleven-am/pondsocket/node";
```

This node client allows you to turn another server into a client, enabling easy communication between different server instances.

## Key Features

- **Simple and Efficient API**: PondSocket offers an easy-to-use API, making WebSocket communication straightforward and hassle-free.
- **Organized Channels**: Channels provide a structured approach for grouping users and facilitating efficient communication.
- **Assigns**: PondSocket allows the storage of private information for users and channels, enhancing data security.
- **Presence**: The presence feature keeps track of users' current states and notifies other users about any changes.
- **Broadcasting**: PondSocket enables broadcasting messages to all users or specific groups within a channel, facilitating real-time updates.
- **Typed and Well-documented**: The codebase is thoroughly documented and typed, providing a seamless development experience with improved IDE suggestions.

## License

PondSocket is released under the MIT License. Please refer to the `LICENSE` file for detailed licensing information.

## API Documentation

Apologies for the confusion. Let me remove "Class" from the title of each section:

### PondSocket

The `PondSocket` class is the core class that represents the socket server.

**Constructor:**

- `constructor(server?: HTTPServer, socketServer?: WebSocketServer)`: Creates a new instance of the PondSocket with an optional HTTP server and WebSocket server.

**Methods:**

- `listen(...args: any[]): HTTPServer`: Specifies the port to listen on with the provided arguments.

- `close(callback?: () => void): HTTPServer`: Closes the server, and an optional callback can be provided.

- `createEndpoint<Path extends string>(path: PondPath<Path>, handler: (request: IncomingConnection<Path>, response: ConnectionResponse) => void | Promise<void>): Endpoint`: Accepts a new socket upgrade request on the provided endpoint using the handler function to authenticate the socket.

### ConnectionResponse

The `ConnectionResponse` class represents the response object for the incoming connection.

**Methods:**

- `accept(assigns?: PondAssigns): void`: Accepts the request and optionally assigns data to the client.

- `reject(message?: string, errorCode?: number): void`: Rejects the request with the given error message and optional error code.

- `send(event: string, payload: PondMessage, assigns?: PondAssigns): void`: Emits a direct message to the client with the specified event and payload.

### Endpoint

The `Endpoint` class represents an endpoint in the PondSocket server where channels can be created.

**Methods:**

- `createChannel<Path extends string>(path: PondPath<Path>, handler: (request: JoinRequest<Path>, response: JoinResponse) => void | Promise<void>): PondChannel`: Adds a new PondChannel to this path on this endpoint with the provided handler function to authenticate the client.

- `broadcast(event: string, payload: PondMessage): void`: Broadcasts a message to all clients connected to this endpoint with the specified event and payload.

- `closeConnection(clientIds: string | string[]): void`: Closes specific clients connected to this endpoint identified by the provided clientIds.

### JoinRequest

The `JoinRequest` class represents the request object when a client joins a channel.

**Properties:**

- `event: PondEvent<Path>`: The event associated with the request.

- `channelName: string`: The name of the channel.

- `assigns: UserAssigns`: The assigns data for the client.

- `presence: UserPresences`: The presence data for the client.

- `joinParams: JoinParams`: The join parameters for the client.

- `user: UserData`: The user data associated with the client.

- `client: Client`: The Client instance associated with the request.

### JoinResponse

The `JoinResponse` class represents the response object for the join request.

**Methods:**

- `accept(assigns?: PondAssigns): JoinResponse`: Accepts the join request and optionally assigns data to the client.

- `reject(message?: string, errorCode?: number): JoinResponse`: Rejects the join request with the given error message and optional error code.

- `send(event: string, payload: PondMessage, assigns?: PondAssigns): JoinResponse`: Emits a direct message to the client with the specified event, payload, and optional assigns data.

- `broadcast(event: string, payload: PondMessage): JoinResponse`: Emits a message to all clients in the channel with the specified event and payload.

- `broadcastFromUser(event: string, payload: PondMessage): JoinResponse`: Emits a message to all clients in the channel except the sender with the specified event and payload.

- `sendToUsers(event: string, payload: PondMessage, userIds: string[]): JoinResponse`: Emits a message to a specific set of clients identified by the provided userIds with the specified event and payload.

- `trackPresence(presence: PondPresence): JoinResponse`: Tracks the presence of the client in the channel.

### PondChannel

The `PondChannel` class represents a Generic channel in the PondSocket server. It is used to create a channel whose path matches the provided PondPath.

**Methods:**

- `onEvent<Event extends string>(event: PondPath<Event>, handler: (request: EventRequest<Event>, response: EventResponse) => void | Promise<void>): void`: Handles an event request made by a user for the specified event with the provided handler function.

- `broadcast(event: string, payload: PondMessage, channelName?: string): void`: Broadcasts a message to all users in the channel with the specified event and payload. Optionally, a specific channel name can be provided to broadcast the message only to users in that channel.

### EventRequest

The `EventRequest` class represents the request object when an event is received from a client.

**Properties:**

- `event: PondEvent<Path>`: The event associated with the request.

- `channelName: string`: The name of the channel.

- `assigns: UserAssigns`: The assigns data for the client.

- `presence: UserPresences`: The presence data for the client.

- `user: UserData`: The user data associated with the client.

- `client: Client`: The Client instance associated with the request.

### EventResponse

The `EventResponse` class represents the response object for handling events from clients.

**Methods:**

- `accept(assigns?: PondAssigns): EventResponse`: Accepts the request and optionally assigns data to the client.

- `reject(message?: string, errorCode?: number, assigns?: PondAssigns): EventResponse`: Rejects the request with the given error message, optional error code, and optional assigns data.

- `send(event: string, payload: PondMessage, assigns?: PondAssigns): void`: Emits a direct message to the client with the specified event, payload, and optional assigns data.

- `broadcast(event: string, payload: PondMessage): EventResponse`: Sends a message to all clients in the channel with the specified event and payload.

- `broadcastFromUser(event: string, payload: PondMessage): EventResponse`: Sends a message to all clients in the channel except the sender with the specified event and payload.

- `sendToUsers(event: string, payload: PondMessage, userIds: string[]): EventResponse`: Sends

a message to a specific set of clients identified by the provided userIds with the specified event and payload.

- `trackPresence(presence: PondPresence, userId?: string): EventResponse`: Tracks a user's presence in the channel.

- `updatePresence(presence: PondPresence, userId?: string): EventResponse`: Updates a user's presence in the channel.

- `unTrackPresence(userId?: string): EventResponse`: Removes a user's presence from the channel.

- `evictUser(reason: string, userId?: string): void`: Evicts a user from the channel.

- `closeChannel(reason: string): void`: Closes the channel from the server-side for all clients.

### Client

The `Client` class represents a single Channel created by the PondSocket server. Note that a PondChannel can have multiple clients.

**Methods:**

- `getAssigns: UserAssigns`: Gets the current assign data for the client.

- `getUserData(userId: string): UserData`: Gets the assign data for a specific user identified by the provided `userId`.

- `broadcastMessage(event: string, payload: PondMessage): void`: Broadcasts a message to every client in the channel with the specified event and payload.

- `sendToUser(userId: string, event: string, payload: PondMessage): void`: Sends a message to a specific client in the channel identified by the provided `userId`, with the specified event and payload.

- `banUser(userId: string, reason?: string): void`: Bans a user from the channel identified by the provided `userId`. Optionally, you can provide a `reason` for the ban.

- `trackPresence(userId: string, presence: PondPresence): void`: Tracks a user's presence in the channel identified by the provided `userId`.

- `removePresence(userId: string): void`: Removes a user's presence from the channel identified by the provided `userId`.

- `updatePresence(userId: string, presence: PondPresence): void`: Updates a user's presence in the channel identified by the provided `userId`.

### PondClient

The `PondClient` class represents a client that connects to the PondSocket server.

**Constructor:**

- `constructor(endpoint: string, params?: Record<string, any>)`: Creates a new instance of the PondClient with the provided endpoint URL and optional parameters.

**Methods:**

- `connect(backoff?: number): void`: Connects to the server with an optional backoff time.

- `getState(): boolean`: Returns the current state of the socket.

- `disconnect(): void`: Disconnects the socket.

- `createChannel(name: string, params?: JoinParams): Channel`: Creates a channel with the given name and optional join parameters.

- `onConnectionChange(callback: (state: boolean) => void): Unsubscribe`: Subscribes to the connection state changes and calls the provided callback when the state changes.

### Channel

The `Channel` class represents a channel in the PondSocket server.

**Methods:**

- `join(): void`: Connects to the channel.

- `leave(): void`: Disconnects from the channel.

- `onMessage(callback: (event: string, message: PondMessage) => void): Unsubscribe`: Monitors the channel for messages and calls the provided callback when a message is received.

- `onMessageEvent(event: string, callback: (message: PondMessage) => void): Unsubscribe`: Monitors the channel for messages with the specified event and calls the provided callback when a message is received.

- `onChannelStateChange(callback: (connected: ChannelState) => void): Unsubscribe`: Monitors the channel state of the channel and calls the provided callback when the connection state changes.

- `onJoin(callback: (presence: PondPresence) => void): Unsubscribe`: Detects when clients join the channel and calls the provided callback when a client joins the channel.

- `onLeave(callback: (presence: PondPresence) => void): Unsubscribe`: Detects when clients leave the channel and calls the provided callback when a client leaves the channel.

- `onPresenceChange(callback: (presence: PresencePayload) => void): Unsubscribe`: Detects when clients change their presence in the channel and calls the provided callback when a client changes their presence in the channel.

- `sendMessage(event: string, payload: PondMessage, recipient: string[]): void`: Sends a message to specific clients in the channel with the specified event, payload, and recipient.

- `broadcastFrom(event: string, payload: PondMessage): void`: Broadcasts a message to every other client in the channel except yourself with the specified event and payload.

- `broadcast(event: string, payload: PondMessage): void`: Broadcasts a message to the channel, including yourself, with the specified event and payload.

- `getPresence(): PondPresence[]`: Gets the current presence of the channel.

- `onUsersChange(callback: (users: PondPresence[]) => void): Unsubscribe`: Monitors the presence of the channel and calls the provided callback when the presence changes.

- `isConnected(): boolean`: Gets the current connection state of the channel.

- `onConnectionChange(callback: (connected: boolean) => void): Unsubscribe`: Monitors the connection state of the channel and calls the provided callback when the connection state changes.

## Conclusion

PondSocket is a powerful and versatile solution for building real-time applications that require efficient bidirectional communication between server and client components. Its minimalist design and comprehensive feature set make it an excellent choice for WebSocket-based projects, providing developers with a straightforward and reliable tool for building real-time communication systems. With the Node.js client, it also allows for easy communication between multiple server instances, expanding its capabilities even further.
