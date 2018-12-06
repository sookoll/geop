import { getState } from 'Utilities/store'
import Component from 'Geop/Component'
import Geocache from 'Components/geocache/Geocache'
import LayerManager from 'Components/layer/LayerManager'
import Search from 'Components/search/Search'
import $ from 'jquery'
import './Header.styl'

class Header extends Component {
  constructor (target) {
    super(target)
    this.el = $(`<header id="header" class="panel-bar"></header>`)
    this.create()
    this.components = {
      geocache: new Geocache(this.el),
      lyrmngr: getState('app/layerManager') && new LayerManager(this.el),
      search: getState('app/searchEnabled') && new Search(this.el)
    }
  }
  render () {
    this.el.html(`
      <span class="d-none">
        <a id="download-link" download="filename">download</a>
      </span>`)
  }
}

export default Header
