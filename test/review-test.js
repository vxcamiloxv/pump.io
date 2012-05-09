// review-test.js
//
// Test the review module
//
// Copyright 2012, StatusNet Inc.
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

var assert = require('assert'),
    vows = require('vows'),
    databank = require('databank'),
    URLMaker = require('../lib/urlmaker').URLMaker,
    modelBatch = require('./lib/model').modelBatch,
    Databank = databank.Databank,
    DatabankObject = databank.DatabankObject;

var suite = vows.describe('review module interface');

var testSchema = {
    pkey: "id",
    fields: ['author',
             'content',
             'displayName',
             'published',
             'rating',
             'updated',
             'url']
};

var testData = {
    'create': {
        displayName: "My review of your blog",
        content: "I hate your blog. It's incredibly terrible and bad.",
        url: "http://example.com/reviews/i-hate-your-blog",
        rating: 0.5
    },
    'update': {
        rating: 0.0
    }
};

suite.addBatch(modelBatch('review', 'Review', testSchema, testData));

suite.export(module);


