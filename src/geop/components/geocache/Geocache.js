import { t } from 'Utilities/translate'
import Component from 'Geop/Component'
import Sidebar from 'Components/sidebar/Sidebar'
import GeocacheLoader from './GeocacheLoader'
import Filter from './Filter'
import Geotrip from './Geotrip'
import './Geocache.styl'
import $ from 'jquery'

class Geocache extends Component {
  constructor (target) {
    super(target)
    this.el = $(`
      <div id="geocache" class="btn-group">
        <button
          class="btn btn-secondary"
          title="${t('Caches')}">
          <i class="fa fa-cube"></i>
          <span class="d-none d-sm-inline-block">${t('Caches')}</span>
        </button>
      </div>
    `)
    this.create()
    this.sidebar = new Sidebar({
      trigger: this.el.find('button'),
      position: 'left',
      components: {
        GeocacheLoader,
        Filter,
        Geotrip
      },
      activeComponent: 'tab-loader',
      shadow: false
    })
  }
}

export default Geocache
