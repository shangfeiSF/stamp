function Base(fairy) {
  this.fairy = fairy

  this.nodes = {
    /* render add */
    root: null,

    count: null,
    specs: null,

    purchase: null,
    add2MyCart: null,
    showMyCart: null,

    notes: null
  }

  this.init()
}

Stamp.$.extend(
  Base.prototype,
  {
    init: function () {
      this.render()
      this.bind()
      this.append()
    },

    render: function () {
      this.count_render()
      this.specs_render()
      this.purchase_render()
      this.add2MyCart_render()
      this.showMyCart_render()
    },

    bind: function () {
      this.count_bind()
      this.specs_binde()
      this.purchase_bind()
      this.add2MyCart_bind()
      this.showMyCart_bind()
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
      sections[4].append(nodes.showMyCart)

      var root = Stamp.$('<div class="baseRoot"></div>')
      Stamp.$.each(sections, function (index, section) {
        root.append(section)
      })

      root.prepend(Stamp.$('<span class="tip">').text('提示：选择规格和数量后生成快速订单'))

      nodes.root = root
      self.fairy.panel.nodes.tabBlocks[self.fairy.layout.baseBlock.anchor].append(root)
    }
  },
  {
    count_render: function () {
      var self = this

      var count = Stamp.$('<input>', {
        type: 'number',
        min: 1,
        value: 1
      })

      self.nodes.count = count
    },

    specs_render: function () {
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
          count.after(Stamp.$('<span>').text(limit))
        }

        wrap.append(spec).append(label)

        specs.append(wrap)
      })

      self.nodes.specs = specs
    },

    purchase_render: function () {
      var self = this

      var purchase = Stamp.$('<input>', {
        type: 'button',
        value: '立即购买'
      }).addClass('btn btn-success')

      self.nodes.purchase = purchase
    },

    add2MyCart_render: function () {
      var self = this

      var add2MyCart = Stamp.$('<input>', {
        type: 'button',
        value: '加入购物车'
      }).addClass('btn btn-warning')

      self.nodes.add2MyCart = add2MyCart
    },

    showMyCart_render: function () {
      var self = this

      var showMyCart = Stamp.$('<input>', {
        type: 'button',
        value: '我的购物车'
      }).addClass('btn btn-info')

      self.nodes.showMyCart = showMyCart
    },
  },
  {
    count_bind: function () {
      var self = this

      self.nodes.count.on('change', function () {
        var target = Stamp.$(this)
        var max = +target.attr('max')

        Number(target.val()) > max && target.val(String(max))
      })
    },

    specs_binde: function () {
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

    purchase_bind: function () {
      var self = this

      var cache = self.fairy.cache
      var details = self.fairy.details

      var nodes = self.nodes
      var purchase = nodes.purchase
      var count = nodes.count

      purchase.on('click', function () {
        var panelNodes = self.fairy.panel.nodes
        var anchor = self.fairy.layout.baseSettleBlock.anchor

        panelNodes.tabBlocks[anchor].empty()
        panelNodes.tabBlockTriggers[anchor].trigger('click')

        var params = {
          'buyGoodsNowBean.goods_id': self.fairy.cache.goodsId,
          'buy_type': details.goodsStatus.lottery ? '3' : '2',
          'buyGoodsNowBean.goods_attr_id': details.goodsAttrList[cache.specIndex].id,
          'buyGoodsNowBean.goods_num': count.val(),
          'goodsTicketAttr': details.goodsAttrList[cache.specIndex].id
        }

        self.fairy.post('buy', params)
          .then(function (data) {
            if (data.result.search('date_form') > -1 && data.result.search('gwc gwc2') > -1) {
              cache.html4order = data.result
              cache.count = count.val()

              var needVerify = data.result.search('手机确认') > -1 ? true : false
              self.fairy.baseSettle.init(needVerify)
            }
          })
      })
    },

    add2MyCart_bind: function () {
      var self = this

      var cache = self.fairy.cache
      var details = self.fairy.details

      var nodes = self.nodes
      var count = nodes.count
      var add2MyCart = nodes.add2MyCart

      add2MyCart.on('click', function () {
        self.fairy.post('user')
          .asCallback(function (error, data) {
            if (data.textStatus === 'success') {
              cache.userType = data.result.userType
              cache.userId = data.result.userId

              var mock = {
                _origScriptSessionId: self.fairy.get_origScriptSessionId()
              }

              ShoppingCartAction.addGoodsToShoppingCartLS(details.goodsId, count.val(), details.goodsAttrList[cache.specIndex].id, function (msg) {
                self._addRecords(msg)
              }, mock)
            }
          })
      })
    },

    _addRecords: function (msg) {
      var self = this

      var cache = self.fairy.cache
      var details = self.fairy.details

      var nodes = self.nodes
      var root = self.nodes.root

      var notes = nodes.notes ? nodes.notes : Stamp.$('<div class="notes">')

      var index = notes.children('.note').length + 1
      var note = Stamp.$('<div>').addClass('note').append(Stamp.$('<span class="sequence"></span>').text(index + '. '))

      var matches = msg.match(/^\[(.*)\]$/)
      matches && matches.length == 2 && (matches = matches.pop())

      var params = matches.split(',')
      var klass = params[0] === "'true'" ? 'success' : 'failed'
      var content = params[0] === "'true'" ?
        [details.goodsAttrList[cache.specIndex].attrName, '（', self.nodes.count.val(), '）'].join('') :
        String(params[1]).slice(1, -1)

      note.append(Stamp.$('<span>').addClass(klass).text(content))

      notes.append(note)

      if (!nodes.notes) {
        notes.prepend(Stamp.$('<div class="title">加入购物车记录</div>'))

        self.nodes.notes = notes

        root.append(notes)
      }
    },

    showMyCart_bind: function () {
      var self = this

      var cache = self.fairy.cache

      var nodes = self.nodes
      var showMyCart = nodes.showMyCart

      showMyCart.on('click', function () {
        var panelNodes = self.fairy.panel.nodes
        var anchor = self.fairy.layout.cartBlock.anchor

        panelNodes.tabBlockTriggers[anchor].trigger('click')

        Stamp.$.ajax({
          tupe: 'GET',
          url: 'http://jiyou.biz.11185.cn/u/show.html',
          success: function (html) {
            cache.html4cart = html
            self.fairy.cart.init()
          },
          error: function () {
            cache.html4cart = ''
          },
          dataType: 'html'
        })
      })
    },
  }
)

module.exports = Base