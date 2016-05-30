var Order = require('order')

function cartSettle(fairy) {
  this.fairy = fairy

  this.order = null

  this.needVerify = false
}

Stamp.$.extend(
  cartSettle.prototype,
  {
    init: function (needVerify, schedule) {
      var self = this
      var cache = self.fairy.cache

      self.needVerify = needVerify

      if (schedule) {
        self.autoBook = true

        self.fairy.cache.userType = schedule.userType
        self.fairy.cache.userId = schedule.userId
        self.fairy.cache.message = schedule.message
        self.fairy.cache.sid = schedule.sid
        self.fairy.cache.token = schedule.token

        self.order = new Order(self.fairy)
        self.order.init(null, needVerify, schedule)

        self.shortCut()
      }
      else {
        self.autoBook = false

        self.fairy.post('user')
          .asCallback(function (error, data) {
            if (data.textStatus === 'success') {
              cache.userType = data.result.userType
              cache.userId = data.result.userId

              self.order = new Order(self.fairy)
              self.order.init(null, needVerify)
            }
          })
          .then(function () {
            self.getSid()
          })
      }
    }
  },
  {
    getSid: function () {
      var self = this
      var cache = self.fairy.cache

      var nodes = self.order.nodes

      Stamp.probe.execute('getSid', {}, function (message) {
        cache.sid = message.data.sid

        var image = Stamp.$('<img>', {
            src: message.data.image
          })
          .on('dblclick', function () {
            nodes.image.attr('src', [self.fairy.imageBase, "&sid=", cache.sid, "&", Math.random()].join(''))
            Stamp.$.each(nodes.checkboxs, function (index, checkbox) {
              Stamp.$(checkbox).attr('checked', false)
            })
          })

        nodes.image = image
        nodes.answer.prepend(image)
        nodes.answer.show()

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

      var nodes = self.order.nodes

      var params = {
        buyer_user_id: cache.userId
      }

      self.fairy.post('address', params)
        .then(function (data) {
          if (data.textStatus !== 'success') return false

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

            var id = ['_cartSettle_address_', index].join('')

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

      var nodes = self.order.nodes

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
          target.hasClass('shopName') && target.next('.goodsBill').toggle('fast')
        })

        nodes.addressSection.after(shopsfareSection)

        nodes.shopsfareList = shopsfareList
        nodes.shopsfareSection = shopsfareSection
      }
      else {
        shopsfareSection = nodes.shopsfareSection
        nodes.shopsfareRadios = []
        shopsfareSection.find('.fares').empty()
        shopsfareSection.find('.subtotal em').empty()
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

          self.fairy.post('fare', params)
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

              var defaultFare = -1, texts = ['邮政小包', '国内小包', '快递包裹']
              texts.each(function (text) {
                defaultFare == -1 && (defaultFare = fareNames.indexOf(text))
              })
              defaultFare == -1 && (defaultFare = 0)

              var wrap = shopsfareSection.find('#shopId_' + shop.id)

              var fares = null, subtotal = null
              if (init) {
                var shopName = Stamp.$('<label class="shopName">').text(shop.name)

                var goodsList = Stamp.$('<div class="goodsBill">')
                shop.goods.each(function (good) {
                  var goodItem = Stamp.$('<div class="good">')
                    .attr('data-id', good.id)
                    .attr('data-cart', good.cart)

                  var title = Stamp.$('<div class="goodTiltle">').text(good.title).on('click', function (e) {
                    var target = Stamp.$(e.target)
                    target.next('.moreInfos').toggle('fast')
                  })

                  var moreInfos = Stamp.$('<div class="moreInfos">').hide()
                  //moreInfos.append(Stamp.$('<img>').attr('src：' + good.image))
                  moreInfos.append(Stamp.$('<div>').text('发行日期：' + good.date))
                  moreInfos.append(Stamp.$('<div>').text('限购：' + good.limit))
                  moreInfos.append(Stamp.$('<div>').text('规格：' + good.spec))
                  moreInfos.append(Stamp.$('<div>')
                    .text('订购数量：')
                    .append(Stamp.$('<em>').text(good.count))
                  )
                  moreInfos.append(Stamp.$('<div>')
                    .text('单价：')
                    .append(Stamp.$('<em>').text(parseFloat(good.price).toFixed(2)))
                  )
                  moreInfos.append(Stamp.$('<div>')
                    .text('小计：')
                    .append(Stamp.$('<em>').text(good.total))
                  )

                  goodItem.append(title).append(moreInfos)
                  goodsList.append(goodItem).hide()
                })

                fares = Stamp.$('<div class="fares">').attr('data-shopId', shop.id)
                fares.on('change', function (e) {
                  var target = Stamp.$(e.target)

                  var shopId = target.parent().attr('data-shopId')

                  var shop = Stamp.$.grep(cache.shops, function (shop) {
                    return shopId == shop.id
                  })
                  shop.length && (shop = shop.pop())
                  shop.fareId = target.val()

                  Stamp.$.each(Stamp.$(this).find('label'), function (index, node) {
                    var node = Stamp.$(node)

                    node.removeClass('selected')
                    if (node.attr('for') === target.attr('id')) {
                      node.addClass('selected')
                    }
                  })

                  self.calculate(shop, target.parent().next('.subtotal'))
                })

                subtotal = Stamp.$('<div class="subtotal">').attr('data-shopId', shop.id)
                var original = Stamp.$('<span class="original"></span>').text('商品：').append(Stamp.$('<em>'))
                var fare = Stamp.$('<span class="fare"></span>').text('邮费：').append(Stamp.$('<em>'))
                var withFare = Stamp.$('<span class="withFare"></span>').text('订单：').append(Stamp.$('<em>'))
                subtotal.append(original).append(fare).append(withFare)

                wrap.append(shopName).append(goodsList).append(fares).append(subtotal)
              }
              else {
                fares = wrap.find('.fares')
                subtotal = wrap.find('.subtotal')
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

                  self.calculate(shop, subtotal)
                }

                fares.append(radio).append(label)
              })
            })
        }
      })
    },

    calculate: function (shop, subtotal) {
      var self = this

      var cache = self.fairy.cache

      var fareSelected = Stamp.$.grep(shop.fare, function (fare) {
        return fare.id == shop.fareId
      })
      fareSelected && fareSelected.length && (fareSelected = fareSelected.pop())

      var addressSelected = Stamp.$.grep(cache.address, function (address) {
        return address.id == cache.addressId
      })
      addressSelected && addressSelected.length && (addressSelected = addressSelected.pop())

      var goods_ids = shop.goods.map(function (good) {
        return good.id
      })
      var params = {
        fare_code: fareSelected.code,
        total_weight: shop.order_total_weight,
        shopID: shop.id,
        user_new_address_province: addressSelected.province,
        buyer_user_id: cache.userId,
        goods_ids: goods_ids.join(',') + ',',
      }

      self.fairy.post('fee', params)
        .then(function (data) {
          if (data.textStatus === 'success') {
            if (self.autoBook) {
              setTimeout(function () {
                self.order.nodes.book.trigger('click')
              }, 1000)
            } else {
              self._calculate(shop, subtotal, data.result)
            }
          }
        })
    },

    _calculate: function (shop, subtotal, fareFee) {
      var self = this

      var nodes = self.order.nodes

      var original = shop.goods.reduce(function (pre, next) {
        return pre + Number(next.price) * Number(next.count)
      }, 0)
      var fare = Number(fareFee)
      var withFare = original + fare

      subtotal.find('.original em').text(original.toFixed(2))
      subtotal.find('.fare em').text(fare.toFixed(2))
      subtotal.find('.withFare em').text(withFare.toFixed(2))

      var priceScetion = nodes.root.find('.detailSection')
      if (priceScetion.length === 0) {
        priceScetion = Stamp.$('<div class="section detailSection"></div>')

        priceScetion.append(Stamp.$('<div class="title">结算总计</div>'))
        priceScetion.append(Stamp.$('<div class="details">'))

        var original = Stamp.$('<span class="original"></span>').text('商品：').append(Stamp.$('<em>'))
        var fare = Stamp.$('<span class="fare"></span>').text('邮费：').append(Stamp.$('<em>'))
        var withFare = Stamp.$('<span class="withFare"></span>').text('订单：').append(Stamp.$('<em>'))

        priceScetion.find('.details').append(original).append(fare).append(withFare)

        nodes.priceSection = priceScetion
        nodes.shopsfareSection.after(priceScetion)
      }
      else {
        priceScetion.find('.details em').empty()
      }

      var details = priceScetion.find('.details')

      var originalTotal = 0, fareTotal = 0, withFareTotal = 0
      Stamp.$.each(nodes.shopsfareList.find('.subtotal'), function (index, subtotal) {
        originalTotal += +(Stamp.$(subtotal).find('.original em').text()) * 100
        fareTotal += +(Stamp.$(subtotal).find('.fare em').text()) * 100
        withFareTotal += +(Stamp.$(subtotal).find('.withFare em').text()) * 100
      })
      details.find('.original em').text(parseFloat(originalTotal / 100).toFixed(2))
      details.find('.fare em').text(parseFloat(fareTotal / 100).toFixed(2))
      details.find('.withFare em').text(parseFloat(withFareTotal / 100).toFixed(2))
    },
  },
  {
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

      var completed = cache.shops.every(function (shop) {
        return shop.fare ?
          (shop.fare.length ? shop.fareId && String(shop.fareId).length : true) :
          true
      })
      if (!completed) {
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
      var settlefinalPostData = self.fairy.settlefinalPostData

      settlefinalPostData.addressId = cache.addressId
      settlefinalPostData.checkcode = cache.token
      settlefinalPostData.mobile = cache.mobile
      settlefinalPostData.message = cache.message

      var params = {
        shippingType: ['preTradelist[', '].postageInfo.shippingType'],
        mailType: ['preTradelist[', '].mailType']
      }

      cache.shops.each(function (shop) {
        if (shop.fare && shop.canGetFare) {
          var index = Number(shop.goodsList_index) - 1

          var shippingType = [params.shippingType[0], index, params.shippingType[1]].join('')
          var mailType = [params.mailType[0], index, params.mailType[1]].join('')

          var fareSelected = Stamp.$.grep(shop.fare, function (fare) {
            return fare.id == shop.fareId
          }).pop()

          settlefinalPostData[shippingType] = fareSelected.code
          settlefinalPostData[mailType] = fareSelected.type
        }
      })

      self.fairy.post('book', settlefinalPostData)
        .then(function (data) {
          if (data.textStatus === 'success') {
            var dom = Stamp.$(data.result)

            var infoWrap = Stamp.$.grep(dom, function (node) {
              return Stamp.$(node).hasClass('gwc') && Stamp.$(node).hasClass('gwc3')
            })
            var errorWrap = Stamp.$.grep(dom, function (node) {
              return Stamp.$(node).hasClass('smrz') && Stamp.$(node).hasClass('zccgym')
            })

            self.fairy.rush._reset()

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

      var nodes = self.order.nodes

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

      var nodes = self.order.nodes

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
  }
)

module.exports = cartSettle