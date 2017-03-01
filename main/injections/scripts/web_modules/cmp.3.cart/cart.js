function Cart(fairy) {
  this.fairy = fairy

  this.booted = false

  this.settleURL = 'http://jiyou.retail.11185.cn/retail/initPageAfterMyShopcart.html?shoppingcartIds='

  this.nodes = {
    root: null,

    shops: null,
    settlement: null,
    settle: null,
    total: null
  }

  this._triggerListener()
}

Stamp.$.extend(
  Cart.prototype,
  {
    boot: function () {
      var self = this

      var nodes = self.nodes

      var root = Stamp.$('<div class="cartRoot">')
      nodes.root = root

      nodes.shops = Stamp.$('<div class="shops">')
      nodes.shops.append(Stamp.$('<div class="title">我的购物车</div>'))
      nodes.shops.append(Stamp.$('<div class="shopsList"></div>'))

      nodes.settlement = Stamp.$('<div class="settlement">')
      nodes.refresh = Stamp.$('<input>', {
        type: 'button',
        value: '刷新'
      }).addClass('btn btn-info')
      nodes.settle = Stamp.$('<input>', {
        type: 'button',
        value: '结算'
      }).addClass('btn btn-success')
      nodes.total = Stamp.$('<span class="settleTotal">')

      nodes.settlement
        .append(nodes.refresh)
        .append(nodes.settle)
        .append(nodes.total)

      root.append(nodes.shops)
      root.append(nodes.settlement)

      self.booted = true
    },

    _changeReffer: function (state, shoppingcartIds) {
      var self = this

      var MAP = {
        'cart': 'http://jiyou.retail.11185.cn/u/show.html?message=',
        'cartSettle': self.settleURL + shoppingcartIds.join(';') + ';&fg=3',
      }
      Stamp.probe.execute('changeReffer', {
        currentReffer: MAP[state]
      })
    },

    _parseShops: function () {
      var self = this

      var cache = self.fairy.cache

      var main = Stamp.$.grep(Stamp.$(cache.html4cart), function (dom) {
        return Stamp.$(dom).hasClass('gwc')
      })

      if (!main.length) {
        cache.shops = []
        return false
      }

      var shops = []
      main = Stamp.$(main.pop())

      var index = 0
      Stamp.$.each(main.find('table tbody tr'), function (i, node) {
        var node = Stamp.$(node)

        if (node.hasClass('splt')) {
          var text = node.find('p').text()

          text.indexOf('暂无商品') == -1 && shops.push({
            index: index++,
            id: node.find('input').val(),
            name: node.find('p').text(),
            goods: [],
            total: 0
          })
        }
        else {
          var details = {}
          var props = ['title', 'date', 'spec', 'price', 'total']

          Stamp.$.each(node.find('span'), function (index, span) {
            details[props[index]] = Stamp.$(span).text()
          })
          details.count = details.total / details.price

          shops[shops.length - 1].goods.push({
            id: node.nextAll('input[name="goodsId"]').val(),
            cart: node.nextAll('input[name="cartId"]').val(),
            title: node.nextAll('input[name="goodsTitle"]').val() || details.title,
            image: node.find('img').attr('src') || '',
            date: details.date,
            spec: details.spec,
            count: String(details.count),
            limit: node.nextAll('input[name="goodsLimit"]').val(),
            price: node.nextAll('input[name="goodsPrice"]').val() || details.price,
            total: details.total
          })

          shops[shops.length - 1].total += (+details.total) * 100
        }
      })

      cache.shops = shops
      return true
    },

    _getShowPage: function (callback) {
      var self = this

      var cache = self.fairy.cache

      Stamp.$.ajax({
        tupe: 'GET',
        url: 'http://jiyou.retail.11185.cn/u/show.html?message=',
        success: function (html) {
          cache.html4cart = html

          self._changeReffer('cart', [])

          self.fairy.cart.init(true)
          callback && callback(self.fairy.cart)
        },
        error: function () {
          cache.html4cart = ''
          self.fairy.cart.init(false)
        },
        dataType: 'html'
      })
    },

    _triggerListener: function () {
      var self = this

      var anchor = self.fairy.layout.cartBlock.anchor
      var tabBlockTriggers = self.fairy.panel.nodes.tabBlockTriggers

      tabBlockTriggers[anchor].on('click', function () {
        self.booted && self.nodes.root.hide()
        self._getShowPage()
      })
    }
  },
  {
    init: function (state) {
      var self = this

      var current = self.booted ? true : false
      !current && self.boot()

      if (state) {
        if (self._parseShops()) {
          self.goodsInCart_render()
          self.settle_render()
          self.nodes.root.show()
        } else {
          alert('解析购物车失败！')
        }
      } else {
        alert('同步购物车失败！')
      }

      if (!current) {
        self.goodsInCart_bind()
        self.settle_bind()
        self.refresh_bind()
        self.append()
      }
    },

    append: function () {
      var self = this

      self.fairy.panel.nodes.tabBlocks[self.fairy.layout.cartBlock.anchor].append(self.nodes.root)
    }
  },
  {
    goodsInCart_render: function () {
      var self = this

      var cache = self.fairy.cache

      var nodes = self.nodes
      var shops = nodes.shops

      shops.find('.shopsList').empty()

      if (!cache.shops.length) {
        var emptycart = shops.find('.emptycart')
        !emptycart.length && shops.append(Stamp.$('<div class="emptycart">').text('购物车内暂无商品'))
      }
      else {
        shops.find('.emptycart').remove()
      }

      Stamp.$.each(cache.shops, function (index, shop) {
        var shopItem = Stamp.$('<div class="shop">')

        var id = ['_shopId_', index].join('')

        var checkbox = Stamp.$('<input>', {
          type: 'checkbox',
          id: id,
          name: 'shopId',
          value: shop.id
        })
        if (index == 0) {
          shopItem.addClass('selected')
          checkbox.attr('checked', 'checked')
        }

        var label = Stamp.$('<label>', {
          for: id
        }).append(Stamp.$('<div>').text(shop.name))

        var shopTotal = Stamp.$('<div class="shopTotal">')
        shopTotal.text('总价：').append(Stamp.$('<span>').text((shop.total / 100).toFixed(2)))
        shopItem
          .append(checkbox)
          .append(label)
          .append(Stamp.$('<div class="goodsList">'))
          .append(shopTotal)

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
          shopItem.find('.goodsList').append(goodItem)
        })

        shops.find('.shopsList').append(shopItem)
      })
    },

    settle_render: function () {
      var self = this

      var nodes = self.nodes
      var total = nodes.total

      total.empty()

      var totalPrice = 0
      Stamp.$.each(nodes.shops.find('.shopsList .selected .shopTotal span'), function (index, span) {
        totalPrice += +Stamp.$(span).text() * 100
      })

      total.text('总计：').append(Stamp.$('<span>').text(parseFloat(totalPrice / 100).toFixed(2)))
    }
  },
  {
    goodsInCart_bind: function () {
      var self = this

      var nodes = self.nodes

      nodes.shops.on('change', function (e) {
        Stamp.$(e.target).parent().toggleClass('selected')

        var totalPrice = 0
        Stamp.$.each(nodes.shops.find('.shopsList .selected .shopTotal span'), function (index, span) {
          totalPrice += +Stamp.$(span).text() * 100
        })
        nodes.total.find('span').text(parseFloat(totalPrice / 100).toFixed(2))
      })
    },

    settle_bind: function () {
      var self = this

      var cache = self.fairy.cache
      var nodes = self.nodes

      nodes.settle.on('click', function (e, schedule) {
        var shoppingcartIds = []

        Stamp.$.each(nodes.shops.find('.shop.selected'), function (i, node) {
          Stamp.$.each(Stamp.$(node).find('.good'), function (j, good) {
            shoppingcartIds.push(Stamp.$(good).attr('data-cart'))
          })
        })

        if (!shoppingcartIds.length) return false

        var panelNodes = self.fairy.panel.nodes
        var anchor = self.fairy.layout.cartSettleBlock.anchor

        panelNodes.tabBlocks[anchor].empty()
        panelNodes.tabBlocks[anchor].append(Stamp.$('<div class="loading">').text('生成订单中...'))
        panelNodes.tabBlockTriggers[anchor].trigger('click')

        var mock = {
          _origScriptSessionId: self.fairy.get_origScriptSessionId()
        }

        ShoppingCartAction.checkShoppingCartTid(shoppingcartIds.join(';'), function (msg) {
          var msgType = msg.substring(msg.indexOf("\'") + 1, msg.indexOf("\',"))
          // var msgValue = msg.substring(msg.indexOf("\',\'") + 3, msg.lastIndexOf("\']"))

          if (msgType !== 'true') return false

          self._changeReffer('cart', [])

          Stamp.$.ajax({
            tupe: 'GET',
            url: self.settleURL + shoppingcartIds.join(';') + ';&fg=3',
            success: function (html) {
              cache.html4settle = html

              if (html.search('date_form') > -1 && html.search('gwc gwc2') > -1) {

                var needVerify = cache.html4settle.search('手机确认') > -1 ? true : false

                self._changeReffer('cartSettle', shoppingcartIds)
                self.fairy.cartSettle.init(needVerify, schedule)
              }
            },
            error: function () {
              cache.html4settle = ''
            },
            dataType: 'html'
          })
        }, mock)
      })
    },

    refresh_bind: function () {
      var self = this
      var nodes = self.nodes

      nodes.refresh.on('click', function () {
        self._changeReffer('cart', [])
        nodes.root.hide()
        self._getShowPage()
      })
    }
  }
)

module.exports = Cart