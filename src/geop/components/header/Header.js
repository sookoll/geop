import Component from 'Geop/Component'
import LayerManager from 'Components/layer/LayerManager'
import Search from 'Components/search/Search'
import $ from 'jquery'
import {app as appConf} from 'Conf/settings'
import './Header.styl'

class Header extends Component {
  constructor (target) {
    super(target)
    this.el = $(`<header id="header" class="panel-bar"></header>`)
    this.create()
    this.components = {
      lyrmngr: appConf.layerManager && new LayerManager(this.el),
      search: appConf.searchEnabled && new Search(this.el)
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
