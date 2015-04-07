/*
 *  Copyright (c) 2014, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var React = require('react');
var beautifyHTML = require('js-beautify').html;
var nodeJSX = require('node-jsx');
var assign = require('object-assign');

var DEFAULT_OPTIONS = {
    jsx: {
        extension: '.jsx',
        harmony: false
    },
    doctype: '<!DOCTYPE html>',
    beautify: false,
    caching: true
};

module.exports = function (engineOptions) {
    engineOptions = engineOptions || {};
    // Merge was nice because it did nest objects. assign doesn't. So we're going
    // to assign the JSX options then the rest. If there were more than a single
    // nested option, this would be really dumb. As is, it looks pretty stupid but
    // it keeps our dependencies slim.
    var jsxOptions = assign({}, DEFAULT_OPTIONS.jsx, engineOptions.jsx);

    // Since we're passing an object with jsx as the key, it'll override the rest.
    engineOptions = assign({}, DEFAULT_OPTIONS, engineOptions, {
        jsx: jsxOptions
    });

    // Don't install the require until the engine is created. This lets us leave
    // the option of using harmony features up to the consumer.
    nodeJSX.install(engineOptions.jsx);

    var caching = engineOptions.caching ? true : false;
    var moduleDetectRegEx = new RegExp('\\' + engineOptions.jsx.extension + '$');

    return {
        module: {
            compile: function (template, options, callback) {
                var filename = options.filename;
                var doctype = engineOptions.doctype;
                var component;
                try {
                    component = require(filename);
                    // Transpiled ES6 may export components as { default: Component }
                    component = component.default || component;
                    component = React.createFactory(component);
                }
                catch (e) {
                    return function () {
                        throw e;
                    };
                }
                process.nextTick(function () {
                    callback(null, function (context, options, callback) {
                        var markup = doctype;
                        try {
                            markup += React.renderToStaticMarkup(component(context));
                        }
                        catch (e) {
                            throw e;
                        }
                        if (engineOptions.beautify) {
                            // NOTE: This will screw up some things where whitespace is important, and be
                            // subtly different than prod.
                            markup = beautifyHTML(markup);
                        }
                        if (process.env.NODE_ENV === 'development' || !caching) {
                            Object.keys(require.cache).forEach(function (module) {
                                if (moduleDetectRegEx.test(require.cache[module].filename)) {
                                    delete require.cache[module];
                                }
                            });
                        }
                        callback(null, markup);
                    });
                });
            }
        },
        compileMode: 'async'
    };
};