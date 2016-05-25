var $ = require('jquery')

function Inject(config) {
  var config = config || {}

  this.common = {
    allFrames: false,
    matchAboutBlank: true
  }
  this.content = config.content
}

$.extend(Inject.prototype, {
  async: function (type, tabId) {
    var self = this
    var contents = type ? self.content.ayncScripts : self.content.ayncCss
    var fname = type ? 'executeScript' : 'insertCSS'
    var tip = type ? 'Script' : 'CSS'

    $.each(contents, function (index, content) {
      chrome.tabs[fname](tabId, {
        file: content.file,
        allFrames: content.allFrames !== undefined ? content.allFrames : self.common.allFrames,
        matchAboutBlank: content.matchAboutBlank !== undefined ? content.matchAboutBlank : self.common.matchAboutBlank
      })
      var message = ['%c[Injected async ' + type + ']---', content.file.slice(1)].join('')
      console.log(message, 'color: #1dbe1a; font-weight: bold;')
    })
  },

  sync: function (type, tabId) {
    var self = this
    var contents = type ? self.content.syncScripts : self.content.syncCss
    var fname = type ? 'executeScript' : 'insertCSS'
    var tip = type ? 'script' : 'CSS'

    var callbacks = $.map(contents, function (content, index) {
      var info = {
        index: index,
        tabId: tabId,
        fname: fname
      }

      var config = {
        file: content.file,
        allFrames: content.allFrames !== undefined ? content.allFrames : self.common.allFrames,
        matchAboutBlank: content.matchAboutBlank !== undefined ? content.matchAboutBlank : self.common.matchAboutBlank
      }

      return (function (info, config) {
        var info = info
        var config = config

        return function () {
          chrome.tabs[info.fname](info.tabId, config, function () {
            var message = ['%c[Injected sync ' + type + ']---', content.file.slice(1)].join('')
            console.log(message, 'color: #2b9dff; font-weight: bold;')

            var next = callbacks[info.index + 1]
            next !== undefined && next()
          })
        }
      })(info, config)
    })

    callbacks.length && callbacks[0]()
  },

  onCommitted: function () {
    var self = this

    chrome.webNavigation.onCommitted.addListener(function (details) {
      if (details.frameId !== 0) return null

      var match = details.url.match(/http:\/\/jiyou\.biz\.11185\.cn\/retail\/ticketDetail\_(\d+)\.html/)
      if (!(match && match.length == 2)) return null

      self.syncCss(details.tabId)
      self.asyncCss(details.tabId)

      self.syncScripts(details.tabId)
      self.asyncScripts(details.tabId)
    })
  },

  boot: function () {
    this.asyncScripts = this.async.bind(this, true)
    this.syncScripts = this.sync.bind(this, true)

    this.asyncCss = this.async.bind(this, false)
    this.syncCss = this.sync.bind(this, false)
  },

  start: function () {
    this.boot()
    this.onCommitted()
  }
})

module.exports = Inject