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

    self.storage.get('targets').each(function (good) {
      good.specs.each(function (spec) {
        var item = Stamp.$('<div class="target">').attr('data-index', [good.id, spec.id].join('#'))

        var title = Stamp.$('<div class="goodTitle">').text(good.title)
        var name = Stamp.$('<div class="goodName">').text(spec.name)
        var count = Stamp.$('<div class="goodCount">').text(spec.count)
        var number = Stamp.$('<input>', {
          type: 'number',
          class: 'goodNumber',
          min: 1,
          max: spec.limit,
          value: 1
        })
        var numberEdit = Stamp.$('<input>', {
          type: 'button',
          class: 'goodNumberEdit',
          value: '修改数量'
        }).addClass('btn btn-info')
        var remove = Stamp.$('<input>', {
          type: 'button',
          class: 'goodRemove',
          value: '删除'
        }).addClass('btn btn-danger')

        item.append(title).append(name).append(count)
          .append(remove).append(numberEdit).append(number)
        targetsList.append(item)
      })
    })

    targetsList.on('click', function (e) {
      var target = Stamp.$(e.target)
      console.log(target.parent().attr('data-index'))
    })

    self.nodes.targetsList = targetsList
  },

  addRushTargetRender: function () {
    var self = this

    var goodIds = Stamp.$('<input>', {
      type: 'text',
      id: '_rush_goodIds_',
      value: '27710#27711#27144#26720',
      placeholder: '商品ID（#分隔多个ID）',
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
    var addTargetRecords = Stamp.$('<div class="addTargetRecords">')

    self.nodes.selectDetails = selectDetails
    self.nodes.addTargetRecords = addTargetRecords
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
      if (code.val().length) {
        storeCodeState.removeClass('fulfilled')

        self.storage.update('message', code.val())

        setTimeout(function () {
          storeCodeState.addClass('fulfilled')
        }, 500)
      }
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
        blocks.append(content._selectDetailsBuild(fairy))
      })

      this.nodes.selectDetails.append(blocks)
      content.nodes.addTargetRecords.show()
    }
    commonAppend = commonAppend.bind(self)

    fetchDetails.on('click', function () {
      fetchDetailsState.removeClass('fulfilled')
      nodes.selectDetails.empty()

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

            var new_fairys_sorted = ids.map(function (id) {
              return new_fairys.filter(function (fairy) {
                return fairy.cache.goodsId == id
              }).pop()
            })

            commonAppend(new_fairys_sorted)
          }
        })
      })
    })
  },

  _selectDetailsBuild: function (fairy) {
    var self = this

    var details = fairy.details

    var goodTitle = Stamp.$('<div class="goodTitle">').text(details.goodsShowInfo.title)
      .prepend(Stamp.$('<em>').text(details.goodsId + '#'))

    var goodCount = Stamp.$('<input>', {
      type: 'number',
      class: 'goodCount',
      min: 1,
      value: 1
    })

    goodCount.on('change', function () {
      var target = Stamp.$(this)
      var max = +target.attr('max')

      Number(target.val()) > max && target.val(String(max))
    })

    var goodSpecs = Stamp.$('<div class="goodSpecs"></div>')

    Stamp.$.each(details.goodsAttrList, function (index, attr) {
      var wrap = Stamp.$('<sapn class="goodSpec"></sapn>')

      var id = ['_rush_goodSepc_', details.goodsId, '_', index].join('')

      var spec = Stamp.$('<input>', {
        type: 'radio',
        id: id,
        name: ['goodSpec_', details.goodsId].join(''),
        value: index,
      }).data('buyLimit', attr.buyLimit)

      var label = Stamp.$('<label>', {
        for: id
      }).text(attr.attrName)

      if (index == 0) {
        spec.attr('checked', 'checked')
        label.addClass('selected')

        goodSpecs.data('specIndex', index)
        goodCount.attr('max', attr.buyLimit)

        goodCount.after(Stamp.$('<span class="goodLimit">').text(['(购买数量上限：', attr.buyLimit, ')'].join('')))
      }

      wrap.append(spec).append(label)

      goodSpecs.append(wrap)
    })

    goodSpecs.on('change', function (e) {
      var target = Stamp.$(e.target)

      Stamp.$.each(Stamp.$(this).find('label'), function (index, node) {
        var node = Stamp.$(node)

        node.removeClass('selected')

        node.attr('for').split('_').pop() === target.val() && node.addClass('selected')
      })

      goodSpecs.data('specIndex', target.val())
      goodCount.attr('max', Number(target.data('buyLimit')))
    })

    var goodAdd = Stamp.$('<input>', {
      type: 'button',
      class: 'goodAdd',
      value: '加入列表'
    }).addClass('btn btn-warning')

    goodAdd.on('click', function () {
      var goodAttr = details.goodsAttrList[goodSpecs.data('specIndex')]

      self._addTarget2Storage(
        {
          id: goodAttr.goodsId,
          title: details.goodsShowInfo.title,
          specId: goodAttr.id,
          name: goodAttr.attrName,
          limit: Number(goodAttr.buyLimit),
          count: Number(goodCount.val())
        },
        {
          Title: details.goodsShowInfo.title,
          Spec: goodAttr.attrName,
          Count: goodCount.val()
        }
      )
    })

    var block = Stamp.$('<div class="selectDetailsBlock">').attr('data-goodsId', details.goodsId)
    block.append(goodTitle).append(goodSpecs).append(goodCount).append(goodAdd)

    return block
  },

  _addTarget2Storage: function (record, showInfo) {
    var self = this

    var storageInfo = self._mergeTargetCount(record)
    self._addTargetRecord(showInfo, storageInfo)
  },

  _mergeTargetCount: function (record) {
    var self = this
    var storageInfo = {
      code: 200,
      add: null,
      rest: null,
      msg: '成功加入列表'
    }

    var targets = self.storage.get('targets')

    var matchGoods = targets.filter(function (target) {
      return target.id == record.id
    })

    if (matchGoods.length == 1) {
      var match_good = matchGoods[0]

      var matchSpecs = match_good.specs.filter(function (spec) {
        return spec.id == record.specId
      })

      if (matchSpecs.length == 1) {
        var match_spec = matchSpecs[0]

        if (match_spec.count == match_spec.limit) {
          storageInfo.code = 500
          storageInfo.add = 0
          storageInfo.rest = 0
          storageInfo.msg = '无法购买该商品此规格'
        }
        else if (match_spec.count + record.count > match_spec.limit) {
          storageInfo.code = 400
          storageInfo.add = match_spec.limit - match_spec.count
          storageInfo.rest = 0
          storageInfo.msg = '该商品此规格已经达到购买上限'

          match_spec.count = match_spec.limit
        } else {
          storageInfo.add = record.count
          storageInfo.rest = match_spec.limit - match_spec.count

          match_spec.count += record.count
        }
      }
      else {
        storageInfo.add = record.count
        storageInfo.rest = record.limit - record.count

        match_good.specs.push({
          name: record.name,
          id: record.specId,
          limit: record.limit,
          count: record.count
        })
      }
    }
    else {
      storageInfo.add = record.count
      storageInfo.rest = record.limit - record.count

      targets.push({
        id: record.id,
        title: record.title,
        specs: [{
          id: record.specId,
          name: record.name,
          limit: record.limit,
          count: record.count
        }]
      })
    }

    self.storage.update('targets', targets)

    return storageInfo
  },

  _addTargetRecord: function (showInfo, storageInfo) {
    var self = this

    var nodes = self.nodes
    var addTargetRecords = nodes.addTargetRecords

    var target = Stamp.$('<div class="target">')
    Stamp.$.each(showInfo, function (prop, value) {
      target.append(Stamp.$('<div>', {
        class: ['target', prop].join('')
      }).text(value))
    })

    target.append(Stamp.$('<a class="targetRemove">').text('删除'))

    console.log(storageInfo)

    addTargetRecords.append(target)
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
    sections[4].append(nodes.addTargetRecords)

    Stamp.$.each(sections, function (index, section) {
      root.append(section)
    })

    self.nodes.container.append(root)
  }
})

module.exports = Rush