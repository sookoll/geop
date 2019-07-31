import $ from 'jquery'

export default {
  test: features => {
    const test = features.filter(f => {
      return (
        f.get('pgc') &&
        f.get('content') &&
        f.get('icon')
      )
    })
    return test.length > 0
  },
  formatFeatures: opts => {
    opts.features.forEach(feature => {
      const content = $(feature.get('content'))
      const icon = feature.get('icon')
      const info = $(content[2]).text().split(' / ').map(i => i.trim())
      // id
      feature.set('isCache', true)
      // type
      feature.set('type', 'Geocache|' + info[0])
      // owner
      feature.set('owner', '')
      // fstatus
      let fstatus = icon.endsWith('&isFound') ? '1' : '0'
      if (icon.endsWith('&isOwned') && opts.user) {
        fstatus = '2'
        feature.set('owner', opts.user)
      }
      feature.set('fstatus', opts.mapping.fstatusJSON[fstatus] || fstatus)
      // status
      const status = icon.endsWith('&fade') ? 'Unavailable' : 'Available'
      feature.set('status', status)
      // name
      feature.set('name', $(content[0]).text())
      // url
      feature.set('url', $(content[0]).attr('href'))
      // container
      feature.set('container', info[1])
      // difficulty
      feature.set('difficulty', info[2])
      // terrain
      feature.set('terrain', info[3])
      // time
      feature.set('time', null)
      // id
      if (!feature.getId()) {
        feature.setId(opts.uid())
      }
    })
  }
}
