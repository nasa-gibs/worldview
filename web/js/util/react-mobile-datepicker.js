/* eslint-disable */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('react'), require('react-dom')) :
	typeof define === 'function' && define.amd ? define(['react', 'react-dom'], factory) :
	(global.reactMobileDatePicker = factory(global.React,global.ReactDOM));
}(this, (function (React,ReactDOM) { 'use strict';

function __$styleInject(css, ref) {
  if ( ref === void 0 ) ref = {};
  var insertAt = ref.insertAt;

  if (!css || typeof document === 'undefined') { return; }

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var React__default = 'default' in React ? React['default'] : React;
ReactDOM = ReactDOM && ReactDOM.hasOwnProperty('default') ? ReactDOM['default'] : ReactDOM;

__$styleInject(".datepicker-modal {\n    position: absolute;\n    right: 0;\n    bottom: 0;\n    width: 100%;\n    height: 100%;\n    background-color: rgba(0, 0, 0, .6);\n    z-index: 999;\n    display: -webkit-box;\n    display: -ms-flexbox;\n    display: flex;\n    -webkit-box-align: center;\n        -ms-flex-align: center;\n            align-items: center;\n    -webkit-box-pack: center;\n        -ms-flex-pack: center;\n            justify-content: center;\n}\n\n.datepicker {\n    position: absolute;\n    left: 0;\n    bottom: 0;\n    width: 100%;\n    z-index: 1;\n    font-size: 16px;\n    text-align: center;\n    font-family: arial,verdana,sans-serif;\n    -webkit-box-sizing: content-box;\n            box-sizing: content-box;\n    -webkit-font-smoothing: antialiased;\n    -webkit-user-select: none;\n       -moz-user-select: none;\n        -ms-user-select: none;\n            user-select: none;\n}\n\n.datepicker .datepicker-header {\n        padding: 0 .5em;\n        min-height: 2em;\n        line-height: 2em;\n        font-size: 1.125em;\n    }\n\n.datepicker .datepicker-navbar {\n        padding: 0 .5em .5em .5em;\n        overflow: hidden;\n    }\n\n.datepicker .datepicker-navbar-btn {\n        height: 2.5em;\n        line-height: 2.5em;\n        float: right;\n        padding: 0 1em;\n        cursor: pointer;\n    }\n\n.datepicker .datepicker-caption {\n        display: -webkit-box;\n        display: -ms-flexbox;\n        display: flex;\n        padding: .5em .25em;\n    }\n\n.datepicker .datepicker-caption-item {\n        -webkit-box-flex: 1;\n            -ms-flex: 1;\n                flex: 1;\n        margin: 0 .25em;\n        height: 40px;\n        line-height: 40px;\n        font-size: 1.2em;\n    }\n\n.datepicker .datepicker-content {\n        display: -webkit-box;\n        display: -ms-flexbox;\n        display: flex;\n        padding: .5em .25em;\n    }\n\n.datepicker .datepicker-col-1 {\n        -webkit-box-flex: 1;\n            -ms-flex: 1;\n                flex: 1;\n        margin: 0 .25em;\n    }\n\n.datepicker .datepicker-viewport {\n        height: 200px;\n        position: relative;\n        overflow: hidden\n    }\n\n.datepicker .datepicker-viewport::after {\n    content: '';\n    position: absolute;\n    z-index: 2;\n    top: 0;\n    right: 0;\n    bottom: 0;\n    left: 0;\n    pointer-events: none;\n}\n\n.datepicker .datepicker-wheel {\n        position: absolute;\n        height: 40px;\n        top: 50%;\n        margin-top: -20px;\n        width: 100%;\n    }\n\n.datepicker .datepicker-scroll {\n        list-style-type: none;\n        padding: 0\n    }\n\n.datepicker .datepicker-scroll>li {\n    height: 40px;\n    line-height: 40px;\n    font-size: 1.375em;\n    cursor: pointer;\n}\n\n.datepicker {\n\n    /* default */\n}\n\n.datepicker.default {\n    background-color: #f7f7f7;\n}\n\n.datepicker.default .datepicker-header {\n            color: #4eccc4;\n}\n\n.datepicker.default .datepicker-wheel {\n            border-top: 1px solid #4eccc4;\n            border-bottom: 1px solid #4eccc4;\n}\n\n.datepicker.default .datepicker-caption-item {\n            color: rgb(59, 59, 59);\n}\n\n.datepicker.default .datepicker-scroll li {\n                color: rgb(59, 59, 59);\n            }\n\n.datepicker.default .datepicker-scroll li.disabled {\n                color: rgb(191, 191, 191);\n            }\n\n.datepicker.default .datepicker-navbar-btn {\n            color: #4eccc4;\n}\n\n.datepicker {\n\n    /* dark */\n}\n\n.datepicker.dark {\n    background-color: #263238;\n}\n\n.datepicker.dark .datepicker-header {\n            color: #50ccc4;\n}\n\n.datepicker.dark .datepicker-wheel {\n            border-top: 1px solid #50ccc4;\n            border-bottom: 1px solid #50ccc4;\n}\n\n.datepicker.dark .datepicker-caption-item {\n            color: rgb(201, 203, 204);\n}\n\n.datepicker.dark .datepicker-scroll li {\n                color: rgb(201, 203, 204);\n            }\n\n.datepicker.dark .datepicker-scroll li.disabled {\n                color: rgb(87, 96, 100);\n            }\n\n.datepicker.dark .datepicker-navbar-btn {\n            color: #50ccc4;\n}\n\n.datepicker {\n\n    /* ios */\n}\n\n.datepicker.ios {\n    background-color: #f7f7f7;\n}\n\n.datepicker.ios .datepicker-col-1 {margin: 0;\n}\n\n.datepicker.ios .datepicker-header {\n            color: rgb(59, 59, 59);\n            padding: 0 3.5em;\n}\n\n.datepicker.ios .datepicker-viewport::after {\n    background: -webkit-gradient(linear,left top, left bottom,from(#f7f7f7),color-stop(52%, rgba(245, 245, 245, 0)),color-stop(48%, rgba(245, 245, 245, 0)),to(#f7f7f7));\n    background: linear-gradient(#f7f7f7,rgba(245, 245, 245, 0)52%,rgba(245, 245, 245, 0)48%,#f7f7f7);\n}\n\n.datepicker.ios .datepicker-wheel {\n            border-top: 1px solid #dbdbdb;\n            border-bottom: 1px solid #dbdbdb;\n}\n\n.datepicker.ios .datepicker-caption-item {\n            color: rgb(59, 59, 59);\n}\n\n.datepicker.ios .datepicker-scroll li {\n                color: rgb(59, 59, 59);\n            }\n\n.datepicker.ios .datepicker-scroll li.disabled {\n                color: rgb(191, 191, 191);\n            }\n\n.datepicker.ios .datepicker-navbar {\n            position: absolute;\n            z-index: 2;\n            top: 0;\n            left: 0;\n            width: 100%;\n            padding: 0;\n            border-bottom: 1px solid #acacac;\n}\n\n.datepicker.ios .datepicker-navbar-btn {\n            color: #007aff;\n}\n\n.datepicker.ios .datepicker-navbar-btn:nth-child(2) {\n    float: left;\n}\n\n.datepicker.ios .datepicker-content {\n            padding-top: 48px;\n}\n\n.datepicker.ios .datepicker-header + .datepicker-content {\n          padding-top: 0;\n}\n\n.datepicker.ios .datepicker-caption + .datepicker-content {\n          padding-top: 0;\n}\n\n.datepicker {\n\n    /* android */\n}\n\n.datepicker.android, .datepicker.android-dark {\n    background-color: #f5f5f5;\n}\n\n.datepicker.android .datepicker-header, .datepicker.android-dark .datepicker-header {\n            color: #31b6e7;\n            border-bottom: 2px solid #31b6e7;\n}\n\n.datepicker.android .datepicker-col-1, .datepicker.android-dark .datepicker-col-1 {margin: 0 .625em;\n}\n\n.datepicker.android .datepicker-viewport::after, .datepicker.android-dark .datepicker-viewport::after {\n    background-image: -webkit-gradient(linear,left top, left bottom,from(#f5f5f5),color-stop(52%, rgba(245, 245, 245, 0)),color-stop(48%, rgba(245, 245, 245, 0)),to(#f5f5f5));\n    background-image: linear-gradient(#f5f5f5,rgba(245, 245, 245, 0)52%,rgba(245, 245, 245, 0)48%,#f5f5f5);\n}\n\n.datepicker.android .datepicker-wheel, .datepicker.android-dark .datepicker-wheel {\n            border-top: 2px solid #31b6e7;\n            border-bottom: 2px solid #31b6e7;\n}\n\n.datepicker.android .datepicker-caption-item, .datepicker.android-dark .datepicker-caption-item {\n            color: rgb(56, 56, 56);\n}\n\n.datepicker.android .datepicker-scroll li, .datepicker.android-dark .datepicker-scroll li {\n                font-size: 1.125em;\n                color: rgb(56, 56, 56);\n            }\n\n.datepicker.android .datepicker-scroll li.disabled, .datepicker.android-dark .datepicker-scroll li.disabled {\n                color: rgb(188, 188, 188);\n            }\n\n.datepicker.android .datepicker-navbar, .datepicker.android-dark .datepicker-navbar {\n            display: -webkit-box;\n            display: -ms-flexbox;\n            display: flex;\n            border-top: 1px solid #d9d4d4;\n            padding: 0;\n}\n\n.datepicker.android .datepicker-navbar-btn, .datepicker.android-dark .datepicker-navbar-btn {\n            padding: 0;\n            color: #000;\n            -webkit-box-flex: 1;\n                -ms-flex: 1;\n                    flex: 1;\n}\n\n.datepicker.android .datepicker-navbar-btn:nth-child(2), .datepicker.android-dark .datepicker-navbar-btn:nth-child(2) {\n    border-left: 1px solid #d9d4d4;\n}\n\n.datepicker {\n\n    /* android-dark */\n}\n\n.datepicker.android-dark {\n    background-color: #292829;\n}\n\n.datepicker.android-dark .datepicker-viewport::after {\n    background-image: -webkit-gradient(linear,left top, left bottom,from(#282828),color-stop(52%, rgba(40, 40, 40, 0)),color-stop(48%, rgba(40, 40, 40, 0)),to(#282828));\n    background-image: linear-gradient(#282828,rgba(40, 40, 40, 0)52%,rgba(40, 40, 40, 0)48%,#282828);\n}\n\n.datepicker.android-dark .datepicker-caption-item {\n            color: rgb(199, 199, 199);\n}\n\n.datepicker.android-dark .datepicker-scroll li {\n                color: rgb(199, 199, 199);\n            }\n\n.datepicker.android-dark .datepicker-scroll li.disabled {\n                color: rgb(88, 88, 88);\n            }\n\n.datepicker.android-dark .datepicker-navbar { border-color: #424542;\n}\n\n.datepicker.android-dark .datepicker-navbar-btn {\n            color: #fff;\n}\n\n.datepicker.android-dark .datepicker-navbar-btn:nth-child(2) {\n    border-color: #424542;\n}\n", {});

/**
 * @module time utilities
 */

function throwIfInvalidDate(date) {
    if (Object.prototype.toString.call(date, null) !== '[object Date]') {
        throw new Error('Invalid argument type');
    }
}

function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

/**
 * Date extension: convert a Date to a string with the given format
 * @param  {Date}       date
 * @return {String}     formatted string
 */
function convertDate(date, format) {
    var str = format;
    var o = {
        'M+': date.getMonth() + 1,
        'D+': date.getDate(),
        'h+': date.getHours(),
        'm+': date.getMinutes(),
        's+': date.getSeconds()
    };
    if (/(Y+)/.test(format)) {
        str = str.replace(RegExp.$1, date.getFullYear().toString().substr(4 - RegExp.$1.length));
    }

    for (var k in o) {
        if (new RegExp('(' + k + ')').test(format)) {
            str = str.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(o[k].toString().length));
        }
    }

    return str;
}

/**
 * Get a date offset relative to the input date
 * @param  {Date}       date
 * @return {number}     offset days
 */
function nextYear(now) {
    var index = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

    throwIfInvalidDate(now);
    var date = new Date(now.getFullYear() + index, now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());
    return date;
}

function nextMonth(now) {
    var index = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

    throwIfInvalidDate(now);
    var year = now.getFullYear();
    var month = now.getMonth() + index;
    var dayOfMonth = Math.min(now.getDate(), daysInMonth(year, month));
    var date = new Date(year, month, dayOfMonth, now.getHours(), now.getMinutes(), now.getSeconds());
    return date;
}

function nextDate(now) {
    var index = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

    throwIfInvalidDate(now);
    var date = new Date(now.getTime() + index * 24 * 60 * 60 * 1000);
    return date;
}

function nextHour(now) {
    var index = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

    throwIfInvalidDate(now);
    var date = new Date(now.getTime() + index * 60 * 60 * 1000);
    return date;
}

function nextMinute(now) {
    var index = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

    throwIfInvalidDate(now);
    var date = new Date(now.getTime() + index * 60 * 1000);
    return date;
}

function nextSecond(now) {
    var index = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

    throwIfInvalidDate(now);
    var date = new Date(now.getTime() + index * 1000);
    return date;
}

var TimeUtil = Object.freeze({
	convertDate: convertDate,
	nextYear: nextYear,
	nextMonth: nextMonth,
	nextDate: nextDate,
	nextHour: nextHour,
	nextMinute: nextMinute,
	nextSecond: nextSecond
});

function shallowEqual(prev, next) {
    if (prev === next) return true;
    var prevKeys = Object.keys(prev);
    var nextKeys = Object.keys(next);

    if (prevKeys.length !== nextKeys.length) return false;

    return prevKeys.every(function (key) {
        return prev.hasOwnProperty(key) && prev[key] === next[key];
    });
}

function PureRender(Component$$1) {
    Component$$1.prototype.shouldComponentUpdate = function (nextProps, nextState) {
        return PureRender.shouldComponentUpdate(nextProps, nextState, this.props, this.state);
    };
}

PureRender.shouldComponentUpdate = function (nextProps, nextState, preProps, preState) {
    return !shallowEqual(preProps, nextProps) || !shallowEqual(preState, nextState);
};

/**
 * Convert to camelCase
 * @param  {String} str source string to convert
 * @return {String}     converted string
 */
function camelCase(str) {
    return str.replace(/-([a-z])/g, function ($0, $1) {
        return $1.toUpperCase();
    }).replace('-', '');
}

/**
 * Format a CSS properties object
 * @param  {Object} props properties object
 * @return {Object}       formatted properties object with vendor prefixes
 */
function formatCss(props) {
    var prefixs = ['-webkit-', '-moz-', '-ms-'];

    var result = {};

    var regPrefix = /transform|transition/;

    for (var key in props) {
        if (props.hasOwnProperty(key)) {
            var styleValue = props[key];

            // If the key is transform or transition
            if (regPrefix.test(key)) {
                for (var i = 0; i < prefixs.length; i++) {
                    var styleName = camelCase(prefixs[i] + key);
                    result[styleName] = styleValue.replace(regPrefix, prefixs[i] + '$&');
                }
            }

            result[key] = styleValue;
        }
    }

    return result;
}

/**
 * Add CSS styles to an element
 * @param {Object} element target element
 * @param {Object} props   CSS properties object
 */
function addPrefixCss(element, props) {
    var formatedProps = formatCss(props);
    for (var key in formatedProps) {
        if (formatedProps.hasOwnProperty(key)) {
            element.style[key] = formatedProps[key];
        }
    }
}

var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();





var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();







var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};



var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};









var objectWithoutProperties = function (obj, keys) {
  var target = {};

  for (var i in obj) {
    if (keys.indexOf(i) >= 0) continue;
    if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;
    target[i] = obj[i];
  }

  return target;
};

var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

















var toArray = function (arr) {
  return Array.isArray(arr) ? arr : Array.from(arr);
};

var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

/**
 * @module Date component
 */
var DATE_HEIGHT = 40; // Height of each date row
var DATE_LENGTH = 10; // Number of date rows
var MIDDLE_INDEX = Math.floor(DATE_LENGTH / 2); // Middle index in the date list
var MIDDLE_Y = -DATE_HEIGHT * MIDDLE_INDEX; // translateY baseline

var isUndefined = function isUndefined(val) {
    return typeof val === 'undefined';
};
var isFunction = function isFunction(val) {
    return Object.prototype.toString.apply(val) === '[object Function]';
};

/**
 * Date component class
 * @extends Component
 */
var DatePickerItem = function (_Component) {
    inherits(DatePickerItem, _Component);

    function DatePickerItem(props) {
        classCallCheck(this, DatePickerItem);

        var _this = possibleConstructorReturn(this, (DatePickerItem.__proto__ || Object.getPrototypeOf(DatePickerItem)).call(this, props));

        _this.animating = false; // Whether a transition animation is active
        _this.touchY = 0; // touchstart pageY value
        _this.translateY = 0; // Current container offset
        _this.currentIndex = MIDDLE_INDEX; // Current date index while scrolling
        _this.moveDateCount = 0; // Number of date steps moved per scroll

        _this.state = {
            translateY: MIDDLE_Y,
            marginTop: (_this.currentIndex - MIDDLE_INDEX) * DATE_HEIGHT
        };

        _this.renderDatepickerItem = _this.renderDatepickerItem.bind(_this);
        _this.handleContentTouch = _this.handleContentTouch.bind(_this);
        _this.handleContentMouseDown = _this.handleContentMouseDown.bind(_this);
        _this.handleContentMouseMove = _this.handleContentMouseMove.bind(_this);
        _this.handleContentMouseUp = _this.handleContentMouseUp.bind(_this);
        return _this;
    }

    createClass(DatePickerItem, [{
        key: 'UNSAFE_componentWillMount',
        value: function UNSAFE_componentWillMount() {
            this._iniDates(this.props.value);
        }
    }, {
        key: 'componentDidMount',
        value: function componentDidMount() {
            var viewport = this.viewport;
            viewport.addEventListener('touchstart', this.handleContentTouch, false);
            viewport.addEventListener('touchmove', this.handleContentTouch, false);
            viewport.addEventListener('touchend', this.handleContentTouch, false);
            viewport.addEventListener('mousedown', this.handleContentMouseDown, false);
        }
    }, {
        key: 'UNSAFE_componentWillReceiveProps',
        value: function UNSAFE_componentWillReceiveProps(nextProps) {
            if (nextProps.value.getTime() === this.props.value.getTime()) {
                return;
            }
            this._iniDates(nextProps.value);
            this.currentIndex = MIDDLE_INDEX;
            this.setState({
                translateY: MIDDLE_Y,
                marginTop: (this.currentIndex - MIDDLE_INDEX) * DATE_HEIGHT
            });
        }

        /**
         * Optimization component, Prevents unnecessary rendering
         * Only value or state change should re-rendering
         *
         * @param  {Object} nextProps next props
         * @param  {Object} nextState next state
         * @return {Boolean}          Whether re-rendering
         */

    }, {
        key: 'shouldComponentUpdate',
        value: function shouldComponentUpdate(nextProps, nextState) {
            return nextProps.value.getTime() !== this.props.value.getTime() || !shallowEqual(nextState, this.state);
        }
    }, {
        key: 'componentWillUnmount',
        value: function componentWillUnmount() {
            var viewport = this.viewport;
            viewport.removeEventListener('touchstart', this.handleContentTouch, false);
            viewport.removeEventListener('touchmove', this.handleContentTouch, false);
            viewport.removeEventListener('touchend', this.handleContentTouch, false);
            viewport.removeEventListener('mousedown', this.handleContentMouseDown, false);
        }
    }, {
        key: '_iniDates',
        value: function _iniDates(date) {
            var _this2 = this;

            var typeName = this.props.type;
            var dates = Array.apply(undefined, toConsumableArray(Array(DATE_LENGTH))).map(function (value, index) {
                return TimeUtil['next' + typeName](date, (index - MIDDLE_INDEX) * _this2.props.step);
            });
            this.setState({ dates: dates });
        }
    }, {
        key: '_updateDates',
        value: function _updateDates(direction) {
            var typeName = this.props.type;
            var dates = this.state.dates;

            if (direction === 1) {
                this.currentIndex++;
                this.setState({
                    dates: [].concat(toConsumableArray(dates.slice(1)), [TimeUtil['next' + typeName](dates[dates.length - 1], this.props.step)]),
                    marginTop: (this.currentIndex - MIDDLE_INDEX) * DATE_HEIGHT
                });
            } else {
                this.currentIndex--;
                this.setState({
                    dates: [TimeUtil['next' + typeName](dates[0], -this.props.step)].concat(toConsumableArray(dates.slice(0, dates.length - 1))),
                    marginTop: (this.currentIndex - MIDDLE_INDEX) * DATE_HEIGHT
                });
            }
        }
    }, {
        key: '_checkIsUpdateDates',
        value: function _checkIsUpdateDates(direction, translateY) {
            return direction === 1 ? this.currentIndex * DATE_HEIGHT + DATE_HEIGHT / 2 < -translateY : this.currentIndex * DATE_HEIGHT - DATE_HEIGHT / 2 > -translateY;
        }

        /**
         * Clear an element's transition style
         * @param  {Dom}     obj     target element
         * @return {undefined}
         */

    }, {
        key: '_clearTransition',
        value: function _clearTransition(obj) {
            addPrefixCss(obj, { transition: '' });
        }

        /**
         * Move to the next date
         * @param  {number} direction scroll direction
         * @return {undefined}
         */

    }, {
        key: '_moveToNext',
        value: function _moveToNext(direction) {
            var date = this.state.dates[MIDDLE_INDEX];
            var _props = this.props,
                max = _props.max,
                min = _props.min;

            if (direction === -1 && date.getTime() < min.getTime() && this.moveDateCount) {
                this._updateDates(1);
            } else if (direction === 1 && date.getTime() > max.getTime() && this.moveDateCount) {
                this._updateDates(-1);
            }

            this._moveTo(this.scrollEl, this.currentIndex);
        }

        /**
         * Apply scroll animation
         * @param  {DOM} obj   DOM element
         * @param  {number} angle angle
         * @return {undefined}
         */

    }, {
        key: '_moveTo',
        value: function _moveTo(obj, currentIndex) {
            var _this3 = this;

            this.animating = true;

            addPrefixCss(obj, { transition: 'transform .2s ease-out' });

            this.setState({
                translateY: -currentIndex * DATE_HEIGHT
            });

            // NOTE: There is no transitionend, setTimeout is used instead.
            setTimeout(function () {
                _this3.animating = false;
                _this3.props.onSelect(_this3.state.dates[MIDDLE_INDEX]);
                _this3._clearTransition(_this3.scrollEl);
            }, 200);
        }
    }, {
        key: 'handleStart',
        value: function handleStart(event) {
            this.touchY = !isUndefined(event.targetTouches) && !isUndefined(event.targetTouches[0]) ? event.targetTouches[0].pageY : event.pageY;

            this.translateY = this.state.translateY;
            this.moveDateCount = 0;
        }
    }, {
        key: 'handleMove',
        value: function handleMove(event) {
            var touchY = !isUndefined(event.targetTouches) && !isUndefined(event.targetTouches[0]) ? event.targetTouches[0].pageY : event.pageY;

            var dir = touchY - this.touchY;
            var translateY = this.translateY + dir;
            var direction = dir > 0 ? -1 : 1;

            // Enforce minimum and maximum date limits
            var date = this.state.dates[MIDDLE_INDEX];
            var _props2 = this.props,
                max = _props2.max,
                min = _props2.min;

            if (date.getTime() < min.getTime() || date.getTime() > max.getTime()) {
                return;
            }

            // Check whether the date list should be updated
            if (this._checkIsUpdateDates(direction, translateY)) {
                this.moveDateCount = direction > 0 ? this.moveDateCount + 1 : this.moveDateCount - 1;
                this._updateDates(direction);
            }

            this.setState({ translateY: translateY });
        }
    }, {
        key: 'handleEnd',
        value: function handleEnd(event) {
            var touchY = event.pageY || event.changedTouches[0].pageY;
            var dir = touchY - this.touchY;
            var direction = dir > 0 ? -1 : 1;
            this._moveToNext(direction);
        }

        /**
         * Datepicker touch events
         * @param  {Object} event event object
         * @return {undefined}
         */

    }, {
        key: 'handleContentTouch',
        value: function handleContentTouch(event) {
            event.preventDefault();
            if (this.animating) return;
            if (event.type === 'touchstart') {
                this.handleStart(event);
            } else if (event.type === 'touchmove') {
                this.handleMove(event);
            } else if (event.type === 'touchend') {
                this.handleEnd(event);
            }
        }

        /**
         * Datepicker mouse events
         * @param  {Object} event event object
         * @return {undefined}
         */

    }, {
        key: 'handleContentMouseDown',
        value: function handleContentMouseDown(event) {
            if (this.animating) return;
            this.handleStart(event);
            document.addEventListener('mousemove', this.handleContentMouseMove);
            document.addEventListener('mouseup', this.handleContentMouseUp);
        }
    }, {
        key: 'handleContentMouseMove',
        value: function handleContentMouseMove(event) {
            if (this.animating) return;
            this.handleMove(event);
        }
    }, {
        key: 'handleContentMouseUp',
        value: function handleContentMouseUp(event) {
            if (this.animating) return;
            this.handleEnd(event);
            document.removeEventListener('mousemove', this.handleContentMouseMove);
            document.removeEventListener('mouseup', this.handleContentMouseUp);
        }

        /**
         * Render a date DOM element
         * @param  {Object} date date data
         * @return {Object}      JSX element
         */

    }, {
        key: 'renderDatepickerItem',
        value: function renderDatepickerItem(date, index) {
            var className = date < this.props.min || date > this.props.max ? 'disabled' : '';

            var formatDate = void 0;
            if (isFunction(this.props.format)) {
                formatDate = this.props.format(date);
            } else {
                formatDate = convertDate(date, this.props.format);
            }

            return React__default.createElement(
                'li',
                {
                    key: index,
                    className: className },
                formatDate
            );
        }
    }, {
        key: 'render',
        value: function render() {
            var _this4 = this;

            var scrollStyle = formatCss({
                transform: 'translateY(' + this.state.translateY + 'px)',
                marginTop: this.state.marginTop
            });

            return React__default.createElement(
                'div',
                { className: 'datepicker-col-1' },
                React__default.createElement(
                    'div',
                    {
                        ref: function ref(viewport) {
                            return _this4.viewport = viewport;
                        }
                        , className: 'datepicker-viewport' },
                    React__default.createElement(
                        'div',
                        { className: 'datepicker-wheel' },
                        React__default.createElement(
                            'ul',
                            {
                                ref: function ref(scrollEl) {
                                    _this4.scrollEl = scrollEl;
                                },
                                className: 'datepicker-scroll',
                                style: scrollStyle },
                            this.state.dates.map(this.renderDatepickerItem)
                        )
                    )
                )
            );
        }
    }]);
    return DatePickerItem;
}(React.Component);

/**
 * Default props
 */
var defaultProps = {
    isPopup: true,
    isOpen: false,
    theme: 'default',
    value: new Date(),
    min: new Date(1970, 0, 1),
    max: new Date(2050, 0, 1),
    showFooter: true,
    showHeader: true,
    showCaption: false,
    dateConfig: {
        'year': {
            format: 'YYYY',
            caption: 'Year',
            step: 1
        },
        'month': {
            format: 'M',
            caption: 'Mon',
            step: 1
        },
        'date': {
            format: 'D',
            caption: 'Day',
            step: 1
        }
    },
    headerFormat: 'YYYY/MM/DD',
    confirmText: 'Done',
    cancelText: 'Cancel',
    onChange: function onChange() {},
    onSelect: function onSelect() {},
    onCancel: function onCancel() {}
};

/**
 * Date configuration
 */
var dateConfigMap = {
    'year': {
        format: 'YYYY',
        caption: 'Year',
        step: 1
    },
    'month': {
        format: 'M',
        caption: 'Mon',
        step: 1
    },
    'date': {
        format: 'D',
        caption: 'Day',
        step: 1
    },
    'hour': {
        format: 'hh',
        caption: 'Hour',
        step: 1
    },
    'minute': {
        format: 'mm',
        caption: 'Min',
        step: 1
    },
    'second': {
        format: 'hh',
        caption: 'Sec',
        step: 1
    }
};

/**
 * @module DatePicker Component
 */

/**
 * Capitalize first letter
 * @param {String} string
 */
var capitalize = function capitalize(_ref) {
    var _ref2 = toArray(_ref),
        first = _ref2[0],
        rest = _ref2.slice(1);

    return first.toUpperCase() + rest.join('');
};

/**
 * Check for array
 * @param {any} val
 */
var isArray = function isArray(val) {
    return Object.prototype.toString.apply(val) === '[object Array]';
};

/**
 * Class DatePicker Component Class
 * @extends Component
 */

var DatePicker = function (_Component) {
    inherits(DatePicker, _Component);

    function DatePicker(props) {
        classCallCheck(this, DatePicker);

        var _this = possibleConstructorReturn(this, (DatePicker.__proto__ || Object.getPrototypeOf(DatePicker)).call(this, props));

        _this.state = {
            value: nextDate(_this.props.value)
        };

        if ('dateFormat' in props) {
            console.warn('dateFormat is deprecated, use dateConfig instead.');
        }

        if ('dateSteps' in props) {
            console.warn('dateSteps is deprecated, use dateConfig instead.');
        }

        if ('showFormat' in props) {
            console.warn('headerFormat is deprecated, use dateConfig instead.');
        }

        _this.handleFinishBtnClick = _this.handleFinishBtnClick.bind(_this);
        _this.handleDateSelect = _this.handleDateSelect.bind(_this);
        return _this;
    }

    createClass(DatePicker, [{
        key: 'UNSAFE_componentWillReceiveProps',
        value: function UNSAFE_componentWillReceiveProps(nextProps) {
            // update value of state
            var date = nextDate(nextProps.value);
            if (date.getTime() !== this.state.value.getTime()) {
                this.setState({ value: date });
            }
        }

        /**
         * When you swipe two datepickeritems at the same time.
         * Prevent dates from going out.
         */

    }, {
        key: 'componentDidUpdate',
        value: function componentDidUpdate() {
            var value = this.state.value;
            var _props = this.props,
                min = _props.min,
                max = _props.max;

            if (value.getTime() > max.getTime()) {
                this.setState({ value: max });
            }

            if (value.getTime() < min.getTime()) {
                this.setState({ value: min });
            }
        }

        /**
         * Optimization component, Prevents unnecessary rendering
         * Only props or state change or value before re-rendering
         *
         * @param  {Object} nextProps next props
         * @param  {Object} nextState next state
         * @return {Boolean}          Whether re-rendering
         */

    }, {
        key: 'shouldComponentUpdate',
        value: function shouldComponentUpdate(nextProps, nextState) {
            var date = nextDate(nextState.value);
            return date.getTime() !== this.state.value.getTime() || PureRender.shouldComponentUpdate(nextProps, nextState, this.props, this.state);
        }

        /**
         * Finish button click handler
         * @return {undefined}
         */

    }, {
        key: 'handleFinishBtnClick',
        value: function handleFinishBtnClick() {
            this.props.onSelect(this.state.value);
        }

        /**
         * Select next date
         * @return {undefined}
         */

    }, {
        key: 'handleDateSelect',
        value: function handleDateSelect(value) {
            var _this2 = this;

            this.setState({ value: value }, function () {
                _this2.props.onChange(value);
            });
        }

        /**
         * Normalize dateConfig
         * @param {*} dataConfig dateConfig prop
         */

    }, {
        key: 'normalizeDateConfig',
        value: function normalizeDateConfig(dataConfig) {
            var configList = [];
            if (isArray(dataConfig)) {
                for (var i = 0; i < dataConfig.length; i++) {
                    var _value = dataConfig[i];
                    if (typeof _value === 'string') {
                        var lowerCaseKey = _value.toLocaleLowerCase();
                        configList.push(_extends({}, dateConfigMap[lowerCaseKey], {
                            type: capitalize(lowerCaseKey)
                        }));
                    }
                }
            } else {
                for (var key in dataConfig) {
                    if (dataConfig.hasOwnProperty(key)) {
                        var _lowerCaseKey = key.toLocaleLowerCase();
                        if (dateConfigMap.hasOwnProperty(_lowerCaseKey)) {
                            configList.push(_extends({}, dateConfigMap[_lowerCaseKey], dataConfig[key], {
                                type: capitalize(_lowerCaseKey)
                            }));
                        }
                    }
                }
            }

            return configList;
        }

        /**
         * render function
         * @return {Object} JSX element
         */

    }, {
        key: 'render',
        value: function render() {
            var _this3 = this;

            var _props2 = this.props,
                min = _props2.min,
                max = _props2.max,
                theme = _props2.theme,
                dateConfig = _props2.dateConfig,
                confirmText = _props2.confirmText,
                cancelText = _props2.cancelText,
                headerFormat = _props2.headerFormat,
                showHeader = _props2.showHeader,
                showFooter = _props2.showFooter,
                customHeader = _props2.customHeader,
                showCaption = _props2.showCaption;

            var value = this.state.value;
            var themeClassName = ['default', 'dark', 'ios', 'android', 'android-dark'].indexOf(theme) === -1 ? 'default' : theme;

            var dataConfigList = this.normalizeDateConfig(dateConfig);

            return React__default.createElement(
                'div',
                {
                    className: 'datepicker ' + themeClassName },
                showHeader && React__default.createElement(
                    'div',
                    { className: 'datepicker-header' },
                    customHeader || convertDate(value, headerFormat)
                ),
                showCaption && React__default.createElement(
                    'div',
                    { className: 'datepicker-caption' },
                    dataConfigList.map(function (item, index) {
                        return React__default.createElement(
                            'div',
                            { key: index, className: 'datepicker-caption-item' },
                            item.caption
                        );
                    })
                ),
                React__default.createElement(
                    'div',
                    { className: 'datepicker-content' },
                    dataConfigList.map(function (item, index) {
                        return React__default.createElement(DatePickerItem, {
                            key: index,
                            value: value,
                            min: min,
                            max: max,
                            step: item.step,
                            type: item.type,
                            format: item.format,
                            onSelect: _this3.handleDateSelect });
                    })
                ),
                showFooter && React__default.createElement(
                    'div',
                    { className: 'datepicker-navbar' },
                    React__default.createElement(
                        'a',
                        {
                            className: 'datepicker-navbar-btn',
                            onClick: this.handleFinishBtnClick },
                        confirmText
                    ),
                    React__default.createElement(
                        'a',
                        {
                            className: 'datepicker-navbar-btn',
                            onClick: this.props.onCancel },
                        cancelText
                    )
                )
            );
        }
    }]);
    return DatePicker;
}(React.Component);

var renderSubtreeIntoContainer = ReactDOM.unstable_renderSubtreeIntoContainer;

var Modal = function (_Component) {
    inherits(Modal, _Component);

    function Modal() {
        classCallCheck(this, Modal);
        return possibleConstructorReturn(this, (Modal.__proto__ || Object.getPrototypeOf(Modal)).apply(this, arguments));
    }

    createClass(Modal, [{
        key: 'componentDidMount',
        value: function componentDidMount() {
            this._div = document.createElement('div');
            this._div.classList.add('Modal-Portal');
            document.body.appendChild(this._div);
            this.renderPortal(this.props);
        }
    }, {
        key: 'UNSAFE_componentWillReceiveProps',
        value: function UNSAFE_componentWillReceiveProps(newProps) {
            this.renderPortal(newProps);
        }
    }, {
        key: 'componentWillUnmount',
        value: function componentWillUnmount() {
            ReactDOM.unmountComponentAtNode(this._div);
            this._div.parentNode.removeChild(this._div);
        }
    }, {
        key: 'renderPortal',
        value: function renderPortal(props) {
            var portal = React__default.cloneElement(this.props.children, _extends({}, props, { key: 'portal' }), null);

            this.portal = renderSubtreeIntoContainer(this, portal, this._div);
        }
    }, {
        key: 'render',
        value: function render() {
            return React__default.createElement('noscript', null);
        }
    }]);
    return Modal;
}(React.Component);

Modal.defaultProps = {
    isOpen: false
};

function EnhanceDatePicker(_ref) {
    var isOpen = _ref.isOpen,
        props = objectWithoutProperties(_ref, ['isOpen']);

    function onModalClose(event) {
        if (event.target === event.currentTarget) {
            props.onCancel();
        }
    }

    return React__default.createElement(
        'div',
        {
            style: { display: isOpen ? '' : 'none' },
            onClick: onModalClose,
            className: 'datepicker-modal' },
        React__default.createElement(DatePicker, props)
    );
}

function ModalDatePicker(_ref2) {
    var isPopup = _ref2.isPopup,
        props = objectWithoutProperties(_ref2, ['isPopup']);

    if (!isPopup) {
        return React__default.createElement(DatePicker, props);
    }

    return React__default.createElement(
        Modal,
        props,
        React__default.createElement(EnhanceDatePicker, null)
    );
}

ModalDatePicker.displayName = 'MobileDatePicker';
ModalDatePicker.defaultProps = defaultProps;

return ModalDatePicker;

})));
