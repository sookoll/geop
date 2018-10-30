import Base from 'Geop/Base'
import {app as appConf} from 'Conf/settings'
import Store from 'Utilities/Store'
import Permalink from 'Utilities/Permalink'
import MapEngine from 'Components/MapEngine'

class Geop extends Base {
  constructor () {
    super()
    this.conf = appConf
    this.store = new Store()
    if ('onhashchange' in window) {
      this.permalink = new Permalink()
    }
    this.components = {
      map: new MapEngine(this)
    }
  }
}

export default Geop
