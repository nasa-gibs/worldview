/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2014 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

/**
 * @module wv.util
 */
var wv = wv || {};
wv.util = wv.util || {};

/**
 * Feature detection and user-agent sniffing for web browser.
 *
 * Including this script will also install polyfills and work around
 * browser quirks as needed.
 *
 * @class wv.util.browser
 * @static
 */
wv.util.browser = wv.util.browser || (function() {

  var self = {};

  /**
   * True if Internet Explorer was detected in the user-agent string.
   *
   * @attribute ie
   * @type Boolean
   */
  self.ie = false;

  /**
   * True if Safari was detected in the user-agent string.
   *
   * @attribute safari
   * @type Boolean
   */
  self.safari = false;

  self.firefox = false;

  /**
   * Major version number of the browser detected in the user-agent string.
   * If the version is not important for Worldview at the moment, this
   * value will be null.
   *
   * @attribute version
   * @type Number
   */
  self.version = null;

  /**
   * True if the screen size is small enough (width less than 740px) to
   * require special mobile device behavior.
   *
   * @attribute small
   * @type Boolean
   */
  self.small = false;
  self.constrained = false;

  /**
   * True if this browser properly supports cross-origin resource
   * sharing.
   *
   * @attribute cors
   * @type Boolean
   */
  self.cors = true;

  /**
   * True if this browser properly supports web workers.
   *
   * @attribute webWorkers
   * @type Boolean
   */
  self.webWorkers = true;

  /**
   * True if local storage is available in the browser. This will return
   * false if local storage is supported, but cannot be used because
   * it is running in private mode.
   *
   * @attribute localStorage
   * @type Boolean
   */
  self.localStorage = false;
  self.history = true;
  self.touchDevice = false;

  self.mobileWidth = 740;
  self.constrainedHeight = 320;

  var init = function() {
    var tests = self.tests;

    if (tests.safari()) {
      self.safari = true;
      self.version = tests.safariVersion();
    } else if (tests.ie()) {
      self.ie = true;
      self.version = tests.ieVersion();
    } else if (tests.firefox()) {
      self.firefox = true;
    }

    self.cors = tests.cors();
    self.webWorkers = tests.webWorkers();
    self.localStorage = tests.localStorage();
    self.small = tests.small();
    self.history = tests.history();
    self.touchDevice = tests.touchDevice();

    var onResize = function() {
      self.small = tests.small();
      self.constrained = tests.constrained();
    };
    $(window)
      .on("resize", onResize);
    $(function() {
      onResize();
    });
  };

  // The following functions should not be used directly. Use the values
  // set in the init function. These functions are useful for testing.
  self.tests = {};

  self.tests.navigator = function() {
    return navigator;
  };

  self.tests.window = function(property) {
    // Some browsers throw an error when attempting to access restricted Window objects
    try {
      return window[property];
    } catch (error) {
      return false;
    }
  };

  self.tests.safari = function() {
    var navigator = self.tests.navigator();
    if (/ Chrome\//.test(navigator.userAgent)) {
      return false;
    }
    return (/ Safari\//)
      .test(navigator.userAgent);
  };

  self.tests.safariVersion = function() {
    var navigator = self.tests.navigator();
    var version = navigator.userAgent.match(/ Version\/([^ ]+)/);
    if (version) {
      return parseInt(version[1].split(".")[0]);
    }
  };

  self.tests.ie = function() {
    var navigator = self.tests.navigator();
    if (/MSIE /.test(navigator.userAgent)) {
      return true;
    }
    // IE 11
    return navigator.appName === "Netscape" && /Trident/.test(navigator.userAgent);
  };

  self.tests.firefox = function() {
    return navigator.userAgent.toLowerCase()
      .indexOf("firefox") > -1;
  };

  self.tests.touchDevice = function() {
    var el = document.createElement('div');
    el.setAttribute('ontouchstart', 'return;');
    return typeof el.ontouchstart === "function";
  };

  self.tests.ieVersion = function() {
    var navigator = self.tests.navigator();
    var version = navigator.userAgent.match(/MSIE ([\d\.]+)/);
    if (version) {
      return parseInt(version[1].split(".")[0]);
    }
  };

  self.tests.cors = function() {
    if (self.tests.safari() && self.tests.safariVersion() <= 6) {
      return false;
    }
    return !self.tests.ie();
  };

  self.tests.webWorkers = function() {
    return self.tests.window("Worker");
  };

  self.tests.localStorage = function() {
    if (!self.tests.window("localStorage")) {
      return false;
    }
    try {
      var uid = new Date();
      var result;
      localStorage.setItem(uid, uid);
      result = localStorage.getItem(uid) == uid;
      localStorage.removeItem(uid);
      return result && true;
    } catch (error) {
      return false;
    }
  };

  self.tests.small = function() {
    return $(window)
      .width() < self.mobileWidth;
  };

  self.tests.constrained = function() {
    return $(window)
      .height() < self.constrainedHeight;
  };

  self.tests.history = function() {
    return window.history && window.history.replaceState;
  };

  init();
  return self;

})();

// ===========================================================================
// Polyfills and browser quirks
// ===========================================================================

/*
 * Date.toISOString
 *
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
 */
if (!Date.prototype.toISOString) {
  (function() {

    function pad(number) {
      if (number < 10) {
        return '0' + number;
      }
      return number;
    }

    Date.prototype.toISOString = function() {
      return this.getUTCFullYear() +
        '-' + pad(this.getUTCMonth() + 1) +
        '-' + pad(this.getUTCDate()) +
        'T' + pad(this.getUTCHours()) +
        ':' + pad(this.getUTCMinutes()) +
        ':' + pad(this.getUTCSeconds()) +
        '.' + (this.getUTCMilliseconds() / 1000)
        .toFixed(3)
        .slice(2, 5) +
        'Z';
    };
  }());
}

/*
 * console
 */
if (!window.console) {
  (function() {
    window.console = {
      log: function() {},
      warn: function() {},
      info: function() {},
      error: function() {}
    };
  })();
}

/*
 * jQuery version 1.6 causes thousands of warnings to be emitted to the
 * console on WebKit based browsers with the following message:
 *
 * event.layerX and event.layerY are broken and deprecated in WebKit. They
 * will be removed from the engine in the near future.
 *
 * This has been fixed in jQuery 1.8 but Worldview currently doesn't
 * support that version. This fix copied from:
 *
 * http://stackoverflow.com/questions/7825448/webkit-issues-with-event-layerx-and-event-layery
 */
(function() {
  // remove layerX and layerY
  var all = $.event.props,
    len = all.length,
    res = [];
  while (len--) {
    var el = all[len];
    if (el != 'layerX' && el != 'layerY') res.push(el);
  }
  $.event.props = res;
})();

/*
 * Get rid of address bar on iphone/ipod
 */
(function() {
  var execute = function() {
    window.scrollTo(0, 0);
    if (document.body) {
      document.body.style.height = '100%';
      if (!(/(iphone|ipod)/.test(navigator.userAgent.toLowerCase()))) {
        if (document.body.parentNode) {
          document.body.parentNode.style.height = '100%';
        }
      }
    }
  };
  setTimeout(execute, 700);
  setTimeout(execute, 1500);
})();

/*
 * Hide the URL bar
 */
(function() {
  window.scrollTo(0, 0);
})();

/*
 * setTimeout that properly sets this and allows arguments. The only case where
 * this is helpful at the moment is IE9 -- only attempt to do this in that case
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/Window.setTimeout
 */
if (wv.util.browser.ie && wv.util.browser.version <= 9) {
  (function() {

    var __nativeST__ = window.setTimeout,
      __nativeSI__ = window.setInterval;

    window.setTimeout = function(vCallback, nDelay /*, argumentToPass1, argumentToPass2, etc. */ ) {
      var oThis = this,
        aArgs = Array.prototype.slice.call(arguments, 2);
      return __nativeST__(vCallback instanceof Function ? function() {
        vCallback.apply(oThis, aArgs);
      } : vCallback, nDelay);
    };

    window.setInterval = function(vCallback, nDelay /*, argumentToPass1, argumentToPass2, etc. */ ) {
      var oThis = this,
        aArgs = Array.prototype.slice.call(arguments, 2);
      return __nativeSI__(vCallback instanceof Function ? function() {
        vCallback.apply(oThis, aArgs);
      } : vCallback, nDelay);
    };
  })();
}

/*
 * String.contains
 *
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/contains
 */
if (!('contains' in String.prototype)) {
  (function() {
    String.prototype.contains = function(str, startIndex) {
      return -1 !== String.prototype.indexOf.call(this, str,
        startIndex);
    };
  })();
}

/*
 * String.startsWith
 *
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
 */
if (!String.prototype.startsWith) {
  (function() {
    Object.defineProperty(String.prototype, 'startsWith', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: function(searchString, position) {
        position = position || 0;
        return this.indexOf(searchString, position) === position;
      }
    });
  })();
}

