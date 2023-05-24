import {
    ChannelState,
    ClientActions,
    ServerActions,
    PresenceEventTypes,
    ChannelReceiver,
    Events,
} from '../enums';
import { SimpleSubject, SimpleBehaviorSubject } from '../subjects/subject';
import type {
    JoinParams,
    ChannelEvent,
    ClientMessage,
    Unsubscribe,
    PondPresence,
    PondMessage,
    PresencePayload,
    ChannelReceivers,
} from '../types';

type Publisher = (data: ClientMessage) => void;

export class Channel {
    readonly #name: string;

    readonly #joinParams: JoinParams;

    readonly #receiver: SimpleSubject<ChannelEvent>;

    readonly #clientState: SimpleBehaviorSubject<boolean>;

    readonly #joinState: SimpleBehaviorSubject<ChannelState>;

    readonly #publisher: Publisher;

    #queue: ClientMessage[];

    #presence: PondPresence[];

    readonly #presenceSub: Unsubscribe;

    constructor (publisher: Publisher, clientState: SimpleBehaviorSubject<boolean>, name: string, receiver: SimpleSubject<ChannelEvent>, params: JoinParams = {
    }) {
        this.#name = name;
        this.#queue = [];
        this.#presence = [];
        this.#joinParams = params;
        this.#publisher = publisher;
        this.#clientState = clientState;
        this.#receiver = new SimpleSubject<ChannelEvent>();
        this.#joinState = new SimpleBehaviorSubject<ChannelState>(ChannelState.IDLE);
        this.#presenceSub = this.#init(receiver);
    }

    /**
     * @desc Connects to the channel.
     */
    public join () {
        if (this.#joinState.value === ChannelState.CLOSED) {
            throw new Error('This channel has been closed');
        }

        const joinMessage: ClientMessage = {
            action: ClientActions.JOIN_CHANNEL,
            channelName: this.#name,
            event: ClientActions.JOIN_CHANNEL,
            payload: this.#joinParams,
        };

        this.#joinState.publish(ChannelState.JOINING);
        if (this.#clientState.value) {
            this.#publisher(joinMessage);
        } else {
            this.#joinState.publish(ChannelState.STALLED);
        }
    }

    /**
     * @desc Disconnects from the channel.
     */
    public leave () {
        const leaveMessage: ClientMessage = {
            action: ClientActions.LEAVE_CHANNEL,
            channelName: this.#name,
            event: ClientActions.LEAVE_CHANNEL,
            payload: {
            },
        };

        this.#publish(leaveMessage);
        this.#joinState.publish(ChannelState.CLOSED);
        this.#presenceSub();
    }

