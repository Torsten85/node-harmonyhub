"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Cache = function () {
  function Cache() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$ttl = _ref.ttl,
        ttl = _ref$ttl === undefined ? 1000 * 60 * 60 : _ref$ttl;

    (0, _classCallCheck3.default)(this, Cache);

    this.data = {};
    this.ttl = ttl;
    this.timeouts = {};
  }

  (0, _createClass3.default)(Cache, [{
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