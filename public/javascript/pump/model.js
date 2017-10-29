// pump/model.js
//
// Backbone models for the pump.io client UI
//
// Copyright 2011-2012, E14N https://e14n.com/
//
// @licstart  The following is the entire license notice for the
//  JavaScript code in this page.
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
//
// @licend  The above is the entire license notice
// for the JavaScript code in this page.

(function(_, $, Backbone, Pump) {

    "use strict";

    // Override backbone sync to use OAuth

    Backbone.sync = function(method, model, options) {

        var getValue = function(object, prop) {
            if (_.isFunction(object[prop])) {
                return object[prop]();
            } else if (object[prop]) {
                return object[prop];
            } else if (object.has && object.has(prop)) {
                return object.get(prop);
            } else {
                return null;
            }
        };

        var methodMap = {
            "create": "POST",
            "update": "PUT",
            "delete": "DELETE",
            "read":   "GET"
        };

        var type = methodMap[method];

        // Default options, unless specified.

        options = options || {};

        // Default JSON-request options.
        var params = {type: type, dataType: "json"};

        // Ensure that we have a URL.

        if (!options.url) {

            if (type == "POST") {
                params.url = getValue(model.collection, "url");
            } else if (model.proxyURL) {
                params.url = model.proxyURL;
            } else {
                params.url = getValue(model, "url");
            }

            if (!params.url || !_.isString(params.url)) {
                throw new Error("No URL");
            }
        }

        // Ensure that we have the appropriate request data.
        if (!options.data && model && (method == "create" || method == "update")) {
            params.contentType = "application/json";
            params.data = JSON.stringify(model.toJSON());
        }

        // Don't process data on a non-GET request.
        if (params.type !== "GET" && !Backbone.emulateJSON) {
            params.processData = false;
        }

        params = _.extend(params, options);

        Pump.ajax(params);

        return null;
    };

    // A little bit of model sugar
    // Create Model attributes for our object-y things

    Pump.Model = Backbone.Model.extend({

        activityObjects: [],
        activityObjectBags: [],
        activityObjectStreams: [],
        activityStreams: [],
        peopleStreams: [],
        listStreams: [],
        people: [],

        initialize: function() {

            var obj = this,
                neverNew = function() { // XXX: neverNude
                    return false;
                },
                initer = function(obj, model) {
                    return function(name) {
                        var raw = obj.get(name);
                        if (raw) {
                            // use unique for cached stuff
                            if (model.unique) {
                                obj[name] = model.unique(raw);
                            } else {
                                obj[name] = new model(raw);
                            }
                            obj[name].isNew = neverNew;
                        }
                        obj.on("change:"+name, function(changed) {
                            var raw = obj.get(name);
                            if (obj[name] && obj[name].set) {
                                obj[name].set(raw);
                            } else if (raw) {
                                if (model.unique) {
                                    obj[name] = model.unique(raw);
                                } else {
                                    obj[name] = new model(raw);
                                }
                                obj[name].isNew = neverNew;
                            }
                        });
                    };
                };

            _.each(obj.activityObjects, initer(obj, Pump.ActivityObject));
            _.each(obj.activityObjectBags, initer(obj, Pump.ActivityObjectBag));
            _.each(obj.activityObjectStreams, initer(obj, Pump.ActivityObjectStream));
            _.each(obj.activityStreams, initer(obj, Pump.ActivityStream));
            _.each(obj.peopleStreams, initer(obj, Pump.PeopleStream));
            _.each(obj.listStreams, initer(obj, Pump.ListStream));
            _.each(obj.people, initer(obj, Pump.Person));
        },
        toJSONRef: function() {
            var obj = this;
            return {
                id: obj.get(obj.idAttribute),
                objectType: obj.getObjectType()
            };
        },
        getObjectType: function() {
            var obj = this;
            return obj.get("objectType");
        },
        toJSON: function(seen) {

            var obj = this,
                id = obj.get(obj.idAttribute),
                json = _.clone(obj.attributes),
                jsoner = function(name) {
                    if (_.has(obj, name)) {
                        json[name] = obj[name].toJSON(seenNow);
                    }
                },
                seenNow;

            if (seen && id && _.includes(seen, id)) {

                json = obj.toJSONRef();

            } else {

                if (seen) {
                    seenNow = seen.slice(0);
                } else {
                    seenNow = [];
                }

                if (id) {
                    seenNow.push(id);
                }

                _.each(obj.activityObjects, jsoner);
                _.each(obj.activityObjectBags, jsoner);
                _.each(obj.activityObjectStreams, jsoner);
                _.each(obj.activityStreams, jsoner);
                _.each(obj.peopleStreams, jsoner);
                _.each(obj.listStreams, jsoner);
                _.each(obj.people, jsoner);
            }

            return json;
        },
        set: function(props) {
            var model = this;
            if (_.has(props, "items")) {
                Pump.debug("Setting property 'items' for model " + model.id);
            }
            return Backbone.Model.prototype.set.apply(model, arguments);
        },
        merge: function(props) {
            var model = this,
                complicated = model.complicated();

            Pump.debug("Merging " + model.id + " with " + (props.id || props.url || props.nickname || "unknown"));

            _.each(props, function(value, key) {
                if (!model.has(key)) {
                    model.set(key, value);
                } else if (_.includes(complicated, key) && model[key] && _.isFunction(model[key].merge)) {
                    model[key].merge(value);
                } else {
                    // XXX: resolve non-complicated stuff
                }
            });
        },
        complicated: function() {
            var attrs = ["activityObjects",
                         "activityObjectBags",
                         "activityObjectStreams",
                         "activityStreams",
                         "peopleStreams",
                         "listStreams",
                         "people"],
                names = [],
                model = this;

            _.each(attrs, function(attr) {
                if (_.isArray(model[attr])) {
                    names = names.concat(model[attr]);
                }
            });

            return names;
        }
    },
    {
        cache: {},
        keyAttr: "id", // works for activities and activityobjects
        unique: function(props) {
            var inst,
                cls = this,
                key = props[cls.keyAttr];

            if (key && _.has(cls.cache, key)) {

                inst = cls.cache[key];
                // Check the updated flag
                inst.merge(props);

            } else {
                inst = new cls(props);

                if (key) {
                    cls.cache[key] = inst;
                }

                inst.on("change:"+cls.keyAttr, function(model, key) {
                    var oldKey = model.previous(cls.keyAttr);
                    if (oldKey && _.has(cls.cache, oldKey)) {
                        delete cls.cache[oldKey];
                    }
                    cls.cache[key] = inst;
                });
            }

            return inst;
        },
        clearCache: function() {
            this.cache = {};
        }
    });

    // An array of objects, usually the "items" in a stream

    Pump.Items = Backbone.Collection.extend({
        constructor: function(models, options) {
            var items = this;
            // Use unique() to get unique items
            models = _.map(models, function(raw) {
                return items.model.unique(raw);
            });
            Backbone.Collection.apply(this, [models, options]);
        },
        url: function() {
            var items = this;
            return items.stream.url();
        },
        toJSON: function(seen) {
            var items = this;

            return items.map(function(item) {
                return item.toJSON(seen);
            });
        },
        merge: function(props) {
            var items = this,
                unique;

            if (_.isArray(props)) {
                Pump.debug("Merging items of " + items.url() + " of length " + items.length + " with array of length " + props.length);
                unique = props.map(function(item) {
                    return items.model.unique(item);
                });
                items.add(unique);
            } else {
                Pump.debug("Non-array passed to items.merge()");
            }
        }
    });

    // A stream of objects. It maps to the ActivityStreams collection
    // representation -- some wrap-up data like url and totalItems, plus an array of items.

    Pump.Stream = Pump.Model.extend({
        people: ["author"],
        itemsClass: Pump.Items,
        idAttribute: "url",
        getObjectType: function() {
            var obj = this;
            return "collection";
        },
        initialize: function() {
            var str = this,
                items = str.get("items");

            Pump.Model.prototype.initialize.apply(str);

            // We should always have items

            if (_.isArray(items)) {
                str.items = new str.itemsClass(items);
            } else {
                str.items = new str.itemsClass([]);
            }

            str.items.stream = str;

            str.on("change:items", function(newStr, items) {
                var str = this;
                Pump.debug("Resetting items of " + str.url() + " to new array of length " + items.length);
                str.items.reset(items);
            });

            str.items.on("add", function(model) {
                var object = model.get("object"),
                    verb = model.get("verb"),
                    isPost = verb === "post" || verb == "create",
                    isComment = false,
                    id;

                if (!object) {
                    return;
                }

                id = object.id;
                if (object.objectType == "comment") {
                    isComment = true;
                    verb = "replies";
                    id = object.inReplyTo.id;
                }

                if (isComment || !isPost) {
                    var major = Pump.getStreams().major,
                        contModel = (Pump.body.content.userContent || Pump.body.content).model,
                        post;

                    if (major && major.items) {
                        post = major.items.findWhere({
                            object: {id: id}
                        });
                    } else if (contModel && contModel.items) {
                        post = contModel.items.findWhere({id: id});
                    } else if (contModel && contModel.id == id) {
                        post = contModel;
                    }

                    if (!post) {
                        return;
                    }

                    if (!_.has(post, "object")) {
                        post =  {object: post};
                    }
                    object.author = model.get("actor");

                    switch (verb) {
                    case "replies":
                        post.object.replies.items.add(object);
                        post.object.replies.set({
                            totalItems: post.object.replies.items.length
                        });
                        break;
                    case "like":
                    case "favorite":
                    case "unlike":
                    case "unfavorite":
                        if (!_.has(object.likes, "items")) {
                            // TODO: sometimes API returns empty items when has likes
                            object.likes.items = post.object.likes.items.toJSON();
                            object.likes.items.push(object.author);
                        }
                        post.object.set({likes: object.likes});
                        break;
                    case "share":
                    case "unshare":
                        if (!_.has(object.shares, "items")) {
                            object.shares.items = post.object.shares.items.toJSON();
                            object.shares.items.push(object.author);
                        }
                        post.object.set({shares: object.shares});
                        break;
                    }
                }
            });
        },
        url: function() {
            var str = this;
            if (str.has("pump_io") && _.has(str.get("pump_io"), "proxyURL")) {
                return str.get("pump_io").proxyURL;
            } else {
                return str.get("url");
            }
        },
        nextLink: function(count) {
            var str = this,
                url,
                item;

            if (_.isUndefined(count)) {
                count = 20;
            }
            if (str.has("links") && _.has(str.get("links"), "next")) {
                url = str.get("links").next.href;
            } else if (str.items && str.items.length > 0) {
                item = str.items.at(str.items.length-1);
                url = str.url() + "?before=" + item.id + "&type=" + item.get("objectType");
            } else {
                url = null;
            }

            if (url && count != 20) {
                url = url + "&count=" + count;
            }

            return url;
        },
        prevLink: function(count) {
            var str = this,
                url,
                item;

            if (_.isUndefined(count)) {
                count = 20;
            }
            if (str.has("links") && _.has(str.get("links"), "prev")) {
                url = str.get("links").prev.href;
            } else if (str.items && str.items.length > 0) {
                item = str.items.at(0);
                url = str.url() + "?since=" + item.id + "&type=" + item.get("objectType");
            } else {
                url = null;
            }

            if (url && count != 20) {
                url = url + "&count=" + count;
            }

            return url;
        },
        getPrev: function(count, callback) { // Get stuff later than the current group
            var stream = this,
                prevLink,
                options;

            if (!callback) {
                // This can also be undefined, btw
                callback = count;
                count    = 20;
            }

            prevLink = stream.prevLink(count);

            if (!prevLink) {
                if (_.isFunction(callback)) {
                    callback(new Error("Can't get prevLink for stream " + stream.url()), null);
                }
                return;
            }

            options = {
                type: "GET",
                dataType: "json",
                url: prevLink,
                success: function(data) {
                    if (data.items && data.items.length > 0) {
                        if (stream.items) {
                            stream.items.add(data.items, {at: 0});
                        } else {
                            stream.items = new stream.itemsClass(data.items);
                        }
                    }
                    if (data.links && data.links.prev && data.links.prev.href) {
                        if (stream.has("links")) {
                            stream.get("links").prev = data.links.prev;
                        } else {
                            stream.set("links", {"prev": {"href": data.links.prev.href}});
                        }
                    }
                    if (_.isFunction(callback)) {
                        callback(null, data);
                    }
                },
                error: function(jqxhr) {
                    if (_.isFunction(callback)) {
                        callback(Pump.jqxhrError(jqxhr), null);
                    }
                }
            };

            Pump.ajax(options);

        },
        getNext: function(count, callback) { // Get stuff earlier than the current group
            var stream = this,
                nextLink,
                options;

            if (!callback) {
                // This can also be undefined, btw
                callback = count;
                count    = 20;
            }

            nextLink = stream.nextLink(count);

            if (!nextLink) {
                if (_.isFunction(callback)) {
                    callback(new Error("Can't get nextLink for stream " + stream.url()), null);
                }
                return;
            }

            options = {
                type: "GET",
                dataType: "json",
                url: nextLink,
                success: function(data) {
                    if (data.items) {
                        if (stream.items) {
                            // Add them at the end
                            stream.items.add(data.items, {at: stream.items.length});
                        } else {
                            stream.items = new stream.itemsClass(data.items);
                        }
                    }
                    if (data.links) {
                        if (data.links.next && data.links.next.href) {
                            if (stream.has("links")) {
                                stream.get("links").next = data.links.next;
                            } else {
                                stream.set("links", {"next": {"href": data.links.next.href}});
                            }
                        } else {
                            if (stream.has("links")) {
                                delete stream.get("links").next;
                            }
                        }
                    }
                    if (_.isFunction(callback)) {
                        callback(null, data);
                    }
                },
                error: function(jqxhr) {
                    if (_.isFunction(callback)) {
                        callback(Pump.jqxhrError(jqxhr), null);
                    }
                }
            };

            Pump.ajax(options);
        },
        getAllNext: function(callback) {
            var stream = this;

            stream.getNext(stream.maxCount(), function(err, data) {
                if (err) {
                    callback(err);
                } else if (data.items && data.items.length > 0 && stream.items.length < stream.get("totalItems")) {
                    // recurse
                    stream.getAllNext(callback);
                } else {
                    callback(null);
                }
            });
        },
        getAllPrev: function(callback) {
            var stream = this;

            stream.getPrev(stream.maxCount(), function(err, data) {
                if (err) {
                    callback(err);
                } else if (data.items && data.items.length > 0 && stream.items.length < stream.get("totalItems")) {
                    // recurse
                    stream.getAllPrev(callback);
                } else {
                    callback(null);
                }
            });
        },
        getAll: function(callback) { // Get stuff later than the current group
            var stream = this,
                url = stream.url(),
                count,
                options,
                nl,
                pl;

            if (!url) {
                if (_.isFunction(callback)) {
                    callback(new Error("No url for stream"), null);
                }
                return;
            }

            pl = stream.prevLink();
            nl = stream.nextLink();

            if (nl || pl) {
                var ndone = false,
                    nerror = false,
                    pdone = false,
                    perror = false;

                stream.getAllNext(function(err) {
                    ndone = true;
                    if (err) {
                        nerror = true;
                        if (!perror) {
                            callback(err);
                        }
                    } else {
                        if (pdone) {
                            callback(null);
                        }
                    }
                });

                stream.getAllPrev(function(err) {
                    pdone = true;
                    if (err) {
                        perror = true;
                        if (!nerror) {
                            callback(err);
                        }
                    } else {
                        if (ndone) {
                            callback(null);
                        }
                    }
                });

            } else {

                count = stream.maxCount();

                options = {
                    type: "GET",
                    dataType: "json",
                    url: url + "?count=" + count,
                    success: function(data) {
                        if (data.items) {
                            if (stream.items) {
                                stream.items.add(data.items);
                            } else {
                                stream.items = new stream.itemsClass(data.items);
                            }
                        }
                        if (data.links && data.links.next && data.links.next.href) {
                            if (stream.has("links")) {
                                stream.get("links").next = data.links.next;
                            } else {
                                stream.set("links", data.links);
                            }
                        } else {
                            // XXX: end-of-collection indicator?
                        }
                        stream.trigger("getall");
                        if (_.isFunction(callback)) {
                            callback(null, data);
                        }
                    },
                    error: function(jqxhr) {
                        if (_.isFunction(callback)) {
                            callback(Pump.jqxhrError(jqxhr), null);
                        }
                    }
                };

                Pump.ajax(options);
            }
        },
        maxCount: function() {
            var stream = this,
                count,
                total = stream.get("totalItems");

            if (_.isNumber(total)) {
                count = Math.min(total, 200);
            } else {
                count = 200;
            }

            return count;
        },
        toJSONRef: function() {
            var str = this;
            return {
                totalItems: str.get("totalItems"),
                url: str.get("url")
            };
        },
        toJSON: function(seen) {
            var str = this,
                url = str.get("url"),
                json,
                seenNow;

            json = Pump.Model.prototype.toJSON.apply(str, [seen]);

            if (!seen || (url && !_.includes(seen, url))) {

                if (seen) {
                    seenNow = seen.slice(0);
                } else {
                    seenNow = [];
                }

                if (url) {
                    seenNow.push(url);
                }

                json.items = str.items.toJSON(seenNow);
            }

            return json;
        },
        complicated: function() {
            var str = this,
                names = Pump.Model.prototype.complicated.apply(str);

            names.push("items");

            return names;
        }
    },
    {
        keyAttr: "url"
    });

    // A social activity.

    Pump.Activity = Pump.Model.extend({
        activityObjects: ["actor", "object", "target", "generator", "provider", "location"],
        activityObjectBags: ["to", "cc", "bto", "bcc"],
        url: function() {
            var links = this.get("links"),
                pump_io = this.get("pump_io"),
                uuid = this.get("uuid");
            if (pump_io && pump_io.proxyURL) {
                return pump_io.proxyURL;
            } else if (links && _.isObject(links) && links.self) {
                return links.self;
            } else if (uuid) {
                return "/api/activity/" + uuid;
            } else {
                return null;
            }
        },
        pubDate: function() {
            return Date.parse(this.published);
        },
        initialize: function() {
            var activity = this;

            Pump.Model.prototype.initialize.apply(activity);

            // For "post" activities we strip the author
            // This adds it back in; important for uniquified stuff

            if (activity.verb == "post" &&
                activity.object &&
                !activity.object.author &&
                activity.actor) {
                activity.object.author = activity.actor;
            }
        }
    });

    Pump.ActivityItems = Pump.Items.extend({
        model: Pump.Activity,
        add: function(models, options) {
            // Usually add at the beginning of the list
            if (!options) {
                options = {};
            }
            if (!_.has(options, "at")) {
                options.at = 0;
            }
            Backbone.Collection.prototype.add.apply(this, [models, options]);
            // Don't apply changes yet.
            // this.applyChanges(models);
        },
        comparator: function(first, second) {
            var d1 = first.pubDate(),
                d2 = second.pubDate();
            if (d1 > d2) {
                return -1;
            } else if (d2 > d1) {
                return 1;
            } else {
                return 0;
            }
        },
        applyChanges: function(models) {
            var items = this;
            if (!_.isArray(models)) {
                models = [models];
            }
            _.each(models, function(act) {
                if (!(act instanceof Pump.Activity)) {
                    act = Pump.Activity.unique(act);
                }
                switch (act.get("verb")) {
                case "post":
                case "create":
                    if (act.object.inReplyTo) {
                        if (!act.object.author) {
                            act.object.author = act.actor;
                        }
                        if (!act.object.inReplyTo.replies) {
                            act.object.inReplyTo.replies = new Pump.ActivityObjectStream();
                        }

                        if (!act.object.inReplyTo.replies.items) {
                            act.object.inReplyTo.replies.items = new Pump.ActivityObjectItems();
                        }
                        act.object.inReplyTo.replies.items.add(act.object);
                    }
                    break;
                case "like":
                case "favorite":
                    if (!act.object.likes) {
                        act.object.likes = new Pump.ActivityObjectStream();
                    }
                    if (!act.object.likes.items) {
                        act.object.likes.items = new Pump.ActivityObjectItems();
                    }
                    act.object.likes.items.add(act.actor);
                    break;
                case "unlike":
                case "unfavorite":
                    if (act.object.likes && act.object.likes.items) {
                        act.object.likes.items.remove(act.actor);
                    }
                    break;
                case "share":
                    if (!act.object.shares) {
                        act.object.shares = new Pump.ActivityObjectStream();
                    }
                    if (!act.object.shares.items) {
                        act.object.shares.items = new Pump.ActivityObjectItems();
                    }
                    act.object.shares.items.add(act.actor);
                    break;
                case "unshare":
                    if (act.object.shares && act.object.shares.items) {
                        act.object.shares.items.remove(act.actor);
                    }
                    break;
                }
            });
        }
    });

    Pump.ActivityStream = Pump.Stream.extend({
        itemsClass: Pump.ActivityItems
    });

    Pump.ActivityObject = Pump.Model.extend({
        activityObjects: ["author", "location", "inReplyTo"],
        activityObjectBags: ["attachments", "tags"],
        activityObjectStreams: ["likes", "replies", "shares"],
        url: function() {
            var links = this.get("links"),
                pump_io = this.get("pump_io"),
                uuid = this.get("uuid"),
                objectType = this.get("objectType");
            if (pump_io && pump_io.proxyURL) {
                return pump_io.proxyURL;
            } else if (links &&
                       _.isObject(links) &&
                       _.has(links, "self") &&
                       _.isObject(links.self) &&
                       _.has(links.self, "href") &&
                       _.isString(links.self.href)) {
                return links.self.href;
            } else if (objectType) {
                return "/api/"+objectType+"/" + uuid;
            } else {
                return null;
            }
        }
    });

    // XXX: merge with Pump.Stream?

    Pump.List = Pump.ActivityObject.extend({
        objectType: "collection",
        peopleStreams: ["members"],
        initialize: function() {
            Pump.Model.prototype.initialize.apply(this, arguments);
        }
    });

    Pump.Person = Pump.ActivityObject.extend({
        objectType: "person",
        activityObjectStreams: ["favorites"],
        listStreams: ["lists"],
        peopleStreams: ["followers", "following"],
        initialize: function() {
            Pump.Model.prototype.initialize.apply(this, arguments);
        }
    });

    Pump.ActivityObjectItems = Pump.Items.extend({
        model: Pump.ActivityObject
    });

    Pump.ActivityObjectStream = Pump.Stream.extend({
        itemsClass: Pump.ActivityObjectItems
    });

    Pump.ListItems = Pump.Items.extend({
        model: Pump.List
    });

    Pump.ListStream = Pump.Stream.extend({
        itemsClass: Pump.ListItems
    });

    // Unordered, doesn't have an URL

    Pump.ActivityObjectBag = Backbone.Collection.extend({
        model: Pump.ActivityObject,
        merge: function(models, options) {
            var bag = this,
                Model = bag.model,
                mapped;
            mapped = models.map(function(item) {
                return Model.unique(item);
            });
            bag.add(mapped);
        }
    });

    Pump.PeopleItems = Pump.Items.extend({
        model: Pump.Person
    });

    Pump.PeopleStream = Pump.ActivityObjectStream.extend({
        itemsClass: Pump.PeopleItems,
        nextLink: function() {
            var str = this,
                url;
            url = Pump.ActivityObjectStream.prototype.nextLink.apply(str, arguments);
            if (url && url.indexOf("&type=person") == -1) {
                url = url + "&type=person";
            }
            return url;
        },
        prevLink: function() {
            var str = this,
                url;
            url = Pump.ActivityObjectStream.prototype.prevLink.apply(str, arguments);
            if (url && url.indexOf("&type=person") == -1) {
                url = url + "&type=person";
            }
            return url;
        }
    });

    Pump.User = Pump.Model.extend({
        idAttribute: "nickname",
        people: ["profile"],
        initialize: function() {
            var user = this,
                streamUrl = function(rel) {
                    return Pump.fullURL("/api/user/" + user.get("nickname") + rel);
                },
                userStream = function(rel) {
                    return Pump.ActivityStream.unique({url: streamUrl(rel)});
                };

            Pump.Model.prototype.initialize.apply(this, arguments);

            // XXX: maybe move some of these to Person...?

            user.inbox =            userStream("/inbox");
            user.majorInbox =       userStream("/inbox/major");
            user.minorInbox =       userStream("/inbox/minor");
            user.directInbox =      userStream("/inbox/direct");
            user.majorDirectInbox = userStream("/inbox/direct/major");
            user.minorDirectInbox = userStream("/inbox/direct/minor");
            user.stream =           userStream("/feed");
            user.majorStream =      userStream("/feed/major");
            user.minorStream =      userStream("/feed/minor");

            user.on("change:nickname", function() {
                user.inbox.url            = streamUrl("/inbox");
                user.majorInbox.url       = streamUrl("/inbox/major");
                user.minorInbox.url       = streamUrl("/inbox/minor");
                user.directInbox.url      = streamUrl("/inbox/direct");
                user.majorDirectInbox.url = streamUrl("/inbox/direct/major");
                user.minorDirectInbox.url = streamUrl("/inbox/direct/minor");
                user.stream.url           = streamUrl("/feed");
                user.majorStream.url      = streamUrl("/feed/major");
                user.minorStream.url      = streamUrl("/feed/minor");
            });
        },
        isNew: function() {
            // Always PUT
            return false;
        },
        url: function() {
            return Pump.fullURL("/api/user/" + this.get("nickname"));
        }
    },
    {
        cache: {}, // separate cache
        keyAttr: "nickname", // cache by nickname
        clearCache: function() {
            this.cache = {};
        }
    });

})(window._, window.$, window.Backbone, window.Pump);
