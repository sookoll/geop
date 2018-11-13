import miniToastr from 'mini-toastr'

// init
miniToastr.init({
  timeout: 4000
})

function success (msg, cb) {
  miniToastr.success(msg, undefined, undefined, cb)
}

function info (msg, cb) {
  miniToastr.info(msg, undefined, undefined, cb)
}

function warn (msg, cb) {
  miniToastr.warn(msg, undefined, undefined, cb)
}

function error (msg, cb) {
  miniToastr.error(msg, undefined, undefined, cb)
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
