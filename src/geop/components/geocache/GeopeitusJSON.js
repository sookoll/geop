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
      // id
      // type
      feature.set('type', opts.mapping.type[feature.get('type')] || feature.get('type'))
      feature.set('isCache', feature.get('type').substring(0, 8) === 'Geocache')
      // fstatus
      feature.set('fstatus', opts.mapping.fstatusJSON[feature.get('fstatus')] || feature.get('fstatus'))
      // status ? currently not available
      // time
      feature.set('time', feature.get('date_hidden'))
      feature.unset('date_hidden')
      // name
      // url
      feature.set('url', opts.url + feature.get('id'))
      // owner
      feature.set('owner', feature.get('user_id'))
      feature.unset('user_id')
      // container
      feature.set('container', opts.mapping.container[feature.get('size')] || feature.get('size'))
      feature.unset('size')
      // difficulty
      // terrain
      // new cache
      const date = new Date(feature.get('date_hidden'))
      const testDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() + opts.newCacheDays
      )
      const newCache = (feature.get('fstatus') === 'Not Found' && testDate > today) ? 'New Cache' : null
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
