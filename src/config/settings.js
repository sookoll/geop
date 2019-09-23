export const app = {
  locale: 'et', // app locale
  layerManager: true,
  searchEnabled: true,
  locateEnabled: true,
  mouseCoordinates: true,
  settings: true,
  tooltip: true,
  featureInfo: true,
  scaleLine: true,
  streetView: true,
  measureTool: true,
  fullScreen: true,
  mousePosition: true,
  geoLocation: true,
  shareState: true,
  shareOnlyTripFeatures: true, // keep only features on trip
  settingsTabOpen: 'settings-tab', // active tab on sidebar
  debug: false, // collect all console debug, info and error into downloadable file
  debugFile: 'geop_debug.log',
  nominatimCountries: 'ee',
  routing: true
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
export const apiUrls = {
  ideditor: 'https://www.openstreetmap.org/edit?editor=id#background=custom:http://tiles.maaamet.ee/tm/tms/1.0.0/foto@GMC/{z}/{x}/{-y}.png&map=',
  nominatim: 'https://nominatim.openstreetmap.org',
  jsonstore: 'https://www.jsonstore.io/4d04eefd7ed4c19866cefcf038d0bebe95786bf33f0e60fdfbd8a554e6ae2670',
  qrcode: 'http://api.qrserver.com/v1/create-qr-code/?size=150x150&data=',
  osrm: 'https://router.project-osrm.org/route/v1/driving/',
  google: {
    streetview: 'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=',
    directions: 'https://www.google.com/maps/dir/?api=1&destination='
  },
  wmsexamples: {
    'Kataster': 'http://kaart.maaamet.ee/wms/alus?layers=TOPOYKSUS_6569,TOPOYKSUS_7793&SRS=EPSG:3301&title=Kataster',
    'Looduskaitse': 'https://gsavalik.envir.ee/geoserver/eelis/ows?layers=kr_kaitseala,kr_hoiuala,kr_hooldatav_skv,kr_looduslik_skv,kr_reservaat,kr_linnuala,kr_loodusala,kr_ramsar,kr_vep,plk,kr_kohalik_objekt_pv,kr_yksikobjekti_kaitsetsoon,kr_kohalik_objekt,kr_yksikobjektid&SRS=EPSG:3301&title=Looduskaitse',
    'Pärandkultuur': 'https://gsavalik.envir.ee/geoserver/eelis/ows?layers=pk_objekt_metsas&SRS=EPSG:3301&title=Pärandkultuur'
  }
}
export const geocache = {
  authUrl: 'http://geopeitus.ee',
  downloadUrl: {
    page: 'http://www.geopeitus.ee/index.php?p=300',
    geojson: 'http://www.geopeitus.ee/index.php?p=301&status[]=1&format=2',
    gpx: {
      gpxActive: 'http://www.geopeitus.ee/index.php?p=301&status[]=1&format=1',
      gpxAll: 'http://www.geopeitus.ee/index.php?p=301&status[]=1&status[]=2&status[]=3&format=1'
    }
  },
  cacheUrl: 'http://geopeitus.ee/aare/',
  radiusStyle: {
    maxResolution: 30,
    radius: 160
  },
  newCacheDays: 30,
  waypointMaxResolution: 10,
  overviewMinResolution: 100,
  exportFileName: 'geop.gpx',
  mapping: {
    fstatusJSON: {
      '0': 'Not Found',
      '1': 'Found',
      '2': 'Owner'
    },
    fstatusGPX: {
      'Geocache': 'Not Found',
      'Geocache Found': 'Found',
      'Geocache Owner': 'Owner'
    },
    type: {
      'Tavaline aare': 'Geocache|Traditional Cache',
      'Multiaare': 'Geocache|Multi-cache',
      'Veebikaamera': 'Geocache|Webcam Cache',
      'Virtuaalne aare': 'Geocache|Virtual Cache',
      'Sündmusaare': 'Geocache|Event Cache',
      'Asukohata (tagurpidi) aare': 'Geocache|Locationless Cache',
      'Mõistatusaare': 'Geocache|Unknown Cache',
      'Kirjakastiaare': 'Geocache|Letterbox Hybrid',
      'KusMaLäen': 'Geocache|Whereigo Cache'
    },
    container: {
      'mikro': 'Micro',
      'väike': 'Small',
      'normaalne': 'Regular',
      'suur': 'Large',
      'muu': 'Unknown'
    }
  },
  filter: {
    fstatus: 'fstatusGPX',
    type: 'type',
    status: ['Available', 'Unavailable', 'Archived'],
    newCache: ['New Cache']
  },
  styles: {
    base: {
      text: '\uf3c5',
      class: 'fas fa-map-marker-alt',
      font: '900 16px "Font Awesome 5 Free"',
      textBaseline: 'middle',
      fill: {
        color: '#aaa'
      },
      stroke: {
        color: '#fff',
        width: 4
      }
    },
    overview: {
      text: '\uf111',
      class: 'fa fa-circle',
      font: '900 8px "Font Awesome 5 Free"',
      stroke: {
        color: '#fff',
        width: 2
      }
    },
    text: {
      'Geocache|Traditional Cache': {
        text: '\uf1b2',
        class: 'fa fa-cube',
        font: '900 13px "Font Awesome 5 Free"'
      },
      'Geocache|Multi-cache': {
        text: '\uf1b3',
        class: 'fa fa-cubes',
        font: '900 16px "Font Awesome 5 Free"'
      },
      'Geocache|Webcam Cache': {
        text: '\uf030',
        class: 'fa fa-camera',
        font: '900 12px "Font Awesome 5 Free"'
      },
      'Geocache|Virtual Cache': {
        text: '\uf1eb',
        class: 'fa fa-wifi',
        font: '900 12px "Font Awesome 5 Free"'
      },
      'Geocache|Event Cache': {
        text: '\uf274',
        class: 'fa fa-calendar-check-o',
        font: '900 12px "Font Awesome 5 Free"'
      },
      'Geocache|Locationless Cache': {
        text: '\uf021',
        class: 'fa fa-refresh',
        font: '900 12px "Font Awesome 5 Free"'
      },
      'Geocache|Unknown Cache': {
        text: '\uf059',
        class: 'fa fa-question-circle',
        font: '900 13px "Font Awesome 5 Free"'
      },
      'Geocache|Letterbox Hybrid': {
        text: '\uf0e0',
        class: 'fa fa-envelope',
        font: '900 12px "Font Awesome 5 Free"'
      },
      'Geocache|Whereigo Cache': {
        text: '\uf0a9',
        class: 'fa fa-arrow-circle-right',
        font: '900 12px "Font Awesome 5 Free"'
      },
      'Waypoint|Parking Area': {
        text: '\uf540',
        class: 'fas fa-parking',
        font: '900 12px "Font Awesome 5 Free"'
      },
      'Waypoint|Reference Point': {
        text: '\uf358',
        class: 'far fa-arrow-alt-circle-down',
        font: '900 12px "Font Awesome 5 Free"'
      },
      'Waypoint|Stages of a Multicache': {
        text: '\uf055',
        class: 'fas fa-plus-circle',
        font: '900 12px "Font Awesome 5 Free"'
      },
      'Waypoint|Physical Stage': {
        text: '\uf055',
        class: 'fas fa-plus-circle',
        font: '900 12px "Font Awesome 5 Free"'
      },
      'Waypoint|Virtual Stage': {
        text: '\uf055',
        class: 'fas fa-plus-circle',
        font: '900 12px "Font Awesome 5 Free"'
      },
      'Waypoint|Final Location': {
        text: '\uf057',
        class: 'far fa-times-circle',
        font: '900 12px "Font Awesome 5 Free"'
      },
      'Waypoint|Trailhead': {
        text: '\uf6ec',
        class: 'far fa-hiking',
        font: '900 12px "Font Awesome 5 Free"'
      }
    },
    color: {// leidmata - 0, leitud - 1, minu - 2
      'Not Found': {
        fill: {
          color: '#444'
        }
      },
      'Found': {
        fill: {
          color: '#4c9900'
        }
      },
      'Owner': {
        fill: {
          color: '#f00'
        }
      }
    },
    newCache: {
      'New Cache': {
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
