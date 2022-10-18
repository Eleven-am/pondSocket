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
exports.manageHistory = exports.router = void 0;
var domDiff_1 = require("./domDiff");
var eventEmmiter_1 = require("./eventEmmiter");
var navigateTo = function (url) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                (0, eventEmmiter_1.emitEvent)('navigate-start', {
                    location: url,
                    shallow: false,
                });
                history.pushState(null, '', url);
                return [4 /*yield*/, fetchHtml(url)];
            case 1:
                _a.sent();
                (0, eventEmmiter_1.emitEvent)('navigate-end', {
                    location: url,
                    shallow: false,
                });
                return [2 /*return*/];
        }
    });
}); };
window.addEventListener('popstate', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                (0, eventEmmiter_1.emitEvent)('navigate-start', {
                    location: location.pathname,
                    shallow: false,
                });
                return [4 /*yield*/, fetchHtml(location.pathname)];
            case 1:
                _a.sent();
                (0, eventEmmiter_1.emitEvent)('navigate-end', {
                    location: location.pathname,
                    shallow: false,
                });
                return [2 /*return*/];
        }
    });
}); });
var fetchHtml = function (url) { return __awaiter(void 0, void 0, void 0, function () {
    var headers, response, headersResponse, action, url_1, title, flashMessage, container, title, flashMessage, content;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                headers = {
                    'Content-Type': 'text/html',
                    'Accept': 'text/html',
                    'x-csrf-token': window.token,
                    'x-router-request': 'true',
                    'method': 'GET',
                };
                return [4 /*yield*/, fetch(url, { headers: headers })];
            case 1:
                response = _a.sent();
                headersResponse = response.headers;
                if (!headersResponse.has('x-router-action')) return [3 /*break*/, 4];
                action = headersResponse.get('x-router-action');
                if (!action) return [3 /*break*/, 3];
                url_1 = headersResponse.get('x-router-path');
                title = headersResponse.get('x-page-title');
                flashMessage = headersResponse.get('x-flash-message');
                return [4 /*yield*/, (0, exports.manageHistory)(url_1, action, title, flashMessage)];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3: return [3 /*break*/, 6];
            case 4:
                container = headersResponse.get('x-router-container');
                title = headersResponse.get('x-page-title');
                flashMessage = headersResponse.get('x-flash-message');
                return [4 /*yield*/, response.text()];
            case 5:
                content = _a.sent();
                manageDOM(container, content, title, flashMessage);
                _a.label = 6;
            case 6: return [2 /*return*/];
        }
    });
}); };
var router = function (watcher) {
    watcher.delegateEvent('a', 'click', function (anchor, event) { return __awaiter(void 0, void 0, void 0, function () {
        var target, url;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    event.preventDefault();
                    target = anchor;
                    url = target.href;
                    return [4 /*yield*/, navigateTo(url)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
};
exports.router = router;
var manageHistory = function (url, action, title, flashMessage) { return __awaiter(void 0, void 0, void 0, function () {
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = action;
                switch (_a) {
                    case 'replace': return [3 /*break*/, 1];
                    case 'redirect': return [3 /*break*/, 2];
                }
                return [3 /*break*/, 4];
            case 1:
                (0, eventEmmiter_1.emitEvent)('navigate-start', {
                    location: url,
                    shallow: false,
                });
                history.replaceState(null, '', url);
                (0, eventEmmiter_1.emitEvent)('navigate-end', {
                    location: url,
                    shallow: false,
                });
                return [3 /*break*/, 4];
            case 2: return [4 /*yield*/, navigateTo(url)];
            case 3:
                _b.sent();
                return [3 /*break*/, 4];
            case 4:
                if (title)
                    document.title = title;
                if (flashMessage)
                    (0, eventEmmiter_1.emitEvent)('flash-message', { flashMessage: flashMessage });
                return [2 /*return*/];
        }
    });
}); };
exports.manageHistory = manageHistory;
var manageDOM = function (container, content, title, flashMessage) {
    var containerElement = document.querySelector(container);
    if (containerElement) {
        var newContainer = document.createElement('div');
        newContainer.innerHTML = content;
        var first = newContainer.firstElementChild;
        var routerAttribute = first.getAttribute('pond-router');
        if (routerAttribute)
            containerElement.setAttribute('pond-router', routerAttribute);
        (0, domDiff_1.DeepDiff)(containerElement, first);
        if (title)
            document.title = title;
        if (flashMessage)
            (0, eventEmmiter_1.emitEvent)('flash-message', { flashMessage: flashMessage });
    }
};
