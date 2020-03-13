export default (function() {
  const self = {};

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
  self.chrome = false;

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
  self.mobileDevice = false;
  self.mobileAndTabletDevice = false;

  self.mobileWidth = 740;
  self.constrainedHeight = 320;

  const init = function() {
    const { tests } = self;

    if (tests.safari()) {
      self.safari = true;
      self.version = tests.safariVersion();
    } else if (tests.ie()) {
      self.ie = true;
      self.version = tests.ieVersion();
    } else if (tests.firefox()) {
      self.firefox = true;
    } else if (tests.chrome()) {
      self.chrome = true;
    }

    self.cors = tests.cors();
    self.webWorkers = tests.webWorkers();
    self.localStorage = tests.localStorage();
    self.small = tests.small();
    self.dimensions = self.tests.getWindowDimensions();
    self.history = tests.history();
    self.touchDevice = tests.touchDevice();
    self.mobileDevice = tests.mobileDevice();
    self.mobileAndTabletDevice = tests.mobileAndTabletDevice();

    const onResize = function() {
      self.small = tests.small();
      self.constrained = tests.constrained();
      self.dimensions = self.tests.getWindowDimensions();
    };
    $(window).on('resize', onResize);
    $(() => {
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
    const navigator = self.tests.navigator();
    if (/ Chrome\//.test(navigator.userAgent)) {
      return false;
    }
    return / Safari\//.test(navigator.userAgent);
  };
  self.tests.chrome = function() {
    // https://stackoverflow.com/a/9851769
    return !!window.chrome && !!window.chrome.webstore;
  };

  self.tests.safariVersion = function() {
    const navigator = self.tests.navigator();
    const version = navigator.userAgent.match(/ Version\/([^ ]+)/);
    if (version) {
      return parseInt(version[1].split('.')[0], 10);
    }
  };

  self.tests.ie = function() {
    const navigator = self.tests.navigator();
    if (/MSIE /.test(navigator.userAgent)) {
      return true;
    }
    // IE 11
    return (
      navigator.appName === 'Netscape' && /Trident/.test(navigator.userAgent)
    );
  };

  self.tests.firefox = function() {
    return navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
  };

  self.tests.touchDevice = function() {
    const el = document.createElement('div');
    el.setAttribute('ontouchstart', 'return;');
    return typeof el.ontouchstart === 'function';
  };

  // Detect mobile devices. Based on script here: https://stackoverflow.com/questions/11381673/detecting-a-mobile-browser#answer-11381730
  self.tests.mobileDevice = function() {
    let check = false;
    (function(a) {
      if (
        /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
          a,
        )
        || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw-(n|u)|c55\/|capi|ccwa|cdm-|cell|chtm|cldc|cmd-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc-s|devi|dica|dmob|do(c|p)o|ds(12|-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(-|_)|g1 u|g560|gene|gf-5|g-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd-(m|p|t)|hei-|hi(pt|ta)|hp( i|ip)|hs-c|ht(c(-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i-(20|go|ma)|i230|iac( |-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|-[a-w])|libw|lynx|m1-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|-([1-8]|c))|phil|pire|pl(ay|uc)|pn-2|po(ck|rt|se)|prox|psio|pt-g|qa-a|qc(07|12|21|32|60|-[2-7]|i-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h-|oo|p-)|sdk\/|se(c(-|0|1)|47|mc|nd|ri)|sgh-|shar|sie(-|m)|sk-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h-|v-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl-|tdg-|tel(i|m)|tim-|t-mo|to(pl|sh)|ts(70|m-|m3|m5)|tx-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas-|your|zeto|zte-/i.test(
          a.substr(0, 4),
        )
      ) {
        check = true;
      }
    }(navigator.userAgent || navigator.vendor || window.opera));
    return check;
  };

  // Detect mobile and tablet devices. Based on script here: https://stackoverflow.com/questions/11381673/detecting-a-mobile-browser#answer-11381730
  self.tests.mobileAndTabletDevice = function() {
    let check = false;
    (function(a) {
      if (
        /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(
          a,
        )
        || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw-(n|u)|c55\/|capi|ccwa|cdm-|cell|chtm|cldc|cmd-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc-s|devi|dica|dmob|do(c|p)o|ds(12|-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(-|_)|g1 u|g560|gene|gf-5|g-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd-(m|p|t)|hei-|hi(pt|ta)|hp( i|ip)|hs-c|ht(c(-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i-(20|go|ma)|i230|iac( |-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|-[a-w])|libw|lynx|m1-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|-([1-8]|c))|phil|pire|pl(ay|uc)|pn-2|po(ck|rt|se)|prox|psio|pt-g|qa-a|qc(07|12|21|32|60|-[2-7]|i-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h-|oo|p-)|sdk\/|se(c(-|0|1)|47|mc|nd|ri)|sgh-|shar|sie(-|m)|sk-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h-|v-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl-|tdg-|tel(i|m)|tim-|t-mo|to(pl|sh)|ts(70|m-|m3|m5)|tx-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas-|your|zeto|zte-/i.test(
          a.substr(0, 4),
        )
      ) {
        check = true;
      }
    }(navigator.userAgent || navigator.vendor || window.opera));
    return check;
  };

  self.tests.ieVersion = function() {
    const navigator = self.tests.navigator();
    // FIXME: linter says that the backslash in \d is unnessary which means
    // that this regex is probably wrong.
    var version = navigator.userAgent.match(/MSIE ([\d\.]+)/); //eslint-disable-line
    if (version) {
      return parseInt(version[1].split('.')[0], 10);
    }
  };

  self.tests.cors = function() {
    if (self.tests.safari() && self.tests.safariVersion() <= 6) {
      return false;
    }
    return !self.tests.ie();
  };

  // TODO: Probably can be removecd
  self.tests.webWorkers = function() {
    return self.tests.window('Worker');
  };

  self.tests.localStorage = function() {
    if (!self.tests.window('localStorage')) {
      return false;
    }
    try {
      const uid = new Date().toString();
      let result;
      localStorage.setItem(uid, uid);
      result = localStorage.getItem(uid) === uid;
      localStorage.removeItem(uid);
      return result && true;
    } catch (error) {
      return false;
    }
  };

  self.tests.small = function() {
    const dim = self.tests.getWindowDimensions();
    // If the dimensions are (0,0), this is not being run in a real browser
    // so assume desktop mode unless otherwise changed.
    if (dim[0] === 0 && dim[1] === 0) {
      return false;
    }
    return self.tests.getWindowDimensions()[0] < self.mobileWidth;
  };

  self.tests.getWindowDimensions = function() {
    return [$(window).width(), $(window).height()];
  };

  self.tests.constrained = function() {
    return self.tests.getWindowDimensions()[1] < self.constrainedHeight;
  };

  self.tests.history = function() {
    return window.history && window.history.replaceState;
  };

  init();
  return self;
}({}));
