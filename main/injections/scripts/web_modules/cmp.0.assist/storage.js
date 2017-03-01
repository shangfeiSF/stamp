function Storage(storageKey) {
  this.key = storageKey.toString()

  if (window.localStorage.getItem(storageKey) == null) {
    window.localStorage.setItem(storageKey, JSON.stringify({}))
  }
}

Stamp.$.extend(Storage.prototype, {
  exist: function (prop) {
    return this.getAll().hasOwnProperty(prop)
  },

  getAll: function () {
    return JSON.parse(window.localStorage.getItem(this.key))
  },

  get: function (prop) {
    return this.getAll()[prop]
  },

  update: function (prop, value) {
    var obj = JSON.parse(window.localStorage.getItem(this.key))
    obj[prop] = value
    window.localStorage.setItem(this.key, JSON.stringify(obj))
  },

  remove: function (prop) {
    var obj = JSON.parse(window.localStorage.getItem(this.key))
    delete obj[prop]
    window.localStorage.setItem(this.key, JSON.stringify(obj))
  },

  toggle: function (prop, value) {
    if (this.exist(prop)) {
      this.remove(prop)
    } else {
      this.add(prop, value)
    }
  }
})

module.exports = Storage