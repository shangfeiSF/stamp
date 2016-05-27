function Dig(fairy, url, callback) {
  this.patterns = {
    href: /http:\/\/jiyou\.biz\.11185\.cn\/retail\/ticketDetail\_(\d+)\.html/,
    part: /jQuery\(\"\#data\"\)/,
    original: /.*jQuery\(\"\#data\"\)\.data\(\"(.*?)\"\,\"?(.*?)\"?\)$/
  }

  this.list = ['goodsStatus', 'goodsShowInfo', 'goodsAttrList']

  this.fairy = fairy

  this.init(url, callback)
}

Stamp.$.extend(Dig.prototype, {
  init: function (url, callback) {
    var self = this

    var cache = self.fairy.cache
    var details = self.fairy.details

    var source = (url && url.length) ? url : window.location.href

    var matches = source.match(self.patterns.href)
    if (!(matches && matches.length == 2)) return false

    details._href = source
    details.goodsId = cache.goodsId = matches.pop()

    if (url && url.length) {
      Stamp.$.ajax({
        url: url,
        type: 'GET',
        success: function (html) {
          var ajaxScripts = Stamp.$.grep(Stamp.$(html), function (dom) {
            var node = Stamp.$(dom)

            return dom.tagName === 'SCRIPT' &&
              node.attr('src') === undefined &&
              node.attr('type') === 'text/javascript' &&
              node.text().search('#data') > -1
          })
          self.parse(ajaxScripts)
          callback && callback(self.fairy)
        },
        error: function () {
          self.parse([])
          callback && callback(self.fairy)
        },
        dataType: 'html',
      })
    }
    else {
      var localScripts = Stamp.$.grep(Stamp.$('#data').find('script'), function (script) {
        return Stamp.$(script).attr('src') === undefined &&
          Stamp.$(script).attr('type') === 'text/javascript'
      })
      self.parse(localScripts)
    }
  },

  parse: function (scripts) {
    var self = this

    var details = self.fairy.details

    if (scripts.length) {
      scripts = Stamp.$(scripts.shift())
    } else {
      scripts = ''
    }

    var parts = scripts.text().split(';')
    parts = Stamp.$.grep(parts, function (part) {
      return part.length && part.search(self.patterns.part) > -1
    })
    details._parts = Stamp.$.map(parts, function (part) {
      return part.replace(/\n/g, '')
    })

    var original = []
    Stamp.$.each(parts, function (index, part) {
      var parse = part.match(self.patterns.original)

      parse && parse.length === 3 && (original.push({
        key: parse[1],
        value: parse[2]
      }))
    })

    Stamp.$.each(original, function (index, detail) {
      details[detail.key] = self.list.indexOf(detail.key) > -1 ?
        JSON.parse(detail.value) :
        detail.value
    })
  },
})

module.exports = Dig