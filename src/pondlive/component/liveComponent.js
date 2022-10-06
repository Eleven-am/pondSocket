"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Component = exports.LiveFactory = void 0;
var pondserver_1 = require("../../pondserver");
var noOp = function () {
    var _args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        _args[_i] = arguments[_i];
    }
};
function LiveFactory(props) {
    return /** @class */ (function () {
        function LiveComponentImpl() {
            this.routes = props.routes;
            this.providers = props.providers || [];
            this.mount = props.mount;
            this.onRendered = props.onRendered;
            this.onEvent = props.onEvent;
            this.onInfo = props.onInfo;
            this.onUnmount = props.onUnmount;
            this.render = props.render;
            this.manageStyles = props.manageStyles;
        }
        return LiveComponentImpl;
    }());
}
exports.LiveFactory = LiveFactory;
var Component = /** @class */ (function () {
    function Component() {
        this.routes = [];
        this.providers = [];
    }
    /**
     * @desc Called on every render to generate the CSS for the component.
     * @param context - The context of the component.
     * @param css - The CSS generator.
     */
    Component.prototype.manageStyles = function (context, css) {
        noOp(context, css);
        return css(templateObject_1 || (templateObject_1 = __makeTemplateObject([""], [""])));
    };
    ;
    /**
     * @desc Called when the component is mounted.
     * @param context - The context of the component.
     * @param socket - The socket of user connection.
     * @param router - The router of this instance of the connection.
     */
    Component.prototype.mount = function (context, socket, router) {
        noOp(context, socket, router);
    };
    ;
    /**
     * @desc Called when the component is connected to the server over websockets.
     * @param context - The context of the component.
     * @param socket - The socket of user connection.
     * @param router - The router of this instance of the connection.
     */
    Component.prototype.onRendered = function (context, socket, router) {
        noOp(context, socket, router);
    };
    ;
    /**
     * @desc Called when the component receives an event from the client.
     * @param event - The event name.
     * @param context - The context of the component.
     * @param socket - The socket of user connection.
     * @param router - The router of this instance of the connection.
     */
    Component.prototype.onEvent = function (event, context, socket, router) {
        noOp(event, context, socket, router);
    };
    ;
    /**
     * @desc Called when the component receives an info from the server.
     * @param info - The info content.
     * @param context - The context of the component.
     * @param socket - The socket of user connection.
     * @param router - The router of this instance of the connection.
     */
    Component.prototype.onInfo = function (info, context, socket, router) {
        noOp(info, context, socket, router);
    };
    ;
    /**
     * @desc Called when the component is disconnected from the server.
     * @param context - The context of the component.
     * @param socket - The socket of user connection.
     */
    Component.prototype.onUnmount = function (context, socket) {
        noOp(context, socket);
    };
    ;
    /**
     * @desc Called on every render to generate the HTML for the component.
     * @param context - The context of the component.
     * @param classes - The CSS classes generated by the component.
     */
    Component.prototype.render = function (context, classes) {
        noOp(context, classes);
        return (0, pondserver_1.html)(templateObject_2 || (templateObject_2 = __makeTemplateObject([""], [""])));
    };
    ;
    return Component;
}());
exports.Component = Component;
var templateObject_1, templateObject_2;
