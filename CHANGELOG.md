# pump.io changelog

pump.io follows [Semantic Versioning 2.0.0][semver]. Specifically, the following things are considered to be semver-major if changed in a backwards-incompatible way:

* Ability to merge trivial local template modifications
* Configuration value names, semantics, and format
* The plugin API
* The public HTTP API and federation protocol
* `pump.socket(7)` protocol semantics
* `pump.socket(7)` commands and their semantics, except where explicitly documented otherwise in `pump.socket(7)`
* Supported Node.js versions
* This list of items

Changes to everything else are not considered breaking, although we may delay things until semver-major releases as a precautionary measure. This includes a bunch of stuff but in particular:

* Log messages
* Out-of-the-box web UI functionality
* Difficulty of merging in local modifications

If you think something that isn't in the first list should be covered, file an issue and we'll either state we consider that semver-major or give a rationale as to why it isn't. Please also feel free to ask questions in the issue tracker; this list could surely be more precise.

## 6.0.0 beta 0 - future

You cannot upgrade to this release with a zero-downtime restart.

### Added

* Support Node 9
* The master process now listens on a control socket controllable by `pumpctl(8)`; see `pump.socket(7)` for protocol documentation (#1643)
* Ship an `npm-shrinkwrap.json` file with the package, ensuring that everyone gets the same version of all dependencies
* Public endpoints will now content-negotiate ActivityStreams 2.0
* OAuth 2.0 can be used for authentication and is now preferred
* The systemd unit now links to online ReadTheDocs documentation
* Web UI realtime now automatically recovers if it disconnects (#1479)
* Web UI comments can now be canceled (#1471)
* The front page image can now be changed with the `mainImage` config option (#1486)
* Improved startup performance and security by loading less code in the master process running as root (#1555)

### Changed

* Don't link to OpenFarmGame in the intro text since the domain is dead
* `pump(1)` has been renamed to `pump(8)`
* Dependency updates
* Internal test suite refactoring
* "Settings" is renamed to "Profile" in the web UI (#1680)
* Docker images automatically set `NODE_ENV=production`

### Fixed

* The systemd unit now works on Debian Stretch
* Work around `upstreamDuplicates is an object, not an array` error on remote login with some profiles
* bin/pump now crashes immediately on configuration problems instead of infinitely spawning workers (#1642)
* Fix layout error in the Lists view left over from 1.0's utml -> Jade transition
* Long lines no longer overflow in the web UI (#1157)
* Display the proper alert/error message in the web UI (#1352) 
* Fix crash when directly visiting `/uploads/` (#1397)
* Fix non-public images always returning 403 Forbidden (#1438)
* Fix multiple web UI Like buttons turning to Unlike when just one is clicked (#768)
* `pump(8)` documents `NODE_ENV`, which actually does something, as opposed to `NODE_ENVIRONMENT`, which does absolutely nothing
* Other miscellaneous bugfixes (#1535, #1520,  #1465))
* Don't load or serve JavaScript, or show the "Login"/"Register" buttons, with `noweb` set to true (#1398)

### Breaking 

* Drop support for Node.js 4, 5, and 7 (#1502)
* Extract the CLI client tools to pump.io-cli and drop from this package (#381)
* Reorganize Jade files to reduce npm package size (affects custom templates) (#1457)
* Upgrade from jade@1 to pug@2 (affects custom templates) (#1580)
* Crash instead of logging a warning when admins set internal parameters (#1396)
* Crash instead of logging a warning when admins do not set `config.secret`, or set it to a well-known value (#1387)
* Make the CLI options parsing more aware of boolean flags and string flags (#1334)
* Remove the SIGUSR2 handler for zero-downtime restarts; use `pumpctl(8)` with `pump.socket(7)` instead (#1643)

## 5.1.3 - 2019-10-15

### Security

* Increase minimum DOMPurify version to 2.0.6 due to recent upstream security advisories

## 5.0.3 - 2019-10-15

### Security

* Increase minimum DOMPurify version to 2.0.6 due to recent upstream security advisories

## 5.1.2 - 2018-09-14

### Security

* Bump Dockerfile base image to Alpine 3.8.1 to fix an [`apk` remote code execution vulnerability](https://justi.cz/security/2018/09/13/alpine-apk-rce.html)

## 5.1.1 - 2018-05-05

This will be the last release line to support Node.js 4, 5 and 7.

### Improved

* Backport Docker image infrastructure

### Fixed

* Backport fix for non-public images always returning 403 Forbidden (#1438)

## 5.1.0 - 2018-01-05

This will be the last release line to support Node.js 4, 5 and 7.

### Changed

* Bump `gm` version out of caution to pull in a fully security-patched `debug`

## 5.1.0 beta 0 - 2017-12-08

This will be the last release line to support Node.js 4, 5 and 7.

### Improved

* Generate startup log warnings on bad configurations, including insecure `secret` values and internal parameters
* Add a `Dockerfile`
* Added [zero-downtime upgrade support][]

### Changed

* Update deps
* Enable some more tests and start tracking code coverage with Coveralls
* Expand package.json metadata
* Clarify semver-major local modification policy
* Move most documentation to ReadTheDocs (#1496)

### Fixed

* `bin/pump-import-collection` no longer crashes due to an `underscore-contrib` reference
* Fix the logged-out mobile homepage's menu icon being black (#1445)
* Fix the JavaScript license page not loading Bootstrap properly (#1432)
* Fix some README config options
* SockJS connections no longer fail due to authorization problems (#1475)

## 4.0.3 - 2017-10-01

### Fixed

* Fix the package shipping with `.jade.js` files built from the 5.0.x releases

## 5.0.2 - 2017-10-01

### Fixed

* `connect-auth-pumpio` is pulled from npm instead of GitHub again

## 5.0.1 - 2017-10-01

No changes from 5.0.1 beta 0:

### Security

* Fix multiple denial-of-service security vulnerabilities in indirect dependencies: [advisory 1](https://nodesecurity.io/advisories/534), [advisory 2](https://nodesecurity.io/advisories/526), [advisory 3](https://nodesecurity.io/advisories/535) (no CVEs available)

## 4.1.3 - 2017-10-01

### Security

* Fix multiple denial-of-service security vulnerabilities in indirect dependencies: [advisory 1](https://nodesecurity.io/advisories/534), [advisory 2](https://nodesecurity.io/advisories/526), [advisory 3](https://nodesecurity.io/advisories/535) (no CVEs available)

## 4.0.2 - 2017-10-01

### Security

* Fix multiple denial-of-service security vulnerabilities in indirect dependencies: [advisory 1](https://nodesecurity.io/advisories/534), [advisory 2](https://nodesecurity.io/advisories/526), [advisory 3](https://nodesecurity.io/advisories/535) (no CVEs available)

## 5.0.1 beta 0 - 2017-09-29

This release was a private beta due to the security fixes being slightly risky for stability.

The relevant security bugs were publicly disclosed on October 1st, 2017.

### Security

* Fix multiple denial-of-service security vulnerabilities in indirect dependencies: [advisory 1](https://nodesecurity.io/advisories/534), [advisory 2](https://nodesecurity.io/advisories/526), [advisory 3](https://nodesecurity.io/advisories/535) (no CVEs available)

## 5.0.0 - 2017-09-01

No changes since 5.0.0 beta 1.

## 5.0.0 beta 1 - 2017-08-26

### Fixed

* Original posts no longer show "shared by" (#1427)
* Fixed some minor inaccuracies in README.md's documentation of defaults

### Changed

* Upgrade to dompurify@1.0.1

## 5.0.0 beta 0 - 2017-08-07

### Improved

* Node 7 and 8 are now supported
* Documented the `bounce` and `logLevel` config options
* The web UI more clearly shows shares
* Worker process deaths are sent to the `error` log stream, not the `warning` stream

### Changed

* Removed 0.10/0.12-specific hacks
* Internal refactoring to use newer ES6 features

### Fixed

* Fixed crash in an endpoint which prevented "login with remote account" from working (#1281)

### Breaking

* Dropped support for Node.js 0.10 and 0.12 (#1234)
* Added a period and space after the footer text; if you use `appendFooter` please adjust accordingly (#1349)
* Switched from Glyphicons to Font Awesome (affects web UI template modifications) (#1351)
* Upgraded Backbone to 1.3.3 (ditto) (#1382)
* Switched from Underscore to Lodash (ditto) (#1326)
* Enabled many systemd security restrictions in the systemd service file (#1346, #1257)

## 4.1.2 - 2017-07-14

### Improved

* Backported some improved error messages to assist in debugging a bug

## 4.1.1 - 2017-07-14

### Fixed

* Backported fix for crash in an endpoint which prevented "login with remote account" from working (#1281)

## 4.1.0 - 2017-07-01

No changes from 4.1.0 beta 0. This will be the last release to support Node.js 0.10 and 0.12.

## 4.1.0 beta 0 - 2017-06-15

This will be the last release to support Node.js 0.10 and 0.12.

### Improved

* Added some basic styles to the LibreJS info page (#1353)
* Minor UX improvements to the web UI (#1355, #1354)
* Expanded the list of disallowed nicknames and warn about them in the web UI (#1345, #1347)
* Pull our fork of connect-auth from npm instead of GitHub (#1360)
* Use [Subresource Integrity][] for web UI resources pulled from CDNs (#1340)
* Internal test refactoring

### Changed

* Switched bcrypt implementation from `bcrypt` to `bcryptjs` (#1233)

### Fixed

* Return the correct Content-Type for OAuth endpoints (#822)

## 4.0.1 - 2017-05-23

### Security

* Increase minimum DOMPurify version to 0.9.0: [0.8.9 security announcement](https://lists.ruhr-uni-bochum.de/pipermail/dompurify-security/2017-May/000006.html), [0.9.0 security announcement](https://lists.ruhr-uni-bochum.de/pipermail/dompurify-security/2017-May/000007.html)

## 3.0.3 - 2017-05-23

### Security

* Increase minimum DOMPurify version to 0.9.0: [0.8.9 security announcement](https://lists.ruhr-uni-bochum.de/pipermail/dompurify-security/2017-May/000006.html), [0.9.0 security announcement](https://lists.ruhr-uni-bochum.de/pipermail/dompurify-security/2017-May/000007.html)

## 2.1.2 - 2017-05-23

### Security

* Increase minimum DOMPurify version to 0.9.0: [0.8.9 security announcement](https://lists.ruhr-uni-bochum.de/pipermail/dompurify-security/2017-May/000006.html), [0.9.0 security announcement](https://lists.ruhr-uni-bochum.de/pipermail/dompurify-security/2017-May/000007.html)

## 4.0.0 - 2017-05-02

No changes from 4.0.0 beta 5.

## 4.0.0 beta 5 - 2017-04-14

### Fixed

* Revert bcrypt upgrade to fix install issues (#1333)
* Don't use newer `github:` syntax in `connect-auth` dep as it breaks npm@1 (#1253)
* The commandline tools no longer crash due to missing `optimist`

### Improved

* Update documentation to match new config options
* Lock `connect-auth` dep to a particular version
* Turn on tests for Node 6

## 4.0.0 beta 4 - 2017-04-03

### Fixed

* Fix a whitespace issue with `appendFooter`

## 4.0.0 beta 3 - 2017-04-03

### Changed

* Permanently remove the build-on-git-install hacks (#1291)

## 4.0.0 beta 2 - 2017-04-03

### Fixed

* Correct a potentially bad npm publish

## 4.0.0 beta 1 - 2017-04-03

### Improved

* Added the `appendFooter` config option

## 4.0.0 beta 0 - 2017-04-03

### Improved

* Frontend JavaScript runs in strict mode (#1221)
* Frontend Javascript passes JSHint (#1176)
* Remove direct Connect dependency (#1274)
* Upgrade many minor dependencies
* Add a robots.txt file (#1286)
* Don't suggest or offer avatar uploads if uploads aren't available
* Added the ability to specify configuration via environment variables
* Added the ability to specify configuration via CLI flags
* Added `--help` and `--version` CLI flags
* Embed IndieWeb metadata in the web UI

### Breaking

* Upgrade to Express 4.x (affects plugins)
* Switch to Yargs for config and CLI option parsing (should be identical but please double-check that your config is respected in case of subtle edge cases)

## 3.0.2 - 2017-03-10

### Fixed

* Fix README.md documenting the old name of a config parameter
* Fix the sample `pump.io.json` including an obsolete parameter

## 3.0.1 - 2017-03-10

### Fixed

* Removed build logic from public npm package because it was completely breaking installs (#1291)

## 3.0.0 - 2017-03-05

No changes from 3.0.0 beta 1.

## 3.0.0 beta 1 - 2017-02-15

### Improved

* Improve performance of front-page image

### Fixed

* Fix the web UI repeating YouTube videos (again)
* Fix direct visits to /following URLs not rendering layout (#1279)

## 3.0.0 beta 0 - 2017-02-01

### Improved

* HTTP Strict Transport Security can now be configured (#1197)
* The sample systemd service can now be directly be used by specifying a Databank driver as an @-service parameter

### Changed

* The web UI no longer loads a JSON polyfill

### Fixed

* Incorrect and unnecessary 'plugin-types' Content Security Policy directives are no longer sent

### Breaking

* The `uploaddir` option is obsolete and should be migrated to the new `datadir` option (#1272)

## 2.1.1 - 2017-01-18

### Fixed

* Realtime functionality is working again
* Incorrect and unnecessary 'plugin-types' Content Security Policy directives are no longer sent

## 2.1.0 - 2017-01-04

No changes from 2.1.0 beta 0.

## 2.1.0 beta 0 - 2016-12-11

### Fixed

* Files in bin/ are now properly validated by JSHint and JSCS

### Improved

* Enable strict mode for server-side JS (#1221)
* Provide a more useful error message for invalid config JSON
* A sample systemd service is now included

## 2.0.5 - 2016-12-11

### Fixed

* Fix web UI YouTube embeds appearing in all subsequent posts (#1249)

## 2.0.4 - 2016-11-13

### Fixed

* Fix To: and CC: fields not showing in the web UI
* Remove a stray debugger statement in the web UI JS

## 2.0.3 - 2016-11-13

### Fixed

* Certain template resource 404s in the web UI are now fixed

## 2.0.2 - 2016-11-13

### Fixed

* Jade client-side files are now included in registry packages
* The Server: header now reports the correct pump.io version

## 2.0.1 - 2016-11-10

### Fixed

* Updated some documentation version numbers

## 2.0.0 - 2016-11-10

No changes from 2.0.0 beta 2.

## 2.0.0 beta 2 - 2016-11-07

### Changed

* Fixed the web UI mangling some special characters when showing displayName properties

## 2.0.0 beta 1 - 2016-11-02

### Added

* A pump(1) manpage is now included
* Any internal web UI link with a `data-bypass` attribute is now ignored by the routing logic (useful for e.g. custom pages added by the admin)
* YouTube links in posts are now shown as  embeds by the web UI (#1158)

### Changed

* Node.js 0.10 and 0.12 support is now deprecated (#1212)
* TLS connections now use Mozilla's "intermediate" cipher suite and forces server cipher suite preferences (#1061)
* Adjusted the XSS error page wording based on user feedback

### Breaking

* Upgrade to Express 3.x (affects plugins)
* Templates are now based on Jade instead of utml (affects people who change the templates) (#1167)

## 1.0.0 - 2016-08-26

This release adds many security features. It's recommended that admins upgrade as soon as possible.

Please note that while we're not doing so _yet_, we're planning to deprecate running under Node.js 0.10 and 0.12 very soon. Additionally, upgrading to Node.js 4.x early will enable the new, better XSS scrubber - _however_, be aware that pump.io is far less tested under Node.js 4.x and you are likely to run into more bugs than you would under 0.10 or 0.12.

See #1184 for details.

### Added

* [API] Send the `Content-Length` header in Dialback requests
* Add support for [LibreJS][librejs] (#1058)
* Node.js 4.x is officially supported (#1184)
* Browser MIME type sniffing is disabled via `X-Content-Type-Options: nosniff` ([#1184][security-headers])
* Protect some versions of Internet Explorer from a confused deputy attack via `X-Download-Options: noopen` ([#1184][security-headers])
* Make sure Internet Explorer's built-in XSS protection is as secure as possible with `X-XSS-Protection: 1; mode=block` ([#1184][security-headers])
* Versions of Internet Explorer the XSS scrubber can't protect are presented with a security error instead of any content (#1184)
* Clickjacking is prevented via `X-Frame-Options: DENY` header (in addition to Content Security Policy) ([#1184][security-headers])
* A `Content-Security-Policy` header is sent with every response (#1184)
  * Scripts are forbidden from everywhere except the application domain and (if CDNs are enabled) `cdnjs.cloudflare.com` and `ajax.googleapis.com`
  * Styles are forbidden from everywhere except the application domain and inline styles
  * `<object>`, `<embed>`, and `<applet>`, as well as all plugins, are forbidden
  * Embedding the web UI via `<frame>`, `<iframe>`, `<object>`, `<embed>`, and `<applet>` is forbidden
  * Connecting to anything other than the application domain via `XMLHttpRequest`, WebSockets or `EventSource` is forbidden
  * Loading Web Workers or nested browsing contexts (i.e. `<frame>`, `<iframe>`) is forbidden except from the application domain
  * Fonts are forbidden from everywhere except the application domain
  * Form submission is limited to the application domain

### Changed

* [API] Don't return `displayName` properties if they're empty (#1149)
* Upgraded from Connect 1.x to Connect 2.x
* Upgraded various minor dependencies
* All files pass style checking and most pass JSHint
* Add links to the user guide on the homepage and welcome message (#1125)
* Add a new XSS scrubber implementation (#1184)
  * DOMPurify-based scrubber is used on Node.js 4.x or better
  * Otherwise, a more intrusive, less precise one is used

### Fixed

* Fix a crash upon access of an activity without any replies (#1135)
* Disable registration link if registration is disabled (#853)
* `package.json` now uses a valid SPDX license identifier (#1112)

## 0.3.0 - 2014-06-21

TODO

## 0.2.4 - 2013-07-24

TODO

## 0.2.3 - 2013-04-08

TODO

## 0.2.2 - 2013-04-03

TODO

## 0.2.1 - 2013-03-15

TODO

## 0.2.0 - 2013-02-28

TODO

## 0.1.1 - 2012-10-05

TODO

## 0.1.0 - 2012-10-03

### Added

* Initial release

 [semver]: https://semver.org/spec/v2.0.0.html
 [librejs]: https://www.gnu.org/software/librejs/
 [security-headers]: https://github.com/pump-io/pump.io/issues/1184#issuecomment-242264403
 [Subresource Integrity]: https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity
 [zero-downtime upgrade support]: http://pump.io/blog/2017/08/zero-downtime-restarts-have-landed
