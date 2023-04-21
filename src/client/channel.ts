import { PresenceEventTypes, ServerActions, ClientActions, PondState, ChannelState } from '../enums';
import { SimpleSubject, SimpleBehaviorSubject, Unsubscribe } from '../server/utils/subjectUtils';
import {
    PondPresence,
    PresencePayload,
    ChannelEvent,
    ChannelReceivers,
    JoinParams,
    ClientMessage,
    PondMessage,
// eslint-disable-next-line import/no-unresolved
} from '../types';

type Publisher = (data: ClientMessage) => void;

export class Channel {
    private readonly _name: string;

    private readonly _joinParams: JoinParams;

    private readonly _receiver: SimpleSubject<ChannelEvent>;

    private readonly _clientState: SimpleBehaviorSubject<PondState>;

    private readonly _joinState: SimpleBehaviorSubject<ChannelState>;

    private readonly _publisher: Publisher;

    private _queue: ClientMessage[];

    private _presence: PondPresence[];

    private readonly _presenceSub: Unsubscribe;

    constructor (publisher: Publisher, clientState: SimpleBehaviorSubject<PondState>, name: string, receiver: SimpleSubject<ChannelEvent>, params: JoinParams = {
    }) {
        this._name = name;
        this._queue = [];
        this._presence = [];
        this._joinParams = params;
        this._publisher = publisher;
        this._clientState = clientState;
        this._receiver = new SimpleSubject<ChannelEvent>();
        this._joinState = new SimpleBehaviorSubject<ChannelState>(ChannelState.IDLE);
        this._presenceSub = this._init(receiver);
    }

    /**
     * @desc Connects to the channel.
     */
    public join () {
        if (this._joinState.value === ChannelState.CLOSED) {
            throw new Error('This channel has been closed');
        }

        const joinMessage: ClientMessage = {
            action: ClientActions.JOIN_CHANNEL,
            channelName: this._name,
            event: ClientActions.JOIN_CHANNEL,
            payload: this._joinParams,
        };

        this._joinState.next(ChannelState.JOINING);
        if (this._clientState.value === PondState.OPEN) {
            this._publisher(joinMessage);
        } else {
            this._queue.push(joinMessage);
        }
    }

    /**
     * @desc Disconnects from the channel.
     */
    public leave () {
        const leaveMessage: ClientMessage = {
            action: ClientActions.LEAVE_CHANNEL,
            channelName: this._name,
            event: ClientActions.LEAVE_CHANNEL,
            payload: {
            },
        };

        this._publish(leaveMessage);
        this._joinState.next(ChannelState.CLOSED);
        this._presenceSub();
    }

    /**
     * @desc Monitors the channel for messages.
     * @param callback - The callback to call when a message is received.
     */
    public onMessage (callback: (event: string, message: PondMessage) => void) {
        return this._receiver.subscribe((data) => {
            if (data.action !== ServerActions.PRESENCE) {
                return callback(data.event, data.payload);
            }
        });
    }

    /**
     * @desc Monitors the channel for messages.
     * @param event - The event to monitor.
     * @param callback - The callback to call when a message is received.
     */
    public onMessageEvent (event: string, callback: (message: PondMessage) => void) {
        return this.onMessage((eventReceived, message) => {
            if (eventReceived === event) {
                return callback(message);
            }
        });
    }

    /**
     * @desc Monitors the channel state of the channel.
     * @param callback - The callback to call when the connection state changes.
     */
    public onChannelStateChange (callback: (connected: ChannelState) => void) {
        return this._joinState.subscribe((data) => {
            callback(data);
        });
    }

    /**
     * @desc Detects when clients join the channel.
     * @param callback - The callback to call when a client joins the channel.
     */
    public onJoin (callback: (presence: PondPresence) => void) {
        return this._subscribeToPresence((event, payload) => {
            if (event === PresenceEventTypes.JOIN) {
                return callback(payload.changed);
            }
        });
    }

    /**
     * @desc Detects when clients leave the channel.
     * @param callback - The callback to call when a client leaves the channel.
     */
    public onLeave (callback: (presence: PondPresence) => void) {
        return this._subscribeToPresence((event, payload) => {
            if (event === PresenceEventTypes.LEAVE) {
                return callback(payload.changed);
            }
        });
    }

