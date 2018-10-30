import Base from 'Geop/Base'
import Store from 'Utilities/Store'
import Permalink from 'Utilities/Permalink'
import MapEngine from 'Components/MapEngine'

class Geop extends Base {
  constructor () {
    super(Store)
    if ('onhashchange' in window) {
      this.permalink = new Permalink()
    }
    this.components = {
      map: new MapEngine(this)
    }
    this.initComponents()
  }

  initComponents () {
    super.initComponents(this.components)
  }
}

export default Geop
