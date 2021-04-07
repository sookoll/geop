/**
 * Parse url string to URL
 * @param  href [description]
 * @return      [description]
 */
export function parseURL(href: string): URL {
  return new URL(href)
}

/**
 * convert radians to degrees
 * @param  rad [description]
 * @return     [description]
 */
export function radToDeg(rad: number): number {
  return (rad * 360) / (Math.PI * 2)
}

/**
 * convert degrees to radians
 * @param  deg [description]
 * @return     [description]
 */
export function degToRad(deg: number): number {
  return (deg * Math.PI * 2) / 360
}

/**
 * Make clone
 * @param  data [description]
 * @return      [description]
 */
export function deepCopy(data: any): any {
  return JSON.parse(JSON.stringify(data))
}

/**
 * Unique id
 * @return [description]
 */
export function uid(): string {
  return Math.random().toString(36).substr(2, 10)
}
