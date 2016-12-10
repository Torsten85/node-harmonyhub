'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var PRESS_INTERVAL = 50;

var Device = function () {
  function Device(client, _ref) {
    var _this = this;

    var id = _ref.id,
        label = _ref.label,
        controlGroup = _ref.controlGroup;
    (0, _classCallCheck3.default)(this, Device);

    this.client = client;

    this.id = id;
    this.label = label;

    this.functions = {};
    controlGroup.forEach(function (group) {
      group.function.forEach(function (command) {
        _this.functions[command.label] = command.action.replace(/:/g, '::');
      });
    });

    this.commands = (0, _keys2.default)(this.functions);
  }

  (0, _createClass3.default)(Device, [{
    key: 'send',
    value: function send(commandName) {
      var _this2 = this;

      var duration = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;


      if (!this.functions[commandName]) {
        throw new Error('The device "' + this.label + ' has no command named "' + commandName + '".');
      }

      var action = this.functions[commandName];

      this.client.send('holdAction', {
        action: action,
        status: 'press'
      });

      if (duration > PRESS_INTERVAL) {
        (function () {
          var times = Math.floor((duration - PRESS_INTERVAL) / PRESS_INTERVAL);
          var interval = setInterval(function () {
            times -= 1;
            if (times === 0) {
              clearInterval(interval);
            }

            _this2.client.send('holdAction', {
              action: action,
              status: 'press'
            });
          }, PRESS_INTERVAL);
        })();
      }

      setTimeout(function () {
        _this2.client.send('holdAction', {
          action: action,
          status: 'release'
        });
      }, duration);
    }
  }]);
  return Device;
}();

exports.default = Device;