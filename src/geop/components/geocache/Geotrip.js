//import { t } from 'Utilities/translate'
import Component from 'Geop/Component'
import $ from 'jquery'

class Geotrip extends Component {
  constructor (target) {
    super(target)
    this.id = 'tab-geotrip'
    this.icon = 'fa fa-thumbtack'
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

export default Geotrip
