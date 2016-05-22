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

  this.needVerify = false

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

  init: function (needVerify) {
    var self = this

    var cache = self.fairy.cache
    var details = self.fairy.details

    self.needVerify = needVerify

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
          goodsNum: cache.count
        }

        return self.post('message', params)
      })
      .asCallback(function (error, data) {
        if (data.textStatus === 'success') {
          self.fairy.order.render(data.result, needVerify)
        }
      })
      .then(function () {
        self.getSid()
      })
  },

  getSid: function () {
    var self = this
    var cache = self.fairy.cache

    var nodes = self.fairy.order.nodes

    Stamp.probe.execute('getSid', {}, function (message) {
      cache.sid = message.data.sid

      if (nodes.image === null) {
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

    var dom = Stamp.$(cache.html4order)

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

    var nodes = self.fairy.order.nodes

    var params = {
      buyer_user_id: cache.userId
    }

    self.post('address', params)
      .then(function (data) {
        if (data.textStatus === 'success') {
          var phone = nodes.phone

          if (phone) {
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
          }

          var result = data.result.sort(function (ad1, ad2) {
            return ad2.defAddress - ad1.defAddress
          })
          cache.address = result

          var addressSection = Stamp.$('<div class="section addressSection"></div>')
          addressSection.append(Stamp.$('<div class="radios"></div>'))

          Stamp.$.each(result, function (index, address) {
            var wrap = Stamp.$('<div class="radioWrap">')

            var id = ['_address_', index].join('')

            var radio = Stamp.$('<input>', {
              type: 'radio',
              id: id,
              name: 'address',
              value: address.id,
            }).data('info', address)

            var location = Stamp.$('<div class="location">').text(address.address)
            var detail = Stamp.$('<div class="detail">').text(['收货人:', address.contextName, ', ', '电话:', address.mobile, ', ', '邮编:', address.zipcode].join(''))

            var label = Stamp.$('<label>', {
              for: id
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

            addressSection.find('.radios').append(wrap)
          })

          nodes.addressSection = addressSection

          addressSection.on('change', function (e) {
            var target = Stamp.$(e.target)

            Stamp.$.each(Stamp.$(this).find('label'), function (index, node) {
              var node = Stamp.$(node)

              node.removeClass('selected')
              if (node.attr('for').split('_').pop() === target.attr('id').split('_').pop()) {
                node.addClass('selected')
              }
            })

            target.attr('checked') === 'checked' && ( cache.addressId = target.val())
            self.getFare(false)
          })

          nodes.root.find('.section:first').after(addressSection)
          addressSection.prepend(Stamp.$('<div class="title">确认收货地址</div>'))

          self.getFare(true)
        }
      })
  },

  getFare: function (init) {
    var self = this

    var cache = self.fairy.cache

    var nodes = self.fairy.order.nodes

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

          var fareSection = null

          if (init) {
            fareSection = Stamp.$('<div class="section fareSection"></div>')
            fareSection.append(Stamp.$('<div class="radios">'))
          } else {
            fareSection = nodes.fareSection
            fareSection.find('.radios').empty()
          }

          var fareNames = data.result.map(function (fare) {
            return fare.fare_name
          })
          var defaultFare = fareNames.indexOf('邮政小包')
          defaultFare == -1 && (defaultFare = fareNames.indexOf('国内小包'))
          defaultFare == -1 && (defaultFare = 0)

          Stamp.$.each(data.result, function (index, fare) {
            var wrap = Stamp.$('<div class="radioWrap">')

            var id = ['_fare_', index].join('')

            var radio = Stamp.$('<input>', {
              id: id,
              name: 'fare',
              type: 'radio',
              value: fare.id,
            }).data('info', fare)
            nodes.fareRadios.push(radio)

            var label = Stamp.$('<label>', {
              for: id
            }).text(fare.fare_name)

            if (index == defaultFare) {
              radio.attr('checked', 'checked')
              label.addClass('selected')
              cache.fareId = fare.id
              self.calculate()
            }

            wrap.append(radio)
            wrap.append(label)

            fareSection.find('.radios').append(wrap)
          })

          if (init) {
            nodes.fareSection = fareSection

            fareSection.on('change', function (e) {
              var target = Stamp.$(e.target)

              Stamp.$.each(Stamp.$(this).find('label'), function (index, node) {
                var node = Stamp.$(node)

                node.removeClass('selected')
                if (node.attr('for').split('_').pop() === target.attr('id').split('_').pop()) {
                  node.addClass('selected')
                }
              })

              target.attr('checked') === 'checked' && ( cache.fareId = target.val())

              self.calculate()
            })

            nodes.addressSection.after(fareSection)
            fareSection.prepend(Stamp.$('<div class="title">运送方式</div>'))
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
        data.textStatus === 'success' && self._calculate(cache.goodsListIndex, data.result)
      })
  },

  _calculate: function (goodsListIndex, fareFee) {
    var self = this

    var cache = self.fairy.cache

    var nodes = self.fairy.order.nodes

    var original = Number(cache.goodPrice)
    var fare = Number(fareFee)
    var withFare = original + fare

    var priceScetion = nodes.root.find('.detailSection')
    if (priceScetion.length === 0) {
      priceScetion = Stamp.$('<div class="section detailSection"></div>')

      priceScetion.append(Stamp.$('<div class="details">'))
      nodes.fareSection.after(priceScetion)

      nodes.priceSection = priceScetion

      priceScetion.prepend(Stamp.$('<div class="title">订单详情</div>'))
    }
    else {
      priceScetion.find('.details').empty()
    }

    var details = priceScetion.find('.details')

    details.append(Stamp.$('<div>')
      .append(Stamp.$('<span>').text('购买数量：'))
      .append('<span class="content">' + self.fairy.cache.count + '</span>'))

    details.append(Stamp.$('<div>')
      .append(Stamp.$('<span>').text('商品小计：'))
      .append('<span class="content">' + original.toFixed(2) + '</span>'))

    details.append(Stamp.$('<div>')
      .append(Stamp.$('<span>').text('邮费小计：'))
      .append('<span class="content">' + fare.toFixed(2) + '</span>'))

    details.append(Stamp.$('<div>')
      .append(Stamp.$('<span>').text('订单总价：'))
      .append('<span class="content">' + withFare.toFixed(2) + '</span>'))
  },

  guard: function () {
    var self = this
    var cache = self.fairy.cache

    var index = 0
    var check = {
      result: true
    }

    if (self.needVerify) {
      check.success = [null, null, null, null, null]
      check.failed = [null, null, null, null, null]
    }
    else {
      check.success = [null, null, null]
      check.failed = [null, null, null]
    }

    if (!(cache.addressId && String(cache.addressId).length)) {
      check.result = false
      check.failed[index++] = '未选择邮寄地址'
    }
    else {
      check.success[index++] = '邮寄地址OK'
    }

    if (!(cache.fareId && String(cache.fareId).length)) {
      check.result = false
      check.failed[index++] = '未选择邮寄方式'
    }
    else {
      check.success[index++] = '邮寄方式OK'
    }

    if (self.needVerify) {
      check.success[index++] = '获取验证码OK'

      if (!(cache.message && String(cache.message).length)) {
        check.result = false
        check.failed[index++] = '未通过验证手机'
      }
      else {
        check.success[index++] = '验证手机OK'
      }
    }

    if (!(cache.token && String(cache.token).length)) {
      check.result = false
      check.failed[index++] = '未通过图片验证'
    }
    else {
      check.success[index++] = '图片验证OK'
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

    var nodes = self.fairy.order.nodes

    callback && callback()
    var wrap = Stamp.$(wrap.pop())

    var orderInfoSection = Stamp.$('<div class="section orderInfoSection" id="_orderInfo_">')

    var infos = wrap.find('.gwc3-nr h4 span')
    var orderNumers = Stamp.$(infos[0]).text().split('|')
    var total = Stamp.$(infos[1]).text()

    var ordersNumbersInfo = Stamp.$('<div class="info">')
    ordersNumbersInfo.append(Stamp.$('<div class="infotitle">').text('订单号：'))
    orderNumers.each(function (num) {
      ordersNumbersInfo.append(Stamp.$('<div class="orederNumber">').text(num))
    })

    var totalInfo = Stamp.$('<div class="info">')
    totalInfo.append(Stamp.$('<div class="infotitle">').text('应付金额：'))
    totalInfo.append(Stamp.$('<div class="total">').text(total))

    orderInfoSection.append(ordersNumbersInfo).append(totalInfo)

    self.orderInfoSection = orderInfoSection

    nodes.root.find('.section:last').after(orderInfoSection)
    orderInfoSection.prepend(Stamp.$('<div class="title">购买成功</div>'))
  },

  failed: function (wrap) {
    var self = this

    var nodes = self.fairy.order.nodes

    var wrap = Stamp.$(wrap.pop())

    var errorInfoSection = Stamp.$('<div class="section errorInfoSection" id="_errorInfo_">')

    Stamp.$.each(wrap.find('.smrz-nr h1'), function (index, node) {
      var info = Stamp.$('<div class="info">')

      info.append(Stamp.$('<em class="err">').text(Stamp.$.trim(Stamp.$(node).text())))

      errorInfoSection.append(info)
    })

    self.errorInfoSection = errorInfoSection

    nodes.root.find('.section:last').after(errorInfoSection)
    errorInfoSection.prepend(Stamp.$('<div class="title">购买失败</div>'))
  }
})

module.exports = Loader