import Component from 'Geop/Component'
import { getState, setState } from 'Utilities/store'
import { t } from 'Utilities/translate'
import { scaleFactor } from 'Utilities/util'
import log from 'Utilities/log'
import { createLayer } from 'Components/layer/LayerCreator'
import { createStyle } from 'Components/layer/StyleBuilder'
import Point from 'ol/geom/Point'
import Circle from 'ol/geom/Circle'
import LineString from 'ol/geom/LineString'
import Feature from 'ol/Feature'
import Geolocation from 'ol/Geolocation'
import { toLonLat } from 'ol/proj'
import $ from 'jquery'
import './GeoLocation.styl'

class GeoLocation extends Component {
  constructor (target) {
    super(target)
    this.el = $(`
      <button id="geolocation" class="btn btn-link" disabled title="${t('My location')}">
        <i class="fa fa-location-arrow"></i>
      </button>
    `)
    this.state = {
      active: 0,
      status: ['', 'active', 'tracking'],
      track: new Feature(new LineString([])),
      position: new Feature({
        id: 'position',
        radius: 0,
        geometry: new Point([])
      }),
      zoom: 16,
      layer: this.createLayer(),
      locator: new Geolocation({
        projection: getState('map/projection'),
        trackingOptions: {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 300000
        }
      }),
      isFirst: false,
      lastPosition: null,
      lastHeading: null
    }
    this.handlers = {
      updateView: e => {
        this.updateView(e)
      },
      disableTracking: e => {
        this.disableTracking()
      }
    }
    if (this.test()) {
      window.geopLocator = this.state.locator
      this.create()
      this.init()
    }
  }
  render () {
    this.el.prop('disabled', false)
    this.el.on('click', e => {
      this.state.active = (this.state.active + 1 >= this.state.status.length) ?
        0 : this.state.active + 1
      if (this.state.active === 0) {
        this.disable()
        $(e.currentTarget).removeClass(this.state.status.join(' '))
      } else {
        this.enable()
        $(e.currentTarget).addClass(this.state.status[this.state.active])
      }
    })
  }
  test () {
    return !!navigator.geolocation
  }
  init () {
    this.state.layer.getSource().addFeatures([
      this.state.track,
      this.state.position
    ])
    this.state.locator.on('change:position', e => {
      this.positionChanged(e)
    })
    this.state.locator.on('change:heading', e => {
      this.headingChanged(e)
    })
    this.state.locator.on('change:accuracy', e => {
      this.accuracyChanged(e)
    })
    this.state.locator.on('change:speed', e => {
      this.speedChanged(e)
    })
    this.state.locator.on('error', e => {
      console.error('geolocation error', e)
      this.disable()
      this.el.removeClass(this.state.status.join(' '))
      log('error', t('Unable to find location'))
    })
  }
  enable () {
    const map = getState('map')
    if (this.state.status[this.state.active] === 'tracking') {
      // set anchor for zoom tools
      setState('map/anchor', this.state.position.getGeometry())
      this.updateView()
      map.on('pointerdrag', this.handlers.disableTracking)
      map.render()
    } else {
      this.state.isFirst = true
      this.searchStart()
      this.state.layer.setMap(map)
      this.state.locator.setTracking(true)
    }
  }
  disable () {
    this.disableTracking()
    this.searchEnd()
    this.state.locator.setTracking(false)
    this.state.position.getGeometry().setCoordinates([])
    this.state.track.getGeometry().setCoordinates([])
    this.state.layer.setMap(null)
    this.state.lastPosition = null
    this.state.lastHeading = null
    this.state.active = this.state.status.indexOf('')
  }
  disableTracking () {
    const map = getState('map')
    map.un('pointerdrag', this.handlers.disableTracking)
    setState('map/anchor', null)
    this.el.removeClass(this.state.status[this.state.active])
    this.state.active = this.state.status.indexOf('active')
  }
  searchStart () {
    this.el.find('i')
      .removeClass('fa-location-arrow')
      .addClass('fa-spinner fa-pulse')
  }

