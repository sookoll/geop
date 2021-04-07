import { createApp } from 'vue'
import Geop from './Geop.vue'
import './registerServiceWorker'
import { initPermalink } from '@/services/permalink.service'
import { initDB, initDBState } from '@/services/store'

initDB()
  .then(() => initDBState())
  .then(() => {
    // permalink
    if ('onhashchange' in window) {
      initPermalink()
    }
    createApp(Geop).mount('#geop')
  })
