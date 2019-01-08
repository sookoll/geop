import Component from 'Geop/Component'
import {t} from 'Utilities/translate'
import {formatLength, formatArea, makeLink } from 'Utilities/util'
import {getState, setState} from 'Utilities/store'
import Overlay from 'ol/Overlay'
import Point from 'ol/geom/Point'
import $ from 'jquery'
import './Popup.styl'

class Popup extends Component {
  constructor (target) {
    super(target)
    this.el = $('<div id="popup-map"></div>')
    this.state = {
      overlay: null,
      infoStore: [],
      geomTypes: {
        linestrings: ['LineString', 'MultiLineString'],
        polygons: ['Polygon', 'MultiPolygon']
      },
      offset: 0
    }
    this.handlers = {
      clicked: e => {
        this.open(e)
      }
    }
    this.create()
    // store component so it can be disabled outside (by measure)
    setState('components/featureInfo', this)
  }
  render () {
    this.state.overlay = new Overlay({
      element: this.el[0],
      positioning: 'center-center',
      offset: [0, -this.state.offset]
    })
    const map = getState('map')
    if (map) {
      this.state.map = map
      this.init(map)
    } else {
      const que = getState('map/que')
      que.push(map => {
        this.state.map = map
        this.init(map)
      })
    }
  }
  init (map) {
    map.addOverlay(this.state.overlay)
    this.enable()
  }
  enable () {
    this.state.map.on('singleclick', this.handlers.clicked)
  }
  disable () {
    this.state.map.un('singleclick', this.handlers.clicked)
  }
  open (e) {
    let coord = e.coordinate
    const hit = this.state.map.forEachFeatureAtPixel(
      e.pixel,
      (feature, layer) => {
        if (layer) {
          return [layer, feature]
        }
      }
    )
    this.el.popover('dispose')
    if (hit) {
      // if point, then geometry coords
      if (hit[1].getGeometry().getType() === 'Point') {
        coord = hit[1].getGeometry().getCoordinates()
      }
      let popContent
      if (hit[0] && this.state.infoStore[hit[0].get('id')]) {
        popContent = this.state.infoStore[hit[0].get('id')](hit[1])
      } else {
        popContent = this.getContent(hit[1], hit[0])
      }
      this.state.overlay.setPosition(coord)
      this.el.popover(popContent.definition).popover('show')
      // when popover's content is shown
      this.el.on('shown.bs.popover', evt => {
        const h = popContent.definition.container.find('.popup').height()
        this.state.overlay.setOffset([
          0,
          h + this.state.offset + 20 > e.pixel[1] ? this.state.offset : -this.state.offset
        ])
        popContent.onShow(hit, $(evt.target).data('bs.popover').tip)
      })
      // when popover's content is hidden
      this.el.on('hidden.bs.popover', evt => {
        popContent.onHide(evt)
      })
      this.el.popover('show')
    }
  }
  getContent (feature, layer) {
    if (feature && layer) {
      const props = feature.getProperties()
      const geotrip = getState('geocache/trip')
      let title, content
      if (layer.get('_featureInfo')) {
        const info = layer.get('_featureInfo')
        title = typeof info.title === 'function' ? info.title(feature) : info.title
        content = typeof info.content === 'function' ? info.content(feature) : info.content
      } else {
        title = `
          <i class="fa fa-map-marker-alt"></i>
          ${t('Feature')}
          <a href="#" class="tools remove-marker float-right" title="Eemalda">
            <i class="far fa-trash-alt"></i>
          </a>
          ${feature.getGeometry() instanceof Point ? `
            <a href="#" class="tools cache-toggle float-right" data-id="${feature.get('id')}" title="${t('Add to geotrip')}">
              <i class="fas ${(geotrip && geotrip.getArray().indexOf(feature) > -1) ? 'fa-minus-square' : 'fa-thumbtack'}"></i>
            </a>
          ` : ''}`
        content = Object.keys(props).filter(key => {
          return (typeof props[key] === 'string' || typeof props[key] === 'number' || typeof props[key] === 'boolean')
        }).map(key => {
          return `${key}: ${makeLink(props[key])}`
        })
        if (this.state.geomTypes.linestrings.indexOf(feature.getGeometry().getType()) > -1) {
          content.push(`${t('Length')}: ${formatLength(feature.getGeometry())}`)
        }
        if (this.state.geomTypes.polygons.indexOf(feature.getGeometry().getType()) > -1) {
          content.push(`${t('Area')}: ${formatArea(feature.getGeometry())}`)
        }
        content = content.join('<br>')
      }
      return {
        definition: {
          container: this.el,
          placement: 'top',
          animation: false,
          html: true,
          title: title,
          content: content,
          template: `
            <div class="popup popover">
              <div class="arrow"></div>
              <h3 class="popover-header"></h3>
              <div class="popover-body"></div>
            </div>`
        },
        'onShow': (f, pop) => {
          const geotrip = getState('geocache/trip')
          $(pop).on('contextmenu', e => {
            e.stopPropagation()
          })
          $(pop).on('click', '.remove-marker', e => {
            e.preventDefault()
            if (f[0]) {
              f[0].getSource().removeFeature(f[1])
              if (geotrip) {
                geotrip.remove(f[1])
              }
              this.el.popover('dispose')
            }
          })
          $(pop).on('click', '.cache-toggle', e => {
            e.preventDefault()
            $(e.currentTarget).find('i').toggleClass('fa-thumbtack fa-minus-square')
            if (geotrip) {
              if (geotrip.getArray().indexOf(f[1]) > -1) {
                geotrip.remove(f[1])
              } else {
                geotrip.push(f[1])
              }
            }
          })
          // call stored onShow
          if (f[0].get('_featureInfo') && typeof f[0].get('_featureInfo').onShow === 'function') {
            f[0].get('_featureInfo').onShow(f, pop)
          }
        },
        'onHide' : function () {}
      }
    }
  }
}

export default Popup
