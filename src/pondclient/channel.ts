import {Observable, Subject, Subscription} from "rxjs";
import {WebSocketSubject} from "rxjs/webSocket";
import {filter} from "rxjs/operators";
import {ClientActions, ClientMessage, PondAssigns, PondMessage, PondPresence, ServerMessage} from "../pondsocket";
import {Subject as Broadcast} from "../pondbase";

export type ChannelParams = PondAssigns;

export class Channel {
    public readonly channel: string;
    private subscriptions: Subscription[] = [];
    private readonly socket: WebSocketSubject<ServerMessage | ClientMessage>;
    private readonly params: ChannelParams;
    private readonly subject: Subject<ServerMessage>;
    private readonly connectedSubject: Broadcast<boolean, void>;
    private readonly presenceSubject = new Subject<PondPresence[]>();

    constructor(channel: string, params: ChannelParams, socket: WebSocketSubject<ServerMessage | ClientMessage>) {
        this.channel = channel;
        this.params = params;
        this.socket = socket;
        this.subject = new Subject<ServerMessage>();
        this.connectedSubject = new Broadcast<boolean, void>(false);
    }

    get isActive() {
        return this.connectedSubject.value;
    }

    /**
     * @desc Connects to the channel.
     */
    join() {
        if (this.connectedSubject.value)
            return this;

        const observable = this.init();
        const subscription = observable
            .subscribe(message => {
                this.connectedSubject.publish(true);
                if (message.action === "PRESENCE")
                    this.presenceSubject.next(message.payload.presence);

                else if (message.action === "MESSAGE")
                    this.subject.next(message);

                else if (message.event === "KICKED_FROM_CHANNEL")
                    this.leave();
            });

        this.subscriptions.push(subscription);
        return this;
    }

    /**
     * @desc Disconnects from the channel.
     */
    leave() {
        this.connectedSubject.publish(false);
        this.presenceSubject.complete();
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
        this.subscriptions = [];
        this.subject.complete();
    }

    /**
     * @desc Monitors the presence state of the channel.
     * @param callback - The callback to call when the presence state changes.
     */
    onPresenceUpdate(callback: (presence: PondPresence[]) => void) {
        const sub = this.presenceSubject.subscribe(callback);
        this.subscriptions.push(sub);
        return sub;
    }

    /**
     * @desc Monitors the channel for messages.
     * @param callback - The callback to call when a message is received.
     */
    onMessage(callback: (event: string, message: PondMessage) => void) {
        const sub = this.subject
            .pipe(
                filter((message: ServerMessage) => message.action === "MESSAGE")
            )
            .subscribe(message => callback(message.event, message.payload));
        this.subscriptions.push(sub);
        return sub;
    }

    /**
     * @desc Broadcasts a message to the channel, including yourself.
     * @param event - The event to send.
     * @param payload - The message to send.
     */
    broadcast(event: string, payload: PondMessage) {
        const message: ClientMessage = {
            channelName: this.channel,
            payload, event,
            action: ClientActions.BROADCAST
        };

        this.socket.next(message);
    }

    /**
     * @desc Broadcasts a message to every other client in the channel except yourself.
     * @param event - The event to send.
     * @param payload - The message to send.
     */
    broadcastFrom(event: string, payload: PondMessage) {
        const message: ClientMessage = {
            channelName: this.channel,
            payload, event,
            action: ClientActions.BROADCAST_FROM
        };

        this.socket.next(message);
    }

    /**
     * @desc Updates the presence state of the current client in the channel.
     * @param presence - The presence state to update.
     */
    updatePresence(presence: PondPresence) {
        this.socket.next({
            action: ClientActions.UPDATE_PRESENCE,
            channelName: this.channel,
            event: "PRESENCE",
            payload: presence
        });
    }

    /**
     * @desc Sends a message to specific clients in the channel.
     * @param event - The event to send.
     * @param payload - The message to send.
     * @param recipient - The clients to send the message to.
     */
    sendMessage(event: string, payload: PondMessage, recipient: string[]) {
        const addresses = Array.isArray(recipient) ? recipient : [recipient];

        const message: ClientMessage = {
            channelName: this.channel,
            payload, event, addresses,
            action: ClientActions.SEND_MESSAGE_TO_USER
        };

        this.socket.next(message);
    }

    /**
     * @desc Listens for the connections state of the channel.
     * @param callback - The callback to call when the connection state changes.
     */
    onConnectionChange(callback: (connected: boolean) => void) {
        const sub = this.connectedSubject.subscribe(callback) as any;
        this.subscriptions.push(sub);
        return sub;
    }

    /**
     * @desc Initializes the channel.
     * @private
     */
    private init(): Observable<ServerMessage> {
        const observable: Observable<ServerMessage | ClientMessage> = this.socket.multiplex(
            () => ({
                action: "JOIN_CHANNEL",
                channelName: this.channel,
                event: "JOIN_CHANNEL",
                payload: this.params
            }),
            () => ({
                action: "LEAVE_CHANNEL",
                channelName: this.channel,
                event: "LEAVE_CHANNEL",
                payload: this.params
            }),
            message => message.channelName === this.channel
        );
        return observable as Observable<ServerMessage>;
    }
}
