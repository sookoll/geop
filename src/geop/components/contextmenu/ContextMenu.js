import Component from 'Geop/Component'
import {getState, setState} from 'Utilities/store'
import Overlay from 'ol/Overlay'
import Point from 'ol/geom/Point'
import $ from 'jquery'
import './ContextMenu.styl'

class ContextMenu extends Component {
  constructor (target) {
    super(target)
    this.el = $('<div id="contextmenu-map"></div>')
    let items = getState('map/contextmenu')
    if (!items) {
      setState('map/contextmenu', [])
      items = getState('map/contextmenu')
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
      autoPanMargin: 50,
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
      let content
      const feature = map.forEachFeatureAtPixel(
        map.getEventPixel(e),
        (feature, layer) => [layer, feature]
      )
      if (feature && feature[1].getGeometry() instanceof Point) {
        coords = feature[1].getGeometry().getCoordinates()
        content = this.getContent(coords)
      } else {
        content = this.getContent(coords)
      }
      this.open(coords, content)
    })
  }
  open (coord, popContent) {
    this.el.popover('dispose')
    this.state.overlay.setPosition(coord)
    this.el.popover(popContent.definition)
    // when popover's content is shown
    this.el.on('shown.bs.popover', e => {
      popContent.onShow($(e.target).data('bs.popover').tip)
    })
    // when popover's content is hidden
    this.el.on('hidden.bs.popover', popContent.onHide)
    this.el.popover('show')
  }
  getContent (coord) {
    const content = this.state.items.map((item, i) => {
      const cont = (typeof item.content === 'function') ? item.content(coord) : item.content
      return `<li class="list-group-item item-${i}">${cont}</li>`
    })
    return {
      definition: {
        placement: 'right',
        animation: false,
        html: true,
        content: content.join(''),
        selector: '#contextmenu-map',
        offset: (this.state.items.length - 1) * 20 + 'px, 0',
        template: '<div class="contextmenu popover"><div class="arrow"></div><div class="popover-body"></div></div>'
      },
      'onShow': pop => {
        this.state.items.forEach((item, i) => {
          if (typeof item.onClick === 'function') {
            $(pop).on('click', '.item-' + i, e => {
              e.preventDefault()
              item.onClick(e, coord)
              if (item.closeOnClick) {
                this.el.popover('dispose')
              }
            })
          }
          if (typeof item.onBtnClick === 'function') {
            $(pop).on('click', `.item-${i} .context-item-btn`, e => {
              e.preventDefault()
              e.stopPropagation()
              item.onBtnClick(e, coord)
              if (item.closeOnClick) {
                this.el.popover('dispose')
              }
            })
          }
        })
      },
      'onHide' : () => {}
    }
  }
}

export default ContextMenu
