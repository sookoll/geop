import { getState } from 'Utilities/store'
import { t } from 'Utilities/translate'
import Component from 'Geop/Component'
import Info from 'Components/sidebar/Info'
import Settings from 'Components/sidebar/Settings'
import $ from 'jquery'
import './SideBar.styl'

class Sidebar extends Component {
  constructor (target) {
    super(target)
    this.el = $(`<div class="btn-group float-left" id="sidebar-open"></div>`)
    this.shadow = $(`<div id="sidebar-shadow" class=""></div>`)
    this.sidebar = $(`<nav id="sidebar" class="bg-light p-3"></nav>`)
    this.create()
    this.components = {
      Info,
      Settings
    }
    this.renderChildrens(this.sidebar.find(' > ul'), this.sidebar.find('> div'))
  }
  create () {
    if (this.target && this.el) {
      this.target.append(this.el)
      $('body')
        .append(this.sidebar)
        .append(this.shadow)
      this.render()
    }
  }
  render () {
    this.el.html(`
      <button type="button"
        class="btn btn-secondary">
        <i class="fa fa-ellipsis-h"></i>
      </button>
    `)
    this.sidebar.html(`
      <button type="button" class="close">
        <i class="fa fa-times"></i>
      </button>
      <ul class="nav nav-pills mb-3" id="pills-tab" role="tablist"></ul>
      <div class="tab-content" id="pills-tabContent"></div>
    `)
    this.el.on('click', 'button', e => {
      this.openSidebar()
    })
    this.sidebar.on('click', '> button', e => {
      this.closeSidebar()
    })
    this.shadow.on('click', e => {
      this.closeSidebar()
    })
  }

  openSidebar () {
    this.sidebar.addClass('active')
    this.shadow.addClass('active')
  }

  closeSidebar () {
    this.sidebar.removeClass('active')
    this.shadow.removeClass('active')
  }

  renderChildrens (tabTarget, contentTarget) {
    Object.keys(this.components).forEach((i) => {
      const plug = new this.components[i](contentTarget)
      tabTarget.append(`
        <li class="nav-item">
          <a class="nav-link ${getState('app/sideBarTab') === plug.id ? 'active' : ''}"
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
