import {webSocket, WebSocketSubject} from "rxjs/webSocket";
import {
    concat,
    delay,
    dematerialize,
    materialize,
    pipe,
    range,
    Subscription,
    switchMap,
    throwError,
    timer,
    zip
} from "rxjs";
import {Channel, ChannelParams} from "./channel";
import {map, retryWhen} from "rxjs/operators";
import {PondBase} from "../pondbase";
import {ClientMessage, ServerMessage} from "../pondsocket";

type PondParams = {
    [key: string]: string;
}

type PondState = "CONNECTING" | "OPEN" | "CLOSING" | "CLOSED";

export class PondClientSocket {
    private readonly address: URL;
    private socketState: PondState = "CLOSED";
    private channels: PondBase<Channel>;
    private subscription: Subscription | undefined;
    private socket: WebSocketSubject<ServerMessage | ClientMessage> | undefined;

    constructor(endpoint: string, params?: PondParams) {
        let address: URL;

        try {
            address = new URL(endpoint);
        } catch (e) {
            address = new URL(window.location.toString());
            address.pathname = endpoint;
        }

        const query = new URLSearchParams(params);
        address.search = query.toString();
        const protocol = address.protocol === "https:" ? "wss:" : "ws:";

        if (address.protocol !== "wss:" && address.protocol !== "ws:")
            address.protocol = protocol;

        this.address = address;
        this.channels = new PondBase<Channel>();
    }

    /**
     * @desc Connects to the server and returns the socket.
     */
    connect() {
        if (this.socketState !== "CLOSED")
            return;

        this.socketState = "CONNECTING";

        const socket = webSocket<ServerMessage | ClientMessage>({
            url: this.address.toString(),
            openObserver: {
                next: () => {
                    this.socketState = "OPEN";
                }
            },
            closeObserver: {
                next: () => {
                    this.socketState = "CLOSED";
                }
            },
            closingObserver: {
                next: () => {
                    this.socketState = "CLOSING";
                }
            }
        });

        this.socket = socket;
        this.subscription = socket.pipe(this._retryStrategy(100, 1000)).subscribe();
        return this;
    }

    /**
     * @desc Returns the current state of the socket.
     */
    getState(): PondState {
        return this.socketState;
    }

    /**
     * @desc Creates a channel with the given name and params.
     * @param channel - The name of the channel.
     * @param params - The params to send to the server.
     */
    createChannel(channel: string, params?: ChannelParams): Channel {
        const channelDoc = this.channels.find(c => c.channel === channel);
        if (channelDoc)
            return channelDoc.doc;

        const newChannel = new Channel(channel, params || {}, this.socket!);
        this.channels.set(newChannel);
        return newChannel;
    }

    /**
     * @desc An event that is triggered when the socket receives a message.
     * @param callback - The callback to be called when the event is triggered.
     */
    onMessage(callback: (event: string, message: any) => void) {
        this.socket?.subscribe(data => {
            if (data.event)
                callback(data.event, data.payload);
        });
    }

    /**
     * @desc Disconnects the socket from the server.
     */
    disconnect() {
        this.socket?.complete();
        this.socket?.unsubscribe();
        this.subscription?.unsubscribe();
        this.socket = undefined;
        this.channels = new PondBase<Channel>();
    }

    /**
     * @desc A retry strategy for the socket.
     * @param maxTries - The maximum number of retries.
     * @param ms - The number of milliseconds to wait before retrying.
     */
    private _retryStrategy = (maxTries: number, ms: number) => {
        return pipe(
            retryWhen(attempts => {
                const observableForRetries =
                    zip(range(1, maxTries), attempts)
                        .pipe(
                            map(([elemFromRange, _]) => elemFromRange),
                            map(i => i * i),
                            switchMap(i => timer(i * ms))
                        );
                const observableForFailure =
                    throwError(new Error("Could not connect to server"))
                        .pipe(
                            materialize(),
                            delay(1000),
                            dematerialize()
                        );
                return concat(observableForRetries, observableForFailure);
            })
        );
    };
}