  searchEnd () {
    this.el.find('i')
      .removeClass('fa-spinner fa-pulse')
      .addClass('fa-location-arrow')
  }
  positionChanged (e) {
    const coordinate = this.state.locator.getPosition()
    if (coordinate) {
      this.state.lastPosition = coordinate
      this.state.position.getGeometry().setCoordinates(coordinate)
      this.state.track.getGeometry().appendCoordinate(coordinate)
      // if first point
      if (this.state.isFirst === true) {
        const view = getState('map').getView()
        view.setCenter(coordinate)
        view.setZoom(this.state.zoom)
        this.state.isFirst = false
        this.searchEnd()
      }
    }
    this.updateView()
  }
  headingChanged (e) {
    const heading = this.state.locator.getHeading()
    if (typeof heading !== 'undefined') {
      this.state.lastHeading = heading
      this.state.position.set('heading', heading)
    }
    this.updateView()
  }
  accuracyChanged (e) {
    const radius = this.state.locator.getAccuracy()
    if (typeof radius !== 'undefined') {
      this.state.position.set('radius', radius)
    }
    this.updateView()
  }
  speedChanged (e) {
    const speed = this.state.locator.getSpeed() || 0
    this.state.position.set('speed', speed)
    this.updateView()
  }

  /**
   * recenters the view by putting the given coordinates
   * at 3/4 from the top or the screen
   */
  getCenterWithHeading (position, rotation, resolution) {
    const size = getState('map').getSize()
    return [
      position[0] - Math.sin(rotation) * size[1] * resolution * 1 / 4,
      position[1] + Math.cos(rotation) * size[1] * resolution * 1 / 4
    ]
  }
  updateView () {
    console.debug(`updateView: ${JSON.stringify(this.state.lastPosition)} ${this.state.lastHeading}`)
    if (this.state.status[this.state.active] === 'tracking') {
      const view = getState('map').getView()
      if (this.state.lastPosition && this.state.lastHeading) {
        view.setCenter(this.getCenterWithHeading(this.state.lastPosition, -this.state.lastHeading, view.getResolution()))
        view.setRotation(-this.state.lastHeading)
      } else if (this.state.lastPosition) {
        view.setCenter(this.getCenterWithHeading(this.state.lastPosition, view.getRotation(), view.getResolution()))
      } else {
        view.setRotation(-this.state.lastHeading)
      }
    }
  }
  createLayer () {
    const positionStyle = createStyle({
      icon: {
        src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAyCAMAAABvV9spAAAABGdBTUEAALGPC/xhBQAAACBjSFJN AAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAABUFBMVEUAAABpaWkAAAAAAAAA AAAAAAAAAABpaWkAAAAAAAAAAAAAAAAAAAA1NTUAAAAAAAAAAAAAAAAAAAAPDw+4uLje3t709PQP Dw8AAAAAAAAAAAAAAAAAAAAAAAB8fHzv7+98fHwAAAAAAAAAAADAwMD+/v4AAAAAAAAAAACJiYkA AAAmJiby8vLLy8vl5eUAAAD29vZWVlYAAAA5OTn+/v4AAADz8/MAAAAAAADh4eEAAAAAAAC7u7sA AADo6OgAAABbW1v6+voAAAAAAACdnZ339/c9PT3d3d0AAAAAAAAAAACRkZHHx8fh4eH09PQAAAAA AAAAAAAAAAD////6/f7g8Plqt+A0ndUHh8uZzuoNis0AhMqSyujb7vgKicxhs94pmNPy+fwChcr5 /P42ntV0vOLv9/sbkdC43fAEhsvN5/UsmdP5/P2i0uxsuOA5n9bwio4hAAAAU3RSTlMAIx0gEhQT JgIGMzpBTS0mAxYqQpTE6D8pGwQOGC5h3F0kDw2K+yUKI10fNeCTwxnrQRo6/iziFSe6ESF/K8gI RvIFC2XqO7MBBx5dk7ziEBcoCTVzjyoAAAABYktHRFN6Zx0GAAAACXBIWXMAAAFiAAABYgFfJ9BT AAAAB3RJTUUH4gwECRg4eAJxNwAAAYNJREFUOMvt0ls3AlEUwPFNEzO6mIkyU7nUSIN0pUE0zKCL W7VDhO6Rku//5iQ0H8BalrX8H85Z+/dwHvY6AP/9TGPjBsponJgcTjTQzOCeMpnNFovZZJ0eTAwN LGHONjNrdyA67LNzvECYBSe43PMLi4hYLJJjccnjBYIguvhlH15d35RKN9dX6FteMZJ3/EZp1Ye3 d+WP7m7Rt7pG+cElrAfwvvzdPQbWBRdQ0gY+PI748QE3JAo4PoiVsq4KBnkOQtYwVvVcxbA1BEIE a3U912sYESAa22yU9FxqbMai4N6KY1PPTYxvuUHe3sGWnlu4sy3DbmIP208jfWrjXmIXxNB+Ep87 X9p5xuR+SASFMhwc4kt3qN0XPDwwUAqomiwdHWPvtf/21n/t4fGRJGsq2bfISScp/Cx1InEi2Xea zYhylj89O7+4OD875bOymGHTQJzRLnNZT95my3uyuUuNGejAVUXzUjLHyZRXU9ShEqdZJ6MU/P6C wjhZOv3bv/Bv9Q7DpHOEPfXX5AAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAxOC0xMi0wNFQxNjoyNDo1 Ni0wNzowMAoLzxUAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMTgtMTItMDRUMTY6MjQ6NTYtMDc6MDB7 VnepAAAAAElFTkSuQmCC'
      }
    }, true)
    const trackingStyle = createStyle({
      icon: {
        rotation: 0,
        rotateWithView: true,
        src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAyCAMAAABvV9spAAAABGdBTUEAALGPC/xhBQAAACBjSFJN AAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAABxVBMVEUAAAAAAAAAAAAAAAAA AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADn5+fn5+cAAAAAAACioqIAAAAAAAAAAAAAAADt7u7m 8vkAAAAAAAAAAACxsbEAAAAcHBzz9PXT6vUAAAAAAADFxcUAAAAAAAAAAABGRkb4+fq63vEAAAAA AADX19f+//90dHT8/f3J5PMAAAAAAADo6Ojs7e2qqqr8/f3JyclRUVEAAADw8PLq6+tpaWkAAAAA AAAAAADx8fLMzMy9vb0AAAAAAAAAAAA1NTW6urrLy8sAAAAAAAAAAAAAAAAPDw+4uLje3t709PQA AAAAAAB8fHzv7+8AAADAwMD+/v4AAACJiYkAAAAmJiby8vLLy8sAAADl5eX29vZWVlYAAAA5OTn+ /v7z8/Ph4eG7u7sAAADo6OhbW1v6+vqdnZ339/c9PT3d3d2RkZHHx8fh4eH09PQAAAAAAAD///9h s94ChcpGptkAhMovm9Sf0essmdN8wOTA4PL6/f7g8Plqt+A0ndUHh8uZzuoNis2Syujb7vgKicwp mNPy+fz5/P42ntV0vOLv9/sbkdC43fAEhsvN5/X5/P2i0uxsuOA5n9YUwW0GAAAAdXRSTlMAAQID BAYICgsRFAwdop8TIF0HDxws1v0FFyd8Hzfp/RgplQkSIUL1/g0qqv5N/P4VJLzgV/ulW0XBzlxA Pj3EdHg5P0FNd3AOGSYzQpTE6B4uYdwtivsjXRs14JMWw+tBGjr+4rp/K8hG8mXqO7Ndk7ziEChI 22u6AAAAAWJLR0R1qGqY+wAAAAlwSFlzAAABYgAAAWIBXyfQUwAAAAd0SU1FB+IMBAUxJCFfS/cA AAJeSURBVDjL7ZPXUxpRFIfv7rIFMBFFdBc1srKoi22xx5ZEMQErsbCiYu+9HRDF2Huvf292QYTk Le/5Hu6d+ebMuWfO/C5CETAMJzQaAscwlAhGkBRNUySB/WUZrU6nZf7wGE7qdUkfPibp9CQe95iG TjakAKQYkmkNFm+RakwzpWdkpJvSjKnvbXCW4cyZEAhAppljWDxWTGmzsj/lBIM5n7KztNRbOc7q LXwubIVCW5DLW/TRcoywCra8/IKQQkF+nk2wquUYzooWe2HRtqq3iwrtFpFVhox0Li7ZCe+Wlu6G d0qKo92VmSVHGfwCKC8H5SpzSOrsyoNcBUBlVXVNTXVVJUAFpz6q6s9QW1ff0NjYUF9XC1+imhS5 r9+amp3Olhans7np+w9OWQwiSJe7ta29o7MLoKuzo72t1eIiCaSxCp6f3T0AsLenHD3dvR7BqkGk 6Ob7vLB/cHh0dHiwD94+3i2SiNbJ/V44PglFODkGb7+so5HLNzAIp6F3TmFwwOdCgjwEZ+dxfX4G Q7KA/PwwBEIJBGCY9yN37whcJOoLGOl1I98oXAYTdfASRn1obHzi6ihRH11NjI8hi2kSrhP1NUya LEgyT8FNor6BKbOEtLZpuL2L27tbmLZpkeiemYX7h5h9uIfZGbeIKMEwNw+P4agNP8L8nEGgEMtI 8sIiPD2/vL6+PD/B4oIsMayyb9EvLy3DG8tLsl9U9q0EUJQ8/Mrq2vr62uoK75HESAzVbG9wHsem 3b7p8HAbsYxjBEsxRkHy+yXByFBsLLLqvyEpK01bKVL9P+g//8Bv4afHimhpWRsAAAAldEVYdGRh dGU6Y3JlYXRlADIwMTgtMTItMDRUMTI6NDk6MzYtMDc6MDARlu33AAAAJXRFWHRkYXRlOm1vZGlm eQAyMDE4LTEyLTA0VDEyOjQ5OjM2LTA3OjAwYMtVSwAAAABJRU5ErkJggg=='
      }
    }, true)
    const trackStyle = createStyle({
      stroke: {
        color: 'rgba(255, 0, 0, 0.5)',
        width: 3,
        lineDash: [5, 5]
      }
    }, true)
    const accuracyStyle = createStyle({
      fill: {
        color: 'rgba(0, 0, 0, 0.05)'
      },
      geometry: feature => {
        if (feature.get('id') === 'position') {
          const coordinates = feature.getGeometry().getCoordinates()
          const lonlat = toLonLat(coordinates)
          return new Circle(coordinates, (feature.get('radius') * scaleFactor(lonlat)))
        }
      }
    }, true)
    return createLayer({
      type: 'FeatureCollection',
      title: 'Geolocation',
      style: feature => {
        const styles = [trackStyle]
        if (feature.get('id') === 'position') {
          if (feature.get('radius') > 10 && feature.get('radius') < 5000) {
            styles.push(accuracyStyle)
          }
          if (feature.get('speed') > 1) {
            styles.push(trackingStyle)
          } else {
            styles.push(positionStyle)
          }
          if (feature.get('heading')) {
            trackingStyle.getImage().setRotation(feature.get('heading'))
          }
        }
        return styles
      }
    })
  }
}

export default GeoLocation
