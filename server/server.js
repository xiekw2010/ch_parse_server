"use strict"

const path = require('path')
const express = require('express')
const Parse = require('parse/node')
const { ParseServer } = require('parse-server')
const ParseDashboard = require('parse-dashboard')
const cluster = require('cluster')
const os = require('os')
const https = require('https')
const { readFileSync } = require('fs')
const QiniuFile = require('./adapters/QiniuFileAdapter')
const PushAdapter = require('./adapters/PushAdapter')
const resolve = path.resolve

const IS_DEVELOPMENT = process.env.NODE_ENV !== 'production'

// DB
const DB_HOST = process.env.MONGODB_PORT_27017_TCP_ADDR || 'localhost'
const DB_PORT = process.env.MONGODB_PORT_27117_TCP_PORT || '27117'
const DATABASE_URI = `mongodb://${DB_HOST}:${DB_PORT}/YOUR_DATA_BASE_NAME`

// Server
const SERVER_PORT = process.env.PORT || 7070
const SERVER_SCHEME = IS_DEVELOPMENT ? 'http' : 'https'
const SERVER_HOST = IS_DEVELOPMENT ? 'localhost' : 'bonwechat.com'
const APP_ID = process.env.APP_ID || ''
const MASTER_KEY = process.env.MASTER_KEY || ''
const HTTPS_PFX = ''
const HTTPS_PASSPHRASE = ''

// Push
// iOS
const PUSH_IOS_BUNDLE_ID = ''
const PUSH_IOS_CERT_DEV = ''
const PUSH_IOS_CERT_PROD = ''
// android, plz use JPush https://www.jiguang.cn/app/list#dev
const PUSH_ANDROID_API_KEY = ''
const PUSH_ANDROID_MASTER_KEY = ''

// File
// plz use Qiniu file
const QINIU_ACCESS_KEY = ''
const QINIU_MASTER_KEY = ''
const QINIU_BUCKET = ''
const QINIU_BUCKET_PFX = ''
const QINIU_CDN_PATH = ''

// Cloud
const CLOUD_PATH = ''

// Dashboard
const DASHBOARD_AUTH = process.env.DASHBOARD_AUTH

module.exports = function startServer() {
  _validDatabase()

  _validServer()

  Parse.initialize(APP_ID)
  Parse.serverURL = `${SERVER_SCHEME}://${SERVER_HOST}:${SERVER_PORT}/parse`
  Parse.masterKey = MASTER_KEY
  Parse.Cloud.useMasterKey()

  const server = express()
  const parseServer = new ParseServer({
    databaseURI: DATABASE_URI,
    cloud: _cloud(),
    appId: APP_ID,
    masterKey: MASTER_KEY,
    serverURL: `${SERVER_SCHEME}://${SERVER_HOST}:${SERVER_PORT}/parse`,
    push: _pushAdapter(),
    filesAdapter: _fileAdapter()
  })

  let users
  if (DASHBOARD_AUTH) {
    var [user, pass] = DASHBOARD_AUTH.split(':')
    users = [{ user, pass }]
    console.log(users)
  }
  const dashboard = new ParseDashboard({
    apps: [{
      serverURL: '/parse',
      appId: APP_ID,
      masterKey: MASTER_KEY,
      appName: APP_ID + '_app_name',
      production: !IS_DEVELOPMENT
    }],
    users,
  }, IS_DEVELOPMENT)


  server.use('/parse', parseServer)
  server.use('/dashboard', dashboard)
  server.use('/', (req, res) => res.redirect('/dashboard'))

  console.log('IS_DEVELOPMENT', IS_DEVELOPMENT)
  const listenLogInfo = `[${process.pid}] Server is now running in ${process.env.NODE_ENV || 'development'} mode on ${SERVER_SCHEME}://${SERVER_HOST}:${SERVER_PORT}`

  if (IS_DEVELOPMENT) {
    server.listen(SERVER_PORT, (err, res) => console.log(listenLogInfo))
  } else {
    const numCPUs = IS_DEVELOPMENT ? 1 : os.cpus().length

    let options
    if (HTTPS_PFX.length && HTTPS_PASSPHRASE.length) {
      options = {
        pfx: readFileSync(resolve(__dirname, HTTPS_PFX)),
        passphrase: readFileSync(resolve(__dirname, HTTPS_PASSPHRASE), 'utf8'),
      }
    }
    const httpsServer = https.createServer(options, server)

    if (cluster.isMaster) {
      for (var i = 0; i < numCPUs; i++) {
        cluster.fork()
      }
      cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died... Restarting`)
        cluster.fork()
      });
    } else {
      httpsServer.listen(SERVER_PORT, (err, res) => console.log(listenLogInfo))
    }
  }
}

function _pushAdapter() {
  const iOSCert = IS_DEVELOPMENT ? PUSH_IOS_CERT_DEV : PUSH_IOS_CERT_PROD
  let iOS
  if (PUSH_IOS_BUNDLE_ID.length && iOSCert.length) {
    iOS = {
      ios: {
        pfx: resolve(__dirname, iOSCert),
        bundleId: PUSH_IOS_BUNDLE_ID,
        production: !IS_DEVELOPMENT
      },
    }
  }

  let android
  if (PUSH_ANDROID_API_KEY.length && PUSH_ANDROID_MASTER_KEY.length) {
    android = {
      android: {
        apiKey: PUSH_ANDROID_API_KEY,
        masterKey: PUSH_ANDROID_MASTER_KEY
      }
    }
  }

  return Object.assign({}, iOS, android)
}

function _fileAdapter() {
  if (QINIU_ACCESS_KEY.length
    && QINIU_MASTER_KEY.length
    && QINIU_BUCKET.length
    && QINIU_BUCKET_PFX.length
    && QINIU_CDN_PATH.length) {
    return new QiniuFile({
      access_key: QINIU_ACCESS_KEY,
      secret_key: QINIU_MASTER_KEY,
      bucket: QINIU_BUCKET,
      bucketPfx: QINIU_BUCKET_PFX,
      cdnPath: QINIU_CDN_PATH
    })
  }

  return null
}

function _cloud() {
  if (CLOUD_PATH.length) {
    return resolve(__dirname, 'cloud.js')
  }

  return null
}

function _validDatabase() {
  if (DATABASE_URI === `mongodb://${DB_HOST}:${DB_PORT}/YOUR_DATA_BASE_NAME`) {
    throw new Error('Please change the DATABASE_URI of "YOUR_DATA_BASE_NAME" !')
  }
}

function _validServer() {
  if (!APP_ID.length || !MASTER_KEY.length) {
    throw new Error('Please change the APP_ID & MASTER_KEY!')
  }
}
