import GPX from 'ol/format/GPX'
import Point from 'ol/geom/Point'
import LineString from 'ol/geom/LineString'
import MultiLineString from 'ol/geom/MultiLineString'
import Feature from 'ol/Feature'
import {transformWithOptions} from 'ol/format/Feature'
import GeometryLayout from 'ol/geom/GeometryLayout'
import {includes} from 'ol/array'
import {makeStructureNS, makeObjectPropertySetter, parseNode, pushParseAndPop,
  makeArrayPusher} from 'ol/xml'
import {readString, readDecimal, readNonNegativeInteger, readDateTime} from 'ol/format/xsd'
import xml2js from 'Utilities/xml2'

/**
 * @const
 * @type {Array<null|string>}
 */
const NAMESPACE_URIS = [
  null,
  'http://www.topografix.com/GPX/1/0',
  'http://www.topografix.com/GPX/1/1',
  'http://www.groundspeak.com/cache/1/0'
]
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
const LINK_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'text': makeObjectPropertySetter(readString, 'linkText'),
    'type': makeObjectPropertySetter(readString, 'linkType')
  }
)
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
const GPX_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'rte': makeArrayPusher(readRte),
    'trk': makeArrayPusher(readTrk),
    'wpt': makeArrayPusher(readWpt)
  }
)
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
const WPT_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'ele': makeObjectPropertySetter(readDecimal),
    'time': makeObjectPropertySetter(readDateTime),
    'magvar': makeObjectPropertySetter(readDecimal),
    'geoidheight': makeObjectPropertySetter(readDecimal),
    'name': makeObjectPropertySetter(readString),
    'cmt': makeObjectPropertySetter(readString),
    'desc': makeObjectPropertySetter(readString),
    'src': makeObjectPropertySetter(readString),
    'link': parseLink,
    'sym': makeObjectPropertySetter(readString),
    'type': makeObjectPropertySetter(readString),
    'fix': makeObjectPropertySetter(readString),
    'sat': makeObjectPropertySetter(readNonNegativeInteger),
    'hdop': makeObjectPropertySetter(readDecimal),
    'vdop': makeObjectPropertySetter(readDecimal),
    'pdop': makeObjectPropertySetter(readDecimal),
    'ageofdgpsdata': makeObjectPropertySetter(readDecimal),
    'dgpsid': makeObjectPropertySetter(readNonNegativeInteger),
    'extensions': parseExtensions
  }
)
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
const RTE_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'name': makeObjectPropertySetter(readString),
    'cmt': makeObjectPropertySetter(readString),
    'desc': makeObjectPropertySetter(readString),
    'src': makeObjectPropertySetter(readString),
    'link': parseLink,
    'number': makeObjectPropertySetter(readNonNegativeInteger),
    'extensions': parseExtensions,
    'type': makeObjectPropertySetter(readString),
    'rtept': parseRtePt
  }
)
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
const TRK_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'name': makeObjectPropertySetter(readString),
    'cmt': makeObjectPropertySetter(readString),
    'desc': makeObjectPropertySetter(readString),
    'src': makeObjectPropertySetter(readString),
    'link': parseLink,
    'number': makeObjectPropertySetter(readNonNegativeInteger),
    'type': makeObjectPropertySetter(readString),
    'extensions': parseExtensions,
    'trkseg': parseTrkSeg
  }
)
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
const RTEPT_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'ele': makeObjectPropertySetter(readDecimal),
    'time': makeObjectPropertySetter(readDateTime)
  }
)
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
const TRKSEG_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'trkpt': parseTrkPt
  }
)
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
const TRKPT_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'ele': makeObjectPropertySetter(readDecimal),
    'time': makeObjectPropertySetter(readDateTime)
  }
)

export default class GPXFormat extends GPX {
  constructor (opts = {}) {
    super(opts)
  }
  /**
   * @inheritDoc
   */
  readFeaturesFromNode (node, opts) {
    if (!includes(NAMESPACE_URIS, node.namespaceURI)) {
      return []
    }
    if (node.localName === 'gpx') {
      /** @type {Array<Feature>} */
      const features = pushParseAndPop([], GPX_PARSERS,
        node, [this.getReadOptions(node, opts)])
      if (features) {
        this.handleReadExtensions_(features)
        return features
      } else {
        return []
      }
    }
    return []
  }
}
/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function parseLink(node, objectStack) {
  const values = /** @type {Object} */ (objectStack[objectStack.length - 1])
  const href = node.getAttribute('href')
  if (href !== null) {
    values['link'] = href
  }
  parseNode(LINK_PARSERS, node, objectStack)
}
/**
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function parseExtensions(node, objectStack) {
  const values = /** @type {Object} */ (objectStack[objectStack.length - 1])
  values['extensionsNode_'] = node
}
/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Feature|undefined} Waypoint.
 */
function readWpt(node, objectStack) {
  const options = /** @type {import("./Feature.js").ReadOptions} */ (objectStack[0])
  const values = pushParseAndPop({}, WPT_PARSERS, node, objectStack)
  if (!values) {
    return undefined
  }
  const layoutOptions = /** @type {LayoutOptions} */ ({})
  const coordinates = appendCoordinate([], layoutOptions, node, values)
  const layout = applyLayoutOptions(layoutOptions, coordinates)
  const geometry = new Point(coordinates, layout)
  transformWithOptions(geometry, false, options)
  const feature = new Feature(geometry)
  feature.setProperties(values)
  //feature.set('wpt', xml2js(node))
  console.log(xml2js(node))
  return feature
}
/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {LayoutOptions} layoutOptions Layout options.
 * @param {Element} node Node.
 * @param {!Object} values Values.
 * @return {Array<number>} Flat coordinates.
 */
