import {
    Anything,
    BaseClass,
    Broadcast,
    PondBase,
    PondDocument,
    PondError,
    RejectPromise,
    Subscription
} from "../pondbase";
import {
    NewUser,
    PondAssigns,
    PondChannelData,
    PondMessage,
    PondPresence,
    ServerMessage
} from "./types";
import {PondSenders, ServerActions} from "./enums";

export interface ChannelInfo {
    name: string;
    channelData: PondChannelData;
    presence: PondPresence[];
    assigns: Record<string, PondAssigns>;
}

export interface ChannelEvent extends ServerMessage {
    clientId: string | PondSenders;
    clientAssigns: PondAssigns;
    clientPresence: PondPresence;
    channel: Channel
}

export interface PondUser {
    presence: PondDocument<PondPresence>;
    assigns: PondAssigns;
}

export class Channel extends BaseClass {
    public readonly name: string;
    private readonly _broadcast: Broadcast<ChannelEvent, RejectPromise<{ event: string; channelName: string; }> | boolean>;
    private readonly _messages: Broadcast<{ clients: string [], message: ServerMessage }, void>;
    private readonly _channelAssigns: Record<string, PondAssigns & { presenceId: string }>;
    private readonly _channelPresence: PondBase<PondPresence>;
    private readonly removeChannel: () => void;
    private _channelData: PondChannelData

    constructor(name: string, removeChannel: () => void) {
        super();
        this.name = name;
        this._channelPresence = new PondBase();
        this._channelAssigns = {};
        this._channelData = {};
        this._broadcast = new Broadcast();
        this.removeChannel = removeChannel;
        this._messages = new Broadcast();
    }

    /**
     * @desc Returns the channel info
     */
    public get info(): Readonly<ChannelInfo> {
        const data = {
            name: this.name, channelData: this.data, presence: this.presence, assigns: this.assigns
        }

        return Object.freeze(data);
    }

    /**
     * @desc Gets the channel's data
     */
    public get data(): Readonly<PondChannelData> {
        const result = {...this._channelData};
        return Object.freeze(result);
    }

    /**
     * @desc Sets the channel's data
     * @param data
     */
    public set data(data: PondChannelData) {
        this._channelData = {...this._channelData, ...data};
    }

    /**
     * @desc Gets the channel's presence
     */
    public get presence(): PondPresence[] {
        return this._channelPresence.toArray()
            .map(presence => presence.doc);
    }

    /**
     * @desc Gets the channel's assigns
     */
    public get assigns(): Record<string, PondAssigns> {
        const assigns: Record<string, PondAssigns> = {};
        Object.keys(this._channelAssigns).forEach(clientId => {
            const {presenceId, ...rest} = this._channelAssigns[clientId];
            assigns[clientId] = rest;
        })

        return assigns;
    }

    /**
     * @desc Checks if a user exists in the channel
     * @param clientId - The clientId of the user
     */
    public hasUser(clientId: string): boolean {
        return !!this._channelAssigns[clientId];
    }

    /**
     * @desc Adds a new user to the channel
     * @param user - The user to add to the channel
     */
    public addUser(user: NewUser): void {
        const clientId = user.client.clientId;
        if (this.hasUser(clientId)) {
            throw new PondError('User already exists in channel', 5001, clientId);
        }

        const doc = this._channelPresence.set({...user.presence, id: clientId});
        this._channelAssigns[clientId] = {...user.assigns, presenceId: doc.id};
        this._channelData = {...this._channelData, ...user.channelData};

        this._broadcast.publish({
            event: 'JOIN_CHANNEL',
            channelName: this.name,
            action: ServerActions.PRESENCE,
            payload: {
                presence: this.presence, change: {...user.presence, id: clientId}
            },
            channel: this, clientId: PondSenders.POND_CHANNEL,
            clientAssigns: user.assigns, clientPresence: {...user.presence, id: clientId}
        });
    }

    /**
     * @desc Gets a user's information
     * @param clientId - The clientId of the user
     */
    public getUserInfo(clientId: string) {
        const client = this._retrieveUser(clientId);
        if (!client) return null;
        return {
            presence: client.presence.doc, assigns: client.assigns
        }
    }

    /**
     * @desc Removes a user or group of users from the channel
     * @param clientIds - The clientIds of the users to remove
     */
    public removeUser(clientIds: string | string[]): void {
        const clients = Array.isArray(clientIds) ? clientIds : [clientIds];

        clients.forEach(clientId => {
            const client = this._retrieveUser(clientId);
            if (client) {
                client.presence.removeDoc();
                delete this._channelAssigns[clientId];

                this._broadcast.publish({
                    event: 'LEAVE_CHANNEL',
                    channelName: this.name,
                    action: ServerActions.PRESENCE,
                    payload: {
                        presence: this.presence, change: null,
                    },
                    channel: this, clientId: PondSenders.POND_CHANNEL,
                    clientAssigns: client.assigns, clientPresence: client.presence.doc
                })
            }
        });

        if (this._channelPresence.size === 0) {
            this._broadcast.publish({
                event: 'REMOVE_CHANNEL',
                channelName: this.name,
                action: ServerActions.CLOSE,
                payload: {}, channel: this,
                clientId: PondSenders.POND_CHANNEL,
                clientAssigns: {}, clientPresence: {}
            });

            this.removeChannel();
        }
    }

