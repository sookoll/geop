import { getState } from 'Utilities/store'
import Component from 'Geop/Component'
import Geocache from 'Components/geocache/Geocache'
import LayerManager from 'Components/layer/LayerManager'
import Search from 'Components/search/Search'
import './Header.styl'

class Header extends Component {
  create () {
    this.el = this.$.create('<header id="header" class="panel-bar"></header>')
    this.componentsConfiguration.Geocache = Geocache
    if (getState('app/layerManager')) {
      this.componentsConfiguration.LayerManager = LayerManager
    }
    if (getState('app/searchEnabled')) {
      this.componentsConfiguration.Search = Search
    }
  }
}

export default Header
