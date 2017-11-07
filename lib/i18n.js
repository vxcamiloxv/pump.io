// i18n.js
//
// i18n middleware/backend for activity pump application
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

"use strict";

var fs = require("fs"),
    path = require("path"),
    _ = require("lodash"),
    Step = require("step"),
    validator = require("validator"),
    i18next = require("i18next"),
    i18nBackend = require("i18next-node-fs-backend"),
    languages = require("../public/locales/languages.json");

var i18nInstance = {},
    i18nNamespace = "messages";

/**
 * @public
 * Create and setup a i18n instance with node backend and defaults language detector,
 * the default namespace is `messages` and the default/fallback language is from `defaultLang`
 * from config file, all locales languages should be in `public/locale/LANG-CODE/messages.json`
 * @param {object} config - configuration of pump.io app
 * @param {object} log - instance of logger
 */
var setup = function(config, log) {
    var defaultLang = config.defaultLang;

    i18nInstance = i18next.createInstance();

    Step(
        function() {
            availableLanguages(this);
        },
        function(err, locales, whitelist) {
            if (err) {
                log.error(err);
            }

            if (whitelist.indexOf(defaultLang) === -1) {
                log.warn("Language not supported: %s", defaultLang);
                defaultLang = "en";
            }
            // Initialize i18n
            i18nInstance.use(languageDetector()).use(i18nBackend).init({
                preload: [defaultLang],
                fallbackLng: defaultLang,
                ns: i18nNamespace,
                defaultNS: i18nNamespace,
                fallbackNS: i18nNamespace,
                whitelist: whitelist,
                nonExplicitWhitelist: true,
                available: locales,
                saveMissing: true,
                saveMissingTo: "all",
                backend: {
                    loadPath: path.resolve(__dirname, "../public/locales/{{lng}}/{{ns}}.json"),
                    addPath: path.resolve(__dirname, "../public/locales/{{lng}}/{{ns}}.json")
                }
            }, function(err) {
                if (err) {
                    log.error(err);
                    return;
                }
                i18nInstance.changeLanguage(defaultLang, function(err, t) {
                    if (err) {
                        log.error(err);
                    }
                });
            });
        }
    );
};

/**
 * @public
 * Get current i18n main instance
 * @return {object} i18n instance
 */
var GetInstance = function() {
    _.extend(this, i18nInstance);
};

/**
 * @public
 * Clone and create new i18n from main instance,
 * this is useful when need to change language only for one user.
 * @return {object} i18n instance
 */
var CloneInstance = function() {
    var instance = i18nInstance.cloneInstance({ initImmediate: false });
    // Attach resource to main instance
    instance.loadLanguages = i18nInstance.loadLanguages.bind(i18nInstance);

    _.extend(this, instance);
};

/**
 * @public
 * Validate is a valid language code,
 * the format should be `language` from ISO 639-1 and country code from ISO 3166-1 alpha2,
 * example: en en-US, en-GB, es, es-MX, es-CO.
 * @param {string} code - language code
 * @return {boolean} true is valid language code
 */
var isValid = function(code) {
    var parts = (code || "").split("-"),
        lang = parts[0],
        country = parts[1];

    return languages[lang] && (!country || validator.isISO31661Alpha2(country));
};

/**
 * @public
 * Get available languages from `public/locales`
 * @param {function} callback - returns error or available data,
 * the available data will be:
 * - {object}: list with name, native name and county code
 * - {array}: available locales
 * @return {boolean} true is valid language code
 */
var availableLanguages = function(callback) {
    var localesPath = path.resolve(__dirname, "../public/locales/"),
        locales = {},
        whitelist = [];

    Step(
        function() {
            fs.readdir(localesPath, this);
        },
        function(err, files) {
            if (err) {
                throw err;
            }
            var group = this.group();

            files.forEach(function(name) {
                var next = group();

                fs.stat(path.resolve(localesPath, name), function(err, stats) {
                    if (err) {
                        return next(err);
                    }
                    if (stats.isDirectory() && isValid(name)) {
                        var parts = name.split("-"),
                            lang = parts[0],
                            country = parts[1];

                        locales[name] = languages[lang];
                        if (country) {
                            locales[name].countryCode = country;
                        }

                        whitelist.push(name);
                    }
                    next(null);
                });
            });
        }, function(err) {
            callback(err, locales, whitelist);
        }
    );
};

/**
 * @public
 * Exposes i18n in request/response and update locales after language change,
 + this get/set the language according with `languageDetector`
 * @return {function} express.js middleware
 */
var reqMiddleware = function() {
    var i18n = i18nInstance;

    function middleware(req, res, next) {
        var path = (req.path || "").split("/")[0];

        if (req.path === "api") {
            return next();
        }

        if (!i18n || !i18n.cloneInstance) {
            req.log.warn("Looks like that i18n instance has not started.");
            return next();
        }

        var i18nClone = i18n.cloneInstance({ initImmediate: false }),
            exists = i18nClone.exists.bind(i18nClone),
            lng = req.lng,
            t = i18nClone.t.bind(i18nClone),
            setLocale = function(lng) {
                if (req.language === lng) {
                    return;
                }
                req.language = req.lng = lng;
                req.languages = i18n.services.languageUtils.toResolveHierarchy(lng);

                if (res.locals) {
                    res.locals.language = lng;
                    res.locals.languageDir = i18n.dir(lng);

                    // Initial i18n resource for reduce requests
                    res.locals.i18nData = {
                        namespace: i18nNamespace,
                        language: lng,
                        whitelist: i18n.options.whitelist,
                        available: i18n.options.available,
                        resource: lng ? i18n.getResourceBundle(lng) : {}
                    };
                }

                // Only save cookie if is authenticated user
                if (req.session || req.principalUser) {
                    if (i18n.services.languageDetector) {
                        i18n.services.languageDetector.cacheUserLanguage(req, res, lng);
                    }
                }
            };

        // Update language changes
        i18nClone.on("languageChanged", setLocale);

        if (!req.lng && i18n.services.languageDetector) {
            lng = i18n.services.languageDetector.detect(req, res) || i18n.options.fallbackLng[0];
        }

        // Expose in request
        req.t = t;
        req.i18n = i18nClone;

        // Expose utilities in response
        if (res.locals) {
            res.locals.t = t;
            res.locals.exists = exists;
            res.locals.i18n = i18nClone;
        }

        // Set locale data
        setLocale(lng);

        if (!req.lng) {
            return next();
        }

        // Trigger sync instance
        i18nClone.changeLanguage(lng);

        // Load resources;
        i18n.loadLanguages(req.lng, function(err) {
            next();
        });
    }

    return middleware;
};

