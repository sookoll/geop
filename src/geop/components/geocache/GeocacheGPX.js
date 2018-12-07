export default {
  test: feature => {
    return (feature.get('wpt') && feature.get('wpt')['groundspeak:cache'])
  },
  formatFeatures: opts => {

    const today = new Date()
    opts.features.forEach(feature => {
      const wpt = feature.get('wpt')
      feature.unset('wpt')
      if (wpt['groundspeak:cache']) {
        const cacheData = {}
        Object.keys(wpt['groundspeak:cache']).forEach(i => {
          if (i === '@attributes') {
            cacheData[i] = wpt['groundspeak:cache'][i]
          } else if (i !== '#text') {
            cacheData[i.replace('groundspeak:', '')] = wpt['groundspeak:cache'][i]['#text']
          }
        })
        // id
        // type
        feature.set('id', cacheData['@attributes'].id)
        // fstatus
        let fstatus = feature.get('sym')
        if (opts.user && opts.user === cacheData.owner) {
          fstatus = 'Geocache Owner'
        }
        feature.set('fstatus', opts.mapping.fstatusGPX[fstatus] || fstatus)
        feature.unset('sym')
        // status
        feature.set('unavailable', cacheData['@attributes'].available === 'False' ? '1' : '0')
        feature.set('archived', cacheData['@attributes'].archived === 'True' ? '1' : '0')
        // time
        feature.set('time', wpt.time['#text'])
        // name
        feature.set('name', cacheData.name)
        // url
        feature.set('url', wpt.url['#text'])
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
        const newCache = (feature.get('fstatus') === 'Geocache' && testDate > today) ? 'yes' : 'no'
        if (!feature.get('newCache')) {
          feature.set('newCache', newCache)
        }
      } else {
        // assume waypoint
        // name
        feature.set('name', feature.get('type'))
        // url
        feature.set('url', wpt.url['#text'])
      }
      // id
      if (!feature.getId()) {
        feature.setId(opts.uid())
      }
    })
  }
}