/*
 * String.endsWith
 *
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith
 */
if (!String.prototype.endsWith) {
  (function() {
    Object.defineProperty(String.prototype, 'endsWith', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: function(searchString, position) {
        position = position || this.length;
        position = position - searchString.length;
        var lastIndex = this.lastIndexOf(searchString);
        return lastIndex !== -1 && lastIndex === position;
      }
    });
  })();
}

/*
 * Mobile device quirks.  This section is mostly overwriting things that jquery.mobile is adding
 */
(function() {
  if (navigator.userAgent.match(/Android/i) ||
    navigator.userAgent.match(/webOS/i) ||
    navigator.userAgent.match(/iPhone/i) ||
    navigator.userAgent.match(/iPad/i) ||
    navigator.userAgent.match(/iPod/i) ||
    navigator.userAgent.match(/BlackBerry/i) ||
    navigator.userAgent.match(/Windows Phone/i)
  ) {
    mobile = true;
    if (!(window.orientation == 90 || window.orientation == -90)) {
      portrait = true;
    }
  }


  if (navigator.userAgent.indexOf('iPhone') != -1 || navigator.userAgent.indexOf('Android') != -1) {
    // In Safari, the true version is after "Safari"
    if (navigator.userAgent.indexOf('Safari') != -1) {
      // Set a variable to use later
      mobileSafari = true;
    }
    addEventListener("load", function() {
      if (mobile) {
        $(".layerPicker a[href='#DataDownload']")
          .hide();
      }
      setHeight();
      window.scrollTo(0, 1);
      $("#app, .ui-mobile, .ui-mobile .ui-page")
        .css("min-height", 0);
    }, false);
    addEventListener("orientationchange", function() {
      window.scrollTo(0, 1);
      setHeight();
    }, false);
  }

  // Set the div height
  function setHeight($body) {
    if (navigator.userAgent.match(/(iPad|iPhone|iPod touch);.*CPU.*OS 6_\d/i)) {
      var new_height = $(window)
        .height();
      // if mobileSafari 6 add +60px
      new_height += 60;
      $('#app')
        .css('min-height', 0)
        .css('height', new_height);
    } else {
      $("#app, .ui-mobile, .ui-mobile .ui-page")
        .css("min-height", 0);
    }
  }

  $(window)
    .on("touchmove", function(event) {
      if (!event.target.classList.contains("scrollable")) {
        event.preventDefault();
      }
    }, false);

})();
