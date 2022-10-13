import {
  Anything,
  BaseClass,
  BasePromise,
  default_t,
  PondBase,
  PondError,
  PondPath,
  RejectPromise,
  Subscription
} from "../pondbase";
import { Channel, ChannelEvent, ChannelInfo } from "./channel";
import { WebSocket } from "ws";
import { PondSenders } from "./enums";
import {
    IncomingChannelMessage, IncomingJoinMessage,
    PondMessage,
    PondResponseAssigns,
    ResponseResolver,
    ServerMessage,
    SocketCache
} from "./types";
import { PondResponse } from "./pondResponse";

export type ChannelHandler = (req: IncomingJoinMessage, res: PondResponse, channel: Channel) => void;

export type Subscriber = (event: ChannelEvent) => Anything<RejectPromise<{ event: string; channelName: string; }> | boolean>

export class PondChannel extends BaseClass {
  public readonly path: PondPath;
  private readonly _handler: ChannelHandler;
  private readonly _channels: PondBase<Channel>;
  private readonly _subscriptions: Record<string, ({ name: string, sub: Subscription })[]>;
  private readonly _subscribers: Set<Subscriber>;

  constructor(path: PondPath, handler: ChannelHandler) {
    super();
    this._channels = new PondBase<Channel>();
    this._handler = handler;
    this.path = path;
    this._subscribers = new Set();
    this._subscriptions = {};
  }

  /**
   * @desc Gets a list of all the channels in the endpoint.
   */
  public get info(): ChannelInfo[] {
    return this._channels.map(channel => channel.info);
  }

  /**
   * @desc Sends a message to a client
   * @param socket - The socket to send the message to
   * @param message - The message to send
   */
  private static _sendMessage(socket: WebSocket, message: ServerMessage) {
    socket.send(JSON.stringify(message));
  }

  /**
   * @desc A listener for a channel event
   * @param event - The event to listen for, can be a regex
   * @param callback - The callback to call when the event is received
   */
  public on(event: PondPath, callback: (req: IncomingChannelMessage, res: PondResponse, channel: Channel) => void) {
    const resolver = this._buildHandler(event, callback);

    this._subscribers.add(resolver);
  }

  /**
   * @desc Add new user to channel
   * @param user - The user to add to the channel
   * @param channelName - The name of the channel
   * @param joinParams - The params to join the channel with
   */
  public addUser(user: SocketCache, channelName: string, joinParams: default_t): Promise<void> {
    return BasePromise<void, { channelName: string }>({ channelName }, async (resolve, reject) => {
      let channel: Channel;
      channel = this._channels.query(c => c.name === channelName)[0]?.doc;
      const resolved = this.generateEventRequest(this.path, channelName);
      if (!resolved)
        return reject("Invalid channel name", 400);

      if (!channel)
        channel = await this._createChannel(channelName);

      const assigns = {
        assigns: user.assigns,
        presence: {},
        channelData: channel.data
      };

      const request: IncomingJoinMessage = {
        joinParams, ...resolved,
        clientId: user.clientId, channelName,
        clientAssigns: user.assigns
      };

      const resolver = (data: ResponseResolver) => {
        if (data.error)
          return reject(data.error.errorMessage, data.error.errorCode);

        const { assigns, presence, channelData } = data.assigns;
        this._subscriptions[user.clientId] = this._subscriptions[user.clientId] || [];

        const sub = channel.subscribeToMessages(user.clientId, (event: ServerMessage) => {
          PondChannel._sendMessage(user.socket, event);
        });

        channel.addUser({
          presence: presence,
          assigns: assigns,
          channelData: channelData,
          client: user
        });

        this._subscriptions[user.clientId].push({ name: channelName, sub });

        if (data.message)
          channel.sendTo(data.message.event, data.message.payload, PondSenders.POND_CHANNEL, [user.clientId]);

        resolve();
      };

      const response = new PondResponse({ channelName }, assigns, resolver);
      await this._handler(request, response, channel);
    });
  }

  /**
   * @desc Sends a message to a channel in the endpoint.
   * @param channelName - The name of the channel to send the message to.
   * @param event - The event to send the message with.
   * @param message - The message to send.
   */
  public broadcastToChannel(channelName: string, event: string, message: PondMessage): void {
    this._execute(channelName, channel => {
      channel.broadcast(event, message, PondSenders.POND_CHANNEL);
    });
  }

  /**
   * @desc Closes a client connection to a channel in the endpoint.
   * @param channelName - The name of the channel to close the connection to.
   * @param clientId - The id of the client to close the connection to.
   */
  public closeFromChannel(channelName: string, clientId: string | string[]): void {
    this._execute(channelName, channel => {
      this._removeSubscriptions(clientId, channelName);
      channel.removeUser(clientId);
    });
  }

  /**
   * @desc Modify the presence of a client in a channel on the endpoint.
   * @param channelName - The name of the channel to modify the presence of.
   * @param clientId - The id of the client to modify the presence of.
   * @param assigns - The assigns to modify the presence with.
   */
  public modifyPresence(channelName: string, clientId: string, assigns: PondResponseAssigns): void {
    this._execute(channelName, channel => {
      channel.updateUser(clientId, assigns.presence || {}, assigns.assigns || {});
    });
  }

