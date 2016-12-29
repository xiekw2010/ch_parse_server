'use strict'

const qiniu = require("qiniu")
const request = require('request')


/**
 *
 * @param config
 * access_key: required,
 * secret_key: required,
 * bucket: The qiniu bucket, eg: 'wechatlook'
 * bucketPfx: The save file path pfx, eg: 'ps-server-qiniu/'
 * cdnPath: if have config the cdn path, eg: 'http://img.bonwechat.com/'
 *
 * @constructor
 */
function QiniuAdapter(config) {
  qiniu.conf.ACCESS_KEY = config.access_key
  qiniu.conf.SECRET_KEY = config.secret_key
  this._bucket = config.bucket
  this._bucketPrefix = config.bucketPfx
  this._cdnPath = config.cdnPath
}

QiniuAdapter.prototype._filename = function (filename) {
  return this._bucketPrefix + filename
}

QiniuAdapter.prototype.createFile = function(filename, data) {
  return new Promise((resolve, reject) => {
    const aFilename = this._filename(filename)
    const token = (new qiniu.rs.PutPolicy(this._bucket + ":" + aFilename)).token()
    qiniu.io.put(token, aFilename, data, null, (err, ret) => {
      if (!err) {
        // 上传成功， 处理返回值
        resolve(this._cdnPath + ret.key)
      } else {
        // 上传失败， 处理返回代码
        reject(err)
      }
    })
  })
}

QiniuAdapter.prototype.deleteFile = function(filename) {
  return new Promise((resolve, reject) => {
    resolve()
  })
}

QiniuAdapter.prototype.getFileData = function(filename) {
  return new Promise((resolve, reject) => {
    request({
      encoding: null,
      url
    }, (err, response, body) => {
      if (err) reject(err)
      resolve(body)
    })
  })
}

QiniuAdapter.prototype.getFileLocation = function(config, filename) {
  return this._cdnPath + this._filename(filename)
}

module.exports = QiniuAdapter;
module.exports.default = QiniuAdapter;