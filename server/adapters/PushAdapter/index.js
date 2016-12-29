'use strict'

const Parse = require('parse')
const log = require('npmlog')
const { APNS, } = require('parse-server-push-adapter')
const JPush = require('./JPush')

const LOG_PREFIX = 'ch-parse-server-push-adapter'

function ParsePushAdapter(pushConfig = {}) {
  this.validPushTypes = ['ios', 'android', 'fcm'];
  this.senderMap = {};
  // used in PushController for Dashboard Features
  this.feature = {
    immediatePush: true
  };
  let pushTypes = Object.keys(pushConfig);

  for (let pushType of pushTypes) {
    if (this.validPushTypes.indexOf(pushType) < 0) {
      throw new Parse.Error(Parse.Error.PUSH_MISCONFIGURED,
        'Push to ' + pushTypes + ' is not supported');
    }
    switch (pushType) {
      case 'ios':
        this.senderMap[pushType] = new APNS(pushConfig[pushType]);
        break;
      case 'android':
      case 'fcm':
        this.senderMap[pushType] = new JPush(pushConfig[pushType]);
        break;
    }
  }
}

ParsePushAdapter.prototype.getValidPushTypes = function () {
  return this.validPushTypes;
}

ParsePushAdapter.prototype.send = function (data, installations) {
  let deviceMap = classifyInstallations(installations, this.validPushTypes);
  let sendPromises = [];
  for (let pushType in deviceMap) {
    let sender = this.senderMap[pushType];
    let devices = deviceMap[pushType];
    if (Array.isArray(devices) && devices.length > 0) {
      if (!sender) {
        log.verbose(LOG_PREFIX, `Can not find sender for push type ${pushType}, ${data}`)
        let results = devices.map((device) => {
          return Promise.resolve({
            device,
            transmitted: false,
            response: { 'error': `Can not find sender for push type ${pushType}, ${data}` }
          })
        });
        sendPromises.push(Promise.all(results));
      } else {
        sendPromises.push(sender.send(data, devices));
      }
    }
  }
  return Promise.all(sendPromises).then((promises) => {
    // flatten all
    return [].concat.apply([], promises);
  })
}

function classifyInstallations(installations, validPushTypes) {
  // Init deviceTokenMap, create a empty array for each valid pushType
  let deviceMap = {};
  for (let validPushType of validPushTypes) {
    deviceMap[validPushType] = [];
  }
  for (let installation of installations) {
    let devices = deviceMap[installation.pushType] || deviceMap[installation.deviceType] || null;
    if (Array.isArray(devices)) {
      devices.push({
        deviceToken: installation.deviceToken || 'sometoken',
        deviceType: installation.deviceType,
        appIdentifier: installation.appIdentifier
      });
    }
  }
  return deviceMap;
}

module.exports = ParsePushAdapter;
exports.default = ParsePushAdapter