function appendCoordinate(flatCoordinates, layoutOptions, node, values) {
  flatCoordinates.push(
    parseFloat(node.getAttribute('lon')),
    parseFloat(node.getAttribute('lat')))
  if ('ele' in values) {
    flatCoordinates.push(/** @type {number} */ (values['ele']))
    delete values['ele']
    layoutOptions.hasZ = true
  } else {
    flatCoordinates.push(0)
  }
  if ('time' in values) {
    flatCoordinates.push(/** @type {number} */ (values['time']))
    delete values['time']
    layoutOptions.hasM = true
  } else {
    flatCoordinates.push(0)
  }
  return flatCoordinates
}
/**
 * Choose GeometryLayout based on flags in layoutOptions and adjust flatCoordinates
 * and ends arrays by shrinking them accordingly (removing unused zero entries).
 *
 * @param {LayoutOptions} layoutOptions Layout options.
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {Array<number>=} ends Ends.
 * @return {GeometryLayout} Layout.
 */
function applyLayoutOptions(layoutOptions, flatCoordinates, ends) {
  let layout = GeometryLayout.XY
  let stride = 2
  if (layoutOptions.hasZ && layoutOptions.hasM) {
    layout = GeometryLayout.XYZM
    stride = 4
  } else if (layoutOptions.hasZ) {
    layout = GeometryLayout.XYZ
    stride = 3
  } else if (layoutOptions.hasM) {
    layout = GeometryLayout.XYM
    stride = 3
  }
  if (stride !== 4) {
    for (let i = 0, ii = flatCoordinates.length / 4; i < ii; i++) {
      flatCoordinates[i * stride] = flatCoordinates[i * 4]
      flatCoordinates[i * stride + 1] = flatCoordinates[i * 4 + 1]
      if (layoutOptions.hasZ) {
        flatCoordinates[i * stride + 2] = flatCoordinates[i * 4 + 2]
      }
      if (layoutOptions.hasM) {
        flatCoordinates[i * stride + 2] = flatCoordinates[i * 4 + 3]
      }
    }
    flatCoordinates.length = flatCoordinates.length / 4 * stride
    if (ends) {
      for (let i = 0, ii = ends.length; i < ii; i++) {
        ends[i] = ends[i] / 4 * stride
      }
    }
  }
  return layout
}
/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Feature|undefined} Track.
 */
function readRte(node, objectStack) {
  const options = /** @type {import("./Feature.js").ReadOptions} */ (objectStack[0])
  const values = pushParseAndPop({
    'flatCoordinates': [],
    'layoutOptions': {}
  }, RTE_PARSERS, node, objectStack)
  if (!values) {
    return undefined
  }
  const flatCoordinates = /** @type {Array<number>} */
      (values['flatCoordinates'])
  delete values['flatCoordinates']
  const layoutOptions = /** @type {LayoutOptions} */ (values['layoutOptions'])
  delete values['layoutOptions']
  const layout = applyLayoutOptions(layoutOptions, flatCoordinates)
  const geometry = new LineString(flatCoordinates, layout)
  transformWithOptions(geometry, false, options)
  const feature = new Feature(geometry)
  feature.setProperties(values)
  return feature
}
/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Feature|undefined} Track.
 */
function readTrk(node, objectStack) {
  const options = /** @type {import("./Feature.js").ReadOptions} */ (objectStack[0]);
  const values = pushParseAndPop({
    'flatCoordinates': [],
    'ends': [],
    'layoutOptions': {}
  }, TRK_PARSERS, node, objectStack);
  if (!values) {
    return undefined;
  }
  const flatCoordinates = /** @type {Array<number>} */
      (values['flatCoordinates']);
  delete values['flatCoordinates'];
  const ends = /** @type {Array<number>} */ (values['ends']);
  delete values['ends'];
  const layoutOptions = /** @type {LayoutOptions} */ (values['layoutOptions']);
  delete values['layoutOptions'];
  const layout = applyLayoutOptions(layoutOptions, flatCoordinates, ends);
  const geometry = new MultiLineString(flatCoordinates, layout, ends);
  transformWithOptions(geometry, false, options);
  const feature = new Feature(geometry);
  feature.setProperties(values);
  return feature;
}
/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function parseRtePt(node, objectStack) {
  const values = pushParseAndPop({}, RTEPT_PARSERS, node, objectStack);
  if (values) {
    const rteValues = /** @type {!Object} */ (objectStack[objectStack.length - 1]);
    const flatCoordinates = /** @type {Array<number>} */ (rteValues['flatCoordinates']);
    const layoutOptions = /** @type {LayoutOptions} */ (rteValues['layoutOptions']);
    appendCoordinate(flatCoordinates, layoutOptions, node, values);
  }
}
/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function parseTrkSeg(node, objectStack) {
  const values = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  parseNode(TRKSEG_PARSERS, node, objectStack);
  const flatCoordinates = /** @type {Array<number>} */
      (values['flatCoordinates']);
  const ends = /** @type {Array<number>} */ (values['ends']);
  ends.push(flatCoordinates.length);
}
/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function parseTrkPt(node, objectStack) {
  const values = pushParseAndPop({}, TRKPT_PARSERS, node, objectStack);
  if (values) {
    const trkValues = /** @type {!Object} */ (objectStack[objectStack.length - 1]);
    const flatCoordinates = /** @type {Array<number>} */ (trkValues['flatCoordinates']);
    const layoutOptions = /** @type {LayoutOptions} */ (trkValues['layoutOptions']);
    appendCoordinate(flatCoordinates, layoutOptions, node, values);
  }
}
