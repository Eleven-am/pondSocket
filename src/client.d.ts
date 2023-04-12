// eslint-disable-next-line import/no-unresolved
import { PondMessage, JoinParams, PondPresence } from './types';
export type PondState = 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED';
type Unsubscribe = () => void;

export interface PresencePayload {
    changed: PondPresence;
    presence: PondPresence[];
}

export declare class Channel {
    /**
     * @desc Connects to the channel.
     */
    public join(): void;

    /**
     * @desc Disconnects from the channel.
     */
    public leave(): void;

    /**
     * @desc Monitors the channel for messages.
     * @param event - The event to monitor.
     * @param callback - The callback to call when a message is received.
     */
    public onMessage(event: string, callback: (message: PondMessage) => void): Unsubscribe;

    /**
     * @desc Monitors the connection state of the channel.
     * @param callback - The callback to call when the connection state changes.
     */
    public onConnectionChange(callback: (connected: boolean) => void): Unsubscribe;

    /**
     * @desc Detects when clients join the channel.
     * @param callback - The callback to call when a client joins the channel.
     */
    public onJoin(callback: (presence: PondPresence) => void): Unsubscribe;

    /**
     * @desc Detects when clients leave the channel.
     * @param callback - The callback to call when a client leaves the channel.
     */
    public onLeave(callback: (presence: PondPresence) => void): Unsubscribe;

    /**
     * @desc Detects when clients change their presence in the channel.
     * @param callback - The callback to call when a client changes their presence in the channel.
     */
    public onPresenceChange(callback: (presence: PresencePayload) => void): Unsubscribe;

    /**
     * @desc Sends a message to specific clients in the channel.
     * @param event - The event to send.
     * @param payload - The message to send.
     * @param recipient - The clients to send the message to.
     */
    public sendMessage(event: string, payload: PondMessage, recipient: string[]): void;

    /**
     * @desc Broadcasts a message to every other client in the channel except yourself.
     * @param event - The event to send.
     * @param payload - The message to send.
     */
    public broadcastFrom(event: string, payload: PondMessage): void;

    /**
     * @desc Broadcasts a message to the channel, including yourself.
     * @param event - The event to send.
     * @param payload - The message to send.
     */
    public broadcast(event: string, payload: PondMessage): void;

    /**
     * @desc Gets the current connection state of the channel.
     */
    public isConnected(): boolean;


    /**
     * @desc check is the channel has been closed.
     */
    public hasClosed(): boolean;

    /**
     * @desc Gets the current presence of the channel.
     */
    public getPresence(): PondPresence[];

    /**
     * @desc Monitors the presence of the channel.
     * @param callback - The callback to call when the presence changes.
     */
    public onUsersChange(callback: (users: PondPresence[]) => void): Unsubscribe;
}

export default class PondClient {
    constructor(endpoint: string, params?: Record<string, any>);

    /**
     * @desc Connects to the server and returns the socket.
     */
    public connect(backoff?: number): void;

    /**
     * @desc Returns the current state of the socket.
     */
    public getState(): PondState;

    /**
     * @desc Disconnects the socket.
     */
    public disconnect(): void;

    /**
     * @desc Creates a channel with the given name and params.
     * @param name - The name of the channel.
     * @param params - The params to send to the server.
     */
    public createChannel(name: string, params?: JoinParams): Channel;
}
