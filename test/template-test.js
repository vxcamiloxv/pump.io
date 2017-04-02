// web-template.js
//
// Test the template module
//
// Copyright 2012, E14N https://e14n.com/
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

"use strict";

var fs = require("fs"),
    path = require("path"),
    assert = require("assert"),
    Logger = require("bunyan"),
    vows = require("vows");

var suite = vows.describe("template module interface");

suite.addBatch({
    "When we require the template module": {
        topic: function() {
            return require("../lib/template");
        },
        "it returns an object": function(template) {
            assert.isObject(template);
        },
        "and we check its methods": {
            topic: function(template) {
                return template;
            },
            "it has a generate method": function(template) {
                assert.isFunction(template.generate);
            },
            "and we save templates file": {
                topic: function(template) {
                    var viewsPath = path.resolve(__dirname, "../public/template"),
                        templatesFile = path.join(viewsPath, "templates.js"),
                        templatesMinFile = path.join(viewsPath, "templates.min.js"),
                        log = new Logger({
                            name: "template-test",
                            streams: [{path: "/dev/null"}]
                        }),
                        callback = this.callback;

                    if (fs.existsSync(templatesFile)) {
                        fs.unlinkSync(templatesFile);
                    }

                    try {
                        template.generate({
                            views: viewsPath
                        }, log);
                        callback(null, log, viewsPath, templatesFile);
                    } catch (err) {
                        callback(err);
                    }
                },
                "it works": function(err, log, viewsPath, templatesFile) {
                    assert.ifError(err);
                    assert.ok(fs.existsSync(templatesFile));
                },
                "and we save minify templates file": {
                    topic: function(log, viewsPath, templatesFile, template) {
                        var callback = this.callback,
                            templatesMinFile = path.join(viewsPath, "templates.min.js");

                        if (fs.existsSync(templatesMinFile)) {
                            fs.unlinkSync(templatesMinFile);
                        }

                        try {
                            template.generate({
                                views: viewsPath,
                                minify: true
                            }, log);
                            callback(null, templatesMinFile);
                        } catch (err) {
                            callback(err);
                        }
                    },
                    "it works": function(err, templatesMinFile) {
                        assert.ifError(err);
                        assert.ok(fs.existsSync(templatesMinFile));
                    }
                }
            }
        }
    }
});

suite["export"](module);
