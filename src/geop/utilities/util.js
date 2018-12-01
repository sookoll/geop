import NoSleep from 'nosleep.js'
import {getLength, getArea} from 'ol/sphere'

const noSleep = new NoSleep()
const debugStore = []

export function initServiceWorker () {
  /*if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(registration => {
        console.log('SW registered')
      }).catch(registrationError => {
        console.log('SW registration failed: ', registrationError)
      })
    })
  } else {
    console.log('Service Worker is not supported by browser.')
  }*/
  // Check for Service Worker browser support
  if ('serviceWorker' in navigator === false) {
    console.log('Service worker is not supported');
    return false;
  }
  // Logic to load our produced `sw.js`
  navigator.serviceWorker.register('/sw.js')
    .then(function(registration) {
      registration.onupdatefound = function() {
        if (navigator.serviceWorker.controller) {
          var installingWorker = registration.installing;
          installingWorker.onstatechange = function() {
            switch (installingWorker.state) {
              case 'installed':
                break;
              case 'redundant':
                throw new Error('The installing service worker became redundant.');
              default:
                // Ignore
            }
          };
        }
      };
    }).catch(function(e) {
      console.error('Error during service worker registration:', e);
    });
}

export function copy (str) {
  return new Promise((resolve, reject) => {
    try {
      const el = document.createElement('textarea')
      el.value = str
      el.style.position = 'absolute'
      el.style.left = '-9999px'
      document.body.appendChild(el)
      el.select()
      const successful = document.execCommand('copy')
      document.body.removeChild(el)
      if (successful) {
        resolve()
      } else {
        reject(Error(successful))
      }
    } catch (err) {
      reject(err)
    }
  })
}

export function initDebug () {
  // overwrite console.log, info and error
  ['debug', 'error', 'info'].forEach(method => {
    console[method + '_'] = console[method]
    console[method] = function () {
      const dt = new Date().toISOString()
      let output = dt
      for (let i = 0, len = arguments.length; i < len; i++) {
        const arg = arguments[i]
        output += ' ' + typeof arg
        if (
          typeof arg === "object" &&
          typeof JSON === "object" &&
          typeof JSON.stringify === "function"
        ) {
          const cache = []
          output += ' ' + JSON.stringify(arg, (key, value) => {
            if (typeof value === 'object' && value !== null) {
              if (cache.indexOf(value) !== -1) {
                // Duplicate reference found
                try {
                  // If this value does not reference a parent it can be deduped
                  return JSON.parse(JSON.stringify(value))
                } catch (error) {
                  // discard key if value cannot be deduped
                  return
                }
              }
              // Store value in our collection
              cache.push(value)
            }
            return value
          })
        } else {
          output += ' ' + arg
        }
      }
      debugStore.push(output)
      console[method + '_'].apply(undefined, arguments)
    }
  })
}

export function getDebugStore () {
  return debugStore
}

function enableNoSleep() {
  noSleep.enable()
  document.removeEventListener('click', enableNoSleep, false)
}

export function enableScreenLock () {
  document.addEventListener('click', enableNoSleep, false)
}

export function disableScreenLock () {
  noSleep.disable()
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
    return item + '=' + parsedURL.query[item]
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

export function formatLength (line) {
  const length = getLength(line)
  if (length > 10000) {
    return `${(Math.round(length / 1000 * 100) / 100)} km`
  } else {
    return `${(Math.round(length * 100) / 100)} m`
  }
}

export function formatArea (polygon) {
  const area = getArea(polygon)
  if (area > 1000000) {
    return `${(Math.round(area / 1000000 * 100) / 100)} km<sup>2</sup>`
  } else {
    return `${(Math.round(area * 100) / 100)} m<sup>2</sup>`
  }
}
