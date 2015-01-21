var _ = require('underscore');

var PRESS_INTERVAL = 50;

function Device(client, config) {
  this._client = client;

  this.id = config.id;
  this.label = config.label;

  var commands = this._commands = {};
  _.each(config.controlGroup, function (controlGroup) {
    _.each(controlGroup.function, function (command) {
      commands[command.label] = command.action.replace(/:/g, '::');
    });
  });

  /**
   * Public list of all commands
   */
  this.commands = _.keys(commands);
}

/**
 *
 * @param {String} command
 * @param {Number} [duration] delay between press and release
 */
Device.prototype.send = function (command, duration) {
  duration = duration || 0;

  if (this.commands.indexOf(command) === -1)
    throw new Error('The device "' + this.label + '" has no command named "' + command + '".');

  this._client._send('holdAction', {
    action: this._commands[command],
    status: 'press'
  });

  if (duration > PRESS_INTERVAL) {
    var times = Math.floor((duration - PRESS_INTERVAL) / PRESS_INTERVAL);
    var interval = setInterval(function () {
      if (--times === 0)
        clearInterval(interval);

      this._client._send('holdAction', {
        action: this._commands[command],
        status: 'press'
      });

    }.bind(this), PRESS_INTERVAL);
  }

  setTimeout(function () {
    this._client._send('holdAction', {
      action: this._commands[command],
      status: 'release'
    });

  }.bind(this), duration);
};

module.exports = Device;