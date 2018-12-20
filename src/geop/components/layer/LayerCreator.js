import LayerGroup from 'ol/layer/Group'
import LayerImage from 'ol/layer/Image'
import LayerTile from 'ol/layer/Tile'
import LayerVector from 'ol/layer/Vector'
import XYZ from 'ol/source/XYZ'
import TileWMS from 'ol/source/TileWMS'
import ImageWMS from 'ol/source/ImageWMS'
import Bing from 'ol/source/BingMaps'
import Vector from 'ol/source/Vector'
import WMTS, { optionsFromCapabilities } from 'ol/source/WMTS'
import WMTSCapabilities from 'ol/format/WMTSCapabilities'
import GeoJSONFormat from 'ol/format/GeoJSON'
import { get as getProjection } from 'ol/proj'
import { getWidth } from 'ol/extent'
import TileGrid from 'ol/tilegrid/TileGrid'
import { createStyle } from './StyleBuilder'
import range from 'lodash/range'
import { getState } from 'Utilities/store'
import { map as mapConf } from 'Conf/settings'
import { uid, deepCopy } from 'Utilities/util'

export const dataProjection = 'EPSG:4326'

const sources = {
  XYZ,
  TileWMS,
  ImageWMS,
  Bing,
  Vector
}
const formats = {
  geojson: new GeoJSONFormat(),
  wmts: new WMTSCapabilities()
}

class GroupLayer extends LayerGroup {}
class ImageLayer extends LayerImage {
  constructor (opts) {
    const options = {
      source: new sources[opts.type](opts)
    }
    super(options)
  }
}
class TileLayer extends LayerTile {
  constructor (opts) {
    const sourceOpts = {}
    if (opts.type === 'TileWMS' && opts.tileSize && opts.tileSize !== 256) {
      sourceOpts.tileGrid = tileGridWMS(opts)
    }
    const options = {
      source: sources[opts.type] ? new sources[opts.type](Object.assign({}, opts, sourceOpts)) : null
    }
    super(options)
  }
}
class FeatureLayer extends LayerVector {
  constructor (opts) {
    const features = opts.features ?
      formats.geojson.readFeatures(opts, {
        dataProjection: dataProjection,
        featureProjection: getState('map/projection')
      }) : []
    const options = {
      source: new Vector({
        features
      }),
      style: createStyle(opts.style),
      updateWhileAnimating: opts.updateWhileAnimating,
      updateWhileInteracting: opts.updateWhileInteracting
    }
    super(options)
  }
}

export function createLayer (layerConf) {
  let layer
  switch (layerConf.type) {
    case 'Group':
      const arr = layerConf.layers.map(conf => {
        const inputConf = deepCopy(conf)
        // add projection to sublayer
        if (!inputConf.projection) {
          inputConf.projection = layerConf.projection
        }
        return createLayer(inputConf)
      })
      // group should be visible, if not specified
      if (typeof layerConf.visible === 'undefined') {
        layerConf.visible = true
      }
      layer = new GroupLayer({
        layers: arr
      })
      break
    case 'XYZ':
    case 'TileWMS':
    case 'Bing':
      layer = new TileLayer(deepCopy(layerConf))
      break
    case 'WMTS':
      layer = new TileLayer(deepCopy(layerConf))
      const text = loadCapabilities()
      const result = formats.wmts.read(text)
      const options = optionsFromCapabilities(result, {
        layer: layerConf.layer,
        matrixSet: layerConf.matrixSet
      })
      console.log(options)
      options.crossOrigin = ''
      options.projection = layerConf.projection
      console.log(options)
      layer.setSource(new WMTS(options))
      break
    case 'ImageWMS':
      layer = new ImageLayer(deepCopy(layerConf))
      break
    case 'FeatureCollection':// can not use deepcopy, it remove style function
      layer = new FeatureLayer(layerConf)
      break
  }
  set(layer, layerConf)
  return layer
}

function set (layer, layerConf) {
  if (typeof layerConf.visible === 'boolean') {
    layer.setVisible(layerConf.visible)
  }
  if (typeof layerConf.id === 'undefined') {
    layerConf.id = uid()
  }
  layer.set('id', layerConf.id)
  if (layerConf.title) {
    layer.set('title', layerConf.title)
  }
  if (layerConf.layerType) {
    layer.set('type', layerConf.type)
  }
  if (layerConf.icon) {
    layer.set('icon', layerConf.icon)
  }
  if (layerConf.minResolution) {
    layer.setMinResolution(layerConf.minResolution)
  }
  if (layerConf.maxResolution) {
    layer.setMaxResolution(layerConf.maxResolution)
  }
  if (typeof layerConf.opacity !== 'undefined') {
    layer.setOpacity(layerConf.opacity)
  }
  layer.set('conf', layerConf)
  return layer
}

function tileGridWMS (opts) {
  const projExtent = getProjection(opts.projection).getExtent()
  const startResolution = getWidth(projExtent) / opts.tileSize
  const resolutions = range(mapConf.minZoom, mapConf.maxZoom + 1)
  for (let i = 0, ii = resolutions.length; i < ii; ++i) {
    resolutions[i] = startResolution / Math.pow(2, i)
  }
  return new TileGrid({
    extent: projExtent,
    resolutions: resolutions,
    tileSize: [opts.tileSize, opts.tileSize]
  })
}

