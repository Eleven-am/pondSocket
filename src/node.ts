import PondSocketClient from './client';
import { PondState } from './enums';
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
            this._connectionState.next(PondState.OPEN);
        };

        socket.onmessage = (message) => {
            const data = JSON.parse(message.data as string) as ChannelEvent;

            this._broadcaster.next(data);
        };

        socket.onerror = () => {
            this._connectionState.next(PondState.CLOSED);
            setTimeout(() => {
                this.connect(backoff * 2);
            }, backoff * 1000);
        };

        this._socket = socket;
    }
}
