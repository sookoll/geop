import Component from 'Geop/Component'
import {t} from 'Utilities/translate'
import {getState} from 'Utilities/store'
import Overlay from 'ol/Overlay'
import $ from 'jquery'
import './Popup.styl'

class Popup extends Component {
  constructor (target) {
    super(target)
    this.el = $('<div id="popup-map"></div>')
    this.state = {
      overlay: null,
      infoStore: []
    }
    this.handlers = {
      clicked: e => {
        this.open(e)
      }
    }
    this.create()
  }
  render () {
    this.state.overlay = new Overlay({
      element: this.el[0],
      autoPan: true,
      positioning: 'center-center',
      offset: [0, -16]
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
    this.enableClick()
  }
  enableClick () {
    this.state.map.on('click', this.handlers.clicked)
  }
  disableClick () {
    this.state.map.un('click', this.handlers.clicked)
  }
  open (e) {
    let coord = e.coordinate
    const feature = this.state.map.forEachFeatureAtPixel(
      e.pixel,
      (feature, layer) => {
        if (layer) {
          return [layer, feature]
        }
      }
    )
    this.el.popover('dispose')
    if (feature) {
      // if point, then geometry coords
      if (feature[1].getGeometry().getType() === 'Point') {
        coord = feature[1].getGeometry().getCoordinates()
      }
      let popContent
      if (feature[0] && this.state.infoStore[feature[0].get('id')]) {
          popContent = this.state.infoStore[feature[0].get('id')](feature[1])
      } else {
          popContent = this.getContent(feature[1], feature[0])
      }
      this.state.overlay.setPosition(coord)
      this.el.popover(popContent.definition).popover('show')
      // when popover's content is shown
      this.el.on('shown.bs.popover', e => {
        popContent.onShow(feature, $(e.target).data('bs.popover').tip)
      })
      // when popover's content is hidden
      this.el.on('hidden.bs.popover', e => {
        popContent.onHide(e)
      })
      this.el.popover('show')
    }
  }
  getContent (feature, layer) {
    if (feature) {
      const props = feature.getProperties()
      const content = Object.keys(props).filter(key => {
        return (typeof props[key] === 'string' || typeof props[key] === 'number')
      }).map(key => {
        return `${key}: ${props[key]}`
      })
      //TODO:
      //var in_collection = $.inArray(feature, this._app.geocache.get('geotrip').getArray());
      const title = `
        <i class="fa fa-map-marker-alt"></i>
        ${t('Feature')}
        <a href="#" class="cache-toggle" data-id="${feature.get('id')}" title="${t('Add to geotrip')}">
          <i class="fa fa-thumbtack"></i>
        </a>
        <a href="#" class="remove-marker" title="Eemalda">
          <i class="far fa-trash-alt"></i>
        </a>`

      //var geotrip = t._app.geocache.get('geotrip');
      return {
        definition: {
          placement: 'top',
          animation: false,
          html: true,
          title: title,
          content: content.join('<br>'),
          template: '<div class="popup popover"><div class="arrow"></div><h3 class="popover-header"></h3><div class="popover-body"></div></div>'
        },
        'onShow': (f, pop) => {
          $(pop).on('click', '.remove-marker', e => {
            e.preventDefault()
            if (f[0]) {
              f[0].getSource().removeFeature(f[1])
              //geotrip.remove(f[1]);
              this.el.popover('dispose')
            }
          })
          $(pop).on('click', '.cache-toggle', e => {
            e.preventDefault()
            $(e.currentTarget).find('i').toggleClass('fa-thumbtack fa-minus-square')
            /*if ($.inArray(f[1], geotrip.getArray()) > -1) {
              geotrip.remove(f[1]);
            } else {
              geotrip.push(f[1]);
            }*/
          })
        },
        'onHide' : function () {}
      }
    }
  }
}

export default Popup
