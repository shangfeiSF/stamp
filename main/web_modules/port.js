var $ = require('jquery')

function Port(config) {
  var config = config || {}

  this.ports = []
  this.actions = config.actions || []
}

$.extend(Port.prototype, {
  onConnect: function () {
    var self = this

    chrome.runtime.onConnect.addListener(function (port) {
      self.monitor(port)
    })
  },

  onTabRemoved: function () {
    var self = this

    chrome.tabs.onRemoved.addListener(function (tabId, changeInfo) {
      self.clean(changeInfo.windowId, tabId, changeInfo)
    })
  },

  onTabUpdated: function () {
    var self = this

    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
      changeInfo.status == 'loading' && self.clean(tab.windowId, tabId, changeInfo)
    })
  },

  monitor: function (port) {
    var self = this

    var port = port
    this.ports.push(port)

    port.onMessage.addListener(function (msg) {
      if (msg.portName !== port.name) return null

      var action = self.findActions(msg.command).shift()
      action && action.action.bind(self)(port, msg)
    })

    port.onDisconnect.addListener(function (port) {
      console.info('Disconnect the port named:', port.name)
    })
  },

  clean: function (winId, tabId) {
    var self = this
    var portName = [winId, tabId].join('#')

    var port = this.findPorts(portName).shift()

    port && port.disconnect()
    self.removePorts(portName)
  },

  findPorts: function (portName) {
    var pattern = new RegExp('^' + portName + '$')

    return this.ports.filter(function (port) {
      return port.name.match(pattern) !== null
    })
  },

  removePorts: function (portName) {
    var pattern = new RegExp('^' + portName + '$')

    this.ports = this.ports.filter(function (port) {
      return port.name.match(pattern) === null
    })
  },

  findActions: function (command) {
    return this.actions.filter(function (action) {
      return command === action.command
    })
  },

  start: function () {
    this.onConnect()
    this.onTabUpdated()
    this.onTabRemoved()
  }
})

module.exports = Port