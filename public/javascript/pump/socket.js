// pump/socket.js
//
// Socket module for the pump.io client UI
//
// @licstart  The following is the entire license notice for the
//  JavaScript code in this page.
//
// Copyright 2011-2012, E14N https://e14n.com/
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

    var _socket = {
        reconnecting: false,
        firstConnection: true,
        retryTimeout: 30000,
        retryAttempts: 0
    };

    Pump.getStreams = function() {

        var streams = {};

        if (Pump.body) {
            if (Pump.body.content) {
                _.extend(streams, Pump.body.content.getStreams());
            }

            if (Pump.body.nav) {
                _.extend(streams, Pump.body.nav.getStreams());
            }
        }

        return streams;
    };

    // Refreshes the current visible streams

    Pump.refreshStreams = function() {
        var streams = Pump.getStreams();

        _.each(streams, function(stream, name) {
            stream.getPrev();
        });
    };

    Pump.updateStream = function(url, activity) {
        var streams = Pump.getStreams(),
            target = _.find(streams, function(stream) { return stream.url() == url; }),
            act;

        if (target) {
            act = Pump.Activity.unique(activity);
            target.items.unshift(act);
        }
    };

    // When we get a challenge from the socket server,
    // We prepare an OAuth request and send it

    Pump.riseToChallenge = function(url, method) {

        var message = {action: url,
                       method: method,
                       parameters: [["oauth_version", "1.0"]]};

        Pump.ensureCred(function(err, cred) {

            var pair, secrets;

            if (err) {
                Pump.error("Error getting OAuth credentials.");
                return;
            }

            message.parameters.push(["oauth_consumer_key", cred.clientID]);
            secrets = {consumerSecret: cred.clientSecret};

            pair = Pump.getUserCred();

            if (pair) {
                message.parameters.push(["oauth_token", pair.token]);
                secrets.tokenSecret = pair.secret;
            }

            OAuth.setTimestampAndNonce(message);

            OAuth.SignatureMethod.sign(message, secrets);

            Pump.socket.send(JSON.stringify({cmd: "rise", message: message}));
        });
    };

    // Our socket.io socket

    Pump.socket = null;

    Pump.setupSocket = function() {

        var here = window.location,
            sock;

        if (Pump.socket) {
            Pump.socket.close();
            Pump.socket = null;
        }

        sock = new SockJS(here.protocol + "//" + here.host + "/main/realtime/sockjs");

        sock.onopen = function() {
            Pump.socket = sock;
            Pump.followStreams();

            // Reset reconnect
            if (_socket.retryTimer) {
                clearTimeout(_socket.retryTimer);
                _socket.retryTimer = null;
            }
            _socket.reconnecting = false;
            _socket.firstConnection = true;
            _socket.retryAttempts = 0;
        };

        sock.onmessage = function(e) {
            var data = JSON.parse(e.data);

            switch (data.cmd) {
            case "update":
                Pump.updateStream(data.url, data.activity);
                break;
            case "challenge":
                Pump.riseToChallenge(data.url, data.method);
                break;
            }
        };

        sock.onclose = function(error) {
            Pump.socket = null;
            // Reconnect on broken connections, not for normal close
            if (error.code !== 1000) {
                sock.reconnect(error);
            }
        };

        sock.reconnect = function(error) {
            _socket.retryAttempts++;

            if (_socket.retryTimer) {
                clearTimeout(_socket.retryTimer);
                _socket.retryTimer = null;
            }

            // Let's make sure it's an error browser support or a connection problem
            if (error.code === 2000 && _socket.retryAttempts > 10) {
                // No more attempts if all transports failed
                if (!_socket.error) {
                    // Show alert only one time
                    _socket.error = error;
                    Pump.error(_socket.firstConnection ? "You seem to be offline! Realtime is disabled." :
                               "Sorry! Your browser doesn't support realtime.");
                    Pump.debug(error);
                }
                return;
            }

            if (_socket.reconnecting) {
                _socket.retryTimer = setTimeout(Pump.setupSocket, _socket.retryTimeout);
            } else {
                // The first time try to reconnect immediately
                _socket.reconnecting = true;
                Pump.setupSocket();
            }
        };
    };

    Pump.followStreams = function() {

        if (!Pump.config.sockjs) {
            return;
        }

        if (!Pump.socket) {
            return;
        }

        var streams = Pump.getStreams();

        _.each(streams, function(stream, name) {
            Pump.socket.send(JSON.stringify({cmd: "follow", url: stream.url()}));
        });
    };

    Pump.unfollowStreams = function() {

        if (!Pump.config.sockjs) {
            return;
        }

        if (!Pump.socket) {
            return;
        }

        var streams = Pump.getStreams();

        _.each(streams, function(stream, name) {
            Pump.socket.send(JSON.stringify({cmd: "unfollow", url: stream.url()}));
        });
    };

})(window._, window.$, window.Backbone, window.Pump);
