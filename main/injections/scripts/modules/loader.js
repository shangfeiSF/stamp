function Loader(fairy) {
  this.fairy = fairy

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
      url: '/book/tradesSubmit.html'
    }
  }

  this.imageBase = 'http://jiyou.11185.cn/l/captcha.html?wid=3be16628-c630-437b-b443-c4d9f18602ed'
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
      .asCallback(function (error, data) {
        if (data == null) {
          return null
        }

        cache.userType = data.userType
        cache.userId = data.userId
      })
      .then(function () {
        var params = {
          ticketAttr: details.goodsAttrList[0].id,
          userId: cache.userId,
          ticketId: details.goodsShowInfo.id
        }

        return self.post('limit', params)
      })
      .asCallback(function (error, result) {
        var result = JSON.parse(result)

        details.goodsAttrList[0].buyLimit = result.buyLimit
      })
      .then(function () {
        var params = {
          ticketAttr: details.goodsAttrList[0].id,
          goodsNum: 1
        }

        return self.post('message', params)
      })
      .asCallback(function (error, state) {
        self.fairy.panel.render(state)
      })
  },

  getSid: function () {
    var self = this
    var cache = self.fairy.cache
    var nodes = self.fairy.panel.nodes

    Stamp.probe.execute('getSid', {}, function (message) {
      cache.sid = message.data.sid

      if (nodes.image === undefined) {
        var image = Stamp.$('<img>', {
            src: message.data.image
          })
          .on('dblclick', function () {
            nodes.image.attr('src', [self.imageBase, "&sid=", cache.sid, "&", Math.random()].join(''))
          })

        nodes.image = image
        nodes.answer.prepend(image)
      }
      else {
        nodes.image.attr('src', message.data.image)
      }

      self.shortCut()
    }.bind(self))
  },

  shortCut: function () {
    var self = this
    var cache = self.fairy.cache
    var finalPostData = self.fairy.finalPostData
    var dom = Stamp.$(cache.html)

    var forms = Stamp.$.grep(dom, function (node) {
      return node.tagName === 'FORM' && Stamp.$(node).attr('id')
    })
    forms.length === 1 && (forms = Stamp.$(forms[0]))
    Stamp.$.each(forms.find('input'), function (index, input) {
      var name = Stamp.$(input).attr('name')
      var value = Stamp.$(input).attr('value')

      finalPostData[name] = value
    })

    var main = Stamp.$.grep(dom, function (node) {
      var node = Stamp.$(node)
      return node.hasClass('gwc') && node.hasClass('gwc2')
    })
    main.length === 1 && (main = Stamp.$(main[0]))

    cache.shopId = main.find('.order_shop_id').val()
    cache.orderTotalWeigth = main.find('.order_total_weight').val()
    cache.goodsListIndex = main.find('.goodsList_index').val()
    cache.goodPrice = main.find('.good_price' + cache.goodsListIndex).val()

    var goodsId = ''
    main.find('.good_idforeach' + cache.goodsListIndex).each(function () {
      goodsId = Stamp.$(this).val()
    })
    var checkGoodsId = (cache.goodsId === goodsId)

    var sendFlag = ''
    main.find('.good_sendflag' + cache.goodsListIndex).each(function () {
      sendFlag = Stamp.$(this).val()
    })
    cache.sendFlag = sendFlag
    var checksendFlag = (sendFlag == "") ? false : true;
    ((sendFlag.indexOf('0') > -1 || sendFlag.indexOf("2") > -1) && sendFlag.indexOf("1") > -1) && (checksendFlag = false);

    cache.canGetFare = checkGoodsId && checksendFlag

    self.getAddress()
  },

  getAddress: function () {
    var self = this
    var cache = self.fairy.cache
    var nodes = self.fairy.panel.nodes

    var params = {
      buyer_user_id: cache.userId
    }

    self.post('address', params)
      .then(function (result, textStatus) {
        debugger
        if (textStatus === 'success') {
          result = result.sort(function (ad1, ad2) {
            return ad2.defAddress - ad1.defAddress
          })
          cache.address = result

          var addressListSection = Stamp.$('<div class="section radioSection" id="_addressList_"></div>')

          Stamp.$.each(result, function (index, address) {
            var wrap = Stamp.$('<div class="radioWrap">')

            var radio = Stamp.$('<input>', {
              id: ['_address', index].join('_'),
              name: 'address',
              type: 'radio',
              value: address.id,
            }).data('info', address)

            var label = Stamp.$('<label>', {
              for: ['_address', index].join('_')
            }).text(address.address)

            var detail = Stamp.$('<div>').text(['收货人:', address.contextName, ', ', '电话:', address.mobile, ', ', '邮编:', address.zipcode].join(''))

            if (address.defAddress) {
              radio.attr('checked', 'checked')
              cache.addressId = address.id
            }

            nodes.addressRadios.push(radio)

            wrap.append(radio)
            wrap.append(label)
            wrap.append(detail)

            addressListSection.append(wrap)
          })

          addressListSection.on('change', function (e) {
            var target = Stamp.$(e.target)
            target.attr('checked') === 'checked' && ( cache.addressId = target.val())
            self.getFare(false)
          })
          debugger

          nodes.container.find('.section:first').after(addressListSection)
          addressListSection.before(Stamp.$('<div class="title">确认收货地址</div>'))

          self.getFare(true)
        }
      })
  },

  getFare: function (init) {
    var self = this
    var cache = self.fairy.cache
    var nodes = self.fairy.panel.nodes

    if (!cache.canGetFare) return null

    var selected = Stamp.$.grep(cache.address, function (address) {
      return address.id === Number(cache.addressId)
    })
    selected && selected.length && (selected = selected.pop())

    var params = {
      user_new_address_province: selected.province,
      shopID: cache.shopId,
      goods_ids: cache.goodsId + ',',
      send_flag_strs: cache.sendFlag + ','
    }

    self.post('fare', params)
      .then(function (result, textStatus) {
        if (textStatus === 'success') {
          cache.fare = result

          var fareListSection = init ?
            Stamp.$('<div class="section radioSection" id="_fareList_"></div>') :
            nodes.fareListSection

          !init && fareListSection.empty()

          Stamp.$.each(result, function (index, fare) {
            var wrap = Stamp.$('<div class="radioWrap">')

            var radio = Stamp.$('<input>', {
              id: ['_fare', index].join('_'),
              name: 'fare',
              type: 'radio',
              value: fare.id,
            }).data('info', fare)
            nodes.fareRadios.push(radio)

            var label = Stamp.$('<label>', {
              for: ['_fare', index].join('_')
            }).text(fare.fare_name)

            if (index === 0) {
              radio.attr('checked', 'checked')
              cache.fareId = fare.id
              self.calculate()
            }

            wrap.append(radio)
            wrap.append(label)

            fareListSection.append(wrap)
          })

          if (init) {
            nodes.fareListSection = fareListSection

            fareListSection.on('change', function (e) {
              var target = Stamp.$(e.target)
              target.attr('checked') === 'checked' && ( cache.fareId = target.val())
              self.calculate()
            })

            nodes.container.find('.section#_addressList_').after(fareListSection)
            fareListSection.before(Stamp.$('<div class="title">运送方式</div>'))
          }
        }
      })
  },

  calculate: function () {
    var self = this
    var cache = self.fairy.cache

    var fareSelected = Stamp.$.grep(cache.fare, function (fare) {
      return fare.id === cache.fareId
    })
    fareSelected && fareSelected.length && (fareSelected = fareSelected.pop())

    var addressSelected = Stamp.$.grep(cache.address, function (address) {
      return address.id === Number(cache.addressId)
    })
    addressSelected && addressSelected.length && (addressSelected = addressSelected.pop())

    var params = {
      fare_code: fareSelected.code,
      total_weight: cache.orderTotalWeigth,
      shopID: cache.shopId,
      user_new_address_province: addressSelected.province,
      buyer_user_id: cache.userId,
      goods_ids: cache.goodsId + ',',
    }

    self.post('fee', params)
      .then(function (fareFee, textStatus) {
        textStatus === 'success' && self._calculate(cache.goodsListIndex, fareFee, fareSelected.code)
      })
  },

  _calculate: function (goodsListIndex, fareFee, fareCode) {
    var self = this
    var cache = self.fairy.cache
    var nodes = self.fairy.panel.nodes
    var finalPostData = self.fairy.finalPostData

    var original = Number(cache.goodPrice)
    var more = (Number(original) + Number(fareFee)).toFixed(2)
    original = original.toFixed(2)

    var price = nodes.container.find('#_price_')

    if (price.length === 0) {
      nodes.fareListSection.after('<div class="section" id="_price_"></div>')
      price = nodes.container.find('#_price_')
      nodes.PriceSection = price

      price.before(Stamp.$('<div class="title">订单详情</div>'))
    }
    else {
      price.empty()
    }

    var info = Stamp.$('<span>').text('数量：')
    price.append(Stamp.$('<div>', {
        id: '_total_'
      })
      .append(info)
      .append('<span class="red">' + self.fairy.cache.count + '</span>'))

    info = Stamp.$('<span>').text('商品总价：')
    price.append(Stamp.$('<div>', {
        id: '_original_'
      })
      .append(info)
      .append('<span class="red">' + original + '</span>'))

    info = Stamp.$('<span>').text('订单总价(含邮费)：')
    price.append(Stamp.$('<div>', {
        id: '_more_'
      })
      .append(info)
      .append('<span class="red">' + more + '</span>'))

    finalPostData['preTradelist[0].postageInfo.shippingType'] = fareCode
  },

  final: function (callback) {
    var self = this
    var cache = self.fairy.cache
    var finalPostData = self.fairy.finalPostData

    var fareSelected = Stamp.$.grep(cache.fare, function (fare) {
      return fare.id === cache.fareId
    })
    fareSelected && fareSelected.length && (fareSelected = fareSelected.pop())

    finalPostData.addressId = cache.addressId
    finalPostData.checkcode = cache.token
    finalPostData.mobile = cache.mobile
    finalPostData.message = cache.message
    finalPostData['preTradelist[0].postageInfo.shippingType'] = fareSelected.code
    finalPostData['preTradelist[0].mailType'] = fareSelected.code

    self.post('book', finalPostData)
      .then(function (html) {
        callback && callback()
        debugger
      })
  }
})

module.exports = Loader