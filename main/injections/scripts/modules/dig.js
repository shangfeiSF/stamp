function Dig(fairy) {
  this.patterns = {
    href: /http:\/\/jiyou\.biz\.11185\.cn\/retail\/ticketDetail\_(\d+)\.html/,
    part: /jQuery\(\"\#data\"\)/,
    original: /.*jQuery\(\"\#data\"\)\.data\(\"(.*?)\"\,\"?(.*?)\"?\)$/
  }

  this.list = ['goodsStatus', 'goodsShowInfo', 'goodsAttrList']

  this.fairy = fairy

  this.init()
}

Stamp.$.extend(Dig.prototype, {
  init: function () {
    var self = this
    var cache = self.fairy.cache
    var details = self.fairy.details

    var matches = window.location.href.match(self.patterns.href)
    if (!(matches && matches.length == 2)) return false

    details._href = window.location.href
    details.goodsId = cache.goodsId = matches.pop()

    var scripts = Stamp.$.grep(Stamp.$('#data').find('script'), function (script) {
      return Stamp.$(script).attr('src') === undefined && Stamp.$(script).attr('type') === 'text/javascript'
    })
    scripts.length && (scripts = Stamp.$(scripts.shift()))

    var parts = scripts.text().split(';')
    parts = Stamp.$.grep(parts, function (part) {
      return part.length && part.search(self.patterns.part) > -1
    })
    details._parts = Stamp.$.map(parts, function (part) {
      return part.replace(/\n/g, '')
    })

    self.parse(parts)
  },

  parse: function (parts) {
    var self = this
    var details = self.fairy.details

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