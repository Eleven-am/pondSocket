"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pondMouseEvents = void 0;
var pondClick = function (handler) {
    handler('[pond-click]', 'click', function () {
        return {
            value: null,
        };
    });
};
var pondMouseEnter = function (handler) {
    handler('[pond-mouseenter]', 'mouseenter', function () {
        return {
            value: null,
        };
    });
};
var pondMouseLeave = function (handler) {
    handler('[pond-mouseleave]', 'mouseleave', function () {
        return {
            value: null,
        };
    });
};
var pondMouseMove = function (handler) {
    handler('[pond-mousemove]', 'mousemove', function () {
        return {
            value: null,
        };
    });
};
var pondMouseDown = function (handler) {
    handler('[pond-mousedown]', 'mousedown', function () {
        return {
            value: null,
        };
    });
};
var pondMouseUp = function (handler) {
    handler('[pond-mouseup]', 'mouseup', function () {
        return {
            value: null,
        };
    });
};
var pondDoubleClick = function (handler) {
    handler('[pond-double-click]', 'dblclick', function () {
        return {
            value: null,
        };
    });
};
var pondDragStart = function (handler) {
    handler('[pond-drag-start]', 'dragstart', function (_, element) {
        var positions = element.getBoundingClientRect();
        var dragData = {
            top: positions.top,
            left: positions.left,
            width: positions.width,
            height: positions.height
        };
        return {
            value: null,
            dragData: dragData
        };
    });
};
var pondDragEnd = function (handler) {
    handler('[pond-drag-end]', 'dragend', function (_, element) {
        var positions = element.getBoundingClientRect();
        var dragData = {
            top: positions.top,
            left: positions.left,
            width: positions.width,
            height: positions.height
        };
        return {
            value: null,
            dragData: dragData
        };
    });
};
var pondDragOver = function (handler) {
    handler('[pond-drag-over]', 'dragover', function (_, element) {
        var positions = element.getBoundingClientRect();
        var dragData = {
            top: positions.top,
            left: positions.left,
            width: positions.width,
            height: positions.height
        };
        return {
            value: null,
            dragData: dragData
        };
    });
};
var pondDragEnter = function (handler) {
    handler('[pond-drag-enter]', 'dragenter', function (_, element) {
        var positions = element.getBoundingClientRect();
        var dragData = {
            top: positions.top,
            left: positions.left,
            width: positions.width,
            height: positions.height
        };
        return {
            value: null,
            dragData: dragData
        };
    });
};
var pondDragLeave = function (handler) {
    handler('[pond-drag-leave]', 'dragleave', function (_, element) {
        var positions = element.getBoundingClientRect();
        var dragData = {
            top: positions.top,
            left: positions.left,
            width: positions.width,
            height: positions.height
        };
        return {
            value: null,
            dragData: dragData
        };
    });
};
var pondDrop = function (handler) {
    handler('[pond-drop]', 'drop', function (_, element) {
        var positions = element.getBoundingClientRect();
        var dragData = {
            top: positions.top,
            left: positions.left,
            width: positions.width,
            height: positions.height
        };
        return {
            value: null,
            dragData: dragData
        };
    });
};
var pondMouseEvents = function (handler) {
    pondClick(handler);
    pondMouseEnter(handler);
    pondMouseLeave(handler);
    pondMouseMove(handler);
    pondMouseDown(handler);
    pondMouseUp(handler);
    pondDoubleClick(handler);
    pondDragStart(handler);
    pondDragEnd(handler);
    pondDragOver(handler);
    pondDragEnter(handler);
    pondDragLeave(handler);
    pondDrop(handler);
};
exports.pondMouseEvents = pondMouseEvents;
