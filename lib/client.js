var EventEmitter       = require('events').EventEmitter;
var util               = require('util');
var _                  = require('underscore');
var IQ                 = require('./iq');
var Device             = require('./device');
var Activity           = require('./activity');
var XmppClient         = require('node-xmpp-client');
var debug              = require('debug')('client');
var HarmonyHubDiscover = require('harmonyhubjs-discover');

function Client(ip ,port) {
  EventEmitter.call(this);

  this.ip = ip;
  this.port = port || 5222;

  this._responseQueue = {};

  this.xmpp = null;
  this._cache = {};

  this._state = 'disconnected';

  this.getPowerState(function (state) {
    this.powered = state;
  }.bind(this));

  this.on('power', function (state) {
    this.powered = state;
  })
}

util.inherits(Client, EventEmitter);

/**
 * Connects to Hub to receive identify
 */
Client.prototype.connect = function (reconnect) {
  if (!(this._state === 'disconnected' || this._state === 'discovered')) {
    return;
  }

  if (!this.ip) {
    this._state = 'discovering';
    const discover = new HarmonyHubDiscover(61991);

    discover.on('online', (hub) => {
      discover.stop();
      this.ip = hub.ip;
      this._state = 'discovered';
      this.connect(reconnect);
    });

    discover.start();
    return;
  }

  this._state = 'connecting';

  var iq = new IQ()
    .from('guest')
    .command(IQ.PAIR)
    .body({
      method: 'pair',
      name: 'harmonyjs#iOS6.0.1#iPhone'
    });

  var client = new XmppClient({
    jid: 'guest@x.com/gatorade',
    password: 'guest',
    host: this.ip,
    port: this.port,
    disallowTLS: true
  });

  client.on('online', function () {
    debug('XMPP client connected');
    this.send(iq.iq);
  });

  client.on('stanza', function (stanza) {
    debug('received XMPP stanza: ' + stanza);

    if (stanza.attr('id') === iq.id) {
      var body = IQ.parseStanza(stanza);
      client.end();
      if (body.identity) {
        this._login(body.identity, reconnect);
      } else {
        throw new Error('Did not receive identity');
      }
    }

  }.bind(this));

};

/**
 *
 * @private
 */
Client.prototype._login = function (identity, reconnect) {

  this.xmpp = new XmppClient({
    jid: identity + '@connect.logitech.com/gatorade',
    password: identity,
    host: this.ip,
    port: this.port,
    disallowTLS: true
  });

  this.xmpp.once('disconnect', function () {
    this.xmpp = null;
    this._state = 'disconnected';
    this.emit('disconnect');
  }.bind(this));

  this.xmpp.on('stanza', this._onStanza.bind(this));

  this.xmpp.once('online', function() {
    this._state = 'connected';
    this.emit(reconnect ? 'reconnect' : 'connect');
  }.bind(this));

};

/**
 *
 * @param stanza
 * @private
 */
Client.prototype._onStanza = function (stanza) {

  var id;
  var event = stanza.getChild('event');

  if(event && event.attr('type') === 'harmony.engine?startActivityFinished') {
    var body = IQ.decodeBody(event.getText());

    id = 'activity_' + body.activityId;
    if (this._responseQueue[id]) {
      this._responseQueue[id](body);
      delete this._responseQueue[id];
    }

    console.log('Got Event:', stanza.toString());

    if (body.activityId == -1) {
      this.emit('power', false);
    } else {
      if (!this.powered)
        this.emit('power', true);

      this.getActivities(function (activities) {
        _.each(activities, function (activity) {
          activity.active = activity.id == body.activityId;

          if (activity.active) {
            this.emit('activity', activity);
          }
        }.bind(this));
      }.bind(this));
    }

    return;
  }

  id = stanza.attr('id');
  if (this._responseQueue[id]) {
    this._responseQueue[id](IQ.parseStanza(stanza));
    delete this._responseQueue[id];
  }
};

/**
 *
 * @param {string} command
 * @param {object} [body]
 * @param {Function} [callback]
 * @private
 */
