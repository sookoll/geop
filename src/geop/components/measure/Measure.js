import {getState} from 'Utilities/store'
import {t} from 'Utilities/translate'
import Component from 'Geop/Component'

class Measure extends Component {
  constructor (target) {
    super(target)
    this.state = {
      measureType: null,
      snapFeatures: null,
    }
    // set contextmenu
    const contextMenuItems = getState('map/contextmenu')
    contextMenuItems.push({
      content: `<i class="fa fa-ruler-combined"></i> ${t('Measure')}
        <button class="btn btn-link context-item-btn"><i class="far fa-dot-circle"></i></button>`,
      onClick: (e, coord) => {
        this.init(coord)
      },
      onBtnClick: (e, coord) => {
        this.init(coord, 'circle')
      },
      closeOnClick: true
    })

  }
  init (coord, type = 'distance') {
    console.log(coord, type)
    this.state.measureType = type
  }
  reset () {

  }
}

export default Measure
