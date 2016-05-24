var $ = require('jquery')

var Port = require('port')
var Inject = require('inject')
var Connect = require('connect')
var Listener = require('listener')

function Agent() {
  this.port = new Port({
    actions: [
      {
        command: 'fairyInject',
        action: function (port) {
          var tabId = parseInt(port.name.split('#').slice(1, 2).pop())
          var file = './main/injections/scripts/fairy.js'

          chrome.tabs.executeScript(tabId, {
            file: file,
            allFrames: false,
            matchAboutBlank: true
          }, function () {
            console.log('[Injected command]---', file.slice(1))
          })
        }
      },
      {
        command: 'getSid',
        action: function (port) {
          var port = port
          var imageBase = 'http://jiyou.11185.cn/l/captcha.html?wid=3be16628-c630-437b-b443-c4d9f18602ed'

          $.ajax({
            type: "GET",
            url: "http://jiyou.11185.cn/l/getid.html",
            success: function (html) {
              var sid = html.match(/sid\:\s*\'(.*?)\'/)

              if (sid && sid.length === 2) {
                sid = sid.pop()
              } else {
                sid = 'ERROR'
              }

              port.postMessage({
                portName: port.name,
                command: 'getSid_reply',
                data: {
                  sid: sid,
                  image: [imageBase, "&sid=", sid, "&", Math.random()].join('')
                }
              })
            },
            dataType: 'html'
          })
        }
      },
      {
        command: 'getToken',
        action: function (port, msg) {
          var port = port

          $.ajax({
            type: "GET",
            url: msg.verifyURL,
            success: function (html) {
              var token = html.match(/"token"\:\s*\"(.*?)\"/)

              if (token && token.length === 2) {
                token = token.pop()
              } else {
                token = 'ERROR'
              }

              port.postMessage({
                portName: port.name,
                command: 'getToken_reply',
                data: {
                  token: token
                }
              })
            },
            dataType: 'html'
          })
        }
      }
    ]
  })

  this.connect = new Connect({
    listeners: [
      {
        command: 'buildPort',
        action: function (message, sender, sendResponse) {
          sendResponse(this.buildTopResponse(sender))
        },
      }
    ]
  })

  this.inject = new Inject({
    content: {
      ayncScripts: [
        {file: './lib/bluebird.min.js'},
        {file: './main/injections/scripts/dwr/shoppingCartAction.js'},
        {file: './main/injections/scripts/dwr/engine.js'},
        {file: './main/injections/scripts/dwr/utils.js'}
      ],

      syncScripts: [
        {file: './lib/jquery.min.js',},
        {file: './main/injections/scripts/probe.js',},
        {file: './lib/drag.min.js',}
      ],

      ayncCss: [],

      syncCss: [
        {file: './main/injections/css/fairy.css',},
        {file: './lib/bootstrap.min.css',}
      ]
    }
  })

  this.listener = new Listener({
    sentries: [
      {
        keyword: 'ShoppingCartAction.addGoodsToShoppingCartLS',
        handler: function (details) {
          console.log(details)
        }
      }
    ],
    cancels: [
      /.*\:\/\/jiyou\.img\.11185\.cn\/td\/.*/,
    ],
    headers: {}
  })
}

$.extend(Agent.prototype, {
  start: function () {
    this.listener.start()
    this.port.start()
    this.connect.start()
    this.inject.start()
  }
})

var agent = new Agent()
agent.start()