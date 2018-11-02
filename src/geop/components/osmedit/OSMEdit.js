import {app as appConf} from 'Conf/settings'
import Component from 'Geop/Component'
import './OSMEdit.styl'

class OSMEdit extends Component {
  constructor (target) {
    super(target)
    // set locale
    initLocale(appConf.locale, translations)

    if ('onhashchange' in window) {
      activatePermalink()
    }
    this.components = {
      map: new MapEngine(this.target),
      toolbar: new ToolBar(this.target)
    }
  }

  render () {
    target.append('<a href="#" id="osm-edit"><i class="fa fa-pencil"></i></a>')
    target.on('click', 'a#osm-edit', e => {
      e.preventDefault()
      const center = mapmodule.transform('point', mapmodule.get('map').getView().getCenter(), 'EPSG:3857', 'EPSG:4326')
      const zoom = mapmodule.get('map').getView().getZoom()
      window.open(href + zoom + '/' + center[1] + '/' + center[0]);
    });
  }

  init() {
    this.render()
  }

}

export default OSMEdit
