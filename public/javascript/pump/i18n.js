// i18n.js
//
// i18n for the pump.io client UI
//
// @licstart  The following is the entire license notice for the
//  JavaScript code in this page.
//
// Copyright 2017, Distopico <distopico@riseup.net>
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

// Make sure this exists

if (!window.Pump) {
    window.Pump = {};
}

(function(_, $, Backbone, i18n, Pump) {

    "use strict";

    Pump.i18n = {};

    /**
     * @public
     * Create and setup a i18n instance with XHR backend,
     * the initial configuration data come from server side (Pump.i18nData),
     * this also listen `languageChange` for update the views,
     * and emits a custom event `languageUpdate` for dispatch to sub-views
     */
    Pump.setupI18n = function() {
        var i18nData = Pump.i18nData || {},
            namespace = i18nData.namespace || "messages",
            resources = {};

        Pump.i18n = i18n.createInstance();

        Pump.i18n.use(Pump.backEndXhrI18n()).use(Pump.detectorI18n()).init({
            fallbackLng: Pump.config.defaultLang || "en",
            ns: namespace,
            defaultNS: namespace,
            fallbackNS: namespace,
            whitelist: i18nData.whitelist || [],
            available: i18nData.available || {},
            nonExplicitWhitelist: true,
            saveMissing: false
        }, function(err, t) {
            if (err) {
                Pump.debug(err);
            }
        });

        // Set default resource for prevent initial request
        if (i18nData.language && !_.isEmpty(i18nData.resource)) {
            Pump.i18n.addResourceBundle(i18nData.language, namespace, i18nData.resource, true);
        }

        Pump.i18n.on("languageChanged", function(lng) {
            var oldLng = _.get(Pump.i18nData, "language");

            if (oldLng !== lng) {
                // Custom event to update views if language really changes
                Pump.i18n.emit("languageUpdate", lng, oldLng);
                Pump.setLanguage(lng);

                // Update principals views
                if (Pump.body) {
                    var reloadView = ["content", "nav", "footer"],
                        i;

                    for (i = 0; i < reloadView.length; i++) {
                        var view = reloadView[i];

                        if (Pump.body[view]) {
                            Pump.body[view].render();
                        }
                    }
                }
            }
        });
    };

    /**
     * @public
     * Sets a cookie with the new language code and
     * get the resource bundle for control the futures changes
     * @param {string} lng - the new language to update
     */
    Pump.setLanguage = function(lng) {
        if (_.isEmpty(Pump.i18nData) || _.isEmpty(Pump.i18n)) {
            Pump.debug(new Error("i18n not was initialized yet"));
            return;
        }
        var expirationDate = new Date();
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);

        Pump.i18nData.language = lng;
        Pump.i18nData.resource = Pump.i18n.getResourceBundle(lng);

        document.cookie = "language=" + lng + "; expires=" + expirationDate + "; path=/";
    };

    /**
     * @public
     * Language detector plugin for i18next,
     * this get the language from server side data (Pump.i18nData)
     * or from fallback language option.
     * @return {obbject} detector plugin
     */
    Pump.detectorI18n = function() {
        var detector = {
            type: "languageDetector",

            init: function(services, options, i18nOptions) {
                this.services = services;
                this.i18nOptions = i18nOptions;
            },

            detect: function(detectionOrder) {
                return _.get(Pump, "i18nData.language") ||
                    (this.i18nOptions.fallbackLng && this.i18nOptions.fallbackLng[0]);
            },

            // Not save cache because the server side already make this operation
            cacheUserLanguage: _.noop
        };

        return detector;
    };

    /**
     * @public
     * Makes a XHR request if the language is available retrieve additional resources,
     * if exist some error this will be retry unless it's 404,
     * no missing keys will be created because the server takes care of that.
     * @return {obbject} backend plugin
     */
    Pump.backEndXhrI18n = function() {
        var backend = {
            type: "backend",

            init: function(services, options, i18nOptions) {
                this.services = services;
                this.i18nOptions = i18nOptions;
                this.options = _.defaults(options, this.options || {}, {
                    loadPath: "/locales/{{lng}}/{{ns}}.json"
                });
            },

            readMulti: function(languages, namespaces, callback) {
                var loadPath = this.options.loadPath,
                    cleanedLngs = [];

                _.each(languages, function(lng, index) {
                    var cleanedLng = this.services.languageUtils.formatLanguageCode(lng);
                    cleanedLng = this.getAvailable(cleanedLng);

                    if (!cleanedLng || !this.services.languageUtils.isWhitelisted(cleanedLng)) {
                        Pump.debug("Language not supported: " + lng);
                        return;
                    }

                    cleanedLngs.pushl(cleanedLng);
                }.bind(this));

                if (!cleanedLngs.length) {
                    return callback(new Error("Languages not supported"), false);
                }

                if (typeof this.options.loadPath === "function") {
                    loadPath = this.options.loadPath(cleanedLngs, namespaces);
                }

                var url = this.services.interpolator.interpolate(loadPath, {
                    lng: cleanedLngs.join("+"),
                    ns: namespaces.join("+") });

                this.loadUrl(url, callback);
            },

            read: function(language, namespace, callback) {
                var loadPath = this.options.loadPath,
                    cleanedLng = this.services.languageUtils.formatLanguageCode(language);

                cleanedLng = this.getAvailable(cleanedLng);

                if (!cleanedLng || !this.services.languageUtils.isWhitelisted(cleanedLng)) {
                    return callback(new Error("Language not supported: " + language), false);
                }

                if (typeof this.options.loadPath === "function") {
                    loadPath = this.options.loadPath([cleanedLng], [namespace]);
                }

                var url = this.services.interpolator.interpolate(loadPath, {
                    lng: cleanedLng,
                    ns: namespace
                });

                this.loadUrl(url, callback);
            },

            getAvailable: function(code) {
                var available = this.i18nOptions.available;

                if (!available || _.isEmpty(available)) {
                    return code;
                }

                var shortCode = this.services.languageUtils.getLanguagePartFromCode(code);

                if (available[code]) {
                    return code;
                } else if (available[shortCode]) {
                    return shortCode;
                }
            },

            loadUrl: function(url, callback) {
                $.ajax(url, this.options).done(function(data, xhr) {
                    callback(null, data);
                }).fail(function(xhr, textStatus) {
                    var retry = true;
                    if (xhr.status === 404) {
                        retry = false;
                    }
                    // if is error and "true" i18next will get again
                    callback(xhr, retry);
                });
            },

            // Not create/save missing keys, this happened in backend side
            create: _.noop
        };

        return backend;
    };

})(window._, window.$, window.Backbone, window.i18next, window.Pump);
