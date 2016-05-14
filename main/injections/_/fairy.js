function Panel() {
  this.patterns = {
    location: /http:\/\/jiyou\.biz\.11185\.cn\/retail\/ticketDetail\_(\d+)\.html/
  }

  this.ids = {
    panel: '_panel_',
    trigger: '_trigger_',
    container: '_container_',
    loginForm: '_loginForm_',
    loginImage: '_loginImage_'
  }

  this.details = {}

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
    panel: null,
    trigger: null,

    container: null,

    addressRadios: [],
    fareListSection: null,
    fareRadios: [],

    PriceSection: null,

    image: null,
    checkboxs: []
  }

  this.cache = {
    goodsId: '',

    userType: '',
    userId: '',

    mobile: '',
    message: '',

    sid: '',
    token: '',

    canGetFare: false,
    address: [],
    addressId: '',
    fare: [],
    fareId: '',

    shopId: '',
    goodsListIndex: '',
    sendFlag: '',
    orderTotalWeigth: '',
  }

  this.finalPostData = {}

  if (this.search()) {
    this.draw()
    this.boot()
  }
}

Stamp.$.extend(Panel.prototype, {
  search: function () {
    var self = this

    var match = window.location.href.match(self.patterns.location)

    if (!(match && match.length == 2)) return false

    self.cache.goodsId = match.pop()

    var scripts = Stamp.$.grep(Stamp.$('#data').find('script'), function (script) {
      return Stamp.$(script).attr('src') === undefined && Stamp.$(script).attr('type') === 'text/javascript'
    })
    scripts.length && (scripts = Stamp.$(scripts.shift()))

    var parts = scripts.text().split(';')

    parts = Stamp.$.grep(parts, function (part) {
      return part.length && part.search(/jQuery\(\"\#data\"\)/) > -1
    })

    self.dig(parts)

    return true
  },

  dig: function (parts) {
    var self = this

    var originalDetails = []
    Stamp.$.each(parts, function (index, part) {
      var parse = part.match(/.*jQuery\(\"\#data\"\)\.data\(\"(.*?)\"\,\"?(.*?)\"?\)$/)
      parse && parse.length === 3 && (originalDetails.push({
        key: parse[1],
        value: parse[2]
      }))
    })

    var convertList = ['goodsStatus', 'goodsShowInfo', 'goodsAttrList']
    Stamp.$.each(originalDetails, function (index, detail) {
      self.details[detail.key] = convertList.indexOf(detail.key) > -1 ? JSON.parse(detail.value) : detail.value
    })
  },

  draw: function () {
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

  boot: function () {
    var self = this

    Stamp.$.ajax({
      type: "POST",
      url: "JSONGetUserInfoByUserId.html",
      success: function (result) {
        if (result == null) {
          return
        }
        self.cache.userType = result.userType
        self.cache.userId = result.userId

        self.admen()
      },
      dataType: 'json'
    })
  },

  admen: function () {
    var self = this

    var params = {
      ticketAttr: self.details.goodsAttrList[0].id,
      userId: self.cache.userId,
      ticketId: self.details.goodsShowInfo.id
    }

    Stamp.$.post('JSONGetBuyLimitById.html', params, function (result) {
      var result = JSON.parse(result)
      self.details.goodsAttrList[0].buyLimit = result.buyLimit

      Stamp.$.ajax({
        type: "POST",
        url: "JSONGetMessage.html",
        data: "ticketAttr=" + self.details.goodsAttrList[0].id + "&goodsNum=1",
        success: function (object) {
          self.init(object)
        },
        dataType: 'json'
      })
    })
  },

  login: function () {
    var self = this

    var loginImageBase = 'http://passport.11185.cn/cas/captcha.htm?t='

    var loginForm = Stamp.$('<form>', {
      method: 'post',
      action: 'https://passport.11185.cn/cas/tlogin?service=http://jiyou.biz.11185.cn'
    })
    var username = Stamp.$('<input>', {
      type: 'text',
      name: 'username',
      value: '18612697359'
    })
    var password = Stamp.$('<input>', {
      type: 'text',
      name: 'password',
      value: 'yangyemeng881207'
    })
    var code = Stamp.$('<input>', {
      type: 'text',
      name: 'code',
      value: ''
    })
    var submit = Stamp.$('<input>', {
      type: 'button',
      value: '登陆'
    })

    submit.on('click', function () {
      loginForm.submit()
      setTimeout(function () {
        window.location.href = 'http://jiyou.biz.11185.cn/'
      }, 200)
    })

    loginForm.append(username)
    loginForm.append(password)
    loginForm.append(code)
    loginForm.append(submit)

    var loginImage = Stamp.$('<img>', {
      id: self.ids.loginImage,
      src: loginImageBase + new Date().getTime(),
      width: '60',
      height: '27'
    })

    loginImage.on('click', function () {
      Stamp.$(this).attr('src', loginImageBase + new Date().getTime())
    })

    self.nodes.container.append(loginImage)
    self.nodes.container.append(loginForm)
  },

  init: function (state) {
    var self = this

    var state = state
    state.validity = true;
    (state.message1 && state.message1 === '商品已售完') && (state.validity = false);
    (state.message2 && state.message2 === '库存不足') && (state.validity = false);

    var limit = self.details.goodsAttrList[0].buyLimit

    var explain = Stamp.$('<span class="tip">').css('color', '#555')
    explain.text('提示：根据购买限制选择购买数量，生成快速订单后无法修改数量')
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

    var result = Stamp.$('<div class="checkboxs">')
    self.nodes.result = result
    var checkboxsConfig = [
      [40, 40],
      [110, 40],
      [180, 40],
      [250, 40],
      [40, 120],
      [110, 120],
      [180, 120],
      [250, 120],
    ]
    Stamp.$.each(checkboxsConfig, function (index, config) {
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
      result.append(wrap)
    })

    var identify = Stamp.$('<input>', {
      type: 'button',
      id: '_identify_',
      value: '图片验证'
    })
    var identifyState = Stamp.$('<span class="state">')

    goods.on('click', function () {
      Stamp.$.ajax({
        type: "POST",
        url: "/retail/initPageForBuyNow.html",
        data: {
          'buyGoodsNowBean.goods_id': self.cache.goodsId,
          'buy_type': self.details.goodsStatus.lottery ? '3' : '2',
          'buyGoodsNowBean.goods_attr_id': self.details.goodsAttrList[0].id,
          'buyGoodsNowBean.goods_num': count.val(),
          'goodsTicketAttr': self.details.goodsAttrList[0].id
        },
        success: function (html) {
          if (html.search('date_form') > -1 && html.search('gwc gwc2') > -1) {
            goods.off()
            goods.parent().hide()

            self.cache.html = html

            count.attr('disabled', 'disabled').hide()
            self.cache.count = count.val()

            self.getSid()
          }
        },
        dataType: 'html'
      })
    })

    send.on('click', function () {
      Stamp.$.ajax({
        type: "POST",
        url: "/v/sendMessage.html",
        data: {
          mobileNum: phone.val(),
          smsType: '4'
        },
        dataType: 'html',
        async: false,
        success: function (data) {
          if (data == "sended") {
            sendState.toggleClass('fulfilled')
            debugger
            self.cache.mobile = phone.val()
          } else {
            alert(data)
          }
        }
      })
    })

    verify.on('click', function () {
      Stamp.$.ajax({
        type: "POST",
        url: "/book/jsonCheckMobile.html",
        data: {
          mobile: phone.val(),
          message: code.val()
        },
        dataType: "json",
        async: false,
        success: function (result) {
          if (result.status == '1') {
            verifyState.toggleClass('fulfilled')
            verifyState.attr('data-show', result.random_code)
            self.cache.message = result.random_code
          } else {
            alert(result.msg)
          }
        }
      })
    })

    identify.on('click', function () {
      if (self.cache.sid.length === 0) return false

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
        sid: self.cache.sid,
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
          self.cache.token = message.data.token

          self.final()
        }
      }.bind(self))
    })

    self.nodes.container.append('<div class="section"></div>')
    var section = self.nodes.container.find('.section:last')
    section.append(explain)
    section.append(count)
    section.append(goods)
    section.append(tip)

    self.nodes.container.append('<div class="section"></div>')
    var section = self.nodes.container.find('.section:last')
    section.append(phone)
    section.append(send)
    send.after(sendState)

    self.nodes.container.append('<div class="section"></div>')
    var section = self.nodes.container.find('.section:last')
    section.append(code)
    section.append(verify)
    verify.after(verifyState)

    self.nodes.container.append('<div class="section"></div>')
    var section = self.nodes.container.find('.section:last')
    section.append(result)

    self.nodes.container.append('<div class="section"></div>')
    var section = self.nodes.container.find('.section:last')
    section.append(identify)
    identify.after(identifyState)
  },

  getSid: function () {
    var self = this
    var imageBase = 'http://jiyou.11185.cn/l/captcha.html?wid=3be16628-c630-437b-b443-c4d9f18602ed'

    Stamp.probe.execute('getSid', {}, function (message) {
      self.cache.sid = message.data.sid
      self.cache.image = message.data.image

      if (self.nodes.image === null) {
        var image = Stamp.$('<img>', {
          src: self.cache.image
        })

        image.on('dblclick', function () {
          self.nodes.image.attr('src', [imageBase, "&sid=", self.cache.sid, "&", Math.random()].join(''))
        })

        self.nodes.image = image
        self.nodes.result.prepend(image)
      } else {
        self.nodes.image.attr('src', self.cache.image)
      }

      self.shortCut()
    }.bind(self))
  },

  shortCut: function () {
    var self = this
    var html = self.cache.html

    var dom = Stamp.$(html)

    var forms = Stamp.$.grep(dom, function (node) {
      return node.tagName === 'FORM'
    })

    var forms = Stamp.$.grep(forms, function (form) {
      return Stamp.$(form).attr('id')
    })
    forms.length === 1 && (forms = Stamp.$(forms[0]))

    var inputs = forms.find('input')

    Stamp.$.each(inputs, function (index, input) {
      var name = Stamp.$(input).attr('name')
      var value = Stamp.$(input).attr('value')

      self.finalPostData[name] = value
    })

    var main = Stamp.$.grep(dom, function (node) {
      var node = Stamp.$(node)
      return node.hasClass('gwc') && node.hasClass('gwc2')
    })
    main.length === 1 && (main = Stamp.$(main[0]))

    self.cache.shopId = Stamp.$(main).find('.order_shop_id').val()
    self.cache.orderTotalWeigth = Stamp.$(main).find('.order_total_weight').val()

    self.cache.goodsListIndex = Stamp.$(main).find('.goodsList_index').val()
    self.cache.goodPrice = Stamp.$(main).find('.good_price' + self.cache.goodsListIndex).val()

    var goodsId = ''
    Stamp.$(main).find('.good_idforeach' + self.cache.goodsListIndex).each(function () {
      goodsId = Stamp.$(this).val()
    })
    var checkGoodsId = (self.cache.goodsId === goodsId)

    var sendFlag = ''
    Stamp.$(main).find('.good_sendflag' + self.cache.goodsListIndex).each(function () {
      sendFlag = Stamp.$(this).val()
    })
    self.cache.sendFlag = sendFlag
    var checksendFlag = (sendFlag == "") ? false : true;
    ((sendFlag.indexOf('0') > -1 || sendFlag.indexOf("2") > -1) && sendFlag.indexOf("1") > -1) && (checksendFlag = false);

    self.cache.canGetFare = checkGoodsId && checksendFlag
    self.getAddress()
  },

  getAddress: function () {
    var self = this

    Stamp.$.ajax({
      type: "POST",
      url: "/retail/JSONGetUserAddressWithUserID.html",
      data: {
        buyer_user_id: self.cache.userId
      },
      success: function (result, textStatus) {
        if (textStatus === 'success') {
          result = result.sort(function (ad1, ad2) {
            return ad2.defAddress - ad1.defAddress
          })
          self.cache.address = result

          var addressListSection = Stamp.$('<div class="section radioSection" id="_addressList_"></div>')

          Stamp.$.each(result, function (index, address) {
            var wrap = Stamp.$('<div class="radioWrap">')

            var radio = Stamp.$('<input>', {
              id: ['_address', index].join('_'),
              name: 'address',
              type: 'radio',
              value: address.id,
            }).data('info', address)
            self.nodes.addressRadios.push(radio)

            var label = Stamp.$('<label>', {
              for: ['_address', index].join('_')
            }).text(address.address)

            var text = ['收货人:', address.contextName, ', ', '电话:', address.mobile, ', ', '邮编:', address.zipcode].join('')
            var detail = Stamp.$('<div>').text(text)

            if (address.defAddress) {
              radio.attr('checked', 'checked')
              self.cache.addressId = address.id
            }

            wrap.append(radio)
            wrap.append(label)
            wrap.append(detail)

            addressListSection.append(wrap)
          })

          addressListSection.on('change', function (e) {
            var target = Stamp.$(e.target)
            target.attr('checked') === 'checked' && ( self.cache.addressId = target.val())
            self.getFare(false)
          })

          self.nodes.container.find('.section:first').after(addressListSection)
          addressListSection.before(Stamp.$('<div class="title">确认收货地址</div>'))

          self.getFare(true)
        }
      },
      dataType: 'json'
    })
  },

  getFare: function (init) {
    var self = this
    if (!self.cache.canGetFare) return null

    var selected = Stamp.$.grep(self.cache.address, function (address) {
      return address.id === Number(self.cache.addressId)
    });
    (selected && selected.length) && (selected = selected.pop());

    var params = {
      user_new_address_province: selected.province,
      shopID: self.cache.shopId,
      goods_ids: self.cache.goodsId + ',',
      send_flag_strs: self.cache.sendFlag + ','
    }

    Stamp.$.ajax({
      type: "POST",
      url: "/retail/JSONGetFareByShopIDAndProvinceCode.html",
      data: params,
      success: function (result, textStatus) {
        if (textStatus === 'success') {
          self.cache.fare = result

          var fareListSection = init ? Stamp.$('<div class="section radioSection" id="_fareList_"></div>') : self.nodes.fareListSection

          !init && fareListSection.empty()

          Stamp.$.each(result, function (index, fare) {
            var wrap = Stamp.$('<div class="radioWrap">')

            var radio = Stamp.$('<input>', {
              id: ['_fare', index].join('_'),
              name: 'fare',
              type: 'radio',
              value: fare.id,
            }).data('info', fare)
            self.nodes.fareRadios.push(radio)

            var label = Stamp.$('<label>', {
              for: ['_fare', index].join('_')
            }).text(fare.fare_name)

            if (index === 0) {
              radio.attr('checked', 'checked')
              self.cache.fareId = fare.id
              self.calculate()
            }

            wrap.append(radio)
            wrap.append(label)

            fareListSection.append(wrap)
          })

          if (init) {
            self.nodes.fareListSection = fareListSection

            fareListSection.on('change', function (e) {
              var target = Stamp.$(e.target)
              target.attr('checked') === 'checked' && ( self.cache.fareId = target.val())
              self.calculate()
            })

            self.nodes.container.find('.section#_addressList_').after(fareListSection)
            fareListSection.before(Stamp.$('<div class="title">运送方式</div>'))
          }
        }
      },
      dataType: 'json'
    })
  },

  calculate: function () {
    var self = this

    var fareSelected = Stamp.$.grep(self.cache.fare, function (fare) {
      return fare.id === self.cache.fareId
    });
    (fareSelected && fareSelected.length) && (fareSelected = fareSelected.pop());

    var addressSelected = Stamp.$.grep(self.cache.address, function (address) {
      return address.id === Number(self.cache.addressId)
    });
    (addressSelected && addressSelected.length) && (addressSelected = addressSelected.pop());

    var params = {
      fare_code: fareSelected.code,
      total_weight: self.cache.orderTotalWeigth,
      shopID: self.cache.shopId,
      user_new_address_province: addressSelected.province,
      buyer_user_id: self.cache.userId,
      goods_ids: self.cache.goodsId + ',',
    }

    Stamp.$.ajax({
      type: "POST",
      url: "/retail/JSONGetTotalFeeForClikcAction.html",
      data: params,
      success: function (result, textStatus) {
        textStatus === 'success' && self._calculate(self.cache.goodsListIndex, result, fareSelected.code)
      },
      dataType: 'html'
    })
  },

  _calculate: function (goodsListIndex, fareFee, fareCode) {
    var self = this

    var original = 0
    var more = 0
    original += Number(self.cache.goodPrice)

    more = (Number(original) + Number(fareFee)).toFixed(2)
    original = original.toFixed(2)

    var price = self.nodes.container.find('#_price_')

    if (price.length === 0) {
      self.nodes.fareListSection.after('<div class="section" id="_price_"></div>')
      price = self.nodes.container.find('#_price_')
      self.nodes.PriceSection = price

      price.before(Stamp.$('<div class="title">订单详情</div>'))
    } else {
      price.empty()
    }

    var info = Stamp.$('<span>').text('数量：')
    price.append(Stamp.$('<div>', {
      id: '_total_'
    }).append(info).append('<span class="red">' + self.cache.count + '</span>'))

    info = Stamp.$('<span>').text('商品总价：')
    price.append(Stamp.$('<div>', {
      id: '_original_'
    }).append(info).append('<span class="red">' + original + '</span>'))

    info = Stamp.$('<span>').text('订单总价(含邮费)：')
    price.append(Stamp.$('<div>', {
      id: '_more_'
    }).append(info).append('<span class="red">' + more + '</span>'))


    self.finalPostData['preTradelist[0].postageInfo.shippingType'] = fareCode
  },

  final: function () {
    var self = this

    var fareSelected = Stamp.$.grep(self.cache.fare, function (fare) {
      return fare.id === self.cache.fareId
    });
    (fareSelected && fareSelected.length) && (fareSelected = fareSelected.pop());

    self.finalPostData.addressId = self.cache.addressId
    self.finalPostData.checkcode = self.cache.token
    self.finalPostData.mobile = self.cache.mobile
    self.finalPostData.message = self.cache.message
    self.finalPostData['preTradelist[0].postageInfo.shippingType'] = fareSelected.code
    debugger
    self.finalPostData['preTradelist[0].mailType'] = fareSelected.code

    Stamp.$.ajax({
      type: "POST",
      url: "/book/tradesSubmit.html",
      data: self.finalPostData,
      success: function () {
        debugger
      },
      dataType: 'json'
    })
  }
})

Stamp.panel = new Panel()