  /**
   * @desc Gets the information of the channel
   * @param channelName - The name of the channel to get the information of.
   */
  public getChannelInfo(channelName: string): ChannelInfo {
    return this._execute(channelName, channel => {
      return channel.info;
    });
  }

  /**
   * @desc Sends a message to the channel
   * @param channelName - The name of the channel to send the message to.
   * @param clientId - The clientId to send the message to, can be an array of clientIds
   * @param event - The event to send the message to
   * @param message - The message to send
   */
  public send(channelName: string, clientId: string | string[], event: string, message: default_t): void {
    const clients = Array.isArray(clientId) ? clientId : [clientId];
    this._execute(channelName, channel => {
      channel.sendTo(event, message, PondSenders.POND_CHANNEL, clients);
    });
  }

  /**
   * @desc Searches for a channel in the endpoint.
   * @param query - The query to search for.
   */
  public findChannel(query: (channel: Channel) => boolean): Channel | null {
    return this._channels.find(query)?.doc || null;
  }

  /**
   * @desc Subscribes a function to a channel in the endpoint.
   * @param channelName - The name of the channel to subscribe to.
   * @param callback - The function to subscribe to the channel.
   */
  public subscribe(channelName: string, callback: Subscriber): Subscription {
    const channel = this._channels.query(c => c.name === channelName)[0];
    if (channel)
      return channel.doc.subscribe(callback);

    const newChannel = this._createChannel(channelName);
    return newChannel.subscribe(callback);
  }

  /**
   * @desc removes a user from all channels
   * @param clientId - The id of the client to remove
   */
  public removeUser(clientId: string): void {
    if (this._subscriptions[clientId]) {
      this._subscriptions[clientId].forEach(doc => doc.sub.unsubscribe());
      delete this._subscriptions[clientId];
      for (const channel of this._channels.generate())
        if (channel.hasUser(clientId))
          channel.removeUser(clientId);
    }
  }

  /**
   * @desc Executes a function on a channel in the endpoint.
   * @param channelName - The name of the channel to execute the function on.
   * @param handler - The function to execute on the channel.
   * @private
   */
  private _execute<A>(channelName: string, handler: ((channel: Channel) => A)) {
    const newChannel = this.findChannel(c => c.name === channelName) || null;
    if (newChannel)
      return handler(newChannel);

    throw new PondError("Channel does not exist", 404, channelName);
  }

  /**
   * @desc Creates a new channel in the endpoint.
   * @param channelName - The name of the channel to create.
   * @private
   */
  private _createChannel(channelName: string): Channel {
    const newChannel = this._channels.createDocument(doc => {
      return new Channel(channelName, doc.removeDoc.bind(doc));
    });

    this._subscribers.forEach(subscriber => {
      newChannel.doc.subscribe(subscriber);
    });

    return newChannel.doc;
  }

  /**
   * @desc Removes a subscription from a user
   * @param clientId - The id of the client to remove the subscription from
   * @param channelName - The name of the channel to remove the subscription from
   * @private
   */
  private _removeSubscriptions(clientId: string | string[], channelName: string) {
    const clients = Array.isArray(clientId) ? clientId : [clientId];
    clients.forEach(client => {
      const subs = this._subscriptions[client];
      if (subs) {
        const sub = subs.find(s => s.name === channelName);
        if (sub) {
          sub.sub.unsubscribe();
          subs.splice(subs.indexOf(sub), 1);
        }
      }
    });
  }

  /**
   * @desc Builds an event handler for a channel
   * @param event - The event to build the handler for
   * @param callback - The callback to build the handler for
   * @private
   */
  private _buildHandler(event: PondPath, callback: (req: IncomingChannelMessage, res: PondResponse, channel: Channel) => void) {
    return (data: ChannelEvent) => {
      let returnVal: RejectPromise<{ event: string; channelName: string; }> | undefined = undefined;
      const info = this.generateEventRequest(event, data.event);

      if (info) {
        const assigns = {
          assigns: data.clientAssigns,
          presence: data.clientPresence,
          channelData: data.channel.data
        };

        const request: IncomingChannelMessage = {
          channelName: data.channelName,
          message: data.payload,
          params: info.params,
          query: info.query,
          event: data.event,
          client: {
            clientId: data.clientId,
            clientAssigns: data.clientAssigns,
            clientPresence: data.clientPresence
          }
        };

        const resolver = (innerData: ResponseResolver) => {
          const { presence, assigns, channelData } = innerData.assigns;

          if (innerData.error)
            returnVal = new PondError(innerData.error.errorMessage, innerData.error.errorCode, {
              event: data.event,
              channelName: data.channelName
            });

          else {
            if (!this.isObjectEmpty(channelData))
              data.channel.data = channelData;

            if (!Object.values(PondSenders).includes(data.clientId as any)) {
              data.channel.updateUser(data.clientId, presence, assigns);

              if (innerData.message)
                data.channel.sendTo(
                  innerData.message.event,
                  innerData.message.payload,
                  PondSenders.POND_CHANNEL,
                  [data.clientId]
                );
            }
          }
        };

        const response = new PondResponse(data.clientId, assigns, resolver);
        callback(request, response, data.channel);
      }

      return returnVal || !!info;
    };
  }
}
