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

function debug (msg, cb) {
  (function (logger) {
    console.old = console.log;
    console.log = function () {
      var output = '', arg, i;
      for (i = 0; i < arguments.length; i++) {
        arg = arguments[i];
        let cl = 'log-' + (typeof arg);
        if (typeof arg === 'string') {
          if (arg.startsWith("ok ") || arg.startsWith("# pass ")) {
            cl += ' test-pass';
          } else if (arg.startsWith("not ok ") || arg.startsWith("# fail ")) {
            cl += ' test-fail';
          }
        }
        output += '<span class="' + cl + '">';

        if (
          typeof arg === "object" &&
          typeof JSON === "object" &&
          typeof JSON.stringify === "function"
        ) {
          output += JSON.stringify(arg);
        } else {
          output += arg;
        }
        output += "</span>&nbsp;";
      }
      logger.innerHTML += output + "<br>";
      console.old.apply(undefined, arguments);
    };
  })(document.getElementById("logger"));
  // console.error to DOM
  (function (logger) {
    console.olderror = console.error;
    console.error = function () {
      var output = '', arg, i;
      for (i = 0; i < arguments.length; i++) {
        arg = arguments[i];
        output += '<span class="error">';

        if (
          typeof arg === "object" &&
          typeof JSON === "object" &&
          typeof JSON.stringify === "function"
        ) {
          output += JSON.stringify(arg);
        } else {
          output += arg;
        }
        output += "</span>&nbsp;";
      }
      logger.innerHTML += output + "<br>";
      console.olderror.apply(undefined, arguments);
    };
  })(document.getElementById("logger"));
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
    case 'debug':
      debug(msg, cb)
      break
  }
}
