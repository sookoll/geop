import { t } from 'Utilities/translate'
import Component from 'Geop/Component'
import { uid } from 'Utilities/util'
import $ from 'Utilities/dom'
import './SideBar.styl'

class Sidebar extends Component {
  constructor (opts) {
    if (!opts.target) {
      opts.target = $.get('body')
    }
    super(opts.target)
    this.id = 'sidebar-' + uid()
    this.el = $.create(`<nav id="${this.id}" class="sidebar bg-light p-3"></nav>`)
    this.shadow = $.create(`<div id="${this.id}-shadow" class="sidebar-shadow"></div>`)
    this.state = {
      trigger: opts.trigger,
      position: opts.position,
      shadow: opts.shadow,
      active: opts.activeComponent
    }
    this.trigger = opts.trigger
    this.create()
    this.components = this.renderComponents(
      $.get(':scope > ul', this.el),
      $.get(':scope > div', this.el),
      opts.components,
      opts.props
    )
  }
  create () {
    if (this.target && this.el) {
      $.append(this.target, this.el)
      if (this.state.shadow) {
        $.append(this.target, this.shadow)
      }
      this.render()
    }
  }
  render () {
    $.html(this.el, `
      <button type="button" class="close" aria-label="${t('Close')}">
        <i class="fa fa-times"></i>
      </button>
      <ul class="nav nav-pills mb-3" role="tablist"></ul>
      <div class="tab-content"></div>
    `)
    $.on('click', this.trigger, e => {
      this.openSidebar()
    })
    $.on('click', $.get(':scope > button', this.el), e => {
      this.closeSidebar()
    })
    $.on('click', this.shadow, e => {
      this.closeSidebar()
    })
  }
  openSidebar () {
    this.el.classList.add('active')
    this.shadow.classList.add('active')
  }
  closeSidebar () {
    this.el.classList.remove('active')
    this.shadow.classList.remove('active')
  }
  renderComponents (tabTarget, contentTarget, components, props) {
    const instances = {}
    Object.keys(components).forEach((i) => {
      const plug = new components[i](contentTarget, props)
      const tab = $.create(`<li class="nav-item"></li>`)
      $.html(tab, `<a class="nav-link ${this.state.active === plug.id ? 'active' : ''}"
        data-toggle="pill"
        href="#${plug.id}"
        role="tab"
        aria-controls="${plug.id}">
        ${plug.icon ? `<i class="${plug.icon}"></i>` : ''}
        <span class="${plug.btnTextVisible ? '' : 'd-none d-sm-inline-block'}">${t(i)}</span>
      </a>`)
      plug.set('tab', tab)
      $.append(tabTarget, tab)
      instances[i] = plug
    })
    return instances
  }
}

export default Sidebar
