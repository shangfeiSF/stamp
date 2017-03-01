function Base(fairy) {
  this.fairy = fairy

  this.nodes = {
    /* render add */
    root: null,

    checkboxs: [],

    count: null,
    specs: null,

    purchase: null,
    add2MyCart: null,
    showMyCart: null,

    notes: null
  }

  this.schedule = {
    message: '',
    sid: '',
    token: ''
  }

  this.init()
}

Stamp.$.extend(
  Base.prototype,
  {
    init: function () {
      this.render()
      this.bind()
      this.append()
    },

    render: function () {
      this.send_render()
      this.storeCode_render()
      this.imageVerification_render()
      this.schedule_render()

      this.count_render()
      this.specs_render()
      this.purchase_render()
      this.add2MyCart_render()
      this.showMyCart_render()
    },

    bind: function () {
      this.send_bind()
      this.storeCode_bind()
      this.imageVerification_bind()
      this.schedule_bind()

      this.count_bind()
      this.specs_bind()
      this.purchase_bind()
      this.add2MyCart_bind()
      this.showMyCart_bind()
    },

    append: function () {
      var self = this
      var nodes = self.nodes

      var sections = [
        'sendSection',
        'storeCodeSection',
        'imageVerificationSection',
        'specsSection',
        'countSection',
        'scheduleSection',
        'normalSection'
      ]

      sections = Stamp.$.map(sections, function (klass) {
        return Stamp.$('<div>', {
          class: ['section', klass].join(' ')
        })
      })

      sections[0].append(Stamp.$('<div class="title">').text('配置验证码'))
      sections[0].append(nodes.phone)
      sections[0].append(nodes.send)
      nodes.send.after(nodes.sendState)

      sections[1].append(nodes.code)
      sections[1].append(nodes.storeCode)
      nodes.storeCode.after(nodes.storeCodeState)

      sections[2].append(Stamp.$('<div class="title">').text('验证图片'))
      sections[2].append(nodes.image)
      sections[2].append(nodes.answer)

      sections[3].append(Stamp.$('<div class="title">').text('选择规格和数量'))
      sections[3].append(nodes.specs)
      sections[4].append(nodes.count)

      sections[5].append(Stamp.$('<div class="title">').text('秒杀步骤'))
      sections[5].append(nodes.verify)
      sections[5].append(nodes.verifyState)
      sections[5].append(nodes.identify)
      sections[5].append(nodes.identifyState)
      sections[5].append(nodes.rushPurchase)

      sections[6].append(Stamp.$('<div class="title">').text('常规购买'))
      sections[6].append(nodes.purchase)
      sections[6].append(nodes.add2MyCart)
      sections[6].append(nodes.showMyCart)

      var root = Stamp.$('<div class="baseRoot"></div>')
      Stamp.$.each(sections, function (index, section) {
        root.append(section)
      })

      nodes.root = root
      self.fairy.panel.nodes.tabBlocks[self.fairy.layout.baseBlock.anchor].append(root)
    }
  },
  {
    send_render: function () {
      var self = this

      // var phone = Stamp.$('<select>', {
      //   style: 'width: 11em;'
      // }).addClass('form-control')
      // Stamp.$.each(self.fairy.mobiles, function (index, mobile) {
      //   var optionConfig = {
      //     value: mobile
      //   }
      //   index === 0 && (optionConfig.selected = 'selected')
      //   phone.append(Stamp.$('<option>', optionConfig).text(mobile))
      // })

      var phone = Stamp.$('<input>', {
        style: 'width: 11em;'
      }).addClass('form-control')

      var send = Stamp.$('<input>', {
        type: 'button',
        value: '获取验证码'
      }).addClass('btn btn-info')
      var sendState = Stamp.$('<span class="state">')

      self.nodes.phone = phone
      self.nodes.send = send
      self.nodes.sendState = sendState
    },

    storeCode_render: function () {
      var self = this

      var storedMessage = self.fairy.storage.get('message')
      var code = Stamp.$('<input>', {
        type: 'text',
        value: storedMessage !== undefined ? storedMessage : '',
        style: 'width: 11em;'
      }).addClass('form-control')
      var storeCode = Stamp.$('<input>', {
        type: 'button',
        value: '配置验证码'
      }).addClass('btn btn-info')
      var storeCodeState = Stamp.$('<span class="state">')

      self.nodes.code = code
      self.nodes.storeCode = storeCode
      self.nodes.storeCodeState = storeCodeState
    },

    imageVerification_render: function () {
      var self = this

      var nodes = self.nodes

      var image = Stamp.$('<img class="verifyImage">')

      Stamp.probe.execute('getSid', {}, function (message) {
        self.schedule.sid = message.data.sid

        nodes.image.attr('src', [self.fairy.imageBase, "&sid=", message.data.sid, "&", Math.random()].join(''))
        Stamp.$.each(nodes.checkboxs, function (index, checkbox) {
          Stamp.$(checkbox).attr('checked', false)
        })
      }.bind(self))

      var answer = Stamp.$('<div class="checkboxs">')
      var wraps = self.fairy.buildAnswerBox('_rush_answer_')

      wraps.forEach(function (wrap) {
        nodes.checkboxs.push(wrap.find('input[type="checkbox"]'))
        answer.append(wrap)
      })

      nodes.image = image
      nodes.answer = answer
    },

    schedule_render: function () {
      var self = this

      var nodes = self.nodes

      var verify = Stamp.$('<input>', {
        type: 'button',
        class: 'verify',
        value: '验证验证码'
      }).addClass('btn btn-warning')
      var verifyState = Stamp.$('<span class="state">').css({
        top: '0.9em',
        margin: '0 0.5em'
      })

      var identify = Stamp.$('<input>', {
        type: 'button',
        class: 'identify',
        value: '验证图片'
      }).addClass('btn btn-warning')
      var identifyState = Stamp.$('<span class="state">').css({
        top: '0.9em',
        margin: '0 0.5em'
      })

      var rushPurchase = Stamp.$('<input>', {
        type: 'button',
        class: 'batch2MyCart',
        value: '一键购买'
      }).addClass('btn btn-info')

      self.nodes.verify = verify
      self.nodes.verifyState = verifyState

      nodes.identify = identify
      nodes.identifyState = identifyState

      nodes.rushPurchase = rushPurchase
    },

    count_render: function () {
      var self = this

      var count = Stamp.$('<input>', {
        type: 'number',
        min: 1,
        value: 1
      })

      self.nodes.count = count
    },

    specs_render: function () {
      var self = this

      var cache = self.fairy.cache
      var details = self.fairy.details

      var count = self.nodes.count

      var specs = Stamp.$('<div class="specs"></div>')

      Stamp.$.each(details.goodsAttrList, function (index, attr) {
        var wrap = Stamp.$('<sapn class="spec"></sapn>')

        var id = ['_sepc_', index].join('')

        var spec = Stamp.$('<input>', {
          type: 'radio',
          id: id,
          name: 'spec',
          value: index,
        }).data('info', attr)

        var label = Stamp.$('<label>', {
          for: id
        }).text(attr.attrName)

        if (index == 0) {
          spec.attr('checked', 'checked')
          label.addClass('selected')

          count.attr('max', attr.buyLimit)

          cache.specIndex = index
          cache.buyLimit = attr.buyLimit

          var limit = ['(购买数量上限：', attr.buyLimit, ')'].join('')
          count.after(Stamp.$('<span>').text(limit))
        }

        wrap.append(spec).append(label)

        specs.append(wrap)
      })

      self.nodes.specs = specs
    },

    purchase_render: function () {
      var self = this

      var purchase = Stamp.$('<input>', {
        type: 'button',
        value: '立即购买'
      }).addClass('btn btn-success')

      self.nodes.purchase = purchase
    },

    add2MyCart_render: function () {
      var self = this

      var add2MyCart = Stamp.$('<input>', {
        type: 'button',
        value: '加入购物车'
      }).addClass('btn btn-success')

      self.nodes.add2MyCart = add2MyCart
    },

    showMyCart_render: function () {
      var self = this

      var showMyCart = Stamp.$('<input>', {
        type: 'button',
        value: '我的购物车'
      }).addClass('btn btn-info')

      self.nodes.showMyCart = showMyCart
    },
  },
  {
    send_bind: function () {
      var self = this

      var phone = self.nodes.phone
      var send = self.nodes.send
      var sendState = self.nodes.sendState
      var code = self.nodes.code

      send.on('click', function () {
        self._changeReffer('buyNow')

        sendState.removeClass('fulfilled')
        sendState.addClass('pending')
        var params = {
          mobileNum: phone.val(),
          smsType: '4'
        }

        self.fairy.storage.remove('mobile')
        code.val('')

        self.fairy.post('code', params)
          .then(function (data) {
            if (data.result == "sended") {
              setTimeout(function () {
                sendState.removeClass('pending')
                sendState.addClass('fulfilled')
              }, 500)

              self.fairy.storage.update('mobile', phone.val())
            } else {
              sendState.removeClass('pending')
              alert(data.result)
            }
          })
      })
    },

    storeCode_bind: function () {
      var self = this

      var code = self.nodes.code
      var storeCode = self.nodes.storeCode
      var storeCodeState = self.nodes.storeCodeState

      storeCode.on('click', function () {
        if (code.val().length) {
          storeCodeState.removeClass('fulfilled')
          storeCodeState.addClass('pending')

          self.fairy.storage.update('message', code.val())

          setTimeout(function () {
            storeCodeState.removeClass('pending')
            storeCodeState.addClass('fulfilled')
          }, 500)
        }
      })
    },

    imageVerification_bind: function () {
      var self = this

      var nodes = self.nodes

      nodes.image.on('dblclick', function () {
          self._changeReffer('buyNow')
          nodes.image.attr('src', [self.fairy.imageBase, "&sid=", self.schedule.sid, "&", Math.random()].join(''))
          Stamp.$.each(nodes.checkboxs, function (index, checkbox) {
            Stamp.$(checkbox).attr('checked', false)
          })
        }
      )
    },

    schedule_bind: function () {
      var self = this

      var nodes = self.nodes

      nodes.verify.on('click', function () {
        var mobileInStore = self.fairy.storage.get('mobile')
        var messageInStore = self.fairy.storage.get('message')

        if (mobileInStore && messageInStore) {
          var verifyState = nodes.verifyState

          verifyState.removeClass('fulfilled')
          verifyState.addClass('pending')

          var params = {
            mobile: mobileInStore,
            message: messageInStore
          }

          self._changeReffer('buyNow')

          self.fairy.post('check', params)
            .then(function (data) {
              if (data.result.status == '1') {
                setTimeout(function () {
                  verifyState.removeClass('pending')
                  verifyState.addClass('fulfilled')
                }, 500)

                self.schedule.message = data.result.random_code
              } else {
                verifyState.removeClass('pending')
                alert(data.result.msg)
              }
            })
        }
      })

      nodes.identify.on('click', function () {
        if (self.schedule.sid.length === 0) return false

        nodes.identifyState.removeClass('fulfilled')
        nodes.identifyState.addClass('pending')

        var checked = Stamp.$.grep(nodes.checkboxs, function (checkbox) {
          return Stamp.$(checkbox).attr('checked') === 'checked'
        })
        var postions = Stamp.$.map(checked, function (checkbox) {
          return Stamp.$(checkbox).val()
        })

        var verifyURL = 'http://jiyou.11185.cn/l/verify.html?'
        var params = {
          wid: '3be16628-c630-437b-b443-c4d9f18602ed',
          answer: postions.join(','),
          sid: self.schedule.sid,
          checkCode: encodeURIComponent('user=zhangsan&stamp_id=123'),
        }

        Stamp.$.each(params, function (key, value) {
          verifyURL += [key, '=', value].join('') + '&'
        })

        self._changeReffer('buyNow')
        Stamp.probe.execute('getToken', {
          verifyURL: verifyURL + Math.random()
        }, function (message) {
          if (message.data.token !== 'ERROR') {
            setTimeout(function () {
              nodes.identifyState.removeClass('pending')
              nodes.identifyState.addClass('fulfilled')
            }, 500)

            self.schedule.token = message.data.token
          } else {
            nodes.identifyState.removeClass('pending')
            nodes.image.trigger('dblclick')
          }
        }.bind(self))
      })

      nodes.rushPurchase.on('click', function () {
        if (!self.schedule.message.length || !self.schedule.token.length) {
          return false
        }
        self.nodes.purchase.trigger('click', self._copyAndCleanSchedule())
      })
    },

    count_bind: function () {
      var self = this

      self.nodes.count.on('change', function () {
        var target = Stamp.$(this)
        var max = +target.attr('max')

        Number(target.val()) > max && target.val(String(max))
      })
    },

    specs_bind: function () {
      var self = this

      var cache = self.fairy.cache

      var nodes = self.nodes

      nodes.specs.on('change', function (e) {
        var target = Stamp.$(e.target)

        Stamp.$.each(Stamp.$(this).find('label'), function (index, node) {
          var node = Stamp.$(node)

          node.removeClass('selected')

          node.attr('for').split('_').pop() === target.val() && node.addClass('selected')
        })

        nodes.count.attr('max', Number(target.data('info').buyLimit))

        cache.specIndex = target.val()
        cache.buyLimit = target.data('spec').buyLimit
      })
    },

    purchase_bind: function () {
      var self = this

      var cache = self.fairy.cache
      var details = self.fairy.details

      var nodes = self.nodes
      var purchase = nodes.purchase
      var count = nodes.count

      purchase.on('click', function (e, schedule) {
        self._changeReffer('ticketDetail')

        var panelNodes = self.fairy.panel.nodes
        var anchor = self.fairy.layout.baseSettleBlock.anchor

        panelNodes.tabBlocks[anchor].empty()
        panelNodes.tabBlocks[anchor].append(Stamp.$('<div class="loading">').text('生成订单中...'))
        panelNodes.tabBlockTriggers[anchor].trigger('click')

        var params = {
          'buyGoodsNowBean.goods_id': self.fairy.cache.goodsId,
          'buy_type': details.goodsStatus.lottery ? '3' : '2',
          'buyGoodsNowBean.goods_attr_id': details.goodsAttrList[cache.specIndex].id,
          'buyGoodsNowBean.goods_num': count.val(),
          'goodsTicketAttr': details.goodsAttrList[cache.specIndex].id
        }

        self.fairy.post('buy', params)
          .then(function (data) {
            if (data.result.search('date_form') > -1 && data.result.search('gwc gwc2') > -1) {
              cache.html4order = data.result
              cache.count = count.val()

              var needVerify = data.result.search('手机确认') > -1 ? true : false

              self._changeReffer('buyNow')
              self.fairy.baseSettle.init(needVerify, schedule)
            }
          })
      })
    },

    add2MyCart_bind: function () {
      var self = this

      var cache = self.fairy.cache
      var details = self.fairy.details

      var nodes = self.nodes
      var count = nodes.count
      var add2MyCart = nodes.add2MyCart

      add2MyCart.on('click', function () {
        self._changeReffer('ticketDetail')

        self.fairy.post('user')
          .asCallback(function (error, data) {
            if (data.textStatus === 'success') {
              cache.userType = data.result.userType
              cache.userId = data.result.userId

              var mock = {
                _origScriptSessionId: self.fairy.get_origScriptSessionId()
              }

              ShoppingCartAction.addGoodsToShoppingCartLS(details.goodsId, count.val(), details.goodsAttrList[cache.specIndex].id, function (msg) {
                self._addRecords(msg)
              }, mock)
            }
          })
      })
    },

    showMyCart_bind: function () {
      var self = this

      var nodes = self.nodes
      var showMyCart = nodes.showMyCart

      showMyCart.on('click', function () {
        self._changeReffer('ticketDetail')

        var panelNodes = self.fairy.panel.nodes
        var anchor = self.fairy.layout.cartBlock.anchor

        panelNodes.tabBlockTriggers[anchor].trigger('click')
        self.fairy.cart._getShowPage()
      })
    },
  },
  {
    _changeReffer: function (state) {
      var MAP = {
        'ticketDetail': window.location.href,
        'buyNow': 'http://jiyou.retail.11185.cn/retail/initPageForBuyNow.html'
      }
      Stamp.probe.execute('changeReffer', {
        currentReffer: MAP[state]
      })
    },

    _addRecords: function (msg) {
      var self = this

      var cache = self.fairy.cache
      var details = self.fairy.details

      var nodes = self.nodes
      var root = self.nodes.root

      var notes = nodes.notes ? nodes.notes : Stamp.$('<div class="notes">')

      var index = notes.children('.note').length + 1
      var note = Stamp.$('<div>').addClass('note').append(Stamp.$('<span class="sequence"></span>').text(index + '. '))

      var matches = msg.match(/^\[(.*)\]$/)
      matches && matches.length == 2 && (matches = matches.pop())

      var params = matches.split(',')
      var klass = params[0] === "'true'" ? 'success' : 'failed'
      var content = params[0] === "'true'" ?
        [details.goodsAttrList[cache.specIndex].attrName, '（', self.nodes.count.val(), '）'].join('') :
        String(params[1]).slice(1, -1)

      note.append(Stamp.$('<span>').addClass(klass).text(content))

      notes.append(note)

      if (!nodes.notes) {
        notes.prepend(Stamp.$('<div class="title">加入购物车记录</div>'))

        self.nodes.notes = notes

        root.append(notes)
      }
    },

    _copyAndCleanSchedule: function () {
      var self = this

      var schedule = {
        userType: self.fairy.storage.get('userType'),
        userId: self.fairy.storage.get('userId'),
        code: self.fairy.storage.get('message'),
        mobile: self.fairy.storage.get('mobile'),
        message: self.schedule.message,
        sid: self.schedule.sid,
        token: self.schedule.token
      }

      self.schedule = {
        message: '',
        sid: '',
        token: ''
      }

      return schedule
    },

    _reset: function () {
      var self = this

      var nodes = self.nodes

      self.fairy.storage.remove('mobile')
      self.fairy.storage.remove('message')

      nodes.code.val('')

      nodes.verifyState.removeClass('fulfilled')
      nodes.identifyState.removeClass('fulfilled')

      Stamp.probe.execute('getSid', {}, function (message) {
        self.schedule.sid = message.data.sid

        nodes.image.attr('src', [self.fairy.imageBase, "&sid=", message.data.sid, "&", Math.random()].join(''))
      }.bind(self))

      Stamp.$.each(nodes.checkboxs, function (index, checkbox) {
        Stamp.$(checkbox).attr('checked', false)
      })
    },
  }
)

module.exports = Base