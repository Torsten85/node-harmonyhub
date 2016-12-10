"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Cache = function () {
  function Cache() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$ttl = _ref.ttl,
        ttl = _ref$ttl === undefined ? 1000 * 60 * 60 : _ref$ttl;

    _classCallCheck(this, Cache);

    this.data = {};
    this.ttl = ttl;
    this.timeouts = {};
  }

  _createClass(Cache, [{
    key: "put",
    value: function put(key, value) {
      var _this = this;

      clearTimeout(this.timeouts[key]);
      this.data[key] = value;
      this.timeouts[key] = setTimeout(function () {
        return _this.del(key);
      }, this.ttl);
    }
  }, {
    key: "get",
    value: function get(key) {
      return this.data[key];
    }
  }, {
    key: "has",
    value: function has(key) {
      return !!this.data[key];
    }
  }, {
    key: "del",
    value: function del(key) {
      clearTimeout(this.timeouts[key]);
      delete this.data[key];
      delete this.timeouts[key];
    }
  }]);

  return Cache;
}();

exports.default = Cache;