Client.prototype._send = function (command, body, callback) {

  switch(this._state) {
    case 'disconnected':
      // wait for reconnect and try again, also issue connect
      this.once('reconnect', function() {
        this._send(command, body, callback);
      }.bind(this));
      this.connect(true);
      return;

    case 'connecting':
    case 'discovering':
      // wait for reconnect and try again
      this.once('reconnect', function() {
        this._send(command, body, callback);
      }.bind(this));
      return;
  }

  if (_.isFunction(body)) {
    callback = body;
    body = null;
  }

  var iq = new IQ()
    .command(command);

  if (body)
    iq.body(body);

  if (callback) {
    if (command === 'startactivity')
      this._responseQueue['activity_' + body.activityId] = callback;
    else
      this._responseQueue[iq.id] = callback;
  }

  this.xmpp.send(iq);
};

/**
 *
 * @param {Function} cb
 */
Client.prototype.getDevices = function (cb) {
  if (this._cache.devices) {
    cb(this._cache.devices);
  } else {
    this._getConfig(function (config) {
      this._cache.devices = [];

      _.each(config.device, function (device) {
        this._cache.devices.push(new Device(this, device));
      }.bind(this));

      cb(this._cache.devices);

    }.bind(this));
  }
};

/**
 *
 * @param {Number|String} idOrLabel
 * @param {Function} cb
 */
Client.prototype.getDevice = function(idOrLabel, cb) {

  this.getDevices(function (devices) {

    if (_.isNumber(idOrLabel)) {
      cb(_.find(devices, function (device) {
        return device.id == idOrLabel;
      }));
    } else {
      cb(_.find(devices, function (device) {
        return device.label == idOrLabel;
      }));
    }

  });
};

/**
 *
 * @param {Function} cb
 */
Client.prototype.getActivities = function (cb) {
  if (this._cache.activities) {
    cb(this._cache.activities);
  } else {
    this._getConfig(function (config) {
      this._cache.activities = [];

      this._send('getCurrentActivity', function (b) {

        _.each(config.activity, function (activity) {
          activity.active = activity.id == b.result;
          if (activity.id != -1)
            this._cache.activities.push(new Activity(this, activity));
        }.bind(this));

        cb(this._cache.activities);

      }.bind(this));

    }.bind(this));
  }
};


/**
 *
 * @param {Number|String} idOrLabel
 * @param {Function} cb
 */
Client.prototype.getActivity = function(idOrLabel, cb) {

  this.getActivities(function (activities) {

    if (_.isNumber(idOrLabel)) {
      cb(_.find(activities, function (activity) {
        return activity.id == idOrLabel;
      }));
    } else {
      cb(_.find(activities, function (activity) {
        return activity.label == idOrLabel;
      }));
    }

  });
};

/**
 *
 * @param {Number|String} idOrLabel
 * @param {Function} [cb]
 */
Client.prototype.startActivity = function (idOrLabel, cb) {
  this.getActivity(idOrLabel, function (activity) {
    if (!activity)
      throw new Error('There is no activity with id or label ' + idOrLabel);

    activity.start(cb);
  });
};

/**
 *
 * @param {Function} cb
 */
Client.prototype.getCurrentActivity = function (cb) {

  this._send('getCurrentActivity', function (body) {
    if (body.result === -1) {
      cb(null);
    } else {
      this.getActivity(parseInt(body.result), cb);
    }
  }.bind(this));

};

/**
 *
 * @param {Function} cb
 */
Client.prototype.getPowerState = function (cb) {
  this.getCurrentActivity(function (activity) {
    cb(!!activity);
  });
};

/**
 *
 * @param {Function} cb
 * @private
 */
Client.prototype._getConfig = function (cb) {
  if (this._cache.config)
    cb(this._cache.config);
  else
    this._send('config', function (body) {
      this._cache.config = body;
      cb(this._cache.config);
    }.bind(this));
};

/**
 *
 * @param {Function} [cb]
 */
Client.prototype.powerDown = function (cb) {
  this._send('startactivity', {
    activityId: -1,
    timestamp: Date.now()
  }, cb);
};

/**
 * disconnects
 */
Client.prototype.disconnect = function () {
  if (!this.xmpp)
    throw new Error('Client is not connected');

  this._state = 'disconnected';
  this.xmpp.end();
  this.xmpp = null;
};

module.exports = Client;
