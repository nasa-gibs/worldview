// ===========================================================================
// Polyfills and browser quirks - DEPRECATED
// This file is full of lots of old hacks, that are kept around to avoid
// breaking things, but they should be removed when possible.
// Now that we're transpiling code, YOU SHOULD NOT ADD TO THIS FILE
// ===========================================================================

/* eslint-disable no-extend-native */

import $ from 'jquery';
import util from './util/util';

export function polyfill () {
  /*
   * Date.toISOString
   *
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
   */
  if (!Date.prototype.toISOString) {
    (function () {
      function pad (number) {
        if (number < 10) {
          return '0' + number;
        }
        return number;
      }

      Date.prototype.toISOString = function () {
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
    (function () {
      window.console = {
        log: function () {},
        warn: function () {},
        info: function () {},
        error: function () {}
      };
    })();
  }

  /*
   * Get rid of address bar on iphone/ipod
   */
  (function () {
    var execute = function () {
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
  (function () {
    window.scrollTo(0, 0);
  })();

  /*
   * setTimeout that properly sets this and allows arguments. The only case where
   * this is helpful at the moment is IE9 -- only attempt to do this in that case
   *
   * https://developer.mozilla.org/en-US/docs/Web/API/Window.setTimeout
   */
  if (util.browser.ie && util.browser.version <= 9) {
    (function () {
      var __nativeST__ = window.setTimeout;
      var __nativeSI__ = window.setInterval;

      window.setTimeout = function (vCallback, nDelay /*, argumentToPass1, argumentToPass2, etc. */) {
        var oThis = this;
        var aArgs = Array.prototype.slice.call(arguments, 2);
        return __nativeST__(vCallback instanceof Function ? function () {
          vCallback.apply(oThis, aArgs);
        } : vCallback, nDelay);
      };

      window.setInterval = function (vCallback, nDelay /*, argumentToPass1, argumentToPass2, etc. */) {
        var oThis = this;
        var aArgs = Array.prototype.slice.call(arguments, 2);
        return __nativeSI__(vCallback instanceof Function ? function () {
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
    (function () {
      String.prototype.contains = function (str, startIndex) {
        return String.prototype.indexOf.call(this, str,
          startIndex) !== -1;
      };
    })();
  }

  /*
   * String.startsWith
   *
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
   */
  if (!String.prototype.startsWith) {
    (function () {
      Object.defineProperty(String.prototype, 'startsWith', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: function (searchString, position) {
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
    (function () {
      Object.defineProperty(String.prototype, 'endsWith', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: function (searchString, position) {
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
  (function () {
    if (navigator.userAgent.match(/Android/i) ||
      navigator.userAgent.match(/webOS/i) ||
      navigator.userAgent.match(/iPhone/i) ||
      navigator.userAgent.match(/iPad/i) ||
      navigator.userAgent.match(/iPod/i) ||
      navigator.userAgent.match(/BlackBerry/i) ||
      navigator.userAgent.match(/Windows Phone/i)
    ) {
      var mobile = true;
    }

    if (navigator.userAgent.indexOf('iPhone') !== -1 || navigator.userAgent.indexOf('Android') !== -1) {
      addEventListener('load', function () {
        if (mobile) {
          $('.layerPicker a[href=\'#DataDownload\']')
            .hide();
        }
        setHeight();
        window.scrollTo(0, 1);
        $('#app, .ui-mobile, .ui-mobile .ui-page')
          .css('min-height', 0);
      }, false);
      addEventListener('orientationchange', function () {
        window.scrollTo(0, 1);
        setHeight();
      }, false);
    }

    // Set the div height
    function setHeight ($body) {
      if (navigator.userAgent.match(/(iPad|iPhone|iPod touch);.*CPU.*OS 6_\d/i)) {
        var newHeight = $(window)
          .height();
        // if mobileSafari 6 add +60px
        newHeight += 60;
        $('#app')
          .css('min-height', 0)
          .css('height', newHeight);
      } else {
        $('#app, .ui-mobile, .ui-mobile .ui-page')
          .css('min-height', 0);
      }
    }
  })();
}
