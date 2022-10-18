"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeepDiff = exports.DomDiff = void 0;
var DomDiff = function (container, htmlString, path, headers) {
    var div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    var newRouter = div.querySelector('#' + path);
    var innerRouter = container.querySelector('#' + path);
    if (newRouter && innerRouter)
        newRouter.replaceWith(innerRouter.cloneNode(true));
    var newElement = div.firstElementChild;
    (0, exports.DeepDiff)(container, newElement);
    if (headers && headers.pageTitle)
        document.title = headers.pageTitle;
};
exports.DomDiff = DomDiff;
var DeepDiff = function (obj1, obj2) {
    if (obj1 instanceof Text && obj2 instanceof Text && obj1.textContent !== obj2.textContent) {
        obj1.replaceWith(obj2.cloneNode(true));
        return;
    }
    if (obj1 instanceof Text && obj2 instanceof Element) {
        obj1.replaceWith(obj2.cloneNode(true));
        return;
    }
    if (obj1 instanceof Element && obj2 instanceof Text) {
        obj1.replaceWith(obj2.cloneNode(true));
        return;
    }
    if (obj1.tagName !== obj2.tagName) {
        obj1.replaceWith(obj2.cloneNode(true));
        return;
    }
    for (var key in obj2.attributes) {
        var attribute = obj2.attributes[key];
        if (attribute && attribute.name && attribute.value)
            if (!obj1.hasAttribute(attribute.name) || obj1.getAttribute(attribute.name) !== attribute.value)
                obj1.setAttribute(attribute.name, attribute.value);
    }
    for (var key in obj1.attributes) {
        var attribute = obj1.attributes[key];
        if (attribute && attribute.name && attribute.value)
            if (!obj2.hasAttribute(attribute.name))
                obj1.removeAttribute(attribute.name);
            else if (obj2.hasAttribute(attribute.name) && obj2.getAttribute(attribute.name) !== attribute.value)
                obj1.setAttribute(attribute.name, obj2.getAttribute(attribute.name));
    }
    var maxChildren = Math.max(obj1.childNodes.length, obj2.childNodes.length);
    for (var i = 0; i < maxChildren; i++) {
        var child1 = obj1.childNodes[i];
        var child2 = obj2.childNodes[i];
        if (child1 && child2)
            (0, exports.DeepDiff)(child1, child2);
        else if (child1)
            return removeElementAndSiblings(obj1, i);
        else if (child2)
            obj1.appendChild(child2.cloneNode(true));
    }
};
exports.DeepDiff = DeepDiff;
var removeElementAndSiblings = function (parent, childIndex) {
    var children = parent.childNodes;
    for (var i = children.length - 1; i >= childIndex; i--) {
        var child = children[i];
        child.remove();
    }
};
