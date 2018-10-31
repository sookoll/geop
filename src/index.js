import 'bootstrap/dist/css/bootstrap.css'
import '@fortawesome/fontawesome-free/css/all.css'
import './app.styl'
import {initServiceWorker} from 'Utilities/util'
import Geop from 'Geop/Geop'
//TODO: put into statusbar
import 'Components/statusbar/StatusBar.styl'
import 'Components/toolbar/ToolBar.styl'

initServiceWorker();
(() => new Geop())()
