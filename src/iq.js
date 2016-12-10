import { Element } from 'ltx';
import { isObject } from 'lodash';

export default class IQ {

  static PAIR = 'PAIR'

  constructor(id) {
    this.id = id || String( Math.floor( Math.random() * 1000000));

    this.iq = new Element('iq')
      .attr('type', 'get')
      .attr('id', this.id);

    this.oa = this.iq
      .c('oa')
      .attr('xmlns', 'connect.logitech.com');
  }

  from(from) {
    this.iq.attr('from', from);
    return this;
  }

  body(body) {
    this.oa.t(IQ.encodeBody(body));
    return this;
  }

  command(command) {
    if (command === IQ.PAIR) {
      this.oa.attr('mime', 'vnd.logitech.connect/vnd.logitech.pair');
    } else {
      this.oa.attr('mime', `vnd.logitech.harmony/vnd.logitech.harmony.engine?${command}`);
    }

    return this;
  }

  root() {
    return this.iq.root();
  }

  static encodeBody(obj) {
    const data = [];
    for (const key in obj) {
      let value = obj[key];

      if (isObject(value)) {
        const subValue = [];
        for (const subKey in value) {
          subValue.push(`${subKey}="${value[subKey]}"`);
        }
        value = `{${subValue.join(', ')}}`;
      }

      data.push(`${key}=${value}`);
    }

    return data.join(':');
  }

  static decodeBody(str) {
    const data = {};
    str.split(':').forEach(part => {
      const key = part.substring(0, part.indexOf('='));
      let value = part.substring(part.indexOf('=') + 1);

      const matches = value.match(/^\{(.*)}$/);
      if (matches) {
        value = {};
        matches[1].split(', ').forEach(subPart => {
          value[ subPart.substring(0, subPart.indexOf('=')) ] = subPart.substring(subPart.indexOf('=') + 1).replace(/^"/, '').replace(/"$/, '');
        });
      }

      data[key] = value;
    });

    return data;
  }

  static parseStanza(stanza) {
    const body = stanza.getChildText('oa');
    if (body.match(/^\{(.*)$/)) {
      return JSON.parse(body);
    }

    return IQ.decodeBody(body);
  }
}
