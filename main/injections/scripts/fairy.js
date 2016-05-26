var Panel = require('panel')
var Dig = require('dig')

var Rush = require('rush')

var Base = require('base')
var BaseSettle = require('baseSettle')

var Cart = require('cart')
var CartSettle = require('cartSettle')

var Order = require('order')

var fairy = {
  layout: {
    rushBlock: {
      triggerText: '秒杀配置',
      anchor: 'rush',
      default: true
    },
    baseBlock: {
      triggerText: '常规购买',
      anchor: 'base'
    },
    baseSettleBlock: {
      triggerText: '常规订单',
      anchor: 'baseSettle'
    },
    cartBlock: {
      triggerText: '购物车',
      anchor: 'cart'
    },
    cartSettleBlock: {
      triggerText: '购物车订单',
      anchor: 'cartSettle'
    }
  },

  mobiles: [
    '17600808607',
    '18600808607'
  ],

  details: {
    _href: '',
    _parts: [],
    goodsId: ''
  },

  cache: {
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
  },

  finalPostData: {},

  settlefinalPostData: {}
}

fairy.panel = new Panel(fairy) // init()
fairy.dig = new Dig(fairy)  // init()

fairy.rush = new Rush(fairy)  // boot() - init()

fairy.base = new Base(fairy)  // init()
fairy.baseSettle = new BaseSettle(fairy)

fairy.cart = new Cart(fairy)
fairy.cartSettle = new CartSettle(fairy)

fairy.order = new Order(fairy)