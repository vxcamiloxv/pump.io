// routes/uploads.js
//
// For the /uploads/* endpoints
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

var send = require("send"),
    fs = require("fs"),
    path = require("path"),
    Step = require("step"),
    _ = require("lodash"),
    Activity = require("../lib/model/activity").Activity,
    HTTPError = require("../lib/httperror").HTTPError,
    mm = require("../lib/mimemap"),
    authc = require("../lib/authc"),
    typeToClass = mm.typeToClass,
    typeToExt = mm.typeToExt,
    extToType = mm.extToType,
    hasOAuth = authc.hasOAuth,
    userOrClientAuth = authc.userOrClientAuth,
    principal = authc.principal;

// Default expires is one year

var EXPIRES = 365 * 24 * 60 * 60 * 1000;

var addRoutes = function(app, session) {
    if (session) {
        app.get("/uploads/*", session, everyAuth, uploadedFile);
    } else {
        app.get("/uploads/*", everyAuth, uploadedFile);
    }
};

// XXX: Add remoteUserAuth

var everyAuth = function(req, res, next) {
    if (hasOAuth(req)) {
        userOrClientAuth(req, res, next);
    } else if (req.session) {
        principal(req, res, next);
    } else {
        next();
    }
};

// Check downloads of uploaded files

var uploadedFile = function(req, res, next) {
    var slug = req.params[0],
        file = _.isString(slug) ? slug.match(/\.(.*)$/) : null,
        ext = _.isArray(file) ? file[1] : null,
        type = extToType(ext),
        Cls = typeToClass(type),
        profile = req.principal,
        obj;

    req.log.debug({profile: profile, slug: slug}, "Checking permissions");

    Step(
        function() {
            if (!ext || !type) {
                throw new HTTPError("Not allowed", 403);
            }
            this();
        },
        function() {
            Cls.search({_slug: slug}, this);
        },
        function(err, objs) {
            if (err) throw err;
            if (!objs || objs.length !== 1) {
                Cls.search({_fslug: slug}, this);
            } else {
                this(null, objs);
            }
        },
        function(err, objs) {
            if (err) throw err;
            if (!objs || objs.length !== 1) {
                throw new Error("Bad number of records for uploads");
            }
            obj = objs[0];
            if (profile &&
                obj.author &&
                profile.id === obj.author.id) {
                send(req, req.app.config.uploaddir + "/" +  slug).pipe(res);
                return;
            }
            Activity.postOf(obj, this);
        },
        function(err, post) {
            if (err) throw err;
            if (!post) {
                throw new HTTPError("Not allowed", 403);
            }
            post.checkRecipient(profile, this);
        },
        function(err, flag) {
            if (err) {
                next(err);
            } else if (!flag) {
                next(new HTTPError("Not allowed", 403));
            } else {
                send(req, req.app.config.uploaddir + "/" +  slug).pipe(res);
            }
        }
    );
};

exports.addRoutes = addRoutes;
