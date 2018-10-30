import Base from 'Geop/Base'

class Store extends Base {
  constructor () {
    super()
    this.state = {}
  }

  set (item, value) {
    this.state[item] = value
  }

  get (item) {
    return this.state[item]
  }
}

export default Store
