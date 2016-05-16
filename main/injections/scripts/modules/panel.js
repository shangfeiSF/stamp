function Panel(fairy) {
  this.ids = {
    panel: '_panel_',
    trigger: '_trigger_',
    container: '_container_'
  }

  this.nodes = {
    addressRadios: [],
    fareRadios: [],
    checkboxs: []
  }

  this.mocks = [
    [40, 40],
    [110, 40],
    [180, 40],
    [250, 40],
    [40, 120],
    [110, 120],
    [180, 120],
    [250, 120],
  ]

  this.mobiles = [
    '17600808607',
    '18612697359'
  ]

  this.fairy = fairy
}

Stamp.$.extend(Panel.prototype, {
  init: function () {
    var self = this

    var panel = Stamp.$('<div>', {
      id: self.ids.panel
    })

    var trigger = Stamp.$('<div>', {
      id: self.ids.trigger
    }).text('快速下单')

    var container = Stamp.$('<div>', {
      id: self.ids.container
    })

    self.nodes.panel = panel
    self.nodes.trigger = trigger
    self.nodes.container = container

    panel.append(trigger)
    panel.append(container)
    Stamp.$('body').append(panel)

    new Draggable(self.ids.panel, {
      handle: self.ids.trigger
    })
  },

  render: function (state) {
    var self = this

    self.goodsRender(state)
    self.sendRender()
    self.verifyRender()
    self.mockRender()
    self.identifyRender()
    self.bookRender()

    self.goodsBind()
    self.sendBind()
    self.verifyBind()
    self.identifyBind()
    self.bookBind()

    self.append()
  },

  goodsRender: function (state) {
    var self = this

    state.validity = true;
    (state.message1 && state.message1 === '商品已售完') && (state.validity = false);
    (state.message2 && state.message2 === '库存不足') && (state.validity = false);

    var details = self.fairy.details
    var limit = details.goodsAttrList[0].buyLimit

    var explain = Stamp.$('<span class="tip">')
      .css({
        color: '#555',
        'line-height': '150%'
      })
      .text('提示：根据购买限制选择购买数量，生成快速订单后无法修改数量')

    var tip = Stamp.$('<span class="tip">')
    state.validity ? tip.text('最多购买' + limit + '件') : tip.text([state.message1, '/', state.message2].join(''))

    var count = Stamp.$('<input>', {
      type: 'number',
      min: 1,
      max: limit,
      id: '_count_',
      style: 'width: 5em;'
    })
    state.validity ? count.val('1') : count.val('0')

    var goods = Stamp.$('<input>', {
      type: 'button',
      id: '_goods_',
      value: '生成订单'
    })

    self.nodes.explain = explain
    self.nodes.tip = tip
    self.nodes.count = count
    self.nodes.goods = goods
  },

  sendRender: function () {
    var self = this

    var phone = Stamp.$('<select>', {
      id: '_phone_',
      style: 'width: 10.7em;'
    })
    Stamp.$.each(self.mobiles, function (index, mobile) {
      var optionConfig = {
        value: mobile
      }
      index === 0 && (optionConfig.selected = 'selected')
      phone.append(Stamp.$('<option>', optionConfig).text(mobile))
    })

    var send = Stamp.$('<input>', {
      type: 'button',
      id: '_send_',
      value: '获取验证码'
    })
    var sendState = Stamp.$('<span class="state">')

    self.nodes.phone = phone
    self.nodes.send = send
    self.nodes.sendState = sendState
  },

  verifyRender: function () {
    var self = this

    var code = Stamp.$('<input>', {
      type: 'text',
      id: '_code_',
      value: '',
      style: 'width: 5em;'
    })
    var verify = Stamp.$('<input>', {
      type: 'button',
      id: '_verify_',
      value: '验证手机'
    })
    var verifyState = Stamp.$('<span class="state">')

    self.nodes.code = code
    self.nodes.verify = verify
    self.nodes.verifyState = verifyState
  },

  mockRender: function () {
    var self = this

    var answer = Stamp.$('<div class="checkboxs">')
    self.nodes.answer = answer

    Stamp.$.each(self.mocks, function (index, config) {
      var offsetX = Math.floor(Math.random() * 31)
      var offsetY = Math.floor(Math.random() * 27)

      var pos = [config[0] + offsetX, config[1] + offsetY]

      var checkbox = Stamp.$('<input>', {
        id: ['_pic', index].join('-'),
        type: 'checkbox',
        value: pos.join(',')
      })

      var label = Stamp.$('<label>', {
        for: ['_pic', index].join('-')
      }).text(index + 1)

      var wrap = Stamp.$('<div class="position">')
      wrap.append(checkbox)
      wrap.append(label)

      answer.append(wrap)

      self.nodes.checkboxs.push(checkbox)
    })
  },

  identifyRender: function () {
    var self = this

    var identify = Stamp.$('<input>', {
      type: 'button',
      id: '_identify_',
      value: '图片验证'
    })
    var identifyState = Stamp.$('<span class="state">')

    self.nodes.identify = identify
    self.nodes.identifyState = identifyState
  },

  bookRender: function () {
    var self = this

    var book = Stamp.$('<input>', {
      type: 'button',
      id: '_book_',
      value: '提交订单'
    })
    var bookState = Stamp.$('<span class="state">')

    self.nodes.book = book
    self.nodes.bookState = bookState
  },

  goodsBind: function () {
    var self = this

    var cache = self.fairy.cache
    var details = self.fairy.details

    var goods = self.nodes.goods
    var count = self.nodes.count

    goods.on('click', function () {
      var params = {
        'buyGoodsNowBean.goods_id': self.fairy.cache.goodsId,
        'buy_type': details.goodsStatus.lottery ? '3' : '2',
        'buyGoodsNowBean.goods_attr_id': details.goodsAttrList[0].id,
        'buyGoodsNowBean.goods_num': count.val(),
        'goodsTicketAttr': details.goodsAttrList[0].id
      }

      self.fairy.loader.post('buy', params)
        .then(function (data) {
          if (data.result.search('date_form') > -1 && data.result.search('gwc gwc2') > -1) {
            self.nodes.sections[2].show()
            self.nodes.sections[3].show()
            self.nodes.sections[4].show()
            self.nodes.sections[5].show()
            goods.off()

            goods.parent().hide()
            count.attr('disabled', 'disabled').hide()

            cache.html = data.result
            cache.count = count.val()

            self.fairy.loader.getSid()
          }
        })
    })
  },

  sendBind: function () {
    var self = this

    var cache = self.fairy.cache

    var phone = self.nodes.phone
    var send = self.nodes.send
    var sendState = self.nodes.sendState

    send.on('click', function () {
      var params = {
        mobileNum: phone.val(),
        smsType: '4'
      }

      self.fairy.loader.post('code', params)
        .then(function (data) {
          if (data.result == "sended") {
            sendState.toggleClass('fulfilled')
            cache.mobile = phone.val()
          } else {
            alert(data.result)
          }
        })
    })
  },

  verifyBind: function () {
    var self = this

    var cache = self.fairy.cache

    var code = self.nodes.code
    var verify = self.nodes.verify
    var verifyState = self.nodes.verifyState

    verify.on('click', function () {
      var params = {
        mobile: self.nodes.phone.val(),
        message: code.val()
      }

      self.fairy.loader.post('check', params)
        .then(function (data) {
          if (data.result.status == '1') {
            verifyState.toggleClass('fulfilled')
            verifyState.attr('data-show', data.result.random_code)
            cache.message = data.result.random_code
          } else {
            alert(data.result.msg)
          }
        })
    })
  },

  identifyBind: function () {
    var self = this

    var cache = self.fairy.cache

    var checkboxs = self.nodes.checkboxs
    var identify = self.nodes.identify
    var identifyState = self.nodes.identifyState

    identify.on('click', function () {
      if (cache.sid.length === 0) return false

      var checked = Stamp.$.grep(checkboxs, function (checkbox) {
        return Stamp.$(checkbox).attr('checked') === 'checked'
      })
      var postions = Stamp.$.map(checked, function (checkbox) {
        return Stamp.$(checkbox).val()
      })

      var verifyURL = 'http://jiyou.11185.cn/l/verify.html?'
      var params = {
        wid: '3be16628-c630-437b-b443-c4d9f18602ed',
        answer: postions.join(','),
        sid: cache.sid,
        checkCode: encodeURIComponent('user=zhangsan&stamp_id=123'),
      }

      Stamp.$.each(params, function (key, value) {
        verifyURL += [key, '=', value].join('') + '&'
      })

      Stamp.probe.execute('getToken', {
        verifyURL: verifyURL + Math.random()
      }, function (message) {
        if (message.data.token !== 'ERROR') {
          identifyState.toggleClass('fulfilled')
          identifyState.attr('data-show', message.data.token)
          cache.token = message.data.token
        }
      }.bind(self))
    })
  },

  bookBind: function () {
    var self = this

    var book = self.nodes.book
    var bookState = self.nodes.bookState

    book.on('click', function () {
      self.fairy.loader.final(function () {
        bookState.toggleClass('fulfilled')
      })
    })
  },

  append: function () {
    var self = this
    var nodes = self.nodes
    var container = nodes.container

    var sections = [
      'goodsSection',
      'sendSection',
      'verifySection',
      'mockSection',
      'identifySection',
      'bookSection'
    ]

    sections = Stamp.$.map(sections, function (klass) {
      return Stamp.$('<div>', {
        class: ['section', klass].join(' ')
      })
    })
    nodes.sections = sections

    sections[0].append(nodes.explain)
    sections[0].append(nodes.count)
    sections[0].append(nodes.goods)
    sections[0].append(nodes.tip)

    sections[1].append(nodes.phone)
    sections[1].append(nodes.send)
    nodes.send.after(nodes.sendState)

    sections[2].append(nodes.code)
    sections[2].append(nodes.verify)
    nodes.verify.after(nodes.verifyState)
    sections[2].hide()

    sections[3].append(nodes.answer)
    sections[3].hide()

    sections[4].append(nodes.identify)
    nodes.identify.after(nodes.identifyState)
    sections[4].hide()

    sections[5].append(nodes.book)
    nodes.book.after(nodes.bookState)
    sections[5].hide()

    var wrap = Stamp.$('<div class="sections"></div>')
    Stamp.$.each(sections, function (index, section) {
      wrap.append(section)
    })

    container.append(wrap)
  }
})

module.exports = Panel