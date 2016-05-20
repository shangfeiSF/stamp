function Cart(fairy) {
  this.nodes = {
    /* render add */
    root: null,

    notes: null,
    shops: null,
    settle: null
  }

  this.settleURL = 'http://jiyou.biz.11185.cn/retail/initPageAfterMyShopcart.html?shoppingcartIds='

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

  render: function () {
    var self = this

    self.parseShops()

    self.goodsInCartRender()
    self.settleRender()

    self.goodsInCartBind()
    self.settleBind()
  },

  parseShops: function () {
    var self = this

    var cache = self.fairy.cache

    var main = Stamp.$.grep(Stamp.$(cache.html4cart), function (dom) {
      return Stamp.$(dom).hasClass('gwc')
    })

    if (!main.length) return null

    var shops = []
    main = Stamp.$(main.pop())

    var index = 0
    Stamp.$.each(main.find('table tbody tr'), function (i, node) {
      var node = Stamp.$(node)

      if (node.hasClass('splt')) {
        shops.push({
          index: index++,
          id: node.find('input').val(),
          name: node.find('p').text(),
          goods: []
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
      }
    })

    cache.shops = shops
  },

  goodsInCartRender: function () {
    var self = this

    var cache = self.fairy.cache

    var nodes = self.nodes
    var root = self.gerRoot()

    var shops = nodes.shops ? nodes.shops : Stamp.$('<div class="shops">')

    if (nodes.shops) {
      nodes.shops.find('.shopList').empty()
    }
    else {
      shops.append(Stamp.$('<div class="title">我的购物车</div>'))
      shops.append(Stamp.$('<div class="shopsList"></div>'))

      root.append(shops)
      self.nodes.shops = shops
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

      shopItem.append(checkbox).append(label).append(Stamp.$('<div class="goodsList">'))

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
        moreInfos.append(Stamp.$('<div>').text('规格：' + good.spec))
        moreInfos.append(Stamp.$('<div>').text('数量：' + good.count))
        moreInfos.append(Stamp.$('<div>').text('限购：' + good.limit))
        moreInfos.append(Stamp.$('<div>').text('单价：' + good.price))
        moreInfos.append(Stamp.$('<div>').text('小计：' + good.total))

        goodItem.append(title).append(moreInfos)
        shopItem.find('.goodsList').append(goodItem)
      })

      shops.find('.shopsList').append(shopItem)
    })
  },

  settleRender: function () {
    var self = this

    var nodes = self.nodes
    var root = self.gerRoot()

    if (!nodes.settle) {
      var settle = Stamp.$('<input>', {
        type: 'button',
        id: '_settle_',
        value: '结算购物车'
      }).addClass('btn btn-success')

      self.nodes.settle = settle

      var settlement = Stamp.$('<div class="settlement">')
      settlement.append(settle)

      root.append(settlement)
    }
  },

  goodsInCartBind: function () {
    var self = this

    self.nodes.shops.on('change', function (e) {
      Stamp.$(e.target).parent().toggleClass('selected')
    })
  },

  settleBind: function () {
    var self = this

    var cache = self.fairy.cache
    var nodes = self.nodes

    nodes.settle.on('click', function () {
      nodes.root.hide()

      var shoppingcartIds = []

      Stamp.$.each(nodes.shops.find('.shop.selected'), function (i, node) {
        Stamp.$.each(Stamp.$(node).find('.good'), function (j, good) {
          shoppingcartIds.push(Stamp.$(good).attr('data-cart'))
        })
      })

      if (!shoppingcartIds.length) return false

      ShoppingCartAction.checkShoppingCartTid(shoppingcartIds.join(';'), function (msg) {
        var msgType = msg.substring(msg.indexOf("\'") + 1, msg.indexOf("\',"))
        // var msgValue = msg.substring(msg.indexOf("\',\'") + 3, msg.lastIndexOf("\']"))

        if (msgType !== 'true') return false

        Stamp.$.ajax({
          tupe: 'GET',
          url: self.settleURL + shoppingcartIds.join(';') + '&fg=3',
          success: function (html) {
            cache.html4settle = html

            if (html.search('date_form') > -1 && html.search('gwc gwc2') > -1) {
              nodes.settle.off()

              var needVerify = cache.html4settle.search('手机确认') > -1 ? true : false

              self.fairy.settle.init(needVerify)
            }
          },
          error: function () {
            cache.html4settle = ''
          },
          dataType: 'html'
        })
      })
    })
  }
})

module.exports = Cart