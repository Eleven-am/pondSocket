import { BehaviorSubject, ChannelEvent, ChannelState, Events, JoinParams, Subject } from '@eleven-am/pondsocket-common';

import { Channel } from '../core/channel';
import { ClientMessage } from '../types';

export default class PondClient {
    protected readonly _address: URL;

    #channels: Record<string, Channel>;

    protected _socket: WebSocket | any | undefined;

    protected readonly _broadcaster: Subject<ChannelEvent>;

    protected readonly _connectionState: BehaviorSubject<boolean>;

    constructor (endpoint: string, params: Record<string, any> = {}) {
        let address: URL;

        try {
            address = new URL(endpoint);
        } catch (e) {
            address = new URL(window.location.toString());
            address.pathname = endpoint;
        }

        const query = new URLSearchParams(params);

        address.search = query.toString();
        const protocol = address.protocol === 'https:' ? 'wss:' : 'ws:';

        if (address.protocol !== 'wss:' && address.protocol !== 'ws:') {
            address.protocol = protocol;
        }

        this._address = address;
        this.#channels = {};

        this._broadcaster = new Subject<ChannelEvent>();
        this._connectionState = new BehaviorSubject<boolean>(false);
        this.#init();
    }

    /**
     * @desc Connects to the server and returns the socket.
     */
    public connect (backoff = 1) {
        const socket = new WebSocket(this._address.toString());

        socket.onopen = () => {
            this._connectionState.publish(true);
        };

        socket.onmessage = (message) => {
            const data = JSON.parse(message.data) as ChannelEvent;

            this._broadcaster.publish(data);
        };

        socket.onerror = () => {
            this._connectionState.publish(false);
            setTimeout(() => {
                this.connect(backoff * 2);
            }, backoff * 1000);
        };

        this._socket = socket;
    }

    /**
     * @desc Returns the current state of the socket.
     */
    public getState () {
        return this._connectionState.value as boolean;
    }

    /**
     * @desc Disconnects the socket.
     */
    public disconnect () {
        Object.values(this.#channels).forEach((channel) => channel.leave());
        this._connectionState.publish(false);
        this._socket?.close();
        this.#channels = {};
    }

    /**
     * @desc Creates a channel with the given name and params.
     * @param name - The name of the channel.
     * @param params - The params to send to the server.
     */
    public createChannel (name: string, params?: JoinParams) {
        if (this.#channels[name] && this.#channels[name].channelState !== ChannelState.CLOSED) {
            return this.#channels[name];
        }

        const publisher = this.#createPublisher();

        const channel = new Channel(publisher, this._connectionState, name, params || {});

        this.#channels[name] = channel;

        return channel;
    }

    /**
     * @desc Subscribes to the connection state.
     * @param callback - The callback to call when the state changes.
     */
    public onConnectionChange (callback: (state: boolean) => void) {
        return this._connectionState.subscribe(callback);
    }

    /**
     * @desc Returns a function that publishes a message to the socket.
     * @private
     */
    #createPublisher () {
        return (message: ClientMessage) => {
            if (this._connectionState.value) {
                this._socket.send(JSON.stringify(message));
            }
        };
    }

    /**
     * @desc Handles an acknowledge event. this event is sent when the server adds a client to a channel.
     * @param message - The message to handle.
     * @private
     */
    #handleAcknowledge (message: ChannelEvent) {
        const channel = this.#channels[message.channelName] ?? new Channel(
            this.#createPublisher(),
            this._connectionState,
            message.channelName,
            {},
        );

        this.#channels[message.channelName] = channel;
        channel.acknowledge(this._broadcaster);
    }

    /**
     * @desc Initializes the client.
     * @private
     */
    #init () {
        this._broadcaster.subscribe((message) => {
            if (message.event === Events.ACKNOWLEDGE) {
                this.#handleAcknowledge(message);
            }
        });
    }
}
