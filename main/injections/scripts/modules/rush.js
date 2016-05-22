var Dig = require('dig')
var Storage = require('storage')

var Order = require('order')
var Cart = require('cart')

var Settle = require('settle')

function Rush() {
  this.mobiles = [
    '17600808607',
    '18600808607',
    '15810537970',
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

  var storageKey = 'RUSH'
  if (window.localStorage.getItem(storageKey) == null) {
    window.localStorage.setItem(storageKey, JSON.stringify({}))
  }
  this.storage = new Storage({
    key: storageKey,
    separator: '&'
  })

  this.nodes = {
    panel: null,
    trigger: null,
    container: null,

    root: null,
    sections: []
  }
}

Stamp.$.extend(Rush.prototype, {
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

  init: function () {
    var self = this

    var panelId = '_rush_panel_'
    var triggerId = '_rush_trigger_'

    var panel = Stamp.$('<div></div>').attr('id', panelId)
    var trigger = Stamp.$('<div></div>').attr('id', triggerId).text('批量秒杀')
    var container = Stamp.$('<div></div>').attr('id', '_rush_container_')

    self.nodes.panel = panel
    self.nodes.trigger = trigger
    self.nodes.container = container

    panel.append(trigger)
    panel.append(container)
    Stamp.$('body').append(panel)

    new Draggable(panelId, {
      handle: triggerId
    })

    self.render()
  },

  render: function () {
    var self = this

    self.sendRender()
    self.storeCodeRender()
    self.addRushTargetRender()
    self.batch2MyCartRender()

    self.sendBind()
    self.storeCodeBind()
    self.addRushTargetBind()
    self.batch2MyCartBind()

    self.append()
  },

  sendRender: function () {
    var self = this

    var phone = Stamp.$('<select>', {
      id: '_ruhs_phone_',
      style: 'width: 11em;'
    }).addClass('form-control')
    Stamp.$.each(self.mobiles, function (index, mobile) {
      var optionConfig = {
        value: mobile
      }
      index === 0 && (optionConfig.selected = 'selected')
      phone.append(Stamp.$('<option>', optionConfig).text(mobile))
    })

    var send = Stamp.$('<input>', {
      type: 'button',
      id: '_rush_send_',
      value: '获取验证码'
    }).addClass('btn btn-info')
    var sendState = Stamp.$('<span class="state">')

    self.nodes.phone = phone
    self.nodes.send = send
    self.nodes.sendState = sendState
  },

  storeCodeRender: function () {
    var self = this

    var storedMessage = self.storage.get('message')
    var code = Stamp.$('<input>', {
      type: 'text',
      id: '_rush_code_',
      value: storedMessage !== undefined ? storedMessage : '',
      style: 'width: 11em;'
    }).addClass('form-control')
    var storeCode = Stamp.$('<input>', {
      type: 'button',
      id: '_rush_storeCode_',
      value: '配置验证码'
    }).addClass('btn btn-info')
    var storeCodeState = Stamp.$('<span>', {
      class: storedMessage !== undefined ? 'state fulfilled' : 'state'
    })

    self.nodes.code = code
    self.nodes.storeCode = storeCode
    self.nodes.storeCodeState = storeCodeState
  },

  addRushTargetRender: function () {
  },

  batch2MyCartRender: function () {
  },

  settleRender: function () {
  },

  specsRender: function () {
  },

  sendBind: function () {
    var self = this

    var phone = self.nodes.phone
    var send = self.nodes.send
    var sendState = self.nodes.sendState

    send.on('click', function () {
      sendState.removeClass('fulfilled')
      var params = {
        mobileNum: phone.val(),
        smsType: '4'
      }

      self.post('code', params)
        .then(function (data) {
          if (data.result == "sended") {
            setTimeout(function () {
              sendState.addClass('fulfilled')
            }, 500)

            self.storage.update('mobile', phone.val())
          } else {
            alert(data.result)
          }
        })
    })
  },

  storeCodeBind: function () {
    var self = this

    var code = self.nodes.code
    var storeCode = self.nodes.storeCode
    var storeCodeState = self.nodes.storeCodeState

    storeCode.on('click', function () {
      storeCodeState.removeClass('fulfilled')

      self.storage.update('message', code.val())

      setTimeout(function () {
        storeCodeState.addClass('fulfilled')
      }, 500)
    })
  },

  addRushTargetBind: function () {
  },

  batch2MyCartBind: function () {
  },

  settleBind: function () {
  },

  append: function () {
    var self = this

    var nodes = self.nodes

    var root = Stamp.$('<div class="presetRoot"></div>')
    nodes.root = root

    var sections = [
      'sendSection',
      'storeCodeSection',
      'addRushTargetSection',
      'batch2MyCartSection'
    ]

    sections = Stamp.$.map(sections, function (klass) {
      return Stamp.$('<div>', {
        class: ['section', klass].join(' ')
      })
    })

    nodes.sections = sections

    sections[0].append(nodes.phone)
    sections[0].append(nodes.send)
    nodes.send.after(nodes.sendState)

    sections[1].append(nodes.code)
    sections[1].append(nodes.storeCode)
    nodes.storeCode.after(nodes.storeCodeState)

    Stamp.$.each(sections, function (index, section) {
      root.append(section)
    })

    self.nodes.container.append(root)
  }
})

module.exports = Rush