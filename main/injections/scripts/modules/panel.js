function Panel(fairy) {
  this.ids = {
    panel: '_panel_',
    trigger: '_trigger_',
    tabs: '_tabs_',
    container: '_container_'
  }

  this.nodes = {
    panel: null,
    trigger: null,
    tabs: null,
    container: null,

    tabBlocks: {},
    tabBlockTriggers: {}
  }

  this.tabConfig = {
    tabBlock: 'tabBlock',
    tabBlockTrigger: 'tabBlockTrigger',

    selectedTabBlockTrigger: 'selectedTabBlockTrigger',

    tabBlocks: {},
    tabBlockTriggers: {},
  }

  this.fairy = fairy

  this.boot()
  this.init()
}

Stamp.$.extend(Panel.prototype, {
  boot: function () {
    var self = this

    var tabConfig = self.tabConfig
    var layout = self.fairy.layout

    var blockSuffix = tabConfig.tabBlock.replace(tabConfig.tabBlock[0], tabConfig.tabBlock[0].toUpperCase())
    var triggerSuffix = tabConfig.tabBlockTrigger.replace(tabConfig.tabBlockTrigger[0], tabConfig.tabBlockTrigger[0].toUpperCase())

    Stamp.$.each(layout, function (prop, config) {
      tabConfig.tabBlocks[config.anchor] = {
        klass: [tabConfig.tabBlock, config.anchor + blockSuffix].join(' '),
        default: config.default ? true : false
      }

      tabConfig.tabBlockTriggers[config.anchor] = {
        klass: [tabConfig.tabBlockTrigger, config.anchor + triggerSuffix].join(' '),
        text: config.triggerText,
        default: config.default ? true : false
      }
    })
  },

  init: function () {
    var self = this
    var nodes = self.nodes

    Stamp.$.each(self.ids, function (name, id) {
      nodes[name] = Stamp.$('<div></div>').attr('id', id)
    })

    nodes.panel.css('font-size', '20px')
    nodes.panel.append(nodes.trigger.text('快速下单'))
    nodes.panel.append(nodes.tabs)
    nodes.panel.append(nodes.container)

    self.render()
    self.bind()

    self.append()
  },

  render: function () {
    var self = this

    var nodes = self.nodes
    var tabConfig = self.tabConfig

    var tabs = nodes.tabs
    var container = nodes.container

    Stamp.$.each(tabConfig.tabBlocks, function (prop, config) {
      var block = Stamp.$('<div>', {class: config.klass})

      nodes.tabBlocks[prop] = block

      config.default ? block.show() : block.hide()

      container.append(block)
    })

    Stamp.$.each(tabConfig.tabBlockTriggers, function (prop, config) {
      var trigger = Stamp.$('<div>', {class: config.klass})
        .text(config.text)
        .attr('data-show', tabConfig.tabBlocks[prop].klass)

      nodes.tabBlockTriggers[prop] = trigger

      config.default && trigger.addClass(self.tabConfig.selectedTabBlockTrigger)

      tabs.append(trigger)
    })
  },

  bind: function () {
    var self = this

    var tabConfig = self.tabConfig
    var selectedTabBlockTrigger = self.tabConfig.selectedTabBlockTrigger

    var tabs = self.nodes.tabs
    var container = self.nodes.container

    tabs.delegate('.' + tabConfig.tabBlockTrigger, 'click', function (e) {
      var target = Stamp.$(e.target)
      var show = target.attr('data-show')

      Stamp.$.each(tabs.children(), function (index, child) {
        var child = Stamp.$(child)
        child.removeClass(selectedTabBlockTrigger)
      })
      target.addClass(selectedTabBlockTrigger)

      Stamp.$.each(container.children(), function (index, child) {
        var child = Stamp.$(child)
        child.hasClass(show) ? child.show() : child.hide()
      })
    })
  },

  append: function () {
    var self = this
    var nodes = self.nodes

    Stamp.$('body').append(nodes.panel)

    new Draggable(self.ids.panel, {
      handle: self.ids.trigger
    })
  }
})

module.exports = Panel