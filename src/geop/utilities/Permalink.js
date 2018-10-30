import Base from 'Geop/Base'
import {parseURL} from 'Utilities/util'

class Permalink extends Base {
  constructor () {
    super()
    this.state = {
      oldURL: null,
      newURL: parseURL(document.URL),
      hash: null
    }
    this.state.hash = this.parseHash(this.state.newURL.hash)
    this.activatePermalink()
  }

  activatePermalink () {
    window.addEventListener('hashchange', (event) => {
      this.state.oldURL = this.state.newURL
      this.state.newURL = parseURL(event.newURL)
      this.state.hash = this.parseHash(this.state.newURL.hash)
      console.log(this.state)
    }, false)
  }

  parseHash (hash) {
    const parsed = {}
    hash.slice(1).split('/').forEach(item => {
      const parts = item.split('=')
      parsed[parts[0]] = parts[1]
    })
    return parsed
  }

  get (id) {
    return this.state.hash[id]
  }

}

export default Permalink
