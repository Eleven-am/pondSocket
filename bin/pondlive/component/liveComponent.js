"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveFactory = exports.ComponentClass = void 0;
var ComponentClass = /** @class */ (function () {
    function ComponentClass() {
        this.routes = [];
        this.providers = [];
    }
    return ComponentClass;
}());
exports.ComponentClass = ComponentClass;
function LiveFactory(context) {
    return /** @class */ (function (_super) {
        __extends(LiveComponentClass, _super);
        function LiveComponentClass() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.routes = context.routes || [];
            _this.providers = context.providers || [];
            _this.mount = context.mount;
            _this.onContextChange = context.onContextChange;
            _this.onRendered = context.onRendered;
            _this.onEvent = context.onEvent;
            _this.onInfo = context.onInfo;
            _this.onUnmount = context.onUnmount;
            _this.render = context.render;
            _this.manageStyles = context.manageStyles;
            return _this;
        }
        return LiveComponentClass;
    }(ComponentClass));
}
exports.LiveFactory = LiveFactory;
