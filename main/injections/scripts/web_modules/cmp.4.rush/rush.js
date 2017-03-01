var Dig = require('../cmp.0.assist/dig')

function Rush(fairy) {
  this.fairy = fairy

  this.nodes = {
    root: null,
    sections: [],
    checkboxs: [],
    image: null
  }

  this.schedule = {
    message: '',
    sid: '',
    token: ''
  }

  this.boot()
}

Stamp.$.extend(
  Rush.prototype,
  {
    boot: function () {
      var self = this

      if (!self.fairy.storage.exist('userType') || !self.fairy.storage.exist('userId')) {
        self.fairy.post('user')
          .asCallback(function (error, data) {
            if (data.textStatus === 'success') {
              self.fairy.storage.update('userType', data.result.userType)
              self.fairy.storage.update('userId', data.result.userId)
              self.init()
            } else {
              alert('获取用户类型和用户ID失败')
            }
          })
      }
      else {
        self.init()
      }
    },

    init: function () {
      this.render()
      this.bind()
      this.append()
    },
  },
  {
    render: function () {
      this.send_render()
      this.storeCode_render()
      this.imageVerification_render()
      this.targetsList_render(true)
      this.fetchGoodsDetails_render()
      this.add2TargetsList_render()
    },

    bind: function () {
      this.send_bind()
      this.storeCode_bind()
      this.imageVerification_bind()
      this.targetsList_bind()
      this.fetchGoodsDetails_bind()
      this.add2TargetsList_bind()
    },

    append: function () {
      var self = this

      var nodes = self.nodes

      var sections = [
        'sendSection',
        'storeCodeSection',
        'imageVerificationSection',
        'targetsListSection',
        'fetchGoodsDetailsSection',
        'add2TargetsListSection'
      ]

      sections = Stamp.$.map(sections, function (klass) {
        return Stamp.$('<div>', {
          class: ['section', klass].join(' ')
        })
      })

      nodes.sections = sections

      sections[0].append(Stamp.$('<div class="title">').text('配置验证码'))
      sections[0].append(nodes.phone)
      sections[0].append(nodes.send)
      nodes.send.after(nodes.sendState)

      sections[1].append(nodes.code)
      sections[1].append(nodes.storeCode)
      nodes.storeCode.after(nodes.storeCodeState)

      sections[2].append(Stamp.$('<div class="title">').text('验证图片'))
      sections[2].append(nodes.image)
      sections[2].append(nodes.answer)

      sections[3].append(Stamp.$('<div class="title">').text('秒杀任务清单'))
      sections[3].append(nodes.targetsList)
      sections[3].append(nodes.verify)
      sections[3].append(nodes.verifyState)
      sections[3].append(nodes.identify)
      sections[3].append(nodes.identifyState)
      sections[3].append(nodes.batch2MyCart)

      sections[4].append(Stamp.$('<div class="title">').text('商品详情'))
      sections[4].append(nodes.goodIds)
      sections[4].append(nodes.fetchDetails)
      nodes.fetchDetails.after(nodes.fetchDetailsState)

      sections[5].append(Stamp.$('<div class="title">').text('新添秒杀任务'))
      sections[5].append(nodes.selectDetails)
      sections[5].append(nodes.addTargetRecords)
      sections[5].append(nodes.clearAllAddTargetRecords)

      var root = Stamp.$('<div class="rushRoot"></div>')
      Stamp.$.each(sections, function (index, section) {
        root.append(section)
      })

      nodes.root = root
      self.fairy.panel.nodes.tabBlocks[self.fairy.layout.rushBlock.anchor].append(root)
    }
  },
  {
    send_render: function () {
      var self = this

      // var phone = Stamp.$('<select>', {
      //   style: 'width: 11em;'
      // }).addClass('form-control')
      // Stamp.$.each(self.fairy.mobiles, function (index, mobile) {
      //   var optionConfig = {
      //     value: mobile
      //   }
      //   index === 0 && (optionConfig.selected = 'selected')
      //   phone.append(Stamp.$('<option>', optionConfig).text(mobile))
      // })

      var phone = Stamp.$('<input>', {
        style: 'width: 11em;'
      }).addClass('form-control')

      var send = Stamp.$('<input>', {
        type: 'button',
        value: '获取验证码'
      }).addClass('btn btn-info')
      var sendState = Stamp.$('<span class="state">')

      self.nodes.phone = phone
      self.nodes.send = send
      self.nodes.sendState = sendState
    },

    storeCode_render: function () {
      var self = this

      var storedMessage = self.fairy.storage.get('message')
      var code = Stamp.$('<input>', {
        type: 'text',
        value: storedMessage !== undefined ? storedMessage : '',
        style: 'width: 11em;'
      }).addClass('form-control')
      var storeCode = Stamp.$('<input>', {
        type: 'button',
        value: '配置验证码'
      }).addClass('btn btn-info')
      var storeCodeState = Stamp.$('<span class="state">')

      self.nodes.code = code
      self.nodes.storeCode = storeCode
      self.nodes.storeCodeState = storeCodeState
    },

    imageVerification_render: function () {
      var self = this

      var nodes = self.nodes

      var image = Stamp.$('<img class="verifyImage">')

      Stamp.probe.execute('getSid', {}, function (message) {
        self.schedule.sid = message.data.sid

        nodes.image.attr('src', [self.fairy.imageBase, "&sid=", message.data.sid, "&", Math.random()].join(''))
        Stamp.$.each(nodes.checkboxs, function (index, checkbox) {
          Stamp.$(checkbox).attr('checked', false)
        })
      }.bind(self))

      var answer = Stamp.$('<div class="checkboxs">')
      var wraps = self.fairy.buildAnswerBox('_rush_answer_')

      wraps.forEach(function (wrap) {
        nodes.checkboxs.push(wrap.find('input[type="checkbox"]'))
        answer.append(wrap)
      })

      nodes.image = image
      nodes.answer = answer
    },

    targetsList_render: function (init) {
      var self = this

      var nodes = self.nodes

      var targetsList = null
      if (init) {
        targetsList = Stamp.$('<div class="targetsList">').addClass('scrollBar')

        if (!self.fairy.storage.exist('targets')) {
          self.fairy.storage.update('targets', [])
        }

        var verify = Stamp.$('<input>', {
          type: 'button',
          class: 'verify',
          value: '验证验证码'
        }).addClass('btn btn-warning')
        var verifyState = Stamp.$('<span class="state">').css({
          top: '0.9em',
          margin: '0 0.5em'
        })

        var identify = Stamp.$('<input>', {
          type: 'button',
          class: 'identify',
          value: '验证图片'
        }).addClass('btn btn-warning')
        var identifyState = Stamp.$('<span class="state">').css({
          top: '0.9em',
          margin: '0 0.5em'
        })

        var batch2MyCart = Stamp.$('<input>', {
          type: 'button',
          class: 'batch2MyCart',
          value: '一键购买'
        }).addClass('btn btn-info')

        nodes.targetsList = targetsList

        self.nodes.verify = verify
        self.nodes.verifyState = verifyState

        nodes.identify = identify
        nodes.identifyState = identifyState

        nodes.batch2MyCart = batch2MyCart
      }
      else {
        nodes.targetsList.empty()

        targetsList = nodes.targetsList
      }

      self.fairy.storage.get('targets').each(function (good) {
        good.specs.each(function (spec) {
          var item = Stamp.$('<div>', {
            id: [good.id, spec.id].join('#'),
            class: 'target'
          })

          var title = Stamp.$('<div class="goodTitle">').text(good.title)
          var name = Stamp.$('<div class="goodName">').text(spec.name)
          var count = Stamp.$('<div class="goodCount">').text(spec.count)
          var goodEditAreaTrigger = Stamp.$('<div class="goodEditAreaTrigger">')

          var editArea = Stamp.$('<div class="goodEditArea">').attr('data-index', [good.id, spec.id].join('#'))

          var number = Stamp.$('<input>', {
            type: 'number',
            class: 'goodNumber',
            min: 1,
            max: spec.limit,
            value: 1
          })
          var modify = Stamp.$('<input>', {
            type: 'button',
            class: 'goodModify',
            value: '修改数量'
          }).addClass('btn btn-info')
          var remove = Stamp.$('<input>', {
            type: 'button',
            class: 'goodRemove',
            value: '删除'
          }).addClass('btn btn-danger')

          editArea.append(number).append(modify).append(remove)
          item.append(title).append(name).append(count).append(goodEditAreaTrigger).append(editArea)

          targetsList.append(item)
          editArea.hide()
        })
      })
    },

    fetchGoodsDetails_render: function () {
      var self = this

      var goodIds = Stamp.$('<input>', {
        type: 'text',
        id: '_rush_goodIds_',
        value: '27710#27711', // #27144#26720
        placeholder: '商品ID（#分隔多个ID）',
        style: 'width: 95%;'
      }).addClass('form-control')
      var fetchDetails = Stamp.$('<input>', {
        type: 'button',
        id: '_rush_fetchDetails_',
        value: '获取商品信息',
        style: 'width: 9em; margin-top: 0.4em;'
      }).addClass('btn btn-info')
      var fetchDetailsState = Stamp.$('<span class="state">').css({
        margin: '0.4em 0 0 0'
      })

      self.nodes.goodIds = goodIds
      self.nodes.fetchDetails = fetchDetails
      self.nodes.fetchDetailsState = fetchDetailsState
    },

    add2TargetsList_render: function () {
      var self = this

      var selectDetails = Stamp.$('<div class="selectDetails">')
      var addTargetRecords = Stamp.$('<div class="addTargetRecords scrollBar">')
      var clearAllAddTargetRecords = Stamp.$('<input>', {
        type: 'button',
        class: 'clearAllAddTargetRecords',
        value: '清空记录区'
      }).addClass('btn btn-info')

      self.nodes.selectDetails = selectDetails
      self.nodes.addTargetRecords = addTargetRecords
      self.nodes.clearAllAddTargetRecords = clearAllAddTargetRecords
    }
  },
  {
    send_bind: function () {
      var self = this

      var phone = self.nodes.phone
      var send = self.nodes.send
      var sendState = self.nodes.sendState
      var code = self.nodes.code

      send.on('click', function () {
        sendState.removeClass('fulfilled')
        sendState.addClass('pending')
        var params = {
          mobileNum: phone.val(),
          smsType: '4'
        }

        self.fairy.storage.remove('mobile')
        code.val('')

        self.fairy.post('code', params)
          .then(function (data) {
            if (data.result == "sended") {
              setTimeout(function () {
                sendState.removeClass('pending')
                sendState.addClass('fulfilled')
              }, 500)

              self.fairy.storage.update('mobile', phone.val())
            } else {
              sendState.removeClass('pending')
              alert(data.result)
            }
          })
      })
    },

    storeCode_bind: function () {
      var self = this

      var code = self.nodes.code
      var storeCode = self.nodes.storeCode
      var storeCodeState = self.nodes.storeCodeState

      storeCode.on('click', function () {
        if (code.val().length) {
          storeCodeState.removeClass('fulfilled')
          storeCodeState.addClass('pending')

          self.fairy.storage.update('message', code.val())

          setTimeout(function () {
            storeCodeState.removeClass('pending')
            storeCodeState.addClass('fulfilled')
          }, 500)
        }
      })
    },

    imageVerification_bind: function () {
      var self = this

      var nodes = self.nodes

      nodes.image.on('dblclick', function () {
          nodes.image.attr('src', [self.fairy.imageBase, "&sid=", self.schedule.sid, "&", Math.random()].join(''))
          Stamp.$.each(nodes.checkboxs, function (index, checkbox) {
            Stamp.$(checkbox).attr('checked', false)
          })
        }
      )
    },

    targetsList_bind: function () {
      var self = this

      var nodes = self.nodes

      nodes.targetsList.delegate('.goodEditAreaTrigger', 'click', function (e) {
        var target = Stamp.$(e.target)

        target.next('.goodEditArea').toggle()
        Stamp.$(this).toggleClass('goodEditAreaTriggerOpen')
      })

      nodes.targetsList.delegate('.goodEditArea', 'click', function (e) {
        var target = Stamp.$(e.target)
        var index = target.parent().attr('data-index')

        var number = Number(target.parent().find('.goodNumber').val())
        var infoNode = Stamp.$(this).parent()

        if (target.hasClass('goodModify')) {
          self._editAreaListener(index, number, true, infoNode)
        } else if (target.hasClass('goodRemove')) {
          self._editAreaListener(index, number, false, infoNode)
        }
      })

      nodes.verify.on('click', function () {
        var mobileInStore = self.fairy.storage.get('mobile')
        var messageInStore = self.fairy.storage.get('message')

        if (mobileInStore && messageInStore) {
          var verifyState = nodes.verifyState

          verifyState.removeClass('fulfilled')
          verifyState.addClass('pending')

          var params = {
            mobile: mobileInStore,
            message: messageInStore
          }

          self.fairy.post('check', params)
            .then(function (data) {
              if (data.result.status == '1') {
                setTimeout(function () {
                  verifyState.removeClass('pending')
                  verifyState.addClass('fulfilled')
                }, 500)

                self.schedule.message = data.result.random_code
              } else {
                verifyState.removeClass('pending')
                alert(data.result.msg)
              }
            })
        }
      })

      nodes.identify.on('click', function () {
        if (self.schedule.sid.length === 0) return false

        nodes.identifyState.removeClass('fulfilled')
        nodes.identifyState.addClass('pending')

        var checked = Stamp.$.grep(nodes.checkboxs, function (checkbox) {
          return Stamp.$(checkbox).attr('checked') === 'checked'
        })
        var postions = Stamp.$.map(checked, function (checkbox) {
          return Stamp.$(checkbox).val()
        })

        var verifyURL = 'http://jiyou.11185.cn/l/verify.html?'
        var params = {
          wid: '3be16628-c630-437b-b443-c4d9f18602ed',
          answer: postions.join(','),
          sid: self.schedule.sid,
          checkCode: encodeURIComponent('user=zhangsan&stamp_id=123'),
        }

        Stamp.$.each(params, function (key, value) {
          verifyURL += [key, '=', value].join('') + '&'
        })

        Stamp.probe.execute('getToken', {
          verifyURL: verifyURL + Math.random()
        }, function (message) {
          if (message.data.token !== 'ERROR') {
            setTimeout(function () {
              nodes.identifyState.removeClass('pending')
              nodes.identifyState.addClass('fulfilled')
            }, 500)

            self.schedule.token = message.data.token
          } else {
            nodes.identifyState.removeClass('pending')
            nodes.image.trigger('dblclick')
          }
        }.bind(self))
      })

      nodes.batch2MyCart.on('click', function () {
        if (!self.schedule.message.length || !self.schedule.token.length) {
          return false
        }

        var targets = self.fairy.storage.get('targets')

        var targetsCount = nodes.targetsList.find('.target').length

        targets.forEach(function (target) {
          target.specs.forEach(function () {
            Stamp.probe.execute('storeGoodsId', {
              goodsId: target.id
            })
          })
        })

        targets.forEach(function (target) {
          target.specs.forEach(function (spec) {
            var params = {
              goodId: target.id,
              count: spec.count,
              specId: spec.id
            }

            var selector = ['div[id="', [target.id, spec.id].join('#'), '"]'].join('')
            var targetNode = nodes.targetsList.find(selector)

            var mock = {
              pathname: ['/retail/ticketDetail_', target.id, '.html'].join(''),
              _origScriptSessionId: spec._origScriptSessionId
            };

            (function (params, targetNode, mock) {
              ShoppingCartAction.addGoodsToShoppingCartLS(params.goodId, params.count, params.specId, function (msg) {
                var matches = msg.match(/^\[(.*)\]$/)
                matches && matches.length == 2 && (matches = matches.pop())

                var params = matches.split(',')

                if (params[0] === "'true'") {

                  if (--targetsCount == 0) {
                    self.fairy.cart._getShowPage(function (cart) {
                      cart.nodes.settle.trigger('click', self._copyAndCleanSchedule())
                    })
                  }

                  var IDS = targetNode.attr('id').split('#')
                  var targets = self.fairy.storage.get('targets')

                  var matchGoods = targets.filter(function (target) {
                    return target.id == IDS[0]
                  })
                  matchGoods[0].specs = matchGoods[0].specs.filter(function (spec) {
                    return spec.id != IDS[1]
                  })
                  if (!matchGoods[0].specs.length) {
                    targets = targets.filter(function (target) {
                      return target.id != matchGoods[0].id
                    })
                  }

                  self.fairy.storage.update('targets', targets)

                  targetNode.fadeOut(800, 'linear', function () {
                    targetNode.remove()
                  })
                }
              }, mock)
            })(params, targetNode, mock)
          })
        })
      })
    },

    fetchGoodsDetails_bind: function () {
      var self = this

      var nodes = self.nodes

      var goodIds = nodes.goodIds
      var fetchDetails = nodes.fetchDetails
      var fetchDetailsState = nodes.fetchDetailsState

      fetchDetails.on('click', function () {
        fetchDetailsState.removeClass('fulfilled')
        fetchDetailsState.addClass('pending')
        nodes.selectDetails.empty()

        var ids = goodIds.val().split('#')
        var urls = []

        if (goodIds.val().length == 0) {
          urls.push(window.location.href)
        }
        else {
          urls = ids.map(function (id) {
            return 'http://jiyou.retail.11185.cn/retail/ticketDetail_' + Stamp.$.trim(id) + '.html'
          })
        }

        var new_fairys = []
        urls.forEach(function (url) {
          new Dig({
            cache: {},
            details: {}
          }, url, function (new_fairy) {
            new_fairys.push(new_fairy)

            if (new_fairys.length == ids.length) {
              fetchDetailsState.removeClass('pending')
              fetchDetailsState.addClass('fulfilled')

              var new_fairys_sorted = ids.map(function (id) {
                return new_fairys.filter(function (fairy) {
                  return fairy.cache.goodsId == id
                }).pop()
              })

              self._selectDetailsBlocks(new_fairys_sorted)
            }
          })
        })
      })
    },

    add2TargetsList_bind: function () {
      var self = this

      self.nodes.clearAllAddTargetRecords.on('click', function () {
        self.nodes.addTargetRecords.empty()
      })
    }
  },
  {
    _copyAndCleanSchedule: function () {
      var self = this

      var schedule = {
        userType: self.fairy.storage.get('userType'),
        userId: self.fairy.storage.get('userId'),
        code: self.fairy.storage.get('message'),
        mobile: self.fairy.storage.get('mobile'),
        message: self.schedule.message,
        sid: self.schedule.sid,
        token: self.schedule.token
      }

      self.schedule = {
        message: '',
        sid: '',
        token: ''
      }

      return schedule
    },

    _reset: function () {
      var self = this

      var nodes = self.nodes

      self.fairy.storage.remove('mobile')
      self.fairy.storage.remove('message')

      nodes.code.val('')

      nodes.verifyState.removeClass('fulfilled')
      nodes.identifyState.removeClass('fulfilled')

      Stamp.probe.execute('getSid', {}, function (message) {
        self.schedule.sid = message.data.sid

        nodes.image.attr('src', [self.fairy.imageBase, "&sid=", message.data.sid, "&", Math.random()].join(''))
      }.bind(self))

      Stamp.$.each(nodes.checkboxs, function (index, checkbox) {
        Stamp.$(checkbox).attr('checked', false)
      })
    },

    _editAreaListener: function (index, number, type, infoNode) {
      var self = this

      var targets = self.fairy.storage.get('targets')
      var IDS = index.split('#')

      var matchGoods = targets.filter(function (target) {
        return target.id == IDS[0]
      })
      var matchSpecs = matchGoods[0].specs.filter(function (spec) {
        return spec.id == IDS[1]
      })

      if (type) {
        matchSpecs[0].count = number
        infoNode.find('.goodCount').text(number)
      } else {
        matchGoods[0].specs = matchGoods[0].specs.filter(function (spec) {
          return spec.id != IDS[1]
        })
        if (matchGoods[0].specs.length == 0) {
          targets = targets.filter(function (target) {
            return target.id != IDS[0]
          })
        }
        infoNode.remove()
      }

      self.fairy.storage.update('targets', targets)
    },

    _selectDetailsBlocks: function (new_fairys) {
      var self = this

      var nodes = self.nodes

      var blocks = Stamp.$('<div class="selectDetailsBlocks">')

      new_fairys.forEach(function (fairy) {
        var block = self._selectDetails(fairy)
        blocks.append(block)
        self._selectDetailsListeners(fairy, block)
      })

      nodes.selectDetails.append(blocks)

      nodes.selectDetails.parent().show()
    },

    _selectDetails: function (fairy) {
      var details = fairy.details

      var goodTitle = Stamp.$('<div class="goodTitle">')
        .text(details.goodsShowInfo.title)
        .prepend(Stamp.$('<em>').text(details.goodsId + '#'))

      var goodCount = Stamp.$('<input>', {
        type: 'number',
        class: 'goodCount',
        min: 1,
        value: 1
      })

      var goodSpecs = Stamp.$('<div class="goodSpecs"></div>')

      Stamp.$.each(details.goodsAttrList, function (index, attr) {
        var wrap = Stamp.$('<sapn class="goodSpec"></sapn>')

        var id = ['_rush_goodSepc_', details.goodsId, '_', index].join('')

        var spec = Stamp.$('<input>', {
          type: 'radio',
          id: id,
          name: ['goodSpec_', details.goodsId].join(''),
          value: index,
        }).data('buyLimit', attr.buyLimit)

        var label = Stamp.$('<label>', {
          for: id
        }).text(attr.attrName)

        if (index == 0) {
          spec.attr('checked', 'checked')
          label.addClass('selected')

          goodSpecs.data('specIndex', index)
          goodCount.attr('max', attr.buyLimit)

          goodCount.after(Stamp.$('<span class="goodLimit">').text(['(购买数量上限：', attr.buyLimit, ')'].join('')))
        }

        wrap.append(spec).append(label)

        goodSpecs.append(wrap)
      })

      var goodAdd = Stamp.$('<input>', {
        type: 'button',
        class: 'goodAdd',
        value: '加入列表'
      }).addClass('btn btn-success')

      var block = Stamp.$('<div class="selectDetailsBlock">')
        .attr('data-goodsId', details.goodsId)

      block.append(goodTitle).append(goodSpecs).append(goodCount).append(goodAdd)

      return block
    },

    _selectDetailsListeners: function (fairy, block) {
      var self = this

      var details = fairy.details

      var goodCount = block.find('.goodCount')
      var goodSpecs = block.find('.goodSpecs')
      var goodAdd = block.find('.goodAdd')

      goodCount.on('change', function () {
        var target = Stamp.$(this)
        var max = +target.attr('max')

        Number(target.val()) > max && target.val(String(max))
      })

      goodSpecs.on('change', function (e) {
        var target = Stamp.$(e.target)

        Stamp.$.each(Stamp.$(this).find('label'), function (i, node) {
          var node = Stamp.$(node)

          node.removeClass('selected')

          node.attr('for').split('_').pop() === target.val() && node.addClass('selected')
        })

        goodSpecs.data('specIndex', target.val())
        goodCount.attr('max', Number(target.data('buyLimit')))
      })

      goodAdd.on('click', function () {
        var goodAttr = details.goodsAttrList[goodSpecs.data('specIndex')]

        var record = {
          id: goodAttr.goodsId,
          title: details.goodsShowInfo.title,
          specId: goodAttr.id,
          name: goodAttr.attrName,
          limit: Number(goodAttr.buyLimit),
          count: Number(goodCount.val())
        }

        var showInfo = {
          Title: [details.goodsId, details.goodsShowInfo.title].join('#'),
          Spec: ['规格：', goodAttr.attrName].join(''),
          Count: ['订购数量：', goodCount.val()].join('')
        }

        self._addTarget2Storage(record, showInfo)
      })
    },

    _addTarget2Storage: function (record, showInfo) {
      var self = this

      var storageInfo = self._mergeTargetCount(record)

      self._addTargetRecord(showInfo, storageInfo)

      storageInfo.code != 500 && self._updateTargetList(record)
    },

    _mergeTargetCount: function (record) {
      var self = this
      var storageInfo = {
        code: 200,
        add: null,
        rest: null,
        msg: '成功加入列表'
      }

      var targets = self.fairy.storage.get('targets')

      var matchGoods = targets.filter(function (target) {
        return target.id == record.id
      })

      if (matchGoods.length == 1) {
        var match_good = matchGoods[0]

        var matchSpecs = match_good.specs.filter(function (spec) {
          return spec.id == record.specId
        })

        if (matchSpecs.length == 1) {
          var match_spec = matchSpecs[0]

          if (match_spec.count == match_spec.limit) {
            storageInfo.code = 500
            storageInfo.add = 0
            storageInfo.rest = 0
            storageInfo.msg = '无法购买该商品此规格'
          }
          else if (match_spec.count + record.count >= match_spec.limit) {
            storageInfo.code = 400
            storageInfo.add = match_spec.limit - match_spec.count
            storageInfo.rest = 0
            storageInfo.msg = '该商品此规格达到购买上限'

            match_spec.count = match_spec.limit
          } else {
            match_spec.count += record.count

            storageInfo.add = record.count
            storageInfo.rest = match_spec.limit - match_spec.count
          }
        }
        else {
          storageInfo.add = record.count
          storageInfo.rest = record.limit - record.count

          match_good.specs.push({
            name: record.name,
            id: record.specId,
            limit: record.limit,
            count: record.count,
            _origScriptSessionId: self.fairy.get_origScriptSessionId()
          })
        }
      }
      else {
        storageInfo.add = record.count
        storageInfo.rest = record.limit - record.count

        targets.push({
          id: record.id,
          title: record.title,
          specs: [{
            id: record.specId,
            name: record.name,
            limit: record.limit,
            count: record.count,
            _origScriptSessionId: self.fairy.get_origScriptSessionId()
          }]
        })
      }

      self.fairy.storage.update('targets', targets)

      return storageInfo
    },

    _addTargetRecord: function (showInfo, storageInfo) {
      var self = this

      var nodes = self.nodes
      var addTargetRecords = nodes.addTargetRecords

      var record = Stamp.$('<div class="record">').addClass(['record', storageInfo.code].join(''))

      Stamp.$.each(showInfo, function (prop, value) {
        record.append(Stamp.$('<div>', {
          class: ['record', prop].join('')
        }).text(value))
      })

      var now = new Date()
      var time = [now.getHours(), now.getMinutes(), now.getSeconds()].join(':')
      var tips = ['本次添加：', storageInfo.add, '；还可添加：', storageInfo.rest].join('')
      var info = Stamp.$('<div class="recordState">').addClass(['recordState', storageInfo.code].join(''))
      var msg = Stamp.$('<div class="recordMessage">').text('（' + time + '）' + storageInfo.msg)
      var addRest = Stamp.$('<div class="recordAddRest">').text(tips)

      info.append(msg).append(addRest)
      record.append(info)

      addTargetRecords.prepend(record)
    },

    _updateTargetList: function (record) {
      var self = this

      var targets = self.fairy.storage.get('targets')

      var matchGoods = targets.filter(function (target) {
        return target.id == record.id
      })
      var matchSpecs = matchGoods[0].specs.filter(function (spec) {
        return spec.id == record.specId
      })

      var selector = ['div[id="', [record.id, record.specId].join('#'), '"]'].join('')
      var targetNode = self.nodes.targetsList.find(selector)

      if (targetNode.length == 1) {
        targetNode.find('.goodCount').text(matchSpecs[0].count)
      } else {
        self.targetsList_render(false)
      }
    },
  }
)

module.exports = Rush