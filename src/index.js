import 'bootstrap/dist/css/bootstrap.css'
import '@fortawesome/fontawesome-free/css/all.css'
import './app.styl'
import 'bootstrap/js/dist/dropdown'
import 'bootstrap/js/dist/modal'
import 'bootstrap/js/dist/tab'
import {initServiceWorker} from 'Utilities/util'
import Geop from 'Geop/Geop'
import $ from 'jquery'

initServiceWorker();
const app = new Geop($('#geop'))
app.init()
