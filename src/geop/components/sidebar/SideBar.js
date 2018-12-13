import { t } from 'Utilities/translate'
import Component from 'Geop/Component'
import { uid } from 'Utilities/util'
import $ from 'jquery'
import './SideBar.styl'

class Sidebar extends Component {
  constructor (opts) {
    if (!opts.target) {
      opts.target = $('body')
    }
    super(opts.target)
    this.id = 'sidebar-' + uid()
    this.el = $(`<nav id="${this.id}" class="sidebar bg-light p-3"></nav>`)
    this.shadow = $(`<div id="${this.id}-shadow" class="sidebar-shadow"></div>`)
    this.state = {
      trigger: opts.trigger,
      position: opts.position,
      shadow: opts.shadow,
      active: opts.activeComponent
    }
    this.trigger = opts.trigger
    this.create()
    this.components = this.renderComponents(this.el.find(' > ul'), this.el.find('> div'), opts.components, opts.props)
  }
  create () {
    if (this.target && this.el) {
      this.target.append(this.el)
      this.target.append(this.el)
      if (this.state.shadow) {
        this.target.append(this.shadow)
      }
      this.render()
    }
  }
  render () {
    this.el.html(`
      <button type="button" class="close">
        <i class="fa fa-times"></i>
      </button>
      <ul class="nav nav-pills mb-3" id="pills-tab" role="tablist"></ul>
      <div class="tab-content" id="pills-tabContent"></div>
    `)
    this.trigger.on('click', e => {
      this.openSidebar()
    })
    this.el.on('click', '> button', e => {
      this.closeSidebar()
    })
    this.shadow.on('click', e => {
      this.closeSidebar()
    })
  }
  openSidebar () {
    this.el.addClass('active')
    this.shadow.addClass('active')
  }
  closeSidebar () {
    this.el.removeClass('active')
    this.shadow.removeClass('active')
  }
  renderComponents (tabTarget, contentTarget, components, props) {
    const instances = {}
    Object.keys(components).forEach((i) => {
      const plug = new components[i](contentTarget, props)
      const tab = $(`
        <li class="nav-item">
          <a class="nav-link ${this.state.active === plug.id ? 'active' : ''}"
            data-toggle="pill"
            href="#${plug.id}"
            role="tab"
            aria-controls="${plug.id}">
            ${plug.icon ? `<i class="${plug.icon}"></i>` : ''}
            <span class="${plug.btnTextVisible ? '' : 'd-none d-sm-inline-block'}">${t(i)}</span>
          </a>
        </li>
      `)
      plug.set('tab', tab)
      tabTarget.append(tab)
      instances[i] = plug
    })
    return instances
  }
}

export default Sidebar
