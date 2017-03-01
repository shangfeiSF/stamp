var Stamp = {}

Stamp.$ = jQuery.noConflict(true)

function Probe() {
  this.timers = {
    documentReady: null,
    interactive: null,
    force: null
  }
  this.intervals = {
    documentReady: 20,
    interactive: 5000,
    force: 20000
  }

  this.forced = false
  this.channel = []

  this.commandActions = []
  this.port = null

  this.ready()
}

Stamp.$.extend(Probe.prototype, {
  ready: function () {
    var self = this

    if (document) {
      self.clearTimers(['documentReady'])
      self.prepare()
    } else {
      self.timers.documentReady = setTimeout(self.ready, self.intervals.documentReady)
    }
  },

  prepare: function () {
    var self = this

    if (document.readyState.toLowerCase() === 'complete') {
      console.log('%cTry to connect when document readyState is complete', 'font-size: 13px; color: #d1b700;')

      self.tryToConnect()
    } else {
      document.onreadystatechange = function () {
        if (document.readyState.toLowerCase() === 'complete') {
          if (self.forced) return null

          console.log('%cTry to connect when document readyState change to complete', 'font-size: 13px; color: #d1b700;')

          self.clearTimers(['interactive', 'force'])
          self.tryToConnect()
        }
        else if (document.readyState.toLowerCase() === 'interactive') {
          self.timers.interactive = setTimeout(function () {
            if (self.forced) return null

            console.log('%cTry to connect when document readyState change to interactive and then waiting for 5s', 'font-size: 13px; color: #d1b700;')

            self.clearTimers(['interactive', 'force'])
            self.tryToConnect()
          }, self.intervals.interactive)
        }
      }

      self.timers.force = setTimeout(function () {
        self.forced = true

        console.log('%cTry to connect when forced after 20s', 'font-size: 13px; color: #d1b700;')

        self.clearTimers(['interactive', 'force'])
        self.tryToConnect()
      }, self.intervals.force)
    }
  },

  tryToConnect: function () {
    var self = this
    chrome.runtime.sendMessage({
      command: 'buildPort'
    }, function (response) {
      if (response.code == 200) {
        self.buildPort(response)
      }
    })
  },

  buildPort: function (response) {
    var self = this

    var winID = response.winId
    var tabID = response.tabId

    this.channel = [winID, tabID]

    this.port = chrome.runtime.connect({
      name: self.channel.join('#')
    })

    this.monitor()

    this.inject()
  },

  monitor: function () {
    var self = this

    this.port.onMessage.addListener(function (message) {
      if (message.portName !== self.port.name) return null
      var commandAction = self.find(message.command).shift()
      commandAction && commandAction.action(message)
    })
  },

  inject: function () {
    var self = this

    this.port.postMessage({
      portName: self.port.name,
      command: 'launchFairy',
    })
  },

  clearTimers: function (timers) {
    var self = this

    Stamp.$.each(timers, function (index, timer) {
      var timer = self.timers[timer]
      timer !== null && clearTimeout(timer)
    })
  },

  execute: function (command, addition, callback) {
    var self = this
    var args = Array.prototype.slice.call(arguments)

    if (!args.length || typeof args[0] !== 'string') {
      console.error('Can not post message without command')
    }

    var command = args[0]
    var addition = {}
    var callback = null

    if (args.length == 2) {
      if (typeof args[1] === 'function') {
        callback = args[1]
      } else {
        addition = args[1]
      }
    } else if (args.length == 3) {
      addition = args[1]
      callback = args[2]
    }

    if (callback) {
      this.commandActions.push({
        command: [command, 'reply'].join('_'),
        action: callback
      })
    }

    var message = Stamp.$.extend({
      portName: self.port.name,
      command: command
    }, addition, false)
    this.port.postMessage(message)
  },

  find: function (command) {
    for (var index = 0; index < this.commandActions.length; index++) {
      var commandAction = this.commandActions[index]
      if (commandAction.command === command) break
    }

    return this.commandActions.splice(index, 1)
  },
})

Stamp.probe = new Probe()