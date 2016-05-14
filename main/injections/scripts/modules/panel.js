function Panel(fairy) {
  this.ids = {
    panel: '_panel_',
    trigger: '_trigger_',
    container: '_container_'
  }

  this.styles = {
    panel: {
      position: 'fixed',
      display: 'block',
      top: '2.5em',
      left: '10em',
      background: '#21b3c1',
      'font-size': '20px',
      'font-weight': 'bold',
      'font-family': '"microsoft yahei"',
      'z-index': '2147483647'
    },
    trigger: {
      width: '100%',
      height: '1.4em',
      cursor: 'move',
      padding: '0.3em 0',
      color: '#fff',
      'font-size': '0.8em',
      'text-align': 'center'
    },
    container: {
      position: 'relative',
      float: 'left',
      background: '#e8e8e8',
      width: '15em',
      padding: '0.5em 0 0 0.5em'
    }
  }

  this.nodes = {
    addressRadios: [],
    fareRadios: [],
    checkboxs: []
  }

  this.fairy = fairy
}

Stamp.$.extend(Panel.prototype, {
  init: function () {
    var self = this

    var panelStyle = ''
    Stamp.$.each(self.styles.panel, function (prop, value) {
      panelStyle += [prop, ':', value, ';'].join('')
    })
    var panel = Stamp.$('<div>', {
      id: self.ids.panel,
      style: panelStyle
    })

    self.nodes.panel = panel

    var triggerStyle = ''
    Stamp.$.each(self.styles.trigger, function (prop, value) {
      triggerStyle += [prop, ':', value, ';'].join('')
    })
    var trigger = Stamp.$('<div>', {
      id: self.ids.trigger,
      style: triggerStyle
    })
    trigger.text('快速下单')

    self.nodes.trigger = trigger

    var containerStyle = ''
    Stamp.$.each(self.styles.container, function (prop, value) {
      containerStyle += [prop, ':', value, ';'].join('')
    })
    var container = Stamp.$('<div>', {
      id: self.ids.container,
      style: containerStyle
    })

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

    self.goodsSection(state)
    self.sendSection()
    self.verifySection()
    self.identifySection()
  },

  goodsSection: function (state) {
    var self = this

    state.validity = true;
    (state.message1 && state.message1 === '商品已售完') && (state.validity = false);
    (state.message2 && state.message2 === '库存不足') && (state.validity = false);

    var details = self.fairy.details
    var limit = details.goodsAttrList[0].buyLimit

    var explain = Stamp.$('<span class="tip">')
      .css('color', '#555')
      .text('提示：根据购买限制选择购买数量，生成快速订单后无法修改数量')

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

    var tip = Stamp.$('<span class="tip">')
    state.validity ? tip.text('最多购买' + limit + '件') : tip.text([state.message1, '/', state.message2].join(''))

    goods.on('click', function () {
      Stamp.$.ajax({
        type: "POST",
        url: "/retail/initPageForBuyNow.html",
        data: {
          'buyGoodsNowBean.goods_id': self.fairy.cache.goodsId,
          'buy_type': details.goodsStatus.lottery ? '3' : '2',
          'buyGoodsNowBean.goods_attr_id': details.goodsAttrList[0].id,
          'buyGoodsNowBean.goods_num': count.val(),
          'goodsTicketAttr': details.goodsAttrList[0].id
        },
        success: function (html) {
          if (html.search('date_form') > -1 && html.search('gwc gwc2') > -1) {
            goods.off()

            goods.parent().hide()
            count.attr('disabled', 'disabled').hide()

            self.fairy.cache.html = html
            self.fairy.cache.count = count.val()

            self.fairy.loader.getSid()
          }
        },
        dataType: 'html'
      })
    })

    self.nodes.container.append('<div class="section"></div>')
    var section = self.nodes.container.find('.section:last')
    section.append(explain)
    section.append(count)
    section.append(goods)
    section.append(tip)
  },

  sendSection: function () {
    var self = this

    var phone = Stamp.$('<input>', {
      type: 'text',
      id: '_phone_',
      value: '18612697359'
    })
    var send = Stamp.$('<input>', {
      type: 'button',
      id: '_send_',
      value: '获取验证码'
    })
    var sendState = Stamp.$('<span class="state">')

    send.on('click', function () {
      Stamp.$.ajax({
        type: "POST",
        url: "/v/sendMessage.html",
        data: {
          mobileNum: phone.val(),
          smsType: '4'
        },
        success: function (data) {
          if (data == "sended") {
            sendState.toggleClass('fulfilled')
            self.fairy.cache.mobile = phone.val()
          } else {
            alert(data)
          }
        },
        dataType: 'html'
      })
    })

    self.nodes.container.append('<div class="section"></div>')
    var section = self.nodes.container.find('.section:last')
    section.append(phone)
    section.append(send)
    send.after(sendState)
  },

  verifySection: function () {
    var self = this

    var code = Stamp.$('<input>', {
      type: 'text',
      id: '_code_',
      value: ''
    })
    var verify = Stamp.$('<input>', {
      type: 'button',
      id: '_verify_',
      value: '验证手机'
    })
    var verifyState = Stamp.$('<span class="state">')

    verify.on('click', function () {
      Stamp.$.ajax({
        type: "POST",
        url: "/book/jsonCheckMobile.html",
        data: {
          mobile: self.nodes.container.find('_phone_').val(),
          message: code.val()
        },
        success: function (result) {
          if (result.status == '1') {
            verifyState.toggleClass('fulfilled')
            verifyState.attr('data-show', result.random_code)
            self.fairy.cache.message = result.random_code
          } else {
            alert(result.msg)
          }
        },
        dataType: "json"
      })
    })

    self.nodes.container.append('<div class="section"></div>')
    var section = self.nodes.container.find('.section:last')
    section.append(code)
    section.append(verify)
    verify.after(verifyState)
  },

  identifySection: function () {
    var self = this

    var mocks = [
      [40, 40],
      [110, 40],
      [180, 40],
      [250, 40],
      [40, 120],
      [110, 120],
      [180, 120],
      [250, 120],
    ]

    var answer = Stamp.$('<div class="checkboxs">')
    self.nodes.answer = answer

    Stamp.$.each(mocks, function (index, config) {
      var offsetX = Math.floor(Math.random() * 31)
      var offsetY = Math.floor(Math.random() * 27)
      var pos = [config[0] + offsetX, config[1] + offsetY]

      var wrap = Stamp.$('<div class="position">')

      var checkbox = Stamp.$('<input>', {
        id: ['_pic', index].join('-'),
        type: 'checkbox',
        value: pos.join(',')
      })
      self.nodes.checkboxs.push(checkbox)

      var label = Stamp.$('<label>', {
        for: ['_pic', index].join('-')
      })
      label.text(index + 1)

      wrap.append(checkbox)
      wrap.append(label)
      answer.append(wrap)
    })

    self.nodes.container.append('<div class="section"></div>')
    var section = self.nodes.container.find('.section:last')
    section.append(answer)

    var identify = Stamp.$('<input>', {
      type: 'button',
      id: '_identify_',
      value: '图片验证'
    })
    var identifyState = Stamp.$('<span class="state">')

    identify.on('click', function () {
      if (self.fairy.cache.sid.length === 0) return false

      var checked = Stamp.$.grep(self.nodes.checkboxs, function (checkbox) {
        return Stamp.$(checkbox).attr('checked') === 'checked'
      })
      var postions = Stamp.$.map(checked, function (checkbox) {
        return Stamp.$(checkbox).val()
      })

      var verifyURL = 'http://jiyou.11185.cn/l/verify.html?'
      var params = {
        wid: '3be16628-c630-437b-b443-c4d9f18602ed',
        answer: postions.join(','),
        sid: self.fairy.cache.sid,
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
          self.fairy.cache.token = message.data.token

          self.fairy.loader.final()
        }
      }.bind(self))
    })

    self.nodes.container.append('<div class="section"></div>')
    var section = self.nodes.container.find('.section:last')
    section.append(identify)
    identify.after(identifyState)
  },
})

module.exports = Panel