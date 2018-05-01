import $ from 'jquery';

export default (function () {
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

  var init = function () {
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

    var onResize = function () {
      self.small = tests.small();
      self.constrained = tests.constrained();
    };
    $(window)
      .on('resize', onResize);
    $(function () {
      onResize();
    });
  };

  // The following functions should not be used directly. Use the values
  // set in the init function. These functions are useful for testing.
  self.tests = {};

  self.tests.navigator = function () {
    return navigator;
  };

  self.tests.window = function (property) {
    // Some browsers throw an error when attempting to access restricted Window objects
    try {
      return window[property];
    } catch (error) {
      return false;
    }
  };

  self.tests.safari = function () {
    var navigator = self.tests.navigator();
    if (/ Chrome\//.test(navigator.userAgent)) {
      return false;
    }
    return (/ Safari\//)
      .test(navigator.userAgent);
  };

  self.tests.safariVersion = function () {
    var navigator = self.tests.navigator();
    var version = navigator.userAgent.match(/ Version\/([^ ]+)/);
    if (version) {
      return parseInt(version[1].split('.')[0]);
    }
  };

  self.tests.ie = function () {
    var navigator = self.tests.navigator();
    if (/MSIE /.test(navigator.userAgent)) {
      return true;
    }
    // IE 11
    return navigator.appName === 'Netscape' && /Trident/.test(navigator.userAgent);
  };

  self.tests.firefox = function () {
    return navigator.userAgent.toLowerCase()
      .indexOf('firefox') > -1;
  };

  self.tests.touchDevice = function () {
    var el = document.createElement('div');
    el.setAttribute('ontouchstart', 'return;');
    return typeof el.ontouchstart === 'function';
  };

  self.tests.ieVersion = function () {
    var navigator = self.tests.navigator();
    // FIXME: linter says that the backslash in \d is unnessary which means
    // that this regex is probably wrong.
    var version = navigator.userAgent.match(/MSIE ([\d\.]+)/); //eslint-disable-line
    if (version) {
      return parseInt(version[1].split('.')[0]);
    }
  };

  self.tests.cors = function () {
    if (self.tests.safari() && self.tests.safariVersion() <= 6) {
      return false;
    }
    return !self.tests.ie();
  };

  self.tests.webWorkers = function () {
    return self.tests.window('Worker');
  };

  self.tests.localStorage = function () {
    if (!self.tests.window('localStorage')) {
      return false;
    }
    try {
      var uid = new Date().toString();
      var result;
      localStorage.setItem(uid, uid);
      result = localStorage.getItem(uid) === uid;
      localStorage.removeItem(uid);
      return result && true;
    } catch (error) {
      return false;
    }
  };

  self.tests.small = function () {
    return self.tests.getWindowDimensions()[0] < self.mobileWidth;
  };

  self.tests.getWindowDimensions = function () {
    return [$(window).width(), $(window).height()];
  };

  self.tests.constrained = function () {
    return self.tests.getWindowDimensions()[1] < self.constrainedHeight;
  };

  self.tests.history = function () {
    return window.history && window.history.replaceState;
  };

  init();
  return self;
})({});
