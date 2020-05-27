class Dom {
  get (sel, parent = document, multiple = false) {
    return multiple
      ? parent.querySelectorAll(sel)
      : parent.querySelector(sel)
  }

  create (content) {
    const wrapper = document.createElement('div')
    wrapper.insertAdjacentHTML('beforeend', content.trim())
    return wrapper.firstChild// wrapper.childNodes
  }

  html (el, content) {
    el.innerHTML = content
  }

  append (el, content) {
    if (content instanceof window.Element || content instanceof window.HTMLDocument) {
      el.appendChild(content)
    } else {
      el.insertAdjacentHTML('beforeend', content)
    }
  }

  css (el, styles) {
    Object.keys(styles).forEach(key => {
      el.style[key] = styles[key]
    })
  }

  show (el) {
    if (el) {
      el.style.display = 'block'
    }
  }

  hide (el) {
    if (el) {
      el.style.display = 'none'
    }
  }

  toggle (el) {
    if (el) {
      if (!el.style.display || el.style.display === 'none') {
        this.show(el)
      } else {
        this.hide(el)
      }
    }
  }

  fadeOut (el, time, cb) {
    el.style.transition = time
    el.style.opacity = 0
    if (typeof cb === 'function') {
      setTimeout(cb, time + 1)
    }
  }

  on (type, el, clb) {
    el.addEventListener(type, clb)
  }

  off (type, el, clb) {
    el.removeEventListener(type, clb)
  }

  trigger (type, el) {
    const e = new window.Event(type)
    el.dispatchEvent(e)
  }
}
export default new Dom()
