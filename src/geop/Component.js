class Component {
  constructor (target) {
    // set target and element
    this.target = target
    this.el = null
    // state
    this.state = {}
    // call create
    this.create()
    // child components
    this.components = {}
  }
  create () {
    if (this.target && this.el) {
      this.target.append(this.el)
      this.render()
    }
  }
  render () {

  }
  renderComponents () {

  }
  getComponent (key) {
    return this.components[key]
  }
  getEl () {
    return this.el
  }
  set (name, value) {
    this.state[name] = value
  }
  get (name) {
    return this.state[name]
  }
  destroy () {
    Object.keys(this.components).forEach(c => this.components[c].destroy())
    this.components = {}
    this.el.remove()
  }
}

export default Component
