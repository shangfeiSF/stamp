function Order(fairy) {
  this.nodes = {
    /* render add */
    root: null,

    tips: null,

    phone: null,
    send: null,
    sendState: null,

    code: null,
    verify: null,
    verifyState: null,

    answer: null,
    checkboxs: [],

    identify: null,
    identifyState: null,

    book: null,
    bookState: null,

    records: null,

    sections: [],

    /* loader add */
    image: null,

    addressSection: null,
    addressRadios: [],

    fareSection: null,
    fareRadios: [],
    shopsfareSection: null,
    shopsfareList: null,
    shopsfareRadios: [],

    PriceSection: null,

    orderInfoSection: null,
    errorInfoSection: null
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

  this.fairy = fairy
}

Stamp.$.extend(Order.prototype, {
  render: function (state, needVerify) {
    var self = this

    self.tipsRender(state)
    if (needVerify) {
      self.sendRender()
      self.verifyRender()
    }

    self.mockRender()
    self.identifyRender()
    self.bookRender()

    if (needVerify) {
      self.sendBind()
      self.verifyBind()
    }
    self.identifyBind()
    self.bookBind()

    self.append(needVerify)
  },

  tipsRender: function (state) {
    var self = this

    state.validity = true
    state.message1 && state.message1 === '商品已售完' && (state.validity = false)
    state.message2 && state.message2 === '库存不足' && (state.validity = false)

    var cache = self.fairy.cache

    var tip = Stamp.$('<div class="tip">').css({
      width: '100%',
      'text-align': 'center',
      'font-weight': 'bold'
    })

    var color = "#FF0000"
    if (state.validity) {
      (Number(cache.count) <= Number(cache.buyLimit)) && (color = '#3AAD8B')

      tip.css({
        color: color
      }).text('最多购买' + cache.buyLimit + '件')
    }
    else {
      tip.css({
        color: color
      }).text([state.message1, '/', state.message2].join(''))
    }

    self.nodes.tip = tip
  },

  sendRender: function () {
    var self = this

    var phone = Stamp.$('<select>', {
      id: '_phone_',
      style: 'width: 11em;'
    }).addClass('form-control')
    Stamp.$.each(self.fairy.mobiles, function (index, mobile) {
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
    }).addClass('btn btn-info')
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
      style: 'width: 11em;'
    }).addClass('form-control')
    var verify = Stamp.$('<input>', {
      type: 'button',
      id: '_verify_',
      value: '验证手机'
    }).addClass('btn btn-info')
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
      var id = ['_pic_', index].join('')

      var checkbox = Stamp.$('<input>', {
        id: id,
        type: 'checkbox',
        value: pos.join(',')
      })

      var label = Stamp.$('<label>', {
        for: id
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
    }).addClass('btn btn-info')
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
    }).addClass('btn btn-info')
    var bookState = Stamp.$('<span class="state">')

    self.nodes.book = book
    self.nodes.bookState = bookState
  },

  recordsRender: function (success, failed) {
    var self = this

    var nodes = self.nodes

    var records = nodes.records ? nodes.records : Stamp.$('<div class="section recordsSection" id="_records_">')

    var index = records.children().length + 1
    var record = Stamp.$('<div>', {
      id: ['_record_', index].join('')
    }).addClass('record').append(Stamp.$('<div class="sequence"></div>').text('第' + index + '次提交：'))

    Stamp.$.each(success, function (i, msg) {
      var klass = msg ? 'success' : 'failed'
      var content = msg ? msg : failed[i]
      record.append(Stamp.$('<div>').addClass(klass).text(content))
    })

    records.append(record)

    if (!nodes.records) {
      self.nodes.records = records

      nodes.root.find('.section:last').after(records)
      records.before(Stamp.$('<div class="title">提交记录</div>'))
    }
  },

  sendBind: function () {
    var self = this

    var cache = self.fairy.cache

    var phone = self.nodes.phone
    var send = self.nodes.send
    var sendState = self.nodes.sendState

    send.on('click', function () {
      sendState.removeClass('fulfilled')
      var params = {
        mobileNum: phone.val(),
        smsType: '4'
      }

      self.fairy.loader.post('code', params)
        .then(function (data) {
          if (data.result == "sended") {
            setTimeout(function () {
              sendState.addClass('fulfilled')
            }, 500)

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
      verifyState.removeClass('fulfilled')
      var params = {
        mobile: self.nodes.phone.val(),
        message: code.val()
      }

      self.fairy.loader.post('check', params)
        .then(function (data) {
          if (data.result.status == '1') {
            setTimeout(function () {
              verifyState.addClass('fulfilled')
            }, 500)

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

    var nodes = self.nodes

    var checkboxs = nodes.checkboxs
    var identify = nodes.identify
    var identifyState = nodes.identifyState

    identify.on('click', function () {
      if (cache.sid.length === 0) return false

      identifyState.removeClass('fulfilled')

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
          setTimeout(function () {
            identifyState.addClass('fulfilled')
          }, 500)

          identifyState.attr('data-show', message.data.token)
          cache.token = message.data.token
        } else {
          nodes.image.trigger('dblclick')
        }
      }.bind(self))
    })
  },

  bookBind: function () {
    var self = this

    var book = self.nodes.book
    var bookState = self.nodes.bookState

    book.on('click', function () {
      var check = self.fairy.loader.guard()

      if (check.result) {
        bookState.removeClass('fulfilled')

        self.fairy.loader.final(function () {
          bookState.addClass('fulfilled')
        })
      } else {
        self.recordsRender(check.success, check.failed)
        return false
      }

    })
  },

  append: function (needVerify) {
    var self = this

    var nodes = self.nodes

    var root = Stamp.$('<div class="orderRoot"></div>')
    nodes.root = root

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

    sections[0].append(nodes.tip)
    sections[0].hide()

    if (needVerify) {
      sections[1].append(nodes.phone)
      sections[1].append(nodes.send)
      nodes.send.after(nodes.sendState)
    }

    if (needVerify) {
      sections[2].append(nodes.code)
      sections[2].append(nodes.verify)
      nodes.verify.after(nodes.verifyState)
    }

    sections[3].append(nodes.answer)

    sections[4].append(nodes.identify)
    nodes.identify.after(nodes.identifyState)

    sections[5].append(nodes.book)
    nodes.book.after(nodes.bookState)

    Stamp.$.each(sections, function (index, section) {
      root.append(section)
    })

    self.fairy.panel.nodes.container.append(root)
  }
})

module.exports = Order