function loadCapabilities () {
  return `<?xml version="1.0" encoding="UTF-8"?>
  <Capabilities xmlns="http://www.opengis.net/wmts/1.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:gml="http://www.opengis.net/gml" xmlns:inspire_vs="http://inspire.ec.europa.eu/schemas/inspire_vs_ows11/1.0" xmlns:inspire_common="http://inspire.ec.europa.eu/schemas/common/1.0" xsi:schemaLocation="http://www.opengis.net/wmts/1.0 http://schemas.opengis.net/wmts/1.0/wmtsGetCapabilities_response.xsd http://inspire.ec.europa.eu/schemas/inspire_vs_ows11/1.0 http://inspire.ec.europa.eu/schemas/inspire_vs_ows11/1.0/inspire_vs_ows_11.xsd" version="1.0.0">
    <ows:ServiceIdentification>
      <ows:Title>GeoServer Web Map Tile Service</ows:Title>
      <ows:Abstract>A compliant implementation of WMTS service.</ows:Abstract>
      <ows:Keywords/>
      <ows:ServiceType>OGC WMTS</ows:ServiceType>
      <ows:ServiceTypeVersion>1.0.0</ows:ServiceTypeVersion>
      <ows:Fees>NONE</ows:Fees>
      <ows:AccessConstraints>NONE</ows:AccessConstraints>
    </ows:ServiceIdentification>
    <ows:ServiceProvider>
      <ows:ProviderName>http://geoserver.org</ows:ProviderName>
      <ows:ServiceContact>
        <ows:ContactInfo>
          <ows:Address/>
        </ows:ContactInfo>
      </ows:ServiceContact>
    </ows:ServiceProvider>
    <ows:OperationsMetadata>
      <ows:Operation name="GetCapabilities">
        <ows:DCP>
          <ows:HTTP>
            <ows:Get xlink:href="https://mapservices.navici.com/basemaps/gwc/service/wmts?">
              <ows:Constraint name="GetEncoding">
                <ows:AllowedValues>
                  <ows:Value>KVP</ows:Value>
                </ows:AllowedValues>
              </ows:Constraint>
            </ows:Get>
          </ows:HTTP>
        </ows:DCP>
      </ows:Operation>
      <ows:Operation name="GetTile">
        <ows:DCP>
          <ows:HTTP>
            <ows:Get xlink:href="https://mapservices.navici.com/basemaps/gwc/service/wmts?">
              <ows:Constraint name="GetEncoding">
                <ows:AllowedValues>
                  <ows:Value>KVP</ows:Value>
                </ows:AllowedValues>
              </ows:Constraint>
            </ows:Get>
          </ows:HTTP>
        </ows:DCP>
      </ows:Operation>
      <ows:Operation name="GetFeatureInfo">
        <ows:DCP>
          <ows:HTTP>
            <ows:Get xlink:href="https://mapservices.navici.com/basemaps/gwc/service/wmts?">
              <ows:Constraint name="GetEncoding">
                <ows:AllowedValues>
                  <ows:Value>KVP</ows:Value>
                </ows:AllowedValues>
              </ows:Constraint>
            </ows:Get>
          </ows:HTTP>
        </ows:DCP>
      </ows:Operation>
      <inspire_vs:ExtendedCapabilities>
        <inspire_common:MetadataUrl>
          <inspire_common:URL>http://www.paikkatietohakemisto.fi/geonetwork/srv/fi/iso19139.xml?id=942</inspire_common:URL>
          <inspire_common:MediaType>application/vnd.iso.19139+xml</inspire_common:MediaType>
        </inspire_common:MetadataUrl>
        <inspire_common:SupportedLanguages>
          <inspire_common:DefaultLanguage>
            <inspire_common:Language>fin</inspire_common:Language>
          </inspire_common:DefaultLanguage>
        </inspire_common:SupportedLanguages>
        <inspire_common:ResponseLanguage>
          <inspire_common:Language>fin</inspire_common:Language>
        </inspire_common:ResponseLanguage>
      </inspire_vs:ExtendedCapabilities>
    </ows:OperationsMetadata>
    <Contents>
      <Layer>
        <ows:Title>RK Series</ows:Title>
        <ows:Abstract>RK Series (EPSG:3067, JHS)</ows:Abstract>
        <ows:Identifier>rk</ows:Identifier>
        <Style isDefault="true">
          <ows:Identifier/>
        </Style>
        <Format>image/png8</Format>
        <InfoFormat>text/plain</InfoFormat>
        <InfoFormat>application/vnd.ogc.gml</InfoFormat>
        <InfoFormat>text/xml</InfoFormat>
        <InfoFormat>application/vnd.ogc.gml/3.1.1</InfoFormat>
        <InfoFormat>text/xml</InfoFormat>
        <InfoFormat>text/html</InfoFormat>
        <InfoFormat>application/json</InfoFormat>
        <TileMatrixSetLink>
          <TileMatrixSet>ETRS-TM35FIN</TileMatrixSet>
          <TileMatrixSetLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:0</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>1</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>1</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:1</TileMatrix>
              <MinTileRow>1</MinTileRow>
              <MaxTileRow>3</MaxTileRow>
              <MinTileCol>1</MinTileCol>
              <MaxTileCol>3</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:2</TileMatrix>
              <MinTileRow>2</MinTileRow>
              <MaxTileRow>7</MaxTileRow>
              <MinTileCol>2</MinTileCol>
              <MaxTileCol>7</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:3</TileMatrix>
              <MinTileRow>4</MinTileRow>
              <MaxTileRow>15</MaxTileRow>
              <MinTileCol>4</MinTileCol>
              <MaxTileCol>15</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:4</TileMatrix>
              <MinTileRow>8</MinTileRow>
              <MaxTileRow>31</MaxTileRow>
              <MinTileCol>8</MinTileCol>
              <MaxTileCol>31</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:5</TileMatrix>
              <MinTileRow>16</MinTileRow>
              <MaxTileRow>63</MaxTileRow>
              <MinTileCol>16</MinTileCol>
              <MaxTileCol>63</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:6</TileMatrix>
              <MinTileRow>32</MinTileRow>
              <MaxTileRow>127</MaxTileRow>
              <MinTileCol>32</MinTileCol>
              <MaxTileCol>127</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:7</TileMatrix>
              <MinTileRow>64</MinTileRow>
              <MaxTileRow>255</MaxTileRow>
              <MinTileCol>64</MinTileCol>
              <MaxTileCol>255</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:8</TileMatrix>
              <MinTileRow>128</MinTileRow>
              <MaxTileRow>511</MaxTileRow>
              <MinTileCol>128</MinTileCol>
              <MaxTileCol>511</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:9</TileMatrix>
              <MinTileRow>256</MinTileRow>
              <MaxTileRow>1023</MaxTileRow>
              <MinTileCol>256</MinTileCol>
              <MaxTileCol>1023</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:10</TileMatrix>
              <MinTileRow>512</MinTileRow>
              <MaxTileRow>2047</MaxTileRow>
              <MinTileCol>512</MinTileCol>
              <MaxTileCol>2047</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:11</TileMatrix>
              <MinTileRow>1024</MinTileRow>
              <MaxTileRow>4095</MaxTileRow>
              <MinTileCol>1024</MinTileCol>
              <MaxTileCol>4095</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:12</TileMatrix>
              <MinTileRow>2048</MinTileRow>
              <MaxTileRow>8191</MaxTileRow>
              <MinTileCol>2048</MinTileCol>
              <MaxTileCol>8191</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:13</TileMatrix>
              <MinTileRow>4096</MinTileRow>
              <MaxTileRow>16383</MaxTileRow>
              <MinTileCol>4096</MinTileCol>
              <MaxTileCol>16383</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:14</TileMatrix>
              <MinTileRow>8192</MinTileRow>
              <MaxTileRow>32767</MaxTileRow>
              <MinTileCol>8192</MinTileCol>
              <MaxTileCol>32767</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:15</TileMatrix>
              <MinTileRow>16384</MinTileRow>
              <MaxTileRow>65535</MaxTileRow>
              <MinTileCol>16384</MinTileCol>
              <MaxTileCol>65535</MaxTileCol>
            </TileMatrixLimits>
          </TileMatrixSetLimits>
        </TileMatrixSetLink>
      </Layer>
      <Layer>
        <ows:Title>LG Series</ows:Title>
        <ows:Abstract>LG Series (EPSG:3067, JHS)</ows:Abstract>
        <ows:Identifier>lg</ows:Identifier>
        <Style isDefault="true">
          <ows:Identifier/>
        </Style>
        <Format>image/png8</Format>
        <InfoFormat>text/plain</InfoFormat>
        <InfoFormat>application/vnd.ogc.gml</InfoFormat>
        <InfoFormat>text/xml</InfoFormat>
        <InfoFormat>application/vnd.ogc.gml/3.1.1</InfoFormat>
        <InfoFormat>text/xml</InfoFormat>
        <InfoFormat>text/html</InfoFormat>
        <InfoFormat>application/json</InfoFormat>
        <TileMatrixSetLink>
          <TileMatrixSet>ETRS-TM35FIN</TileMatrixSet>
          <TileMatrixSetLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:0</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>1</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>2</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:1</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>3</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>4</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:2</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>7</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>9</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:3</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>15</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>19</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:4</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>31</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>39</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:5</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>63</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>79</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:6</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>127</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>159</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:7</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>255</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>319</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:8</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>511</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>639</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:9</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>1023</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>1279</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:10</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>2047</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>2559</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:11</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>4095</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>5119</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:12</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>8191</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>10239</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:13</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>16383</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>20479</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:14</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>32767</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>40959</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:15</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>65535</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>81919</MaxTileCol>
            </TileMatrixLimits>
          </TileMatrixSetLimits>
        </TileMatrixSetLink>
      </Layer>
      <Layer>
        <ows:Title>RS Series</ows:Title>
        <ows:Abstract>RS Series (EPSG:3067, JHS)</ows:Abstract>
        <ows:Identifier>rs</ows:Identifier>
        <Style isDefault="true">
          <ows:Identifier/>
        </Style>
        <Format>image/png8</Format>
        <TileMatrixSetLink>
          <TileMatrixSet>ETRS-TM35FIN</TileMatrixSet>
          <TileMatrixSetLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:0</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>1</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>2</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:1</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>3</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>4</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:2</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>7</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>9</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:3</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>15</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>19</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:4</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>31</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>39</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:5</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>63</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>79</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:6</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>127</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>159</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:7</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>255</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>319</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:8</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>511</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>639</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:9</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>1023</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>1279</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:10</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>2047</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>2559</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:11</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>4095</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>5119</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:12</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>8191</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>10239</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:13</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>16383</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>20479</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:14</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>32767</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>40959</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:15</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>65535</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>81919</MaxTileCol>
            </TileMatrixLimits>
          </TileMatrixSetLimits>
        </TileMatrixSetLink>
      </Layer>
      <Layer>
        <ows:Title>NS Series</ows:Title>
        <ows:Abstract>RK Series (EPSG:3067, JHS)</ows:Abstract>
        <ows:Identifier>ns</ows:Identifier>
        <Style isDefault="true">
          <ows:Identifier/>
        </Style>
        <Format>image/png8</Format>
        <InfoFormat>text/plain</InfoFormat>
        <InfoFormat>application/vnd.ogc.gml</InfoFormat>
        <InfoFormat>text/xml</InfoFormat>
        <InfoFormat>application/vnd.ogc.gml/3.1.1</InfoFormat>
        <InfoFormat>text/xml</InfoFormat>
        <InfoFormat>text/html</InfoFormat>
        <InfoFormat>application/json</InfoFormat>
        <TileMatrixSetLink>
          <TileMatrixSet>ETRS-TM35FIN</TileMatrixSet>
          <TileMatrixSetLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:0</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>1</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>2</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:1</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>3</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>4</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:2</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>7</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>9</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:3</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>15</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>19</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:4</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>31</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>39</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:5</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>63</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>79</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:6</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>127</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>159</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:7</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>255</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>319</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:8</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>511</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>639</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:9</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>1023</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>1279</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:10</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>2047</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>2559</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:11</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>4095</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>5119</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:12</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>8191</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>10239</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:13</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>16383</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>20479</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:14</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>32767</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>40959</MaxTileCol>
            </TileMatrixLimits>
            <TileMatrixLimits>
              <TileMatrix>ETRS-TM35FIN:15</TileMatrix>
              <MinTileRow>0</MinTileRow>
              <MaxTileRow>65535</MaxTileRow>
              <MinTileCol>0</MinTileCol>
              <MaxTileCol>81919</MaxTileCol>
            </TileMatrixLimits>
          </TileMatrixSetLimits>
        </TileMatrixSetLink>
      </Layer>
      <TileMatrixSet>
        <ows:Identifier>GlobalCRS84Pixel</ows:Identifier>
        <ows:SupportedCRS>urn:ogc:def:crs:EPSG::4326</ows:SupportedCRS>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Pixel:0</ows:Identifier>
          <ScaleDenominator>7.951392199519542E8</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>1</MatrixWidth>
          <MatrixHeight>1</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Pixel:1</ows:Identifier>
          <ScaleDenominator>3.975696099759771E8</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>2</MatrixWidth>
          <MatrixHeight>1</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Pixel:2</ows:Identifier>
          <ScaleDenominator>1.9878480498798856E8</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>3</MatrixWidth>
          <MatrixHeight>2</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Pixel:3</ows:Identifier>
          <ScaleDenominator>1.325232033253257E8</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>5</MatrixWidth>
          <MatrixHeight>3</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Pixel:4</ows:Identifier>
          <ScaleDenominator>6.626160166266285E7</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>9</MatrixWidth>
          <MatrixHeight>5</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Pixel:5</ows:Identifier>
          <ScaleDenominator>3.3130800831331424E7</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>17</MatrixWidth>
          <MatrixHeight>9</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Pixel:6</ows:Identifier>
          <ScaleDenominator>1.325232033253257E7</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>43</MatrixWidth>
          <MatrixHeight>22</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Pixel:7</ows:Identifier>
          <ScaleDenominator>6626160.166266285</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>85</MatrixWidth>
          <MatrixHeight>43</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Pixel:8</ows:Identifier>
          <ScaleDenominator>3313080.0831331424</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>169</MatrixWidth>
          <MatrixHeight>85</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Pixel:9</ows:Identifier>
          <ScaleDenominator>1656540.0415665712</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>338</MatrixWidth>
          <MatrixHeight>169</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Pixel:10</ows:Identifier>
          <ScaleDenominator>552180.0138555238</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>1013</MatrixWidth>
          <MatrixHeight>507</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Pixel:11</ows:Identifier>
          <ScaleDenominator>331308.00831331423</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>1688</MatrixWidth>
          <MatrixHeight>844</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Pixel:12</ows:Identifier>
          <ScaleDenominator>110436.00277110476</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>5063</MatrixWidth>
          <MatrixHeight>2532</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Pixel:13</ows:Identifier>
          <ScaleDenominator>55218.00138555238</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>10125</MatrixWidth>
          <MatrixHeight>5063</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Pixel:14</ows:Identifier>
          <ScaleDenominator>33130.80083133143</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>16875</MatrixWidth>
          <MatrixHeight>8438</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Pixel:15</ows:Identifier>
          <ScaleDenominator>11043.600277110474</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>50625</MatrixWidth>
          <MatrixHeight>25313</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Pixel:16</ows:Identifier>
          <ScaleDenominator>3313.080083133142</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>168750</MatrixWidth>
          <MatrixHeight>84375</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Pixel:17</ows:Identifier>
          <ScaleDenominator>1104.3600277110472</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>506250</MatrixWidth>
          <MatrixHeight>253125</MatrixHeight>
        </TileMatrix>
      </TileMatrixSet>
      <TileMatrixSet>
        <ows:Identifier>EPSG:4326</ows:Identifier>
        <ows:SupportedCRS>urn:ogc:def:crs:EPSG::4326</ows:SupportedCRS>
        <TileMatrix>
          <ows:Identifier>EPSG:4326:0</ows:Identifier>
          <ScaleDenominator>2.795411320143589E8</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>2</MatrixWidth>
          <MatrixHeight>1</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:4326:1</ows:Identifier>
          <ScaleDenominator>1.3977056600717944E8</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>4</MatrixWidth>
          <MatrixHeight>2</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:4326:2</ows:Identifier>
          <ScaleDenominator>6.988528300358972E7</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>8</MatrixWidth>
          <MatrixHeight>4</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:4326:3</ows:Identifier>
          <ScaleDenominator>3.494264150179486E7</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>16</MatrixWidth>
          <MatrixHeight>8</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:4326:4</ows:Identifier>
          <ScaleDenominator>1.747132075089743E7</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>32</MatrixWidth>
          <MatrixHeight>16</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:4326:5</ows:Identifier>
          <ScaleDenominator>8735660.375448715</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>64</MatrixWidth>
          <MatrixHeight>32</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:4326:6</ows:Identifier>
          <ScaleDenominator>4367830.1877243575</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>128</MatrixWidth>
          <MatrixHeight>64</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:4326:7</ows:Identifier>
          <ScaleDenominator>2183915.0938621787</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>256</MatrixWidth>
          <MatrixHeight>128</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:4326:8</ows:Identifier>
          <ScaleDenominator>1091957.5469310894</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>512</MatrixWidth>
          <MatrixHeight>256</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:4326:9</ows:Identifier>
          <ScaleDenominator>545978.7734655447</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>1024</MatrixWidth>
          <MatrixHeight>512</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:4326:10</ows:Identifier>
          <ScaleDenominator>272989.38673277234</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>2048</MatrixWidth>
          <MatrixHeight>1024</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:4326:11</ows:Identifier>
          <ScaleDenominator>136494.69336638617</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>4096</MatrixWidth>
          <MatrixHeight>2048</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:4326:12</ows:Identifier>
          <ScaleDenominator>68247.34668319309</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>8192</MatrixWidth>
          <MatrixHeight>4096</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:4326:13</ows:Identifier>
          <ScaleDenominator>34123.67334159654</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>16384</MatrixWidth>
          <MatrixHeight>8192</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:4326:14</ows:Identifier>
          <ScaleDenominator>17061.83667079827</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>32768</MatrixWidth>
          <MatrixHeight>16384</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:4326:15</ows:Identifier>
          <ScaleDenominator>8530.918335399136</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>65536</MatrixWidth>
          <MatrixHeight>32768</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:4326:16</ows:Identifier>
          <ScaleDenominator>4265.459167699568</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>131072</MatrixWidth>
          <MatrixHeight>65536</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:4326:17</ows:Identifier>
          <ScaleDenominator>2132.729583849784</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>262144</MatrixWidth>
          <MatrixHeight>131072</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:4326:18</ows:Identifier>
          <ScaleDenominator>1066.364791924892</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>524288</MatrixWidth>
          <MatrixHeight>262144</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:4326:19</ows:Identifier>
          <ScaleDenominator>533.182395962446</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>1048576</MatrixWidth>
          <MatrixHeight>524288</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:4326:20</ows:Identifier>
          <ScaleDenominator>266.591197981223</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>2097152</MatrixWidth>
          <MatrixHeight>1048576</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:4326:21</ows:Identifier>
          <ScaleDenominator>133.2955989906115</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>4194304</MatrixWidth>
          <MatrixHeight>2097152</MatrixHeight>
        </TileMatrix>
      </TileMatrixSet>
      <TileMatrixSet>
        <ows:Identifier>GoogleCRS84Quad</ows:Identifier>
        <ows:SupportedCRS>urn:ogc:def:crs:EPSG::4326</ows:SupportedCRS>
        <TileMatrix>
          <ows:Identifier>GoogleCRS84Quad:0</ows:Identifier>
          <ScaleDenominator>5.590822640287178E8</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>1</MatrixWidth>
          <MatrixHeight>1</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GoogleCRS84Quad:1</ows:Identifier>
          <ScaleDenominator>2.795411320143589E8</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>2</MatrixWidth>
          <MatrixHeight>1</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GoogleCRS84Quad:2</ows:Identifier>
          <ScaleDenominator>1.397705660071794E8</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>4</MatrixWidth>
          <MatrixHeight>2</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GoogleCRS84Quad:3</ows:Identifier>
          <ScaleDenominator>6.988528300358972E7</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>8</MatrixWidth>
          <MatrixHeight>4</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GoogleCRS84Quad:4</ows:Identifier>
          <ScaleDenominator>3.494264150179486E7</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>16</MatrixWidth>
          <MatrixHeight>8</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GoogleCRS84Quad:5</ows:Identifier>
          <ScaleDenominator>1.747132075089743E7</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>32</MatrixWidth>
          <MatrixHeight>16</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GoogleCRS84Quad:6</ows:Identifier>
          <ScaleDenominator>8735660.375448715</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>64</MatrixWidth>
          <MatrixHeight>32</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GoogleCRS84Quad:7</ows:Identifier>
          <ScaleDenominator>4367830.187724357</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>128</MatrixWidth>
          <MatrixHeight>64</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GoogleCRS84Quad:8</ows:Identifier>
          <ScaleDenominator>2183915.093862179</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>256</MatrixWidth>
          <MatrixHeight>128</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GoogleCRS84Quad:9</ows:Identifier>
          <ScaleDenominator>1091957.546931089</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>512</MatrixWidth>
          <MatrixHeight>256</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GoogleCRS84Quad:10</ows:Identifier>
          <ScaleDenominator>545978.7734655447</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>1024</MatrixWidth>
          <MatrixHeight>512</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GoogleCRS84Quad:11</ows:Identifier>
          <ScaleDenominator>272989.3867327723</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>2048</MatrixWidth>
          <MatrixHeight>1024</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GoogleCRS84Quad:12</ows:Identifier>
          <ScaleDenominator>136494.6933663862</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>4096</MatrixWidth>
          <MatrixHeight>2048</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GoogleCRS84Quad:13</ows:Identifier>
          <ScaleDenominator>68247.34668319309</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>8192</MatrixWidth>
          <MatrixHeight>4096</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GoogleCRS84Quad:14</ows:Identifier>
          <ScaleDenominator>34123.67334159654</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>16384</MatrixWidth>
          <MatrixHeight>8192</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GoogleCRS84Quad:15</ows:Identifier>
          <ScaleDenominator>17061.83667079827</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>32768</MatrixWidth>
          <MatrixHeight>16384</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GoogleCRS84Quad:16</ows:Identifier>
          <ScaleDenominator>8530.918335399136</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>65536</MatrixWidth>
          <MatrixHeight>32768</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GoogleCRS84Quad:17</ows:Identifier>
          <ScaleDenominator>4265.459167699568</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>131072</MatrixWidth>
          <MatrixHeight>65536</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GoogleCRS84Quad:18</ows:Identifier>
          <ScaleDenominator>2132.729583849784</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>262144</MatrixWidth>
          <MatrixHeight>131072</MatrixHeight>
        </TileMatrix>
      </TileMatrixSet>
      <TileMatrixSet>
        <ows:Identifier>ETRS-TM35FIN</ows:Identifier>
        <ows:SupportedCRS>urn:ogc:def:crs:EPSG::3067</ows:SupportedCRS>
        <TileMatrix>
          <ows:Identifier>ETRS-TM35FIN:0</ows:Identifier>
          <ScaleDenominator>2.925714285714286E7</ScaleDenominator>
          <TopLeftCorner>-2097152.0 9437184.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>3</MatrixWidth>
          <MatrixHeight>2</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>ETRS-TM35FIN:1</ows:Identifier>
          <ScaleDenominator>1.462857142857143E7</ScaleDenominator>
          <TopLeftCorner>-2097152.0 9437184.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>5</MatrixWidth>
          <MatrixHeight>4</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>ETRS-TM35FIN:2</ows:Identifier>
          <ScaleDenominator>7314285.714285715</ScaleDenominator>
          <TopLeftCorner>-2097152.0 9437184.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>10</MatrixWidth>
          <MatrixHeight>8</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>ETRS-TM35FIN:3</ows:Identifier>
          <ScaleDenominator>3657142.8571428573</ScaleDenominator>
          <TopLeftCorner>-2097152.0 9437184.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>20</MatrixWidth>
          <MatrixHeight>16</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>ETRS-TM35FIN:4</ows:Identifier>
          <ScaleDenominator>1828571.4285714286</ScaleDenominator>
          <TopLeftCorner>-2097152.0 9437184.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>40</MatrixWidth>
          <MatrixHeight>32</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>ETRS-TM35FIN:5</ows:Identifier>
          <ScaleDenominator>914285.7142857143</ScaleDenominator>
          <TopLeftCorner>-2097152.0 9437184.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>80</MatrixWidth>
          <MatrixHeight>64</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>ETRS-TM35FIN:6</ows:Identifier>
          <ScaleDenominator>457142.85714285716</ScaleDenominator>
          <TopLeftCorner>-2097152.0 9437184.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>160</MatrixWidth>
          <MatrixHeight>128</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>ETRS-TM35FIN:7</ows:Identifier>
          <ScaleDenominator>228571.42857142858</ScaleDenominator>
          <TopLeftCorner>-2097152.0 9437184.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>320</MatrixWidth>
          <MatrixHeight>256</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>ETRS-TM35FIN:8</ows:Identifier>
          <ScaleDenominator>114285.71428571429</ScaleDenominator>
          <TopLeftCorner>-2097152.0 9437184.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>640</MatrixWidth>
          <MatrixHeight>512</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>ETRS-TM35FIN:9</ows:Identifier>
          <ScaleDenominator>57142.857142857145</ScaleDenominator>
          <TopLeftCorner>-2097152.0 9437184.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>1280</MatrixWidth>
          <MatrixHeight>1024</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>ETRS-TM35FIN:10</ows:Identifier>
          <ScaleDenominator>28571.428571428572</ScaleDenominator>
          <TopLeftCorner>-2097152.0 9437184.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>2560</MatrixWidth>
          <MatrixHeight>2048</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>ETRS-TM35FIN:11</ows:Identifier>
          <ScaleDenominator>14285.714285714286</ScaleDenominator>
          <TopLeftCorner>-2097152.0 9437184.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>5120</MatrixWidth>
          <MatrixHeight>4096</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>ETRS-TM35FIN:12</ows:Identifier>
          <ScaleDenominator>7142.857142857143</ScaleDenominator>
          <TopLeftCorner>-2097152.0 9437184.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>10240</MatrixWidth>
          <MatrixHeight>8192</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>ETRS-TM35FIN:13</ows:Identifier>
          <ScaleDenominator>3571.4285714285716</ScaleDenominator>
          <TopLeftCorner>-2097152.0 9437184.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>20480</MatrixWidth>
          <MatrixHeight>16384</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>ETRS-TM35FIN:14</ows:Identifier>
          <ScaleDenominator>1785.7142857142858</ScaleDenominator>
          <TopLeftCorner>-2097152.0 9437184.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>40960</MatrixWidth>
          <MatrixHeight>32768</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>ETRS-TM35FIN:15</ows:Identifier>
          <ScaleDenominator>892.8571428571429</ScaleDenominator>
          <TopLeftCorner>-2097152.0 9437184.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>81920</MatrixWidth>
          <MatrixHeight>65536</MatrixHeight>
        </TileMatrix>
      </TileMatrixSet>
      <TileMatrixSet>
        <ows:Identifier>EPSG:900913</ows:Identifier>
        <ows:SupportedCRS>urn:ogc:def:crs:EPSG::900913</ows:SupportedCRS>
        <TileMatrix>
          <ows:Identifier>EPSG:900913:0</ows:Identifier>
          <ScaleDenominator>5.590822639508929E8</ScaleDenominator>
          <TopLeftCorner>-2.003750834E7 2.0037508E7</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>1</MatrixWidth>
          <MatrixHeight>1</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:900913:1</ows:Identifier>
          <ScaleDenominator>2.7954113197544646E8</ScaleDenominator>
          <TopLeftCorner>-2.003750834E7 2.0037508E7</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>2</MatrixWidth>
          <MatrixHeight>2</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:900913:2</ows:Identifier>
          <ScaleDenominator>1.3977056598772323E8</ScaleDenominator>
          <TopLeftCorner>-2.003750834E7 2.0037508E7</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>4</MatrixWidth>
          <MatrixHeight>4</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:900913:3</ows:Identifier>
          <ScaleDenominator>6.988528299386162E7</ScaleDenominator>
          <TopLeftCorner>-2.003750834E7 2.0037508E7</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>8</MatrixWidth>
          <MatrixHeight>8</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:900913:4</ows:Identifier>
          <ScaleDenominator>3.494264149693081E7</ScaleDenominator>
          <TopLeftCorner>-2.003750834E7 2.0037508E7</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>16</MatrixWidth>
          <MatrixHeight>16</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:900913:5</ows:Identifier>
          <ScaleDenominator>1.7471320748465404E7</ScaleDenominator>
          <TopLeftCorner>-2.003750834E7 2.0037508E7</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>32</MatrixWidth>
          <MatrixHeight>32</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:900913:6</ows:Identifier>
          <ScaleDenominator>8735660.374232702</ScaleDenominator>
          <TopLeftCorner>-2.003750834E7 2.0037508E7</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>64</MatrixWidth>
          <MatrixHeight>64</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:900913:7</ows:Identifier>
          <ScaleDenominator>4367830.187116351</ScaleDenominator>
          <TopLeftCorner>-2.003750834E7 2.0037508E7</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>128</MatrixWidth>
          <MatrixHeight>128</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:900913:8</ows:Identifier>
          <ScaleDenominator>2183915.0935581755</ScaleDenominator>
          <TopLeftCorner>-2.003750834E7 2.0037508E7</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>256</MatrixWidth>
          <MatrixHeight>256</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:900913:9</ows:Identifier>
          <ScaleDenominator>1091957.5467790877</ScaleDenominator>
          <TopLeftCorner>-2.003750834E7 2.0037508E7</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>512</MatrixWidth>
          <MatrixHeight>512</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:900913:10</ows:Identifier>
          <ScaleDenominator>545978.7733895439</ScaleDenominator>
          <TopLeftCorner>-2.003750834E7 2.0037508E7</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>1024</MatrixWidth>
          <MatrixHeight>1024</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:900913:11</ows:Identifier>
          <ScaleDenominator>272989.38669477194</ScaleDenominator>
          <TopLeftCorner>-2.003750834E7 2.0037508E7</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>2048</MatrixWidth>
          <MatrixHeight>2048</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:900913:12</ows:Identifier>
          <ScaleDenominator>136494.69334738597</ScaleDenominator>
          <TopLeftCorner>-2.003750834E7 2.0037508E7</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>4096</MatrixWidth>
          <MatrixHeight>4096</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:900913:13</ows:Identifier>
          <ScaleDenominator>68247.34667369298</ScaleDenominator>
          <TopLeftCorner>-2.003750834E7 2.0037508E7</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>8192</MatrixWidth>
          <MatrixHeight>8192</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:900913:14</ows:Identifier>
          <ScaleDenominator>34123.67333684649</ScaleDenominator>
          <TopLeftCorner>-2.003750834E7 2.0037508E7</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>16384</MatrixWidth>
          <MatrixHeight>16384</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:900913:15</ows:Identifier>
          <ScaleDenominator>17061.836668423246</ScaleDenominator>
          <TopLeftCorner>-2.003750834E7 2.0037508E7</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>32768</MatrixWidth>
          <MatrixHeight>32768</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:900913:16</ows:Identifier>
          <ScaleDenominator>8530.918334211623</ScaleDenominator>
          <TopLeftCorner>-2.003750834E7 2.0037508E7</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>65536</MatrixWidth>
          <MatrixHeight>65536</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:900913:17</ows:Identifier>
          <ScaleDenominator>4265.4591671058115</ScaleDenominator>
          <TopLeftCorner>-2.003750834E7 2.0037508E7</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>131072</MatrixWidth>
          <MatrixHeight>131072</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:900913:18</ows:Identifier>
          <ScaleDenominator>2132.7295835529058</ScaleDenominator>
          <TopLeftCorner>-2.003750834E7 2.0037508E7</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>262144</MatrixWidth>
          <MatrixHeight>262144</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:900913:19</ows:Identifier>
          <ScaleDenominator>1066.3647917764529</ScaleDenominator>
          <TopLeftCorner>-2.003750834E7 2.0037508E7</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>524288</MatrixWidth>
          <MatrixHeight>524288</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:900913:20</ows:Identifier>
          <ScaleDenominator>533.1823958882264</ScaleDenominator>
          <TopLeftCorner>-2.003750834E7 2.0037508E7</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>1048576</MatrixWidth>
          <MatrixHeight>1048576</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:900913:21</ows:Identifier>
          <ScaleDenominator>266.5911979441132</ScaleDenominator>
          <TopLeftCorner>-2.003750834E7 2.0037508E7</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>2097152</MatrixWidth>
          <MatrixHeight>2097152</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:900913:22</ows:Identifier>
          <ScaleDenominator>133.2955989720566</ScaleDenominator>
          <TopLeftCorner>-2.003750834E7 2.0037508E7</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>4194304</MatrixWidth>
          <MatrixHeight>4194304</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:900913:23</ows:Identifier>
          <ScaleDenominator>66.6477994860283</ScaleDenominator>
          <TopLeftCorner>-2.003750834E7 2.0037508E7</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>8388608</MatrixWidth>
          <MatrixHeight>8388608</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:900913:24</ows:Identifier>
          <ScaleDenominator>33.32389974301415</ScaleDenominator>
          <TopLeftCorner>-2.003750834E7 2.0037508E7</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>16777216</MatrixWidth>
          <MatrixHeight>16777216</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:900913:25</ows:Identifier>
          <ScaleDenominator>16.661949871507076</ScaleDenominator>
          <TopLeftCorner>-2.003750834E7 2.0037508E7</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>33554432</MatrixWidth>
          <MatrixHeight>33554432</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:900913:26</ows:Identifier>
          <ScaleDenominator>8.330974935753538</ScaleDenominator>
          <TopLeftCorner>-2.003750834E7 2.0037508E7</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>67108864</MatrixWidth>
          <MatrixHeight>67108864</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:900913:27</ows:Identifier>
          <ScaleDenominator>4.165487467876769</ScaleDenominator>
          <TopLeftCorner>-2.003750834E7 2.0037508E7</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>134217728</MatrixWidth>
          <MatrixHeight>134217728</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:900913:28</ows:Identifier>
          <ScaleDenominator>2.0827437339383845</ScaleDenominator>
          <TopLeftCorner>-2.003750834E7 2.0037508E7</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>268435456</MatrixWidth>
          <MatrixHeight>268435456</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:900913:29</ows:Identifier>
          <ScaleDenominator>1.0413718669691923</ScaleDenominator>
          <TopLeftCorner>-2.003750834E7 2.0037508E7</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>536870912</MatrixWidth>
          <MatrixHeight>536870912</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>EPSG:900913:30</ows:Identifier>
          <ScaleDenominator>0.5206859334845961</ScaleDenominator>
          <TopLeftCorner>-2.003750834E7 2.0037508E7</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>1073741824</MatrixWidth>
          <MatrixHeight>1073741824</MatrixHeight>
        </TileMatrix>
      </TileMatrixSet>
      <TileMatrixSet>
        <ows:Identifier>InspireCRS84Quad</ows:Identifier>
        <ows:SupportedCRS>urn:ogc:def:crs:EPSG::4326</ows:SupportedCRS>
        <TileMatrix>
          <ows:Identifier>InspireCRS84Quad:0</ows:Identifier>
          <ScaleDenominator>2.795411320143589E8</ScaleDenominator>
          <TopLeftCorner>-180.0 90.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>2</MatrixWidth>
          <MatrixHeight>1</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>InspireCRS84Quad:1</ows:Identifier>
          <ScaleDenominator>1.3977056600717944E8</ScaleDenominator>
          <TopLeftCorner>-180.0 90.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>4</MatrixWidth>
          <MatrixHeight>2</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>InspireCRS84Quad:2</ows:Identifier>
          <ScaleDenominator>6.988528300358972E7</ScaleDenominator>
          <TopLeftCorner>-180.0 90.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>8</MatrixWidth>
          <MatrixHeight>4</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>InspireCRS84Quad:3</ows:Identifier>
          <ScaleDenominator>3.494264150179486E7</ScaleDenominator>
          <TopLeftCorner>-180.0 90.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>16</MatrixWidth>
          <MatrixHeight>8</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>InspireCRS84Quad:4</ows:Identifier>
          <ScaleDenominator>1.747132075089743E7</ScaleDenominator>
          <TopLeftCorner>-180.0 90.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>32</MatrixWidth>
          <MatrixHeight>16</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>InspireCRS84Quad:5</ows:Identifier>
          <ScaleDenominator>8735660.375448715</ScaleDenominator>
          <TopLeftCorner>-180.0 90.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>64</MatrixWidth>
          <MatrixHeight>32</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>InspireCRS84Quad:6</ows:Identifier>
          <ScaleDenominator>4367830.1877243575</ScaleDenominator>
          <TopLeftCorner>-180.0 90.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>128</MatrixWidth>
          <MatrixHeight>64</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>InspireCRS84Quad:7</ows:Identifier>
          <ScaleDenominator>2183915.0938621787</ScaleDenominator>
          <TopLeftCorner>-180.0 90.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>256</MatrixWidth>
          <MatrixHeight>128</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>InspireCRS84Quad:8</ows:Identifier>
          <ScaleDenominator>1091957.5469310894</ScaleDenominator>
          <TopLeftCorner>-180.0 90.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>512</MatrixWidth>
          <MatrixHeight>256</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>InspireCRS84Quad:9</ows:Identifier>
          <ScaleDenominator>545978.7734655447</ScaleDenominator>
          <TopLeftCorner>-180.0 90.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>1024</MatrixWidth>
          <MatrixHeight>512</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>InspireCRS84Quad:10</ows:Identifier>
          <ScaleDenominator>272989.38673277234</ScaleDenominator>
          <TopLeftCorner>-180.0 90.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>2048</MatrixWidth>
          <MatrixHeight>1024</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>InspireCRS84Quad:11</ows:Identifier>
          <ScaleDenominator>136494.69336636632</ScaleDenominator>
          <TopLeftCorner>-180.0 90.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>4096</MatrixWidth>
          <MatrixHeight>2048</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>InspireCRS84Quad:12</ows:Identifier>
          <ScaleDenominator>68247.34668318316</ScaleDenominator>
          <TopLeftCorner>-180.0 90.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>8192</MatrixWidth>
          <MatrixHeight>4096</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>InspireCRS84Quad:13</ows:Identifier>
          <ScaleDenominator>34123.67334161145</ScaleDenominator>
          <TopLeftCorner>-180.0 90.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>16384</MatrixWidth>
          <MatrixHeight>8192</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>InspireCRS84Quad:14</ows:Identifier>
          <ScaleDenominator>17061.836670805726</ScaleDenominator>
          <TopLeftCorner>-180.0 90.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>32768</MatrixWidth>
          <MatrixHeight>16384</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>InspireCRS84Quad:15</ows:Identifier>
          <ScaleDenominator>8530.918335382985</ScaleDenominator>
          <TopLeftCorner>-180.0 90.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>65536</MatrixWidth>
          <MatrixHeight>32768</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>InspireCRS84Quad:16</ows:Identifier>
          <ScaleDenominator>4265.45916771137</ScaleDenominator>
          <TopLeftCorner>-180.0 90.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>131072</MatrixWidth>
          <MatrixHeight>65536</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>InspireCRS84Quad:17</ows:Identifier>
          <ScaleDenominator>2132.729583855685</ScaleDenominator>
          <TopLeftCorner>-180.0 90.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>262144</MatrixWidth>
          <MatrixHeight>131072</MatrixHeight>
        </TileMatrix>
      </TileMatrixSet>
      <TileMatrixSet>
        <ows:Identifier>GlobalCRS84Scale</ows:Identifier>
        <ows:SupportedCRS>urn:ogc:def:crs:EPSG::4326</ows:SupportedCRS>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Scale:0</ows:Identifier>
          <ScaleDenominator>5.0E8</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>2</MatrixWidth>
          <MatrixHeight>1</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Scale:1</ows:Identifier>
          <ScaleDenominator>2.5E8</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>3</MatrixWidth>
          <MatrixHeight>2</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Scale:2</ows:Identifier>
          <ScaleDenominator>1.0E8</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>6</MatrixWidth>
          <MatrixHeight>3</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Scale:3</ows:Identifier>
          <ScaleDenominator>5.0E7</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>12</MatrixWidth>
          <MatrixHeight>6</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Scale:4</ows:Identifier>
          <ScaleDenominator>2.5E7</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>23</MatrixWidth>
          <MatrixHeight>12</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Scale:5</ows:Identifier>
          <ScaleDenominator>1.0E7</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>56</MatrixWidth>
          <MatrixHeight>28</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Scale:6</ows:Identifier>
          <ScaleDenominator>5000000.0</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>112</MatrixWidth>
          <MatrixHeight>56</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Scale:7</ows:Identifier>
          <ScaleDenominator>2500000.0</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>224</MatrixWidth>
          <MatrixHeight>112</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Scale:8</ows:Identifier>
          <ScaleDenominator>1000000.0</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>560</MatrixWidth>
          <MatrixHeight>280</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Scale:9</ows:Identifier>
          <ScaleDenominator>500000.0</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>1119</MatrixWidth>
          <MatrixHeight>560</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Scale:10</ows:Identifier>
          <ScaleDenominator>250000.0</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>2237</MatrixWidth>
          <MatrixHeight>1119</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Scale:11</ows:Identifier>
          <ScaleDenominator>100000.0</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>5591</MatrixWidth>
          <MatrixHeight>2796</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Scale:12</ows:Identifier>
          <ScaleDenominator>50000.0</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>11182</MatrixWidth>
          <MatrixHeight>5591</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Scale:13</ows:Identifier>
          <ScaleDenominator>25000.0</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>22364</MatrixWidth>
          <MatrixHeight>11182</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Scale:14</ows:Identifier>
          <ScaleDenominator>10000.0</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>55909</MatrixWidth>
          <MatrixHeight>27955</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Scale:15</ows:Identifier>
          <ScaleDenominator>5000.0</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>111817</MatrixWidth>
          <MatrixHeight>55909</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Scale:16</ows:Identifier>
          <ScaleDenominator>2500.0</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>223633</MatrixWidth>
          <MatrixHeight>111817</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Scale:17</ows:Identifier>
          <ScaleDenominator>1000.0</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>559083</MatrixWidth>
          <MatrixHeight>279542</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Scale:18</ows:Identifier>
          <ScaleDenominator>500.0</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>1118165</MatrixWidth>
          <MatrixHeight>559083</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Scale:19</ows:Identifier>
          <ScaleDenominator>250.0</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>2236330</MatrixWidth>
          <MatrixHeight>1118165</MatrixHeight>
        </TileMatrix>
        <TileMatrix>
          <ows:Identifier>GlobalCRS84Scale:20</ows:Identifier>
          <ScaleDenominator>100.0</ScaleDenominator>
          <TopLeftCorner>90.0 -180.0</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>5590823</MatrixWidth>
          <MatrixHeight>2795412</MatrixHeight>
        </TileMatrix>
      </TileMatrixSet>
    </Contents>
    <ServiceMetadataURL xlink:href="https://mapservices.navici.com/basemaps/gwc/service/wmts?REQUEST=getcapabilities&amp;VERSION=1.0.0"/>
  </Capabilities>`
}
