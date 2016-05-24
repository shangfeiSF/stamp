var $ = require('jquery')

function Listener(config) {
  this.sentries = config.sentries

  this.cancels = config.cancels
}

$.extend(Listener.prototype, {
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

  start: function () {
    this.onBeforeRequest()
    this.onCompleted()
  }
})

module.exports = Listener