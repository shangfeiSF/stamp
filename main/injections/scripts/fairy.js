var Dig = require('dig')
var Panel = require('panel')
var Order = require('order')
var Cart = require('cart')
var Loader = require('loader')

var fairy = {
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
  
  settlementPostData: {}
}

fairy.dig = new Dig(fairy)
fairy.dig.init()

fairy.loader = new Loader(fairy)
fairy.order = new Order(fairy)
fairy.cart = new Cart(fairy)
fairy.panel = new Panel(fairy)

fairy.panel.init()