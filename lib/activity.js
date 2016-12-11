'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Activity = function () {
  function Activity(client, _ref) {
    var id = _ref.id,
        label = _ref.label;
    (0, _classCallCheck3.default)(this, Activity);

    this.client = client;

    this.id = parseInt(id);
    this.label = label;
  }

  (0, _createClass3.default)(Activity, [{
    key: 'start',
    value: function () {
      var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.client.send('startactivity', {
                  activityId: this.id,
                  timestamp: Date.now()
                });

              case 2:
                return _context.abrupt('return', _context.sent);

              case 3:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function start() {
        return _ref2.apply(this, arguments);
      }

      return start;
    }()
  }, {
    key: 'stop',
    value: function () {
      var _ref3 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2() {
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this.client.send('startactivity', {
                  activityId: -1,
                  timestamp: Date.now()
                });

              case 2:
                return _context2.abrupt('return', _context2.sent);

              case 3:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function stop() {
        return _ref3.apply(this, arguments);
      }

      return stop;
    }()
  }, {
    key: 'isActive',
    value: function () {
      var _ref4 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3() {
        var body;
        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return this.client.send('getCurrentActivity', null, { resolve: true });

              case 2:
                body = _context3.sent;
                return _context3.abrupt('return', parseInt(body.result) === this.id);

              case 4:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function isActive() {
        return _ref4.apply(this, arguments);
      }

      return isActive;
    }()
  }]);
  return Activity;
}();

exports.default = Activity;