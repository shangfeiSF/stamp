function Cart(fairy) {
  this.nodes = {
    /* render add */
    root: null,

    notes: null,
    goods: null,
    settlement: null
  }

  this.settlementURL = 'http://jiyou.biz.11185.cn/retail/initPageAfterMyShopcart.html?shoppingcartIds='

  this.fairy = fairy
}

Stamp.$.extend(Cart.prototype, {
  gerRoot: function () {
    var self = this

    if (!self.nodes.root) {
      self.nodes.root = Stamp.$('<div class="cartRoot">')
      self.fairy.panel.nodes.root.after(self.nodes.root)
    }

    return self.nodes.root
  },

  addRecordsRender: function (msg) {
    var self = this

    var cache = self.fairy.cache
    var details = self.fairy.details

    var nodes = self.nodes
    var root = self.gerRoot()

    var notes = nodes.notes ? nodes.notes : Stamp.$('<div class="notes">')

    var index = notes.children('.note').length + 1
    var note = Stamp.$('<div>', {
      id: ['_note_', index].join('')
    }).addClass('note').append(Stamp.$('<span class="sequence"></span>').text(index + '. '))

    var matches = msg.match(/^\[(.*)\]$/)
    matches && matches.length == 2 && (matches = matches.pop())

    var params = matches.split(',')
    var klass = params[0] === "'true'" ? 'success' : 'failed'
    var content = params[0] === "'true'" ?
      [details.goodsAttrList[cache.specIndex].attrName, '（', self.fairy.panel.nodes.count.val(), '）'].join('') :
      String(params[1]).slice(1, -1)

    note.append(Stamp.$('<span>').addClass(klass).text(content))

    notes.append(note)

    if (!nodes.notes) {
      notes.prepend(Stamp.$('<div class="title">加入购物车记录</div>'))

      self.nodes.notes = notes

      root.prepend(notes)
    }
  },

  render: function (shopInfos, goodsInfos) {
    var self = this

    self.goodsInCartRender(shopInfos, goodsInfos)
    self.settlementRender()

    self.goodsInCartBind()
    self.settlementBind()
  },

  goodsInCartRender: function (shopInfos, goodsInfos) {
    var self = this

    var cache = self.fairy.cache

    var nodes = self.nodes
    var root = self.gerRoot()

    var goods = nodes.goods ? nodes.goods : Stamp.$('<div class="goods">')

    if (nodes.goods) {
      nodes.goods.find('.shopList').empty()
    }
    else {
      goods.append(Stamp.$('<div class="title">我的购物车</div>'))
      goods.append(Stamp.$('<div class="shopList"></div>'))

      root.append(goods)
      self.nodes.goods = goods
    }

    var keys = ['name', 'date', 'spec', 'unit', 'total']
    var infosArr = goodsInfos.map(function (infosArr) {
      return infosArr.map(function (item) {
        var node = Stamp.$(item.node)
        var info = {
          goodsId: item.goodsId,
          cartId: item.cartId,
          title: item.goodsTitle,
          limit: item.goodsLimit,
          price: item.goodsPrice
        }

        info.image = node.find('img').attr('src') || ''

        Stamp.$.each(node.find('span'), function (index, span) {
          info[keys[index]] = Stamp.$(span).text()
        })

        info.count = info.total / info.unit

        return info
      })
    })

    cache.shops = []
    Stamp.$.each(shopInfos, function (index, entry) {
      var shop = Stamp.$('<div class="shop">').addClass('selected')

      var id = ['_shopId_', index].join('')

      var checkbox = Stamp.$('<input>', {
        type: 'checkbox',
        id: id,
        name: 'shopId',
        value: entry.shopId,
        checked: 'checked'
      })

      cache.shops.push({
        shopId: entry.shopId,
        goods: infosArr[index]
      })

      var label = Stamp.$('<label>', {
        for: id
      }).append(Stamp.$('<div>').text(entry.shopName))

      shop.append(checkbox).append(label)

      infosArr[index].each(function (info) {
        var good = Stamp.$('<div class="good">').attr('data-cartId', info.cartId)

        good.append(Stamp.$('<div>').text('商品名称：' + info.title))
        good.append(Stamp.$('<div>').text('发行日期：' + info.date))
        good.append(Stamp.$('<div>').text('规格：' + info.spec))
        good.append(Stamp.$('<div>').text('数量：' + info.count))
        good.append(Stamp.$('<div>').text('限购：' + info.limit))
        good.append(Stamp.$('<div>').text('单价：' + info.price))
        good.append(Stamp.$('<div>').text('小计：' + info.total))

        shop.append(good)
      })

      goods.find('.shopList').append(shop)
    })
  },

  settlementRender: function () {
    var self = this

    var nodes = self.nodes
    var root = self.gerRoot()

    if (!nodes.settlement) {
      var settlement = Stamp.$('<input>', {
        type: 'button',
        id: '_settlement_',
        value: '结算'
      }).addClass('btn btn-success')

      self.nodes.settlement = settlement

      var settle = Stamp.$('<div class="settle">')
      settle.append(settlement)

      root.append(settle)
    }
  },

  goodsInCartBind: function () {
    var self = this

    self.nodes.goods.on('change', function (e) {
      Stamp.$(e.target).parent().toggleClass('selected')
    })
  },

  settlementBind: function () {
    var self = this

    var cache = self.fairy.cache
    var nodes = self.nodes

    nodes.settlement.on('click', function () {
      var shoppingcartIds = []

      Stamp.$.each(nodes.goods.find('.shop.selected'), function (i, node) {
        var node = Stamp.$(node)

        Stamp.$.each(node.find('.good'), function (j, good) {
          shoppingcartIds.push(Stamp.$(good).attr('data-cartid'))
        })
      })

      if (shoppingcartIds.length) {
        ShoppingCartAction.checkShoppingCartTid(shoppingcartIds.join(';'), function (msg) {
          var msgType = msg.substring(msg.indexOf("\'") + 1, msg.indexOf("\',"))
          // var msgValue = msg.substring(msg.indexOf("\',\'") + 3, msg.lastIndexOf("\']"))

          if (msgType == 'true') {
            Stamp.$.ajax({
              tupe: 'GET',
              url: self.settlementURL + shoppingcartIds.join(';') + '&fg=3',
              async: false,
              success: function (html) {
                cache.html4settlement = html
              },
              error: function () {
                cache.html4settlement = ''
              },
              dataType: 'html'
            })

            if (cache.html4settlement.search('date_form') > -1 && cache.html4settlement.search('gwc gwc2') > -1) {
              nodes.settlement.off()

              var needVerify = cache.html4settlement.search('手机确认') > -1 ? true : false

              self.fairy.loader.settle(needVerify, 'settlement')
            }
          }
        })
      }
    })
  }
})

module.exports = Cart