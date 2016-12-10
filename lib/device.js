'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PRESS_INTERVAL = 50;

var Device = function () {
  function Device(client, _ref) {
    var _this = this;

    var id = _ref.id,
        label = _ref.label,
        controlGroup = _ref.controlGroup;

    _classCallCheck(this, Device);

    this.client = client;

    this.id = id;
    this.label = label;

    this.functions = {};
    controlGroup.forEach(function (group) {
      group.function.forEach(function (command) {
        _this.functions[command.label] = command.action.replace(/:/g, '::');
      });
    });

    this.commands = Object.keys(this.functions);
  }

  _createClass(Device, [{
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