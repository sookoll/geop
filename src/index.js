import {app as appConf} from 'Conf/settings'
import 'bootstrap/dist/css/bootstrap.css'
import '@fortawesome/fontawesome-free/css/all.css'
import './app.styl'
import 'bootstrap/js/dist/dropdown'
import 'bootstrap/js/dist/modal'
import 'bootstrap/js/dist/tab'
import 'bootstrap/js/dist/button'
import 'bootstrap/js/dist/popover'
import {initServiceWorker, initDebug} from 'Utilities/util'
import Geop from 'Geop/Geop'
import $ from 'jquery'

if (appConf.debug) {
  initDebug()
}
initServiceWorker()
const app = new Geop($('#geop'))
app.init()
