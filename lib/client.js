'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _events = require('events');

var _harmonyhubjsDiscover = require('harmonyhubjs-discover');

var _harmonyhubjsDiscover2 = _interopRequireDefault(_harmonyhubjsDiscover);

var _nodeXmppClient = require('node-xmpp-client');

var _nodeXmppClient2 = _interopRequireDefault(_nodeXmppClient);

var _lodash = require('lodash');

var _activity = require('./activity');

var _activity2 = _interopRequireDefault(_activity);

var _device = require('./device');

var _device2 = _interopRequireDefault(_device);

var _cache = require('./cache');

var _cache2 = _interopRequireDefault(_cache);

var _iq = require('./iq');

var _iq2 = _interopRequireDefault(_iq);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var RETRY_COUNT = 1;
var RETRY_TIMEOUT = 5000;

var Client = function (_EventEmitter) {
  (0, _inherits3.default)(Client, _EventEmitter);

  function Client() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        ip = _ref.ip,
        _ref$port = _ref.port,
        port = _ref$port === undefined ? 5222 : _ref$port,
        _ref$discoverTimeout = _ref.discoverTimeout,
        discoverTimeout = _ref$discoverTimeout === undefined ? 5000 : _ref$discoverTimeout;

    (0, _classCallCheck3.default)(this, Client);

    var _this = (0, _possibleConstructorReturn3.default)(this, (Client.__proto__ || (0, _getPrototypeOf2.default)(Client)).call(this));

    _this.ip = ip;
    _this.port = port;
    _this.discoverTimeout = discoverTimeout;
    _this.xmpp = null;

    _this.responseQueue = {};
    _this.cache = new _cache2.default();
    return _this;
  }

  (0, _createClass3.default)(Client, [{
    key: 'discover',
    value: function discover() {
      var _this2 = this;

      if (this.ip) {
        return _promise2.default.resolve();
      }

      var discover = new _harmonyhubjsDiscover2.default(61991);

      return new _promise2.default(function (resolve, reject) {

        var timer = setTimeout(function () {
          discover.stop();
          reject('No hub found within ' + _this2.discoverTimeout + 'ms');
        }, _this2.discoverTimeout);

        discover.on('online', function (_ref2) {
          var ip = _ref2.ip;

          clearTimeout(timer);
          discover.stop();
          _this2.ip = ip;
          resolve();
        });

        discover.start();
      });
    }
  }, {
    key: 'getIdentity',
    value: function getIdentity() {
      var _this3 = this;

      if (this.cache.has('identity')) {
        return this.cache.get('identity');
      }

      var iq = new _iq2.default().from('guest').command(_iq2.default.PAIR).body({
        method: 'pair',
        name: 'harmonyjs#iOS6.0.1#iPhone'
      });

      var client = new _nodeXmppClient2.default({
        jid: 'guest@x.com/gatorade',
        password: 'guest',
        host: this.ip,
        port: this.port,
        disallowTLS: true
      });

      client.on('online', function () {
        client.send(iq.iq);
      });

      return new _promise2.default(function (resolve, reject) {

        client.on('error', function (error) {
          console.log('first client error', error);
          reject(error);
        });

        client.on('stanza', function (stanza) {
          if (stanza.attr('id') === iq.id) {
            var body = _iq2.default.parseStanza(stanza);
            client.end();
            if (body.identity) {
              _this3.cache.put('identity', body.identity);
              resolve(body.identity);
            } else {
              reject('Did not receive identity');
            }
          }
        });
      });
    }
  }, {
    key: 'login',
    value: function () {
      var _ref3 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(identity) {
        var _this4 = this;

        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                this.xmpp = new _nodeXmppClient2.default({
                  jid: identity + '@connect.logitech.com/gatorade',
                  password: identity,
                  host: this.ip,
                  port: this.port,
                  disallowTLS: true
                });

                this.xmpp.once('disconnect', function () {
                  _this4.emit('disconnect');
                  _this4.xmpp.end();
                  _this4.xmpp = null;
                });

                this.xmpp.on('stanza', this.onStanza.bind(this));

                this.xmpp.on('error', function (error) {
                  console.log('got error', error);
                  /*
                  if (error.message === 'XML parse error') {
                    console.log(`Received error: ${error.message}`);
                     // Response queue holds all not resolved transmissions
                    for(const id of Object.keys(this.responseQueue)) {
                      this.retry(id);
                    }
                     if (this.retriesLeft < 0) {
                      throw error;
                    }
                  } else {
                    throw error;
                  }
                  */
                });

                return _context.abrupt('return', new _promise2.default(function (resolve) {
                  _this4.xmpp.once('online', function () {
                    resolve();
                  });
                }));

              case 5:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function login(_x2) {
        return _ref3.apply(this, arguments);
      }

      return login;
    }()
  }, {
    key: 'retry',
    value: function retry(id) {
      var transmission = this.responseQueue[id];
      transmission.attempt += 1;

      if (transmission.attempt > RETRY_COUNT) {
        throw new Error('Retry limit of transmission ' + id + ' reached');
      }

      console.log('resending transmission ' + id);
      this.xmpp.send(transmission.iq);
    }
  }, {
    key: 'connect',
    value: function () {
      var _ref4 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2() {
        var identity;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (!this.xmpp) {
                  _context2.next = 2;
                  break;
                }

                return _context2.abrupt('return');

              case 2:
                _context2.next = 4;
                return this.discover();

              case 4:
                _context2.next = 6;
                return this.getIdentity();

              case 6:
                identity = _context2.sent;
                _context2.next = 9;
                return this.login(identity);

              case 9:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function connect() {
        return _ref4.apply(this, arguments);
      }

      return connect;
    }()
  }, {
    key: 'disconnect',
    value: function disconnect() {
      this.xmpp && this.xmpp.end();
    }
  }, {
    key: 'onStanza',
    value: function () {
      var _ref5 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4(stanza) {
        var _this5 = this;

        var event, _ret, id;

        return _regenerator2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                event = stanza.getChild('event');

                if (!(event && event.attr('type') === 'harmony.engine?startActivityFinished')) {
                  _context4.next = 6;
                  break;
                }

                return _context4.delegateYield(_regenerator2.default.mark(function _callee3() {
                  var body, id, activities, activity;
                  return _regenerator2.default.wrap(function _callee3$(_context3) {
                    while (1) {
                      switch (_context3.prev = _context3.next) {
                        case 0:
                          body = _iq2.default.decodeBody(event.getText());
                          id = 'activity_' + body.activityId;

                          if (_this5.responseQueue[id]) {
                            _this5.responseQueue[id].resolve(body);
                            delete _this5.responseQueue[id];
                          }

                          _context3.next = 5;
                          return _this5.getActivities();

                        case 5:
                          activities = _context3.sent;
                          activity = (0, _lodash.find)(activities, function (activity) {
                            return activity.id === body.activityId;
                          });


                          if (activity) {
                            console.log('received event for ', activity.label);
                            _this5.emit('activity', activity);
                          }

                          return _context3.abrupt('return', {
                            v: void 0
                          });

                        case 9:
                        case 'end':
                          return _context3.stop();
                      }
                    }
                  }, _callee3, _this5);
                })(), 't0', 3);

              case 3:
                _ret = _context4.t0;

                if (!((typeof _ret === 'undefined' ? 'undefined' : (0, _typeof3.default)(_ret)) === "object")) {
                  _context4.next = 6;
                  break;
                }

                return _context4.abrupt('return', _ret.v);

              case 6:
                id = stanza.attr('id');

                if (this.responseQueue[id]) {
                  this.responseQueue[id].resolve(_iq2.default.parseStanza(stanza));
                  delete this.responseQueue[id];
                }

              case 8:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function onStanza(_x3) {
        return _ref5.apply(this, arguments);
      }

      return onStanza;
    }()
  }, {
    key: 'send',
    value: function () {
      var _ref6 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee5(command, body) {
        var _this6 = this;

        var _ref7 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
            _ref7$resolve = _ref7.resolve,
            resolve = _ref7$resolve === undefined ? false : _ref7$resolve;

        var iq, promise;
        return _regenerator2.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _context5.next = 2;
                return this.connect();

              case 2:
                iq = new _iq2.default().command(command);


                if (body) {
                  iq.body(body);
                }

                promise = new _promise2.default(function (resolver) {
                  if (resolve) {
                    var id = command === 'startactivity' ? 'activity_' + body.activityId : iq.id;
                    _this6.responseQueue[id] = { iq: iq, resolve: resolver, attempt: 0 };
                  } else {
                    resolver();
                  }
                  _this6.xmpp.send(iq);
                });
                return _context5.abrupt('return', promise);

              case 6:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function send(_x4, _x5) {
        return _ref6.apply(this, arguments);
      }

      return send;
    }()
  }, {
    key: 'powerOff',
    value: function () {
      var _ref8 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee6() {
        return _regenerator2.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                _context6.next = 2;
                return this.send('startactivity', {
                  activityId: -1,
                  timestamp: Date.now()
                });

              case 2:
                return _context6.abrupt('return', _context6.sent);

              case 3:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function powerOff() {
        return _ref8.apply(this, arguments);
      }

      return powerOff;
    }()
  }, {
    key: 'getConfig',
    value: function () {
      var _ref9 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee7() {
        var body;
        return _regenerator2.default.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                if (!this.cache.has('config')) {
                  _context7.next = 2;
                  break;
                }

                return _context7.abrupt('return', this.cache.get('config'));

              case 2:
                _context7.next = 4;
                return this.send('config', null, { resolve: true });

              case 4:
                body = _context7.sent;

                this.cache.put('config', body);
                return _context7.abrupt('return', body);

              case 7:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function getConfig() {
        return _ref9.apply(this, arguments);
      }

      return getConfig;
    }()
  }, {
    key: 'getDevices',
    value: function () {
      var _ref10 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee8() {
        var _this7 = this;

        var config, devices;
        return _regenerator2.default.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                if (!this.cache.has('devices')) {
                  _context8.next = 2;
                  break;
                }

                return _context8.abrupt('return', this.cache.get('devices'));

              case 2:
                _context8.next = 4;
                return this.getConfig();

              case 4:
                config = _context8.sent;
                devices = [];

                config.device.forEach(function (device) {
                  devices.push(new _device2.default(_this7, device));
                });

                this.cache.put('devices', devices);
                return _context8.abrupt('return', devices);

              case 9:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function getDevices() {
        return _ref10.apply(this, arguments);
      }

      return getDevices;
    }()
  }, {
    key: 'getDevice',
    value: function () {
      var _ref11 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee9(idOrLabel) {
        var devices;
        return _regenerator2.default.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                _context9.next = 2;
                return this.getDevices();

              case 2:
                devices = _context9.sent;

                if (!(typeof idOrLabel === 'number')) {
                  _context9.next = 5;
                  break;
                }

                return _context9.abrupt('return', (0, _lodash.find)(devices, function (device) {
                  return device.id === idOrLabel;
                }));

              case 5:
                return _context9.abrupt('return', (0, _lodash.find)(devices, function (device) {
                  return device.label === idOrLabel;
                }));

              case 6:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function getDevice(_x7) {
        return _ref11.apply(this, arguments);
      }

      return getDevice;
    }()
  }, {
    key: 'getActivities',
    value: function () {
      var _ref12 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee10() {
        var _this8 = this;

        var config, activities;
        return _regenerator2.default.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                if (!this.cache.has('activities')) {
                  _context10.next = 2;
                  break;
                }

                return _context10.abrupt('return', this.cache.get('activities'));

              case 2:
                _context10.next = 4;
                return this.getConfig();

              case 4:
                config = _context10.sent;
                activities = [];

                config.activity.forEach(function (activity) {
                  activities.push(new _activity2.default(_this8, activity));
                });

                this.cache.put('activities', activities);
                return _context10.abrupt('return', activities);

              case 9:
              case 'end':
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function getActivities() {
        return _ref12.apply(this, arguments);
      }

      return getActivities;
    }()
  }, {
    key: 'getActivity',
    value: function () {
      var _ref13 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee11(idOrLabel) {
        var activities;
        return _regenerator2.default.wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                _context11.next = 2;
                return this.getActivities();

              case 2:
                activities = _context11.sent;

                if (!(typeof idOrLabel === 'number')) {
                  _context11.next = 5;
                  break;
                }

                return _context11.abrupt('return', (0, _lodash.find)(activities, function (activity) {
                  return activity.id === idOrLabel;
                }));

              case 5:
                return _context11.abrupt('return', (0, _lodash.find)(activities, function (activity) {
                  return activity.label === idOrLabel;
                }));

              case 6:
              case 'end':
                return _context11.stop();
            }
          }
        }, _callee11, this);
      }));

      function getActivity(_x8) {
        return _ref13.apply(this, arguments);
      }

      return getActivity;
    }()
  }, {
    key: 'getActiveActivity',
    value: function () {
      var _ref14 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee12() {
        var body, id;
        return _regenerator2.default.wrap(function _callee12$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                _context12.next = 2;
                return this.send('getCurrentActivity', null, { resolve: true });

              case 2:
                body = _context12.sent;
                id = parseInt(body.result);

                if (!(id === -1)) {
                  _context12.next = 6;
                  break;
                }

                return _context12.abrupt('return', null);

              case 6:
                _context12.next = 8;
                return this.getActivity(id);

              case 8:
                return _context12.abrupt('return', _context12.sent);

              case 9:
              case 'end':
                return _context12.stop();
            }
          }
        }, _callee12, this);
      }));

      function getActiveActivity() {
        return _ref14.apply(this, arguments);
      }

      return getActiveActivity;
    }()
  }]);
  return Client;
}(_events.EventEmitter);

exports.default = Client;