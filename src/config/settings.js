export const app = {
  locale: 'et',// app locale
  layerManager: true,
  searchEnabled: true,
  locateEnabled: true,
  mouseCoordinates: true,
  tooltip: true,
  featureInfo: true,
  scaleLine: true,
  streetView: true,
  measureTool: true,
  fullScreen: true,
  mousePosition: true,
  geoLocation: true,
  settingsTabOpen: 'info-tab',// active tab on sidebar
  debug: true,// collect all console debug, info and error into downloadable file
  debugFile: 'geop_debug.log'
}
export const map = {
  el: '#map',
  center: [25.5, 58.5],
  zoom: 7,
  rotation: 0,
  extent: [21, 57, 29, 60],
  projection: 'EPSG:3857',
  baseLayer: 'osm',
  minZoom: 0,
  maxZoom: 20,
  clustered: false
}
export const geocache = {
  auth_url: 'http://geopeitus.ee',
  download_url: 'http://www.geopeitus.ee/?p=300',
  features_url: 'http://www.geopeitus.ee/index.php?p=301&status[]=1&format=2',
  cache_url: 'http://geopeitus.ee/aare/',
  radiusStyle: {
    visible: false,
    maxResolution: 30,
    radius: 160
  },
  newCacheDays: 30,
  styles: {
    base: {
      text: '\uf041',
      font: '900 16px "Font Awesome 5 Free"',
      textBaseline: 'middle',
      fill: {
        color: 'black'
      },
      stroke: {
        color: '#fff',
        width: 4
      }
    },
    text: {
      'Tavaline aare': {
        'text': '\uf1b2',
        'class': 'fa fa-cube',
        'font': '900 13px "Font Awesome 5 Free"'
      },
      'Multiaare': {
        'text': '\uf1b3',
        'class': 'fa fa-cubes',
        'font': '900 16px "Font Awesome 5 Free"'
      },
      'Veebikaamera': {
        'text': '\uf030',
        'class': 'fa fa-camera',
        'font': '900 12px "Font Awesome 5 Free"'
      },
      'Virtuaalne aare': {
        'text': '\uf1eb',
        'class': 'fa fa-wifi',
        'font': '900 12px "Font Awesome 5 Free"'
      },
      'Sündmusaare': {
        'text': '\uf274',
        'class': 'fa fa-calendar-check-o',
        'font': '900 12px "Font Awesome 5 Free"'
      },
      'Asukohata (tagurpidi) aare': {
        'text': '\uf021',
        'class': 'fa fa-refresh',
        'font': '900 12px "Font Awesome 5 Free"'
      },
      'Mõistatusaare': {
        'text': '\uf059',
        'class': 'fa fa-question-circle',
        'font': '900 12px "Font Awesome 5 Free"'
      },
      'Kirjakastiaare': {
        'text': '\uf0e0',
        'class': 'fa fa-envelope',
        'font': '900 12px "Font Awesome 5 Free"'
      },
      'KusMaLäen': {
        'text': '\uf0a9',
        'class': 'fa fa-arrow-circle-right',
        'font': '900 12px "Font Awesome 5 Free"'
      }
    },
    color: {// leidmata - 0, leitud - 1, minu - 2
      '0': {
        fill: {
          color: 'black'
        }
      },
      '1': {
        fill: {
          color: '#4c9900'
        }
      },
      '2': {
        fill: {
          color: 'red'
        }
      }
    },
    newCache: {
      yes: {
        stroke: {
          color: '#ffff00',
          width: 4
        }
      }
    },
    radiusStyle: {
      fill: {
        color: 'rgba(255, 0, 0, 0.1)'
      }
    }
  }
}
export const apiUrls = {
  streetview: 'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=',
  osm_ideditor: 'https://www.openstreetmap.org/edit?editor=id#background=custom:http://tiles.maaamet.ee/tm/tms/1.0.0/foto@GMC/{z}/{x}/{-y}.png&map=',
  nominatim: 'https://nominatim.openstreetmap.org',
}
