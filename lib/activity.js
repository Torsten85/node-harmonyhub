function Activity(client, config) {
  this._client = client;

  this.id = config.id;
  this.label = config.label;
  this.active = config.active;
  this._config = config;
}

Activity.prototype.start = function (cb) {
  this._client._send('startactivity', {
    activityId: this.id,
    timestamp: Date.now()
  }, cb);
};

module.exports = Activity;
