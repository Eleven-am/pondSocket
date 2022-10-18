"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomWatcher = void 0;
var DomWatcher = /** @class */ (function () {
    function DomWatcher() {
        var _this = this;
        this._modifiers = {};
        var observer = new MutationObserver(function (mutations) {
            var _loop_1 = function (i) {
                var mutation = mutations[i];
                switch (mutation.type) {
                    case 'childList':
                        var _loop_2 = function (j) {
                            var node = mutation.removedNodes[j];
                            if (node instanceof HTMLElement) {
                                var element_1 = node;
                                for (var selector in _this._modifiers) {
                                    if (element_1.matches(selector)) {
                                        var modifier = _this._modifiers[selector];
                                        modifier.forEach(function (object) {
                                            object.onRemove && object.onRemove(element_1, null);
                                        });
                                    }
                                }
                            }
                        };
                        for (var j = 0; j < mutation.removedNodes.length; j++) {
                            _loop_2(j);
                        }
                        for (var j = 0; j < mutation.addedNodes.length; j++) {
                            var node = mutation.addedNodes[j];
                            if (node instanceof HTMLElement) {
                                var element_2 = node;
                                _this._addNewElement(element_2);
                            }
                        }
                        break;
                    case 'attributes':
                        var element_3 = mutation.target;
                        var name_1 = "[".concat(mutation.attributeName, "]");
                        var _loop_3 = function (selector) {
                            if (name_1 === selector || element_3.matches(selector)) {
                                if (mutation.oldValue === null) {
                                    var modifier = _this._modifiers[selector];
                                    modifier.forEach(function (object) {
                                        object.onAdd && object.onAdd(element_3, null);
                                    });
                                }
                                else {
                                    var modifier = _this._modifiers[selector];
                                    var valuePresent_1 = element_3.getAttribute(mutation.attributeName);
                                    modifier.forEach(function (object) {
                                        if (valuePresent_1)
                                            object.onUpdated && object.onUpdated(element_3, mutation.oldValue);
                                        else
                                            object.onRemove && object.onRemove(element_3, mutation.oldValue);
                                    });
                                }
                            }
                        };
                        for (var selector in _this._modifiers) {
                            _loop_3(selector);
                        }
                }
            };
            for (var i = 0; i < mutations.length; i++) {
                _loop_1(i);
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeOldValue: true,
        });
        this._observer = observer;
    }
    DomWatcher.prototype.watch = function (selector, object) {
        var elements = document.querySelectorAll(selector);
        for (var i = 0; i < elements.length; i++) {
            var element = elements[i];
            object.onAdd && object.onAdd(element, null);
        }
        var modifier = this._modifiers[selector] || [];
        modifier.push(object);
        this._modifiers[selector] = modifier;
    };
    DomWatcher.prototype.unwatch = function (selector) {
        delete this._modifiers[selector];
    };
    DomWatcher.prototype.isWatching = function (selector) {
        return !!this._modifiers[selector];
    };
    DomWatcher.prototype.addEventListener = function (selector, event, callback) {
        this.watch(selector, {
            onAdd: function (element) {
                element.addEventListener(event, function (event) {
                    callback(element, event);
                }, { capture: true });
            },
            onRemove: function (element) {
                element.removeEventListener(event, function (event) {
                    callback(element, event);
                }, { capture: true });
            }
        });
    };
    DomWatcher.prototype.delegateEvent = function (tagName, event, callback) {
        document.body.addEventListener(event, function (event) {
            var element = event.target;
            if (element.tagName.toLowerCase() === tagName.toLowerCase())
                return callback(element, event);
            var parent = element.parentElement;
            if (parent && parent.tagName.toLowerCase() === tagName.toLowerCase())
                return callback(parent, event);
            var firstChild = element.firstElementChild;
            if (firstChild && firstChild.tagName.toLowerCase() === tagName.toLowerCase())
                return callback(firstChild, event);
        });
    };
    DomWatcher.prototype.delegateSelectorEvent = function (selector, event, callback) {
        document.body.addEventListener(event, function (event) {
            console.log(event, 'delegateSelectorEvent');
            var element = event.target;
            var closest = element.closest(selector);
            console.log(closest, 'closest', selector);
            if (closest)
                return callback(closest, event);
        });
    };
    DomWatcher.prototype.shutdown = function () {
        for (var selector in this._modifiers)
            this.unwatch(selector);
        this._observer.disconnect();
    };
    DomWatcher.prototype._addNewElement = function (node) {
        for (var selector in this._modifiers) {
            if (node.matches(selector)) {
                var modifier = this._modifiers[selector];
                modifier.forEach(function (object) {
                    object.onAdd && object.onAdd(node, null);
                });
            }
        }
        for (var i = 0; i < node.children.length; i++)
            this._addNewElement(node.children[i]);
    };
    return DomWatcher;
}());
exports.DomWatcher = DomWatcher;
