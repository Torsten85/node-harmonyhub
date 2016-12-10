var PRESS_INTERVAL = 50;

export default class Device {

  constructor(client, { id, label, controlGroup }) {
    this.client = client;

    this.id = id;
    this.label = label;

    this.functions = {};
    controlGroup.forEach(group => {
      group.function.forEach(command => {
        this.functions[command.label] = command.action.replace(/:/g,  '::');
      });
    });

    this.commands = Object.keys(this.functions);
  }

  send(commandName, duration = 0) {

    if (!this.functions[commandName]) {
      throw new Error(`The device "${this.label} has no command named "${commandName}".`);
    }

    const action = this.functions[commandName];

    this.client.send('holdAction', {
      action,
      status: 'press'
    });

    if (duration > PRESS_INTERVAL) {
      let times = Math.floor((duration - PRESS_INTERVAL) / PRESS_INTERVAL);
      const interval = setInterval(() => {
        times -= 1;
        if (times === 0) {
          clearInterval(interval);
        }

        this.client.send('holdAction', {
          action,
          status: 'press'
        });
      }, PRESS_INTERVAL);
    }

    setTimeout(() => {
      this.client.send('holdAction', {
        action,
        status: 'release'
      });
    }, duration);
  }
}
