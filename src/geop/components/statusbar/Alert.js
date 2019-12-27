import Component from 'Geop/Component'
import $ from 'jquery'
import './Alert.styl'

class Alert extends Component {
  constructor (target) {
    super(target)
    this.el = $(`
      <div class="alert small alert-warning alert-dismissible tool-results routing" role="alert">
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
          <i class="fa fa-times"></i>
        </button>
        <div class=""></div>
      </div>
    `)
    this.create()
  }
  render () {

  }
  close () {
    this.el.alert('close')
  }
  open (content, onclose) {
    this.el.find('div').html(content)
    $('body').append(this.el)
    this.el.on('closed.bs.alert', () => {
      onclose()
    })
  }
  update (content) {
    this.el.find('div').html(content)
  }
}

export default Alert
