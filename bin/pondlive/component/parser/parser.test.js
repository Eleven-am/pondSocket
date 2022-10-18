"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
var parser_1 = require("./parser");
var cssGenerator_1 = require("./cssGenerator");
var getChanged_1 = require("./getChanged");
describe('html parser', function () {
    it('should parse a simple html string', function () {
        var className = 'test';
        var message = 'Hello World';
        var string = (0, parser_1.html)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["<div class=\"", "\">", "</div>"], ["<div class=\"", "\">", "</div>"])), className, message);
        expect(string.getParts()).toEqual({
            0: 'test', 1: 'Hello World', s: ['<div class="', '">', '</div>']
        });
    });
    it('should parse a html string with multiple dynamic values', function () {
        var className = 'test';
        var message = 'Hello World';
        var secondClassName = 'test2';
        var secondMessage = 'Hello again';
        var string = (0, parser_1.html)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["<div class=\"", "\">", "<span class=\"", "\">", "</span></div>"], ["<div class=\"", "\">", "<span class=\"", "\">", "</span></div>"])), className, message, secondClassName, secondMessage);
        expect(string.getParts()).toEqual({
            0: 'test',
            1: 'Hello World',
            2: 'test2',
            3: 'Hello again',
            s: ['<div class="', '">', '<span class="', '">', '</span></div>']
        });
    });
    it('should parse a html string with nested dynamic values', function () {
        var firsName = 'John';
        var lastName = 'Doe';
        var age = 42;
        var address = '1 Park Avenue';
        var className = 'test';
        var secondClassName = 'test2';
        var string = (0, parser_1.html)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["<div class=\"", "\">", "</div>"], ["<div class=\"", "\">", "</div>"])), className, (0, parser_1.html)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["<div class=\"", "\">", " ", " is ", " years old and lives at ", "</div>"], ["<div class=\"", "\">", " ", " is ", " years old and lives at ", "</div>"])), secondClassName, firsName, lastName, age, address));
        expect(string.getParts()).toEqual({
            0: 'test', 1: {
                0: 'test2',
                1: 'John',
                2: 'Doe',
                3: 42,
                4: '1 Park Avenue',
                s: ['<div class="', '">', ' ', ' is ', ' years old and lives at ', '</div>']
            }, s: ['<div class="', '">', '</div>']
        });
    });
    it('should parse a html string with nested dynamic values and multiple dynamic values', function () {
        var list = function (name, age) { return (0, parser_1.html)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["<li>", " is ", " years old</li>"], ["<li>", " is ", " years old</li>"])), name, age); };
        var users = [{ name: 'John', age: 42 }, { name: 'Jane', age: 43 }, { name: 'Jack', age: 44 },];
        var string = (0, parser_1.html)(templateObject_6 || (templateObject_6 = __makeTemplateObject(["<ul>", "</ul>"], ["<ul>", "</ul>"])), users.map(function (user) { return list(user.name, user.age); }));
        expect(string.getParts()).toEqual({
            0: {
                0: {
                    0: 'John', 1: 42, s: ['<li>', ' is ', ' years old</li>']
                }, 1: {
                    0: 'Jane', 1: 43, s: ['<li>', ' is ', ' years old</li>']
                }, 2: {
                    0: 'Jack', 1: 44, s: ['<li>', ' is ', ' years old</li>']
                }, s: ['', '', '', '']
            }, s: ['<ul>', '</ul>']
        });
        var newUsers = users.concat([{ name: 'Jill', age: 45 }]);
        var newString = (0, parser_1.html)(templateObject_7 || (templateObject_7 = __makeTemplateObject(["<ul>", "</ul>"], ["<ul>", "</ul>"])), newUsers.map(function (user) { return list(user.name, user.age); }));
        expect(newString.getParts()).toEqual({
            0: {
                0: {
                    0: 'John', 1: 42, s: ['<li>', ' is ', ' years old</li>']
                }, 1: {
                    0: 'Jane', 1: 43, s: ['<li>', ' is ', ' years old</li>']
                }, 2: {
                    0: 'Jack', 1: 44, s: ['<li>', ' is ', ' years old</li>']
                }, 3: {
                    0: 'Jill', 1: 45, s: ['<li>', ' is ', ' years old</li>']
                }, s: ['', '', '', '', '']
            }, s: ['<ul>', '</ul>']
        });
    });
    it('should return parsed html to string', function () {
        var parsed = {
            0: {
                0: {
                    0: 'John', 1: 42, s: ['<li>', ' is ', ' years old</li>']
                }, 1: {
                    0: 'Jane', 1: 43, s: ['<li>', ' is ', ' years old</li>']
                }, 2: {
                    0: 'Jack', 1: 44, s: ['<li>', ' is ', ' years old</li>']
                }, s: ['', '', '', '']
            }, s: ['<ul>', '</ul>']
        };
        var htmlString = (0, parser_1.html)(templateObject_8 || (templateObject_8 = __makeTemplateObject([""], [""])));
        expect(htmlString.parsedHtmlToString(parsed)).toEqual('<ul><li>John is 42 years old</li><li>Jane is 43 years old</li><li>Jack is 44 years old</li></ul>');
    });
    it('should return parsed html to string with nested dynamic values', function () {
        var parsed = {
            0: 'test', 1: {
                0: 'test2',
                1: 'John',
                2: 'Doe',
                3: 42,
                4: '1 Park Avenue',
                s: ['<div class="', '">', ' ', ' is ', ' years old and lives at ', '</div>']
            }, s: ['<div class="', '">', '</div>']
        };
        var htmlString = (0, parser_1.html)(templateObject_9 || (templateObject_9 = __makeTemplateObject([""], [""])));
        expect(htmlString.parsedHtmlToString(parsed)).toEqual('<div class="test"><div class="test2">John Doe is 42 years old and lives at 1 Park Avenue</div></div>');
    });
    it('should return parsed html to string with nested dynamic values and multiple dynamic values', function () {
        var parsed = {
            0: {
                0: {
                    0: 'John', 1: 42, s: ['<li>', ' is ', ' years old</li>']
                }, 1: {
                    0: 'Jane', 1: 43, s: ['<li>', ' is ', ' years old</li>']
                }, 2: {
                    0: 'Jack', 1: 44, s: ['<li>', ' is ', ' years old</li>']
                }, 3: {
                    0: 'Jill', 1: 45, s: ['<li>', ' is ', ' years old</li>']
                }, s: ['', '', '', '', '']
            }, s: ['<ul>', '</ul>']
        };
        var htmlString = (0, parser_1.html)(templateObject_10 || (templateObject_10 = __makeTemplateObject([""], [""])));
        expect(htmlString.parsedHtmlToString(parsed)).toEqual('<ul><li>John is 42 years old</li><li>Jane is 43 years old</li><li>Jack is 44 years old</li><li>Jill is 45 years old</li></ul>');
    });
    it('should parse a html string to plain string', function () {
        var className = 'test';
        var message = 'Hello World';
        var string = (0, parser_1.html)(templateObject_11 || (templateObject_11 = __makeTemplateObject(["<div class=\"", "\">", "</div>"], ["<div class=\"", "\">", "</div>"])), className, message);
        expect(string.toString()).toEqual('<div class="test">Hello World</div>');
    });
    it('should parse a html string with nested dynamic values to plain string', function () {
        var firsName = 'John';
        var lastName = 'Doe';
        var age = 42;
        var address = '1 Park Avenue';
        var className = 'test';
        var secondClassName = 'test2';
        var string = (0, parser_1.html)(templateObject_13 || (templateObject_13 = __makeTemplateObject(["<div class=\"", "\">", "</div>"], ["<div class=\"", "\">", "</div>"])), className, (0, parser_1.html)(templateObject_12 || (templateObject_12 = __makeTemplateObject(["<div class=\"", "\">", " ", " is ", " years old and lives at ", "</div>"], ["<div class=\"", "\">", " ", " is ", " years old and lives at ", "</div>"])), secondClassName, firsName, lastName, age, address));
        expect(string.toString()).toEqual('<div class="test"><div class="test2">John Doe is 42 years old and lives at 1 Park Avenue</div></div>');
    });
    it('should parse a html string with nested dynamic values and multiple dynamic values to plain string', function () {
        var list = function (name, age) { return (0, parser_1.html)(templateObject_14 || (templateObject_14 = __makeTemplateObject(["<li>", " is ", " years old</li>"], ["<li>", " is ", " years old</li>"])), name, age); };
        var users = [{ name: 'John', age: 42 }, { name: 'Jane', age: 43 }, { name: 'Jack', age: 44 },];
        var string = (0, parser_1.html)(templateObject_15 || (templateObject_15 = __makeTemplateObject(["<ul>", "</ul>"], ["<ul>", "</ul>"])), users.map(function (user) { return list(user.name, user.age); }));
        expect(string.toString()).toEqual('<ul><li>John is 42 years old</li><li>Jane is 43 years old</li><li>Jack is 44 years old</li></ul>');
    });
    it('should be able to tell the difference between two html strings', function () {
        var className = 'test';
        var message = 'Hello World';
        var message2 = 'Hello World 2';
        var string = (0, parser_1.html)(templateObject_16 || (templateObject_16 = __makeTemplateObject(["<div class=\"", "\">", "</div>"], ["<div class=\"", "\">", "</div>"])), className, message);
        var string2 = (0, parser_1.html)(templateObject_17 || (templateObject_17 = __makeTemplateObject(["<div class=\"", "\">", "</div>"], ["<div class=\"", "\">", "</div>"])), className, message2);
        expect(string.differentiate(string2)).toEqual({
            1: 'Hello World 2'
        });
    });
    it('should be able to tell the difference between two html strings with nested dynamic values', function () {
        var firsName = 'John';
        var lastName = 'Doe';
        var age = 42;
        var address = '1 Park Avenue';
        var secondAddress = '2 Park Avenue';
        var className = 'test';
        var secondClassName = 'test2';
        var string = (0, parser_1.html)(templateObject_19 || (templateObject_19 = __makeTemplateObject(["<div class=\"", "\">", "</div>"], ["<div class=\"", "\">", "</div>"])), className, (0, parser_1.html)(templateObject_18 || (templateObject_18 = __makeTemplateObject(["<div class=\"", "\">", " ", " is ", " years old and lives at ", "</div>"], ["<div class=\"", "\">", " ", " is ", " years old and lives at ", "</div>"])), secondClassName, firsName, lastName, age, address));
        var string2 = (0, parser_1.html)(templateObject_21 || (templateObject_21 = __makeTemplateObject(["<div class=\"", "\">", "</div>"], ["<div class=\"", "\">", "</div>"])), className, (0, parser_1.html)(templateObject_20 || (templateObject_20 = __makeTemplateObject(["<div class=\"", "\">", " ", " is ", " years old and lives at ", "</div>"], ["<div class=\"", "\">", " ", " is ", " years old and lives at ", "</div>"])), secondClassName, firsName, lastName, age, secondAddress));
        expect(string.differentiate(string2)).toEqual({
            1: {
                4: '2 Park Avenue'
            }
        });
    });
    it('should be able to tell the difference between two html strings with nested dynamic values and multiple dynamic values', function () {
        var list = function (name, age) { return (0, parser_1.html)(templateObject_22 || (templateObject_22 = __makeTemplateObject(["<li>", " is ", " years old</li>"], ["<li>", " is ", " years old</li>"])), name, age); };
        var users = [{ name: 'John', age: 42 }, { name: 'Jane', age: 43 }, { name: 'Jack', age: 44 },];
        var string = (0, parser_1.html)(templateObject_23 || (templateObject_23 = __makeTemplateObject(["<ul>", "</ul>"], ["<ul>", "</ul>"])), users.map(function (user) { return list(user.name, user.age); }));
        var string2 = (0, parser_1.html)(templateObject_24 || (templateObject_24 = __makeTemplateObject(["<ul>", "</ul>"], ["<ul>", "</ul>"])), users.map(function (user) { return list(user.name, user.age + 1); }));
        expect(string.differentiate(string2)).toEqual({
            0: {
                0: {
                    1: 43
                }, 1: {
                    1: 44
                }, 2: {
                    1: 45
                }
            }
        });
    });
    it('should parse a html string with array dynamic values  to plain string', function () {
        var className = 'test';
        var users = [{ name: 'John', age: 42 }, { name: 'Jane', age: 43 }, { name: 'Jack', age: 44 },];
        var string = (0, parser_1.html)(templateObject_26 || (templateObject_26 = __makeTemplateObject(["<div class=\"", "\">", "</div>"], ["<div class=\"", "\">", "</div>"])), className, users.map(function (user) { return (0, parser_1.html)(templateObject_25 || (templateObject_25 = __makeTemplateObject(["<li>", " is ", " years old</li>"], ["<li>", " is ", " years old</li>"])), user.name, user.age); }));
        expect(string.toString()).toEqual('<div class="test"><li>John is 42 years old</li><li>Jane is 43 years old</li><li>Jack is 44 years old</li></div>');
    });
    it('should parse empty dynamic values to plain string', function () {
        var string = (0, parser_1.html)(templateObject_27 || (templateObject_27 = __makeTemplateObject(["<div>", "</div>"], ["<div>", "</div>"])), '');
        expect(string.toString()).toEqual('<div></div>');
        expect(string.getParts()).toEqual({ "0": "", "s": ["<div>", "</div>"] });
        // it should be able to tell the difference between two html strings with empty dynamic values
        var string2 = (0, parser_1.html)(templateObject_28 || (templateObject_28 = __makeTemplateObject(["<div>", "</div>"], ["<div>", "</div>"])), 'hello');
        expect(string2.toString()).toEqual('<div>hello</div>');
        expect(string2.getParts()).toEqual({ "0": "hello", "s": ["<div>", "</div>"] });
        expect(string.differentiate(string2)).toEqual({
            0: 'hello'
        });
        expect(string2.differentiate(string)).toEqual({
            0: ''
        });
    });
    it('should detect the changes and rerender correctly', function () {
        var value = 'Hello World';
        var string = (0, parser_1.html)(templateObject_29 || (templateObject_29 = __makeTemplateObject(["<div>", "</div>"], ["<div>", "</div>"])), value || '');
        expect(string.toString()).toEqual('<div>Hello World</div>');
        var parts = string.getParts();
        expect(parts).toEqual({ "0": "Hello World", "s": ["<div>", "</div>"] });
        value = null;
        var string2 = (0, parser_1.html)(templateObject_30 || (templateObject_30 = __makeTemplateObject(["<div>", "</div>"], ["<div>", "</div>"])), value || '');
        expect(string2.toString()).toEqual('<div></div>');
        expect(string2.getParts()).toEqual({ "0": "", "s": ["<div>", "</div>"] });
        var diff = string.differentiate(string2);
        expect(diff).toEqual({
            0: ''
        });
        var merge = (0, getChanged_1.mergeObjects)(parts, diff);
        expect(merge).toEqual({ "0": "", "s": ["<div>", "</div>"] });
        var htmlString = string.parsedHtmlToString(merge);
        expect(htmlString).toEqual('<div></div>');
    });
    it('should detect the changes and rerender correctly with nested dynamic values', function () {
        var className = 'test';
        var message = 'Hello World';
        var message2 = 'Hello World 2';
        var string = (0, parser_1.html)(templateObject_31 || (templateObject_31 = __makeTemplateObject(["<div class=\"", "\">", "</div>"], ["<div class=\"", "\">", "</div>"])), className, message);
        var string2 = (0, parser_1.html)(templateObject_32 || (templateObject_32 = __makeTemplateObject(["<div class=\"", "\">", "</div>"], ["<div class=\"", "\">", "</div>"])), className, message2);
        expect(string.toString()).toEqual('<div class="test">Hello World</div>');
        var parts = string.getParts();
        expect(parts).toEqual({ "1": "Hello World", "0": "test", "s": ["<div class=\"", "\">", "</div>"] });
        var diff = string.differentiate(string2);
        expect(diff).toEqual({
            1: 'Hello World 2'
        });
        var merge = (0, getChanged_1.mergeObjects)(parts, diff);
        expect(merge).toEqual({ "1": "Hello World 2", "0": "test", "s": ["<div class=\"", "\">", "</div>"] });
        var htmlString = string.parsedHtmlToString(merge);
        expect(htmlString).toEqual('<div class="test">Hello World 2</div>');
    });
    it('should detect the changes and rerender correctly with nested dynamic values and multiple dynamic values', function () {
        var htmlString = (0, parser_1.html)(templateObject_33 || (templateObject_33 = __makeTemplateObject(["<div class=\"", "\">", "</div>"], ["<div class=\"", "\">", "</div>"])), 'test', 'Hello World');
        var htmlString2 = (0, parser_1.html)(templateObject_34 || (templateObject_34 = __makeTemplateObject([""], [""])));
        expect(htmlString.toString()).toEqual('<div class="test">Hello World</div>');
        var getParts = htmlString.getParts();
        expect(getParts).toEqual({ "1": "Hello World", "0": "test", "s": ["<div class=\"", "\">", "</div>"] });
        var diff = htmlString.differentiate(htmlString2);
        expect(diff).toEqual({
            "0": null,
            "1": null,
            "s": {
                "0": "",
                "1": null,
                "2": null
            }
        });
        var merge = (0, getChanged_1.mergeObjects)(getParts, diff);
        expect(merge).toEqual({
            "s": [""]
        });
    });
    it('should be able to reconstruct the html string from the parsed html object', function () {
        var htmlString = (0, parser_1.html)(templateObject_35 || (templateObject_35 = __makeTemplateObject(["<div class=\"", "\">", "</div>"], ["<div class=\"", "\">", "</div>"])), 'test', 'Hello World');
        var htmlString2 = (0, parser_1.html)(templateObject_36 || (templateObject_36 = __makeTemplateObject([""], [""])));
        expect(htmlString.toString()).toEqual('<div class="test">Hello World</div>');
        var getParts = htmlString.getParts();
        expect(getParts).toEqual({ "1": "Hello World", "0": "test", "s": ["<div class=\"", "\">", "</div>"] });
        var diff = htmlString.differentiate(htmlString2);
        expect(diff).toEqual({
            "0": null,
            "1": null,
            "s": {
                "0": "",
                "1": null,
                "2": null
            }
        });
        var merge = htmlString.reconstruct(diff);
        expect(merge).toEqual((0, parser_1.html)(templateObject_37 || (templateObject_37 = __makeTemplateObject([""], [""]))));
    });
});
describe('CssGenerator', function () {
    it('should generate a record object from a string', function () {
        var css = (0, cssGenerator_1.CssGenerator)('hello');
        var data = css(templateObject_38 || (templateObject_38 = __makeTemplateObject([".body { color: red; }"], [".body { color: red; }"])));
        expect(data.classes).toEqual({ body: 'body-hello' });
    });
    it('should generate a record object from a string with multiple classes', function () {
        var css = (0, cssGenerator_1.CssGenerator)('hello');
        var data = css(templateObject_39 || (templateObject_39 = __makeTemplateObject([".body { color: red; } .test { color: blue; }"], [".body { color: red; } .test { color: blue; }"])));
        expect(data.classes).toEqual({ body: 'body-hello', test: 'test-hello' });
    });
    it('should generate a record object from a string with multiple classes and multiple rules', function () {
        var css = (0, cssGenerator_1.CssGenerator)('hello');
        var data = css(templateObject_40 || (templateObject_40 = __makeTemplateObject([".body { color: red; } .test { color: blue; } .test2 { color: green; }"], [".body { color: red; } .test { color: blue; } .test2 { color: green; }"])));
        expect(data.classes).toEqual({ body: 'body-hello', test: 'test-hello', test2: 'test2-hello' });
    });
    it('should generate a style element from a string', function () {
        var css = (0, cssGenerator_1.CssGenerator)('hello');
        var data = css(templateObject_41 || (templateObject_41 = __makeTemplateObject([".body { color: red; }"], [".body { color: red; }"])));
        expect(data.string.toString()).toEqual('<style>.body-hello { color: red; }</style>');
    });
    it('should generate a style element from a string with multiple classes', function () {
        var css = (0, cssGenerator_1.CssGenerator)('hello');
        var data = css(templateObject_42 || (templateObject_42 = __makeTemplateObject([".body { color: red; } .test { color: blue; }"], [".body { color: red; } .test { color: blue; }"])));
        expect(data.string.toString()).toEqual('<style>.body-hello { color: red; } .test-hello { color: blue; }</style>');
    });
    it('should generate a style element from a string with multiple classes and multiple rules', function () {
        var css = (0, cssGenerator_1.CssGenerator)('hello');
        var data = css(templateObject_43 || (templateObject_43 = __makeTemplateObject([".body { color: red; } .test { color: blue; } .testDo { color: green; }"], [".body { color: red; } .test { color: blue; } .testDo { color: green; }"])));
        expect(data.string.toString()).toEqual('<style>.body-hello { color: red; } .test-hello { color: blue; } .testDo-hello { color: green; }</style>');
    });
    it('should ignore non class styles', function () {
        var css = (0, cssGenerator_1.CssGenerator)('hello');
        var data = css(templateObject_44 || (templateObject_44 = __makeTemplateObject(["body { color: red; }"], ["body { color: red; }"])));
        expect(data.string.toString()).toEqual('<style>body { color: red; }</style>');
        var idData = css(templateObject_45 || (templateObject_45 = __makeTemplateObject(["#body { color: red; }"], ["#body { color: red; }"])));
        expect(idData.string.toString()).toEqual('<style>#body { color: red; }</style>');
        var elementData = css(templateObject_46 || (templateObject_46 = __makeTemplateObject(["div { color: red; }"], ["div { color: red; }"])));
        expect(elementData.string.toString()).toEqual('<style>div { color: red; }</style>');
    });
    it('should generate a style element from a string with multiple classes and multiple rules and multiple media queries', function () {
        var css = (0, cssGenerator_1.CssGenerator)('hello');
        var data = css(templateObject_47 || (templateObject_47 = __makeTemplateObject([".body { color: red; } .test { color: blue; } .testDo { color: green; } @media (max-width: 600px) { .body { color: red; } .test { color: blue; } .testDo { color: green; } }"], [".body { color: red; } .test { color: blue; } .testDo { color: green; } @media (max-width: 600px) { .body { color: red; } .test { color: blue; } .testDo { color: green; } }"])));
        expect(data.string.toString()).toEqual('<style>.body-hello { color: red; } .test-hello { color: blue; } .testDo-hello { color: green; } @media (max-width: 600px) { .body-hello { color: red; } .test-hello { color: blue; } .testDo-hello { color: green; } }</style>');
    });
    it('should correctly handle pseudo classes', function () {
        var css = (0, cssGenerator_1.CssGenerator)('hello');
        var data = css(templateObject_48 || (templateObject_48 = __makeTemplateObject([".body:hover { color: red; } .test:active { color: blue; } .testDo:focus { color: green; }"], [".body:hover { color: red; } .test:active { color: blue; } .testDo:focus { color: green; }"])));
        expect(data.string.toString()).toEqual('<style>.body-hello:hover { color: red; } .test-hello:active { color: blue; } .testDo-hello:focus { color: green; }</style>');
    });
    it('should correctly handle pseudo elements', function () {
        var css = (0, cssGenerator_1.CssGenerator)('hello');
        var data = css(templateObject_49 || (templateObject_49 = __makeTemplateObject([".body::before { color: red; } .test::after { color: blue; } .testDo::selection { color: green; }"], [".body::before { color: red; } .test::after { color: blue; } .testDo::selection { color: green; }"])));
        expect(data.string.toString()).toEqual('<style>.body-hello::before { color: red; } .test-hello::after { color: blue; } .testDo-hello::selection { color: green; }</style>');
    });
    it('should handle sibling selectors', function () {
        var css = (0, cssGenerator_1.CssGenerator)('hello');
        var data = css(templateObject_50 || (templateObject_50 = __makeTemplateObject([".body + .test { color: red; } .test ~ .testDo { color: blue; }"], [".body + .test { color: red; } .test ~ .testDo { color: blue; }"])));
        expect(data.string.toString()).toEqual('<style>.body-hello + .test-hello { color: red; } .test-hello ~ .testDo-hello { color: blue; }</style>');
    });
});
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20, templateObject_21, templateObject_22, templateObject_23, templateObject_24, templateObject_25, templateObject_26, templateObject_27, templateObject_28, templateObject_29, templateObject_30, templateObject_31, templateObject_32, templateObject_33, templateObject_34, templateObject_35, templateObject_36, templateObject_37, templateObject_38, templateObject_39, templateObject_40, templateObject_41, templateObject_42, templateObject_43, templateObject_44, templateObject_45, templateObject_46, templateObject_47, templateObject_48, templateObject_49, templateObject_50;
