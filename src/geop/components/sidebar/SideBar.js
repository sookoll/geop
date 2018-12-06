import { t } from 'Utilities/translate'
import Component from 'Geop/Component'
import $ from 'jquery'
import './SideBar.styl'

class Sidebar extends Component {
  constructor (opts) {
    if (!opts.target) {
      opts.target = $('body')
    }
    super(opts.target)
    this.el = $(`<nav id="sidebar" class="bg-light p-3"></nav>`)
    this.shadow = $(`<div id="sidebar-shadow" class=""></div>`)
    this.state = {
      trigger: opts.trigger,
      position: opts.position,
      shadow: opts.shadow,
      active: opts.activeComponent
    }
    this.trigger = opts.trigger
    this.components = opts.components
    this.create()
    this.renderChildrens(this.el.find(' > ul'), this.el.find('> div'))
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
  renderChildrens (tabTarget, contentTarget) {
    Object.keys(this.components).forEach((i) => {
      const plug = new this.components[i](contentTarget)
      tabTarget.append(`
        <li class="nav-item">
          <a class="nav-link ${this.state.active === plug.id ? 'active' : ''}"
            data-toggle="pill"
            href="#${plug.id}"
            role="tab"
            aria-controls="${plug.id}">
            ${plug.icon ? `<i class="${plug.icon}"></i>` : ''}
            ${t(i)}
          </a>
        </li>
      `)
    })
  }
}

export default Sidebar
