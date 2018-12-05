import { getState } from 'Utilities/store'
import { t } from 'Utilities/translate'
import Component from 'Geop/Component'
import $ from 'jquery'

class Zoom extends Component {
  constructor (target) {
    super(target)
    this.elPlus = $(`
      <button class="btn btn-link" title="${t('Zoom in')}"><i class="fa fa-plus"></i></button>
    `)
    this.elMinus = $(`
      <button class="btn btn-link" title="${t('Zoom out')}"><i class="fa fa-minus"></i></button>
    `)
    this.create()
  }
  create () {
    if (this.target && this.elPlus) {
      this.target.append(this.elPlus)
      this.elPlus.on('click', e => {
        const view = getState('map').getView()
        const zoom = view.getZoom() + 1
        this.zoomTo(view, zoom)
      })
    }
    if (this.target && this.elMinus) {
      this.target.append(this.elMinus)
      this.elMinus.on('click', e => {
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
