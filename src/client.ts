import { Channel } from './client/channel';
import { PondState } from './enums';
import { SimpleSubject, SimpleBehaviorSubject } from './server/utils/subjectUtils';
// eslint-disable-next-line import/no-unresolved
import { ChannelEvent, JoinParams, ClientMessage } from './types';

export default class PondClient {
    protected readonly _address: URL;

    protected _socket: WebSocket | any | undefined;

    protected _channels: Record<string, Channel>;

    protected readonly _broadcaster: SimpleSubject<ChannelEvent>;

    protected readonly _connectionState: SimpleBehaviorSubject<PondState>;

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
        this._channels = {};

        this._broadcaster = new SimpleSubject<ChannelEvent>();
        this._connectionState = new SimpleBehaviorSubject<PondState>(PondState.CLOSED);
    }

    /**
     * @desc Connects to the server and returns the socket.
     */
    public connect (backoff = 1) {
        const socket = new WebSocket(this._address.toString());

        socket.onopen = () => {
            this._connectionState.publish(PondState.OPEN);
        };

        socket.onmessage = (message) => {
            const data = JSON.parse(message.data) as ChannelEvent;

            this._broadcaster.publish(data);
        };

        socket.onerror = () => {
            this._connectionState.publish(PondState.CLOSED);
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

    /**
     * @desc Subscribes to the connection state.
     * @param callback - The callback to call when the state changes.
     */
    public onConnectionChange (callback: (state: PondState) => void) {
        return this._connectionState.subscribe(callback);
    }

    private _createPublisher () {
        return (message: ClientMessage) => {
            if (this._connectionState.value === PondState.OPEN) {
                this._socket.send(JSON.stringify(message));
            }
        };
    }
}
