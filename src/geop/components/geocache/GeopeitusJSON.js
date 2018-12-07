export default {
  test: feature => {
    return (
      feature.get('fstatus') &&
      typeof feature.get('type') !== 'undefined' &&
      feature.get('date_hidden')
    )
  },
  formatFeatures: opts => {
    const today = new Date()
    opts.features.forEach(feature => {
      // fstatus
      feature.set('fstatus', opts.mapping.fstatus[feature.get('fstatus')])
      // time
      feature.set('time', feature.get('date_hidden'))
      feature.unset('date_hidden')
      // type
      feature.set('type', opts.mapping.type[feature.get('type')])
      // new cache
      const date = new Date(feature.get('date_hidden'))
      const testDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() + opts.newCacheDays
      )
      const newCache = (feature.get('fstatus') === 'Geocache' && testDate > today) ? 'yes' : 'no'
      if (!feature.get('newCache')) {
        feature.set('newCache', newCache)
      }
      // id
      if (!feature.getId()) {
        feature.setId(opts.uid())
      }
    })
  }
}
