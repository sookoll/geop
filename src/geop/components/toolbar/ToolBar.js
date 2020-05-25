import { getState } from 'Utilities/store'
import Component from 'Geop/Component'
import Zoom from './Zoom'
import Compass from './Compass'
import GeoLocation from 'Components/geolocation/GeoLocation'
import './ToolBar.styl'

class ToolBar extends Component {
  constructor (target) {
    super(target)
    this.el = this.$.create(`<nav id="toolbar" class="btn-group-vertical btn-group-lg"></nav>`)
    this.create()
    this.components = {
      zoom: new Zoom(this.el),
      geolocation: getState('app/geoLocation') && new GeoLocation(this.el),
      compass: new Compass(this.el)
    }
  }
}

export default ToolBar
