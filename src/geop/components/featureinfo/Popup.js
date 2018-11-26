import Component from 'Geop/Component'
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
    this.el.popover('destroy')
    if (feature) {
      // if point, then geometry coords
      if (feature[1].getGeometry().getType() === 'Point') {
        coord = feature[1].getGeometry().getCoordinates()
      }
      if (feature[0] && this.state.infoStore[feature[0].get('id')]) {
          pop_content = this.state.infoStore[feature[0].get('id')](feature[1])
      } else {
          pop_content = this.getContent(feature[1], feature[0])
      }
      this.state.overlay.setPosition(coord)
      this.el.popover(pop_content.definition).popover('show')
      // when popover's content is shown
      this.el.on('shown.bs.popover', e => {
        pop_content.onShow(feature, e)
      })
      // when popover's content is hidden
      this.el.on('hidden.bs.popover', e => {
        pop_content.onHide(e)
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
      var title = this._tmpl_featureinfo_title({
        'type_class': 'fa fa-map-marker',
        'text': 'Kaardiobjekt',
        'trash': '<a href="#" class="remove-marker" title="Eemalda"><i class="fa fa-trash"></i></a>',
        'icon': (in_collection > -1) ? 'fa-minus-square' : 'fa-thumb-tack'
      });
      var geotrip = t._app.geocache.get('geotrip');
      return {
        'definition' : {
          'placement': 'top',
          'animation': false,
          'html': true,
          'title': title,
          'content': '<div class="small">' + content.join('<br>') + '</div>'
        },
        'onShow' : function (f, e) {
          $(e.currentTarget.nextSibling).on('click', '.remove-marker', function (e) {
            e.preventDefault();
            if (f[0]) {
              f[0].getSource().removeFeature(f[1]);
              geotrip.remove(f[1]);
              t._popup.popover('destroy');
            }
          });
          $('a.cache-toggle').on('click', function (e) {
            e.preventDefault();
            $(this).find('i').toggleClass('fa-thumb-tack fa-minus-square');
            if ($.inArray(f[1], geotrip.getArray()) > -1) {
              geotrip.remove(f[1]);
            } else {
              geotrip.push(f[1]);
            }
          });
        },
        'onHide' : function () {}
      };
    }
  }
}

export default Popup
