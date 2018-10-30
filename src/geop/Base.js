class Base {
  constructor (Store = null) {
    this.$conf = null
    this.$store = null
    this.$components = {}
  }
  initComponents (components) {
    Object.keys(components).forEach(key => {
      this.$components[key] = new components[key](this)
    })
  }
}

export default Base
