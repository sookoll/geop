export const app = {
  locale: 'et',// app locale
  layerManager: true,
  searchEnabled: true,
  locateEnabled: true,
  mouseCoordinates: true,
  featureInfo: true,
  scaleLine: true,
  measureTool: true,
  fullScreen: true,
  mousePosition: true,
  geoLocation: true,
  sideBarTab: 'info-tab',// active tab on sidebar
  streetview_url: 'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=',
  osm_ideditor_url: 'https://www.openstreetmap.org/edit?editor=id#background=custom:http://tiles.maaamet.ee/tm/tms/1.0.0/foto@GMC/{z}/{x}/{-y}.png&map=',
  nominatim_url: 'https://nominatim.openstreetmap.org',
  debug: true// collect all console.logs into downloadable file
}
export const geocache = {
  auth_url: 'http://geopeitus.ee',
  features_url: 'http://www.geopeitus.ee/index.php?p=301&status[]=1&format=2',
  cache_url: 'http://geopeitus.ee/aare/'
}
export const map = {
  el: '#map',
  center: [25.5, 58.5],
  zoom: 7,
  rotation: 0,
  extent: [21, 57, 29, 60],
  projection: 'EPSG:3857',
  activeBaseLayer: 'osm',
  minZoom: 0,
  maxZoom: 20,
  clustered: false
}
