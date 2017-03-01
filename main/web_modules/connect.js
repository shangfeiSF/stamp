var $ = require('jquery')

function Connect(config) {
  var config = config || {}

  this.listeners = config.listeners || []
}

$.extend(Connect.prototype, {
  buildTopResponse: function (sender) {
    return {
      code: 200,
      winId: sender.tab.windowId,
      tabId: sender.tab.id
    }
  },

  onMessage: function () {
    var self = this

    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
      var matches = $.grep(self.listeners, function (listener) {
        return message.command === listener.command
      })

      $.each(matches, function (index, match) {
        match.action.bind(self)(message, sender, sendResponse)
      })
    })
  },

  start: function () {
    this.onMessage()
  }
})

module.exports = Connect