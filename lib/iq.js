var ltx = require('ltx');
var _   = require('underscore');

/**
 *
 * @param id
 * @constructor
 */
function IQ(id) {

  this.id = id || String(Math.floor(Math.random()*1000000));

  this.iq = new ltx.Element('iq')
    .attr('type', 'get')
    .attr('id', this.id);

  this.oa = this.iq
    .c('oa')
    .attr('xmlns', 'connect.logitech.com');
}

IQ.PAIR = 'PAIR';

/**
 *
 * @param {string} from
 * @returns {IQ}
 */
IQ.prototype.from = function (from) {
  this.iq.attr('from', from);
  return this;
};

/**
 *
 * @param {Object} body
 * @returns {IQ}
 */
IQ.prototype.body = function (body) {
  this.oa.t(IQ.encodeBody(body));
  return this;
};

/**
 *
 * @param {string} command
 * @returns {IQ}
 */
IQ.prototype.command = function (command) {
  if (command === IQ.PAIR) {
    this.oa.attr('mime', 'vnd.logitech.connect/vnd.logitech.pair');
  } else {
    this.oa.attr('mime', 'vnd.logitech.harmony/vnd.logitech.harmony.engine?' + command);
  }

  return this;
};

/**
 *
 * @returns {*}
 */
IQ.prototype.root = function () {
  return this.iq.root();
};

/**
 *
 * @param {object} obj
 * @returns {string}
 */
IQ.encodeBody = function (obj) {

  var data = [];
  var value, sValue;
  for (var key in obj) {
    value = obj[key];

    if (_.isObject(value)) {
      sValue = [];
      for (var sKey in value) {
        sValue.push(sKey + '="' + value[sKey] + '"');
      }
      value = '{' + sValue.join(', ') + '}';
    }
    data.push(key + '=' + value);
  }

  return data.join(':');
};

/**
 *
 * @param {string} str
 * @returns {object}
 */
IQ.decodeBody = function (str) {
  var data = {};
  str.split(':').forEach(function (part) {
    var key = part.substring(0, part.indexOf('='));
    var value = part.substring(part.indexOf('=') + 1);

    var matches = value.match(/^\{(.*)}$/);
    if (matches) {
      value = {};
      matches[1].split(', ').forEach(function (part) {
        value[ part.substring(0, part.indexOf('=')) ] = part.substring(part.indexOf('=') + 1).replace(/^"/, '').replace(/"$/, '');
      });
    }

    data[key] = value;
  });

  return data;
};

/**
 *
 * @param {ltx.Element} stanza
 * @returns {object}
 */
IQ.parseStanza = function (stanza) {
  var body = stanza.getChildText('oa');
  if (body.match(/^\{.*}$/))
    return JSON.parse(body);

  return IQ.decodeBody(body);
};

module.exports = IQ;