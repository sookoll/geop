import $ from 'Utilities/dom'

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
      const content = this.$.create(feature.get('content'))
      const icon = feature.get('icon')
      const info = content[2].textContent.split(' / ').map(i => i.trim())
      const name = content[0].textContent

      feature.set('isCache', true)
      let type = 'Geocache|' + info[0]
      // CHALLENGE cache type
      if (type === 'Geocache|Unknown Cache' && name && name.toLowerCase().includes('challenge')) {
        type = 'Geocache|Unknown Cache|Challenge'
      }
      // type
      feature.set('type', type)

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
      const url = $(content[0]).attr('href')
      // id
      feature.set('id', url ? url.split('/').pop() : null)
      // name
      feature.set('name', name)
      // url
      feature.set('url', url)
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
