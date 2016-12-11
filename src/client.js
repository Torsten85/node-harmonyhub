import { EventEmitter } from 'events';
import HarmonyHubDiscover from 'harmonyhubjs-discover';
import XmppClient from 'node-xmpp-client';
import { find } from 'lodash';

import Activity from './activity';
import Device from './device';
import Cache from './cache';
import IQ from './iq';

const RETRY_COUNT = 1;
const RETRY_TIMEOUT = 5000;

export default class Client extends EventEmitter {

  constructor({ ip, port = 5222, discoverTimeout = 5000 } = {}) {
    super();
    this.ip = ip;
    this.port = port;
    this.discoverTimeout = discoverTimeout;
    this.xmpp = null;

    this.responseQueue = {};
    this.cache = new Cache();
  }

  discover() {
    if (this.ip) {
      return Promise.resolve();
    }

    const discover = new HarmonyHubDiscover(61991);

    return new Promise((resolve, reject) => {

      const timer = setTimeout(() => {
        discover.stop();
        reject(`No hub found within ${this.discoverTimeout}ms`);
      }, this.discoverTimeout);

      discover.on('online', ({ ip }) => {
        clearTimeout(timer);
        discover.stop();
        this.ip = ip;
        resolve();
      });

      discover.start();
    });
  }

  getIdentity() {
    if (this.cache.has('identity')) {
      return this.cache.get('identity');
    }

    const iq = new IQ()
      .from('guest')
      .command(IQ.PAIR)
      .body({
        method: 'pair',
        name: 'harmonyjs#iOS6.0.1#iPhone'
      });

    const client = new XmppClient({
      jid: 'guest@x.com/gatorade',
      password: 'guest',
      host: this.ip,
      port: this.port,
      disallowTLS: true
    });

    client.on('online', () => {
      client.send(iq.iq);
    });

    return new Promise((resolve, reject) => {

      client.on('error', (error) => {
        console.log('first client error', error);
        reject(error);
      });

      client.on('stanza', (stanza) => {
        if (stanza.attr('id') === iq.id) {
          const body = IQ.parseStanza(stanza);
          client.end();
          if (body.identity) {
            this.cache.put('identity', body.identity);
            resolve(body.identity);
          } else {
            reject('Did not receive identity');
          }
        }
      });
    });
  }

  async login(identity) {
    this.xmpp = new XmppClient({
      jid: `${identity}@connect.logitech.com/gatorade`,
      password: identity,
      host: this.ip,
      port: this.port,
      disallowTLS: true
    });

    this.xmpp.once('disconnect', () => {
      this.emit('disconnect');
      this.xmpp.end();
      this.xmpp = null;
    });

    this.xmpp.on('stanza', this.onStanza.bind(this));

    this.xmpp.on('error', (error) => {
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

    return new Promise((resolve) => {
      this.xmpp.once('online', () => {
        resolve();
      });
    });
  }

  retry(id) {
    const transmission = this.responseQueue[id];
    transmission.attempt += 1;

    if (transmission.attempt > RETRY_COUNT) {
      throw new Error(`Retry limit of transmission ${id} reached`);
    }

    console.log(`resending transmission ${id}`);
    this.xmpp.send(transmission.iq);
  }

  async connect() {
    if (this.xmpp) {
      return;
    }
    await this.discover();
    const identity = await this.getIdentity();
    await this.login(identity);
  }

  disconnect() {
    this.xmpp && this.xmpp.end();
  }

  async onStanza(stanza) {

    const event = stanza.getChild('event');
    if (event && event.attr('type') === 'harmony.engine?startActivityFinished') {
      const body = IQ.decodeBody(event.getText());

      const id = `activity_${body.activityId}`;
      if (this.responseQueue[id]) {
        this.responseQueue[id].resolve(body);
        delete this.responseQueue[id];
      }

      const activities = await this.getActivities();
      const activity = find(activities, activity => activity.id === body.activityId);

      if (activity) {
        console.log('received event for ', activity.label);
        this.emit('activity', activity);
      }

      return;
    }

    const id = stanza.attr('id');
    if (this.responseQueue[id]) {
      this.responseQueue[id].resolve(IQ.parseStanza(stanza));
      delete this.responseQueue[id];
    }
  }

  async send(command, body, { resolve = false } = {}) {
    await this.connect();

    const iq = new IQ().command(command);

    if (body) {
      iq.body(body);
    }

    const promise = new Promise((resolver) => {
      if (resolve) {
        const id = command === 'startactivity' ? `activity_${body.activityId}` : iq.id;
        this.responseQueue[id] = { iq, resolve: resolver, attempt: 0 };
      } else {
        resolver();
      }
      this.xmpp.send(iq);
    });

    return promise;
  }

  async powerOff() {
    return await this.send('startactivity', {
      activityId: -1,
      timestamp: Date.now()
    });
  }

  async getConfig() {

    if (this.cache.has('config')) {
      return this.cache.get('config');
    }

    const body = await this.send('config', null, { resolve: true });
    this.cache.put('config', body);
    return body;
  }

  async getDevices() {
    if (this.cache.has('devices')) {
      return this.cache.get('devices');
    }

    const config = await this.getConfig();
    const devices = [];
    config.device.forEach(device => {
      devices.push(new Device(this, device));
    });

    this.cache.put('devices', devices);
    return devices;
  }

  async getDevice(idOrLabel) {
    const devices = await this.getDevices();
    if (typeof idOrLabel === 'number') {
      return find(devices, device => device.id === idOrLabel);
    }

    return find(devices, device => device.label === idOrLabel);
  }

  async getActivities() {
    if (this.cache.has('activities')) {
      return this.cache.get('activities');
    }

    const config = await this.getConfig();
    const activities = [];
    config.activity.forEach(activity => {
      activities.push(new Activity(this, activity));
    });

    this.cache.put('activities', activities);
    return activities;
  }

  async getActivity(idOrLabel) {
    const activities = await this.getActivities();
    if (typeof idOrLabel === 'number') {
      return find(activities, activity => activity.id === idOrLabel);
    }

    return find(activities, activity => activity.label === idOrLabel);
  }

  async getActiveActivity() {
    const body = await this.send('getCurrentActivity', null, { resolve: true });
    const id = parseInt(body.result);

    if (id === -1) {
      return null;
    }

    return await this.getActivity(id);
  }
}
