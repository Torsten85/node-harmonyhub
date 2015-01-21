var Client = require('../index').Client;

var client = new Client('192.168.2.7');

client.getDevice('Westinghouse Fan', function (device) {
  device.send('Power Toggle');
});

/*
 client.powerDown(function () {
 console.log('powered down');
 });
 */

