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
  sideBarTab: 'info-tab',// active tab on sidebar
  debug: true,// collect all console debug, info and error into downloadable file
  debugFile: 'geop_debug.txt'
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
  features_url: 'http://www.geopeitus.ee/index.php?p=301&status[]=1&format=2',
  cache_url: 'http://geopeitus.ee/aare/'
}
export const apiUrls = {
  streetview: 'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=',
  osm_ideditor: 'https://www.openstreetmap.org/edit?editor=id#background=custom:http://tiles.maaamet.ee/tm/tms/1.0.0/foto@GMC/{z}/{x}/{-y}.png&map=',
  nominatim: 'https://nominatim.openstreetmap.org',
}
