var $ = require('jquery')

var Port = require('port')
var Inject = require('inject')
var Connect = require('connect')
var Listener = require('listener')
var Reffer = require('reffer')

function Agent() {
  this.reffer = new Reffer({
    allStates: ['buyNow', 'add2Cart', 'myCart', 'settleMyCart'],
    originalState: 'add2Cart',
    handlers: {
      buyNow: function () {
      },
      add2Cart: function () {
      },
      myCart: function () {
      },
      settleMyCart: function () {
      }
    }
  })

  this.port = new Port({
    portCache: {
      goodsIds: [],
      currentRefferState: ''
    },

    actions: [
      {
        command: 'launchFairy',
        action: function (port) {
          var tabId = parseInt(port.name.split('#').slice(1, 2).pop())
          var file = './main/injections/scripts/launcher.js'

          chrome.tabs.executeScript(tabId, {
            file: file,
            allFrames: false,
            matchAboutBlank: true
          }, function () {
            var message = ['%c[Injected script by command]---', file.slice(1)].join('')
            console.log(message, 'color: #ff0062; font-weight: bold;')
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

              var image = [imageBase, "&sid=", sid, "&", Math.random()].join('')
              port.postMessage({
                portName: port.name,
                command: 'getSid_reply',
                data: {
                  sid: sid,
                  image: image
                }
              })

              var messageSid = ['%c[Get sid by command]---', sid].join('')
              var messageImage = ['%c[Get image with sid by command]---', image].join('')

              console.log(messageSid, 'color: #ff0062; font-weight: bold;')
              console.log(messageImage, 'color: #ff0062; font-weight: bold;')
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

              var messageToken = ['%c[Get token by command]---', sid].join('')
              console.log(messageToken, 'color: #ff0062; font-weight: bold;')
            },
            dataType: 'html'
          })
        }
      },
      {
        command: 'storeGoodsId',
        action: function (port, msg) {
          var self = this
          self.portCache.goodsIds.push(msg.goodsId)
        }
      },
      {
        command: 'changeRefferState',
        action: function (port, msg) {
          var self = this
          self.portCache.currentRefferState = msg.currentRefferState
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
      ],

      syncScripts: [
        {file: './main/injections/scripts/dwr/init.js'},
        {file: './main/injections/scripts/dwr/engine.js'},
        {file: './main/injections/scripts/dwr/utils.js'},
        {file: './main/injections/scripts/dwr/shoppingCartAction.js'},
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
    headers: [
      {
        keyword: 'ShoppingCartAction.addGoodsToShoppingCartLS',
        modifiers: [{
          name: 'Referer',
          handler: function (header, portCache) {
            if (portCache.goodsIds.length) {
              header.value = ['http://jiyou.biz.11185.cn/retail/ticketDetail_', portCache.goodsIds.shift(), '.html'].join('')
            }
          }
        }]
      }
    ],
    cancels: [
      // /.*\:\/\/jiyou\.img\.11185\.cn\/td\/.*/,
    ],
    sentries: [
      // {
      //   keyword: 'ShoppingCartAction.addGoodsToShoppingCartLS',
      //   handler: function (details) {}
      // }
    ]
  })
}

$.extend(Agent.prototype, {
  start: function () {
    this.listener.start(this.port.portCache)
    this.reffer.start(this.port.portCache)
    this.port.start()
    this.connect.start()
    this.inject.start()
  }
})

var agent = new Agent()
agent.start()