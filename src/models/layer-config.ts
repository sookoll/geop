export enum LayerType {
  XYZ = 'XYZ',
  Bing = 'Bing',
  Group = 'Group',
  ImageWMS = 'ImageWMS',
  TileWMS = 'TileWMS',
  WMTS = 'WMTS',
  FeatureCollection = 'FeatureCollection'
}
export enum LayerGroupType {
  base = 'base',
  layers = 'layers',
  overlays = 'overlays'
}
export interface LayerConfig {
  id?: string
  group?: LayerGroupType
  type: LayerType
  visible?: boolean
  opacity?: number
  title?: string
  url?: string
  projection?: string
  crossOrigin?: null
  minResolution?: number
  maxResolution?: number
  tileSize?: number
  gutter?: number
  params?: any
  zIndex?: number
  icon?: string
  layers?: LayerConfig[]
}