    /**
     * @desc Monitors the channel for messages.
     * @param callback - The callback to call when a message is received.
     */
    public onMessage (callback: (event: string, message: PondMessage) => void) {
        return this.#receiver.subscribe((data) => {
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
        return this.#joinState.subscribe((data) => {
            callback(data);
        });
    }

    /**
     * @desc Detects when clients join the channel.
     * @param callback - The callback to call when a client joins the channel.
     */
    public onJoin (callback: (presence: PondPresence) => void) {
        return this.#subscribeToPresence((event, payload) => {
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
        return this.#subscribeToPresence((event, payload) => {
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
        return this.#subscribeToPresence((event, payload) => {
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
        this.#send(event, payload, recipient);
    }

    /**
     * @desc Broadcasts a message to every other client in the channel except yourself.
     * @param event - The event to send.
     * @param payload - The message to send.
     */
    public broadcastFrom (event: string, payload: PondMessage) {
        this.#send(event, payload, ChannelReceiver.ALL_EXCEPT_SENDER);
    }

    /**
     * @desc Broadcasts a message to the channel, including yourself.
     * @param event - The event to send.
     * @param payload - The message to send.
     */
    public broadcast (event: string, payload: PondMessage) {
        this.#send(event, payload);
    }

    /**
     * @desc Gets the current connection state of the channel.
     */
    public get channelState (): ChannelState {
        return this.#joinState.value as ChannelState;
    }

    /**
     * @desc Gets the current presence of the channel.
     */
    public getPresence (): PondPresence[] {
        return this.#presence;
    }

    /**
     * @desc Monitors the presence of the channel.
     * @param callback - The callback to call when the presence changes.
     */
    public onUsersChange (callback: (users: PondPresence[]) => void) {
        return this.#subscribeToPresence((_event, payload) => callback(payload.presence));
    }

    /**
     * @desc Gets the current connection state of the channel.
     */
    public isConnected () {
        return this.#joinState.value === ChannelState.JOINED || this.#joinState.value === ChannelState.STALLED;
    }

    /**
     * @desc Monitors the connection state of the channel.
     * @param callback - The callback to call when the connection state changes.
     */
    public onConnectionChange (callback: (connected: boolean) => void) {
        return this.onChannelStateChange((state) => {
            callback(state === ChannelState.JOINED || state === ChannelState.STALLED);
        });
    }

    /**
     * @desc Builds a message structure to and sends it to the server.
     * @param event - The event to send.
     * @param payload - The message to send.
     * @param receivers - The clients to send the message to.
     * @private
     */
    #send (event: string, payload: PondMessage, receivers: ChannelReceivers = ChannelReceiver.ALL_USERS) {
        const message: ClientMessage = {
            action: ClientActions.BROADCAST,
            channelName: this.#name,
            event,
            payload,
            addresses: receivers,
        };

        this.#publish(message);
    }

    /**
     * @desc Publishes a message received from the server.
     * @param data - The message to publish.
     * @private
     */
    #publish (data: ClientMessage) {
        if (this.#clientState.value) {
            if (this.#joinState.value === ChannelState.JOINED) {
                this.#publisher(data);
            }

            return;
        }

        this.#queue.push(data);
    }

    /**
     * @desc Publishes all presence events to the channel.
     * @param callback - The callback to call when a presence event is received.
     * @private
     */
    #subscribeToPresence (callback: (event: PresenceEventTypes, payload: PresencePayload) => void) {
        return this.#receiver.subscribe((data) => {
            if (data.action === ServerActions.PRESENCE) {
                return callback(data.event, data.payload);
            }
        });
    }

    /**
     * 2desc Initializes the channel.
     * @param receiver - The receiver to subscribe to.
     * @private
     */
    #init (receiver: SimpleSubject<ChannelEvent>): Unsubscribe {
        const unsubMessages = receiver.subscribe((data) => {
            if (data.channelName === this.#name) {
                if (data.event === Events.ACKNOWLEDGE) {
                    this.#joinState.publish(ChannelState.JOINED);
                    this.#emptyQueue();
                } else {
                    this.#receiver.publish(data);
                }
            }
        });

        const unsubStateChange = this.#clientState.subscribe((state) => {
            if (state && this.#joinState.value === ChannelState.STALLED) {
                const joinMessage: ClientMessage = {
                    action: ClientActions.JOIN_CHANNEL,
                    channelName: this.#name,
                    event: ClientActions.JOIN_CHANNEL,
                    payload: this.#joinParams,
                };

                this.#publisher(joinMessage);
            } else if (!state && this.#joinState.value === ChannelState.JOINED) {
                this.#joinState.publish(ChannelState.STALLED);
            }
        });

        const unsubPresence = this.#subscribeToPresence((_, payload) => {
            this.#presence = payload.presence;
        });

        return () => {
            unsubMessages();
            unsubStateChange();
            unsubPresence();
        };
    }

    /**
     * @desc Publishes the queue of messages to the server.
     * @private
     */
    #emptyQueue () {
        this.#queue
            .filter((message) => message.action !== ClientActions.JOIN_CHANNEL)
            .forEach((message) => {
                this.#publisher(message);
            });

        this.#joinState.publish(ChannelState.JOINED);

        this.#queue = [];
    }
}
