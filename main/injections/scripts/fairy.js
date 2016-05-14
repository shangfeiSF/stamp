var Dig = require('dig')
var Panel = require('panel')
var Loader = require('loader')

var fairy = {
  details: {
    /* set by dig.js  */
    _href: '',
    _parts: [],
    goodsId: ''
  },
  cache: {
    /* set by dig.js  */
    goodsId: '',
    /* set by loader.js  */
    userType: '',
    userId: '',
    html: '',
    count: '',
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
debugger
fairy.panel = new Panel(fairy)

fairy.panel.init()
fairy.loader.init()

console.info(fairy)