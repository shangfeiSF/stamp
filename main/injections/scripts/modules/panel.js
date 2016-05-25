function Panel(fairy) {
  this.nodes = {
    /* init add */
    panel: null,
    trigger: null,
    container: null,

    /* render add */
    root: null,

    count: null,
    specs: null,

    purchase: null,
    add2MyCart: null,
    showMycart: null
  }

  this._origScriptSessionIdPattern = /dwr\.engine\.\_origScriptSessionId\s*\=\s*\"(.*)\"/

  this.fairy = fairy
}

Stamp.$.extend(Panel.prototype, {
  init: function () {
    var self = this

    var panelId = '_panel_'
    var triggerId = '_trigger_'

    var panel = Stamp.$('<div></div>').attr('id', panelId)
    var trigger = Stamp.$('<div></div>').attr('id', triggerId).text('快速下单')
    var container = Stamp.$('<div></div>').attr('id', '_container_')

    self.nodes.panel = panel
    self.nodes.trigger = trigger
    self.nodes.container = container

    panel.append(trigger)
    panel.append(container)
    Stamp.$('body').append(panel)

    new Draggable(panelId, {
      handle: triggerId
    })

    self.render()
  },

  render: function () {
    var self = this

    self.countRender()
    self.specsRender()
    self.purchaseRender()
    self.add2MyCartRender()
    self.showMyCartRender()

    self.countBind()
    self.specsBind()
    self.purchaseBind()
    self.add2MyCartBind()
    self.showMyCartBind()

    self.append()
  },

  countRender: function () {
    var self = this

    var count = Stamp.$('<input>', {
      type: 'number',
      id: '_count_',
      min: 1,
      value: 1
    }).css({
      width: '4em',
      margin: '0 0.5em 0 0',
      'text-aligen': 'center'
    })

    self.nodes.count = count
  },

  specsRender: function () {
    var self = this

    var cache = self.fairy.cache
    var details = self.fairy.details

    var count = self.nodes.count

    var specs = Stamp.$('<div class="specs"></div>')

    Stamp.$.each(details.goodsAttrList, function (index, attr) {
      var wrap = Stamp.$('<sapn class="spec"></sapn>')

      var id = ['_sepc_', index].join('')

      var spec = Stamp.$('<input>', {
        type: 'radio',
        id: id,
        name: 'spec',
        value: index,
      }).data('info', attr)

      var label = Stamp.$('<label>', {
        for: id
      }).text(attr.attrName)

      if (index == 0) {
        spec.attr('checked', 'checked')
        label.addClass('selected')

        count.attr('max', attr.buyLimit)

        cache.specIndex = index
        cache.buyLimit = attr.buyLimit

        var limit = ['(购买数量上限：', attr.buyLimit, ')'].join('')
        count.after(Stamp.$('<span>').css({
          color: '#aaa'
        }).text(limit))
      }

      wrap.append(spec).append(label)

      specs.append(wrap)
    })
    
    self.nodes.specs = specs
  },

  purchaseRender: function () {
    var self = this

    var purchase = Stamp.$('<input>', {
      type: 'button',
      id: '_purchase_',
      value: '立即购买'
    }).addClass('btn btn-success')

    self.nodes.purchase = purchase
  },

  add2MyCartRender: function () {
    var self = this

    var add2MyCart = Stamp.$('<input>', {
      type: 'button',
      id: '_add2MyCart_',
      value: '加入购物车'
    }).addClass('btn btn-warning')

    self.nodes.add2MyCart = add2MyCart
  },

  showMyCartRender: function () {
    var self = this

    var showMycart = Stamp.$('<input>', {
      type: 'button',
      id: '_showMycart_',
      value: '我的购物车'
    }).addClass('btn btn-info')

    self.nodes.showMycart = showMycart
  },

  countBind: function () {
    var self = this

    self.nodes.count.on('change', function () {
      var target = Stamp.$(this)
      var max = +target.attr('max')

      Number(target.val()) > max && target.val(String(max))
    })
  },

  specsBind: function () {
    var self = this

    var cache = self.fairy.cache

    var nodes = self.nodes

    nodes.specs.on('change', function (e) {
      var target = Stamp.$(e.target)

      Stamp.$.each(Stamp.$(this).find('label'), function (index, node) {
        var node = Stamp.$(node)

        node.removeClass('selected')

        node.attr('for').split('_').pop() === target.val() && node.addClass('selected')
      })

      nodes.count.attr('max', Number(target.data('info').buyLimit))

      cache.specIndex = target.val()
      cache.buyLimit = target.data('spec').buyLimit
    })
  },

  purchaseBind: function () {
    var self = this

    var cache = self.fairy.cache
    var details = self.fairy.details

    var nodes = self.nodes
    var purchase = nodes.purchase
    var count = nodes.count

    purchase.on('click', function () {
      var params = {
        'buyGoodsNowBean.goods_id': self.fairy.cache.goodsId,
        'buy_type': details.goodsStatus.lottery ? '3' : '2',
        'buyGoodsNowBean.goods_attr_id': details.goodsAttrList[cache.specIndex].id,
        'buyGoodsNowBean.goods_num': count.val(),
        'goodsTicketAttr': details.goodsAttrList[cache.specIndex].id
      }

      self.fairy.loader.post('buy', params)
        .then(function (data) {
          if (data.result.search('date_form') > -1 && data.result.search('gwc gwc2') > -1) {
            purchase.off()

            nodes.root.hide()
            count.attr('disabled', 'disabled').hide()

            cache.html4order = data.result
            cache.count = count.val()

            var needVerify = data.result.search('手机确认') > -1 ? true : false
            self.fairy.loader.init(needVerify)
          }
        })
    })
  },

  add2MyCartBind: function () {
    var self = this

    var cache = self.fairy.cache
    var details = self.fairy.details

    var nodes = self.nodes
    var count = nodes.count
    var add2MyCart = nodes.add2MyCart

    add2MyCart.on('click', function () {
      self.fairy.loader.post('user')
        .asCallback(function (error, data) {
          if (data.textStatus === 'success') {
            cache.userType = data.result.userType
            cache.userId = data.result.userId

            var mock = {
              _origScriptSessionId: self._get_origScriptSessionId()
            }

            ShoppingCartAction.addGoodsToShoppingCartLS(details.goodsId, count.val(), details.goodsAttrList[cache.specIndex].id, function (msg) {
              self.fairy.cart.addRecordsRender(msg)
            }, mock)
          }
        })
    })
  },

  _get_origScriptSessionId: function () {
    var self = this

    var _origScriptSessionId = undefined

    Stamp.$.ajax({
      type: 'GET',
      url: 'http://jiyou.biz.11185.cn/dwr/engine.js',
      cache: false,
      async: false,
      success: function (content) {
        var matches = self._origScriptSessionIdPattern.exec(content)
        matches && matches.length == 2 && ( _origScriptSessionId = matches.pop() + Math.floor(Math.random() * 31793))
      },
      error: function () {
        _origScriptSessionId = undefined
      }
    })

    return _origScriptSessionId
  },

  showMyCartBind: function () {
    var self = this

    var cache = self.fairy.cache

    var nodes = self.nodes
    var showMycart = nodes.showMycart

    showMycart.on('click', function () {
      Stamp.$.ajax({
        tupe: 'GET',
        url: 'http://jiyou.biz.11185.cn/u/show.html',
        success: function (html) {
          cache.html4cart = html
          self.fairy.cart.render()
        },
        error: function () {
          cache.html4cart = ''
          // TODO: 拉取购物车失败
        },
        dataType: 'html'
      })
    })
  },

  append: function () {
    var self = this
    var nodes = self.nodes

    var sections = [
      'specsSection',
      'countSection',
      'purchaseSection',
      'add2MyCartSection',
      'showMyCartSection'
    ]

    sections = Stamp.$.map(sections, function (klass) {
      return Stamp.$('<div>', {
        class: ['section', klass].join(' ')
      })
    })

    sections[0].append(nodes.specs)
    sections[1].append(nodes.count)
    sections[2].append(nodes.purchase)
    sections[3].append(nodes.add2MyCart)
    sections[4].append(nodes.showMycart)

    var root = Stamp.$('<div class="goodsRoot"></div>')
    Stamp.$.each(sections, function (index, section) {
      root.append(section)
    })

    root.prepend(Stamp.$('<span class="tip">').text('提示：选择规格和数量后生成快速订单'))

    nodes.root = root
    nodes.container.append(root)
  },
})

module.exports = Panel