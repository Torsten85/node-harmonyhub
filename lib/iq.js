'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _ltx = require('ltx');

var _lodash = require('lodash');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var IQ = function () {
  function IQ(id) {
    (0, _classCallCheck3.default)(this, IQ);

    this.id = id || String(Math.floor(Math.random() * 1000000));

    this.iq = new _ltx.Element('iq').attr('type', 'get').attr('id', this.id);

    this.oa = this.iq.c('oa').attr('xmlns', 'connect.logitech.com');
  }

  (0, _createClass3.default)(IQ, [{
    key: 'from',
    value: function from(_from) {
      this.iq.attr('from', _from);
      return this;
    }
  }, {
    key: 'body',
    value: function body(_body) {
      this.oa.t(IQ.encodeBody(_body));
      return this;
    }
  }, {
    key: 'command',
    value: function command(_command) {
      if (_command === IQ.PAIR) {
        this.oa.attr('mime', 'vnd.logitech.connect/vnd.logitech.pair');
      } else {
        this.oa.attr('mime', 'vnd.logitech.harmony/vnd.logitech.harmony.engine?' + _command);
      }

      return this;
    }
  }, {
    key: 'root',
    value: function root() {
      return this.iq.root();
    }
  }], [{
    key: 'encodeBody',
    value: function encodeBody(obj) {
      var data = [];
      for (var key in obj) {
        var value = obj[key];

        if ((0, _lodash.isObject)(value)) {
          var subValue = [];
          for (var subKey in value) {
            subValue.push(subKey + '="' + value[subKey] + '"');
          }
          value = '{' + subValue.join(', ') + '}';
        }

        data.push(key + '=' + value);
      }

      return data.join(':');
    }
  }, {
    key: 'decodeBody',
    value: function decodeBody(str) {
      var data = {};
      str.split(':').forEach(function (part) {
        var key = part.substring(0, part.indexOf('='));
        var value = part.substring(part.indexOf('=') + 1);

        var matches = value.match(/^\{(.*)}$/);
        if (matches) {
          value = {};
          matches[1].split(', ').forEach(function (subPart) {
            value[subPart.substring(0, subPart.indexOf('='))] = subPart.substring(subPart.indexOf('=') + 1).replace(/^"/, '').replace(/"$/, '');
          });
        }

        data[key] = value;
      });

      return data;
    }
  }, {
    key: 'parseStanza',
    value: function parseStanza(stanza) {
      var body = stanza.getChildText('oa');
      if (body.match(/^\{(.*)$/)) {
        return JSON.parse(body);
      }

      return IQ.decodeBody(body);
    }
  }]);
  return IQ;
}();

IQ.PAIR = 'PAIR';
exports.default = IQ;