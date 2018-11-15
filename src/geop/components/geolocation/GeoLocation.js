import Component from 'Geop/Component'
import {getState} from 'Utilities/store'
import {t} from 'Utilities/translate'
import $ from 'jquery'
import './GeoLocation.styl'

class GeoLocation extends Component {
  constructor (target) {
    super(target)
    this.el = $(`
      <button id="geolocation" class="btn btn-link" title="${t('My location')}">
        <i class="fa fa-location-arrow"></i>
      </button>
    `)
    this.state = {
      active: 0,
      status: ['', 'active', 'tracking']
    }
    if (this.test()) {
      this.create()
    }
  }
  render () {
    this.el.on('click', e => {
      getState('map')
      this.state.active = (this.state.active + 1 >= this.state.status.length) ?
        0 : this.state.active + 1
      if (this.state.active === 0) {
          //this.disable()
          $(e.currentTarget).removeClass(this.state.status.join(' '))
      } else {
          //this.enable()
          $(e.currentTarget).addClass(this.state.status[this.state.active])
      }
    })
  }
  test () {
    return !!navigator.geolocation
  }

  enable () {
    if (this.state.status[this.state.active] === 'active') {
      var overlay = this._mapmodule.get('overlay');
      overlay.getSource().clear();
      overlay.getSource().addFeatures([this._features.accuracy]);
      this._map.addOverlay(this._features.position);
      this._locator.setTracking(true);
      //$('#statusbar .mouse-position a.lock').trigger('click');
      this._view.on('change:rotation', this.rotateMarker, this);
    } else if (this._trackingStatus[this._currentStatus] === 'tracking') {
      this._view.un('change:rotation', this.rotateMarker, this);
      this._markerEl.css({
          "-webkit-transform": "rotate(0rad)",
          "-moz-transform": "rotate(0rad)",
          "transform": "rotate(0rad)"
      });
      this._map.on('pointerdrag', this.disableTracking, this);
      this._map.on('postcompose', this.updateView, this);
      this._map.render();
    }
  }

}

export default GeoLocation
