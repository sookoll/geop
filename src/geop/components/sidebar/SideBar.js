import { t } from 'Utilities/translate'
import { uid } from 'Utilities/util'
import Tab from 'bootstrap.native/src/components/tab-native'
import Component from 'Geop/Component'
import './SideBar.styl'

class Sidebar extends Component {
  create () {
    if (!this.options.target) {
      this.options.target = this.$.get('body')
    }
    this.state = {
      trigger: this.options.trigger,
      position: this.options.position,
      shadow: this.options.shadow,
      active: this.options.activeComponent
    }
    this.trigger = this.options.trigger
    this.id = 'sidebar-' + uid()
    this.el = this.$.create(`<nav id="${this.id}" class="sidebar bg-light p-3"></nav>`)
    this.shadow = this.$.create(`<div id="${this.id}-shadow" class="sidebar-shadow"></div>`)

    if (this.target && this.el) {
      this.$.append(this.target, this.el)
      if (this.state.shadow) {
        this.$.append(this.target, this.shadow)
      }
      this.render()
    }
  }

  render () {
    this.$.html(this.el, `
      <button type="button" class="close" aria-label="${t('Close')}">
        <i class="fa fa-times"></i>
      </button>
      <ul class="nav nav-pills mb-3" role="tablist"></ul>
      <div class="tab-content"></div>
    `)
    this.$.on('click', this.trigger, e => {
      this.openSidebar()
    })
    this.$.on('click', this.$.get(':scope > button', this.el), e => {
      this.closeSidebar()
    })
    this.$.on('click', this.shadow, e => {
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

  createComponents () {
    const comps = this.componentsConfiguration
    const target = this.$.get(':scope > div', this.el)
    Object.keys(comps).forEach((key) => {
      this.components[key] = new comps[key]({ target })
    })
  }

  renderComponents () {
    Object.keys(this.components).forEach((i) => {
      const li = this.$.create(`<li class="nav-item">
        <a class="nav-link ${this.state.active === this.components[i].id ? 'active' : ''}"
          data-toggle="pill"
          href="#${this.components[i].id}"
          role="tab"
          aria-controls="${this.components[i].id}">
          ${this.components[i].icon ? `<i class="${this.components[i].icon}"></i>` : ''}
          <span class="${this.components[i].btnTextVisible ? '' : 'd-none d-sm-inline-block'}">${t(i)}</span>
        </a>
      </li>`)
      const a = this.$.get('a', li)
      // this.$.html(tab, ``)
      this.components[i].set('tab', a)
      this.$.append(this.$.get(':scope > ul', this.el), li)
      // (() => new Tab(a, { height: true }))()
      const tab = new Tab(a)
      if (this.state.active === this.components[i].id) {
        tab.show()
      }
      console.log(tab)
    })
  }
}

export default Sidebar
