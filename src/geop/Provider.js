class Provider {
  clear () {
    if (this.xhr && typeof this.xhr.abort === 'function') {
      this.xhr.abort()
    }
  }
}

export default Provider
