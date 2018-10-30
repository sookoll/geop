export function initServiceWorker () {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then(registration => {
        console.log('SW registered: ', registration)
      }).catch(registrationError => {
        console.log('SW registration failed: ', registrationError)
      })
    })
  } else {
    console.log('Service Worker is not supported by browser.')
  }
}

// convert radians to degrees
export function radToDeg (rad) {
  return rad * 360 / (Math.PI * 2);
}

// convert degrees to radians
export function degToRad (deg) {
  return deg * Math.PI * 2 / 360;
}

// parse url
export function parseURL (href) {
  const match = href.match(/^(?:(https?:)\/\/)?(([^:/?#]*)(?::([0-9]+))?)([/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/);
  return match && {
    href: href,
    protocol: match[1],
    host: match[2],
    hostname: match[3],
    port: match[4],
    pathname: match[5],
    search: match[6],
    hash: match[7]
  }
}
