// pump.js
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

    Pump.setupI18n = function() {
        var i18nNamespace = _.get(Pump, "i18nResource.ns") || "messages";
        Pump.i18n = i18n.createInstance();

        Pump.i18n.use(Pump.backEndXhrI18n()).use(window.i18nextBrowserLanguageDetector).init({
            fallbackLng: Pump.config.defaultLang || "en",
            ns: i18nNamespace,
            defaultNS: i18nNamespace,
            fallbackNS: i18nNamespace,
            resources: Pump.defaultResource(),
            detection: {
                lookupCookie: "i18nPump.io",
                lookupLocalStorage: "i18nPump.io"
            }
        }, function(err, t) {
            Pump.debug(err);
        });

        Pump.i18n.on("languageChanged", function() {
            // Update view
        });
    };

    Pump.defaultResource = function() {
        var i18nData = Pump.i18nResource,
            resource = {};

        if (i18nData && i18nData.lng) {
            resource[i18nData.lng] = {};
            resource[i18nData.lng][i18nData.ns] = i18nData.resource || {};
        }

        return resource;
    };

    Pump.backEndXhrI18n = function() {
        var Backend = {
            type: "backend",

            init: function(services, options) {
                this.type = "backend";
                this.services = services;
                this.options = _.defaults(options, this.options || {}, {
                    loadPath: "/locales/{{lng}}/{{ns}}.json"
                });
            },

            readMulti: function(languages, namespaces, callback) {
                var loadPath = this.options.loadPath;
                if (typeof this.options.loadPath === "function") {
                    loadPath = this.options.loadPath(languages, namespaces);
                }

                var url = this.services.interpolator.interpolate(loadPath, {
                    lng: languages.join("+"),
                    ns: namespaces.join("+") });

                this.loadUrl(url, callback);
            },

            read: function(language, namespace, callback) {
                var loadPath = this.options.loadPath;
                if (typeof this.options.loadPath === "function") {
                    loadPath = this.options.loadPath([language], [namespace]);
                }

                var url = this.services.interpolator.interpolate(loadPath, {
                    lng: language,
                    ns: namespace
                });

                this.loadUrl(url, callback);
            },

            loadUrl: function(url, callback) {
                $.ajax(url, this.options).done(function(data, xhr) {
                    callback(null, data);
                }).fail(function(xhr, textStatus) {
                    var retry = true;
                    if (xhr.status === 404) {
                        retry = false;
                    }
                    // if is error and 'true' i18next will get again
                    callback(xhr, retry);
                });
            }
        };

        return Backend;
    };

})(window._, window.$, window.Backbone, window.i18next, window.Pump);
