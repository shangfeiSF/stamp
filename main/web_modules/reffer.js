var $ = require('jquery')

function Reffer(config) {
  var config = config || {}

  this.allStates = config.allStates || []
  this.originalState = config.originalState || ''
  this.handlers = config.handlers || {}
}

$.extend(Reffer.prototype, {
  onBeforeSendHeaders: function () {
    var self = this

    chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {
      // details.requestHeaders
      var originalState = self.portCache.currentRefferState

      if (matches.length) {
        var MAP = {}

        details.requestHeaders.forEach(function (header) {
          MAP[header.name] = header
        })

        matches.forEach(function (match) {
          match.modifiers.forEach(function (modifier) {
            modifier.handler(MAP[modifier.name], self.portCache)
          })
        })
      }

      return {
        requestHeaders: details.requestHeaders
      }
    }, {
      urls: ["<all_urls>"]
    }, ["blocking", "requestHeaders"])
  },

  start: function (portCache) {
    if (this.allStates.length || this.originalState.length) {
      this.portCache = portCache
      this.portCache.currentRefferState = this.originalState

      this.onBeforeSendHeaders()
    }
  }
})

module.exports = Reffer