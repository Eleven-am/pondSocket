
# PondSocket

PondSocket is a fast, minimalist and bidirectional socket framework for NodeJS. Pond allows you to think of each action during a sockets lifetime as a request instead of a huge callback that exists inside the connection event.
## Documentation

This is a Node.js module available through the npm registry.

```bash
  npm install pondsocket
```

PondSocket usage depends on the environment in which it is being used.

#### On the server

When using PondSocket, an endpoint is created. The endpoint is the gateway by which sockets actually connect to the server.
Multiple endpoints can be created but every endpoint is independent of the other, ie sockets on one endpoint cannot communicate with sockets on another endpoint.

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

While sockets connect through the endpoint, communication between sockets cannot occur on the endpoint level. Sockets have to join a channel to communicate
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
When a user joins a channel, some private information can be assigned to the user. This assign could be viewed as a cookie that is only available serverside.
The presence is the current state of the user. When you reassign a new presence information to a user, all other users connected to the same channel are informed of the change.
This could be used as *user is typing*, *user is away*, etc. The channelData is information that is stored on the channel and accessible from anywhere the channel is available.
It can be anything from a boolean to an instance of a class. This data cannot be accessed from another channel as it is private to the channel.

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
    import PondClientSocket from "pondsocket/client";

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

## PondLive

PondLive is a framework that uses PondSocket to provide realtime functionality to your application.
PondLive is a server side framework that can be used to render HTML pages with realtime functionality to the browser,
eliminating the need for a frontend framework.

```js
    import {PondServer, LiveFactory, html} from "pondsocket";

const server = new PondServer();

const Counter = LiveFactory({
    routes: [],

    mount(params, socket, router) {
        socket.assign({
            count: 0
        });
    },

    manageStyles(css) {
        return css`
                    .counter {
                        font-size: 2rem;
                        font-weight: bold;
                        color: ${this.count % 10 === 0 ? 'green' : this.count % 2 === 0 ? 'red' : 'blue'};
                    }
                `;
    },

    onEvent(event, socket, router) {
        if (event.type === 'increment') {
            socket.assign({
                count: this.count + 1
            });


        } else if (event.type === 'decrement') {
            socket.assign({
                count: this.count - 1
            });
        }
    },

    render(renderRoutes, classes) {
        return html`
                    <div>
                        <button pond-click="increment">+</button>
                        <span class="${classes.counter}">${this.count}</span>
                        <button pond-click="decrement">-</button>
                    </div>
                    ${renderRoutes()}
                `;
    }
})

server.usePondLive([{
    path: '/counter',
    Component: Counter
}]);

server.listen(3000, () => {
    console.log('Listening on port 3000');
});
```

The above example shows a simple counter that can be incremented and decremented.
The component is a function that returns an object with the following properties:

* routes: An array of nested routes that can be used to render nested components within the component
* mount: A function that is called when the component is mounted. This function is called with the params, socket,
  router and the component instance.
* onEvent: A function that is called when an event is received from the browser. This function is called with the event,
  current readonly socketContext, socket, router and the component instance.
* render: A function that is called when the component is rendered. This returns the html that is rendered to the
  browser.

#### Lifecycle of a component

###### Mounting

When a http request is made to the server, the server checks if the request is for a static file. If it is not, the
request is passed to the PondLive router.
The router checks if the request matches any of the routes. If it does, the component is mounted and the mount function
is called.
At the stage the version of the socket available to the component is a http socket. This socket is used to send the
initial html to the browser.
This socket can not subscribe to any events or send any messages. The socket is only used to send the initial html to
the browser.

###### Rendering

During the render process the information assigned to the socket is available to the component. The component can use
this information to render the html.
The html is sent to the browser and the browser renders the html. The browser then attempts to establish a websocket
connection with the server.
If successful, the browser also sends an event to the server to inform it that the html has been rendered.

###### onRendered

When the server receives the event that the html has been rendered, the server upgrades the socket to a websocket
connection.
The server then calls the onRendered function. This function is called with the socket, router and the component
instance.
The socket is now a websocket socket and can be used to send and receive messages. This socket can also subscribe to
events from the client, other clients or even other components.

###### onEvent

When an event is received from the client, the onEvent function is called. This function is called with the event,
current readonly socketContext, socket, router and the component instance.
The event can be used to update the socketContext and the socketContext can be used to render the html.

###### onInfo

When other serverside actors emit an event, the onInfo function is called. This function is called with the event,
current readonly socketContext, socket, router and the component instance.
This can be useful to modify the state of the component based on events from other actors, like a database.

###### onUnmount

When the component is unmounted, the onUnmount function is called. This function is called with the socket's context,
and the socket.
This function can be used to clean up any resources that were created during the mount function.
This function does not render the component and thus does not send any html to the browser.

###### manageStyles

When the component is rendered, the manageStyles function is called. This function is called with the socket's context,
and the socket.
A css string is returned from this function and is used to during the render process to add the styles to the html.

#### PondLive Router

The router is passed through the mount, onEvent, onInfo, onUnmount and render functions.
With the router you can navigate to other components, change the pageTitle and display a flash message

```js
    router.navigateTo('/counter');
router.replace('/counter');

router.pageTitle = 'Counter';
router.flashMessage = 'Hello World';
```
