import Component from 'Geop/Component'
import Zoom from './Zoom'
import $ from 'jquery'
import './ToolBar.styl'

class ToolBar extends Component {
  constructor (target) {
    super(target)
    this.el = $(`<nav id="toolbar" class="btn-group-vertical btn-group-lg"></nav>`)
    this.create()
    this.components = {
      zoom: new Zoom(this.el)
    }
  }
}

export default ToolBar
