//import { t } from 'Utilities/translate'
import Component from 'Geop/Component'
import $ from 'jquery'

class Filter extends Component {
  constructor (target) {
    super(target)
    this.id = 'tab-filter'
    this.icon = 'fa fa-filter'
    this.el = $(`
      <div
        class="tab-pane fade"
        id="${this.id}"
        role="tabpanel">
      </div>
    `)
    this.create()
  }
}

export default Filter
