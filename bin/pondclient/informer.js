"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
exports.manageRoutes = exports.informer = void 0;
var history_1 = require("./history");
var domDiff_1 = require("./domDiff");
var eventEmmiter_1 = require("./eventEmmiter");
var pondlive_1 = require("../pondlive");
var informer = function (channel, watcher) {
    var subscriptions = {};
    var renders = {};
    var onMount = function (element) {
        var path = element.getAttribute('pond-router');
        if (path && !subscriptions[path]) {
            subscriptions[path] = channel.onMessage(function (event, message) { return __awaiter(void 0, void 0, void 0, function () {
                var parser, update, htmlString, parser, updated, htmlString;
                return __generator(this, function (_a) {
                    if (message.path === path) {
                        if (event === 'rendered') {
                            parser = (0, pondlive_1.html)(templateObject_1 || (templateObject_1 = __makeTemplateObject([""], [""])));
                            update = parser.parse(message.rendered);
                            renders[path] = update;
                            htmlString = update.toString();
                            (0, domDiff_1.DomDiff)(element, htmlString, path, message.headers);
                        }
                        if (event === 'updated' && renders[path]) {
                            parser = renders[path];
                            updated = parser.reconstruct(message.rendered);
                            renders[path] = updated;
                            htmlString = updated.toString();
                            (0, domDiff_1.DomDiff)(element, htmlString, path, message.headers);
                        }
                        if (message.headers) {
                            if (message.headers.pageTitle)
                                document.title = message.headers.pageTitle;
                            else if (message.headers.flashMessage)
                                (0, eventEmmiter_1.emitEvent)('flash-message', {
                                    flashMessage: message.headers.flashMessage
                                });
                        }
                    }
                    return [2 /*return*/];
                });
            }); });
            channel.broadcastFrom("mount/".concat(path), {});
        }
    };
    var onUnmount = function (_element, oldValue) {
        var path = oldValue;
        if (path && subscriptions[path]) {
            channel.broadcastFrom("unmount/".concat(path), {});
            subscriptions[path].unsubscribe();
            delete subscriptions[path];
            delete renders[path];
        }
    };
    var onUpdate = function (element, oldValue) {
        var newValue = element.getAttribute('pond-router');
        if (oldValue && newValue) {
            if (oldValue !== newValue) {
                onUnmount(element, oldValue);
                onMount(element);
            }
            else if (subscriptions[newValue])
                channel.broadcastFrom("update/".concat(newValue), {});
        }
        else if (oldValue && subscriptions[oldValue])
            onUnmount(element, oldValue);
        else if (newValue && !subscriptions[newValue])
            onMount(element);
    };
    watcher.watch('[pond-router]', {
        onAdd: onMount,
        onRemove: onUnmount,
        onUpdated: onUpdate
    });
};
exports.informer = informer;
var manageRoutes = function (channel) {
    channel.onMessage(function (event, message) { return __awaiter(void 0, void 0, void 0, function () {
        var action, path;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(event === 'router')) return [3 /*break*/, 2];
                    action = message.action, path = message.path;
                    return [4 /*yield*/, (0, history_1.manageHistory)(path, action)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    if (event === 'emit')
                        (0, eventEmmiter_1.emitEvent)(message.event, message.data);
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    }); });
};
exports.manageRoutes = manageRoutes;
var templateObject_1;
