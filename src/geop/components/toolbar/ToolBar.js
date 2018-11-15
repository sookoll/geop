import {app as appConf} from 'Conf/settings'
import Component from 'Geop/Component'
import Zoom from './Zoom'
import GeoLocation from 'Components/geolocation/GeoLocation'
import $ from 'jquery'
import './ToolBar.styl'

class ToolBar extends Component {
  constructor (target) {
    super(target)
    this.el = $(`<nav id="toolbar" class="btn-group-vertical btn-group-lg"></nav>`)
    this.create()
    this.components = {
      zoom: new Zoom(this.el),
      geolocation: appConf.geoLocation && new GeoLocation(this.el)
    }
  }
}

export default ToolBar
