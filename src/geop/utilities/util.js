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

// parse search
function parseSearch (search) {
  if (search && search.length > 1) {
    try {
      return JSON.parse('{"' + search.slice(1).replace(/&/g, '","').replace(/=/g,'":"') + '"}', function (key, value) {
        return key === '' ? value : decodeURIComponent(value)
      })
    } catch (err) {
      return null
    }
  }
}

// parse url
export function parseURL (href) {
  const match = href.match(/^(?:(https?:)\/\/)?(([^:/?#]*)(?::([0-9]+))?)([/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/)
  return match && {
    href: href,
    protocol: match[1],
    host: match[2],
    hostname: match[3],
    port: match[4],
    pathname: match[5],
    search: match[6],
    hash: match[7],
    query: parseSearch(match[6])
  }
}

export function validURL (href) {
  const match = href.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g)
  return (match !== null)
}

export function constructURL (parsedURL) {
  const querystring = Object.keys(parsedURL.query).map(item => {
    return item + '=' + parsedURL.query
  }).join('&')
  return parsedURL.protocol + '//' + parsedURL.host + parsedURL.pathname + '?' + querystring;
}

export function uid () {
  return Math.random().toString(36).substr(2, 10)
}

export function randomColor() {
  const letters = '0123456789ABCDEF'
  let color = '#'
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color
}

export function hexToRgbA (hex, a) {
  let c
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split('')
    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]]
    }
    c = '0x' + c.join('')
    return 'rgba(' + [(c>>16)&255, (c>>8)&255, c&255].join(',') + ',' + a + ')'
  }
  throw new Error('Bad Hex')
}
