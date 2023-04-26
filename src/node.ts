import PondSocketClient from './client';
// eslint-disable-next-line import/no-unresolved
import { ChannelEvent } from './types';

const WebSocket = require('websocket').w3cwebsocket as typeof import('websocket').w3cwebsocket;

export default class PondClient extends PondSocketClient {
    /**
     * @desc Connects to the server and returns the socket.
     */
    public connect (backoff = 1) {
        const socket = new WebSocket(this._address.toString());

        socket.onopen = () => {
            this._connectionState.publish(true);
        };

        socket.onmessage = (message) => {
            const data = JSON.parse(message.data as string) as ChannelEvent;

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
}
