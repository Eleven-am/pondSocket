# PondSocket

PondSocket is a fast, minimalist and bidirectional socket framework for NodeJS. Pond allows you to think of each action
during a sockets lifetime as a request instead of a huge callback that exists inside the connection event.

## Documentation

This is a Node.js module available through the npm registry.

```bash
  npm install pondsocket
```

PondSocket usage depends on the environment in which it is being used.

#### On the server

When using PondSocket, an endpoint is created. The endpoint is the gateway by which sockets actually connect to the
server.
Multiple endpoints can be created but every endpoint is independent of the other, ie sockets on one endpoint cannot
communicate with sockets on another endpoint.

```js
import {PondSocket} from "pondsocket";
import parse from "url";

const pond = new PondSocket();

const endpoint = pond.createEndpoint('/api/socket', (req, res, _endpoint) => {
    const {query} = parse(req.url || '');
    const {token} = query;
    if (!token)
        return res.reject('No token provided');
    res.accept({
        assign: {
            token
        }
    });
})
```

While sockets connect through the endpoint, communication between sockets cannot occur on the endpoint level. Sockets
have to join a channel to communicate
between themselves.

```js
const channel = endpoint.createChannel(/^channel(.*?)/, (req, res, channel) => {
    const isAdmin = req.clientAssigns.admin;
    if (!isAdmin)
        return res.reject('You are not an admin');

    res.accept({
        assign: {
            admin: true,
            joinedDate: new Date()
        },
        presence: {
            state: 'online'
        },
        channelData: {
            locked: true,
            numberOfUsers: channel.presence.length
        }
    });
});   
```

A user goes through the createChannel function to join a channel.
When a user joins a channel, some private information can be assigned to the user. This assign could be viewed as a
cookie that is only available serverside.
The presence is the current state of the user. When you reassign a new presence information to a user, all other users
connected to the same channel are informed of the change.
This could be used as *user is typing*, *user is away*, etc. The channelData is information that is stored on the
channel and accessible from anywhere the channel is available.
It can be anything from a boolean to an instance of a class. This data cannot be accessed from another channel as it is
private to the channel.

```js
channel.on('hello', (req, res, channel) => {
    const users = channel.getPresence();
    res.assign({
        assign: {
            pingDate: new Date(),
            users: users.length
        }
    });

    // res.reject('curse words are not allowed on a child friendly channel') 
    // channel.closeFromChannel(req.client.clientId);
})
```

When a message is sent on a channel by a user, an event is triggered. The *on* function can be used to listen for these
events. If the function is specified, it is called when the message is received.
You can choose to decline the message being sent, or you can allow the message to be sent as usual. You can also do all
the normal assigns to the channel, or user.
In case there is no *on* function, the message will be sent without any action being taken.

#### On the browser

```js
import {PondSocket} from "pondsocket/client";

export const socket = new PondClientSocket('/api/socket', {});
socket.connect();
```

The browser compatible package can be imported from pondsocket/client.
AN url string is provided to the class along with other url params, like token.

Multiple classes can be created, but it is advised to use a single class throughout the application.
You can just create multiple channels and maintain the single socket connection.

```js
const channelTopic = 'channel:one';
const options = {
    username: 'eleven-am'
}

export const channel = socket.createChannel(channelTopic, options);
channel.join();
```

When connected to the channel you can subscribe to the events from the channel.

```js
const subscriptionPresence = channel.onPresenceUpdate(presence => {
    // handle the presence changes of the channel
});

const subscriptionMessage = channel.onMessage((event, data) => {
    // handle the message being received 
});

// When done with the channel remember to unsubscribe from these listeners
subscriptionPresence.unsubscribe();
subscriptionMessage.unsubscribe();
```

There are many other features available on the channel object. Since the application is completely typed,
suggestions should be provided by your IDE.

```js
channel.broadcast('hello', {
    name: 'eleven-am',
    message: 'I am the man, man'
})

// channel.broadcastFrom broadcasts a message to everyone but the client that emitted the message
// channel.sendMessage sends a message to clients specified in the function
```
