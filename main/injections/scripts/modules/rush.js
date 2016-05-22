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

  this.init()
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
    self.targetsListRender()
    self.addRushTargetRender()
    self.batch2MyTargetsListRender()

    self.sendBind()
    self.storeCodeBind()
    self.addRushTargetBind()

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

  targetsListRender: function () {
    var self = this

    var targetsList = Stamp.$('<div class="targetsList">')
    if (!self.storage.exist('targets')) {
      self.storage.update('targets', [])
    }

    self.nodes.targetsList = targetsList
  },

  addRushTargetRender: function () {
    var self = this

    var goodIds = Stamp.$('<input>', {
      type: 'text',
      id: '_rush_goodIds_',
      value: '',
      placeholder: '商品ID（分号分隔）',
      style: 'width: 95%;'
    }).addClass('form-control')
    var fetchDetails = Stamp.$('<input>', {
      type: 'button',
      id: '_rush_fetchDetails_',
      value: '获取商品信息',
      style: 'width: 9em; margin-top: 0.4em;'
    }).addClass('btn btn-info')
    var fetchDetailsState = Stamp.$('<span class="state">').css({
      margin: '0.4em 0 0 0'
    })

    self.nodes.goodIds = goodIds
    self.nodes.fetchDetails = fetchDetails
    self.nodes.fetchDetailsState = fetchDetailsState
  },

  batch2MyTargetsListRender: function () {
    var self = this

    var selectDetails = Stamp.$('<div class="selectDetails">')

    self.nodes.selectDetails = selectDetails
  },

  settleRender: function () {
  },

  _selectDetailsRender: function (fairy) {
    var self = this

    var cache = fairy.cache
    var details = fairy.details

    var goodsName = Stamp.$('<div class="goodTitle">').text(details.goodsShowInfo.title)

    var count = Stamp.$('<input>', {
      type: 'number',
      id: '_rush_count_' + cache.goodsId,
      min: 1,
      value: 1
    }).css({
      width: '4em',
      margin: '0 0.2em 0 1em',
      'text-aligen': 'center'
    })

    count.on('change', function () {
      var target = Stamp.$(this)
      var max = +target.attr('max')

      Number(target.val()) > max && target.val(String(max))
    })

    var specs = Stamp.$('<div class="goodSpecs"></div>').attr('data-goodsId', cache.goodsId)
    Stamp.$.each(details.goodsAttrList, function (index, attr) {
      var wrap = Stamp.$('<sapn class="spec"></sapn>')

      var id = ['_rush_sepc_', cache.goodsId, '_', index].join('')

      var spec = Stamp.$('<input>', {
        type: 'radio',
        id: id,
        name: ['spec_', cache.goodsId].join(''),
        value: index,
      }).data('info', attr)

      var label = Stamp.$('<label>', {
        for: id
      }).text(attr.attrName)

      if (index == 0) {
        spec.attr('checked', 'checked')
        label.addClass('selected')

        count.attr('max', attr.buyLimit)

        var limit = ['(购买数量上限：', attr.buyLimit, ')'].join('')
        count.after(Stamp.$('<span>').css({
          height: '24px',
          'line-height': '170%',
          'margin': '0 0.5em 0 0',
          float: 'left',
          color: '#aaa'
        }).text(limit))
      }

      wrap.append(spec).append(label)

      specs.append(wrap)
    })

    specs.on('change', function (e) {
      var target = Stamp.$(e.target)

      Stamp.$.each(Stamp.$(this).find('label'), function (index, node) {
        var node = Stamp.$(node)

        node.removeClass('selected')

        node.attr('for').split('_').pop() === target.val() && node.addClass('selected')
      })

      count.attr('max', Number(target.data('info').buyLimit))
    })

    var add = Stamp.$('<input>', {
      type: 'button',
      id: '_rush_add_' + cache.goodsId,
      value: '加入列表'
    }).addClass('btn btn-warning')

    add.on('click', function () {
      var spec = specs.find('input[checked="checked"]')
      var specindex = spec.val()
      self._add2TargetsListRender(
        details.goodsId,
        count.val(),
        details.goodsAttrList[specindex].id,
        {
          Title: details.goodsShowInfo.title,
          Spec: spec.next('label').text(),
          Count: count.val()
        }
      )
    })

    var block = Stamp.$('<div class="selectDetailsBlock">')
    block.append(goodsName).append(specs).append(count).append(add)

    return block
  },

  _add2TargetsListRender: function (goodsId, count, specId, showInfo) {
    var self = this

    var nodes = self.nodes

    var targetsList = nodes.targetsList

    var target = Stamp.$('<div class="target">')
    Stamp.$.each(showInfo, function (prop, value) {
      target.append(Stamp.$('<span>', {
        class: ['target', prop].join('')
      }).text(value))
    })

    var sign = +(new Date())
    var targetsInStore = self.storage.get('targets')
    targetsInStore.push({
      sign: sign,
      id: goodsId,
      specId: specId,
      count: count
    })
    self.storage.update('targets', targetsInStore)
    target.append(Stamp.$('<a class="targetRemove">')
      .attr('data-target', [sign, goodsId, specId, count].join('#'))
      .text('X'))

    targetsList.append(target)
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
    var self = this

    var nodes = self.nodes

    var goodIds = nodes.goodIds
    var fetchDetails = nodes.fetchDetails
    var fetchDetailsState = nodes.fetchDetailsState

    var commonAppend = function (new_fairys) {
      var content = this

      var blocks = Stamp.$('<div class="selectDetailsBlocks">')
      new_fairys.forEach(function (fairy) {
        blocks.append(content._selectDetailsRender(fairy))
      })

      this.nodes.selectDetails.append(blocks)
    }
    commonAppend = commonAppend.bind(self)

    fetchDetails.on('click', function () {
      nodes.selectDetails.empty()
      fetchDetailsState.removeClass('fulfilled')

      var ids = goodIds.val().split('#')
      var urls = []

      if (goodIds.val().length == 0) {
        urls.push(window.location.href)
      }
      else {
        urls = ids.map(function (id) {
          return 'http://jiyou.biz.11185.cn/retail/ticketDetail_' + Stamp.$.trim(id) + '.html'
        })
      }

      var new_fairys = []
      urls.forEach(function (url) {
        new Dig({
          cache: {},
          details: {}
        }, url, function (new_fairy) {
          new_fairys.push(new_fairy)

          if (new_fairys.length == ids.length) {
            fetchDetailsState.addClass('fulfilled')
            commonAppend(new_fairys)
          }
        })
      })
    })
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
      'targetsListSection',
      'addRushTargetSection',
      'batch2MyTargetsListSection'
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

    sections[2].append(nodes.targetsList)

    sections[3].append(nodes.goodIds)
    sections[3].append(nodes.fetchDetails)
    nodes.fetchDetails.after(nodes.fetchDetailsState)

    sections[4].append(nodes.selectDetails)

    Stamp.$.each(sections, function (index, section) {
      root.append(section)
    })

    self.nodes.container.append(root)
  }
})

module.exports = Rush