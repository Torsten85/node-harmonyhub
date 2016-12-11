export default class Activity {

  constructor(client, { id, label }) {
    this.client = client;

    this.id = parseInt(id);
    this.label = label;
  }

  async start() {
    return await this.client.send('startactivity', {
      activityId: this.id,
      timestamp: Date.now()
    });
  }

  async stop() {
    return await this.client.send('startactivity', {
      activityId: -1,
      timestamp: Date.now()
    });
  }

  async isActive() {
    const body = await this.client.send('getCurrentActivity', null, { resolve: true });
    return parseInt(body.result) === this.id;
  }
}
