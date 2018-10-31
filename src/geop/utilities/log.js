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
  miniToastr.success(msg, defaults.title.success, defaults.timeout, cb)
}

function info (msg, cb) {
  miniToastr.info(msg, defaults.title.info, defaults.timeout, cb)
}

function warn (msg, cb) {
  miniToastr.warn(msg, defaults.title.warn, defaults.timeout, cb)
}

function error (msg, cb) {
  miniToastr.error(msg, defaults.title.error, defaults.timeout, cb)
}

export default function log (type, msg, cb) {
  switch (type) {
    case 'success':
      success(msg, cb)
      break
    case 'info':
      info(msg, cb)
      break
    case 'warn':
      warn(msg, cb)
      break
    case 'error':
      error(msg, cb)
      break
  }
}
