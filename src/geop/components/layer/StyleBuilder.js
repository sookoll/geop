import Fill from 'ol/style/Fill'
import Stroke from 'ol/style/Stroke'
import Circle from 'ol/style/Circle'
import Icon from 'ol/style/Icon'
import Text from 'ol/style/Text'
import Style from 'ol/style/Style'

function getDefaultStyle () {
  const style = {
    fill: new Fill({
      color: 'rgba(255,255,255,0.4)'
    }),
    stroke: new Stroke({
      color: '#3399CC',
      width: 2
    })
  }
  style.image = new Circle({
    fill: style.fill,
    stroke: style.stroke,
    radius: 5
  })
  return style
}

function buildOLStyle (style, skipDefault) {
  const defaultStyle = getDefaultStyle()
  const olStyle = {}
  if (style) {
    Object.keys(style).forEach((key) => {
      switch (key) {
        case 'stroke':
          olStyle[key] = new Stroke(style[key])
          break
        case 'fill':
          olStyle[key] = new Fill(style[key])
          break
        case 'image':
        case 'circle':
          olStyle['image'] = new Circle({
            fill: new Fill(style[key].fill),
            stroke: new Stroke(style[key].stroke),
            radius: style[key].radius || 5
          })
          break
        case 'icon':
          olStyle['image'] = new Icon(style[key])
          break
        case 'text':
          olStyle[key] = new Text(style[key])
          break
        // zIndex, geometry
        default:
          olStyle[key] = style[key]
      }
    }, this)
  }
  return new Style(skipDefault ? olStyle: Object.assign(defaultStyle, olStyle))
}

export function createStyle (conf, skipDefault) {
  if (typeof conf === 'function') {
    return (feature) => {
      return conf(feature, buildOLStyle)
    }
  } else if (Array.isArray(conf)) {
    return conf.map((style) => {
      return buildOLStyle(style, skipDefault)
    })
  } else {
    return buildOLStyle(conf, skipDefault)
  }
}
