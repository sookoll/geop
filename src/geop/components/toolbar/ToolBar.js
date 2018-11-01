import Component from 'Geop/Component'
import LayerManager from 'Components/layer/LayerManager'
import $ from 'jquery'
import './ToolBar.styl'

class ToolBar extends Component {
  constructor (target) {
    super(target)
    this.render()
    this.components = {
      lyrmngr: new LayerManager(this.el)
    }
  }
  render () {
    const html = $(`
      <header id="toolbar" class="panel-bar">
        <span class="d-none">
          <a id="download-link" download="filename">download</a>
        </span>
      </header>`)
    this.target.append(html)
    this.el = this.target.find('#toolbar')
  }
}

export default ToolBar
