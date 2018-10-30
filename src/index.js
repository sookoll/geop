import {initServiceWorker} from 'Utilities/util'
import Geop from 'Geop/Geop'
import './app.styl'

initServiceWorker();
(() => new Geop())()
