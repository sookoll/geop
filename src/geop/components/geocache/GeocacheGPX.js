export default {
  test: features => {
    return features.filter(f => {
      return (f.get('wpt') && f.get('wpt')['groundspeak:cache'])
    }).length > 0
  },
  formatFeatures: opts => {
    const today = new Date()
    opts.features.forEach(feature => {
      const wpt = feature.get('wpt')
      // format always
      if (feature.get('isCache')) {
        if (opts.user && opts.user === feature.get('owner')) {
          const fstatus = 'Geocache Owner'
          feature.set('fstatus', opts.mapping.fstatusGPX[fstatus] || fstatus)
        }
      }
      if (typeof feature.get('isCache') === 'undefined' && wpt['groundspeak:cache']) {
        const cacheData = {}
        Object.keys(wpt['groundspeak:cache']).forEach(i => {
          if (i !== '_text') {
            cacheData[i.replace('groundspeak:', '')] = wpt['groundspeak:cache'][i]._text
              ? wpt['groundspeak:cache'][i]._text : wpt['groundspeak:cache'][i]
          }
        })
        // id
        feature.set('id', cacheData['@id'])
        // type
        const type = feature.get('type')
        feature.set('isCache', type.substring(0, 8) === 'Geocache')
        // CHALLENGE cache type
        if (
          type === 'Geocache|Unknown Cache' &&
          cacheData.name &&
          cacheData.name.toLowerCase().includes('challenge')
        ) {
          feature.set('type', 'Geocache|Unknown Cache|Challenge')
        }
        // fstatus
        let fstatus = feature.get('sym')
        if (opts.user && opts.user === cacheData.owner) {
          fstatus = 'Geocache Owner'
        }
        feature.set('fstatus', opts.mapping.fstatusGPX[fstatus] || fstatus)
        // status
        let status = cacheData['@available'] && cacheData['@available'].toLowerCase() === 'true'
          ? 'Available' : 'Unavailable'
        if (cacheData['@archived'] && cacheData['@archived'].toLowerCase() === 'true') {
          status = 'Archived'
        }
        feature.set('status', status)
        // time
        feature.set('time', wpt.time._text)
        // name
        feature.set('name', cacheData.name)
        // url
        feature.set('url', wpt.url._text)
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
        // description
        if (cacheData.long_description) {
          feature.set('description', cacheData.long_description)
        }
        if (cacheData.logs && cacheData.logs['groundspeak:log']) {
          // in case of one log, it is object, not array
          if (typeof cacheData.logs['groundspeak:log'] === 'object' && '@id' in cacheData.logs['groundspeak:log']) {
            cacheData.logs['groundspeak:log'] = [cacheData.logs['groundspeak:log']]
          }
          feature.set('logs', cacheData.logs['groundspeak:log'].map(log => {
            return {
              type: log['groundspeak:type']._text,
              date: log['groundspeak:date']._text,
              finder: log['groundspeak:finder']._text,
              text: log['groundspeak:text']._text
            }
          }))
        }
        feature.set('wpt', {
          'groundspeak:cache': true
        })
      }
      if (typeof feature.get('isCachePoint') === 'undefined' && !wpt['groundspeak:cache']) {
        // assume waypoint
        // name
        feature.set('name', feature.get('type'))
        // url
        feature.set('url', wpt.url._text)
        feature.set('isCachePoint', true)
      }
      if (!feature.getId()) {
        feature.setId(opts.uid())
      }
    })
  }
}
