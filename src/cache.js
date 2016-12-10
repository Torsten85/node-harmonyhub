export default class Cache {

  constructor({ ttl = 1000 * 60 * 60 } = {}) {
    this.data = {};
    this.ttl = ttl;
    this.timeouts = {};
  }

  put(key, value) {
    clearTimeout(this.timeouts[key]);
    this.data[key] = value;
    this.timeouts[key] = setTimeout(() => this.del(key), this.ttl);
  }

  get(key) {
    return this.data[key];
  }

  has(key) {
    return !!this.data[key];
  }

  del(key) {
    clearTimeout(this.timeouts[key]);
    delete this.data[key];
    delete this.timeouts[key];
  }
}
