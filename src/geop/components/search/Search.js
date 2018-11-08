import {t} from 'Utilities/translate'
import {getState} from 'Utilities/store'
//import log from 'Utilities/log'
import Component from 'Geop/Component'
import $ from 'jquery'
import './Search.styl'

class Search extends Component {
  constructor (target) {
    super(target)
    this.state = {
      overlays: getState('map/layer/overlays'),
      results: [],
      open: false,
      counter: 0
    }
    this.render()
  }
  render () {
    const html = $(`
      <div id="search" class="input-group float-right">
        <input type="text" class="form-control" placeholder="${t('Search')}">
        <div class="input-group-append fill-width">
          <button class="btn btn-secondary dropdown-toggle no-caret"
            type="button"
            data-toggle="dropdown"
            aria-expanded="true"
            disabled>
            <i class="fa fa-search"></i>
          </button>
          <ul class="dropdown-menu dropdown-menu-right scrollable-menu" role="menu"></ul>
        </span>
      </div>`)
    this.target.append(html)
    this.el = this.target.find('#search')
    this.resultsEl = this.el.find('ul')
    this.el
      .find('.dropdown-toggle')
      .on('shown.bs.dropdown', () => {
        this.state.open = true
      })
      .on('hidden.bs.dropdown', () => {
        this.state.open = false
      })
      .on('click', e => {
        const val = $(e.target).val().trim()
        if (!this.state.results.length && val.length > 1) {
          this.search(val)
        }
      })
      this.el.find('input').on('keyup', e => {
        // clear
        if (this.state.results.length) {
          this.clear()
        }
        const val = $(e.target).val().trim()
        this.el.find('.dropdown-toggle').prop('disabled', (val.length < 1))
        if (e.keyCode === 13 && val.length > 1) {
          this.search(val)
        }
      })
  }
  renderResults () {
    this.resultsEl.html(this.state.results.map(result => {
      return `
        <li>
          <a href="#" class="dropdown-item"
            data-id="${result.id}" data-type="${result.type}">
            <i class="fa fa-angle-right"></i>
            ${result.name}
          </a>
        </li>`
      }).join(''))
    if (this.state.open) {
      this.el.find('.dropdown-toggle').dropdown('toggle')
      this.state.open = false
    }
  }
  clear () {
    Object.keys(this.providers).forEach(key => {
      this.providers[key].clear()
    })
    this.state.results = []
    this.renderResults()
  }
  search (query) {
    this.state.counter = 0
    this.searchStart();
    Object.keys(this.providers).forEach(key => {
      this.providers[key].find(query, (title, data) => {
        
      })
      this.state.counter++
    })
  }
  searchStart () {
    this.el.find('.dropdown-toggle i')
      .removeClass('fa-search')
      .addClass('fa-spinner fa-pulse')
  },

  searchEnd () {
    this.el.find('.dropdown-toggle i')
      .removeClass('fa-spinner fa-pulse')
      .addClass('fa-search')
  }
}

export default Search