    /**
     * @desc Detects when clients change their presence in the channel.
     * @param callback - The callback to call when a client changes their presence in the channel.
     */
    public onPresenceChange (callback: (presence: PresencePayload) => void) {
        return this._subscribeToPresence((event, payload) => {
            if (event === PresenceEventTypes.UPDATE) {
                return callback(payload);
            }
        });
    }

    /**
     * @desc Sends a message to specific clients in the channel.
     * @param event - The event to send.
     * @param payload - The message to send.
     * @param recipient - The clients to send the message to.
     */
    public sendMessage (event: string, payload: PondMessage, recipient: string[]) {
        this._send(event, payload, recipient);
    }

    /**
     * @desc Broadcasts a message to every other client in the channel except yourself.
     * @param event - The event to send.
     * @param payload - The message to send.
     */
    public broadcastFrom (event: string, payload: PondMessage) {
        this._send(event, payload, 'all_except_sender');
    }

    /**
     * @desc Broadcasts a message to the channel, including yourself.
     * @param event - The event to send.
     * @param payload - The message to send.
     */
    public broadcast (event: string, payload: PondMessage) {
        this._send(event, payload);
    }

    /**
     * @desc Gets the current connection state of the channel.
     */
    public get channelState (): ChannelState {
        return this._joinState.value;
    }

    /**
     * @desc Gets the current presence of the channel.
     */
    public getPresence (): PondPresence[] {
        return this._presence;
    }

    /**
     * @desc Monitors the presence of the channel.
     * @param callback - The callback to call when the presence changes.
     */
    public onUsersChange (callback: (users: PondPresence[]) => void) {
        return this._subscribeToPresence((_event, payload) => callback(payload.presence));
    }

    /**
     * @desc Gets the current connection state of the channel.
     */
    public isConnected () {
        return this._joinState.value === ChannelState.JOINED || this._joinState.value === ChannelState.JOINING;
    }

    /**
     * @desc Monitors the connection state of the channel.
     * @param callback - The callback to call when the connection state changes.
     */
    public onConnectionChange (callback: (connected: boolean) => void) {
        return this.onChannelStateChange((state) => {
            callback(state === ChannelState.JOINED || state === ChannelState.JOINING);
        });
    }

    private _send (event: string, payload: PondMessage, receivers: ChannelReceivers = 'all_users') {
        const message: ClientMessage = {
            action: ClientActions.BROADCAST,
            channelName: this._name,
            event,
            payload,
            addresses: receivers,
        };

        this._publish(message);
    }

    private _publish (data: ClientMessage) {
        if (this._clientState.value === PondState.OPEN) {
            if (this._joinState.value === ChannelState.JOINED || this._joinState.value === ChannelState.JOINING) {
                this._publisher(data);
            }

            return;
        }

        this._queue.push(data);
    }

    private _subscribeToPresence (callback: (event: PresenceEventTypes, payload: PresencePayload) => void) {
        return this._receiver.subscribe((data) => {
            if (data.action === ServerActions.PRESENCE) {
                return callback(data.event, data.payload);
            }
        });
    }

    private _init (receiver: SimpleSubject<ChannelEvent>): Unsubscribe {
        const unsubMessages = receiver.subscribe((data) => {
            if (data.channelName === this._name) {
                if (this._joinState.value !== ChannelState.JOINED) {
                    this._joinState.next(ChannelState.JOINED);
                }
                this._receiver.next(data);
            }
        });

        const unsubStateChange = this._clientState.subscribe((state) => {
            if (state === PondState.OPEN && this._queue.length > 0) {
                const joinMessage: ClientMessage = {
                    action: ClientActions.JOIN_CHANNEL,
                    channelName: this._name,
                    event: ClientActions.JOIN_CHANNEL,
                    payload: this._joinParams,
                };

                this._publisher(joinMessage);

                this._queue
                    .filter((message) => message.action !== ClientActions.JOIN_CHANNEL)
                    .forEach((message) => {
                        this._publisher(message);
                    });

                this._joinState.next(ChannelState.JOINED);

                this._queue = [];
            } else if (state !== PondState.OPEN) {
                this._joinState.next(ChannelState.STALLED);
            }
        });

        const unsubPresence = this._subscribeToPresence((_, payload) => {
            this._presence = payload.presence;
        });

        return () => {
            unsubMessages();
            unsubStateChange();
            unsubPresence();
        };
    }
}
