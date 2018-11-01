class Component {
  constructor(target) {
    this.target = target
    this.el = null
    this.state = {}
    this.components = {}
  }
  render () {

  }
  update (state = {}) {
    this.state = Object.assign(this.state, state)
    this.render()
  }
}

export default Component
