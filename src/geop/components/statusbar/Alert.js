import Component from 'Geop/Component'
import $ from 'Utilities/dom'
import './Alert.styl'

class Alert extends Component {
  constructor (target) {
    super(target)
    this.el = $.create(`<div
      class="alert small alert-warning alert-dismissible tool-results routing"
      role="alert">
    </div>`)
    this.create()
  }
  render () {
    $.html(this.el, `<button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <i class="fa fa-times"></i>
    </button>
    <div class=""></div>`)
  }
  close () {
    // FIXME alert
    //this.el.alert('close')
  }
  open (content, onclose) {
    this.update(content)
    $.append($.get('body'), this.el)
    // FIXME alert
    //this.el.on('closed.bs.alert', () => {
    //  onclose()
    //})
  }
  update (content) {
    $.get('div', this.el).innerHTML = content
  }
}

export default Alert
