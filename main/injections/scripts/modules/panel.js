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
    '17600808607'
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

    self.boot()
  },

  boot: function () {
    var self = this

    self.boot_goods_render()
    self.boot_carts_render()
    self.boot_specs_render()

    self.boot_goods_bind()
    self.boot_carts_bind()
    self.boot_specs_bind()

    self.boot_append()
  },

  boot_goods_render: function () {
    var self = this

    var explain = Stamp.$('<span class="tip">')
      .css({
        color: '#aaa',
        'line-height': '150%'
      })
      .text('提示：选择规格和数量后生成快速订单')

    var count = Stamp.$('<input>', {
      type: 'number',
      min: 1,
      id: '_count_',
      value: 1
    }).css({
      width: '4em',
      margin: '0 0.5em 0 0',
      'text-aligen': 'center'
    })

    var goods = Stamp.$('<input>', {
      type: 'button',
      id: '_goods_',
      value: '立即购买'
    }).addClass('btn btn-success')

    self.nodes.explain = explain
    self.nodes.count = count
    self.nodes.goods = goods
  },

  boot_carts_render: function () {
    var self = this

    var carts = Stamp.$('<input>', {
      type: 'button',
      id: '_carts_',
      value: '加入购物车'
    }).addClass('btn btn-warning')
    var mycart = Stamp.$('<input>', {
      type: 'button',
      id: '_mycart_',
      value: '我的购物车'
    }).addClass('btn btn-info')

    self.nodes.carts = carts
    self.nodes.mycart = mycart
  },

  boot_mycart_render: function () {
  },

  boot_specs_render: function () {
    var self = this

    var cache = self.fairy.cache
    var details = self.fairy.details

    var specs = Stamp.$('<div class="specs"></div>')

    Stamp.$.each(details.goodsAttrList, function (index, attr) {
      var wrap = Stamp.$('<sapn class="specItem"></sapn>')

      var spec = Stamp.$('<input>', {
        id: ['_sepc', index].join('-'),
        name: 'spec',
        type: 'radio',
        value: index,
      }).data('spec', attr)

      var label = Stamp.$('<label>', {
        for: ['_sepc', index].join('-')
      }).text(attr.attrName)

      if (index == 0) {
        spec.attr('checked', 'checked')
        label.addClass('selected')
        self.nodes.count.attr('max', attr.buyLimit)

        cache.specIndex = index
        cache.buyLimit = attr.buyLimit
      }

      wrap.append(spec).append(label)

      specs.append(wrap)
    })

    self.nodes.specs = specs
  },

  boot_notes_render: function (msg) {
    var self = this

    var cache = self.fairy.cache
    var details = self.fairy.details

    var nodes = self.nodes

    var notes = nodes.notes ? nodes.notes : Stamp.$('<div class="notes" id="_notes_">')

    var index = notes.children('.note').length + 1
    var note = Stamp.$('<div>', {
      id: ['_note', index].join('-')
    }).addClass('note').append(Stamp.$('<span class="sequence"></span>').text(index + '. '))

    var matches = msg.match(/^\[(.*)\]$/)
    matches && matches.length == 2 && (matches = matches.pop())

    var params = matches.split(',')
    var klass = params[0] === "'true'" ? 'success' : 'failed'
    var content = params[0] === "'true'" ?
      [details.goodsAttrList[cache.specIndex].attrName, '（', nodes.count.val(), '）'].join('') :
      String(params[1]).slice(1, -1)

    note.append(Stamp.$('<span>').addClass(klass).text(content))

    notes.append(note)

    if (!nodes.notes) {
      self.nodes.notes = notes

      nodes.boot.after(notes)
      notes.prepend(Stamp.$('<div class="title">加入购物车记录</div>'))
    }
  },

  boot_goods_bind: function () {
    var self = this

    var cache = self.fairy.cache
    var details = self.fairy.details

    var goods = self.nodes.goods
    var count = self.nodes.count

    count.on('change', function () {
      var target = Stamp.$(this)
      var max = +target.attr('max')

      Number(target.val()) > max && target.val(String(max))
    })

    goods.on('click', function () {
      var params = {
        'buyGoodsNowBean.goods_id': self.fairy.cache.goodsId,
        'buy_type': details.goodsStatus.lottery ? '3' : '2',
        'buyGoodsNowBean.goods_attr_id': details.goodsAttrList[cache.specIndex].id,
        'buyGoodsNowBean.goods_num': count.val(),
        'goodsTicketAttr': details.goodsAttrList[cache.specIndex].id
      }

      self.fairy.loader.post('buy', params)
        .then(function (data) {
          if (data.result.search('date_form') > -1 && data.result.search('gwc gwc2') > -1) {
            goods.off()

            self.nodes.boot.hide()
            count.attr('disabled', 'disabled').hide()

            cache.html = data.result
            cache.count = count.val()

            var needVerify = data.result.search('手机确认') > -1 ? true : false

            self.fairy.loader.init(needVerify)
          }
        })
    })
  },

  boot_carts_bind: function () {
    var self = this

    var nodes = self.nodes
    var loader = self.fairy.loader

    var cache = self.fairy.cache
    var details = self.fairy.details

    var count = nodes.count

    nodes.carts.on('click', function () {
      loader.post('user')
        .asCallback(function (error, data) {
          if (data.textStatus === 'success') {
            cache.userType = data.result.userType
            cache.userId = data.result.userId

            ShoppingCartAction.addGoodsToShoppingCartLS(details.goodsId, count.val(), details.goodsAttrList[cache.specIndex].id, function (msg) {
              self.boot_notes_render(msg)
            })
          }
        })
    })

    nodes.mycart.on('click', function () {
      
    })
  },

  boot_mycart_bind: function () {
  },

  boot_specs_bind: function () {
    var self = this

    var cache = self.fairy.cache
    var count = self.nodes.count

    self.nodes.specs.on('change', function (e) {
      var target = Stamp.$(e.target)

      Stamp.$.each(Stamp.$(this).find('label'), function (index, node) {
        var node = Stamp.$(node)

        node.removeClass('selected')
        if (node.attr('for').split('-').pop() === target.val()) {
          node.addClass('selected')
        }
      })

      count.attr('max', Number(target.data('spec').buyLimit))
      cache.specIndex = target.val()
      cache.buyLimit = target.data('spec').buyLimit
    })
  },

  boot_append: function () {
    var self = this
    var nodes = self.nodes

    var areas = [
      'specsArea',
      'countArea',
      'cartsArea',
      'goodsArea'
    ]

    areas = Stamp.$.map(areas, function (klass) {
      return Stamp.$('<div>', {
        class: ['area', klass].join(' ')
      })
    })

    areas[0].append(nodes.specs)
    areas[1].append(nodes.count)
    areas[2].append(nodes.carts)
    areas[3].append(nodes.goods)

    var boot = Stamp.$('<div class="boot"></div>')
    Stamp.$.each(areas, function (index, area) {
      boot.append(area)
    })
    boot.prepend(nodes.explain)

    nodes.boot = boot
    nodes.container.append(boot)

    nodes.specs.before(Stamp.$('<div class="title"></div>').text('邮票规格：'))
    nodes.count.before(Stamp.$('<div class="title"></div>').text('订购数量：'))
    var limit = ['(购买数量上限：', self.fairy.cache.buyLimit, ')'].join('')
    nodes.count.after(Stamp.$('<span></span>').css({
      color: '#aaa'
    }).text(limit))
  },

  create: function (state, needVerify) {
    var self = this

    self.create_tips_render(state)
    if (needVerify) {
      self.create_send_render()
      self.create_verify_render()
    }

    self.create_mock_render()
    self.create_identify_render()
    self.create_book_render()

    if (needVerify) {
      self.create_send_bind()
      self.create_verify_bind()
    }
    self.create_identify_bind()
    self.create_book_bind()

    self.create_append(needVerify)
  },

  create_tips_render: function (state) {
    var self = this

    state.validity = true;
    (state.message1 && state.message1 === '商品已售完') && (state.validity = false);
    (state.message2 && state.message2 === '库存不足') && (state.validity = false);

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

  create_send_render: function () {
    var self = this

    var phone = Stamp.$('<select>', {
      id: '_phone_',
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
      id: '_send_',
      value: '获取验证码'
    }).addClass('btn btn-info')
    var sendState = Stamp.$('<span class="state">')

    self.nodes.phone = phone
    self.nodes.send = send
    self.nodes.sendState = sendState
  },

  create_verify_render: function () {
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

  create_mock_render: function () {
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

  create_identify_render: function () {
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

  create_book_render: function () {
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

  create_records_render: function (success, failed) {
    var self = this
    var nodes = self.nodes

    var recordsSection = nodes.recordsSection ? nodes.recordsSection : Stamp.$('<div class="section recordsSection" id="_records_">')

    var index = recordsSection.children().length + 1
    var record = Stamp.$('<div>', {
      id: ['_record', index].join('-')
    }).addClass('record').append(Stamp.$('<div class="sequence"></div>').text('第' + index + '提交：'))

    Stamp.$.each(success, function (i, msg) {
      var klass = msg ? 'success' : 'failed'
      var content = msg ? msg : failed[i]
      record.append(Stamp.$('<div>').addClass(klass).text(content))
    })

    recordsSection.append(record)

    if (!nodes.recordsSection) {
      self.nodes.recordsSection = recordsSection

      nodes.container.find('.section:last').after(recordsSection)
      recordsSection.before(Stamp.$('<div class="title">提交记录</div>'))
    }
  },

  create_send_bind: function () {
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

  create_verify_bind: function () {
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

  create_identify_bind: function () {
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

  create_book_bind: function () {
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
        self.create_records_render(check.success, check.failed)
        return false
      }

    })
  },

  create_append: function (needVerify) {
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

    var wrap = Stamp.$('<div class="sections"></div>')
    Stamp.$.each(sections, function (index, section) {
      wrap.append(section)
    })

    container.append(wrap)
  }
})

module.exports = Panel