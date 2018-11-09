import Component from 'Geop/Component'
import LayerManager from 'Components/layer/LayerManager'
import Search from 'Components/search/Search'
import $ from 'jquery'
import './ToolBar.styl'

class ToolBar extends Component {
  constructor (target) {
    super(target)
    this.el = $(`<header id="toolbar" class="panel-bar"></header>`)
    this.create()
    this.components = {
      lyrmngr: new LayerManager(this.el),
      search: new Search(this.el)
    }
  }
  render () {
    this.el.html(`
      <span class="d-none">
        <a id="download-link" download="filename">download</a>
      </span>`)
  }
}

export default ToolBar
