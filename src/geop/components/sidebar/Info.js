import {app as appConf} from 'Conf/settings'
import Component from 'Geop/Component'
import $ from 'jquery'

class Info extends Component {
  constructor (target) {
    super(target)
    this.id = 'info-tab'
    this.el = $(`<div class="tab-pane fade ${this.id === appConf.sideBarTab ? 'show active' : ''}" id="${this.id}" role="tabpanel"></div>`)
    this.create()
  }
  create () {
    if (this.target && this.el) {
      console.log('info')
      this.target.append(this.el)
      this.render()
    }
  }
  render () {
    this.el.html(`
      infopage
    `)
  }
}

export default Info
