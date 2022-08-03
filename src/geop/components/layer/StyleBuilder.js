import Fill from 'ol/style/Fill'
import Stroke from 'ol/style/Stroke'
import Circle from 'ol/style/Circle'
import Icon from 'ol/style/Icon'
import Text from 'ol/style/Text'
import Style from 'ol/style/Style'
import RegularShape from 'ol/style/RegularShape'

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

function buildOLStyle (style) {
  let olStyle = {}
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
            fill: style[key].fill && new Fill(style[key].fill),
            stroke: style[key].stroke && new Stroke(style[key].stroke),
            radius: style[key].radius || 5
          })
          break
        case 'shape':
          if (style[key].fill) {
            style[key].fill = new Fill(style[key].fill)
          }
          if (style[key].stroke) {
            style[key].stroke = new Stroke(style[key].stroke)
          }
          olStyle['image'] = new RegularShape(style[key])
          break
        case 'icon':
          olStyle['image'] = new Icon(style[key])
          break
        case 'text':
          if (style[key].fill) {
            style[key].fill = new Fill(style[key].fill)
          }
          if (style[key].stroke) {
            style[key].stroke = new Stroke(style[key].stroke)
          }
          olStyle[key] = new Text(style[key])
          break
        // zIndex, geometry
        default:
          olStyle[key] = style[key]
      }
    }, this)
  } else {
    olStyle = getDefaultStyle()
  }
  return new Style(olStyle)
}

export function createStyle (conf) {
  if (typeof conf === 'function') {
    return (feature, resolution) => {
      return conf(feature, resolution, buildOLStyle)
    }
  } else if (Array.isArray(conf)) {
    return conf.map((style) => {
      return buildOLStyle(style)
    })
  } else {
    return buildOLStyle(conf)
  }
}

const labelStyle = new Style({
  text: new Text({
    font: '12px Calibri,sans-serif',
    overflow: true,
    fill: new Fill({
      color: '#000'
    }),
    stroke: new Stroke({
      color: '#fff',
      width: 2
    }),
    offsetY: -13
  })
})

export function addStyleLabels (layer) {
  const style = layer.getStyle()
  if (style instanceof Style) {
    layer.set('_style', style)
    layer.setStyle((feature) => {
      const label = feature.get('name')
      labelStyle.getText().setText(label)
      return [style, labelStyle]
    })
  }
  layer.set('labelsOn', true)
}

export function removeStyleLabels (layer) {
  const style = layer.get('_style')
  layer.setStyle(style)
  layer.set('labelsOn', false)
}
