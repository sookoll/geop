import { t } from 'Utilities/translate'
import { onchange } from 'Utilities/store'
import { formatDate, formatTime } from 'Utilities/util'
import Component from 'Geop/Component'
import './GeocacheList.styl'
import $ from 'jquery'

class GeocacheLoader extends Component {
  constructor (target) {
    super(target)
    this.id = 'tab-cachelist'
    this.icon = 'fa fa-cube'
    this.el = $(`
      <div
        class="tab-pane fade"
        id="${this.id}"
        role="tabpanel">
      </div>
    `)
    this.state = {
      collection: []
    }
    this.create()
    onchange('geocache/loadend', layer => {
      this.state.collection = layer.getSource().getFeatures()
      this.render()
    })
  }
  render () {
    this.el.html(`
      <ul class="list-group mb-3">
      ${this.state.collection.length
    ? this.renderList(this.state.collection)
    : `<li class="list-group-item">
          <i class="fas fa-plus"></i>
          ${t('Add caches to map')}
        </li>`}
      </ul>
    `)
  }
  renderList (collection) {
    return collection.map((f, i) => {
      return `
        <li class="list-group-item sort-item" data-id="${f.getId()}">
          <a href="#">${t(f.get('name'))}</a>
          <i class="fas fa-circle fstatus ${f.get('fstatus') === 'Found' ? 'found' : ''}"></i>
          ${f.get('fstatus_timestamp')
    ? `<div class="text-muted small timestamp">
              ${t('Found')}:
              ${formatDate(f.get('fstatus_timestamp'), true) + ' ' +
              formatTime(f.get('fstatus_timestamp'))}</div>` : ''}
        </li>`
    }).join('')
  }
}

export default GeocacheLoader
