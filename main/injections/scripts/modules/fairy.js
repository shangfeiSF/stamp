var Panel = require('panel')

var Storage = require('storage')
var Dig = require('dig')

var Rush = require('rush')

var Base = require('base')
var BaseSettle = require('baseSettle')

var Cart = require('cart')
var CartSettle = require('cartSettle')

function Fairy(config) {
  var config = config || {}

  this.storageKey = config.storageKey || 'RUSH'

  this.layout = config.layout || {
      rushBlock: {
        triggerText: '秒杀配置',
        anchor: 'rush',
        default: true
      },
      baseBlock: {
        triggerText: '常规购买',
        anchor: 'base',
        default: false
      },
      baseSettleBlock: {
        triggerText: '常规订单',
        anchor: 'baseSettle',
        default: false
      },
      cartBlock: {
        triggerText: '购物车',
        anchor: 'cart',
        default: false
      },
      cartSettleBlock: {
        triggerText: '购物车订单',
        anchor: 'cartSettle',
        default: false
      }
    }

  this.mobiles = config.mobile || [
      '17600808607',
      '18600808607',
      '18612697359'
    ]

  this.postConfig = {
    common: {
      type: 'POST',
      dataType: 'json'
    },

    user: {
      url: 'JSONGetUserInfoByUserId.html'
    },
    limit: {
      url: 'JSONGetBuyLimitById.html',
      dataType: 'html'
    },
    message: {
      url: 'JSONGetMessage.html'
    },

    buy: {
      url: '/retail/initPageForBuyNow.html',
      dataType: 'html'
    },
    code: {
      url: '/v/sendMessage.html',
      dataType: 'html'
    },
    check: {
      url: '/book/jsonCheckMobile.html'
    },

    address: {
      url: '/retail/JSONGetUserAddressWithUserID.html',
    },
    fare: {
      url: '/retail/JSONGetFareByShopIDAndProvinceCode.html',
    },
    fee: {
      url: '/retail/JSONGetTotalFeeForClikcAction.html',
      dataType: 'html'
    },
    book: {
      url: '/book/tradesSubmit.html',
      dataType: 'html'
    }
  }

  this.imageBase = 'http://jiyou.11185.cn/l/captcha.html?wid=3be16628-c630-437b-b443-c4d9f18602ed'

  this._origScriptSessionIdPattern = /dwr\.engine\.\_origScriptSessionId\s*\=\s*\"(.*)\"/

  this.details = {
    _href: '',
    _parts: [],
    goodsId: ''
  }

  this.cache = {
    specIndex: '',
    buyLimit: '',
    goodsId: '',
    userType: '',
    userId: '',
    html4order: '',
    count: '',
    shopId: '',
    orderTotalWeigth: '',
    goodsListIndex: '',
    goodPrice: '',
    sendFlag: '',
    canGetFare: '',
    address: '',
    addressId: '',
    fare: '',
    fareId: '',
    mobile: '',
    message: '',
    sid: '',
    token: ''
  }

  this.finalPostData = {}

  this.settlefinalPostData = {}
}

Stamp.$.extend(Fairy.prototype, {
  post: function (prop, params) {
    var self = this

    var common = self.postConfig.common
    var private = self.postConfig[prop]

    return new Promise(function (resolve, rejected) {
      var config = {
        type: private.type || common.type,
        url: private.url,
        success: function () {
          var args = Array.prototype.slice.call(arguments)
          resolve({
            result: args[0],
            textStatus: args[1]
          })
        },
        error: function () {
          var args = Array.prototype.slice.call(arguments)
          rejected({
            result: args[0],
            textStatus: args[1]
          })
        },
        dataType: private.dataType || common.dataType,
      }

      params !== undefined && (config.data = params)

      Stamp.$.ajax(config)
    })
  },

  get_origScriptSessionId: function () {
    var self = this

    var _origScriptSessionId = undefined

    Stamp.$.ajax({
      type: 'GET',
      url: 'http://jiyou.biz.11185.cn/dwr/engine.js',
      cache: false,
      async: false,
      success: function (content) {
        var matches = self._origScriptSessionIdPattern.exec(content)
        matches && matches.length == 2 && ( _origScriptSessionId = matches.pop() + Math.floor(Math.random() * 31793))
      },
      error: function () {
        _origScriptSessionId = undefined
      }
    })

    return _origScriptSessionId
  },

  start: function () {
    var self = this

    self.panel = new Panel(this)

    self.storage = new Storage(this.storageKey)
    self.dig = new Dig(this)

    self.rush = new Rush(this)

    self.base = new Base(this)
    self.baseSettle = new BaseSettle(this)

    self.cart = new Cart(this)
    self.cartSettle = new CartSettle(this)
  }
})

module.exports = Fairy