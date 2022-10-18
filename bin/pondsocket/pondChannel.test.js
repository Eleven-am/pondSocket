"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var pondChannel_1 = require("./pondChannel");
var channel_1 = require("./channel");
var pondbase_1 = require("../pondbase");
describe('PondChannel', function () {
    it('should exists', function () {
        expect(pondChannel_1.PondChannel).toBeDefined();
    });
    it('should be a class', function () {
        expect(pondChannel_1.PondChannel).toBeInstanceOf(Function);
    });
    it('should have a method on', function () {
        expect(pondChannel_1.PondChannel.prototype.on).toBeDefined();
    });
    it('should have a method addUser', function () {
        expect(pondChannel_1.PondChannel.prototype.addUser).toBeDefined();
    });
    it('should have a method broadcastToChannel', function () {
        expect(pondChannel_1.PondChannel.prototype.broadcastToChannel).toBeDefined();
    });
    it('should have a method closeFromChannel', function () {
        expect(pondChannel_1.PondChannel.prototype.closeFromChannel).toBeDefined();
    });
    it('should have a method modifyPresence', function () {
        expect(pondChannel_1.PondChannel.prototype.modifyPresence).toBeDefined();
    });
    it('should have a method getChannelInfo', function () {
        expect(pondChannel_1.PondChannel.prototype.getChannelInfo).toBeDefined();
    });
    it('should have a method send', function () {
        expect(pondChannel_1.PondChannel.prototype.send).toBeDefined();
    });
    it('should have a method findChannel', function () {
        expect(pondChannel_1.PondChannel.prototype.findChannel).toBeDefined();
    });
    it('should have a method subscribe', function () {
        expect(pondChannel_1.PondChannel.prototype.subscribe).toBeDefined();
    });
    // Functionality tests
    it('should be able ot add a user', function () { return __awaiter(void 0, void 0, void 0, function () {
        var pondChannel, messageReceived, channel, doc, error_1, newPondChannel, newChannel, rejectPondChannel, error_2, error_3, acceptPondChannel, message;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    pondChannel = new pondChannel_1.PondChannel('/test', function () {
                    });
                    messageReceived = null;
                    pondChannel.on('message', function (message) {
                        messageReceived = message;
                    });
                    channel = new channel_1.Channel('/test', function () {
                    });
                    doc = pondChannel["_channels"].set(channel);
                    expect(doc).toBeDefined();
                    expect(doc).toBeInstanceOf(pondbase_1.PondDocument);
                    expect(pondChannel.getChannelInfo('/test')).toEqual(doc.doc.info);
                    channel.broadcast('message', { data: 'test' });
                    expect(messageReceived).toBeNull(); // when you add a channel externally, it is not subscribed to by the pond channel
                    doc.removeDoc();
                    expect(function () { return pondChannel.getChannelInfo('/test'); }).toThrowError(pondbase_1.PondError); // channel is removed from the pond channel and can not be found
                    return [4 /*yield*/, expect(pondChannel.addUser({
                            clientId: 'test',
                            assigns: {},
                            socket: {
                                send: function () {
                                },
                                on: function () {
                                }
                            }
                        }, '/balls', {})).rejects.toEqual(new pondbase_1.PondError('Invalid channel name', 400, { channelName: '/balls' }))];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, pondChannel.addUser({
                            clientId: 'test',
                            assigns: {},
                            socket: {
                                send: function () {
                                },
                                on: function () {
                                }
                            }
                        }, '/test', {})];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    expect(error_1).toBeInstanceOf(pondbase_1.PondError); // this is because, the pondChannel handler doesn't act on the response
                    expect(error_1).toEqual(new pondbase_1.PondError('Function did not resolve a Promise', 500, {
                        channelName: '/test',
                    }));
                    return [3 /*break*/, 5];
                case 5:
                    channel.broadcast('message', { data: 'test' });
                    newPondChannel = new pondChannel_1.PondChannel('/test', function (_, res) {
                        res.accept(); // here we accept the connection
                    });
                    return [4 /*yield*/, newPondChannel.addUser({
                            clientId: 'test',
                            assigns: {},
                            socket: {
                                send: function () {
                                },
                                on: function () {
                                }
                            }
                        }, '/test', {})];
                case 6:
                    _a.sent();
                    newChannel = newPondChannel.findChannel(function (c) { return c.name === '/test'; });
                    expect(newChannel).toBeDefined();
                    expect(newChannel).toBeInstanceOf(channel_1.Channel);
                    expect(newChannel.info).toEqual({
                        name: '/test',
                        channelData: {},
                        presence: [{
                                id: 'test',
                            }],
                        assigns: {
                            test: {}
                        },
                    });
                    rejectPondChannel = new pondChannel_1.PondChannel('/:test', function (req, res) {
                        if (req.params.test === 'balls')
                            res.reject(); // here we reject the connection
                        else if (req.params.test === 'rejectWithMessage')
                            res.reject('test', 69420); // here we reject the connection with a message and a status code
                    });
                    _a.label = 7;
                case 7:
                    _a.trys.push([7, 9, , 10]);
                    return [4 /*yield*/, rejectPondChannel.addUser({
                            clientId: 'test',
                            assigns: {},
                            socket: {
                                send: function () {
                                },
                                on: function () {
                                }
                            }
                        }, '/rejectWithMessage', {})];
                case 8:
                    _a.sent();
                    return [3 /*break*/, 10];
                case 9:
                    error_2 = _a.sent();
                    expect(error_2).toBeInstanceOf(pondbase_1.PondError); // this is because we reject the connection
                    expect(error_2).toEqual(new pondbase_1.PondError('test', 69420, {
                        channelName: '/rejectWithMessage',
                    }));
                    return [3 /*break*/, 10];
                case 10:
                    _a.trys.push([10, 12, , 13]);
                    return [4 /*yield*/, rejectPondChannel.addUser({
                            clientId: 'test',
                            assigns: {},
                            socket: {
                                send: function () {
                                },
                                on: function () {
                                }
                            }
                        }, '/balls', {})];
                case 11:
                    _a.sent();
                    return [3 /*break*/, 13];
                case 12:
                    error_3 = _a.sent();
                    expect(error_3).toBeInstanceOf(pondbase_1.PondError); // this is because we reject the connection
                    expect(error_3).toEqual(new pondbase_1.PondError('Message rejected', 403, {
                        channelName: '/balls',
                    }));
                    return [3 /*break*/, 13];
                case 13:
                    acceptPondChannel = new pondChannel_1.PondChannel('/:test', function (_, res) {
                        res.send('test', {
                            test: 'test'
                        }); // here we send a message after accepting the connection
                    });
                    message = null;
                    return [4 /*yield*/, acceptPondChannel.addUser({
                            clientId: 'test',
                            assigns: {},
                            socket: {
                                send: function (data) {
                                    message = JSON.parse(data);
                                },
                                on: function () {
                                }
                            }
                        }, '/test', {})];
                case 14:
                    _a.sent();
                    expect(message).toEqual({
                        action: 'MESSAGE',
                        event: 'test',
                        channelName: '/test',
                        payload: {
                            test: 'test'
                        }
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    it('should be able to receive subscriptions', function () { return __awaiter(void 0, void 0, void 0, function () {
        var pond, narrowedMessageCount, encompassingMessageCount, userMessageCount, sender, channel;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    pond = new pondChannel_1.PondChannel('/:test', function (_, res) {
                        res.accept();
                    });
                    narrowedMessageCount = 0;
                    pond.on('event:test', function (req, res) {
                        narrowedMessageCount++;
                        if (req.params.test === 'balls')
                            res.reject(); // here we reject the connection
                        else if (req.params.test === 'rejectWithMessage')
                            res.reject('test', 69420); // here we reject the connection with a message and a status code
                        else if (req.params.test === 'accept')
                            res.accept();
                        else if (req.params.test === 'send')
                            res.send('test', {
                                test: 'test'
                            });
                        else if (req.params.test === 'acceptWithPresence')
                            res.accept({
                                presence: {
                                    status: 'online'
                                }
                            });
                        else if (req.params.test === 'acceptWithAssigns')
                            res.accept({
                                assigns: {
                                    test: {
                                        test: 'test'
                                    }
                                }
                            });
                        else if (req.params.test === 'acceptWithChannelData')
                            res.accept({
                                channelData: {
                                    test: 'test'
                                }
                            });
                        else if (req.params.test === 'acceptWithAll')
                            res.accept({
                                presence: {
                                    status: 'offline'
                                },
                                assigns: {
                                    test: {
                                        test: 'test2'
                                    }
                                },
                                channelData: {
                                    test: 'test2'
                                }
                            });
                    });
                    encompassingMessageCount = 0;
                    pond.on(/(.*?)/, function (req, res) {
                        expect(req.params).toEqual({});
                        // with all encompassing regex, the params should be empty
                        // also if there are no other matching handlers, they would be called
                        // this means that when such a handler emits an event, it would be called again if no other handlers are found to handle the event it emits
                        // it is recommended to use the all encompassing regex delicately
                        // as they could lead to infinite loops
                        encompassingMessageCount++;
                        res.send('fallback', {
                            message: 'This is a fallback route'
                        });
                    });
                    userMessageCount = 0;
                    sender = function (_data) {
                        userMessageCount++;
                    };
                    // we add two users to the pond on ethe channel /pond
                    return [4 /*yield*/, pond.addUser({
                            clientId: 'test1',
                            assigns: {},
                            socket: {
                                send: sender,
                                on: function () {
                                }
                            }
                        }, '/pond', {})];
                case 1:
                    // we add two users to the pond on ethe channel /pond
                    _a.sent();
                    return [4 /*yield*/, pond.addUser({
                            clientId: 'test2',
                            assigns: {},
                            socket: {
                                send: sender,
                                on: function () {
                                }
                            }
                        }, '/pond', {})];
                case 2:
                    _a.sent();
                    expect(pond.getChannelInfo('/pond')).toEqual({
                        name: '/pond',
                        channelData: {},
                        presence: [{
                                id: 'test1',
                            }, {
                                id: 'test2',
                            }],
                        assigns: {
                            test1: {},
                            test2: {}
                        }
                    });
                    expect(encompassingMessageCount).toBe(2); // 1 for each user joining
                    expect(userMessageCount).toBe(3); // first user gets their join event and the seconds join,
                    encompassingMessageCount = 0;
                    userMessageCount = 0;
                    try {
                        pond.broadcastToChannel('/pond', 'eventballs', {
                            test: 'test'
                        });
                    }
                    catch (error) {
                        expect(error).toBeInstanceOf(pondbase_1.PondError);
                        expect(error).toEqual(new pondbase_1.PondError('Message rejected', 403, {
                            channelName: '/pond',
                            event: 'eventballs'
                        }));
                    }
                    // This throws because the handler rejects the message
                    expect(narrowedMessageCount).toBe(1); // the broadcast event is caught by the narrowed handler
                    expect(encompassingMessageCount).toBe(0); // the broadcast event is not caught by the encompassing handler
                    expect(userMessageCount).toBe(0); // because the :test param is balls which was rejected by the handler, the message is not sent to the client
                    encompassingMessageCount = 0;
                    userMessageCount = 0;
                    narrowedMessageCount = 0;
                    try {
                        pond.send('/pond', 'test2', 'eventrejectWithMessage', {
                            test: 'test'
                        });
                    }
                    catch (e) {
                        expect(e).toBeInstanceOf(pondbase_1.PondError);
                        expect(e).toEqual(new pondbase_1.PondError('test', 69420, {
                            channelName: '/pond',
                            event: 'eventrejectWithMessage'
                        }));
                    }
                    expect(narrowedMessageCount).toBe(1); // the send event is caught by the narrowed handler
                    expect(encompassingMessageCount).toBe(0); // the send event is not caught by the encompassing handler
                    expect(userMessageCount).toBe(0); // because the :test param is rejectWithMessage which was rejected by the handler with a message, the message is not sent to the client
                    // a rejection message should be sent back to the emitter of the event in this case, the server
                    encompassingMessageCount = 0;
                    userMessageCount = 0;
                    narrowedMessageCount = 0;
                    channel = pond.findChannel(function (c) { return c.name === '/pond'; });
                    expect(channel).toBeInstanceOf(channel_1.Channel);
                    expect(channel).not.toBeNull();
                    // since the PondChannel has no way to send messages on behalf of a client we get the channel from the pond and send the message directly to the channel
                    channel === null || channel === void 0 ? void 0 : channel.broadcast('eventaccept', {
                        test: 'test'
                    });
                    expect(narrowedMessageCount).toBe(1); // the broadcast event is caught by the narrowed handler
                    expect(encompassingMessageCount).toBe(0); // the broadcast event is not caught by the encompassing handler
                    expect(userMessageCount).toBe(2); // because the :test param = accept which was accepted by the handler, the message is sent to the client
                    encompassingMessageCount = 0;
                    userMessageCount = 0;
                    narrowedMessageCount = 0;
                    channel === null || channel === void 0 ? void 0 : channel.broadcast('eventsend', {
                        test: 'test'
                    }, 'test2'); // the message is sent on behalf of test2
                    expect(narrowedMessageCount).toBe(1); // the broadcast event is caught by the narrowed handler
                    expect(encompassingMessageCount).toBe(1); // the narrowed handler emits an event (test) which is caught by the encompassing handler
                    // The users still don't receive the message sent by the encompassing handler because the handler sends a message to the sender of the test event, which is the narrowed handler (SERVER)
                    expect(userMessageCount).toBe(3); // because the :test param = send which was accepted by the handler, the message is broadcasted (2) and the message sent by the handler is sent to the emitter(test2) (1)
                    encompassingMessageCount = 0;
                    userMessageCount = 0;
                    narrowedMessageCount = 0;
                    channel === null || channel === void 0 ? void 0 : channel.sendTo('eventacceptWithPresence', {
                        test: 'test'
                    }, 'test2', 'test1');
                    expect(narrowedMessageCount).toBe(1); // the send event is caught by the narrowed handler
                    expect(encompassingMessageCount).toBe(1); // the (send) message modifies the user presence, which is caught by the encompassing handler
                    // The encompassing handler sends a message to the user whose presence was changed (test2)
                    // The user however does not receive the message because the message is sent to the sender of the event (the channel)
                    //it should be noted that during any presence update the emitter is the server and thus emitting an event on this event would not be received by the user
                    expect(userMessageCount).toBe(3); // the message is sent since it was accepted in the handler
                    // the user's presence is modified and sent to all users
                    // however we have also modified the presence of the sender
                    expect(pond.getChannelInfo('/pond')).toEqual({
                        name: '/pond',
                        channelData: {},
                        presence: [{
                                id: 'test1',
                            }, {
                                id: 'test2',
                                status: 'online'
                            }],
                        assigns: {
                            test1: {},
                            test2: {}
                        }
                    });
                    encompassingMessageCount = 0;
                    userMessageCount = 0;
                    narrowedMessageCount = 0;
                    channel === null || channel === void 0 ? void 0 : channel.sendTo('eventacceptWithChannelData', {
                        test: 'test'
                    }, 'test2', 'test1');
                    expect(narrowedMessageCount).toBe(1); // the send event is caught by the narrowed handler
                    expect(encompassingMessageCount).toBe(0); // the (send) message does not modify the user presence, which is not caught by the encompassing handler
                    expect(userMessageCount).toBe(1); // the message is sent since it was accepted in the handler
                    // however we have also modified the channel data
                    expect(pond.getChannelInfo('/pond')).toEqual({
                        name: '/pond',
                        channelData: { test: 'test' },
                        presence: [{
                                id: 'test1',
                            }, {
                                id: 'test2',
                                status: 'online'
                            }],
                        assigns: {
                            test1: {},
                            test2: {}
                        }
                    });
                    encompassingMessageCount = 0;
                    userMessageCount = 0;
                    narrowedMessageCount = 0;
                    channel === null || channel === void 0 ? void 0 : channel.sendTo('eventacceptWitAssigns', {
                        test: 'test',
                    }, 'test2', 'test1');
                    expect(narrowedMessageCount).toBe(1); // the send event is caught by the narrowed handler
                    expect(encompassingMessageCount).toBe(0); // the (send) message does not modify the user presence, which is not caught by the encompassing handler
                    expect(userMessageCount).toBe(1); // the message is sent since it was accepted in the handler
                    // however we have also modified the assigns
                    expect(pond.getChannelInfo('/pond')).toEqual({
                        name: '/pond',
                        channelData: { test: 'test' },
                        presence: [{
                                id: 'test1',
                            }, {
                                id: 'test2',
                                status: 'online'
                            }],
                        assigns: {
                            test2: {},
                            test1: {}
                        }
                    });
                    encompassingMessageCount = 0;
                    userMessageCount = 0;
                    narrowedMessageCount = 0;
                    pond.modifyPresence('/pond', 'test2', {
                        presence: {}
                    });
                    // No messages are sent because the presence is not modified
                    expect(narrowedMessageCount).toBe(0);
                    expect(encompassingMessageCount).toBe(0);
                    expect(userMessageCount).toBe(0);
                    expect(pond.getChannelInfo('/pond')).toEqual({
                        name: '/pond',
                        channelData: { test: 'test' },
                        presence: [{
                                id: 'test1',
                            }, {
                                id: 'test2',
                                status: 'online'
                            }],
                        assigns: {
                            test2: {},
                            test1: {}
                        }
                    });
                    encompassingMessageCount = 0;
                    userMessageCount = 0;
                    narrowedMessageCount = 0;
                    try {
                        pond.closeFromChannel('/pond', 'test2');
                    }
                    catch (e) {
                        expect(e).toBeInstanceOf(pondbase_1.PondError);
                        // The encompassing handler sends a message to the user whose presence was changed (test2)
                        // this message causes an error because the user is no longer connected to the pond
                    }
                    // since a user has left the channel a message is sent to all users
                    expect(narrowedMessageCount).toBe(0);
                    expect(encompassingMessageCount).toBe(1);
                    expect(userMessageCount).toBe(1); //only the user left in the channel receives the presence change message
                    encompassingMessageCount = 0;
                    userMessageCount = 0;
                    narrowedMessageCount = 0;
                    expect(pond.getChannelInfo('/pond')).toEqual({
                        name: '/pond',
                        channelData: { test: 'test' },
                        presence: [{
                                id: 'test1',
                            }],
                        assigns: {
                            test1: {}
                        }
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    it('should allow subscribing to a channel', function () { return __awaiter(void 0, void 0, void 0, function () {
        var pond, messageCount, userMessageCount, sender;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    pond = new pondChannel_1.PondChannel('/:test', function (_, res) {
                        res.accept();
                    });
                    expect(function () { return pond.getChannelInfo('/pond'); }).toThrow();
                    messageCount = 0;
                    // Any message sent to the pond will be caught by this handler
                    pond.subscribe('/pond', function () {
                        messageCount++;
                    });
                    // The pond channel is created when a user subscribes to it
                    expect(pond.getChannelInfo('/pond')).toEqual({
                        name: '/pond',
                        channelData: {},
                        presence: [],
                        assigns: {}
                    });
                    expect(pond.info).toHaveLength(1);
                    pond.subscribe('/pond', function () {
                        messageCount++;
                    });
                    // a second subscription to the pond channel does not create a new channel
                    expect(pond.info).toHaveLength(1);
                    userMessageCount = 0;
                    sender = function () {
                        userMessageCount++;
                    };
                    // we add two users to the pond on ethe channel /pond
                    return [4 /*yield*/, pond.addUser({
                            clientId: 'test1',
                            assigns: {},
                            socket: {
                                send: sender,
                                on: function () {
                                }
                            }
                        }, '/pond', {})];
                case 1:
                    // we add two users to the pond on ethe channel /pond
                    _a.sent();
                    expect(messageCount).toBe(2); // the user joining the channel is caught by the 2 encompassing handlers
                    expect(userMessageCount).toBe(1); // the user receives a message that they have joined the channel
                    return [2 /*return*/];
            }
        });
    }); });
    it('should be capable of removing a user from a channel', function () { return __awaiter(void 0, void 0, void 0, function () {
        var pond, userMessageCount, sender;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    pond = new pondChannel_1.PondChannel('/test', function (_, res) {
                        res.accept(); // here we accept the connection
                    });
                    userMessageCount = 0;
                    sender = function () {
                        userMessageCount++;
                    };
                    return [4 /*yield*/, pond.addUser({
                            clientId: 'test',
                            assigns: {},
                            socket: {
                                send: sender,
                                on: function () {
                                }
                            }
                        }, '/test', {})];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, pond.addUser({
                            clientId: 'test2',
                            assigns: {},
                            socket: {
                                send: sender,
                                on: function () {
                                }
                            },
                        }, '/test', {})];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, pond.addUser({
                            clientId: 'test3',
                            assigns: {},
                            socket: {
                                send: sender,
                                on: function () {
                                }
                            }
                        }, '/test', {})];
                case 3:
                    _a.sent();
                    expect(pond.info).toHaveLength(1);
                    expect(pond.getChannelInfo('/test')).toEqual({
                        name: '/test',
                        channelData: {},
                        presence: [{
                                id: 'test',
                            }, {
                                id: 'test2',
                            }, {
                                id: 'test3',
                            }],
                        assigns: {
                            test: {},
                            test2: {},
                            test3: {}
                        }
                    });
                    expect(pond['_subscriptions']['test']).toHaveLength(1); // the subscription holds all subscriptions a user has in multiple channels
                    pond.modifyPresence('/test', 'test', {
                        assigns: {
                            name: 'test'
                        }
                    });
                    expect(pond.getChannelInfo('/test')).toEqual({
                        name: '/test',
                        channelData: {},
                        presence: [{
                                id: 'test',
                            }, {
                                id: 'test2',
                            }, {
                                id: 'test3',
                            }],
                        assigns: {
                            test: { name: 'test' },
                            test2: {},
                            test3: {}
                        }
                    });
                    userMessageCount = 0;
                    pond.send('/test', ['test', 'test2', 'test3'], 'test', {
                        test: 'test'
                    });
                    expect(userMessageCount).toBe(3);
                    // when you remove a user from a pond channel the user is removed from the pond channel and all the channels within the pond
                    pond.removeUser('test');
                    expect(pond['_subscriptions']['test']).toBeUndefined();
                    expect(pond.info).toHaveLength(1);
                    return [4 /*yield*/, pond.addUser({
                            clientId: 'test',
                            assigns: {},
                            socket: {
                                send: sender,
                                on: function () {
                                }
                            }
                        }, '/test', {})];
                case 4:
                    _a.sent();
                    expect(pond['_subscriptions']['test']).toHaveLength(1); // the subscription holds all subscriptions a user has in multiple channels
                    pond['_removeSubscriptions'](['test', 'test2', 'test3'], '/test');
                    expect(pond['_subscriptions']['test']).toHaveLength(0); // the subscription is empty but the user is still in the channel and pond
                    expect(pond.info).toHaveLength(1); // since the user is still in the channel the pond is still active with the channel
                    return [2 /*return*/];
            }
        });
    }); });
});
