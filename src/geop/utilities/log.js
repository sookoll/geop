import miniToastr from 'mini-toastr'

const timeout = 4000

// init
miniToastr.init({
  timeout
})

function success (msg, cb) {
  miniToastr.success(msg, '', undefined, cb)
}

function info (msg, cb) {
  miniToastr.info(msg, '', undefined, cb)
}

function warn (msg, cb) {
  miniToastr.warn(msg, '', undefined, cb)
}

function error (msg, cb) {
  miniToastr.error(msg, '', undefined, cb)
}

export default function log (type, msg, cb) {
  switch (type) {
    case 'success':
      success(msg)
      break
    case 'info':
      info(msg)
      break
    case 'warning':
      warn(msg)
      break
    case 'error':
      error(msg)
      break
  }
  if (typeof cb === 'function') {
    setTimeout(cb, timeout)
  }
}
