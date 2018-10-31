document.componentRegistry = {}

class Component {
  constructor() {
    this.$id = ++Object.keys(document.componentRegistry).length
    document.componentRegistry[this.$id] = this
  }
  render () {
    return ''
  }
}

export default Component
