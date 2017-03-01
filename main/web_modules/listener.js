var $ = require('jquery')

function Listener(config) {
  this.headers = config.headers
  this.cancels = config.cancels
  this.sentries = config.sentries
}

$.extend(Listener.prototype, {
  onBeforeSendHeaders: function () {
    var self = this

    chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {
      var matches = self.headers.filter(function (header) {
        return details.url.indexOf(header.keyword) > -1
      })

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

  onBeforeRequest: function () {
    var self = this

    chrome.webRequest.onBeforeRequest.addListener(function (details) {
      var cancel = self.cancels.some(function (cancel) {
        return cancel.exec(details.url) !== null
      })
      return {cancel: cancel}
    }, {
      urls: ["<all_urls>"]
    }, ["blocking"])
  },

  onCompleted: function () {
    var self = this

    chrome.webRequest.onCompleted.addListener(function (details) {
      var matches = self.sentries.filter(function (sentry) {
        return details.url.indexOf(sentry.keyword) > -1
      })

      matches.forEach(function (match) {
        match.handler.bind(self)(details)
      })
    }, {
      urls: ["<all_urls>"]
    })
  },

  start: function (portCache) {
    if (this.headers.length) {
      this.portCache = portCache
      this.onBeforeSendHeaders()
    }
    if (this.cancels.length) {
      this.onBeforeRequest()
    }
    if (this.sentries.length) {
      this.onCompleted()
    }
  }
})

module.exports = Listener