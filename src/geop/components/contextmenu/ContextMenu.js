import Component from 'Geop/Component'
import { getState, setState } from 'Utilities/store'
import { closestFeatureTo } from 'Components/map/MapEngine'
import Overlay from 'ol/Overlay'
import Point from 'ol/geom/Point'
import Popper from 'popper.js'
import $ from 'jquery'
import './ContextMenu.styl'

class ContextMenu extends Component {
  constructor (target) {
    super(target)
    this.el = $('<div id="contextmenu-map"></div>')
    let items = getState('map/contextmenu')
    if (!items) {
      items = []
      setState('map/contextmenu', items)
    }
    this.state = {
      overlay: null,
      items: items
    }
    this.create()
  }
  render () {
    this.state.overlay = new Overlay({
      element: this.el[0],
      autoPan: true,
      autoPanMargin: 150,
      positioning: 'center-center',
      offset: [0, 0]
    })
    const map = getState('map')
    if (map) {
      this.init(map)
    } else {
      const que = getState('map/que')
      que.push(map => {
        this.init(map)
      })
    }
  }
  init (map) {
    map.addOverlay(this.state.overlay)
    map.on('click', e => {
      this.el.popover('dispose')
    })
    map.getViewport().addEventListener('contextmenu', e => {
      e.preventDefault()
      let coords = map.getEventCoordinate(e)
      const hit = closestFeatureTo(map, map.getEventPixel(e), coords)
      if (hit && hit[1].getGeometry() instanceof Point) {
        coords = hit[1].getGeometry().getCoordinates()
      }
      this.open(coords, this.getContent(coords, hit))
    })
  }
  open (coord, popContent) {
    Popper.Defaults.modifiers.preventOverflow.enabled = false
    Popper.Defaults.modifiers.hide.enabled = false
    this.el.popover('dispose')
    this.state.overlay.setPosition(coord)
    this.el.popover(popContent.definition)
    // when popover's content is shown
    this.el.on('shown.bs.popover', e => {
      popContent.onShow($(e.target).data('bs.popover').tip)
    })
    // when popover's content is hidden
    this.el.on('hidden.bs.popover', () => {
      popContent.onHide()
      Popper.Defaults.modifiers.preventOverflow.enabled = true
      Popper.Defaults.modifiers.hide.enabled = true
    })
    this.el.popover('show')
  }
  getContent (coord, feature) {
    console.log(this.state.items)
    const content = this.state.items.map((item, i) => {
      const cont = (typeof item.content === 'function') ? item.content(coord) : item.content
      return `<li class="list-group-item item-${i}">${cont}</li>`
    })
    return {
      definition: {
        container: this.el,
        placement: 'right',
        animation: false,
        html: true,
        content: content.join(''),
        offset: (this.state.items.length - 1) * 20 + 'px, 0',
        template: `
          <div class="contextmenu popover">
            <div class="arrow"></div>
            <div class="popover-body"></div>
          </div>`
      },
      'onShow': pop => {
        $(pop).on('contextmenu', e => {
          e.stopPropagation()
        })
        this.state.items.forEach((item, i) => {
          if (typeof item.onClick === 'function') {
            $(pop).on('click', '.item-' + i, e => {
              e.preventDefault()
              item.onClick(e, coord, feature)
              if (item.closeOnClick) {
                this.el.popover('dispose')
              }
            })
          }
          if (typeof item.onBtnClick === 'function') {
            $(pop).on('click', `.item-${i} .context-item-btn`, e => {
              e.preventDefault()
              e.stopPropagation()
              item.onBtnClick(e, coord, feature)
              if (item.closeOnClick) {
                this.el.popover('dispose')
              }
            })
          }
        })
      },
      'onHide': () => {}
    }
  }
}

export default ContextMenu
