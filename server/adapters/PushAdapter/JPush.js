const jPush = require('jpush-sdk')

function JPush(args) {
  if (typeof args !== 'object' || !args.apiKey || !args.masterKey) {
    throw new Error('JPush Configuration is invalid')
  }
  this.sender = jPush.buildClient(args.apiKey, args.masterKey)
}

/**
 * Send JPush request.
 * @param {Object} data The data we need to send, the format is the same with api request body
 * @param {Array} devices A array of devices
 * @returns {Object} A promise which is resolved after we get results from JPush
 */
JPush.prototype.send = function (data, devices) {
  const self = this

  // TODO: map the devices to JPush's audience
  return new Promise((resolve, reject) => {
    self.sender.push()
      .setAudience(jPush.ALL)
      .setPlatform('android')
      .setNotification(generateJPushPayload(data))
      .send(function (err, res) {
        if (err) {
          reject(err)
        } else {
          console.log('Sendno: ' + res.sendno)
          console.log('Msg_id: ' + res.msg_id)
          resolve(res)
        }
      })
  })
}

/**
 * Generate the JPush payload from the data we get from api request.
 * @returns {Object} A promise which is resolved after we get results from JPush
 */
function generateJPushPayload(requestData) {
  const data = requestData.data
  const alert = data['alert'] || 'JPush alert'

  return jPush.android(alert)
}

module.exports = JPush