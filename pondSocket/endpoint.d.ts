/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { IncomingConnection } from "./types";
import internal from "stream";
import { WebSocket, WebSocketServer } from "ws";
import { IncomingMessage } from "http";
import { BaseClass, default_t, PondPath, Resolver, ResponsePicker } from "../pondBase";
import { ChannelHandler, PondChannel } from "./pondChannel";
import { ChannelInfo } from "./channel";
import { PondResponse } from "./pondResponse";
export declare type EndpointHandler = (req: IncomingConnection, res: PondResponse<ResponsePicker.POND>, endpoint: Endpoint) => void;
export declare class Endpoint extends BaseClass {
    private readonly _handler;
    private readonly _server;
    private readonly _channels;
    private readonly _sockets;
    constructor(server: WebSocketServer, handler: EndpointHandler);
    /**
     * @desc Sends a message to a client
     * @param socket - The socket to send the message to
     * @param message - The message to send
     */
    private static _sendMessage;
    /**
     * @desc Accepts a new socket join request to the room provided using the handler function to authorise the socket
     * @param path - the pattern to accept || can also be a regex
     * @param handler - the handler function to authenticate the socket
     *
     * @example
     * const channel = endpoint.createChannel('channel:*', (req, res) => {
     *   const isAdmin = req.clientAssigns.admin;
     *   if (!isAdmin)
     *      return res.reject("You are not an admin");
     *
     *   res.accept({
     *      assign: {
     *         admin: true,
     *         joinedDate: new Date()
     *      },
     *      presence: {state: 'online'},
     *      channelData: {private: true}
     *   });
     * });
     *
     * channel.on('ping', (req, res, channel) => {
     *     const users = channel.getPresence();
     *     res.assign({
     *        assign: {
     *           pingDate: new Date(),
     *           users: users.length
     *        }
     *    });
     * })
     */
    createChannel(path: PondPath, handler: ChannelHandler): PondChannel;
    /**
     * @desc Authenticates the client to the endpoint
     * @param request - Incoming request
     * @param socket - Incoming socket
     * @param head - Incoming head
     * @param data - Incoming the data resolved from the handler
     */
    authoriseConnection(request: IncomingMessage, socket: internal.Duplex, head: Buffer, data: Resolver): Promise<void>;
    /**
     * @desc Closes a client connection to the endpoint.
     * @param clientId - The id of the client to close the connection to.
     */
    closeConnection(clientId: string): void;
    /**
     * @desc Sends a message to a client on the endpoint.
     * @param clientId - The id of the client to send the message to.
     * @param event - The event to send the message with.
     * @param message - The message to send.
     */
    send(clientId: string | string[], event: string, message: default_t): void;
    /**
     * @desc lists all the channels in the endpoint
     */
    listChannels(): ChannelInfo[];
    /**
     * @desc lists all the clients in the endpoint
     */
    listConnections(): WebSocket[];
    /**
     * @desc Broadcasts a message to all clients in the endpoint.
     * @param event - The event to broadcast.
     * @param message - The message to broadcast.
     */
    broadcast(event: string, message: default_t): void;
    /**
     * @desc Searches for a channel in the endpoint.
     * @param name - The name of the channel to search for.
     */
    private _findChannel;
    /**
     * @desc Manages a new socket connection
     * @param cache - The socket cache
     * @private
     */
    private _manageSocket;
    /**
     * @desc Finds a pond channel in the endpoint.
     * @param channelName - The name of the channel to find.
     * @private
     */
    private _findPondChannel;
    /**
     * @desc Handles a message sent from a client
     * @param cache - The socket cache of the client
     * @param message - The message to handle
     * @private
     */
    private _readMessage;
    /**
     * @desc Deals with a message sent from a client
     * @param cache - The socket cache of the client
     * @param message - The message to handle
     */
    private _handleMessage;
    /**
     * @desc Handles a channel action by finding the channel and executing the callback.
     * @param channelName - The name of the channel to find.
     * @param event - The event to execute.
     * @param action - The action to execute.
     * @private
     */
    private _channelAction;
}