/**
 * @public
 * Language detector plugin for i18next,
 * this get the language from cookie or request header (accept-language),
 * by default first look in cookie and later from header,
 * if the user is authenticated or has session saves the language in cookie.
 * @return {obejct} languageDetector plugin
 */
var languageDetector = function() {
    var detector = {
        type: "languageDetector",

        init: function(services, options, i18nOptions) {
            this.services = services;
            this.i18nOptions = i18nOptions;
            this.options = _.defaults(options, this.options || {}, {
                order: ["cookie", "header"],
                lookupCookie: "language",
                lookupSession: "language",
                caches: ["cookie"]
            });

            // Defaults detector
            this.detectors = {
                cookie: cookieDetector(),
                header: headerDetector()
            };
        },

        detect: function(req, res, order) {
            var detectLng;

            if (arguments.length < 2) {
                return;
            }

            if (!order) {
                order = this.options.order;
            }

            order.forEach(function(detectorName) {
                if (detectLng || !this.detectors[detectorName]) {
                    return;
                }

                var detections = this.detectors[detectorName].detect(req, res, this.options);

                if (!detections) {
                    return;
                }
                if (_.isString(detections)) {
                    detections = [detections];
                }

                // Look in white-list
                detections.forEach(function(lng) {
                    if (detectLng) {
                        return;
                    }

                    var cleanedLng = this.services.languageUtils.formatLanguageCode(lng);

                    if (this.services.languageUtils.isWhitelisted(cleanedLng)) {
                        detectLng = this.getAvailable(cleanedLng);
                        req.i18nLookupName = detectorName;
                    }
                }.bind(this));

            }.bind(this));

            return detectLng || (this.i18nOptions.fallbackLng && this.i18nOptions.fallbackLng[0]);
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

        cacheUserLanguage: function(req, res, lng, caches) {
            if (arguments.length < 3) {
                return;
            }
            if (_.isUndefined(caches)) {
                caches = this.options.caches;
            }
            if (!_.isArray(caches)) {
                return;
            }

            caches.forEach(function(cacheName) {
                if (this.detectors[cacheName] && this.detectors[cacheName].cacheUserLanguage) {
                    this.detectors[cacheName].cacheUserLanguage(req, res, lng, this.options);
                }
            }.bind(this));
        }
    };

    return detector;
};


// Private
/**
 * @private
 * Get language from request header `accept-language`.
 * @return {obejct} header detector
 */
var headerDetector = function() {
    var detector = {

        detect: function(req, res, options) {
            var detectLng;

            if (!_.has(req, "headers")) {
                return;
            }

            var headers = req.headers,
                acceptLanguage = headers["accept-language"];

            if (!acceptLanguage) {
                return;
            }

            var locales = [],
                acceptRegex = /((([a-zA-Z]+(-[a-zA-Z0-9]+){0,2})|\*)(;q=[0-1](\.[0-9]+)?)?)*/g,
                parts = acceptLanguage.match(acceptRegex);

            // Parse
            acceptLanguage = parts.reduce(function(result, accept) {
                if (!accept) {
                    return result;
                }

                var bits = accept.split(";"),
                    ietf = bits[0].split("-"),
                    hasScript = ietf.length === 3,
                    code = ietf[0],
                    region = hasScript ? ietf[2] : ietf[1];

                result.push({
                    lng: code + (region ? "-" + region : ""),
                    quality: bits[1] ? parseFloat(bits[1].split("=")[1]) : 1.0
                });
                return result;
            }, []).sort(function(a, b) {
                return b.quality - a.quality;
            });

            // Set locales order by quality preference
            locales = acceptLanguage.reduce(function(result, accept) {
                result.push(accept.lng);
                return result;
            }, []);

            if (locales.length) {
                detectLng = locales;
            }

            return detectLng;
        }
    };

    return detector;
};

/**
 * @private
 * Get language from cookie and save there
 * when plugin detector consider necessary.
 * @return {obejct} header detector
 */
var cookieDetector = function() {
    var detector = {

        detect(req, res, options) {
            var detectLng;

            if (req && req.cookies) {
                detectLng = req.cookies[options.lookupCookie];
            }

            return detectLng;
        },

        cacheUserLanguage(req, res, lng, options) {
            var app = req.app || {},
                config = app.config || {};

            if (res && res.cookie) {
                var expirationDate = new Date();
                expirationDate.setFullYear(expirationDate.getFullYear() + 1);

                res.cookie(options.lookupCookie, lng, {expires: expirationDate, domain: config.address,  httpOnly: false});
            }
        }
    };

    return detector;
};

module.exports = {
    setup: setup,
    Get: GetInstance,
    Clone: CloneInstance,
    isValid: isValid,
    availableLanguages: availableLanguages,
    middleware: reqMiddleware,
    languageDetector: languageDetector
};
