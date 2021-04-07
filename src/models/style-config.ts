export interface FillType {
  color: string
}
export interface StrokeType {
  color: string
  width: number
}
export interface ShapeType {
  fill: FillType
  stroke: StrokeType
  radius?: number
}
export interface IconType {

}
export interface TextType {
  fill: FillType
  stroke: StrokeType
}
export interface StyleConfig {
  fill?: FillType
  stroke?: StrokeType
  image?: ShapeType
  circle?: ShapeType
  shape?: ShapeType
  icon: IconType
  text?: TextType
  zIndex?: number
}
