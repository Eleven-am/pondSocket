import { Channel } from './client/channel';
import { SimpleSubject, SimpleBehaviorSubject } from './server/utils/subjectUtils';
// eslint-disable-next-line import/no-unresolved
import { ChannelEvent, JoinParams, ClientMessage } from './types';

export type PondState = 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED';

export default class PondClient {
    private readonly address: URL;

    private _socket: WebSocket | undefined;

    private _channels: Record<string, Channel>;

    private readonly _broadcaster: SimpleSubject<ChannelEvent>;

    private readonly _connectionState: SimpleBehaviorSubject<PondState>;

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

        this.address = address;
        this._channels = {};

        this._broadcaster = new SimpleSubject<ChannelEvent>();
        this._connectionState = new SimpleBehaviorSubject<PondState>('CLOSED');
    }

    /**
     * @desc Connects to the server and returns the socket.
     */
    public connect (backoff = 1) {
        const socket = new WebSocket(this.address.toString());

        socket.onopen = () => {
            this._connectionState.publish('OPEN');
        };

        socket.onmessage = (message) => {
            const data = JSON.parse(message.data) as ChannelEvent;

            this._broadcaster.publish(data);
        };

        socket.onerror = () => {
            this._connectionState.publish('CLOSED');
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
        return this._connectionState.value;
    }

    /**
     * @desc Disconnects the socket.
     */
    public disconnect () {
        Object.values(this._channels).forEach((channel) => channel.leave());
        this._socket?.close();
        this._channels = {};
    }

    /**
     * @desc Creates a channel with the given name and params.
     * @param name - The name of the channel.
     * @param params - The params to send to the server.
     */
    public createChannel (name: string, params?: JoinParams) {
        if (this._channels[name] && !this._channels[name].hasClosed()) {
            return this._channels[name];
        }

        const publisher = this._createPublisher();

        const channel = new Channel(publisher, this._connectionState, name, this._broadcaster, params);

        this._channels[name] = channel;

        return channel;
    }

    private _createPublisher () {
        return (message: ClientMessage) => {
            if (this._socket?.readyState === WebSocket.OPEN) {
                this._socket.send(JSON.stringify(message));
            }
        };
    }
}
