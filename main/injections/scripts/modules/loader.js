function Loader(fairy) {
  this.fairy = fairy

  this.postConfig = {
    common: {
      type: "POST",
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
      url: "JSONGetMessage.html"
    }
  }
}

Stamp.$.extend(Loader.prototype, {
  post: function (prop, params) {
    var self = this

    var common = self.postConfig.common
    var private = self.postConfig[prop]

    return new Promise(function (resolve, rejected) {
      var config = {
        type: private.type || common.type,
        url: private.url,
        success: resolve,
        error: rejected,
        dataType: private.dataType || common.dataType,
      }

      params !== undefined && (config.data = params)

      Stamp.$.ajax(config)
    })
  },

  init: function () {
    var self = this
    var cache = self.fairy.cache
    var details = self.fairy.details

    self.post('user')
      .then(function (data) {
        if (data == null) {
          return null
        }

        cache.userType = data.userType
        cache.userId = data.userId

        var params = {
          ticketAttr: details.goodsAttrList[0].id,
          userId: cache.userId,
          ticketId: details.goodsShowInfo.id
        }

        return self.post('limit', params)
      })
      .then(function (result) {
        var result = JSON.parse(result)

        details.goodsAttrList[0].buyLimit = result.buyLimit

        var params = {
          ticketAttr: details.goodsAttrList[0].id,
          goodsNum: 1
        }

        return self.post('message', params)
      })
      .then(function (state) {
        self.fairy.panel.render(state)
      })
  },

  getSid: function () {
    var self = this
    var imageBase = 'http://jiyou.11185.cn/l/captcha.html?wid=3be16628-c630-437b-b443-c4d9f18602ed'

    Stamp.probe.execute('getSid', {}, function (message) {
      self.fairy.cache.sid = message.data.sid

      if (self.fairy.panel.nodes.image === undefined) {
        var image = Stamp.$('<img>', {
          src: message.data.image
        })

        image.on('dblclick', function () {
          self.fairy.panel.nodes.image.attr('src', [imageBase, "&sid=", self.fairy.cache.sid, "&", Math.random()].join(''))
        })

        self.fairy.panel.nodes.image = image
        self.fairy.panel.nodes.answer.prepend(image)
      } else {
        self.fairy.panel.nodes.image.attr('src', message.data.image)
      }

      self.shortCut()
    }.bind(self))
  },

  shortCut: function () {
    var self = this
    var html = self.fairy.cache.html

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

      self.fairy.finalPostData[name] = value
    })

    var main = Stamp.$.grep(dom, function (node) {
      var node = Stamp.$(node)
      return node.hasClass('gwc') && node.hasClass('gwc2')
    })
    main.length === 1 && (main = Stamp.$(main[0]))

    self.fairy.cache.shopId = Stamp.$(main).find('.order_shop_id').val()
    self.fairy.cache.orderTotalWeigth = Stamp.$(main).find('.order_total_weight').val()

    self.fairy.cache.goodsListIndex = Stamp.$(main).find('.goodsList_index').val()
    self.fairy.cache.goodPrice = Stamp.$(main).find('.good_price' + self.fairy.cache.goodsListIndex).val()

    var goodsId = ''
    Stamp.$(main).find('.good_idforeach' + self.fairy.cache.goodsListIndex).each(function () {
      goodsId = Stamp.$(this).val()
    })
    var checkGoodsId = (self.fairy.cache.goodsId === goodsId)

    var sendFlag = ''
    Stamp.$(main).find('.good_sendflag' + self.fairy.cache.goodsListIndex).each(function () {
      sendFlag = Stamp.$(this).val()
    })
    self.fairy.cache.sendFlag = sendFlag
    var checksendFlag = (sendFlag == "") ? false : true;
    ((sendFlag.indexOf('0') > -1 || sendFlag.indexOf("2") > -1) && sendFlag.indexOf("1") > -1) && (checksendFlag = false);

    self.fairy.cache.canGetFare = checkGoodsId && checksendFlag
    self.getAddress()
  },

  getAddress: function () {
    var self = this

    Stamp.$.ajax({
      type: "POST",
      url: "/retail/JSONGetUserAddressWithUserID.html",
      data: {
        buyer_user_id: self.fairy.cache.userId
      },
      success: function (result, textStatus) {
        if (textStatus === 'success') {
          result = result.sort(function (ad1, ad2) {
            return ad2.defAddress - ad1.defAddress
          })
          self.fairy.cache.address = result

          var addressListSection = Stamp.$('<div class="section radioSection" id="_addressList_"></div>')

          Stamp.$.each(result, function (index, address) {
            var wrap = Stamp.$('<div class="radioWrap">')

            var radio = Stamp.$('<input>', {
              id: ['_address', index].join('_'),
              name: 'address',
              type: 'radio',
              value: address.id,
            }).data('info', address)
            self.fairy.panel.nodes.addressRadios.push(radio)

            var label = Stamp.$('<label>', {
              for: ['_address', index].join('_')
            }).text(address.address)

            var text = ['收货人:', address.contextName, ', ', '电话:', address.mobile, ', ', '邮编:', address.zipcode].join('')
            var detail = Stamp.$('<div>').text(text)

            if (address.defAddress) {
              radio.attr('checked', 'checked')
              self.fairy.cache.addressId = address.id
            }

            wrap.append(radio)
            wrap.append(label)
            wrap.append(detail)

            addressListSection.append(wrap)
          })

          addressListSection.on('change', function (e) {
            var target = Stamp.$(e.target)
            target.attr('checked') === 'checked' && ( self.fairy.cache.addressId = target.val())
            self.getFare(false)
          })

          self.fairy.panel.nodes.container.find('.section:first').after(addressListSection)
          addressListSection.before(Stamp.$('<div class="title">确认收货地址</div>'))

          self.getFare(true)
        }
      },
      dataType: 'json'
    })
  },

  getFare: function (init) {
    var self = this
    if (!self.fairy.cache.canGetFare) return null

    var selected = Stamp.$.grep(self.fairy.cache.address, function (address) {
      return address.id === Number(self.fairy.cache.addressId)
    });
    (selected && selected.length) && (selected = selected.pop());

    var params = {
      user_new_address_province: selected.province,
      shopID: self.fairy.cache.shopId,
      goods_ids: self.fairy.cache.goodsId + ',',
      send_flag_strs: self.fairy.cache.sendFlag + ','
    }

    Stamp.$.ajax({
      type: "POST",
      url: "/retail/JSONGetFareByShopIDAndProvinceCode.html",
      data: params,
      success: function (result, textStatus) {
        if (textStatus === 'success') {
          self.fairy.cache.fare = result

          var fareListSection = init ? Stamp.$('<div class="section radioSection" id="_fareList_"></div>') : self.fairy.panel.nodes.fareListSection

          !init && fareListSection.empty()

          Stamp.$.each(result, function (index, fare) {
            var wrap = Stamp.$('<div class="radioWrap">')

            var radio = Stamp.$('<input>', {
              id: ['_fare', index].join('_'),
              name: 'fare',
              type: 'radio',
              value: fare.id,
            }).data('info', fare)
            self.fairy.panel.nodes.fareRadios.push(radio)

            var label = Stamp.$('<label>', {
              for: ['_fare', index].join('_')
            }).text(fare.fare_name)

            if (index === 0) {
              radio.attr('checked', 'checked')
              self.fairy.cache.fareId = fare.id
              self.calculate()
            }

            wrap.append(radio)
            wrap.append(label)

            fareListSection.append(wrap)
          })

          if (init) {
            self.fairy.panel.nodes.fareListSection = fareListSection

            fareListSection.on('change', function (e) {
              var target = Stamp.$(e.target)
              target.attr('checked') === 'checked' && ( self.fairy.cache.fareId = target.val())
              self.calculate()
            })

            self.fairy.panel.nodes.container.find('.section#_addressList_').after(fareListSection)
            fareListSection.before(Stamp.$('<div class="title">运送方式</div>'))
          }
        }
      },
      dataType: 'json'
    })
  },

  calculate: function () {
    var self = this

    var fareSelected = Stamp.$.grep(self.fairy.cache.fare, function (fare) {
      return fare.id === self.fairy.cache.fareId
    });
    (fareSelected && fareSelected.length) && (fareSelected = fareSelected.pop());

    var addressSelected = Stamp.$.grep(self.fairy.cache.address, function (address) {
      return address.id === Number(self.fairy.cache.addressId)
    });
    (addressSelected && addressSelected.length) && (addressSelected = addressSelected.pop());

    var params = {
      fare_code: fareSelected.code,
      total_weight: self.fairy.cache.orderTotalWeigth,
      shopID: self.fairy.cache.shopId,
      user_new_address_province: addressSelected.province,
      buyer_user_id: self.fairy.cache.userId,
      goods_ids: self.fairy.cache.goodsId + ',',
    }

    Stamp.$.ajax({
      type: "POST",
      url: "/retail/JSONGetTotalFeeForClikcAction.html",
      data: params,
      success: function (result, textStatus) {
        textStatus === 'success' && self._calculate(self.fairy.cache.goodsListIndex, result, fareSelected.code)
      },
      dataType: 'html'
    })
  },

  _calculate: function (goodsListIndex, fareFee, fareCode) {
    var self = this

    var original = 0
    var more = 0
    original += Number(self.fairy.cache.goodPrice)

    more = (Number(original) + Number(fareFee)).toFixed(2)
    original = original.toFixed(2)

    var price = self.fairy.panel.nodes.container.find('#_price_')

    if (price.length === 0) {
      self.fairy.panel.nodes.fareListSection.after('<div class="section" id="_price_"></div>')
      price = self.fairy.panel.nodes.container.find('#_price_')
      self.fairy.panel.nodes.PriceSection = price

      price.before(Stamp.$('<div class="title">订单详情</div>'))
    } else {
      price.empty()
    }

    var info = Stamp.$('<span>').text('数量：')
    price.append(Stamp.$('<div>', {
      id: '_total_'
    }).append(info).append('<span class="red">' + self.fairy.cache.count + '</span>'))

    info = Stamp.$('<span>').text('商品总价：')
    price.append(Stamp.$('<div>', {
      id: '_original_'
    }).append(info).append('<span class="red">' + original + '</span>'))

    info = Stamp.$('<span>').text('订单总价(含邮费)：')
    price.append(Stamp.$('<div>', {
      id: '_more_'
    }).append(info).append('<span class="red">' + more + '</span>'))


    self.fairy.finalPostData['preTradelist[0].postageInfo.shippingType'] = fareCode
  },

  final: function () {
    var self = this

    var fareSelected = Stamp.$.grep(self.fairy.cache.fare, function (fare) {
      return fare.id === self.fairy.cache.fareId
    });
    (fareSelected && fareSelected.length) && (fareSelected = fareSelected.pop());

    self.fairy.finalPostData.addressId = self.fairy.cache.addressId
    self.fairy.finalPostData.checkcode = self.fairy.cache.token
    self.fairy.finalPostData.mobile = self.fairy.cache.mobile
    self.fairy.finalPostData.message = self.fairy.cache.message
    self.fairy.finalPostData['preTradelist[0].postageInfo.shippingType'] = fareSelected.code
    self.fairy.finalPostData['preTradelist[0].mailType'] = fareSelected.code

    Stamp.$.ajax({
      type: "POST",
      url: "/book/tradesSubmit.html",
      data: self.fairy.finalPostData,
      success: function () {
        debugger
      },
      dataType: 'json'
    })
  }
})

module.exports = Loader