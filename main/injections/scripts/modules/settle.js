function Settle(fairy) {
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

Stamp.$.extend(Settle.prototype, {
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

    self.post('user')
      .asCallback(function (error, data) {
        if (data.textStatus === 'success') {
          cache.userType = data.result.userType
          cache.userId = data.result.userId

          self.fairy.order.render({}, needVerify)
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
    var settlefinalPostData = self.fairy.settlefinalPostData

    var dom = Stamp.$(cache.html4settle)

    var forms = Stamp.$.grep(dom, function (node) {
      return node.tagName === 'FORM' && Stamp.$(node).attr('id')
    })
    forms.length === 1 && (forms = Stamp.$(forms[0]))
    Stamp.$.each(forms.find('input'), function (index, input) {
      var name = Stamp.$(input).attr('name')
      var value = Stamp.$(input).attr('value')

      settlefinalPostData[name] = value
    })

    var main = Stamp.$.grep(dom, function (node) {
      var node = Stamp.$(node)
      return node.hasClass('gwc') && node.hasClass('gwc2')
    })
    main.length === 1 && (main = Stamp.$(main[0]))

    Stamp.$.each(main.find('.order_shop_id'), function (index, input) {
      var input = Stamp.$(input)

      var suffix = input.attr('id').split('_').pop()

      var shop = Stamp.$.grep(cache.shops, function (shop) {
        return shop.id == input.attr('value')
      })
      shop.length && (shop = shop.pop())

      shop.order_total_weight = input.parent().find('input.order_total_weight').val()
      shop.goodsList_index = input.parent().find('input.goodsList_index').val()

      Stamp.$.each(input.parent().find('.spqdbd-spxq'), function (i, node) {
        var node = Stamp.$(node)

        var good = Stamp.$.grep(shop.goods, function (good) {
          return good.id == node.find('.good_idforeach' + suffix).val()
        })
        good.length && (good = good.pop())

        good.sendflag = node.find('.good_sendflag' + suffix).val()
        good.idforeach = node.find('.good_idforeach' + suffix).val()

        var checksendFlag = good.sendFlag == "" ? false : true

        if ((good.sendflag.indexOf("0") > -1 || good.sendflag.indexOf("2") > -1) && (good.sendflag.indexOf("1") > -1)) {
          checksendFlag = false
        }

        good.canGetFare = checksendFlag
      })

      shop.canGetFare = shop.goods.every(function (good) {
        return good.canGetFare
      })
    })

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
        if (data.textStatus !== 'success') return false

        var phone = nodes.phone

        if (phone) {
          var mobiles = Stamp.$.map(phone.children(), function (node) {
            return Stamp.$(node).val()
          })

          Stamp.$.each(data.result, function (index, item) {
            if (mobiles.indexOf(item.mobile < 0)) {
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
      })
  },

  getFare: function (init) {
    var self = this

    var cache = self.fairy.cache

    var nodes = self.fairy.order.nodes

    var selected = Stamp.$.grep(cache.address, function (address) {
      return address.id === Number(cache.addressId)
    })
    selected && selected.length && (selected = selected.pop())

    var shopsfareSection = null
    if (init) {
      shopsfareSection = Stamp.$('<div class="section shopsfareSection"></div>')
      shopsfareSection.append(Stamp.$('<div class="title">运送方式</div>'))
      var shopsfareList = Stamp.$('<div class="shopsfareList"></div>')

      shopsfareSection.append(shopsfareList)

      Stamp.$.each(cache.shops, function (index, shop) {
        shop.hasOwnProperty('canGetFare') && shopsfareList.append(Stamp.$('<div class="shopfare">').attr('id', 'shopId_' + shop.id))
      })

      shopsfareList.on('click', function (e) {
        var target = Stamp.$(e.target)
        target.hasClass('shopName') && target.next('.goodsBill').toggleClass('show')
      })

      nodes.addressSection.after(shopsfareSection)

      nodes.shopsfareList = shopsfareList
      nodes.shopsfareSection = shopsfareSection
    }
    else {
      shopsfareSection = nodes.shopsfareSection
      nodes.shopsfareRadios = []
      shopsfareSection.find('.fares').empty()
    }

    Stamp.$.each(cache.shops, function (index, shop) {
      if (shop.canGetFare) {
        var goods_ids = []
        var send_flag_strs = []

        shop.goods.each(function (good) {
          goods_ids.push(good.id)
          send_flag_strs.push(good.sendflag)
        })

        var params = {
          user_new_address_province: selected.province,
          shopID: shop.id,
          goods_ids: goods_ids.join(',') + ',',
          send_flag_strs: send_flag_strs.join(',') + ','
        }

        self.post('fare', params)
          .then(function (data) {
            if (data.textStatus !== 'success') return false

            var shop = Stamp.$.grep(cache.shops, function (shop) {
              return shop.id == data.result[0].shop_id
            })

            if (!shop.length) return false

            shop = shop.pop()
            shop.fare = data.result

            var fareNames = data.result.map(function (fare) {
              return fare.fare_name
            })
            var defaultFare = fareNames.indexOf('邮政小包')
            defaultFare == -1 && (defaultFare = fareNames.indexOf('国内小包'))
            defaultFare == -1 && (defaultFare = 0)

            var wrap = shopsfareSection.find('#shopId_' + shop.id)

            var fares = null
            if (init) {
              var shopName = Stamp.$('<label class="shopName">').text(shop.name)

              var goodsList = Stamp.$('<div class="goodsBill">')
              shop.goods.each(function (good) {
                var goodItem = Stamp.$('<div class="good">')
                  .attr('data-id', good.id)
                  .attr('data-cart', good.cart)

                goodItem.append(Stamp.$('<div>').text('商品名称：' + good.title))
                goodItem.append(Stamp.$('<div>').text('规格：' + good.spec))
                goodItem.append(Stamp.$('<div>').text('数量：' + good.count))
                goodItem.append(Stamp.$('<div>').text('单价：' + good.price))
                goodItem.append(Stamp.$('<div>').text('小计：' + good.total))

                goodsList.append(goodItem).hide()
              })

              fares = Stamp.$('<div class="fares">').attr('data-shopId', shop.id)

              fares.on('change', function (e) {
                var target = Stamp.$(e.target)

                Stamp.$.each(Stamp.$(this).find('label'), function (index, node) {
                  var node = Stamp.$(node)

                  node.removeClass('selected')
                  if (node.attr('for') === target.attr('id')) {
                    node.addClass('selected')
                  }
                })

                var shopId = target.parent().attr('data-shopId')

                var shop = Stamp.$.grep(cache.shops, function (shop) {
                  return shopId == shop.id
                })
                shop.length && (shop = shop.pop())
                shop.fareId = target.val()
              })

              wrap.append(shopName).append(goodsList).append(fares)
            }
            else {
              fares = wrap.find('.fares')
            }

            Stamp.$.each(data.result, function (index, fare) {
              var id = ['_shopfare_', shop.index, '_', index].join('')
              var name = ['_shopfare_', shop.index].join('')

              var radio = Stamp.$('<input>', {
                id: id,
                name: name,
                type: 'radio',
                value: fare.id,
              }).data('info', fare)
              nodes.shopsfareRadios.push(radio)

              var label = Stamp.$('<label>', {
                for: id
              }).text(fare.fare_name)

              if (index == defaultFare) {
                radio.attr('checked', 'checked')
                label.addClass('selected')
                shop.fareId = fare.id
              }

              fares.append(radio).append(label)
            })
          })
      }
    })
  },

  // TODO: 每个店铺的结算
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
    var finalPostData = self.fairy.finalPostData

    var nodes = self.fairy.order.nodes

    var original = Number(cache.goodPrice)
    var withFare = (Number(original) + Number(fareFee)).toFixed(2)
    original = original.toFixed(2)

    var priceScetion = nodes.root.find('.detailSection')
    if (priceScetion.length === 0) {
      priceScetion = Stamp.$('<div class="section detailSection"></div>')

      priceScetion.append(Stamp.$('<div class="details">'))
      nodes.fareSection.after(priceScetion)

      nodes.PriceSection = priceScetion

      priceScetion.prepend(Stamp.$('<div class="title">订单详情</div>'))
    }
    else {
      priceScetion.find('.details').empty()
    }

    var details = priceScetion.find('.details')

    details.append(Stamp.$('<div>')
      .append(Stamp.$('<span>').text('数量：'))
      .append('<span class="content">' + self.fairy.cache.count + '</span>'))

    details.append(Stamp.$('<div>')
      .append(Stamp.$('<span>').text('商品总价：'))
      .append('<span class="content">' + original + '</span>'))

    details.append(Stamp.$('<div>')
      .append(Stamp.$('<span>').text('订单总价(含邮费)：'))
      .append('<span class="content">' + withFare + '</span>'))

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

    var nodes = self.fairy.order.nodes

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

module.exports = Settle