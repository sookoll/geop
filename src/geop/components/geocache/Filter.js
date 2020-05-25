import { geocache as cacheConf } from 'Conf/settings'
import { t } from 'Utilities/translate'
import { getState, setState, onchange } from 'Utilities/store'
import { serializeArray } from 'Utilities/util'
import Component from 'Geop/Component'
import $ from 'Utilities/dom'
import './Filter.styl'

class Filter extends Component {
  constructor (target) {
    super(target)
    this.id = 'tab-filter'
    this.icon = 'fa fa-filter'
    this.btnTextVisible = true
    this.el = $.create(`<div
      class="tab-pane fade"
      id="${this.id}"
      role="tabpanel">
    </div>`)
    this.state = {
      tab: null,
      conf: this.createConf(),
      layer: null,
      filter: {}
    }
    this.create()
    onchange('geocache/loadend', layer => {
      this.state.layer = layer
      this.render()
    })
  }
  render () {
    this.state.filter = this.buildPropertyList(this.state.layer)
    const storedFilter = getState('geocache/filter')
    $.html(this.el, `
      <ul class="list-group mb-3">
      ${Object.keys(this.state.filter).length
    ? this.renderFilter(this.state.filter, storedFilter ? storedFilter['query'] : {})
    : `<li class="list-group-item">
          <i class="fas fa-plus"></i>
          ${t('Add caches to map')}
        </li>`}
      </ul>
    `)
    $.get('input[data-filter]', this.el, true).forEach(el => {
      $.on('change', el, e => {
        e.stopPropagation()
        this.filter()
      })
    })
    if ($.get('input[name=radiusStyle]', this.el)) {
      $.on('change', $.get('input[name=radiusStyle]', this.el), e => {
        e.stopPropagation()
        this.state.layer.getSource().forEachFeature(f => {
          if (f.get('isCache')) {
            f.set('radiusVisible', e.target.checked)
          }
        })
        this.filter()
      })
    }
    if ($.get('input[name=hidePoints]', this.el)) {
      $.on('change', $.get('input[name=hidePoints]', this.el), e => {
        e.stopPropagation()
        this.state.layer.getSource().forEachFeature(f => {
          if (!f.get('isCache')) {
            f.set('hidden', e.target.checked)
          }
        })
        this.filter()
      })
    }
    if (Object.keys(this.state.filter).length && storedFilter && storedFilter['count']) {
      this.filter()
    }
  }
  renderFilter (filter, storedFilter = {}) {
    return `
      <li class="list-group-item">
        <label>
          <input type="checkbox" name="radiusStyle" value="160" ${storedFilter['radiusStyle'] && storedFilter['radiusStyle'].indexOf('160') > -1 ? 'checked="true"' : ''}> ${t('Show 160m radius')}
        </label>
        <label>
          <input type="checkbox" name="hidePoints" value="off" ${storedFilter['hidePoints'] && storedFilter['hidePoints'].indexOf('off') > -1 ? 'checked="true"' : ''}> ${t('Hide additional points')}
        </label>
      </li>
      ${Object.keys(filter).map(group => {
    const sortingArr = this.state.conf[group]
    const ordered = {}
    Object.keys(filter[group]).sort((a, b) => sortingArr.indexOf(a) - sortingArr.indexOf(b)).forEach(key => {
      ordered[key] = filter[group][key]
    })
    const list = Object.keys(ordered).map(item => {
      const checked = storedFilter[group] && storedFilter[group].indexOf(item) > -1 ? 'checked="true"' : ''
      return `<label>
                <input type="checkbox" name="${group}" data-filter="${group}" value="${item}" ${checked}>
                ${t(filter[group][item])}
              </label>`
    })
    return '<li class="list-group-item">' + list.join('') + '</li>'
  }).join('')}`
  }
  createConf () {
    const conf = {}
    Object.keys(cacheConf.filter).forEach(f => {
      if (typeof cacheConf.filter[f] === 'string') {
        conf[f] = Object.values(cacheConf.mapping[cacheConf.filter[f]])
      } else {
        conf[f] = cacheConf.filter[f]
      }
    })
    return conf
  }
  buildPropertyList (layer) {
    let filter = {}
    if (layer && typeof layer.getSource === 'function') {
      layer.getSource().forEachFeature(f => {
        const props = f.getProperties()
        Object.keys(props).forEach(i => {
          if (i in this.state.conf) {
            if (!filter[i]) {
              filter[i] = {}
            }
            if (this.state.conf[i].indexOf(props[i]) > -1 && !filter[i][props[i]]) {
              filter[i][props[i]] = props[i]
            }
          }
        })
      })
    }
    Object.keys(filter).forEach(f => {
      if (Object.keys(filter[f]).length === 0) {
        delete filter[f]
      }
    })
    return filter
  }
  filter () {
    const params = this.getChecked('input[data-filter]')
    this.state.layer.getSource().forEachFeature(f => {
      if (f.get('isCache')) {
        if (params.count) {
          const props = f.getProperties()
          const valid = Object.keys(params.query).filter(i => {
            return (i in props && params.query[i].indexOf(props[i]) > -1)
          })
          f.set('hidden', valid.length !== Object.keys(params.query).length)
        } else {
          f.set('hidden', false)
        }
      }
    })
    setState('geocache/filter', this.getChecked('input'), true)
  }
  getChecked (selector) {
    const checked = serializeArray($.get(selector, this.el, true))
    const params = {
      query: {},
      count: 0
    }
    for (let i = 0, len = checked.length; i < len; i++) {
      if (!params.query[checked[i].name]) {
        params.query[checked[i].name] = []
      }
      if (params.query[checked[i].name].indexOf(checked[i].value) === -1) {
        params.query[checked[i].name].push(checked[i].value)
        params.count++
      }
    }
    return params
  }
}

export default Filter
