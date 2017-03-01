var $ = require('jquery')

function Reffer() {
}

$.extend(Reffer.prototype, {
  onBeforeSendHeaders: function () {
    var self = this

    chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {
      var currentReffer = self.portCache.currentReffer

      if (currentReffer != null) {
        var MAP = {}

        details.requestHeaders.forEach(function (header) {
          MAP[header.name] = header
        })
        MAP['Referer'] && (MAP['Referer'].value = currentReffer)
      }

      return {
        requestHeaders: details.requestHeaders
      }
    }, {
      urls: ["<all_urls>"]
    }, ["blocking", "requestHeaders"])
  },

  start: function (portCache) {
    this.portCache = portCache

    this.onBeforeSendHeaders()
  }
})

module.exports = Reffer