import {initServiceWorker} from 'Utilities/util'
import 'bootstrap/dist/css/bootstrap.css'
import '@fortawesome/fontawesome-free/css/all.css'
import Geop from 'Geop/Geop'
import './app.styl'
//TODO: put into statusbar
import 'Components/statusbar/StatusBar.styl'
import 'Components/toolbar/ToolBar.styl'

initServiceWorker();
(() => new Geop())()
