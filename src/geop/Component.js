import $ from 'Utilities/dom'

class Component {
  constructor (opts = {}) {
    // set dom manipulator
    this.$ = $
    this.options = opts
    // set target and element
    this.target = opts.target
    this.el = null
    this.componentsConfiguration = opts.components || {}
    // state
    this.state = {}
    // child components
    this.components = {}
    // initialize component
    this.create()
    // render component element into target
    if (this.target && this.el) {
      $.append(this.target, this.el)
    }
    // render element
    this.render()
    // call createComponents
    this.createComponents()
    // call renderComponents
    this.renderComponents()
  }

  create () {

  }

  render () {

  }

  createComponents () {
    const comps = this.componentsConfiguration
    Object.keys(comps).forEach((key) => {
      this.components[key] = new comps[key]({ target: this.el })
    })
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
