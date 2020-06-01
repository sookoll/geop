import Component from 'Geop/Component'
import { getState, setState } from 'Utilities/store'
import { closestFeatureTo } from 'Components/map/MapEngine'
import Overlay from 'ol/Overlay'
import Point from 'ol/geom/Point'
import Popover from 'bootstrap.native/src/components/popover-native'
import './ContextMenu.styl'

class ContextMenu extends Component {
  create () {
    this.el = this.$.create('<div id="contextmenu-map"></div>')
    let items = getState('map/contextmenu')
    if (!items) {
      items = []
      setState('map/contextmenu', items)
    }
    this.state = {
      overlay: new Overlay({
        element: this.el,
        autoPan: true,
        autoPanMargin: 150,
        positioning: 'center-center',
        offset: [0, 0]
      }),
      items: items,
      timeout: null,
      disableClick: false,
      popover: null,
      popContent: null
    }
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
    map.on('singleclick', e => {
      if (e.originalEvent.ctrlKey || this.state.disableClick) {
        return
      }
      this.close()
    })
    this.$.on('contextmenu', map.getViewport(), e => {
      e.preventDefault()
      setState('event/contextmenu', true)
      let coords = map.getEventCoordinate(e)
      const hit = closestFeatureTo(map, map.getEventPixel(e), coords)
      if (hit && hit[1].getGeometry() instanceof Point) {
        coords = hit[1].getGeometry().getCoordinates()
      }
      this.state.popContent = this.getContent(coords, hit)
      this.open(coords, this.state.popContent)
      this.state.disableClick = true
      this.state.timeout = setTimeout(() => { this.state.disableClick = false }, 1000)
    })
    // when popover's content is shown
    this.$.on('shown.bs.popover', this.el, e => {
      if (this.state.popContent) {
        console.log(e.target.Popover)
        this.state.popContent.onShow(e.target.Popover.element)
      }
    })
    // when popover's content is hidden
    this.$.on('hidden.bs.popover', this.el, e => {
      if (this.state.popContent) {
        this.state.popContent.onHide()
      }
    })
  }

  open (coord, popContent) {
    this.close()
    this.state.overlay.setPosition(coord)
    this.state.popover = new Popover(this.el, popContent.definition).show()
  }

  close () {
    if (this.state.popover) {
      this.state.popover.hide()
      this.state.popover.dispose()
      this.state.popover = null
    }
  }

  getContent (coord, feature) {
    const content = this.state.items.map((item, i) => {
      const cont = (typeof item.content === 'function') ? item.content(coord) : item.content
      return `<li class="list-group-item item-${i}">${cont}</li>`
    })
    return {
      definition: {
        container: this.el,
        placement: 'right',
        animation: 'none',
        trigger: 'click',
        content: content.join(''),
        offset: (this.state.items.length - 1) * 20 + 'px, 0',
        template: `
          <div class="contextmenu popover">
            <div class="arrow"></div>
            <div class="popover-body"></div>
          </div>`
      },
      onShow: pop => {
        this.$.on('contextmenu', pop, e => {
          e.stopPropagation()
        })
        this.state.items.forEach((item, i) => {
          if (typeof item.onClick === 'function') {
            this.$.on('click', this.$.get('.item-' + i, pop), e => {
              e.preventDefault()
              item.onClick(e, coord, feature)
              if (item.closeOnClick) {
                this.close()
              }
            })
          }
          if (typeof item.onBtnClick === 'function') {
            this.$.on('click', this.$.get(`.item-${i} .context-item-btn`, pop), e => {
              e.preventDefault()
              e.stopPropagation()
              item.onBtnClick(e, coord, feature)
              if (item.closeOnClick) {
                this.close()
              }
            })
          }
        })
      },
      onHide: () => {}
    }
  }
}

export default ContextMenu
