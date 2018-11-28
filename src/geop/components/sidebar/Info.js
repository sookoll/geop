import { getState } from 'Utilities/store'
import Component from 'Geop/Component'
import $ from 'jquery'
import './Info.styl'

class Info extends Component {
  constructor (target) {
    super(target)
    this.id = 'info-tab'
    this.icon = 'fa fa-info-circle'
    this.el = $(`
      <div
        class="tab-pane fade ${this.id === getState('app/sideBarTab') ? 'show active' : ''}"
        id="${this.id}"
        role="tabpanel">
      </div>
    `)
    this.create()
  }
  create () {
    if (this.target && this.el) {
      this.target.append(this.el)
      this.render()
    }
  }
  render () {
    this.el.html(`
      <h5>
        Geop
        <i class="text-muted small">v1.0.0</i>
        <span class="attribution small">
          <a href="http://openstreetmap.org" >OSM</a> |
          <a href="http://www.maaamet.ee" >maa-amet</a> |
          <a href="http://sookoll.ee" >oo</a>
        </span>
      </h5>
      <ul>
        <li>Lisa aarded kaardile. Filtreeri aardeid oleku ja tüübi järgi.</li>
        <li>Otsi aardeid, aadresse ja koordinaate.</li>
        <li>OSM kaartide kasutamine on taotluslik, lisatud on Maa-ameti foto ja põhikaart.</li>
        <li>Kui näed kaardil viga, paranda see ära!</li>
        <li>Võimalus lisada kaardile WMS-kihte.</li>
        <li>Vaata aardeümbrust Google Streetviw abil, mille leiad parema kliki menüüst.</li>
        <li>Lisa aardeid oma geotuurile, järjesta aardeid ja salvesta tuur gpx-failina.</li>
        <li>Jaga geotuuri kaaslastega.</li>
        <li>Pärast aardejahti tiri (drag'n'drop) gepsulogi kaardile, on mugav jälge mööda aardeid logida.</li>
        <li>Tegu on HTML-rakendusega, sinu arvutist välja andmeid ei liigu.</li>
      </ul>
      <h5>Koordinaatide otsing</h5>
      <ul>
        <li>WGS'84: lat, lon; kk.nnnn; kk° mm.nnn; kk° mm' ss''</li>
        <li>L-EST'97: x, y; y, x</li>
        <li>UTM zone 34N: x, y; y, x</li>
        <li>UTM zone 35N: x, y; y, x</li>
      </ul>
    `)
  }
}

export default Info
