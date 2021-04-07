import { Fill, Stroke, Circle, Icon, Text, Style } from 'ol/style'
import { StyleFunction, Options } from 'ol/style/Style'
import RegularShape from 'ol/style/RegularShape'
import { StyleConfig } from '@/models/style-config'

function getDefaultStyle(): Options {
  const style: Options = {
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

function buildOLStyle(style: StyleConfig): Style {
  let olStyle: Options = {}
  if (style) {
    Object.keys(style).forEach((key) => {
      switch (key) {
        case 'stroke':
          olStyle.stroke = new Stroke(style[key])
          break
        case 'fill':
          olStyle.fill = new Fill(style[key])
          break
        case 'image':
        case 'circle':
          olStyle.image = new Circle({
            fill: style[key]?.fill && new Fill(style[key]?.fill),
            stroke: style[key]?.stroke && new Stroke(style[key]?.stroke),
            radius: style[key]?.radius || 5
          })
          break
        case 'shape': {
          const obj: any = Object.assign({}, style[key])
          if (style[key]?.fill) {
            obj.fill = new Fill(style[key]?.fill)
          }
          if (style[key]?.stroke) {
            obj.stroke = new Stroke(style[key]?.stroke)
          }
          olStyle.image = new RegularShape(obj)
          break
        }
        case 'icon':
          olStyle.image = new Icon(style[key])
          break
        case 'text': {
          const obj: any = Object.assign({}, style[key])
          if (style[key]?.fill) {
            obj.fill = new Fill(style[key]?.fill)
          }
          if (style[key]?.stroke) {
            obj.stroke = new Stroke(style[key]?.stroke)
          }
          olStyle.text = new Text(obj)
          break
        }
        // zIndex, geometry
        case 'zIndex':
          olStyle.zIndex = style[key]
          break
      }
    })
  } else {
    olStyle = getDefaultStyle()
  }
  return new Style(olStyle)
}

export function createStyle(
  conf: StyleConfig | StyleConfig[] | ((f: any, r: number, fn: any) => Style)
): Style | Style[] | StyleFunction {
  if (typeof conf === 'function') {
    return (feature, resolution) => {
      return conf(feature, resolution, buildOLStyle)
    }
  } else if (Array.isArray(conf)) {
    return conf.map((style: StyleConfig) => buildOLStyle(style))
  } else {
    return buildOLStyle(conf)
  }
}
