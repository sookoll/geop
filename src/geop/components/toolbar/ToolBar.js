import { getState } from 'Utilities/store'
import Component from 'Geop/Component'
import Zoom from './Zoom'
import Compass from './Compass'
import GeoLocation from 'Components/geolocation/GeoLocation'
import './ToolBar.styl'

class ToolBar extends Component {
  create () {
    this.el = this.$.create('<nav id="toolbar" class="btn-group-vertical btn-group-lg"></nav>')
    this.componentsConfiguration = {
      zoom: Zoom
    }
    if (getState('app/geoLocation')) {
      this.componentsConfiguration.geolocation = GeoLocation
    }
    this.componentsConfiguration.compass = Compass
  }
}

export default ToolBar
