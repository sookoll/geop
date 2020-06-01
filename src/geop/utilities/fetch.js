const defaults = {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  },
  mode: 'cors'
}
class Fetch {
  constructor (options = {}) {
    this.options = Object.assign({}, defaults, options)
    this.abortController = null
  }

  get (url, options = {}) {
    options = Object.assign({}, this.options, options)
    return this.fetch(url, options)
  }

  post (url, options = {}) {
    options = Object.assign({}, this.options, options)
    options.method = 'POST'
    return this.fetch(url, options)
  }

  delete (url, options = {}) {
    options = Object.assign({}, this.options, options)
    options.method = 'DELETE'
    return this.fetch(url, options)
  }

  abort () {
    if (this.abortController && typeof this.abortController.abort === 'function') {
      this.abortController.abort()
    }
  }

  fetch (url, options = {}) {
    url = this.formatUrl(url, options)
    this.abortController = new window.AbortController()
    options.signal = this.abortController.signal
    return new Promise((resolve, reject) => {
      window.fetch(url, options)
        .then(response => {
          if (
            'headers' in options &&
            'Content-Type' in options.headers &&
            options.headers['Content-Type'] === 'application/json'
          ) {
            return response.json()
          } else {
            return response.text()
          }
        })
        .then(response => resolve(response))
        .catch(err => {
          if (err.name === 'AbortError') {
            resolve()
          } else {
            reject(err)
          }
        })
    })
  }

  formatUrl (url, options = {}) {
    url = new URL(url)
    if ('params' in options) {
      Object.keys(options.params).forEach(key => url.searchParams.append(key, options.params[key]))
      delete options.params
    }
    return url
  }
}

export default Fetch
