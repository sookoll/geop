export default {
  test: features => {
    const test = features.filter(f => {
      return (f.get('wpt') && f.get('wpt')['cache'] && f.get('wpt')['cache']['__prefix'] === 'groundspeak')
    })
    return test.length > 0
  },
  formatFeatures: opts => {
    const today = new Date()
    opts.features.forEach(feature => {
      const wpt = feature.get('wpt')
      if (wpt && wpt['cache']) {
        const cacheData = {}
        Object.keys(wpt['cache']).forEach(i => {
          if (!i.startsWith('__')) {
            cacheData[i] = wpt['cache'][i]['__text']
              ? wpt['cache'][i]['__text'] : wpt['cache'][i]
          }
        })
        // id
        feature.set('id', cacheData['@id'])
        // type
        feature.set('isCache', feature.get('type').substring(0, 8) === 'Geocache')
        // fstatus
        let fstatus = feature.get('sym')
        if (opts.user && opts.user === cacheData.owner) {
          fstatus = 'Geocache Owner'
        }
        feature.set('fstatus', opts.mapping.fstatusGPX[fstatus] || fstatus)
        feature.unset('sym')
        // status
        let status = cacheData['@available'] === 'True' ? 'Available' : 'Unavailable'
        if (cacheData['@archived'] === 'True') {
          status = 'Archived'
        }
        feature.set('status', status)
        // time
        feature.set('time', wpt.time)
        // name
        feature.set('name', cacheData.name)
        // url
        feature.set('url', wpt.url)
        // owner
        feature.set('owner', cacheData.owner)
        // container
        feature.set('container', cacheData.container)
        // difficulty
        feature.set('difficulty', cacheData.difficulty)
        // terrain
        feature.set('terrain', cacheData.terrain)
        // new cache
        const date = new Date(feature.get('time'))
        const testDate = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate() + opts.newCacheDays
        )
        const newCache = (feature.get('fstatus') === 'Not Found' && testDate > today) ? 'New Cache' : null
        feature.set('newCache', newCache)
      } else if (wpt) {
        // assume waypoint or route
        // name
        feature.set('name', feature.get('type'))
        // url
        feature.set('url', wpt.url)
      }
      if (!feature.getId()) {
        feature.setId(opts.uid())
      }
    })
  }
}
