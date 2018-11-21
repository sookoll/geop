import Component from 'Geop/Component'
import {t} from 'Utilities/translate'
import $ from 'jquery'
//import './FullScreen.styl'

class ContextMenu extends Component {
  constructor (target) {
    super(target)
    this.el = $(`<div class="btn-group float-right" id="fullscreen"></div>`)
    this.state = {
      active: false
    }
    this.create()
  }
  render () {
    
  }
}

export default ContextMenu
