import miniToastr from 'mini-toastr'

const defaults = {
  title: {
    success: 'Success',
    info: 'Info',
    warn: 'Warning',
    error: 'Error'
  },
  timeout: 5000
}

// init
miniToastr.init()

function success (msg, cb) {
  miniToastr.success(msg, undefined, defaults.timeout, cb)
}

function info (msg, cb) {
  miniToastr.info(msg, undefined, defaults.timeout, cb)
}

function warn (msg, cb) {
  miniToastr.warn(msg, undefined, defaults.timeout, cb)
}

function error (msg, cb) {
  miniToastr.error(msg, undefined, defaults.timeout, cb)
}

export default function log (type, msg, cb) {
  switch (type) {
    case 'success':
      success(msg, cb)
      break
    case 'info':
      info(msg, cb)
      break
    case 'warning':
      warn(msg, cb)
      break
    case 'error':
      error(msg, cb)
      break
  }
}
