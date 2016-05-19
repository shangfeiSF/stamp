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
      url: '/book/tradesSubmit.html',
      dataType: 'html'
    }
  }

  this.imageBase = 'http://jiyou.11185.cn/l/captcha.html?wid=3be16628-c630-437b-b443-c4d9f18602ed'
}

Stamp.$.extend(Loader.prototype, {
  settle: function (needVerify) {
    var self = this
    var cache = self.fairy.cache

    self.post('user')
      .asCallback(function (error, data) {
        if (data.textStatus === 'success') {
          cache.userType = data.result.userType
          cache.userId = data.result.userId

          self.fairy.panel.create({}, needVerify)
        }
      })
      .then(function () {
        self.getSid()
      })
  },

  init: function (needVerify) {
    var self = this
    var cache = self.fairy.cache
    var details = self.fairy.details
    var nodes = self.fairy.panel.nodes

    self.post('user')
      .asCallback(function (error, data) {
        if (data.textStatus === 'success') {
          cache.userType = data.result.userType
          cache.userId = data.result.userId
        }
      })
      .then(function () {
        var params = {
          ticketAttr: details.goodsAttrList[cache.specIndex].id,
          userId: cache.userId,
          ticketId: details.goodsShowInfo.id
        }

        return self.post('limit', params)
      })
      .asCallback(function (error, data) {
        if (data.textStatus === 'success') {
          var result = JSON.parse(data.result)

          details.goodsAttrList[cache.specIndex].buyLimit = result.buyLimit
        }
      })
      .then(function () {
        var params = {
          ticketAttr: details.goodsAttrList[cache.specIndex].id,
          goodsNum: nodes.count.val()
        }

        return self.post('message', params)
      })
      .asCallback(function (error, data) {
        if (data.textStatus === 'success') {
          self.fairy.panel.create(data.result, needVerify)
        }
      })
      .then(function () {
        self.getSid()
      })
  },

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
          .css({
            cursor: 'pointer',
            border: '2px solid #31B0D5'
          })
          .on('dblclick', function () {
            nodes.image.attr('src', [self.imageBase, "&sid=", cache.sid, "&", Math.random()].join(''))
            Stamp.$.each(nodes.checkboxs, function (index, checkbox) {
              Stamp.$(checkbox).attr('checked', false)
            })
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
      .then(function (data) {
        if (data.textStatus === 'success') {
          var phone = nodes.phone

          var mobiles = Stamp.$.map(phone.children(), function (node) {
            return Stamp.$(node).val()
          })

          Stamp.$.each(data.result, function (index, item) {
            if (mobiles.indexOf(item.mobile) < 0) {
              phone.append(Stamp.$('<option>', {
                value: item.mobile
              }).text(item.mobile))
            }
          })

          var result = data.result.sort(function (ad1, ad2) {
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

            var location = Stamp.$('<div class="location">').text(address.address)
            var detail = Stamp.$('<div class="detail">').text(['收货人:', address.contextName, ', ', '电话:', address.mobile, ', ', '邮编:', address.zipcode].join(''))

            var label = Stamp.$('<label>', {
              for: ['_address', index].join('_')
            })
            label.append(location)
            label.append(detail)

            if (address.defAddress) {
              radio.attr('checked', 'checked')
              cache.addressId = address.id
              label.addClass('selected')
            }

            nodes.addressRadios.push(radio)

            wrap.append(radio)
            wrap.append(label)

            addressListSection.append(wrap)
          })

          addressListSection.on('change', function (e) {
            var target = Stamp.$(e.target)

            Stamp.$.each(Stamp.$(this).find('label'), function (index, node) {
              var node = Stamp.$(node)

              node.removeClass('selected')
              if (node.attr('for').split('-').pop() === target.attr('id').split('-').pop()) {
                node.addClass('selected')
              }
            })

            target.attr('checked') === 'checked' && ( cache.addressId = target.val())
            self.getFare(false)
          })

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
      .then(function (data) {
        if (data.textStatus === 'success') {
          cache.fare = data.result

          var fareListSection = init ?
            Stamp.$('<div class="section radioSection" id="_fareList_"></div>') :
            nodes.fareListSection

          !init && fareListSection.empty()

          Stamp.$.each(data.result, function (index, fare) {
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

            if (fare.fare_name === '邮政小包') {
              radio.attr('checked', 'checked')
              label.addClass('selected')
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

              Stamp.$.each(Stamp.$(this).find('label'), function (index, node) {
                var node = Stamp.$(node)

                node.removeClass('selected')
                if (node.attr('for').split('-').pop() === target.attr('id').split('-').pop()) {
                  node.addClass('selected')
                }
              })

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
      .then(function (data) {
        data.textStatus === 'success' && self._calculate(cache.goodsListIndex, data.result, fareSelected.code)
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
      .append('<span class="content">' + self.fairy.cache.count + '</span>'))

    info = Stamp.$('<span>').text('商品总价：')
    price.append(Stamp.$('<div>', {
        id: '_original_'
      })
      .append(info)
      .append('<span class="content">' + original + '</span>'))

    info = Stamp.$('<span>').text('订单总价(含邮费)：')
    price.append(Stamp.$('<div>', {
        id: '_more_'
      })
      .append(info)
      .append('<span class="content">' + more + '</span>'))

    finalPostData['preTradelist[0].postageInfo.shippingType'] = fareCode
  },

  guard: function () {
    var self = this
    var cache = self.fairy.cache

    var check = {
      result: true,
      success: [null, null, null, null, null],
      failed: [null, null, null, null, null]
    }

    if (!(cache.addressId && String(cache.addressId).length)) {
      check.result = false
      check.failed[0] = '未选择邮寄地址'
    } else {
      check.success[0] = '邮寄地址OK'
    }

    if (!(cache.fareId && String(cache.fareId).length)) {
      check.result = false
      check.failed[1] = '未选择邮寄方式'
    } else {
      check.success[1] = '邮寄方式OK'
    }

    // if (!(cache.mobile && String(cache.mobile).length)) {
    //   check.result = false
    //   check.failed[2] = '未获取验证码'
    // } else {
    //   check.success[2] = '获取验证码OK'
    // }
    check.success[2] = '获取验证码OK'

    if (!(cache.message && String(cache.message).length)) {
      check.result = false
      check.failed[3] = '未通过验证手机'
    } else {
      check.success[3] = '验证手机OK'
    }

    if (!(cache.token && String(cache.token).length)) {
      check.result = false
      check.failed[4] = '未通过图片验证'
    } else {
      check.success[4] = '图片验证OK'
    }

    return check
  },

  final: function (callback) {
    var self = this

    var cache = self.fairy.cache
    var finalPostData = self.fairy.finalPostData

    var fareSelected = Stamp.$.grep(cache.fare, function (fare) {
      return fare.id == cache.fareId
    })
    fareSelected && fareSelected.length && (fareSelected = fareSelected.pop())

    finalPostData.addressId = cache.addressId
    finalPostData.checkcode = cache.token
    finalPostData.mobile = cache.mobile
    finalPostData.message = cache.message
    finalPostData['preTradelist[0].postageInfo.shippingType'] = fareSelected.code
    finalPostData['preTradelist[0].mailType'] = fareSelected.type

    self.post('book', finalPostData)
      .then(function (data) {
        if (data.textStatus === 'success') {
          var dom = Stamp.$(data.result)

          var infoWrap = Stamp.$.grep(dom, function (node) {
            return Stamp.$(node).hasClass('gwc') && Stamp.$(node).hasClass('gwc3')
          })
          var errorWrap = Stamp.$.grep(dom, function (node) {
            return Stamp.$(node).hasClass('smrz') && Stamp.$(node).hasClass('zccgym')
          })

          if (infoWrap.length) {
            self.success(infoWrap, callback)
          } else if (errorWrap.length) {
            self.failed(errorWrap)
          }
        }
      })
  },

  success: function (wrap, callback) {
    var self = this
    var nodes = self.fairy.panel.nodes

    callback && callback()
    var wrap = Stamp.$(wrap.pop())

    var orderInfoSection = Stamp.$('<div class="section orderInfoSection" id="_orderInfo_">')

    var tips = ['订单号：', '应付金额：']
    Stamp.$.each(wrap.find('.gwc3-nr h4 span'), function (index, node) {
      var info = Stamp.$('<div class="info">')

      info.append(Stamp.$('<span>').text(tips[index]))
      info.append(Stamp.$('<em>').text(Stamp.$(node).text()))

      orderInfoSection.append(info)
    })

    nodes.container.find('.section:last').after(orderInfoSection)
    orderInfoSection.before(Stamp.$('<div class="title">购买成功</div>'))
  },

  failed: function (wrap) {
    var self = this
    var nodes = self.fairy.panel.nodes

    var wrap = Stamp.$(wrap.pop())

    var errorInfoSection = Stamp.$('<div class="section errorInfoSection" id="_errorInfo_">')

    Stamp.$.each(wrap.find('.smrz-nr h1'), function (index, node) {
      var info = Stamp.$('<div class="info">')

      info.append(Stamp.$('<em class="err">').text(Stamp.$.trim(Stamp.$(node).text())))

      errorInfoSection.append(info)
    })

    nodes.container.find('.section:last').after(errorInfoSection)
    errorInfoSection.before(Stamp.$('<div class="title">购买失败</div>'))
  }
})

module.exports = Loader