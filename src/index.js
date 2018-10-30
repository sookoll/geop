import {initServiceWorker} from 'Utilities/util'
import 'bootstrap/dist/css/bootstrap.css'
import Geop from 'Geop/Geop'
import './app.styl'

initServiceWorker();
(() => new Geop())()
