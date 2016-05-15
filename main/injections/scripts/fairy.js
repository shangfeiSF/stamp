var Dig = require('dig')
var Panel = require('panel')
var Loader = require('loader')

var fairy = {
  details: {
    _href: '',
    _parts: [],
    goodsId: ''
  },
  cache: {
    goodsId: '',
    userType: '',
    userId: '',
    html: '',
    count: '',
    shopId: '',
    orderTotalWeigth: '',
    goodsListIndex: '',
    goodPrice: '',
    sendFlag: '',
    canGetFare: '',
    address: '',
    fare: '',
    fareId: '',
    mobile: '',
    message: '',
    sid: '',
    token: ''
  },
  finalPostData: {}
}

fairy.dig = new Dig(fairy)
fairy.dig.init()
console.info(fairy.cache)
console.info(fairy.details)

fairy.loader = new Loader(fairy)
fairy.panel = new Panel(fairy)

fairy.panel.init()
fairy.loader.init()

console.info(fairy)