    /**
     * @desc Broadcasts a message to all users in the channel
     * @param event - The event name
     * @param message - The message to send
     * @param sender - The sender of the message
     */
    public broadcast(event: string, message: PondMessage, sender: PondSenders | string = PondSenders.POND_CHANNEL): void {
        const client = this._retrieveUser(sender)

        if (!client && !Object.values(PondSenders).includes(sender as any))
            throw new PondError('Client not found', 5002, sender);

        const newMessage: ServerMessage = {
            action: ServerActions.MESSAGE, payload: message, event: event, channelName: this.name,
        }

        const value = this._broadcast.publish({
            ...newMessage,
            channel: this,
            clientId: sender,
            clientAssigns: client ? client.assigns : {},
            clientPresence: client ? client.presence.doc : {}
        });

        if (value instanceof PondError) throw value;
        this._sendToClients(Object.keys(this._channelAssigns), newMessage);
    }

    /**
     * @desc Broadcasts a message to all users in the channel except the sender
     * @param event - The event name
     * @param message - The message to send
     * @param clientId - The client id of the sender
     */
    public broadcastFrom(event: string, message: PondMessage, clientId: string): void {
        const client = this._retrieveUser(clientId);
        if (!client) throw new PondError('Client not found', 5002, clientId);

        const newMessage: ServerMessage = {
            action: ServerActions.MESSAGE, payload: message, event: event, channelName: this.name,
        }

        const value = this._broadcast.publish({
            ...newMessage,
            channel: this,
            clientId: clientId,
            clientAssigns: client.assigns,
            clientPresence: client.presence.doc
        });

        if (value instanceof PondError) throw value;
        const clientIds = Object.keys(this._channelAssigns)
            .filter(id => id !== clientId);

        this._sendToClients(clientIds, newMessage);
    }

    /**
     * @desc Sends a message to a specific user or group of users
     * @param event - The event name
     * @param clientId - The client id of the user to send the message to
     * @param message - The message to send
     * @param sender - The client id of the sender
     */
    public sendTo(event: string, message: PondMessage, sender: string, clientId: string | string[]): void {
        const client = this._retrieveUser(sender);
        if (!client && !Object.values(PondSenders).includes(sender as any))
            throw new PondError('Client not found', 5002, sender);

        const clientIds = Array.isArray(clientId) ? clientId : [clientId];
        const notFound = clientIds.filter(id => !this._channelAssigns[id]);

        if (notFound.length > 0) throw new PondError('Recipient not found', 5002, notFound);

        const newMessage: ServerMessage = {
            action: ServerActions.MESSAGE, payload: message, event: event, channelName: this.name,
        }

        const value = this._broadcast.publish({
            ...newMessage,
            channel: this,
            clientId: sender,
            clientAssigns: client?.assigns || {},
            clientPresence: client?.presence.doc || {}
        });

        if (value instanceof PondError) throw value;
        this._sendToClients(clientIds, newMessage);
    }

    /**
     * @desc Subscribes to a channel event
     */
    public subscribe(callback: (message: ChannelEvent) => Anything<RejectPromise<{ event: string; channelName: string; }> | boolean>): Subscription {
        return this._broadcast.subscribe(callback);
    }

    /**
     * @desc Updates the state of a user in the channel
     * @param clientId - The clientId of the user to update
     * @param presence - The new presence of the user
     * @param assigns - The new assigns of the user
     */
    public updateUser(clientId: string, presence: PondPresence, assigns: PondAssigns) {
        const client = this._retrieveUser(clientId);
        if (client) {
            this._channelAssigns[clientId] = {
                ...client.assigns, ...assigns,
                presenceId: client.presence.id
            };

            const presenceDoc = {...client.presence.doc, ...presence, id: clientId};
            if (!this.areEqual(presenceDoc, client.presence.doc)) {
                client.presence.updateDoc(presenceDoc);
                this._broadcast.publish({
                    event: 'UPDATE_CHANNEL',
                    channelName: this.name,
                    action: ServerActions.PRESENCE,
                    payload: {
                        presence: this.presence, change: {clientId, presence, assigns},
                    },
                    channel: this,
                    clientId: PondSenders.POND_CHANNEL,
                    clientAssigns: {...client.assigns, ...assigns},
                    clientPresence: {...presenceDoc}
                });
            }

        }
    }

    /**
     * @desc Subscribes to a channel event
     * @param clientId - The client id of the user to send the message to
     * @param callback - The callback to call when a message is received
     */
    public subscribeToMessages(clientId: string, callback: (message: ServerMessage) => void): Subscription {
        const sub1 = this._messages.subscribe(({clients, message}) => {
            if (clients.includes(clientId)) callback(message);
        });

        const sub2 = this._channelPresence.subscribe((docs, change, action) => {
            const message: ServerMessage = {
                action: ServerActions.PRESENCE,
                payload: {presence: docs, change},
                event: action,
                channelName: this.name,
            }
            callback(message);
        })

        return {
            unsubscribe: () => {
                sub1.unsubscribe();
                sub2.unsubscribe();
            }
        }
    }

    /**
     * @desc Sends a message to a specific user or group of users except the sender
     * @param clients - The client id of the user to send the message to
     * @param message - The message to send
     * @private
     */
    private _sendToClients(clients: string[], message: ServerMessage): void {
        this._messages.publish({clients, message});
    }

    /**
     * @desc Retrieves a user from the channel
     * @param clientId - The client id of the user to retrieve
     * @private
     */
    private _retrieveUser(clientId: string): PondUser | null {
        const user = this._channelAssigns[clientId];
        const presence = this._channelPresence.get(user?.presenceId || '');
        if (user && presence !== null) {
            const {presenceId, ...assigns} = user;
            return {
                assigns: assigns, presence: presence,
            }
        }

        return null;
    }
}
