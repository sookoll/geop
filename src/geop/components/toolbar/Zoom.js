import { getState } from 'Utilities/store'
import { t } from 'Utilities/translate'
import Component from 'Geop/Component'

class Zoom extends Component {
  create () {
    this.elPlus = this.$.create(`
      <button class="btn btn-link" title="${t('Zoom in')}"><i class="fa fa-plus"></i></button>
    `)
    this.elMinus = this.$.create(`
      <button class="btn btn-link" title="${t('Zoom out')}"><i class="fa fa-minus"></i></button>
    `)
  }

  render () {
    if (this.target && this.elPlus) {
      this.$.append(this.target, this.elPlus)
      this.$.on('click', this.elPlus, e => {
        const view = getState('map').getView()
        const zoom = view.getZoom() + 1
        this.zoomTo(view, zoom)
      })
    }
    if (this.target && this.elMinus) {
      this.$.append(this.target, this.elMinus)
      this.$.on('click', this.elMinus, e => {
        const view = getState('map').getView()
        const zoom = view.getZoom() - 1
        this.zoomTo(view, zoom)
      })
    }
  }

  zoomTo (view, zoom) {
    view.animate({
      zoom: zoom,
      duration: 250,
      anchor: getState('map/anchor') && getState('map/anchor').getCoordinates()
    })
  }
}

export default Zoom
