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
        // status
        // name
        // url
        // owner
        // fstatus
        let fstatus = feature.get('sym')
        if (opts.user && opts.user === wpt['groundspeak:cache']['groundspeak:owner']['#text']) {
          fstatus = 'Geocache Owner'
        }
        feature.set('fstatus', fstatus)
        feature.unset('sym')
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
      }
      // id
      if (!feature.getId()) {
        feature.setId(opts.uid())
      }
    })
  }
}
