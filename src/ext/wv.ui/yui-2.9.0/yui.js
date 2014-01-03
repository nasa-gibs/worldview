/*
Copyright (c) 2011, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://developer.yahoo.com/yui/license.html
version: 2.9.0
*/
/**
 * The YAHOO object is the single global object used by YUI Library.  It
 * contains utility function for setting up namespaces, inheritance, and
 * logging.  YAHOO.util, YAHOO.widget, and YAHOO.example are namespaces
 * created automatically for and used by the library.
 * @module yahoo
 * @title  YAHOO Global
 */

/**
 * YAHOO_config is not included as part of the library.  Instead it is an
 * object that can be defined by the implementer immediately before
 * including the YUI library.  The properties included in this object
 * will be used to configure global properties needed as soon as the
 * library begins to load.
 * @class YAHOO_config
 * @static
 */

/**
 * A reference to a function that will be executed every time a YAHOO module
 * is loaded.  As parameter, this function will receive the version
 * information for the module. See <a href="YAHOO.env.html#getVersion">
 * YAHOO.env.getVersion</a> for the description of the version data structure.
 * @property listener
 * @type Function
 * @static
 * @default undefined
 */

/**
 * Set to true if the library will be dynamically loaded after window.onload.
 * Defaults to false
 * @property injecting
 * @type boolean
 * @static
 * @default undefined
 */

/**
 * Instructs the yuiloader component to dynamically load yui components and
 * their dependencies.  See the yuiloader documentation for more information
 * about dynamic loading
 * @property load
 * @static
 * @default undefined
 * @see yuiloader
 */

/**
 * Forces the use of the supplied locale where applicable in the library
 * @property locale
 * @type string
 * @static
 * @default undefined
 */

if (typeof YAHOO == "undefined" || !YAHOO) {
    /**
     * The YAHOO global namespace object.  If YAHOO is already defined, the
     * existing YAHOO object will not be overwritten so that defined
     * namespaces are preserved.
     * @class YAHOO
     * @static
     */
    var YAHOO = {};
}

/**
 * Returns the namespace specified and creates it if it doesn't exist
 * <pre>
 * YAHOO.namespace("property.package");
 * YAHOO.namespace("YAHOO.property.package");
 * </pre>
 * Either of the above would create YAHOO.property, then
 * YAHOO.property.package
 *
 * Be careful when naming packages. Reserved words may work in some browsers
 * and not others. For instance, the following will fail in Safari:
 * <pre>
 * YAHOO.namespace("really.long.nested.namespace");
 * </pre>
 * This fails because "long" is a future reserved word in ECMAScript
 *
 * For implementation code that uses YUI, do not create your components
 * in the namespaces defined by YUI (
 * <code>YAHOO.util</code>,
 * <code>YAHOO.widget</code>,
 * <code>YAHOO.lang</code>,
 * <code>YAHOO.tool</code>,
 * <code>YAHOO.example</code>,
 * <code>YAHOO.env</code>) -- create your own namespace (e.g., 'companyname').
 *
 * @method namespace
 * @static
 * @param  {String*} arguments 1-n namespaces to create
 * @return {Object}  A reference to the last namespace object created
 */
YAHOO.namespace = function() {
    var a=arguments, o=null, i, j, d;
    for (i=0; i<a.length; i=i+1) {
        d=(""+a[i]).split(".");
        o=YAHOO;

        // YAHOO is implied, so it is ignored if it is included
        for (j=(d[0] == "YAHOO") ? 1 : 0; j<d.length; j=j+1) {
            o[d[j]]=o[d[j]] || {};
            o=o[d[j]];
        }
    }

    return o;
};

/**
 * Uses YAHOO.widget.Logger to output a log message, if the widget is
 * available.
 * Note: LogReader adds the message, category, and source to the DOM as HTML.
 *
 * @method log
 * @static
 * @param  {HTML}  msg  The message to log.
 * @param  {HTML}  cat  The log category for the message.  Default
 *                        categories are "info", "warn", "error", time".
 *                        Custom categories can be used as well. (opt)
 * @param  {HTML}  src  The source of the the message (opt)
 * @return {Boolean}      True if the log operation was successful.
 */
YAHOO.log = function(msg, cat, src) {
    var l=YAHOO.widget.Logger;
    if(l && l.log) {
        return l.log(msg, cat, src);
    } else {
        return false;
    }
};

/**
 * Registers a module with the YAHOO object
 * @method register
 * @static
 * @param {String}   name    the name of the module (event, slider, etc)
 * @param {Function} mainClass a reference to class in the module.  This
 *                             class will be tagged with the version info
 *                             so that it will be possible to identify the
 *                             version that is in use when multiple versions
 *                             have loaded
 * @param {Object}   data      metadata object for the module.  Currently it
 *                             is expected to contain a "version" property
 *                             and a "build" property at minimum.
 */
YAHOO.register = function(name, mainClass, data) {
    var mods = YAHOO.env.modules, m, v, b, ls, i;

    if (!mods[name]) {
        mods[name] = {
            versions:[],
            builds:[]
        };
    }

    m  = mods[name];
    v  = data.version;
    b  = data.build;
    ls = YAHOO.env.listeners;

    m.name = name;
    m.version = v;
    m.build = b;
    m.versions.push(v);
    m.builds.push(b);
    m.mainClass = mainClass;

    // fire the module load listeners
    for (i=0;i<ls.length;i=i+1) {
        ls[i](m);
    }
    // label the main class
    if (mainClass) {
        mainClass.VERSION = v;
        mainClass.BUILD = b;
    } else {
        YAHOO.log("mainClass is undefined for module " + name, "warn");
    }
};

/**
 * YAHOO.env is used to keep track of what is known about the YUI library and
 * the browsing environment
 * @class YAHOO.env
 * @static
 */
YAHOO.env = YAHOO.env || {

    /**
     * Keeps the version info for all YUI modules that have reported themselves
     * @property modules
     * @type Object[]
     */
    modules: [],

    /**
     * List of functions that should be executed every time a YUI module
     * reports itself.
     * @property listeners
     * @type Function[]
     */
    listeners: []
};

/**
 * Returns the version data for the specified module:
 *      <dl>
 *      <dt>name:</dt>      <dd>The name of the module</dd>
 *      <dt>version:</dt>   <dd>The version in use</dd>
 *      <dt>build:</dt>     <dd>The build number in use</dd>
 *      <dt>versions:</dt>  <dd>All versions that were registered</dd>
 *      <dt>builds:</dt>    <dd>All builds that were registered.</dd>
 *      <dt>mainClass:</dt> <dd>An object that was was stamped with the
 *                 current version and build. If
 *                 mainClass.VERSION != version or mainClass.BUILD != build,
 *                 multiple versions of pieces of the library have been
 *                 loaded, potentially causing issues.</dd>
 *       </dl>
 *
 * @method getVersion
 * @static
 * @param {String}  name the name of the module (event, slider, etc)
 * @return {Object} The version info
 */
YAHOO.env.getVersion = function(name) {
    return YAHOO.env.modules[name] || null;
};

/**
 * Do not fork for a browser if it can be avoided.  Use feature detection when
 * you can.  Use the user agent as a last resort.  YAHOO.env.ua stores a version
 * number for the browser engine, 0 otherwise.  This value may or may not map
 * to the version number of the browser using the engine.  The value is
 * presented as a float so that it can easily be used for boolean evaluation
 * as well as for looking for a particular range of versions.  Because of this,
 * some of the granularity of the version info may be lost (e.g., Gecko 1.8.0.9
 * reports 1.8).
 * @class YAHOO.env.ua
 * @static
 */

/**
 * parses a user agent string (or looks for one in navigator to parse if
 * not supplied).
 * @method parseUA
 * @since 2.9.0
 * @static
 */
YAHOO.env.parseUA = function(agent) {

        var numberify = function(s) {
            var c = 0;
            return parseFloat(s.replace(/\./g, function() {
                return (c++ == 1) ? '' : '.';
            }));
        },

        nav = navigator,

        o = {

        /**
         * Internet Explorer version number or 0.  Example: 6
         * @property ie
         * @type float
         * @static
         */
        ie: 0,

        /**
         * Opera version number or 0.  Example: 9.2
         * @property opera
         * @type float
         * @static
         */
        opera: 0,

        /**
         * Gecko engine revision number.  Will evaluate to 1 if Gecko
         * is detected but the revision could not be found. Other browsers
         * will be 0.  Example: 1.8
         * <pre>
         * Firefox 1.0.0.4: 1.7.8   <-- Reports 1.7
         * Firefox 1.5.0.9: 1.8.0.9 <-- 1.8
         * Firefox 2.0.0.3: 1.8.1.3 <-- 1.81
         * Firefox 3.0   <-- 1.9
         * Firefox 3.5   <-- 1.91
         * </pre>
         * @property gecko
         * @type float
         * @static
         */
        gecko: 0,

        /**
         * AppleWebKit version.  KHTML browsers that are not WebKit browsers
         * will evaluate to 1, other browsers 0.  Example: 418.9
         * <pre>
         * Safari 1.3.2 (312.6): 312.8.1 <-- Reports 312.8 -- currently the
         *                                   latest available for Mac OSX 10.3.
         * Safari 2.0.2:         416     <-- hasOwnProperty introduced
         * Safari 2.0.4:         418     <-- preventDefault fixed
         * Safari 2.0.4 (419.3): 418.9.1 <-- One version of Safari may run
         *                                   different versions of webkit
         * Safari 2.0.4 (419.3): 419     <-- Tiger installations that have been
         *                                   updated, but not updated
         *                                   to the latest patch.
         * Webkit 212 nightly:   522+    <-- Safari 3.0 precursor (with native
         * SVG and many major issues fixed).
         * Safari 3.0.4 (523.12) 523.12  <-- First Tiger release - automatic
         * update from 2.x via the 10.4.11 OS patch.
         * Webkit nightly 1/2008:525+    <-- Supports DOMContentLoaded event.
         *                                   yahoo.com user agent hack removed.
         * </pre>
         * http://en.wikipedia.org/wiki/Safari_version_history
         * @property webkit
         * @type float
         * @static
         */
        webkit: 0,

        /**
         * Chrome will be detected as webkit, but this property will also
         * be populated with the Chrome version number
         * @property chrome
         * @type float
         * @static
         */
        chrome: 0,

        /**
         * The mobile property will be set to a string containing any relevant
         * user agent information when a modern mobile browser is detected.
         * Currently limited to Safari on the iPhone/iPod Touch, Nokia N-series
         * devices with the WebKit-based browser, and Opera Mini.
         * @property mobile
         * @type string
         * @static
         */
        mobile: null,

        /**
         * Adobe AIR version number or 0.  Only populated if webkit is detected.
         * Example: 1.0
         * @property air
         * @type float
         */
        air: 0,
        /**
         * Detects Apple iPad's OS version
         * @property ipad
         * @type float
         * @static
         */
        ipad: 0,
        /**
         * Detects Apple iPhone's OS version
         * @property iphone
         * @type float
         * @static
         */
        iphone: 0,
        /**
         * Detects Apples iPod's OS version
         * @property ipod
         * @type float
         * @static
         */
        ipod: 0,
        /**
         * General truthy check for iPad, iPhone or iPod
         * @property ios
         * @type float
         * @static
         */
        ios: null,
        /**
         * Detects Googles Android OS version
         * @property android
         * @type float
         * @static
         */
        android: 0,
        /**
         * Detects Palms WebOS version
         * @property webos
         * @type float
         * @static
         */
        webos: 0,

        /**
         * Google Caja version number or 0.
         * @property caja
         * @type float
         */
        caja: nav && nav.cajaVersion,

        /**
         * Set to true if the page appears to be in SSL
         * @property secure
         * @type boolean
         * @static
         */
        secure: false,

        /**
         * The operating system.  Currently only detecting windows or macintosh
         * @property os
         * @type string
         * @static
         */
        os: null

    },

    ua = agent || (navigator && navigator.userAgent),

    loc = window && window.location,

    href = loc && loc.href,

    m;

    o.secure = href && (href.toLowerCase().indexOf("https") === 0);

    if (ua) {

        if ((/windows|win32/i).test(ua)) {
            o.os = 'windows';
        } else if ((/macintosh/i).test(ua)) {
            o.os = 'macintosh';
        } else if ((/rhino/i).test(ua)) {
            o.os = 'rhino';
        }

        // Modern KHTML browsers should qualify as Safari X-Grade
        if ((/KHTML/).test(ua)) {
            o.webkit = 1;
        }
        // Modern WebKit browsers are at least X-Grade
        m = ua.match(/AppleWebKit\/([^\s]*)/);
        if (m && m[1]) {
            o.webkit = numberify(m[1]);

            // Mobile browser check
            if (/ Mobile\//.test(ua)) {
                o.mobile = 'Apple'; // iPhone or iPod Touch

                m = ua.match(/OS ([^\s]*)/);
                if (m && m[1]) {
                    m = numberify(m[1].replace('_', '.'));
                }
                o.ios = m;
                o.ipad = o.ipod = o.iphone = 0;

                m = ua.match(/iPad|iPod|iPhone/);
                if (m && m[0]) {
                    o[m[0].toLowerCase()] = o.ios;
                }
            } else {
                m = ua.match(/NokiaN[^\/]*|Android \d\.\d|webOS\/\d\.\d/);
                if (m) {
                    // Nokia N-series, Android, webOS, ex: NokiaN95
                    o.mobile = m[0];
                }
                if (/webOS/.test(ua)) {
                    o.mobile = 'WebOS';
                    m = ua.match(/webOS\/([^\s]*);/);
                    if (m && m[1]) {
                        o.webos = numberify(m[1]);
                    }
                }
                if (/ Android/.test(ua)) {
                    o.mobile = 'Android';
                    m = ua.match(/Android ([^\s]*);/);
                    if (m && m[1]) {
                        o.android = numberify(m[1]);
                    }

                }
            }

            m = ua.match(/Chrome\/([^\s]*)/);
            if (m && m[1]) {
                o.chrome = numberify(m[1]); // Chrome
            } else {
                m = ua.match(/AdobeAIR\/([^\s]*)/);
                if (m) {
                    o.air = m[0]; // Adobe AIR 1.0 or better
                }
            }
        }

        if (!o.webkit) { // not webkit
// @todo check Opera/8.01 (J2ME/MIDP; Opera Mini/2.0.4509/1316; fi; U; ssr)
            m = ua.match(/Opera[\s\/]([^\s]*)/);
            if (m && m[1]) {
                o.opera = numberify(m[1]);
                m = ua.match(/Version\/([^\s]*)/);
                if (m && m[1]) {
                    o.opera = numberify(m[1]); // opera 10+
                }
                m = ua.match(/Opera Mini[^;]*/);
                if (m) {
                    o.mobile = m[0]; // ex: Opera Mini/2.0.4509/1316
                }
            } else { // not opera or webkit
                m = ua.match(/MSIE\s([^;]*)/);
                if (m && m[1]) {
                    o.ie = numberify(m[1]);
                } else { // not opera, webkit, or ie
                    m = ua.match(/Gecko\/([^\s]*)/);
                    if (m) {
                        o.gecko = 1; // Gecko detected, look for revision
                        m = ua.match(/rv:([^\s\)]*)/);
                        if (m && m[1]) {
                            o.gecko = numberify(m[1]);
                        }
                    }
                }
            }
        }
    }

    return o;
};

YAHOO.env.ua = YAHOO.env.parseUA();

/*
 * Initializes the global by creating the default namespaces and applying
 * any new configuration information that is detected.  This is the setup
 * for env.
 * @method init
 * @static
 * @private
 */
(function() {
    YAHOO.namespace("util", "widget", "example");
    /*global YAHOO_config*/
    if ("undefined" !== typeof YAHOO_config) {
        var l=YAHOO_config.listener, ls=YAHOO.env.listeners,unique=true, i;
        if (l) {
            // if YAHOO is loaded multiple times we need to check to see if
            // this is a new config object.  If it is, add the new component
            // load listener to the stack
            for (i=0; i<ls.length; i++) {
                if (ls[i] == l) {
                    unique = false;
                    break;
                }
            }

            if (unique) {
                ls.push(l);
            }
        }
    }
})();
/**
 * Provides the language utilites and extensions used by the library
 * @class YAHOO.lang
 */
YAHOO.lang = YAHOO.lang || {};

(function() {


var L = YAHOO.lang,

    OP = Object.prototype,
    ARRAY_TOSTRING = '[object Array]',
    FUNCTION_TOSTRING = '[object Function]',
    OBJECT_TOSTRING = '[object Object]',
    NOTHING = [],

    HTML_CHARS = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
        '`': '&#x60;'
    },

    // ADD = ["toString", "valueOf", "hasOwnProperty"],
    ADD = ["toString", "valueOf"],

    OB = {

    /**
     * Determines wheather or not the provided object is an array.
     * @method isArray
     * @param {any} o The object being testing
     * @return {boolean} the result
     */
    isArray: function(o) {
        return OP.toString.apply(o) === ARRAY_TOSTRING;
    },

    /**
     * Determines whether or not the provided object is a boolean
     * @method isBoolean
     * @param {any} o The object being testing
     * @return {boolean} the result
     */
    isBoolean: function(o) {
        return typeof o === 'boolean';
    },

    /**
     * Determines whether or not the provided object is a function.
     * Note: Internet Explorer thinks certain functions are objects:
     *
     * var obj = document.createElement("object");
     * YAHOO.lang.isFunction(obj.getAttribute) // reports false in IE
     *
     * var input = document.createElement("input"); // append to body
     * YAHOO.lang.isFunction(input.focus) // reports false in IE
     *
     * You will have to implement additional tests if these functions
     * matter to you.
     *
     * @method isFunction
     * @param {any} o The object being testing
     * @return {boolean} the result
     */
    isFunction: function(o) {
        return (typeof o === 'function') || OP.toString.apply(o) === FUNCTION_TOSTRING;
    },

    /**
     * Determines whether or not the provided object is null
     * @method isNull
     * @param {any} o The object being testing
     * @return {boolean} the result
     */
    isNull: function(o) {
        return o === null;
    },

    /**
     * Determines whether or not the provided object is a legal number
     * @method isNumber
     * @param {any} o The object being testing
     * @return {boolean} the result
     */
    isNumber: function(o) {
        return typeof o === 'number' && isFinite(o);
    },

    /**
     * Determines whether or not the provided object is of type object
     * or function
     * @method isObject
     * @param {any} o The object being testing
     * @return {boolean} the result
     */
    isObject: function(o) {
return (o && (typeof o === 'object' || L.isFunction(o))) || false;
    },

    /**
     * Determines whether or not the provided object is a string
     * @method isString
     * @param {any} o The object being testing
     * @return {boolean} the result
     */
    isString: function(o) {
        return typeof o === 'string';
    },

    /**
     * Determines whether or not the provided object is undefined
     * @method isUndefined
     * @param {any} o The object being testing
     * @return {boolean} the result
     */
    isUndefined: function(o) {
        return typeof o === 'undefined';
    },


    /**
     * IE will not enumerate native functions in a derived object even if the
     * function was overridden.  This is a workaround for specific functions
     * we care about on the Object prototype.
     * @property _IEEnumFix
     * @param {Function} r  the object to receive the augmentation
     * @param {Function} s  the object that supplies the properties to augment
     * @static
     * @private
     */
    _IEEnumFix: (YAHOO.env.ua.ie) ? function(r, s) {
            var i, fname, f;
            for (i=0;i<ADD.length;i=i+1) {

                fname = ADD[i];
                f = s[fname];

                if (L.isFunction(f) && f!=OP[fname]) {
                    r[fname]=f;
                }
            }
    } : function(){},

    /**
     * <p>
     * Returns a copy of the specified string with special HTML characters
     * escaped. The following characters will be converted to their
     * corresponding character entities:
     * <code>&amp; &lt; &gt; &quot; &#x27; &#x2F; &#x60;</code>
     * </p>
     *
     * <p>
     * This implementation is based on the
     * <a href="http://www.owasp.org/index.php/XSS_(Cross_Site_Scripting)_Prevention_Cheat_Sheet">OWASP
     * HTML escaping recommendations</a>. In addition to the characters
     * in the OWASP recommendation, we also escape the <code>&#x60;</code>
     * character, since IE interprets it as an attribute delimiter when used in
     * innerHTML.
     * </p>
     *
     * @method escapeHTML
     * @param {String} html String to escape.
     * @return {String} Escaped string.
     * @static
     * @since 2.9.0
     */
    escapeHTML: function (html) {
        return html.replace(/[&<>"'\/`]/g, function (match) {
            return HTML_CHARS[match];
        });
    },

    /**
     * Utility to set up the prototype, constructor and superclass properties to
     * support an inheritance strategy that can chain constructors and methods.
     * Static members will not be inherited.
     *
     * @method extend
     * @static
     * @param {Function} subc   the object to modify
     * @param {Function} superc the object to inherit
     * @param {Object} overrides  additional properties/methods to add to the
     *                              subclass prototype.  These will override the
     *                              matching items obtained from the superclass
     *                              if present.
     */
    extend: function(subc, superc, overrides) {
        if (!superc||!subc) {
            throw new Error("extend failed, please check that " +
                            "all dependencies are included.");
        }
        var F = function() {}, i;
        F.prototype=superc.prototype;
        subc.prototype=new F();
        subc.prototype.constructor=subc;
        subc.superclass=superc.prototype;
        if (superc.prototype.constructor == OP.constructor) {
            superc.prototype.constructor=superc;
        }

        if (overrides) {
            for (i in overrides) {
                if (L.hasOwnProperty(overrides, i)) {
                    subc.prototype[i]=overrides[i];
                }
            }

            L._IEEnumFix(subc.prototype, overrides);
        }
    },

    /**
     * Applies all properties in the supplier to the receiver if the
     * receiver does not have these properties yet.  Optionally, one or
     * more methods/properties can be specified (as additional
     * parameters).  This option will overwrite the property if receiver
     * has it already.  If true is passed as the third parameter, all
     * properties will be applied and _will_ overwrite properties in
     * the receiver.
     *
     * @method augmentObject
     * @static
     * @since 2.3.0
     * @param {Function} r  the object to receive the augmentation
     * @param {Function} s  the object that supplies the properties to augment
     * @param {String*|boolean}  arguments zero or more properties methods
     *        to augment the receiver with.  If none specified, everything
     *        in the supplier will be used unless it would
     *        overwrite an existing property in the receiver. If true
     *        is specified as the third parameter, all properties will
     *        be applied and will overwrite an existing property in
     *        the receiver
     */
    augmentObject: function(r, s) {
        if (!s||!r) {
            throw new Error("Absorb failed, verify dependencies.");
        }
        var a=arguments, i, p, overrideList=a[2];
        if (overrideList && overrideList!==true) { // only absorb the specified properties
            for (i=2; i<a.length; i=i+1) {
                r[a[i]] = s[a[i]];
            }
        } else { // take everything, overwriting only if the third parameter is true
            for (p in s) {
                if (overrideList || !(p in r)) {
                    r[p] = s[p];
                }
            }

            L._IEEnumFix(r, s);
        }

        return r;
    },

    /**
     * Same as YAHOO.lang.augmentObject, except it only applies prototype properties
     * @see YAHOO.lang.augmentObject
     * @method augmentProto
     * @static
     * @param {Function} r  the object to receive the augmentation
     * @param {Function} s  the object that supplies the properties to augment
     * @param {String*|boolean}  arguments zero or more properties methods
     *        to augment the receiver with.  If none specified, everything
     *        in the supplier will be used unless it would overwrite an existing
     *        property in the receiver.  if true is specified as the third
     *        parameter, all properties will be applied and will overwrite an
     *        existing property in the receiver
     */
    augmentProto: function(r, s) {
        if (!s||!r) {
            throw new Error("Augment failed, verify dependencies.");
        }
        //var a=[].concat(arguments);
        var a=[r.prototype,s.prototype], i;
        for (i=2;i<arguments.length;i=i+1) {
            a.push(arguments[i]);
        }
        L.augmentObject.apply(this, a);

        return r;
    },


    /**
     * Returns a simple string representation of the object or array.
     * Other types of objects will be returned unprocessed.  Arrays
     * are expected to be indexed.  Use object notation for
     * associative arrays.
     * @method dump
     * @since 2.3.0
     * @param o {Object} The object to dump
     * @param d {int} How deep to recurse child objects, default 3
     * @return {String} the dump result
     */
    dump: function(o, d) {
        var i,len,s=[],OBJ="{...}",FUN="f(){...}",
            COMMA=', ', ARROW=' => ';

        // Cast non-objects to string
        // Skip dates because the std toString is what we want
        // Skip HTMLElement-like objects because trying to dump
        // an element will cause an unhandled exception in FF 2.x
        if (!L.isObject(o)) {
            return o + "";
        } else if (o instanceof Date || ("nodeType" in o && "tagName" in o)) {
            return o;
        } else if  (L.isFunction(o)) {
            return FUN;
        }

        // dig into child objects the depth specifed. Default 3
        d = (L.isNumber(d)) ? d : 3;

        // arrays [1, 2, 3]
        if (L.isArray(o)) {
            s.push("[");
            for (i=0,len=o.length;i<len;i=i+1) {
                if (L.isObject(o[i])) {
                    s.push((d > 0) ? L.dump(o[i], d-1) : OBJ);
                } else {
                    s.push(o[i]);
                }
                s.push(COMMA);
            }
            if (s.length > 1) {
                s.pop();
            }
            s.push("]");
        // objects {k1 => v1, k2 => v2}
        } else {
            s.push("{");
            for (i in o) {
                if (L.hasOwnProperty(o, i)) {
                    s.push(i + ARROW);
                    if (L.isObject(o[i])) {
                        s.push((d > 0) ? L.dump(o[i], d-1) : OBJ);
                    } else {
                        s.push(o[i]);
                    }
                    s.push(COMMA);
                }
            }
            if (s.length > 1) {
                s.pop();
            }
            s.push("}");
        }

        return s.join("");
    },

    /**
     * Does variable substitution on a string. It scans through the string
     * looking for expressions enclosed in { } braces. If an expression
     * is found, it is used a key on the object.  If there is a space in
     * the key, the first word is used for the key and the rest is provided
     * to an optional function to be used to programatically determine the
     * value (the extra information might be used for this decision). If
     * the value for the key in the object, or what is returned from the
     * function has a string value, number value, or object value, it is
     * substituted for the bracket expression and it repeats.  If this
     * value is an object, it uses the Object's toString() if this has
     * been overridden, otherwise it does a shallow dump of the key/value
     * pairs.
     *
     * By specifying the recurse option, the string is rescanned after
     * every replacement, allowing for nested template substitutions.
     * The side effect of this option is that curly braces in the
     * replacement content must be encoded.
     *
     * @method substitute
     * @since 2.3.0
     * @param s {String} The string that will be modified.
     * @param o {Object} An object containing the replacement values
     * @param f {Function} An optional function that can be used to
     *                     process each match.  It receives the key,
     *                     value, and any extra metadata included with
     *                     the key inside of the braces.
     * @param recurse {boolean} default true - if not false, the replaced
     * string will be rescanned so that nested substitutions are possible.
     * @return {String} the substituted string
     */
    substitute: function (s, o, f, recurse) {
        var i, j, k, key, v, meta, saved=[], token, lidx=s.length,
            DUMP='dump', SPACE=' ', LBRACE='{', RBRACE='}',
            dump, objstr;

        for (;;) {
            i = s.lastIndexOf(LBRACE, lidx);
            if (i < 0) {
                break;
            }
            j = s.indexOf(RBRACE, i);
            if (i + 1 > j) {
                break;
            }

            //Extract key and meta info
            token = s.substring(i + 1, j);
            key = token;
            meta = null;
            k = key.indexOf(SPACE);
            if (k > -1) {
                meta = key.substring(k + 1);
                key = key.substring(0, k);
            }

            // lookup the value
            v = o[key];

            // if a substitution function was provided, execute it
            if (f) {
                v = f(key, v, meta);
            }

            if (L.isObject(v)) {
                if (L.isArray(v)) {
                    v = L.dump(v, parseInt(meta, 10));
                } else {
                    meta = meta || "";

                    // look for the keyword 'dump', if found force obj dump
                    dump = meta.indexOf(DUMP);
                    if (dump > -1) {
                        meta = meta.substring(4);
                    }

                    objstr = v.toString();

                    // use the toString if it is not the Object toString
                    // and the 'dump' meta info was not found
                    if (objstr === OBJECT_TOSTRING || dump > -1) {
                        v = L.dump(v, parseInt(meta, 10));
                    } else {
                        v = objstr;
                    }
                }
            } else if (!L.isString(v) && !L.isNumber(v)) {
                // This {block} has no replace string. Save it for later.
                v = "~-" + saved.length + "-~";
                saved[saved.length] = token;

                // break;
            }

            s = s.substring(0, i) + v + s.substring(j + 1);

            if (recurse === false) {
                lidx = i-1;
            }

        }

        // restore saved {block}s
        for (i=saved.length-1; i>=0; i=i-1) {
            s = s.replace(new RegExp("~-" + i + "-~"), "{"  + saved[i] + "}", "g");
        }

        return s;
    },


    /**
     * Returns a string without any leading or trailing whitespace.  If
     * the input is not a string, the input will be returned untouched.
     * @method trim
     * @since 2.3.0
     * @param s {string} the string to trim
     * @return {string} the trimmed string
     */
    trim: function(s){
        try {
            return s.replace(/^\s+|\s+$/g, "");
        } catch(e) {
            return s;
        }
    },

    /**
     * Returns a new object containing all of the properties of
     * all the supplied objects.  The properties from later objects
     * will overwrite those in earlier objects.
     * @method merge
     * @since 2.3.0
     * @param arguments {Object*} the objects to merge
     * @return the new merged object
     */
    merge: function() {
        var o={}, a=arguments, l=a.length, i;
        for (i=0; i<l; i=i+1) {
            L.augmentObject(o, a[i], true);
        }
        return o;
    },

    /**
     * Executes the supplied function in the context of the supplied
     * object 'when' milliseconds later.  Executes the function a
     * single time unless periodic is set to true.
     * @method later
     * @since 2.4.0
     * @param when {int} the number of milliseconds to wait until the fn
     * is executed
     * @param o the context object
     * @param fn {Function|String} the function to execute or the name of
     * the method in the 'o' object to execute
     * @param data [Array] data that is provided to the function.  This accepts
     * either a single item or an array.  If an array is provided, the
     * function is executed with one parameter for each array item.  If
     * you need to pass a single array parameter, it needs to be wrapped in
     * an array [myarray]
     * @param periodic {boolean} if true, executes continuously at supplied
     * interval until canceled
     * @return a timer object. Call the cancel() method on this object to
     * stop the timer.
     */
    later: function(when, o, fn, data, periodic) {
        when = when || 0;
        o = o || {};
        var m=fn, d=data, f, r;

        if (L.isString(fn)) {
            m = o[fn];
        }

        if (!m) {
            throw new TypeError("method undefined");
        }

        if (!L.isUndefined(data) && !L.isArray(d)) {
            d = [data];
        }

        f = function() {
            m.apply(o, d || NOTHING);
        };

        r = (periodic) ? setInterval(f, when) : setTimeout(f, when);

        return {
            interval: periodic,
            cancel: function() {
                if (this.interval) {
                    clearInterval(r);
                } else {
                    clearTimeout(r);
                }
            }
        };
    },

    /**
     * A convenience method for detecting a legitimate non-null value.
     * Returns false for null/undefined/NaN, true for other values,
     * including 0/false/''
     * @method isValue
     * @since 2.3.0
     * @param o {any} the item to test
     * @return {boolean} true if it is not null/undefined/NaN || false
     */
    isValue: function(o) {
        // return (o || o === false || o === 0 || o === ''); // Infinity fails
return (L.isObject(o) || L.isString(o) || L.isNumber(o) || L.isBoolean(o));
    }

};

/**
 * Determines whether or not the property was added
 * to the object instance.  Returns false if the property is not present
 * in the object, or was inherited from the prototype.
 * This abstraction is provided to enable hasOwnProperty for Safari 1.3.x.
 * There is a discrepancy between YAHOO.lang.hasOwnProperty and
 * Object.prototype.hasOwnProperty when the property is a primitive added to
 * both the instance AND prototype with the same value:
 * <pre>
 * var A = function() {};
 * A.prototype.foo = 'foo';
 * var a = new A();
 * a.foo = 'foo';
 * alert(a.hasOwnProperty('foo')); // true
 * alert(YAHOO.lang.hasOwnProperty(a, 'foo')); // false when using fallback
 * </pre>
 * @method hasOwnProperty
 * @param {any} o The object being testing
 * @param prop {string} the name of the property to test
 * @return {boolean} the result
 */
L.hasOwnProperty = (OP.hasOwnProperty) ?
    function(o, prop) {
        return o && o.hasOwnProperty && o.hasOwnProperty(prop);
    } : function(o, prop) {
        return !L.isUndefined(o[prop]) &&
                o.constructor.prototype[prop] !== o[prop];
    };

// new lang wins
OB.augmentObject(L, OB, true);

/*
 * An alias for <a href="YAHOO.lang.html">YAHOO.lang</a>
 * @class YAHOO.util.Lang
 */
YAHOO.util.Lang = L;

/**
 * Same as YAHOO.lang.augmentObject, except it only applies prototype
 * properties.  This is an alias for augmentProto.
 * @see YAHOO.lang.augmentObject
 * @method augment
 * @static
 * @param {Function} r  the object to receive the augmentation
 * @param {Function} s  the object that supplies the properties to augment
 * @param {String*|boolean}  arguments zero or more properties methods to
 *        augment the receiver with.  If none specified, everything
 *        in the supplier will be used unless it would
 *        overwrite an existing property in the receiver.  if true
 *        is specified as the third parameter, all properties will
 *        be applied and will overwrite an existing property in
 *        the receiver
 */
L.augment = L.augmentProto;

/**
 * An alias for <a href="YAHOO.lang.html#augment">YAHOO.lang.augment</a>
 * @for YAHOO
 * @method augment
 * @static
 * @param {Function} r  the object to receive the augmentation
 * @param {Function} s  the object that supplies the properties to augment
 * @param {String*}  arguments zero or more properties methods to
 *        augment the receiver with.  If none specified, everything
 *        in the supplier will be used unless it would
 *        overwrite an existing property in the receiver
 */
YAHOO.augment = L.augmentProto;

/**
 * An alias for <a href="YAHOO.lang.html#extend">YAHOO.lang.extend</a>
 * @method extend
 * @static
 * @param {Function} subc   the object to modify
 * @param {Function} superc the object to inherit
 * @param {Object} overrides  additional properties/methods to add to the
 *        subclass prototype.  These will override the
 *        matching items obtained from the superclass if present.
 */
YAHOO.extend = L.extend;

})();
YAHOO.register("yahoo", YAHOO, {version: "2.9.0", build: "2800"});

/*
Copyright (c) 2011, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://developer.yahoo.com/yui/license.html
version: 2.9.0
*/

/**
 * The CustomEvent class lets you define events for your application
 * that can be subscribed to by one or more independent component.
 *
 * @param {String}  type The type of event, which is passed to the callback
 *                  when the event fires
 * @param {Object}  context The context the event will fire from.  "this" will
 *                  refer to this object in the callback.  Default value:
 *                  the window object.  The listener can override this.
 * @param {boolean} silent pass true to prevent the event from writing to
 *                  the debugsystem
 * @param {int}     signature the signature that the custom event subscriber
 *                  will receive. YAHOO.util.CustomEvent.LIST or
 *                  YAHOO.util.CustomEvent.FLAT.  The default is
 *                  YAHOO.util.CustomEvent.LIST.
 * @param fireOnce {boolean} If configured to fire once, the custom event
 * will only notify subscribers a single time regardless of how many times
 * the event is fired.  In addition, new subscribers will be notified
 * immediately if the event has already been fired.
 * @namespace YAHOO.util
 * @class CustomEvent
 * @constructor
 */
YAHOO.util.CustomEvent = function(type, context, silent, signature, fireOnce) {

    /**
     * The type of event, returned to subscribers when the event fires
     * @property type
     * @type string
     */
    this.type = type;

    /**
     * The context the event will fire from by default. Defaults to the window obj.
     * @property scope
     * @type object
     */
    this.scope = context || window;

    /**
     * By default all custom events are logged in the debug build. Set silent to true
     * to disable debug output for this event.
     * @property silent
     * @type boolean
     */
    this.silent = silent;

    /**
     * If configured to fire once, the custom event will only notify subscribers
     * a single time regardless of how many times the event is fired.  In addition,
     * new subscribers will be notified immediately if the event has already been
     * fired.
     * @property fireOnce
     * @type boolean
     * @default false
     */
    this.fireOnce = fireOnce;

    /**
     * Indicates whether or not this event has ever been fired.
     * @property fired
     * @type boolean
     * @default false
     */
    this.fired = false;

    /**
     * For fireOnce events the arguments the event was fired with are stored
     * so that new subscribers get the proper payload.
     * @property firedWith
     * @type Array
     */
    this.firedWith = null;

    /**
     * Custom events support two styles of arguments provided to the event
     * subscribers.
     * <ul>
     * <li>YAHOO.util.CustomEvent.LIST:
     *   <ul>
     *   <li>param1: event name</li>
     *   <li>param2: array of arguments sent to fire</li>
     *   <li>param3: <optional> a custom object supplied by the subscriber</li>
     *   </ul>
     * </li>
     * <li>YAHOO.util.CustomEvent.FLAT
     *   <ul>
     *   <li>param1: the first argument passed to fire.  If you need to
     *           pass multiple parameters, use and array or object literal</li>
     *   <li>param2: <optional> a custom object supplied by the subscriber</li>
     *   </ul>
     * </li>
     * </ul>
     *   @property signature
     *   @type int
     */
    this.signature = signature || YAHOO.util.CustomEvent.LIST;

    /**
     * The subscribers to this event
     * @property subscribers
     * @type Subscriber[]
     */
    this.subscribers = [];

    if (!this.silent) {
    }

    var onsubscribeType = "_YUICEOnSubscribe";

    // Only add subscribe events for events that are not generated by
    // CustomEvent
    if (type !== onsubscribeType) {

        /**
         * Custom events provide a custom event that fires whenever there is
         * a new subscriber to the event.  This provides an opportunity to
         * handle the case where there is a non-repeating event that has
         * already fired has a new subscriber.
         *
         * @event subscribeEvent
         * @type YAHOO.util.CustomEvent
         * @param fn {Function} The function to execute
         * @param obj <Object> An object to be passed along when the event fires.
         * Defaults to the custom event.
         * @param override <boolean|Object> If true, the obj passed in becomes the
         * execution context of the listener. If an object, that object becomes
         * the execution context. Defaults to the custom event.
         */
        this.subscribeEvent =
                new YAHOO.util.CustomEvent(onsubscribeType, this, true);

    }


    /**
     * In order to make it possible to execute the rest of the subscriber
     * stack when one thows an exception, the subscribers exceptions are
     * caught.  The most recent exception is stored in this property
     * @property lastError
     * @type Error
     */
    this.lastError = null;
};

/**
 * Subscriber listener sigature constant.  The LIST type returns three
 * parameters: the event type, the array of args passed to fire, and
 * the optional custom object
 * @property YAHOO.util.CustomEvent.LIST
 * @static
 * @type int
 */
YAHOO.util.CustomEvent.LIST = 0;

/**
 * Subscriber listener sigature constant.  The FLAT type returns two
 * parameters: the first argument passed to fire and the optional
 * custom object
 * @property YAHOO.util.CustomEvent.FLAT
 * @static
 * @type int
 */
YAHOO.util.CustomEvent.FLAT = 1;

YAHOO.util.CustomEvent.prototype = {

    /**
     * Subscribes the caller to this event
     * @method subscribe
     * @param {Function} fn        The function to execute
     * @param {Object}   obj       An object to be passed along when the event
     * fires.
     * @param {boolean|Object} overrideContext If true, the obj passed in
     * becomes the execution.
     * context of the listener. If an object, that object becomes the execution
     * context.
     */
    subscribe: function(fn, obj, overrideContext) {

        if (!fn) {
throw new Error("Invalid callback for subscriber to '" + this.type + "'");
        }

        if (this.subscribeEvent) {
            this.subscribeEvent.fire(fn, obj, overrideContext);
        }

        var s = new YAHOO.util.Subscriber(fn, obj, overrideContext);

        if (this.fireOnce && this.fired) {
            this.notify(s, this.firedWith);
        } else {
            this.subscribers.push(s);
        }
    },

    /**
     * Unsubscribes subscribers.
     * @method unsubscribe
     * @param {Function} fn  The subscribed function to remove, if not supplied
     *                       all will be removed
     * @param {Object}   obj  The custom object passed to subscribe.  This is
     *                        optional, but if supplied will be used to
     *                        disambiguate multiple listeners that are the same
     *                        (e.g., you subscribe many object using a function
     *                        that lives on the prototype)
     * @return {boolean} True if the subscriber was found and detached.
     */
    unsubscribe: function(fn, obj) {

        if (!fn) {
            return this.unsubscribeAll();
        }

        var found = false;
        for (var i=0, len=this.subscribers.length; i<len; ++i) {
            var s = this.subscribers[i];
            if (s && s.contains(fn, obj)) {
                this._delete(i);
                found = true;
            }
        }

        return found;
    },

    /**
     * Notifies the subscribers.  The callback functions will be executed
     * from the context specified when the event was created, and with the
     * following parameters:
     *   <ul>
     *   <li>The type of event</li>
     *   <li>All of the arguments fire() was executed with as an array</li>
     *   <li>The custom object (if any) that was passed into the subscribe()
     *       method</li>
     *   </ul>
     * @method fire
     * @param {Object*} arguments an arbitrary set of parameters to pass to
     *                            the handler.
     * @return {boolean} false if one of the subscribers returned false,
     *                   true otherwise
     */
    fire: function() {

        this.lastError = null;

        var errors = [],
            len=this.subscribers.length;


        var args=[].slice.call(arguments, 0), ret=true, i, rebuild=false;

        if (this.fireOnce) {
            if (this.fired) {
                return true;
            } else {
                this.firedWith = args;
            }
        }

        this.fired = true;

        if (!len && this.silent) {
            return true;
        }

        if (!this.silent) {
        }

        // make a copy of the subscribers so that there are
        // no index problems if one subscriber removes another.
        var subs = this.subscribers.slice();

        for (i=0; i<len; ++i) {
            var s = subs[i];
            if (!s || !s.fn) {
                rebuild=true;
            } else {

                ret = this.notify(s, args);

                if (false === ret) {
                    if (!this.silent) {
                    }

                    break;
                }
            }
        }

        return (ret !== false);
    },

    notify: function(s, args) {

        var ret, param=null, scope = s.getScope(this.scope),
                 throwErrors = YAHOO.util.Event.throwErrors;

        if (!this.silent) {
        }

        if (this.signature == YAHOO.util.CustomEvent.FLAT) {

            if (args.length > 0) {
                param = args[0];
            }

            try {
                ret = s.fn.call(scope, param, s.obj);
            } catch(e) {
                this.lastError = e;
                // errors.push(e);
                if (throwErrors) {
                    throw e;
                }
            }
        } else {
            try {
                ret = s.fn.call(scope, this.type, args, s.obj);
            } catch(ex) {
                this.lastError = ex;
                if (throwErrors) {
                    throw ex;
                }
            }
        }

        return ret;
    },

    /**
     * Removes all listeners
     * @method unsubscribeAll
     * @return {int} The number of listeners unsubscribed
     */
    unsubscribeAll: function() {
        var l = this.subscribers.length, i;
        for (i=l-1; i>-1; i--) {
            this._delete(i);
        }

        this.subscribers=[];

        return l;
    },

    /**
     * @method _delete
     * @private
     */
    _delete: function(index) {
        var s = this.subscribers[index];
        if (s) {
            delete s.fn;
            delete s.obj;
        }

        // this.subscribers[index]=null;
        this.subscribers.splice(index, 1);
    },

    /**
     * @method toString
     */
    toString: function() {
         return "CustomEvent: " + "'" + this.type  + "', " +
             "context: " + this.scope;

    }
};

/////////////////////////////////////////////////////////////////////

/**
 * Stores the subscriber information to be used when the event fires.
 * @param {Function} fn       The function to execute
 * @param {Object}   obj      An object to be passed along when the event fires
 * @param {boolean}  overrideContext If true, the obj passed in becomes the execution
 *                            context of the listener
 * @class Subscriber
 * @constructor
 */
YAHOO.util.Subscriber = function(fn, obj, overrideContext) {

    /**
     * The callback that will be execute when the event fires
     * @property fn
     * @type function
     */
    this.fn = fn;

    /**
     * An optional custom object that will passed to the callback when
     * the event fires
     * @property obj
     * @type object
     */
    this.obj = YAHOO.lang.isUndefined(obj) ? null : obj;

    /**
     * The default execution context for the event listener is defined when the
     * event is created (usually the object which contains the event).
     * By setting overrideContext to true, the execution context becomes the custom
     * object passed in by the subscriber.  If overrideContext is an object, that
     * object becomes the context.
     * @property overrideContext
     * @type boolean|object
     */
    this.overrideContext = overrideContext;

};

/**
 * Returns the execution context for this listener.  If overrideContext was set to true
 * the custom obj will be the context.  If overrideContext is an object, that is the
 * context, otherwise the default context will be used.
 * @method getScope
 * @param {Object} defaultScope the context to use if this listener does not
 *                              override it.
 */
YAHOO.util.Subscriber.prototype.getScope = function(defaultScope) {
    if (this.overrideContext) {
        if (this.overrideContext === true) {
            return this.obj;
        } else {
            return this.overrideContext;
        }
    }
    return defaultScope;
};

/**
 * Returns true if the fn and obj match this objects properties.
 * Used by the unsubscribe method to match the right subscriber.
 *
 * @method contains
 * @param {Function} fn the function to execute
 * @param {Object} obj an object to be passed along when the event fires
 * @return {boolean} true if the supplied arguments match this
 *                   subscriber's signature.
 */
YAHOO.util.Subscriber.prototype.contains = function(fn, obj) {
    if (obj) {
        return (this.fn == fn && this.obj == obj);
    } else {
        return (this.fn == fn);
    }
};

/**
 * @method toString
 */
YAHOO.util.Subscriber.prototype.toString = function() {
    return "Subscriber { obj: " + this.obj  +
           ", overrideContext: " +  (this.overrideContext || "no") + " }";
};

/**
 * The Event Utility provides utilities for managing DOM Events and tools
 * for building event systems
 *
 * @module event
 * @title Event Utility
 * @namespace YAHOO.util
 * @requires yahoo
 */

// The first instance of Event will win if it is loaded more than once.
// @TODO this needs to be changed so that only the state data that needs to
// be preserved is kept, while methods are overwritten/added as needed.
// This means that the module pattern can't be used.
if (!YAHOO.util.Event) {

/**
 * The event utility provides functions to add and remove event listeners,
 * event cleansing.  It also tries to automatically remove listeners it
 * registers during the unload event.
 *
 * @class Event
 * @static
 */
    YAHOO.util.Event = function() {

        /**
         * True after the onload event has fired
         * @property loadComplete
         * @type boolean
         * @static
         * @private
         */
        var loadComplete =  false,

        /**
         * Cache of wrapped listeners
         * @property listeners
         * @type array
         * @static
         * @private
         */
        listeners = [],


        /**
         * User-defined unload function that will be fired before all events
         * are detached
         * @property unloadListeners
         * @type array
         * @static
         * @private
         */
        unloadListeners = [],

        /**
         * The number of times to poll after window.onload.  This number is
         * increased if additional late-bound handlers are requested after
         * the page load.
         * @property retryCount
         * @static
         * @private
         */
        retryCount = 0,

        /**
         * onAvailable listeners
         * @property onAvailStack
         * @static
         * @private
         */
        onAvailStack = [],

        /**
         * Counter for auto id generation
         * @property counter
         * @static
         * @private
         */
        counter = 0,

        /**
         * Normalized keycodes for webkit/safari
         * @property webkitKeymap
         * @type {int: int}
         * @private
         * @static
         * @final
         */
         webkitKeymap = {
            63232: 38, // up
            63233: 40, // down
            63234: 37, // left
            63235: 39, // right
            63276: 33, // page up
            63277: 34, // page down
            25: 9      // SHIFT-TAB (Safari provides a different key code in
                       // this case, even though the shiftKey modifier is set)
        },

        isIE = YAHOO.env.ua.ie,

        // String constants used by the addFocusListener and removeFocusListener methods

        FOCUSIN = "focusin",
        FOCUSOUT = "focusout";

        return {

            /**
             * The number of times we should look for elements that are not
             * in the DOM at the time the event is requested after the document
             * has been loaded.  The default is 500@amp;40 ms, so it will poll
             * for 20 seconds or until all outstanding handlers are bound
             * (whichever comes first).
             * @property POLL_RETRYS
             * @type int
             * @static
             * @final
             */
            POLL_RETRYS: 500,

            /**
             * The poll interval in milliseconds
             * @property POLL_INTERVAL
             * @type int
             * @static
             * @final
             */
            POLL_INTERVAL: 40,

            /**
             * Element to bind, int constant
             * @property EL
             * @type int
             * @static
             * @final
             */
            EL: 0,

            /**
             * Type of event, int constant
             * @property TYPE
             * @type int
             * @static
             * @final
             */
            TYPE: 1,

            /**
             * Function to execute, int constant
             * @property FN
             * @type int
             * @static
             * @final
             */
            FN: 2,

            /**
             * Function wrapped for context correction and cleanup, int constant
             * @property WFN
             * @type int
             * @static
             * @final
             */
            WFN: 3,

            /**
             * Object passed in by the user that will be returned as a
             * parameter to the callback, int constant.  Specific to
             * unload listeners
             * @property OBJ
             * @type int
             * @static
             * @final
             */
            UNLOAD_OBJ: 3,

            /**
             * Adjusted context, either the element we are registering the event
             * on or the custom object passed in by the listener, int constant
             * @property ADJ_SCOPE
             * @type int
             * @static
             * @final
             */
            ADJ_SCOPE: 4,

            /**
             * The original obj passed into addListener
             * @property OBJ
             * @type int
             * @static
             * @final
             */
            OBJ: 5,

            /**
             * The original context parameter passed into addListener
             * @property OVERRIDE
             * @type int
             * @static
             * @final
             */
            OVERRIDE: 6,

            /**
             * The original capture parameter passed into addListener
             * @property CAPTURE
             * @type int
             * @static
             * @final
             */
            CAPTURE: 7,

            /**
             * addListener/removeListener can throw errors in unexpected scenarios.
             * These errors are suppressed, the method returns false, and this property
             * is set
             * @property lastError
             * @static
             * @type Error
             */
            lastError: null,

            /**
             * Safari detection
             * @property isSafari
             * @private
             * @static
             * @deprecated use YAHOO.env.ua.webkit
             */
            isSafari: YAHOO.env.ua.webkit,

            /**
             * webkit version
             * @property webkit
             * @type string
             * @private
             * @static
             * @deprecated use YAHOO.env.ua.webkit
             */
            webkit: YAHOO.env.ua.webkit,

            /**
             * IE detection
             * @property isIE
             * @private
             * @static
             * @deprecated use YAHOO.env.ua.ie
             */
            isIE: isIE,

            /**
             * poll handle
             * @property _interval
             * @static
             * @private
             */
            _interval: null,

            /**
             * document readystate poll handle
             * @property _dri
             * @static
             * @private
             */
             _dri: null,


            /**
             * Map of special event types
             * @property _specialTypes
             * @static
             * @private
             */
            _specialTypes: {
                focusin: (isIE ? "focusin" : "focus"),
                focusout: (isIE ? "focusout" : "blur")
            },


            /**
             * True when the document is initially usable
             * @property DOMReady
             * @type boolean
             * @static
             */
            DOMReady: false,

            /**
             * Errors thrown by subscribers of custom events are caught
             * and the error message is written to the debug console.  If
             * this property is set to true, it will also re-throw the
             * error.
             * @property throwErrors
             * @type boolean
             * @default false
             */
            throwErrors: false,


            /**
             * @method startInterval
             * @static
             * @private
             */
            startInterval: function() {
                if (!this._interval) {
                    // var self = this;
                    // var callback = function() { self._tryPreloadAttach(); };
                    // this._interval = setInterval(callback, this.POLL_INTERVAL);
                    this._interval = YAHOO.lang.later(this.POLL_INTERVAL, this, this._tryPreloadAttach, null, true);
                }
            },

            /**
             * Executes the supplied callback when the item with the supplied
             * id is found.  This is meant to be used to execute behavior as
             * soon as possible as the page loads.  If you use this after the
             * initial page load it will poll for a fixed time for the element.
             * The number of times it will poll and the frequency are
             * configurable.  By default it will poll for 10 seconds.
             *
             * <p>The callback is executed with a single parameter:
             * the custom object parameter, if provided.</p>
             *
             * @method onAvailable
             *
             * @param {string||string[]}   id the id of the element, or an array
             * of ids to look for.
             * @param {function} fn what to execute when the element is found.
             * @param {object}   obj an optional object to be passed back as
             *                   a parameter to fn.
             * @param {boolean|object}  overrideContext If set to true, fn will execute
             *                   in the context of obj, if set to an object it
             *                   will execute in the context of that object
             * @param checkContent {boolean} check child node readiness (onContentReady)
             * @static
             */
            onAvailable: function(id, fn, obj, overrideContext, checkContent) {

                var a = (YAHOO.lang.isString(id)) ? [id] : id;

                for (var i=0; i<a.length; i=i+1) {
                    onAvailStack.push({id:         a[i],
                                       fn:         fn,
                                       obj:        obj,
                                       overrideContext:   overrideContext,
                                       checkReady: checkContent });
                }

                retryCount = this.POLL_RETRYS;

                this.startInterval();
            },

            /**
             * Works the same way as onAvailable, but additionally checks the
             * state of sibling elements to determine if the content of the
             * available element is safe to modify.
             *
             * <p>The callback is executed with a single parameter:
             * the custom object parameter, if provided.</p>
             *
             * @method onContentReady
             *
             * @param {string}   id the id of the element to look for.
             * @param {function} fn what to execute when the element is ready.
             * @param {object}   obj an optional object to be passed back as
             *                   a parameter to fn.
             * @param {boolean|object}  overrideContext If set to true, fn will execute
             *                   in the context of obj.  If an object, fn will
             *                   exectute in the context of that object
             *
             * @static
             */
            onContentReady: function(id, fn, obj, overrideContext) {
                this.onAvailable(id, fn, obj, overrideContext, true);
            },

            /**
             * Executes the supplied callback when the DOM is first usable.  This
             * will execute immediately if called after the DOMReady event has
             * fired.   @todo the DOMContentReady event does not fire when the
             * script is dynamically injected into the page.  This means the
             * DOMReady custom event will never fire in FireFox or Opera when the
             * library is injected.  It _will_ fire in Safari, and the IE
             * implementation would allow for us to fire it if the defered script
             * is not available.  We want this to behave the same in all browsers.
             * Is there a way to identify when the script has been injected
             * instead of included inline?  Is there a way to know whether the
             * window onload event has fired without having had a listener attached
             * to it when it did so?
             *
             * <p>The callback is a CustomEvent, so the signature is:</p>
             * <p>type &lt;string&gt;, args &lt;array&gt;, customobject &lt;object&gt;</p>
             * <p>For DOMReady events, there are no fire argments, so the
             * signature is:</p>
             * <p>"DOMReady", [], obj</p>
             *
             *
             * @method onDOMReady
             *
             * @param {function} fn what to execute when the element is found.
             * @param {object}   obj an optional object to be passed back as
             *                   a parameter to fn.
             * @param {boolean|object}  overrideContext If set to true, fn will execute
             *                   in the context of obj, if set to an object it
             *                   will execute in the context of that object
             *
             * @static
             */
            // onDOMReady: function(fn, obj, overrideContext) {
            onDOMReady: function() {
                this.DOMReadyEvent.subscribe.apply(this.DOMReadyEvent, arguments);
            },


            /**
             * Appends an event handler
             *
             * @method _addListener
             *
             * @param {String|HTMLElement|Array|NodeList} el An id, an element
             *  reference, or a collection of ids and/or elements to assign the
             *  listener to.
             * @param {String}   sType     The type of event to append
             * @param {Function} fn        The method the event invokes
             * @param {Object}   obj    An arbitrary object that will be
             *                             passed as a parameter to the handler
             * @param {Boolean|object}  overrideContext  If true, the obj passed in becomes
             *                             the execution context of the listener. If an
             *                             object, this object becomes the execution
             *                             context.
             * @param {boolen}      capture capture or bubble phase
             * @return {Boolean} True if the action was successful or defered,
             *                        false if one or more of the elements
             *                        could not have the listener attached,
             *                        or if the operation throws an exception.
             * @private
             * @static
             */
            _addListener: function(el, sType, fn, obj, overrideContext, bCapture) {

                if (!fn || !fn.call) {
                    return false;
                }

                // The el argument can be an array of elements or element ids.
                if ( this._isValidCollection(el)) {
                    var ok = true;
                    for (var i=0,len=el.length; i<len; ++i) {
                        ok = this.on(el[i],
                                       sType,
                                       fn,
                                       obj,
                                       overrideContext) && ok;
                    }
                    return ok;

                } else if (YAHOO.lang.isString(el)) {
                    var oEl = this.getEl(el);
                    // If the el argument is a string, we assume it is
                    // actually the id of the element.  If the page is loaded
                    // we convert el to the actual element, otherwise we
                    // defer attaching the event until onload event fires

                    // check to see if we need to delay hooking up the event
                    // until after the page loads.
                    if (oEl) {
                        el = oEl;
                    } else {
                        // defer adding the event until the element is available
                        this.onAvailable(el, function() {
                           YAHOO.util.Event._addListener(el, sType, fn, obj, overrideContext, bCapture);
                        });

                        return true;
                    }
                }

                // Element should be an html element or an array if we get
                // here.
                if (!el) {
                    return false;
                }

                // we need to make sure we fire registered unload events
                // prior to automatically unhooking them.  So we hang on to
                // these instead of attaching them to the window and fire the
                // handles explicitly during our one unload event.
                if ("unload" == sType && obj !== this) {
                    unloadListeners[unloadListeners.length] =
                            [el, sType, fn, obj, overrideContext];
                    return true;
                }


                // if the user chooses to override the context, we use the custom
                // object passed in, otherwise the executing context will be the
                // HTML element that the event is registered on
                var context = el;
                if (overrideContext) {
                    if (overrideContext === true) {
                        context = obj;
                    } else {
                        context = overrideContext;
                    }
                }

                // wrap the function so we can return the obj object when
                // the event fires;
                var wrappedFn = function(e) {
                        return fn.call(context, YAHOO.util.Event.getEvent(e, el),
                                obj);
                    };

                var li = [el, sType, fn, wrappedFn, context, obj, overrideContext, bCapture];
                var index = listeners.length;
                // cache the listener so we can try to automatically unload
                listeners[index] = li;

                try {
                    this._simpleAdd(el, sType, wrappedFn, bCapture);
                } catch(ex) {
                    // handle an error trying to attach an event.  If it fails
                    // we need to clean up the cache
                    this.lastError = ex;
                    this.removeListener(el, sType, fn);
                    return false;
                }

                return true;

            },

            /**
             * Checks to see if the type requested is a special type
             * (as defined by the _specialTypes hash), and (if so) returns
             * the special type name.
             *
             * @method _getType
             *
             * @param {String}   sType     The type to look up
             * @private
             */
            _getType: function (type) {

                return this._specialTypes[type] || type;

            },


            /**
             * Appends an event handler
             *
             * @method addListener
             *
             * @param {String|HTMLElement|Array|NodeList} el An id, an element
             *  reference, or a collection of ids and/or elements to assign the
             *  listener to.
             * @param {String}   sType     The type of event to append
             * @param {Function} fn        The method the event invokes
             * @param {Object}   obj    An arbitrary object that will be
             *                             passed as a parameter to the handler
             * @param {Boolean|object}  overrideContext  If true, the obj passed in becomes
             *                             the execution context of the listener. If an
             *                             object, this object becomes the execution
             *                             context.
             * @return {Boolean} True if the action was successful or defered,
             *                        false if one or more of the elements
             *                        could not have the listener attached,
             *                        or if the operation throws an exception.
             * @static
             */
            addListener: function (el, sType, fn, obj, overrideContext) {

                var capture = ((sType == FOCUSIN || sType == FOCUSOUT) && !YAHOO.env.ua.ie) ? true : false;

                return this._addListener(el, this._getType(sType), fn, obj, overrideContext, capture);

            },


            /**
             * Attaches a focusin event listener to the specified element for
             * the purpose of listening for the focus event on the element's
             * descendants.
             * @method addFocusListener
             *
             * @param {String|HTMLElement|Array|NodeList} el An id, an element
             *  reference, or a collection of ids and/or elements to assign the
             *  listener to.
             * @param {Function} fn        The method the event invokes
             * @param {Object}   obj    An arbitrary object that will be
             *                             passed as a parameter to the handler
             * @param {Boolean|object}  overrideContext  If true, the obj passed in becomes
             *                             the execution context of the listener. If an
             *                             object, this object becomes the execution
             *                             context.
             * @return {Boolean} True if the action was successful or defered,
             *                        false if one or more of the elements
             *                        could not have the listener attached,
             *                        or if the operation throws an exception.
             * @static
            * @deprecated use YAHOO.util.Event.on and specify "focusin" as the event type.
             */
            addFocusListener: function (el, fn, obj, overrideContext) {
                return this.on(el, FOCUSIN, fn, obj, overrideContext);
            },


            /**
             * Removes a focusin event listener to the specified element for
             * the purpose of listening for the focus event on the element's
             * descendants.
             *
             * @method removeFocusListener
             *
             * @param {String|HTMLElement|Array|NodeList} el An id, an element
             *  reference, or a collection of ids and/or elements to remove
             *  the listener from.
             * @param {Function} fn the method the event invokes.  If fn is
             *  undefined, then all event handlers for the type of event are
             *  removed.
             * @return {boolean} true if the unbind was successful, false
             *  otherwise.
             * @static
             * @deprecated use YAHOO.util.Event.removeListener and specify "focusin" as the event type.
             */
            removeFocusListener: function (el, fn) {
                return this.removeListener(el, FOCUSIN, fn);
            },

            /**
             * Attaches a focusout event listener to the specified element for
             * the purpose of listening for the blur event on the element's
             * descendants.
             *
             * @method addBlurListener
             *
             * @param {String|HTMLElement|Array|NodeList} el An id, an element
             *  reference, or a collection of ids and/or elements to assign the
             *  listener to.
             * @param {Function} fn        The method the event invokes
             * @param {Object}   obj    An arbitrary object that will be
             *                             passed as a parameter to the handler
             * @param {Boolean|object}  overrideContext  If true, the obj passed in becomes
             *                             the execution context of the listener. If an
             *                             object, this object becomes the execution
             *                             context.
             * @return {Boolean} True if the action was successful or defered,
             *                        false if one or more of the elements
             *                        could not have the listener attached,
             *                        or if the operation throws an exception.
             * @static
             * @deprecated use YAHOO.util.Event.on and specify "focusout" as the event type.
             */
            addBlurListener: function (el, fn, obj, overrideContext) {
                return this.on(el, FOCUSOUT, fn, obj, overrideContext);
            },

            /**
             * Removes a focusout event listener to the specified element for
             * the purpose of listening for the blur event on the element's
             * descendants.
             *
             * @method removeBlurListener
             *
             * @param {String|HTMLElement|Array|NodeList} el An id, an element
             *  reference, or a collection of ids and/or elements to remove
             *  the listener from.
             * @param {Function} fn the method the event invokes.  If fn is
             *  undefined, then all event handlers for the type of event are
             *  removed.
             * @return {boolean} true if the unbind was successful, false
             *  otherwise.
             * @static
             * @deprecated use YAHOO.util.Event.removeListener and specify "focusout" as the event type.
             */
            removeBlurListener: function (el, fn) {
                return this.removeListener(el, FOCUSOUT, fn);
            },

            /**
             * Removes an event listener
             *
             * @method removeListener
             *
             * @param {String|HTMLElement|Array|NodeList} el An id, an element
             *  reference, or a collection of ids and/or elements to remove
             *  the listener from.
             * @param {String} sType the type of event to remove.
             * @param {Function} fn the method the event invokes.  If fn is
             *  undefined, then all event handlers for the type of event are
             *  removed.
             * @return {boolean} true if the unbind was successful, false
             *  otherwise.
             * @static
             */
            removeListener: function(el, sType, fn) {
                var i, len, li;

                sType = this._getType(sType);

                // The el argument can be a string
                if (typeof el == "string") {
                    el = this.getEl(el);
                // The el argument can be an array of elements or element ids.
                } else if ( this._isValidCollection(el)) {
                    var ok = true;
                    for (i=el.length-1; i>-1; i--) {
                        ok = ( this.removeListener(el[i], sType, fn) && ok );
                    }
                    return ok;
                }

                if (!fn || !fn.call) {
                    //return false;
                    return this.purgeElement(el, false, sType);
                }

                if ("unload" == sType) {

                    for (i=unloadListeners.length-1; i>-1; i--) {
                        li = unloadListeners[i];
                        if (li &&
                            li[0] == el &&
                            li[1] == sType &&
                            li[2] == fn) {
                                unloadListeners.splice(i, 1);
                                // unloadListeners[i]=null;
                                return true;
                        }
                    }

                    return false;
                }

                var cacheItem = null;

                // The index is a hidden parameter; needed to remove it from
                // the method signature because it was tempting users to
                // try and take advantage of it, which is not possible.
                var index = arguments[3];

                if ("undefined" === typeof index) {
                    index = this._getCacheIndex(listeners, el, sType, fn);
                }

                if (index >= 0) {
                    cacheItem = listeners[index];
                }

                if (!el || !cacheItem) {
                    return false;
                }


                var bCapture = cacheItem[this.CAPTURE] === true ? true : false;

                try {
                    this._simpleRemove(el, sType, cacheItem[this.WFN], bCapture);
                } catch(ex) {
                    this.lastError = ex;
                    return false;
                }

                // removed the wrapped handler
                delete listeners[index][this.WFN];
                delete listeners[index][this.FN];
                listeners.splice(index, 1);
                // listeners[index]=null;

                return true;

            },

            /**
             * Returns the event's target element.  Safari sometimes provides
             * a text node, and this is automatically resolved to the text
             * node's parent so that it behaves like other browsers.
             * @method getTarget
             * @param {Event} ev the event
             * @param {boolean} resolveTextNode when set to true the target's
             *                  parent will be returned if the target is a
             *                  text node.  @deprecated, the text node is
             *                  now resolved automatically
             * @return {HTMLElement} the event's target
             * @static
             */
            getTarget: function(ev, resolveTextNode) {
                var t = ev.target || ev.srcElement;
                return this.resolveTextNode(t);
            },

            /**
             * In some cases, some browsers will return a text node inside
             * the actual element that was targeted.  This normalizes the
             * return value for getTarget and getRelatedTarget.
             *
             * If accessing a property of the node throws an error, this is
             * probably the anonymous div wrapper Gecko adds inside text
             * nodes.  This likely will only occur when attempting to access
             * the relatedTarget.  In this case, we now return null because
             * the anonymous div is completely useless and we do not know
             * what the related target was because we can't even get to
             * the element's parent node.
             *
             * @method resolveTextNode
             * @param {HTMLElement} node node to resolve
             * @return {HTMLElement} the normized node
             * @static
             */
            resolveTextNode: function(n) {
                try {
                    if (n && 3 == n.nodeType) {
                        return n.parentNode;
                    }
                } catch(e) {
                    return null;
                }

                return n;
            },

            /**
             * Returns the event's pageX
             * @method getPageX
             * @param {Event} ev the event
             * @return {int} the event's pageX
             * @static
             */
            getPageX: function(ev) {
                var x = ev.pageX;
                if (!x && 0 !== x) {
                    x = ev.clientX || 0;

                    if ( this.isIE ) {
                        x += this._getScrollLeft();
                    }
                }

                return x;
            },

            /**
             * Returns the event's pageY
             * @method getPageY
             * @param {Event} ev the event
             * @return {int} the event's pageY
             * @static
             */
            getPageY: function(ev) {
                var y = ev.pageY;
                if (!y && 0 !== y) {
                    y = ev.clientY || 0;

                    if ( this.isIE ) {
                        y += this._getScrollTop();
                    }
                }


                return y;
            },

            /**
             * Returns the pageX and pageY properties as an indexed array.
             * @method getXY
             * @param {Event} ev the event
             * @return {[x, y]} the pageX and pageY properties of the event
             * @static
             */
            getXY: function(ev) {
                return [this.getPageX(ev), this.getPageY(ev)];
            },

            /**
             * Returns the event's related target
             * @method getRelatedTarget
             * @param {Event} ev the event
             * @return {HTMLElement} the event's relatedTarget
             * @static
             */
            getRelatedTarget: function(ev) {
                var t = ev.relatedTarget;
                if (!t) {
                    if (ev.type == "mouseout") {
                        t = ev.toElement;
                    } else if (ev.type == "mouseover") {
                        t = ev.fromElement;
                    }
                }

                return this.resolveTextNode(t);
            },

            /**
             * Returns the time of the event.  If the time is not included, the
             * event is modified using the current time.
             * @method getTime
             * @param {Event} ev the event
             * @return {Date} the time of the event
             * @static
             */
            getTime: function(ev) {
                if (!ev.time) {
                    var t = new Date().getTime();
                    try {
                        ev.time = t;
                    } catch(ex) {
                        this.lastError = ex;
                        return t;
                    }
                }

                return ev.time;
            },

            /**
             * Convenience method for stopPropagation + preventDefault
             * @method stopEvent
             * @param {Event} ev the event
             * @static
             */
            stopEvent: function(ev) {
                this.stopPropagation(ev);
                this.preventDefault(ev);
            },

            /**
             * Stops event propagation
             * @method stopPropagation
             * @param {Event} ev the event
             * @static
             */
            stopPropagation: function(ev) {
                if (ev.stopPropagation) {
                    ev.stopPropagation();
                } else {
                    ev.cancelBubble = true;
                }
            },

            /**
             * Prevents the default behavior of the event
             * @method preventDefault
             * @param {Event} ev the event
             * @static
             */
            preventDefault: function(ev) {
                if (ev.preventDefault) {
                    ev.preventDefault();
                } else {
                    ev.returnValue = false;
                }
            },

            /**
             * Finds the event in the window object, the caller's arguments, or
             * in the arguments of another method in the callstack.  This is
             * executed automatically for events registered through the event
             * manager, so the implementer should not normally need to execute
             * this function at all.
             * @method getEvent
             * @param {Event} e the event parameter from the handler
             * @param {HTMLElement} boundEl the element the listener is attached to
             * @return {Event} the event
             * @static
             */
            getEvent: function(e, boundEl) {
                var ev = e || window.event;

                if (!ev) {
                    var c = this.getEvent.caller;
                    while (c) {
                        ev = c.arguments[0];
                        if (ev && Event == ev.constructor) {
                            break;
                        }
                        c = c.caller;
                    }
                }

                return ev;
            },

            /**
             * Returns the charcode for an event
             * @method getCharCode
             * @param {Event} ev the event
             * @return {int} the event's charCode
             * @static
             */
            getCharCode: function(ev) {
                var code = ev.keyCode || ev.charCode || 0;

                // webkit key normalization
                if (YAHOO.env.ua.webkit && (code in webkitKeymap)) {
                    code = webkitKeymap[code];
                }
                return code;
            },

            /**
             * Locating the saved event handler data by function ref
             *
             * @method _getCacheIndex
             * @static
             * @private
             */
            _getCacheIndex: function(a, el, sType, fn) {
                for (var i=0, l=a.length; i<l; i=i+1) {
                    var li = a[i];
                    if ( li                 &&
                         li[this.FN] == fn  &&
                         li[this.EL] == el  &&
                         li[this.TYPE] == sType ) {
                        return i;
                    }
                }

                return -1;
            },

            /**
             * Generates an unique ID for the element if it does not already
             * have one.
             * @method generateId
             * @param el the element to create the id for
             * @return {string} the resulting id of the element
             * @static
             */
            generateId: function(el) {
                var id = el.id;

                if (!id) {
                    id = "yuievtautoid-" + counter;
                    ++counter;
                    el.id = id;
                }

                return id;
            },


            /**
             * We want to be able to use getElementsByTagName as a collection
             * to attach a group of events to.  Unfortunately, different
             * browsers return different types of collections.  This function
             * tests to determine if the object is array-like.  It will also
             * fail if the object is an array, but is empty.
             * @method _isValidCollection
             * @param o the object to test
             * @return {boolean} true if the object is array-like and populated
             * @static
             * @private
             */
            _isValidCollection: function(o) {
                try {
                    return ( o                     && // o is something
                             typeof o !== "string" && // o is not a string
                             o.length              && // o is indexed
                             !o.tagName            && // o is not an HTML element
                             !o.alert              && // o is not a window
                             typeof o[0] !== "undefined" );
                } catch(ex) {
                    return false;
                }

            },

            /**
             * @private
             * @property elCache
             * DOM element cache
             * @static
             * @deprecated Elements are not cached due to issues that arise when
             * elements are removed and re-added
             */
            elCache: {},

            /**
             * We cache elements bound by id because when the unload event
             * fires, we can no longer use document.getElementById
             * @method getEl
             * @static
             * @private
             * @deprecated Elements are not cached any longer
             */
            getEl: function(id) {
                return (typeof id === "string") ? document.getElementById(id) : id;
            },

            /**
             * Clears the element cache
             * @deprecated Elements are not cached any longer
             * @method clearCache
             * @static
             * @private
             */
            clearCache: function() { },

            /**
             * Custom event the fires when the dom is initially usable
             * @event DOMReadyEvent
             */
            DOMReadyEvent: new YAHOO.util.CustomEvent("DOMReady", YAHOO, 0, 0, 1),

            /**
             * hook up any deferred listeners
             * @method _load
             * @static
             * @private
             */
            _load: function(e) {

                if (!loadComplete) {
                    loadComplete = true;
                    var EU = YAHOO.util.Event;

                    // Just in case DOMReady did not go off for some reason
                    EU._ready();

                    // Available elements may not have been detected before the
                    // window load event fires. Try to find them now so that the
                    // the user is more likely to get the onAvailable notifications
                    // before the window load notification
                    EU._tryPreloadAttach();

                }
            },

            /**
             * Fires the DOMReady event listeners the first time the document is
             * usable.
             * @method _ready
             * @static
             * @private
             */
            _ready: function(e) {
                var EU = YAHOO.util.Event;
                if (!EU.DOMReady) {
                    EU.DOMReady=true;

                    // Fire the content ready custom event
                    EU.DOMReadyEvent.fire();

                    // Remove the DOMContentLoaded (FF/Opera)
                    EU._simpleRemove(document, "DOMContentLoaded", EU._ready);
                }
            },

            /**
             * Polling function that runs before the onload event fires,
             * attempting to attach to DOM Nodes as soon as they are
             * available
             * @method _tryPreloadAttach
             * @static
             * @private
             */
            _tryPreloadAttach: function() {

                if (onAvailStack.length === 0) {
                    retryCount = 0;
                    if (this._interval) {
                        // clearInterval(this._interval);
                        this._interval.cancel();
                        this._interval = null;
                    }
                    return;
                }

                if (this.locked) {
                    return;
                }

                if (this.isIE) {
                    // Hold off if DOMReady has not fired and check current
                    // readyState to protect against the IE operation aborted
                    // issue.
                    if (!this.DOMReady) {
                        this.startInterval();
                        return;
                    }
                }

                this.locked = true;


                // keep trying until after the page is loaded.  We need to
                // check the page load state prior to trying to bind the
                // elements so that we can be certain all elements have been
                // tested appropriately
                var tryAgain = !loadComplete;
                if (!tryAgain) {
                    tryAgain = (retryCount > 0 && onAvailStack.length > 0);
                }

                // onAvailable
                var notAvail = [];

                var executeItem = function (el, item) {
                    var context = el;
                    if (item.overrideContext) {
                        if (item.overrideContext === true) {
                            context = item.obj;
                        } else {
                            context = item.overrideContext;
                        }
                    }
                    item.fn.call(context, item.obj);
                };

                var i, len, item, el, ready=[];

                // onAvailable onContentReady
                for (i=0, len=onAvailStack.length; i<len; i=i+1) {
                    item = onAvailStack[i];
                    if (item) {
                        el = this.getEl(item.id);
                        if (el) {
                            if (item.checkReady) {
                                if (loadComplete || el.nextSibling || !tryAgain) {
                                    ready.push(item);
                                    onAvailStack[i] = null;
                                }
                            } else {
                                executeItem(el, item);
                                onAvailStack[i] = null;
                            }
                        } else {
                            notAvail.push(item);
                        }
                    }
                }

                // make sure onContentReady fires after onAvailable
                for (i=0, len=ready.length; i<len; i=i+1) {
                    item = ready[i];
                    executeItem(this.getEl(item.id), item);
                }


                retryCount--;

                if (tryAgain) {
                    for (i=onAvailStack.length-1; i>-1; i--) {
                        item = onAvailStack[i];
                        if (!item || !item.id) {
                            onAvailStack.splice(i, 1);
                        }
                    }

                    this.startInterval();
                } else {
                    if (this._interval) {
                        // clearInterval(this._interval);
                        this._interval.cancel();
                        this._interval = null;
                    }
                }

                this.locked = false;

            },

            /**
             * Removes all listeners attached to the given element via addListener.
             * Optionally, the node's children can also be purged.
             * Optionally, you can specify a specific type of event to remove.
             * @method purgeElement
             * @param {HTMLElement} el the element to purge
             * @param {boolean} recurse recursively purge this element's children
             * as well.  Use with caution.
             * @param {string} sType optional type of listener to purge. If
             * left out, all listeners will be removed
             * @static
             */
            purgeElement: function(el, recurse, sType) {
                var oEl = (YAHOO.lang.isString(el)) ? this.getEl(el) : el;
                var elListeners = this.getListeners(oEl, sType), i, len;
                if (elListeners) {
                    for (i=elListeners.length-1; i>-1; i--) {
                        var l = elListeners[i];
                        this.removeListener(oEl, l.type, l.fn);
                    }
                }

                if (recurse && oEl && oEl.childNodes) {
                    for (i=0,len=oEl.childNodes.length; i<len ; ++i) {
                        this.purgeElement(oEl.childNodes[i], recurse, sType);
                    }
                }
            },

            /**
             * Returns all listeners attached to the given element via addListener.
             * Optionally, you can specify a specific type of event to return.
             * @method getListeners
             * @param el {HTMLElement|string} the element or element id to inspect
             * @param sType {string} optional type of listener to return. If
             * left out, all listeners will be returned
             * @return {Object} the listener. Contains the following fields:
             * &nbsp;&nbsp;type:   (string)   the type of event
             * &nbsp;&nbsp;fn:     (function) the callback supplied to addListener
             * &nbsp;&nbsp;obj:    (object)   the custom object supplied to addListener
             * &nbsp;&nbsp;adjust: (boolean|object)  whether or not to adjust the default context
             * &nbsp;&nbsp;scope: (boolean)  the derived context based on the adjust parameter
             * &nbsp;&nbsp;index:  (int)      its position in the Event util listener cache
             * @static
             */
            getListeners: function(el, sType) {
                var results=[], searchLists;
                if (!sType) {
                    searchLists = [listeners, unloadListeners];
                } else if (sType === "unload") {
                    searchLists = [unloadListeners];
                } else {
                    sType = this._getType(sType);
                    searchLists = [listeners];
                }

                var oEl = (YAHOO.lang.isString(el)) ? this.getEl(el) : el;

                for (var j=0;j<searchLists.length; j=j+1) {
                    var searchList = searchLists[j];
                    if (searchList) {
                        for (var i=0,len=searchList.length; i<len ; ++i) {
                            var l = searchList[i];
                            if ( l  && l[this.EL] === oEl &&
                                    (!sType || sType === l[this.TYPE]) ) {
                                results.push({
                                    type:   l[this.TYPE],
                                    fn:     l[this.FN],
                                    obj:    l[this.OBJ],
                                    adjust: l[this.OVERRIDE],
                                    scope:  l[this.ADJ_SCOPE],
                                    index:  i
                                });
                            }
                        }
                    }
                }

                return (results.length) ? results : null;
            },

            /**
             * Removes all listeners registered by pe.event.  Called
             * automatically during the unload event.
             * @method _unload
             * @static
             * @private
             */
            _unload: function(e) {

                var EU = YAHOO.util.Event, i, j, l, len, index,
                         ul = unloadListeners.slice(), context;

                // execute and clear stored unload listeners
                for (i=0, len=unloadListeners.length; i<len; ++i) {
                    l = ul[i];
                    if (l) {
                        try {
                            context = window;
                            if (l[EU.ADJ_SCOPE]) {
                                if (l[EU.ADJ_SCOPE] === true) {
                                    context = l[EU.UNLOAD_OBJ];
                                } else {
                                    context = l[EU.ADJ_SCOPE];
                                }
                            }
                            l[EU.FN].call(context, EU.getEvent(e, l[EU.EL]), l[EU.UNLOAD_OBJ] );
                        } catch(e1) {}
                        ul[i] = null;
                    }
                }

                l = null;
                context = null;
                unloadListeners = null;

                // Remove listeners to handle IE memory leaks
                // 2.5.0 listeners are removed for all browsers again.  FireFox preserves
                // at least some listeners between page refreshes, potentially causing
                // errors during page load (mouseover listeners firing before they
                // should if the user moves the mouse at the correct moment).
                if (listeners) {
                    for (j=listeners.length-1; j>-1; j--) {
                        l = listeners[j];
                        if (l) {
                            try {
                                EU.removeListener(l[EU.EL], l[EU.TYPE], l[EU.FN], j);
                            } catch(e2) {}
                        }
                    }
                    l=null;
                }

                try {
                    EU._simpleRemove(window, "unload", EU._unload);
                    EU._simpleRemove(window, "load", EU._load);
                } catch(e3) {}

            },

            /**
             * Returns scrollLeft
             * @method _getScrollLeft
             * @static
             * @private
             */
            _getScrollLeft: function() {
                return this._getScroll()[1];
            },

            /**
             * Returns scrollTop
             * @method _getScrollTop
             * @static
             * @private
             */
            _getScrollTop: function() {
                return this._getScroll()[0];
            },

            /**
             * Returns the scrollTop and scrollLeft.  Used to calculate the
             * pageX and pageY in Internet Explorer
             * @method _getScroll
             * @static
             * @private
             */
            _getScroll: function() {
                var dd = document.documentElement, db = document.body;
                if (dd && (dd.scrollTop || dd.scrollLeft)) {
                    return [dd.scrollTop, dd.scrollLeft];
                } else if (db) {
                    return [db.scrollTop, db.scrollLeft];
                } else {
                    return [0, 0];
                }
            },

            /**
             * Used by old versions of CustomEvent, restored for backwards
             * compatibility
             * @method regCE
             * @private
             * @static
             * @deprecated still here for backwards compatibility
             */
            regCE: function() {},

            /**
             * Adds a DOM event directly without the caching, cleanup, context adj, etc
             *
             * @method _simpleAdd
             * @param {HTMLElement} el      the element to bind the handler to
             * @param {string}      sType   the type of event handler
             * @param {function}    fn      the callback to invoke
             * @param {boolen}      capture capture or bubble phase
             * @static
             * @private
             */
            _simpleAdd: function () {
                if (window.addEventListener) {
                    return function(el, sType, fn, capture) {
                        el.addEventListener(sType, fn, (capture));
                    };
                } else if (window.attachEvent) {
                    return function(el, sType, fn, capture) {
                        el.attachEvent("on" + sType, fn);
                    };
                } else {
                    return function(){};
                }
            }(),

            /**
             * Basic remove listener
             *
             * @method _simpleRemove
             * @param {HTMLElement} el      the element to bind the handler to
             * @param {string}      sType   the type of event handler
             * @param {function}    fn      the callback to invoke
             * @param {boolen}      capture capture or bubble phase
             * @static
             * @private
             */
            _simpleRemove: function() {
                if (window.removeEventListener) {
                    return function (el, sType, fn, capture) {
                        el.removeEventListener(sType, fn, (capture));
                    };
                } else if (window.detachEvent) {
                    return function (el, sType, fn) {
                        el.detachEvent("on" + sType, fn);
                    };
                } else {
                    return function(){};
                }
            }()
        };

    }();

    (function() {
        var EU = YAHOO.util.Event;

        /**
         * Appends an event handler.  This is an alias for <code>addListener</code>
         *
         * @method on
         *
         * @param {String|HTMLElement|Array|NodeList} el An id, an element
         *  reference, or a collection of ids and/or elements to assign the
         *  listener to.
         * @param {String}   sType     The type of event to append
         * @param {Function} fn        The method the event invokes
         * @param {Object}   obj    An arbitrary object that will be
         *                             passed as a parameter to the handler
         * @param {Boolean|object}  overrideContext  If true, the obj passed in becomes
         *                             the execution context of the listener. If an
         *                             object, this object becomes the execution
         *                             context.
         * @return {Boolean} True if the action was successful or defered,
         *                        false if one or more of the elements
         *                        could not have the listener attached,
         *                        or if the operation throws an exception.
         * @static
         */
        EU.on = EU.addListener;

        /**
         * YAHOO.util.Event.onFocus is an alias for addFocusListener
         * @method onFocus
         * @see addFocusListener
         * @static
         * @deprecated use YAHOO.util.Event.on and specify "focusin" as the event type.
         */
        EU.onFocus = EU.addFocusListener;

        /**
         * YAHOO.util.Event.onBlur is an alias for addBlurListener
         * @method onBlur
         * @see addBlurListener
         * @static
         * @deprecated use YAHOO.util.Event.on and specify "focusout" as the event type.
         */
        EU.onBlur = EU.addBlurListener;

/*! DOMReady: based on work by: Dean Edwards/John Resig/Matthias Miller/Diego Perini */

        // Internet Explorer: use the readyState of a defered script.
        // This isolates what appears to be a safe moment to manipulate
        // the DOM prior to when the document's readyState suggests
        // it is safe to do so.
        if (EU.isIE) {
            if (self !== self.top) {
                document.onreadystatechange = function() {
                    if (document.readyState == 'complete') {
                        document.onreadystatechange = null;
                        EU._ready();
                    }
                };
            } else {

                // Process onAvailable/onContentReady items when the
                // DOM is ready.
                YAHOO.util.Event.onDOMReady(
                        YAHOO.util.Event._tryPreloadAttach,
                        YAHOO.util.Event, true);

                var n = document.createElement('p');

                EU._dri = setInterval(function() {
                    try {
                        // throws an error if doc is not ready
                        n.doScroll('left');
                        clearInterval(EU._dri);
                        EU._dri = null;
                        EU._ready();
                        n = null;
                    } catch (ex) {
                    }
                }, EU.POLL_INTERVAL);
            }

        // The document's readyState in Safari currently will
        // change to loaded/complete before images are loaded.
        } else if (EU.webkit && EU.webkit < 525) {

            EU._dri = setInterval(function() {
                var rs=document.readyState;
                if ("loaded" == rs || "complete" == rs) {
                    clearInterval(EU._dri);
                    EU._dri = null;
                    EU._ready();
                }
            }, EU.POLL_INTERVAL);

        // FireFox and Opera: These browsers provide a event for this
        // moment.  The latest WebKit releases now support this event.
        } else {

            EU._simpleAdd(document, "DOMContentLoaded", EU._ready);

        }
        /////////////////////////////////////////////////////////////


        EU._simpleAdd(window, "load", EU._load);
        EU._simpleAdd(window, "unload", EU._unload);
        EU._tryPreloadAttach();
    })();

}
/**
 * EventProvider is designed to be used with YAHOO.augment to wrap
 * CustomEvents in an interface that allows events to be subscribed to
 * and fired by name.  This makes it possible for implementing code to
 * subscribe to an event that either has not been created yet, or will
 * not be created at all.
 *
 * @Class EventProvider
 */
YAHOO.util.EventProvider = function() { };

YAHOO.util.EventProvider.prototype = {

    /**
     * Private storage of custom events
     * @property __yui_events
     * @type Object[]
     * @private
     */
    __yui_events: null,

    /**
     * Private storage of custom event subscribers
     * @property __yui_subscribers
     * @type Object[]
     * @private
     */
    __yui_subscribers: null,

    /**
     * Subscribe to a CustomEvent by event type
     *
     * @method subscribe
     * @param p_type     {string}   the type, or name of the event
     * @param p_fn       {function} the function to exectute when the event fires
     * @param p_obj      {Object}   An object to be passed along when the event
     *                              fires
     * @param overrideContext {boolean}  If true, the obj passed in becomes the
     *                              execution scope of the listener
     */
    subscribe: function(p_type, p_fn, p_obj, overrideContext) {

        this.__yui_events = this.__yui_events || {};
        var ce = this.__yui_events[p_type];

        if (ce) {
            ce.subscribe(p_fn, p_obj, overrideContext);
        } else {
            this.__yui_subscribers = this.__yui_subscribers || {};
            var subs = this.__yui_subscribers;
            if (!subs[p_type]) {
                subs[p_type] = [];
            }
            subs[p_type].push(
                { fn: p_fn, obj: p_obj, overrideContext: overrideContext } );
        }
    },

    /**
     * Unsubscribes one or more listeners the from the specified event
     * @method unsubscribe
     * @param p_type {string}   The type, or name of the event.  If the type
     *                          is not specified, it will attempt to remove
     *                          the listener from all hosted events.
     * @param p_fn   {Function} The subscribed function to unsubscribe, if not
     *                          supplied, all subscribers will be removed.
     * @param p_obj  {Object}   The custom object passed to subscribe.  This is
     *                        optional, but if supplied will be used to
     *                        disambiguate multiple listeners that are the same
     *                        (e.g., you subscribe many object using a function
     *                        that lives on the prototype)
     * @return {boolean} true if the subscriber was found and detached.
     */
    unsubscribe: function(p_type, p_fn, p_obj) {
        this.__yui_events = this.__yui_events || {};
        var evts = this.__yui_events;
        if (p_type) {
            var ce = evts[p_type];
            if (ce) {
                return ce.unsubscribe(p_fn, p_obj);
            }
        } else {
            var ret = true;
            for (var i in evts) {
                if (YAHOO.lang.hasOwnProperty(evts, i)) {
                    ret = ret && evts[i].unsubscribe(p_fn, p_obj);
                }
            }
            return ret;
        }

        return false;
    },

    /**
     * Removes all listeners from the specified event.  If the event type
     * is not specified, all listeners from all hosted custom events will
     * be removed.
     * @method unsubscribeAll
     * @param p_type {string}   The type, or name of the event
     */
    unsubscribeAll: function(p_type) {
        return this.unsubscribe(p_type);
    },

    /**
     * Creates a new custom event of the specified type.  If a custom event
     * by that name already exists, it will not be re-created.  In either
     * case the custom event is returned.
     *
     * @method createEvent
     *
     * @param p_type {string} the type, or name of the event
     * @param p_config {object} optional config params.  Valid properties are:
     *
     *  <ul>
     *    <li>
     *      scope: defines the default execution scope.  If not defined
     *      the default scope will be this instance.
     *    </li>
     *    <li>
     *      silent: if true, the custom event will not generate log messages.
     *      This is false by default.
     *    </li>
     *    <li>
     *      fireOnce: if true, the custom event will only notify subscribers
     *      once regardless of the number of times the event is fired.  In
     *      addition, new subscribers will be executed immediately if the
     *      event has already fired.
     *      This is false by default.
     *    </li>
     *    <li>
     *      onSubscribeCallback: specifies a callback to execute when the
     *      event has a new subscriber.  This will fire immediately for
     *      each queued subscriber if any exist prior to the creation of
     *      the event.
     *    </li>
     *  </ul>
     *
     *  @return {CustomEvent} the custom event
     *
     */
    createEvent: function(p_type, p_config) {

        this.__yui_events = this.__yui_events || {};
        var opts = p_config || {},
            events = this.__yui_events, ce;

        if (events[p_type]) {
        } else {

            ce = new YAHOO.util.CustomEvent(p_type, opts.scope || this, opts.silent,
                         YAHOO.util.CustomEvent.FLAT, opts.fireOnce);

            events[p_type] = ce;

            if (opts.onSubscribeCallback) {
                ce.subscribeEvent.subscribe(opts.onSubscribeCallback);
            }

            this.__yui_subscribers = this.__yui_subscribers || {};
            var qs = this.__yui_subscribers[p_type];

            if (qs) {
                for (var i=0; i<qs.length; ++i) {
                    ce.subscribe(qs[i].fn, qs[i].obj, qs[i].overrideContext);
                }
            }
        }

        return events[p_type];
    },


   /**
     * Fire a custom event by name.  The callback functions will be executed
     * from the scope specified when the event was created, and with the
     * following parameters:
     *   <ul>
     *   <li>The first argument fire() was executed with</li>
     *   <li>The custom object (if any) that was passed into the subscribe()
     *       method</li>
     *   </ul>
     * @method fireEvent
     * @param p_type    {string}  the type, or name of the event
     * @param arguments {Object*} an arbitrary set of parameters to pass to
     *                            the handler.
     * @return {boolean} the return value from CustomEvent.fire
     *
     */
    fireEvent: function(p_type) {

        this.__yui_events = this.__yui_events || {};
        var ce = this.__yui_events[p_type];

        if (!ce) {
            return null;
        }

        var args = [];
        for (var i=1; i<arguments.length; ++i) {
            args.push(arguments[i]);
        }
        return ce.fire.apply(ce, args);
    },

    /**
     * Returns true if the custom event of the provided type has been created
     * with createEvent.
     * @method hasEvent
     * @param type {string} the type, or name of the event
     */
    hasEvent: function(type) {
        if (this.__yui_events) {
            if (this.__yui_events[type]) {
                return true;
            }
        }
        return false;
    }

};

(function() {

    var Event = YAHOO.util.Event, Lang = YAHOO.lang;

/**
* KeyListener is a utility that provides an easy interface for listening for
* keydown/keyup events fired against DOM elements.
* @namespace YAHOO.util
* @class KeyListener
* @constructor
* @param {HTMLElement} attachTo The element or element ID to which the key
*                               event should be attached
* @param {String}      attachTo The element or element ID to which the key
*                               event should be attached
* @param {Object}      keyData  The object literal representing the key(s)
*                               to detect. Possible attributes are
*                               shift(boolean), alt(boolean), ctrl(boolean)
*                               and keys(either an int or an array of ints
*                               representing keycodes).
* @param {Function}    handler  The CustomEvent handler to fire when the
*                               key event is detected
* @param {Object}      handler  An object literal representing the handler.
* @param {String}      event    Optional. The event (keydown or keyup) to
*                               listen for. Defaults automatically to keydown.
*
* @knownissue the "keypress" event is completely broken in Safari 2.x and below.
*             the workaround is use "keydown" for key listening.  However, if
*             it is desired to prevent the default behavior of the keystroke,
*             that can only be done on the keypress event.  This makes key
*             handling quite ugly.
* @knownissue keydown is also broken in Safari 2.x and below for the ESC key.
*             There currently is no workaround other than choosing another
*             key to listen for.
*/
YAHOO.util.KeyListener = function(attachTo, keyData, handler, event) {
    if (!attachTo) {
    } else if (!keyData) {
    } else if (!handler) {
    }

    if (!event) {
        event = YAHOO.util.KeyListener.KEYDOWN;
    }

    /**
    * The CustomEvent fired internally when a key is pressed
    * @event keyEvent
    * @private
    * @param {Object} keyData The object literal representing the key(s) to
    *                         detect. Possible attributes are shift(boolean),
    *                         alt(boolean), ctrl(boolean) and keys(either an
    *                         int or an array of ints representing keycodes).
    */
    var keyEvent = new YAHOO.util.CustomEvent("keyPressed");

    /**
    * The CustomEvent fired when the KeyListener is enabled via the enable()
    * function
    * @event enabledEvent
    * @param {Object} keyData The object literal representing the key(s) to
    *                         detect. Possible attributes are shift(boolean),
    *                         alt(boolean), ctrl(boolean) and keys(either an
    *                         int or an array of ints representing keycodes).
    */
    this.enabledEvent = new YAHOO.util.CustomEvent("enabled");

    /**
    * The CustomEvent fired when the KeyListener is disabled via the
    * disable() function
    * @event disabledEvent
    * @param {Object} keyData The object literal representing the key(s) to
    *                         detect. Possible attributes are shift(boolean),
    *                         alt(boolean), ctrl(boolean) and keys(either an
    *                         int or an array of ints representing keycodes).
    */
    this.disabledEvent = new YAHOO.util.CustomEvent("disabled");

    if (Lang.isString(attachTo)) {
        attachTo = document.getElementById(attachTo); // No Dom util
    }

    if (Lang.isFunction(handler)) {
        keyEvent.subscribe(handler);
    } else {
        keyEvent.subscribe(handler.fn, handler.scope, handler.correctScope);
    }

    /**
    * Handles the key event when a key is pressed.
    * @method handleKeyPress
    * @param {DOMEvent} e   The keypress DOM event
    * @param {Object}   obj The DOM event scope object
    * @private
    */
    function handleKeyPress(e, obj) {
        if (! keyData.shift) {
            keyData.shift = false;
        }
        if (! keyData.alt) {
            keyData.alt = false;
        }
        if (! keyData.ctrl) {
            keyData.ctrl = false;
        }

        // check held down modifying keys first
        if (e.shiftKey == keyData.shift &&
            e.altKey   == keyData.alt &&
            e.ctrlKey  == keyData.ctrl) { // if we pass this, all modifiers match

            var dataItem, keys = keyData.keys, key;

            if (YAHOO.lang.isArray(keys)) {
                for (var i=0;i<keys.length;i++) {
                    dataItem = keys[i];
                    key = Event.getCharCode(e);

                    if (dataItem == key) {
                        keyEvent.fire(key, e);
                        break;
                    }
                }
            } else {
                key = Event.getCharCode(e);
                if (keys == key ) {
                    keyEvent.fire(key, e);
                }
            }
        }
    }

    /**
    * Enables the KeyListener by attaching the DOM event listeners to the
    * target DOM element
    * @method enable
    */
    this.enable = function() {
        if (! this.enabled) {
            Event.on(attachTo, event, handleKeyPress);
            this.enabledEvent.fire(keyData);
        }
        /**
        * Boolean indicating the enabled/disabled state of the Tooltip
        * @property enabled
        * @type Boolean
        */
        this.enabled = true;
    };

    /**
    * Disables the KeyListener by removing the DOM event listeners from the
    * target DOM element
    * @method disable
    */
    this.disable = function() {
        if (this.enabled) {
            Event.removeListener(attachTo, event, handleKeyPress);
            this.disabledEvent.fire(keyData);
        }
        this.enabled = false;
    };

    /**
    * Returns a String representation of the object.
    * @method toString
    * @return {String}  The string representation of the KeyListener
    */
    this.toString = function() {
        return "KeyListener [" + keyData.keys + "] " + attachTo.tagName +
                (attachTo.id ? "[" + attachTo.id + "]" : "");
    };

};

var KeyListener = YAHOO.util.KeyListener;

/**
 * Constant representing the DOM "keydown" event.
 * @property YAHOO.util.KeyListener.KEYDOWN
 * @static
 * @final
 * @type String
 */
KeyListener.KEYDOWN = "keydown";

/**
 * Constant representing the DOM "keyup" event.
 * @property YAHOO.util.KeyListener.KEYUP
 * @static
 * @final
 * @type String
 */
KeyListener.KEYUP = "keyup";

/**
 * keycode constants for a subset of the special keys
 * @property KEY
 * @static
 * @final
 */
KeyListener.KEY = {
    ALT          : 18,
    BACK_SPACE   : 8,
    CAPS_LOCK    : 20,
    CONTROL      : 17,
    DELETE       : 46,
    DOWN         : 40,
    END          : 35,
    ENTER        : 13,
    ESCAPE       : 27,
    HOME         : 36,
    LEFT         : 37,
    META         : 224,
    NUM_LOCK     : 144,
    PAGE_DOWN    : 34,
    PAGE_UP      : 33,
    PAUSE        : 19,
    PRINTSCREEN  : 44,
    RIGHT        : 39,
    SCROLL_LOCK  : 145,
    SHIFT        : 16,
    SPACE        : 32,
    TAB          : 9,
    UP           : 38
};

})();
YAHOO.register("event", YAHOO.util.Event, {version: "2.9.0", build: "2800"});

/*
Copyright (c) 2011, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://developer.yahoo.com/yui/license.html
version: 2.9.0
*/
/**
 * The dom module provides helper methods for manipulating Dom elements.
 * @module dom
 *
 */

(function() {
    // for use with generateId (global to save state if Dom is overwritten)
    YAHOO.env._id_counter = YAHOO.env._id_counter || 0;

    // internal shorthand
    var Y = YAHOO.util,
        lang = YAHOO.lang,
        UA = YAHOO.env.ua,
        trim = YAHOO.lang.trim,
        propertyCache = {}, // for faster hyphen converts
        reCache = {}, // cache className regexes
        RE_TABLE = /^t(?:able|d|h)$/i, // for _calcBorders
        RE_COLOR = /color$/i,

        // DOM aliases 
        document = window.document,     
        documentElement = document.documentElement,

        // string constants
        OWNER_DOCUMENT = 'ownerDocument',
        DEFAULT_VIEW = 'defaultView',
        DOCUMENT_ELEMENT = 'documentElement',
        COMPAT_MODE = 'compatMode',
        OFFSET_LEFT = 'offsetLeft',
        OFFSET_TOP = 'offsetTop',
        OFFSET_PARENT = 'offsetParent',
        PARENT_NODE = 'parentNode',
        NODE_TYPE = 'nodeType',
        TAG_NAME = 'tagName',
        SCROLL_LEFT = 'scrollLeft',
        SCROLL_TOP = 'scrollTop',
        GET_BOUNDING_CLIENT_RECT = 'getBoundingClientRect',
        GET_COMPUTED_STYLE = 'getComputedStyle',
        CURRENT_STYLE = 'currentStyle',
        CSS1_COMPAT = 'CSS1Compat',
        _BACK_COMPAT = 'BackCompat',
        _CLASS = 'class', // underscore due to reserved word
        CLASS_NAME = 'className',
        EMPTY = '',
        SPACE = ' ',
        C_START = '(?:^|\\s)',
        C_END = '(?= |$)',
        G = 'g',
        POSITION = 'position',
        FIXED = 'fixed',
        RELATIVE = 'relative',
        LEFT = 'left',
        TOP = 'top',
        MEDIUM = 'medium',
        BORDER_LEFT_WIDTH = 'borderLeftWidth',
        BORDER_TOP_WIDTH = 'borderTopWidth',
    
    // brower detection
        isOpera = UA.opera,
        isSafari = UA.webkit, 
        isGecko = UA.gecko, 
        isIE = UA.ie; 
    
    /**
     * Provides helper methods for DOM elements.
     * @namespace YAHOO.util
     * @class Dom
     * @requires yahoo, event
     */
    Y.Dom = {
        CUSTOM_ATTRIBUTES: (!documentElement.hasAttribute) ? { // IE < 8
            'for': 'htmlFor',
            'class': CLASS_NAME
        } : { // w3c
            'htmlFor': 'for',
            'className': _CLASS
        },

        DOT_ATTRIBUTES: {
            checked: true 
        },

        /**
         * Returns an HTMLElement reference.
         * @method get
         * @param {String | HTMLElement |Array} el Accepts a string to use as an ID for getting a DOM reference, an actual DOM reference, or an Array of IDs and/or HTMLElements.
         * @return {HTMLElement | Array} A DOM reference to an HTML element or an array of HTMLElements.
         */
        get: function(el) {
            var id, nodes, c, i, len, attr, ret = null;

            if (el) {
                if (typeof el == 'string' || typeof el == 'number') { // id
                    id = el + '';
                    el = document.getElementById(el);
                    attr = (el) ? el.attributes : null;
                    if (el && attr && attr.id && attr.id.value === id) { // IE: avoid false match on "name" attribute
                        return el;
                    } else if (el && document.all) { // filter by name
                        el = null;
                        nodes = document.all[id];
                        if (nodes && nodes.length) {
                            for (i = 0, len = nodes.length; i < len; ++i) {
                                if (nodes[i].id === id) {
                                    return nodes[i];
                                }
                            }
                        }
                    }
                } else if (Y.Element && el instanceof Y.Element) {
                    el = el.get('element');
                } else if (!el.nodeType && 'length' in el) { // array-like 
                    c = [];
                    for (i = 0, len = el.length; i < len; ++i) {
                        c[c.length] = Y.Dom.get(el[i]);
                    }
                    
                    el = c;
                }

                ret = el;
            }

            return ret;
        },
    
        getComputedStyle: function(el, property) {
            if (window[GET_COMPUTED_STYLE]) {
                return el[OWNER_DOCUMENT][DEFAULT_VIEW][GET_COMPUTED_STYLE](el, null)[property];
            } else if (el[CURRENT_STYLE]) {
                return Y.Dom.IE_ComputedStyle.get(el, property);
            }
        },

        /**
         * Normalizes currentStyle and ComputedStyle.
         * @method getStyle
         * @param {String | HTMLElement |Array} el Accepts a string to use as an ID, an actual DOM reference, or an Array of IDs and/or HTMLElements.
         * @param {String} property The style property whose value is returned.
         * @return {String | Array} The current value of the style property for the element(s).
         */
        getStyle: function(el, property) {
            return Y.Dom.batch(el, Y.Dom._getStyle, property);
        },

        // branching at load instead of runtime
        _getStyle: function() {
            if (window[GET_COMPUTED_STYLE]) { // W3C DOM method
                return function(el, property) {
                    property = (property === 'float') ? property = 'cssFloat' :
                            Y.Dom._toCamel(property);

                    var value = el.style[property],
                        computed;
                    
                    if (!value) {
                        computed = el[OWNER_DOCUMENT][DEFAULT_VIEW][GET_COMPUTED_STYLE](el, null);
                        if (computed) { // test computed before touching for safari
                            value = computed[property];
                        }
                    }
                    
                    return value;
                };
            } else if (documentElement[CURRENT_STYLE]) {
                return function(el, property) {                         
                    var value;

                    switch(property) {
                        case 'opacity' :// IE opacity uses filter
                            value = 100;
                            try { // will error if no DXImageTransform
                                value = el.filters['DXImageTransform.Microsoft.Alpha'].opacity;

                            } catch(e) {
                                try { // make sure its in the document
                                    value = el.filters('alpha').opacity;
                                } catch(err) {
                                }
                            }
                            return value / 100;
                        case 'float': // fix reserved word
                            property = 'styleFloat'; // fall through
                        default: 
                            property = Y.Dom._toCamel(property);
                            value = el[CURRENT_STYLE] ? el[CURRENT_STYLE][property] : null;
                            return ( el.style[property] || value );
                    }
                };
            }
        }(),
    
        /**
         * Wrapper for setting style properties of HTMLElements.  Normalizes "opacity" across modern browsers.
         * @method setStyle
         * @param {String | HTMLElement | Array} el Accepts a string to use as an ID, an actual DOM reference, or an Array of IDs and/or HTMLElements.
         * @param {String} property The style property to be set.
         * @param {String} val The value to apply to the given property.
         */
        setStyle: function(el, property, val) {
            Y.Dom.batch(el, Y.Dom._setStyle, { prop: property, val: val });
        },

        _setStyle: function() {
            if (!window.getComputedStyle && document.documentElement.currentStyle) {
                return function(el, args) {
                    var property = Y.Dom._toCamel(args.prop),
                        val = args.val;

                    if (el) {
                        switch (property) {
                            case 'opacity':
                                // remove filter if unsetting or full opacity
                                if (val === '' || val === null || val === 1) {
                                    el.style.removeAttribute('filter');
                                } else if ( lang.isString(el.style.filter) ) { // in case not appended
                                    el.style.filter = 'alpha(opacity=' + val * 100 + ')';
                                    
                                    if (!el[CURRENT_STYLE] || !el[CURRENT_STYLE].hasLayout) {
                                        el.style.zoom = 1; // when no layout or cant tell
                                    }
                                }
                                break;
                            case 'float':
                                property = 'styleFloat';
                            default:
                            el.style[property] = val;
                        }
                    } else {
                    }
                };
            } else {
                return function(el, args) {
                    var property = Y.Dom._toCamel(args.prop),
                        val = args.val;
                    if (el) {
                        if (property == 'float') {
                            property = 'cssFloat';
                        }
                        el.style[property] = val;
                    } else {
                    }
                };
            }

        }(),
        
        /**
         * Gets the current position of an element based on page coordinates. 
         * Element must be part of the DOM tree to have page coordinates (display:none or elements not appended return false).
         * @method getXY
         * @param {String | HTMLElement | Array} el Accepts a string to use as an ID, an actual DOM
         * reference, or an Array of IDs and/or HTMLElements
         * @return {Array} The XY position of the element(s)
         */
        getXY: function(el) {
            return Y.Dom.batch(el, Y.Dom._getXY);
        },

        _canPosition: function(el) {
            return ( Y.Dom._getStyle(el, 'display') !== 'none' && Y.Dom._inDoc(el) );
        },

        _getXY: function(node) {
            var scrollLeft, scrollTop, box, doc,
                clientTop, clientLeft,
                round = Math.round, // TODO: round?
                xy = false;

            if (Y.Dom._canPosition(node)) {
                box = node[GET_BOUNDING_CLIENT_RECT]();
                doc = node[OWNER_DOCUMENT];
                scrollLeft = Y.Dom.getDocumentScrollLeft(doc);
                scrollTop = Y.Dom.getDocumentScrollTop(doc);
                xy = [box[LEFT], box[TOP]];

                // remove IE default documentElement offset (border)
                if (clientTop || clientLeft) {
                    xy[0] -= clientLeft;
                    xy[1] -= clientTop;
                }

                if ((scrollTop || scrollLeft)) {
                    xy[0] += scrollLeft;
                    xy[1] += scrollTop;
                }

                // gecko may return sub-pixel (non-int) values
                xy[0] = round(xy[0]);
                xy[1] = round(xy[1]);
            } else {
            }

            return xy;
        },
        
        /**
         * Gets the current X position of an element based on page coordinates.  The element must be part of the DOM tree to have page coordinates (display:none or elements not appended return false).
         * @method getX
         * @param {String | HTMLElement | Array} el Accepts a string to use as an ID, an actual DOM reference, or an Array of IDs and/or HTMLElements
         * @return {Number | Array} The X position of the element(s)
         */
        getX: function(el) {
            var f = function(el) {
                return Y.Dom.getXY(el)[0];
            };
            
            return Y.Dom.batch(el, f, Y.Dom, true);
        },
        
        /**
         * Gets the current Y position of an element based on page coordinates.  Element must be part of the DOM tree to have page coordinates (display:none or elements not appended return false).
         * @method getY
         * @param {String | HTMLElement | Array} el Accepts a string to use as an ID, an actual DOM reference, or an Array of IDs and/or HTMLElements
         * @return {Number | Array} The Y position of the element(s)
         */
        getY: function(el) {
            var f = function(el) {
                return Y.Dom.getXY(el)[1];
            };
            
            return Y.Dom.batch(el, f, Y.Dom, true);
        },
        
        /**
         * Set the position of an html element in page coordinates, regardless of how the element is positioned.
         * The element(s) must be part of the DOM tree to have page coordinates (display:none or elements not appended return false).
         * @method setXY
         * @param {String | HTMLElement | Array} el Accepts a string to use as an ID, an actual DOM reference, or an Array of IDs and/or HTMLElements
         * @param {Array} pos Contains X & Y values for new position (coordinates are page-based)
         * @param {Boolean} noRetry By default we try and set the position a second time if the first fails
         */
        setXY: function(el, pos, noRetry) {
            Y.Dom.batch(el, Y.Dom._setXY, { pos: pos, noRetry: noRetry });
        },

        _setXY: function(node, args) {
            var pos = Y.Dom._getStyle(node, POSITION),
                setStyle = Y.Dom.setStyle,
                xy = args.pos,
                noRetry = args.noRetry,

                delta = [ // assuming pixels; if not we will have to retry
                    parseInt( Y.Dom.getComputedStyle(node, LEFT), 10 ),
                    parseInt( Y.Dom.getComputedStyle(node, TOP), 10 )
                ],

                currentXY,
                newXY;
        
            currentXY = Y.Dom._getXY(node);

            if (!xy || currentXY === false) { // has to be part of doc to have xy
                return false; 
            }
            
            if (pos == 'static') { // default to relative
                pos = RELATIVE;
                setStyle(node, POSITION, pos);
            }

            if ( isNaN(delta[0]) ) {// in case of 'auto'
                delta[0] = (pos == RELATIVE) ? 0 : node[OFFSET_LEFT];
            } 
            if ( isNaN(delta[1]) ) { // in case of 'auto'
                delta[1] = (pos == RELATIVE) ? 0 : node[OFFSET_TOP];
            } 

            if (xy[0] !== null) { // from setX
                setStyle(node, LEFT, xy[0] - currentXY[0] + delta[0] + 'px');
            }

            if (xy[1] !== null) { // from setY
                setStyle(node, TOP, xy[1] - currentXY[1] + delta[1] + 'px');
            }
          
            if (!noRetry) {
                newXY = Y.Dom._getXY(node);

                // if retry is true, try one more time if we miss 
               if ( (xy[0] !== null && newXY[0] != xy[0]) || 
                    (xy[1] !== null && newXY[1] != xy[1]) ) {
                   Y.Dom._setXY(node, { pos: xy, noRetry: true });
               }
            }        

        },
        
        /**
         * Set the X position of an html element in page coordinates, regardless of how the element is positioned.
         * The element must be part of the DOM tree to have page coordinates (display:none or elements not appended return false).
         * @method setX
         * @param {String | HTMLElement | Array} el Accepts a string to use as an ID, an actual DOM reference, or an Array of IDs and/or HTMLElements.
         * @param {Int} x The value to use as the X coordinate for the element(s).
         */
        setX: function(el, x) {
            Y.Dom.setXY(el, [x, null]);
        },
        
        /**
         * Set the Y position of an html element in page coordinates, regardless of how the element is positioned.
         * The element must be part of the DOM tree to have page coordinates (display:none or elements not appended return false).
         * @method setY
         * @param {String | HTMLElement | Array} el Accepts a string to use as an ID, an actual DOM reference, or an Array of IDs and/or HTMLElements.
         * @param {Int} x To use as the Y coordinate for the element(s).
         */
        setY: function(el, y) {
            Y.Dom.setXY(el, [null, y]);
        },
        
        /**
         * Returns the region position of the given element.
         * The element must be part of the DOM tree to have a region (display:none or elements not appended return false).
         * @method getRegion
         * @param {String | HTMLElement | Array} el Accepts a string to use as an ID, an actual DOM reference, or an Array of IDs and/or HTMLElements.
         * @return {Region | Array} A Region or array of Region instances containing "top, left, bottom, right" member data.
         */
        getRegion: function(el) {
            var f = function(el) {
                var region = false;
                if ( Y.Dom._canPosition(el) ) {
                    region = Y.Region.getRegion(el);
                } else {
                }

                return region;
            };
            
            return Y.Dom.batch(el, f, Y.Dom, true);
        },
        
        /**
         * Returns the width of the client (viewport).
         * @method getClientWidth
         * @deprecated Now using getViewportWidth.  This interface left intact for back compat.
         * @return {Int} The width of the viewable area of the page.
         */
        getClientWidth: function() {
            return Y.Dom.getViewportWidth();
        },
        
        /**
         * Returns the height of the client (viewport).
         * @method getClientHeight
         * @deprecated Now using getViewportHeight.  This interface left intact for back compat.
         * @return {Int} The height of the viewable area of the page.
         */
        getClientHeight: function() {
            return Y.Dom.getViewportHeight();
        },

        /**
         * Returns an array of HTMLElements with the given class.
         * For optimized performance, include a tag and/or root node when possible.
         * Note: This method operates against a live collection, so modifying the 
         * collection in the callback (removing/appending nodes, etc.) will have
         * side effects.  Instead you should iterate the returned nodes array,
         * as you would with the native "getElementsByTagName" method. 
         * @method getElementsByClassName
         * @param {String} className The class name to match against
         * @param {String} tag (optional) The tag name of the elements being collected
         * @param {String | HTMLElement} root (optional) The HTMLElement or an ID to use as the starting point.
         * This element is not included in the className scan.
         * @param {Function} apply (optional) A function to apply to each element when found 
         * @param {Any} o (optional) An optional arg that is passed to the supplied method
         * @param {Boolean} overrides (optional) Whether or not to override the scope of "method" with "o"
         * @return {Array} An array of elements that have the given class name
         */
        getElementsByClassName: function(className, tag, root, apply, o, overrides) {
            tag = tag || '*';
            root = (root) ? Y.Dom.get(root) : null || document; 
            if (!root) {
                return [];
            }

            var nodes = [],
                elements = root.getElementsByTagName(tag),
                hasClass = Y.Dom.hasClass;

            for (var i = 0, len = elements.length; i < len; ++i) {
                if ( hasClass(elements[i], className) ) {
                    nodes[nodes.length] = elements[i];
                }
            }
            
            if (apply) {
                Y.Dom.batch(nodes, apply, o, overrides);
            }

            return nodes;
        },

        /**
         * Determines whether an HTMLElement has the given className.
         * @method hasClass
         * @param {String | HTMLElement | Array} el The element or collection to test
         * @param {String | RegExp} className the class name to search for, or a regular
         * expression to match against
         * @return {Boolean | Array} A boolean value or array of boolean values
         */
        hasClass: function(el, className) {
            return Y.Dom.batch(el, Y.Dom._hasClass, className);
        },

        _hasClass: function(el, className) {
            var ret = false,
                current;
            
            if (el && className) {
                current = Y.Dom._getAttribute(el, CLASS_NAME) || EMPTY;
                if (current) { // convert line breaks, tabs and other delims to spaces
                    current = current.replace(/\s+/g, SPACE);
                }

                if (className.exec) {
                    ret = className.test(current);
                } else {
                    ret = className && (SPACE + current + SPACE).
                        indexOf(SPACE + className + SPACE) > -1;
                }
            } else {
            }

            return ret;
        },
    
        /**
         * Adds a class name to a given element or collection of elements.
         * @method addClass         
         * @param {String | HTMLElement | Array} el The element or collection to add the class to
         * @param {String} className the class name to add to the class attribute
         * @return {Boolean | Array} A pass/fail boolean or array of booleans
         */
        addClass: function(el, className) {
            return Y.Dom.batch(el, Y.Dom._addClass, className);
        },

        _addClass: function(el, className) {
            var ret = false,
                current;

            if (el && className) {
                current = Y.Dom._getAttribute(el, CLASS_NAME) || EMPTY;
                if ( !Y.Dom._hasClass(el, className) ) {
                    Y.Dom.setAttribute(el, CLASS_NAME, trim(current + SPACE + className));
                    ret = true;
                }
            } else {
            }

            return ret;
        },
    
        /**
         * Removes a class name from a given element or collection of elements.
         * @method removeClass         
         * @param {String | HTMLElement | Array} el The element or collection to remove the class from
         * @param {String} className the class name to remove from the class attribute
         * @return {Boolean | Array} A pass/fail boolean or array of booleans
         */
        removeClass: function(el, className) {
            return Y.Dom.batch(el, Y.Dom._removeClass, className);
        },
        
        _removeClass: function(el, className) {
            var ret = false,
                current,
                newClass,
                attr;

            if (el && className) {
                current = Y.Dom._getAttribute(el, CLASS_NAME) || EMPTY;
                Y.Dom.setAttribute(el, CLASS_NAME, current.replace(Y.Dom._getClassRegex(className), EMPTY));

                newClass = Y.Dom._getAttribute(el, CLASS_NAME);
                if (current !== newClass) { // else nothing changed
                    Y.Dom.setAttribute(el, CLASS_NAME, trim(newClass)); // trim after comparing to current class
                    ret = true;

                    if (Y.Dom._getAttribute(el, CLASS_NAME) === '') { // remove class attribute if empty
                        attr = (el.hasAttribute && el.hasAttribute(_CLASS)) ? _CLASS : CLASS_NAME;
                        el.removeAttribute(attr);
                    }
                }

            } else {
            }

            return ret;
        },
        
        /**
         * Replace a class with another class for a given element or collection of elements.
         * If no oldClassName is present, the newClassName is simply added.
         * @method replaceClass  
         * @param {String | HTMLElement | Array} el The element or collection to remove the class from
         * @param {String} oldClassName the class name to be replaced
         * @param {String} newClassName the class name that will be replacing the old class name
         * @return {Boolean | Array} A pass/fail boolean or array of booleans
         */
        replaceClass: function(el, oldClassName, newClassName) {
            return Y.Dom.batch(el, Y.Dom._replaceClass, { from: oldClassName, to: newClassName });
        },

        _replaceClass: function(el, classObj) {
            var className,
                from,
                to,
                ret = false,
                current;

            if (el && classObj) {
                from = classObj.from;
                to = classObj.to;

                if (!to) {
                    ret = false;
                }  else if (!from) { // just add if no "from"
                    ret = Y.Dom._addClass(el, classObj.to);
                } else if (from !== to) { // else nothing to replace
                    // May need to lead with DBLSPACE?
                    current = Y.Dom._getAttribute(el, CLASS_NAME) || EMPTY;
                    className = (SPACE + current.replace(Y.Dom._getClassRegex(from), SPACE + to).
                            replace(/\s+/g, SPACE)). // normalize white space
                            split(Y.Dom._getClassRegex(to));

                    // insert to into what would have been the first occurrence slot
                    className.splice(1, 0, SPACE + to);
                    Y.Dom.setAttribute(el, CLASS_NAME, trim(className.join(EMPTY)));
                    ret = true;
                }
            } else {
            }

            return ret;
        },
        
        /**
         * Returns an ID and applies it to the element "el", if provided.
         * @method generateId  
         * @param {String | HTMLElement | Array} el (optional) An optional element array of elements to add an ID to (no ID is added if one is already present).
         * @param {String} prefix (optional) an optional prefix to use (defaults to "yui-gen").
         * @return {String | Array} The generated ID, or array of generated IDs (or original ID if already present on an element)
         */
        generateId: function(el, prefix) {
            prefix = prefix || 'yui-gen';

            var f = function(el) {
                if (el && el.id) { // do not override existing ID
                    return el.id;
                }

                var id = prefix + YAHOO.env._id_counter++;

                if (el) {
                    if (el[OWNER_DOCUMENT] && el[OWNER_DOCUMENT].getElementById(id)) { // in case one already exists
                        // use failed id plus prefix to help ensure uniqueness
                        return Y.Dom.generateId(el, id + prefix);
                    }
                    el.id = id;
                }
                
                return id;
            };

            // batch fails when no element, so just generate and return single ID
            return Y.Dom.batch(el, f, Y.Dom, true) || f.apply(Y.Dom, arguments);
        },
        
        /**
         * Determines whether an HTMLElement is an ancestor of another HTML element in the DOM hierarchy.
         * @method isAncestor
         * @param {String | HTMLElement} haystack The possible ancestor
         * @param {String | HTMLElement} needle The possible descendent
         * @return {Boolean} Whether or not the haystack is an ancestor of needle
         */
        isAncestor: function(haystack, needle) {
            haystack = Y.Dom.get(haystack);
            needle = Y.Dom.get(needle);
            
            var ret = false;

            if ( (haystack && needle) && (haystack[NODE_TYPE] && needle[NODE_TYPE]) ) {
                if (haystack.contains && haystack !== needle) { // contains returns true when equal
                    ret = haystack.contains(needle);
                }
                else if (haystack.compareDocumentPosition) { // gecko
                    ret = !!(haystack.compareDocumentPosition(needle) & 16);
                }
            } else {
            }
            return ret;
        },
        
        /**
         * Determines whether an HTMLElement is present in the current document.
         * @method inDocument         
         * @param {String | HTMLElement} el The element to search for
         * @param {Object} doc An optional document to search, defaults to element's owner document 
         * @return {Boolean} Whether or not the element is present in the current document
         */
        inDocument: function(el, doc) {
            return Y.Dom._inDoc(Y.Dom.get(el), doc);
        },

        _inDoc: function(el, doc) {
            var ret = false;
            if (el && el[TAG_NAME]) {
                doc = doc || el[OWNER_DOCUMENT]; 
                ret = Y.Dom.isAncestor(doc[DOCUMENT_ELEMENT], el);
            } else {
            }
            return ret;
        },
        
        /**
         * Returns an array of HTMLElements that pass the test applied by supplied boolean method.
         * For optimized performance, include a tag and/or root node when possible.
         * Note: This method operates against a live collection, so modifying the 
         * collection in the callback (removing/appending nodes, etc.) will have
         * side effects.  Instead you should iterate the returned nodes array,
         * as you would with the native "getElementsByTagName" method. 
         * @method getElementsBy
         * @param {Function} method - A boolean method for testing elements which receives the element as its only argument.
         * @param {String} tag (optional) The tag name of the elements being collected
         * @param {String | HTMLElement} root (optional) The HTMLElement or an ID to use as the starting point 
         * @param {Function} apply (optional) A function to apply to each element when found 
         * @param {Any} o (optional) An optional arg that is passed to the supplied method
         * @param {Boolean} overrides (optional) Whether or not to override the scope of "method" with "o"
         * @return {Array} Array of HTMLElements
         */
        getElementsBy: function(method, tag, root, apply, o, overrides, firstOnly) {
            tag = tag || '*';
            root = (root) ? Y.Dom.get(root) : null || document; 

                var ret = (firstOnly) ? null : [],
                    elements;
            
            // in case Dom.get() returns null
            if (root) {
                elements = root.getElementsByTagName(tag);
                for (var i = 0, len = elements.length; i < len; ++i) {
                    if ( method(elements[i]) ) {
                        if (firstOnly) {
                            ret = elements[i]; 
                            break;
                        } else {
                            ret[ret.length] = elements[i];
                        }
                    }
                }

                if (apply) {
                    Y.Dom.batch(ret, apply, o, overrides);
                }
            }

            
            return ret;
        },
        
        /**
         * Returns the first HTMLElement that passes the test applied by the supplied boolean method.
         * @method getElementBy
         * @param {Function} method - A boolean method for testing elements which receives the element as its only argument.
         * @param {String} tag (optional) The tag name of the elements being collected
         * @param {String | HTMLElement} root (optional) The HTMLElement or an ID to use as the starting point 
         * @return {HTMLElement}
         */
        getElementBy: function(method, tag, root) {
            return Y.Dom.getElementsBy(method, tag, root, null, null, null, true); 
        },

        /**
         * Runs the supplied method against each item in the Collection/Array.
         * The method is called with the element(s) as the first arg, and the optional param as the second ( method(el, o) ).
         * @method batch
         * @param {String | HTMLElement | Array} el (optional) An element or array of elements to apply the method to
         * @param {Function} method The method to apply to the element(s)
         * @param {Any} o (optional) An optional arg that is passed to the supplied method
         * @param {Boolean} overrides (optional) Whether or not to override the scope of "method" with "o"
         * @return {Any | Array} The return value(s) from the supplied method
         */
        batch: function(el, method, o, overrides) {
            var collection = [],
                scope = (overrides) ? o : null;
                
            el = (el && (el[TAG_NAME] || el.item)) ? el : Y.Dom.get(el); // skip get() when possible
            if (el && method) {
                if (el[TAG_NAME] || el.length === undefined) { // element or not array-like 
                    return method.call(scope, el, o);
                } 

                for (var i = 0; i < el.length; ++i) {
                    collection[collection.length] = method.call(scope || el[i], el[i], o);
                }
            } else {
                return false;
            } 
            return collection;
        },
        
        /**
         * Returns the height of the document.
         * @method getDocumentHeight
         * @return {Int} The height of the actual document (which includes the body and its margin).
         */
        getDocumentHeight: function() {
            var scrollHeight = (document[COMPAT_MODE] != CSS1_COMPAT || isSafari) ? document.body.scrollHeight : documentElement.scrollHeight,
                h = Math.max(scrollHeight, Y.Dom.getViewportHeight());

            return h;
        },
        
        /**
         * Returns the width of the document.
         * @method getDocumentWidth
         * @return {Int} The width of the actual document (which includes the body and its margin).
         */
        getDocumentWidth: function() {
            var scrollWidth = (document[COMPAT_MODE] != CSS1_COMPAT || isSafari) ? document.body.scrollWidth : documentElement.scrollWidth,
                w = Math.max(scrollWidth, Y.Dom.getViewportWidth());
            return w;
        },

        /**
         * Returns the current height of the viewport.
         * @method getViewportHeight
         * @return {Int} The height of the viewable area of the page (excludes scrollbars).
         */
        getViewportHeight: function() {
            var height = self.innerHeight, // Safari, Opera
                mode = document[COMPAT_MODE];
        
            if ( (mode || isIE) && !isOpera ) { // IE, Gecko
                height = (mode == CSS1_COMPAT) ?
                        documentElement.clientHeight : // Standards
                        document.body.clientHeight; // Quirks
            }
        
            return height;
        },
        
        /**
         * Returns the current width of the viewport.
         * @method getViewportWidth
         * @return {Int} The width of the viewable area of the page (excludes scrollbars).
         */
        
        getViewportWidth: function() {
            var width = self.innerWidth,  // Safari
                mode = document[COMPAT_MODE];
            
            if (mode || isIE) { // IE, Gecko, Opera
                width = (mode == CSS1_COMPAT) ?
                        documentElement.clientWidth : // Standards
                        document.body.clientWidth; // Quirks
            }
            return width;
        },

       /**
         * Returns the nearest ancestor that passes the test applied by supplied boolean method.
         * For performance reasons, IDs are not accepted and argument validation omitted.
         * @method getAncestorBy
         * @param {HTMLElement} node The HTMLElement to use as the starting point 
         * @param {Function} method - A boolean method for testing elements which receives the element as its only argument.
         * @return {Object} HTMLElement or null if not found
         */
        getAncestorBy: function(node, method) {
            while ( (node = node[PARENT_NODE]) ) { // NOTE: assignment
                if ( Y.Dom._testElement(node, method) ) {
                    return node;
                }
            } 

            return null;
        },
        
        /**
         * Returns the nearest ancestor with the given className.
         * @method getAncestorByClassName
         * @param {String | HTMLElement} node The HTMLElement or an ID to use as the starting point 
         * @param {String} className
         * @return {Object} HTMLElement
         */
        getAncestorByClassName: function(node, className) {
            node = Y.Dom.get(node);
            if (!node) {
                return null;
            }
            var method = function(el) { return Y.Dom.hasClass(el, className); };
            return Y.Dom.getAncestorBy(node, method);
        },

        /**
         * Returns the nearest ancestor with the given tagName.
         * @method getAncestorByTagName
         * @param {String | HTMLElement} node The HTMLElement or an ID to use as the starting point 
         * @param {String} tagName
         * @return {Object} HTMLElement
         */
        getAncestorByTagName: function(node, tagName) {
            node = Y.Dom.get(node);
            if (!node) {
                return null;
            }
            var method = function(el) {
                 return el[TAG_NAME] && el[TAG_NAME].toUpperCase() == tagName.toUpperCase();
            };

            return Y.Dom.getAncestorBy(node, method);
        },

        /**
         * Returns the previous sibling that is an HTMLElement. 
         * For performance reasons, IDs are not accepted and argument validation omitted.
         * Returns the nearest HTMLElement sibling if no method provided.
         * @method getPreviousSiblingBy
         * @param {HTMLElement} node The HTMLElement to use as the starting point 
         * @param {Function} method A boolean function used to test siblings
         * that receives the sibling node being tested as its only argument
         * @return {Object} HTMLElement or null if not found
         */
        getPreviousSiblingBy: function(node, method) {
            while (node) {
                node = node.previousSibling;
                if ( Y.Dom._testElement(node, method) ) {
                    return node;
                }
            }
            return null;
        }, 

        /**
         * Returns the previous sibling that is an HTMLElement 
         * @method getPreviousSibling
         * @param {String | HTMLElement} node The HTMLElement or an ID to use as the starting point 
         * @return {Object} HTMLElement or null if not found
         */
        getPreviousSibling: function(node) {
            node = Y.Dom.get(node);
            if (!node) {
                return null;
            }

            return Y.Dom.getPreviousSiblingBy(node);
        }, 

        /**
         * Returns the next HTMLElement sibling that passes the boolean method. 
         * For performance reasons, IDs are not accepted and argument validation omitted.
         * Returns the nearest HTMLElement sibling if no method provided.
         * @method getNextSiblingBy
         * @param {HTMLElement} node The HTMLElement to use as the starting point 
         * @param {Function} method A boolean function used to test siblings
         * that receives the sibling node being tested as its only argument
         * @return {Object} HTMLElement or null if not found
         */
        getNextSiblingBy: function(node, method) {
            while (node) {
                node = node.nextSibling;
                if ( Y.Dom._testElement(node, method) ) {
                    return node;
                }
            }
            return null;
        }, 

        /**
         * Returns the next sibling that is an HTMLElement 
         * @method getNextSibling
         * @param {String | HTMLElement} node The HTMLElement or an ID to use as the starting point 
         * @return {Object} HTMLElement or null if not found
         */
        getNextSibling: function(node) {
            node = Y.Dom.get(node);
            if (!node) {
                return null;
            }

            return Y.Dom.getNextSiblingBy(node);
        }, 

        /**
         * Returns the first HTMLElement child that passes the test method. 
         * @method getFirstChildBy
         * @param {HTMLElement} node The HTMLElement to use as the starting point 
         * @param {Function} method A boolean function used to test children
         * that receives the node being tested as its only argument
         * @return {Object} HTMLElement or null if not found
         */
        getFirstChildBy: function(node, method) {
            var child = ( Y.Dom._testElement(node.firstChild, method) ) ? node.firstChild : null;
            return child || Y.Dom.getNextSiblingBy(node.firstChild, method);
        }, 

        /**
         * Returns the first HTMLElement child. 
         * @method getFirstChild
         * @param {String | HTMLElement} node The HTMLElement or an ID to use as the starting point 
         * @return {Object} HTMLElement or null if not found
         */
        getFirstChild: function(node, method) {
            node = Y.Dom.get(node);
            if (!node) {
                return null;
            }
            return Y.Dom.getFirstChildBy(node);
        }, 

        /**
         * Returns the last HTMLElement child that passes the test method. 
         * @method getLastChildBy
         * @param {HTMLElement} node The HTMLElement to use as the starting point 
         * @param {Function} method A boolean function used to test children
         * that receives the node being tested as its only argument
         * @return {Object} HTMLElement or null if not found
         */
        getLastChildBy: function(node, method) {
            if (!node) {
                return null;
            }
            var child = ( Y.Dom._testElement(node.lastChild, method) ) ? node.lastChild : null;
            return child || Y.Dom.getPreviousSiblingBy(node.lastChild, method);
        }, 

        /**
         * Returns the last HTMLElement child. 
         * @method getLastChild
         * @param {String | HTMLElement} node The HTMLElement or an ID to use as the starting point 
         * @return {Object} HTMLElement or null if not found
         */
        getLastChild: function(node) {
            node = Y.Dom.get(node);
            return Y.Dom.getLastChildBy(node);
        }, 

        /**
         * Returns an array of HTMLElement childNodes that pass the test method. 
         * @method getChildrenBy
         * @param {HTMLElement} node The HTMLElement to start from
         * @param {Function} method A boolean function used to test children
         * that receives the node being tested as its only argument
         * @return {Array} A static array of HTMLElements
         */
        getChildrenBy: function(node, method) {
            var child = Y.Dom.getFirstChildBy(node, method),
                children = child ? [child] : [];

            Y.Dom.getNextSiblingBy(child, function(node) {
                if ( !method || method(node) ) {
                    children[children.length] = node;
                }
                return false; // fail test to collect all children
            });

            return children;
        },
 
        /**
         * Returns an array of HTMLElement childNodes. 
         * @method getChildren
         * @param {String | HTMLElement} node The HTMLElement or an ID to use as the starting point 
         * @return {Array} A static array of HTMLElements
         */
        getChildren: function(node) {
            node = Y.Dom.get(node);
            if (!node) {
            }

            return Y.Dom.getChildrenBy(node);
        },

        /**
         * Returns the left scroll value of the document 
         * @method getDocumentScrollLeft
         * @param {HTMLDocument} document (optional) The document to get the scroll value of
         * @return {Int}  The amount that the document is scrolled to the left
         */
        getDocumentScrollLeft: function(doc) {
            doc = doc || document;
            return Math.max(doc[DOCUMENT_ELEMENT].scrollLeft, doc.body.scrollLeft);
        }, 

        /**
         * Returns the top scroll value of the document 
         * @method getDocumentScrollTop
         * @param {HTMLDocument} document (optional) The document to get the scroll value of
         * @return {Int}  The amount that the document is scrolled to the top
         */
        getDocumentScrollTop: function(doc) {
            doc = doc || document;
            return Math.max(doc[DOCUMENT_ELEMENT].scrollTop, doc.body.scrollTop);
        },

        /**
         * Inserts the new node as the previous sibling of the reference node 
         * @method insertBefore
         * @param {String | HTMLElement} newNode The node to be inserted
         * @param {String | HTMLElement} referenceNode The node to insert the new node before 
         * @return {HTMLElement} The node that was inserted (or null if insert fails) 
         */
        insertBefore: function(newNode, referenceNode) {
            newNode = Y.Dom.get(newNode); 
            referenceNode = Y.Dom.get(referenceNode); 
            
            if (!newNode || !referenceNode || !referenceNode[PARENT_NODE]) {
                return null;
            }       

            return referenceNode[PARENT_NODE].insertBefore(newNode, referenceNode); 
        },

        /**
         * Inserts the new node as the next sibling of the reference node 
         * @method insertAfter
         * @param {String | HTMLElement} newNode The node to be inserted
         * @param {String | HTMLElement} referenceNode The node to insert the new node after 
         * @return {HTMLElement} The node that was inserted (or null if insert fails) 
         */
        insertAfter: function(newNode, referenceNode) {
            newNode = Y.Dom.get(newNode); 
            referenceNode = Y.Dom.get(referenceNode); 
            
            if (!newNode || !referenceNode || !referenceNode[PARENT_NODE]) {
                return null;
            }       

            if (referenceNode.nextSibling) {
                return referenceNode[PARENT_NODE].insertBefore(newNode, referenceNode.nextSibling); 
            } else {
                return referenceNode[PARENT_NODE].appendChild(newNode);
            }
        },

        /**
         * Creates a Region based on the viewport relative to the document. 
         * @method getClientRegion
         * @return {Region} A Region object representing the viewport which accounts for document scroll
         */
        getClientRegion: function() {
            var t = Y.Dom.getDocumentScrollTop(),
                l = Y.Dom.getDocumentScrollLeft(),
                r = Y.Dom.getViewportWidth() + l,
                b = Y.Dom.getViewportHeight() + t;

            return new Y.Region(t, r, b, l);
        },

        /**
         * Provides a normalized attribute interface. 
         * @method setAttribute
         * @param {String | HTMLElement} el The target element for the attribute.
         * @param {String} attr The attribute to set.
         * @param {String} val The value of the attribute.
         */
        setAttribute: function(el, attr, val) {
            Y.Dom.batch(el, Y.Dom._setAttribute, { attr: attr, val: val });
        },

        _setAttribute: function(el, args) {
            var attr = Y.Dom._toCamel(args.attr),
                val = args.val;

            if (el && el.setAttribute) {
                // set as DOM property, except for BUTTON, which errors on property setter
                if (Y.Dom.DOT_ATTRIBUTES[attr] && el.tagName && el.tagName != 'BUTTON') {
                    el[attr] = val;
                } else {
                    attr = Y.Dom.CUSTOM_ATTRIBUTES[attr] || attr;
                    el.setAttribute(attr, val);
                }
            } else {
            }
        },

        /**
         * Provides a normalized attribute interface. 
         * @method getAttribute
         * @param {String | HTMLElement} el The target element for the attribute.
         * @param {String} attr The attribute to get.
         * @return {String} The current value of the attribute. 
         */
        getAttribute: function(el, attr) {
            return Y.Dom.batch(el, Y.Dom._getAttribute, attr);
        },


        _getAttribute: function(el, attr) {
            var val;
            attr = Y.Dom.CUSTOM_ATTRIBUTES[attr] || attr;

            if (Y.Dom.DOT_ATTRIBUTES[attr]) {
                val = el[attr];
            } else if (el && 'getAttribute' in el) {
                if (/^(?:href|src)$/.test(attr)) { // use IE flag to return exact value
                    val = el.getAttribute(attr, 2);
                } else {
                    val = el.getAttribute(attr);
                }
            } else {
            }

            return val;
        },

        _toCamel: function(property) {
            var c = propertyCache;

            function tU(x,l) {
                return l.toUpperCase();
            }

            return c[property] || (c[property] = property.indexOf('-') === -1 ? 
                                    property :
                                    property.replace( /-([a-z])/gi, tU ));
        },

        _getClassRegex: function(className) {
            var re;
            if (className !== undefined) { // allow empty string to pass
                if (className.exec) { // already a RegExp
                    re = className;
                } else {
                    re = reCache[className];
                    if (!re) {
                        // escape special chars (".", "[", etc.)
                        className = className.replace(Y.Dom._patterns.CLASS_RE_TOKENS, '\\$1');
                        className = className.replace(/\s+/g, SPACE); // convert line breaks and other delims
                        re = reCache[className] = new RegExp(C_START + className + C_END, G);
                    }
                }
            }
            return re;
        },

        _patterns: {
            ROOT_TAG: /^body|html$/i, // body for quirks mode, html for standards,
            CLASS_RE_TOKENS: /([\.\(\)\^\$\*\+\?\|\[\]\{\}\\])/g
        },


        _testElement: function(node, method) {
            return node && node[NODE_TYPE] == 1 && ( !method || method(node) );
        },

        _calcBorders: function(node, xy2) {
            var t = parseInt(Y.Dom[GET_COMPUTED_STYLE](node, BORDER_TOP_WIDTH), 10) || 0,
                l = parseInt(Y.Dom[GET_COMPUTED_STYLE](node, BORDER_LEFT_WIDTH), 10) || 0;
            if (isGecko) {
                if (RE_TABLE.test(node[TAG_NAME])) {
                    t = 0;
                    l = 0;
                }
            }
            xy2[0] += l;
            xy2[1] += t;
            return xy2;
        }
    };
        
    var _getComputedStyle = Y.Dom[GET_COMPUTED_STYLE];
    // fix opera computedStyle default color unit (convert to rgb)
    if (UA.opera) {
        Y.Dom[GET_COMPUTED_STYLE] = function(node, att) {
            var val = _getComputedStyle(node, att);
            if (RE_COLOR.test(att)) {
                val = Y.Dom.Color.toRGB(val);
            }

            return val;
        };

    }

    // safari converts transparent to rgba(), others use "transparent"
    if (UA.webkit) {
        Y.Dom[GET_COMPUTED_STYLE] = function(node, att) {
            var val = _getComputedStyle(node, att);

            if (val === 'rgba(0, 0, 0, 0)') {
                val = 'transparent'; 
            }

            return val;
        };

    }

    if (UA.ie && UA.ie >= 8) {
        Y.Dom.DOT_ATTRIBUTES.type = true; // IE 8 errors on input.setAttribute('type')
    }
})();
/**
 * A region is a representation of an object on a grid.  It is defined
 * by the top, right, bottom, left extents, so is rectangular by default.  If 
 * other shapes are required, this class could be extended to support it.
 * @namespace YAHOO.util
 * @class Region
 * @param {Int} t the top extent
 * @param {Int} r the right extent
 * @param {Int} b the bottom extent
 * @param {Int} l the left extent
 * @constructor
 */
YAHOO.util.Region = function(t, r, b, l) {

    /**
     * The region's top extent
     * @property top
     * @type Int
     */
    this.top = t;
    
    /**
     * The region's top extent
     * @property y
     * @type Int
     */
    this.y = t;
    
    /**
     * The region's top extent as index, for symmetry with set/getXY
     * @property 1
     * @type Int
     */
    this[1] = t;

    /**
     * The region's right extent
     * @property right
     * @type int
     */
    this.right = r;

    /**
     * The region's bottom extent
     * @property bottom
     * @type Int
     */
    this.bottom = b;

    /**
     * The region's left extent
     * @property left
     * @type Int
     */
    this.left = l;
    
    /**
     * The region's left extent
     * @property x
     * @type Int
     */
    this.x = l;
    
    /**
     * The region's left extent as index, for symmetry with set/getXY
     * @property 0
     * @type Int
     */
    this[0] = l;

    /**
     * The region's total width 
     * @property width 
     * @type Int
     */
    this.width = this.right - this.left;

    /**
     * The region's total height 
     * @property height 
     * @type Int
     */
    this.height = this.bottom - this.top;
};

/**
 * Returns true if this region contains the region passed in
 * @method contains
 * @param  {Region}  region The region to evaluate
 * @return {Boolean}        True if the region is contained with this region, 
 *                          else false
 */
YAHOO.util.Region.prototype.contains = function(region) {
    return ( region.left   >= this.left   && 
             region.right  <= this.right  && 
             region.top    >= this.top    && 
             region.bottom <= this.bottom    );

};

/**
 * Returns the area of the region
 * @method getArea
 * @return {Int} the region's area
 */
YAHOO.util.Region.prototype.getArea = function() {
    return ( (this.bottom - this.top) * (this.right - this.left) );
};

/**
 * Returns the region where the passed in region overlaps with this one
 * @method intersect
 * @param  {Region} region The region that intersects
 * @return {Region}        The overlap region, or null if there is no overlap
 */
YAHOO.util.Region.prototype.intersect = function(region) {
    var t = Math.max( this.top,    region.top    ),
        r = Math.min( this.right,  region.right  ),
        b = Math.min( this.bottom, region.bottom ),
        l = Math.max( this.left,   region.left   );
    
    if (b >= t && r >= l) {
        return new YAHOO.util.Region(t, r, b, l);
    } else {
        return null;
    }
};

/**
 * Returns the region representing the smallest region that can contain both
 * the passed in region and this region.
 * @method union
 * @param  {Region} region The region that to create the union with
 * @return {Region}        The union region
 */
YAHOO.util.Region.prototype.union = function(region) {
    var t = Math.min( this.top,    region.top    ),
        r = Math.max( this.right,  region.right  ),
        b = Math.max( this.bottom, region.bottom ),
        l = Math.min( this.left,   region.left   );

    return new YAHOO.util.Region(t, r, b, l);
};

/**
 * toString
 * @method toString
 * @return string the region properties
 */
YAHOO.util.Region.prototype.toString = function() {
    return ( "Region {"    +
             "top: "       + this.top    + 
             ", right: "   + this.right  + 
             ", bottom: "  + this.bottom + 
             ", left: "    + this.left   + 
             ", height: "  + this.height + 
             ", width: "    + this.width   + 
             "}" );
};

/**
 * Returns a region that is occupied by the DOM element
 * @method getRegion
 * @param  {HTMLElement} el The element
 * @return {Region}         The region that the element occupies
 * @static
 */
YAHOO.util.Region.getRegion = function(el) {
    var p = YAHOO.util.Dom.getXY(el),
        t = p[1],
        r = p[0] + el.offsetWidth,
        b = p[1] + el.offsetHeight,
        l = p[0];

    return new YAHOO.util.Region(t, r, b, l);
};

/////////////////////////////////////////////////////////////////////////////


/**
 * A point is a region that is special in that it represents a single point on 
 * the grid.
 * @namespace YAHOO.util
 * @class Point
 * @param {Int} x The X position of the point
 * @param {Int} y The Y position of the point
 * @constructor
 * @extends YAHOO.util.Region
 */
YAHOO.util.Point = function(x, y) {
   if (YAHOO.lang.isArray(x)) { // accept input from Dom.getXY, Event.getXY, etc.
      y = x[1]; // dont blow away x yet
      x = x[0];
   }
 
    YAHOO.util.Point.superclass.constructor.call(this, y, x, y, x);
};

YAHOO.extend(YAHOO.util.Point, YAHOO.util.Region);

(function() {
/**
 * Internal methods used to add style management functionality to DOM.
 * @module dom
 * @class IEStyle
 * @namespace YAHOO.util.Dom
 */

var Y = YAHOO.util, 
    CLIENT_TOP = 'clientTop',
    CLIENT_LEFT = 'clientLeft',
    PARENT_NODE = 'parentNode',
    RIGHT = 'right',
    HAS_LAYOUT = 'hasLayout',
    PX = 'px',
    OPACITY = 'opacity',
    AUTO = 'auto',
    BORDER_LEFT_WIDTH = 'borderLeftWidth',
    BORDER_TOP_WIDTH = 'borderTopWidth',
    BORDER_RIGHT_WIDTH = 'borderRightWidth',
    BORDER_BOTTOM_WIDTH = 'borderBottomWidth',
    VISIBLE = 'visible',
    TRANSPARENT = 'transparent',
    HEIGHT = 'height',
    WIDTH = 'width',
    STYLE = 'style',
    CURRENT_STYLE = 'currentStyle',

// IE getComputedStyle
// TODO: unit-less lineHeight (e.g. 1.22)
    re_size = /^width|height$/,
    re_unit = /^(\d[.\d]*)+(em|ex|px|gd|rem|vw|vh|vm|ch|mm|cm|in|pt|pc|deg|rad|ms|s|hz|khz|%){1}?/i,

    ComputedStyle = {
        /**
        * @method get
        * @description Method used by DOM to get style information for IE
        * @param {HTMLElement} el The element to check
        * @param {String} property The property to check
        * @returns {String} The computed style
        */
        get: function(el, property) {
            var value = '',
                current = el[CURRENT_STYLE][property];

            if (property === OPACITY) {
                value = Y.Dom.getStyle(el, OPACITY);        
            } else if (!current || (current.indexOf && current.indexOf(PX) > -1)) { // no need to convert
                value = current;
            } else if (Y.Dom.IE_COMPUTED[property]) { // use compute function
                value = Y.Dom.IE_COMPUTED[property](el, property);
            } else if (re_unit.test(current)) { // convert to pixel
                value = Y.Dom.IE.ComputedStyle.getPixel(el, property);
            } else {
                value = current;
            }

            return value;
        },
        /**
        * @method getOffset
        * @description Determine the offset of an element
        * @param {HTMLElement} el The element to check
        * @param {String} prop The property to check.
        * @return {String} The offset
        */
        getOffset: function(el, prop) {
            var current = el[CURRENT_STYLE][prop],                        // value of "width", "top", etc.
                capped = prop.charAt(0).toUpperCase() + prop.substr(1), // "Width", "Top", etc.
                offset = 'offset' + capped,                             // "offsetWidth", "offsetTop", etc.
                pixel = 'pixel' + capped,                               // "pixelWidth", "pixelTop", etc.
                value = '',
                actual;

            if (current == AUTO) {
                actual = el[offset]; // offsetHeight/Top etc.
                if (actual === undefined) { // likely "right" or "bottom"
                    value = 0;
                }

                value = actual;
                if (re_size.test(prop)) { // account for box model diff 
                    el[STYLE][prop] = actual; 
                    if (el[offset] > actual) {
                        // the difference is padding + border (works in Standards & Quirks modes)
                        value = actual - (el[offset] - actual);
                    }
                    el[STYLE][prop] = AUTO; // revert to auto
                }
            } else { // convert units to px
                if (!el[STYLE][pixel] && !el[STYLE][prop]) { // need to map style.width to currentStyle (no currentStyle.pixelWidth)
                    el[STYLE][prop] = current;              // no style.pixelWidth if no style.width
                }
                value = el[STYLE][pixel];
            }
            return value + PX;
        },
        /**
        * @method getBorderWidth
        * @description Try to determine the width of an elements border
        * @param {HTMLElement} el The element to check
        * @param {String} property The property to check
        * @return {String} The elements border width
        */
        getBorderWidth: function(el, property) {
            // clientHeight/Width = paddingBox (e.g. offsetWidth - borderWidth)
            // clientTop/Left = borderWidth
            var value = null;
            if (!el[CURRENT_STYLE][HAS_LAYOUT]) { // TODO: unset layout?
                el[STYLE].zoom = 1; // need layout to measure client
            }

            switch(property) {
                case BORDER_TOP_WIDTH:
                    value = el[CLIENT_TOP];
                    break;
                case BORDER_BOTTOM_WIDTH:
                    value = el.offsetHeight - el.clientHeight - el[CLIENT_TOP];
                    break;
                case BORDER_LEFT_WIDTH:
                    value = el[CLIENT_LEFT];
                    break;
                case BORDER_RIGHT_WIDTH:
                    value = el.offsetWidth - el.clientWidth - el[CLIENT_LEFT];
                    break;
            }
            return value + PX;
        },
        /**
        * @method getPixel
        * @description Get the pixel value from a style property
        * @param {HTMLElement} node The element to check
        * @param {String} att The attribute to check
        * @return {String} The pixel value
        */
        getPixel: function(node, att) {
            // use pixelRight to convert to px
            var val = null,
                styleRight = node[CURRENT_STYLE][RIGHT],
                current = node[CURRENT_STYLE][att];

            node[STYLE][RIGHT] = current;
            val = node[STYLE].pixelRight;
            node[STYLE][RIGHT] = styleRight; // revert

            return val + PX;
        },

        /**
        * @method getMargin
        * @description Get the margin value from a style property
        * @param {HTMLElement} node The element to check
        * @param {String} att The attribute to check
        * @return {String} The margin value
        */
        getMargin: function(node, att) {
            var val;
            if (node[CURRENT_STYLE][att] == AUTO) {
                val = 0 + PX;
            } else {
                val = Y.Dom.IE.ComputedStyle.getPixel(node, att);
            }
            return val;
        },

        /**
        * @method getVisibility
        * @description Get the visibility of an element
        * @param {HTMLElement} node The element to check
        * @param {String} att The attribute to check
        * @return {String} The value
        */
        getVisibility: function(node, att) {
            var current;
            while ( (current = node[CURRENT_STYLE]) && current[att] == 'inherit') { // NOTE: assignment in test
                node = node[PARENT_NODE];
            }
            return (current) ? current[att] : VISIBLE;
        },

        /**
        * @method getColor
        * @description Get the color of an element
        * @param {HTMLElement} node The element to check
        * @param {String} att The attribute to check
        * @return {String} The value
        */
        getColor: function(node, att) {
            return Y.Dom.Color.toRGB(node[CURRENT_STYLE][att]) || TRANSPARENT;
        },

        /**
        * @method getBorderColor
        * @description Get the bordercolor of an element
        * @param {HTMLElement} node The element to check
        * @param {String} att The attribute to check
        * @return {String} The value
        */
        getBorderColor: function(node, att) {
            var current = node[CURRENT_STYLE],
                val = current[att] || current.color;
            return Y.Dom.Color.toRGB(Y.Dom.Color.toHex(val));
        }

    },

//fontSize: getPixelFont,
    IEComputed = {};

IEComputed.top = IEComputed.right = IEComputed.bottom = IEComputed.left = 
        IEComputed[WIDTH] = IEComputed[HEIGHT] = ComputedStyle.getOffset;

IEComputed.color = ComputedStyle.getColor;

IEComputed[BORDER_TOP_WIDTH] = IEComputed[BORDER_RIGHT_WIDTH] =
        IEComputed[BORDER_BOTTOM_WIDTH] = IEComputed[BORDER_LEFT_WIDTH] =
        ComputedStyle.getBorderWidth;

IEComputed.marginTop = IEComputed.marginRight = IEComputed.marginBottom =
        IEComputed.marginLeft = ComputedStyle.getMargin;

IEComputed.visibility = ComputedStyle.getVisibility;
IEComputed.borderColor = IEComputed.borderTopColor =
        IEComputed.borderRightColor = IEComputed.borderBottomColor =
        IEComputed.borderLeftColor = ComputedStyle.getBorderColor;

Y.Dom.IE_COMPUTED = IEComputed;
Y.Dom.IE_ComputedStyle = ComputedStyle;
})();
(function() {
/**
 * Add style management functionality to DOM.
 * @module dom
 * @class Color
 * @namespace YAHOO.util.Dom
 */

var TO_STRING = 'toString',
    PARSE_INT = parseInt,
    RE = RegExp,
    Y = YAHOO.util;

Y.Dom.Color = {
    /**
    * @property KEYWORDS
    * @type Object
    * @description Color keywords used when converting to Hex
    */
    KEYWORDS: {
        black: '000',
        silver: 'c0c0c0',
        gray: '808080',
        white: 'fff',
        maroon: '800000',
        red: 'f00',
        purple: '800080',
        fuchsia: 'f0f',
        green: '008000',
        lime: '0f0',
        olive: '808000',
        yellow: 'ff0',
        navy: '000080',
        blue: '00f',
        teal: '008080',
        aqua: '0ff'
    },
    /**
    * @property re_RGB
    * @private
    * @type Regex
    * @description Regex to parse rgb(0,0,0) formatted strings
    */
    re_RGB: /^rgb\(([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)\)$/i,
    /**
    * @property re_hex
    * @private
    * @type Regex
    * @description Regex to parse #123456 formatted strings
    */
    re_hex: /^#?([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})$/i,
    /**
    * @property re_hex3
    * @private
    * @type Regex
    * @description Regex to parse #123 formatted strings
    */
    re_hex3: /([0-9A-F])/gi,
    /**
    * @method toRGB
    * @description Converts a hex or color string to an rgb string: rgb(0,0,0)
    * @param {String} val The string to convert to RGB notation.
    * @returns {String} The converted string
    */
    toRGB: function(val) {
        if (!Y.Dom.Color.re_RGB.test(val)) {
            val = Y.Dom.Color.toHex(val);
        }

        if(Y.Dom.Color.re_hex.exec(val)) {
            val = 'rgb(' + [
                PARSE_INT(RE.$1, 16),
                PARSE_INT(RE.$2, 16),
                PARSE_INT(RE.$3, 16)
            ].join(', ') + ')';
        }
        return val;
    },
    /**
    * @method toHex
    * @description Converts an rgb or color string to a hex string: #123456
    * @param {String} val The string to convert to hex notation.
    * @returns {String} The converted string
    */
    toHex: function(val) {
        val = Y.Dom.Color.KEYWORDS[val] || val;
        if (Y.Dom.Color.re_RGB.exec(val)) {
            val = [
                Number(RE.$1).toString(16),
                Number(RE.$2).toString(16),
                Number(RE.$3).toString(16)
            ];

            for (var i = 0; i < val.length; i++) {
                if (val[i].length < 2) {
                    val[i] = '0' + val[i];
                }
            }

            val = val.join('');
        }

        if (val.length < 6) {
            val = val.replace(Y.Dom.Color.re_hex3, '$1$1');
        }

        if (val !== 'transparent' && val.indexOf('#') < 0) {
            val = '#' + val;
        }

        return val.toUpperCase();
    }
};
}());
YAHOO.register("dom", YAHOO.util.Dom, {version: "2.9.0", build: "2800"});

/*
Copyright (c) 2011, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://developer.yahoo.com/yui/license.html
version: 2.9.0
*/
/**
 * The drag and drop utility provides a framework for building drag and drop
 * applications.  In addition to enabling drag and drop for specific elements,
 * the drag and drop elements are tracked by the manager class, and the
 * interactions between the various elements are tracked during the drag and
 * the implementing code is notified about these important moments.
 * @module dragdrop
 * @title Drag and Drop
 * @requires yahoo,dom,event
 * @namespace YAHOO.util
 */

// Only load the library once.  Rewriting the manager class would orphan 
// existing drag and drop instances.
if (!YAHOO.util.DragDropMgr) {

/**
 * DragDropMgr is a singleton that tracks the element interaction for 
 * all DragDrop items in the window.  Generally, you will not call 
 * this class directly, but it does have helper methods that could 
 * be useful in your DragDrop implementations.
 * @class DragDropMgr
 * @static
 */
YAHOO.util.DragDropMgr = function() {

    var Event = YAHOO.util.Event,
        Dom = YAHOO.util.Dom;

    return {
        /**
        * This property is used to turn on global use of the shim element on all DragDrop instances, defaults to false for backcompat. (Use: YAHOO.util.DDM.useShim = true)
        * @property useShim
        * @type Boolean
        * @static
        */
        useShim: false,
        /**
        * This property is used to determine if the shim is active over the screen, default false.
        * @private
        * @property _shimActive
        * @type Boolean
        * @static
        */
        _shimActive: false,
        /**
        * This property is used when useShim is set on a DragDrop object to store the current state of DDM.useShim so it can be reset when a drag operation is done.
        * @private
        * @property _shimState
        * @type Boolean
        * @static
        */
        _shimState: false,
        /**
        * This property is used when useShim is set to true, it will set the opacity on the shim to .5 for debugging. Use: (YAHOO.util.DDM._debugShim = true;)
        * @private
        * @property _debugShim
        * @type Boolean
        * @static
        */
        _debugShim: false,
        /**
        * This method will create a shim element (giving it the id of yui-ddm-shim), it also attaches the mousemove and mouseup listeners to it and attaches a scroll listener on the window
        * @private
        * @method _sizeShim
        * @static
        */
        _createShim: function() {
            var s = document.createElement('div');
            s.id = 'yui-ddm-shim';
            if (document.body.firstChild) {
                document.body.insertBefore(s, document.body.firstChild);
            } else {
                document.body.appendChild(s);
            }
            s.style.display = 'none';
            s.style.backgroundColor = 'red';
            s.style.position = 'absolute';
            s.style.zIndex = '99999';
            Dom.setStyle(s, 'opacity', '0');
            this._shim = s;
            Event.on(s, "mouseup",   this.handleMouseUp, this, true);
            Event.on(s, "mousemove", this.handleMouseMove, this, true);
            Event.on(window, 'scroll', this._sizeShim, this, true);
        },
        /**
        * This method will size the shim, called from activate and on window scroll event
        * @private
        * @method _sizeShim
        * @static
        */
        _sizeShim: function() {
            if (this._shimActive) {
                var s = this._shim;
                s.style.height = Dom.getDocumentHeight() + 'px';
                s.style.width = Dom.getDocumentWidth() + 'px';
                s.style.top = '0';
                s.style.left = '0';
            }
        },
        /**
        * This method will create the shim element if needed, then show the shim element, size the element and set the _shimActive property to true
        * @private
        * @method _activateShim
        * @static
        */
        _activateShim: function() {
            if (this.useShim) {
                if (!this._shim) {
                    this._createShim();
                }
                this._shimActive = true;
                var s = this._shim,
                    o = '0';
                if (this._debugShim) {
                    o = '.5';
                }
                Dom.setStyle(s, 'opacity', o);
                this._sizeShim();
                s.style.display = 'block';
            }
        },
        /**
        * This method will hide the shim element and set the _shimActive property to false
        * @private
        * @method _deactivateShim
        * @static
        */
        _deactivateShim: function() {
            this._shim.style.display = 'none';
            this._shimActive = false;
        },
        /**
        * The HTML element created to use as a shim over the document to track mouse movements
        * @private
        * @property _shim
        * @type HTMLElement
        * @static
        */
        _shim: null,
        /**
         * Two dimensional Array of registered DragDrop objects.  The first 
         * dimension is the DragDrop item group, the second the DragDrop 
         * object.
         * @property ids
         * @type {string: string}
         * @private
         * @static
         */
        ids: {},

        /**
         * Array of element ids defined as drag handles.  Used to determine 
         * if the element that generated the mousedown event is actually the 
         * handle and not the html element itself.
         * @property handleIds
         * @type {string: string}
         * @private
         * @static
         */
        handleIds: {},

        /**
         * the DragDrop object that is currently being dragged
         * @property dragCurrent
         * @type DragDrop
         * @private
         * @static
         **/
        dragCurrent: null,

        /**
         * the DragDrop object(s) that are being hovered over
         * @property dragOvers
         * @type Array
         * @private
         * @static
         */
        dragOvers: {},

        /**
         * the X distance between the cursor and the object being dragged
         * @property deltaX
         * @type int
         * @private
         * @static
         */
        deltaX: 0,

        /**
         * the Y distance between the cursor and the object being dragged
         * @property deltaY
         * @type int
         * @private
         * @static
         */
        deltaY: 0,

        /**
         * Flag to determine if we should prevent the default behavior of the
         * events we define. By default this is true, but this can be set to 
         * false if you need the default behavior (not recommended)
         * @property preventDefault
         * @type boolean
         * @static
         */
        preventDefault: true,

        /**
         * Flag to determine if we should stop the propagation of the events 
         * we generate. This is true by default but you may want to set it to
         * false if the html element contains other features that require the
         * mouse click.
         * @property stopPropagation
         * @type boolean
         * @static
         */
        stopPropagation: true,

        /**
         * Internal flag that is set to true when drag and drop has been
         * initialized
         * @property initialized
         * @private
         * @static
         */
        initialized: false,

        /**
         * All drag and drop can be disabled.
         * @property locked
         * @private
         * @static
         */
        locked: false,

        /**
         * Provides additional information about the the current set of
         * interactions.  Can be accessed from the event handlers. It
         * contains the following properties:
         *
         *       out:       onDragOut interactions
         *       enter:     onDragEnter interactions
         *       over:      onDragOver interactions
         *       drop:      onDragDrop interactions
         *       point:     The location of the cursor
         *       draggedRegion: The location of dragged element at the time
         *                      of the interaction
         *       sourceRegion: The location of the source elemtn at the time
         *                     of the interaction
         *       validDrop: boolean
         * @property interactionInfo
         * @type object
         * @static
         */
        interactionInfo: null,

        /**
         * Called the first time an element is registered.
         * @method init
         * @private
         * @static
         */
        init: function() {
            this.initialized = true;
        },

        /**
         * In point mode, drag and drop interaction is defined by the 
         * location of the cursor during the drag/drop
         * @property POINT
         * @type int
         * @static
         * @final
         */
        POINT: 0,

        /**
         * In intersect mode, drag and drop interaction is defined by the 
         * cursor position or the amount of overlap of two or more drag and 
         * drop objects.
         * @property INTERSECT
         * @type int
         * @static
         * @final
         */
        INTERSECT: 1,

        /**
         * In intersect mode, drag and drop interaction is defined only by the 
         * overlap of two or more drag and drop objects.
         * @property STRICT_INTERSECT
         * @type int
         * @static
         * @final
         */
        STRICT_INTERSECT: 2,

        /**
         * The current drag and drop mode.  Default: POINT
         * @property mode
         * @type int
         * @static
         */
        mode: 0,

        /**
         * Runs method on all drag and drop objects
         * @method _execOnAll
         * @private
         * @static
         */
        _execOnAll: function(sMethod, args) {
            for (var i in this.ids) {
                for (var j in this.ids[i]) {
                    var oDD = this.ids[i][j];
                    if (! this.isTypeOfDD(oDD)) {
                        continue;
                    }
                    oDD[sMethod].apply(oDD, args);
                }
            }
        },

        /**
         * Drag and drop initialization.  Sets up the global event handlers
         * @method _onLoad
         * @private
         * @static
         */
        _onLoad: function() {

            this.init();

            Event.on(document, "mouseup",   this.handleMouseUp, this, true);
            Event.on(document, "mousemove", this.handleMouseMove, this, true);
            Event.on(window,   "unload",    this._onUnload, this, true);
            Event.on(window,   "resize",    this._onResize, this, true);
            // Event.on(window,   "mouseout",    this._test);

        },

        /**
         * Reset constraints on all drag and drop objs
         * @method _onResize
         * @private
         * @static
         */
        _onResize: function(e) {
            this._execOnAll("resetConstraints", []);
        },

        /**
         * Lock all drag and drop functionality
         * @method lock
         * @static
         */
        lock: function() { this.locked = true; },

        /**
         * Unlock all drag and drop functionality
         * @method unlock
         * @static
         */
        unlock: function() { this.locked = false; },

        /**
         * Is drag and drop locked?
         * @method isLocked
         * @return {boolean} True if drag and drop is locked, false otherwise.
         * @static
         */
        isLocked: function() { return this.locked; },

        /**
         * Location cache that is set for all drag drop objects when a drag is
         * initiated, cleared when the drag is finished.
         * @property locationCache
         * @private
         * @static
         */
        locationCache: {},

        /**
         * Set useCache to false if you want to force object the lookup of each
         * drag and drop linked element constantly during a drag.
         * @property useCache
         * @type boolean
         * @static
         */
        useCache: true,

        /**
         * The number of pixels that the mouse needs to move after the 
         * mousedown before the drag is initiated.  Default=3;
         * @property clickPixelThresh
         * @type int
         * @static
         */
        clickPixelThresh: 3,

        /**
         * The number of milliseconds after the mousedown event to initiate the
         * drag if we don't get a mouseup event. Default=1000
         * @property clickTimeThresh
         * @type int
         * @static
         */
        clickTimeThresh: 1000,

        /**
         * Flag that indicates that either the drag pixel threshold or the 
         * mousdown time threshold has been met
         * @property dragThreshMet
         * @type boolean
         * @private
         * @static
         */
        dragThreshMet: false,

        /**
         * Timeout used for the click time threshold
         * @property clickTimeout
         * @type Object
         * @private
         * @static
         */
        clickTimeout: null,

        /**
         * The X position of the mousedown event stored for later use when a 
         * drag threshold is met.
         * @property startX
         * @type int
         * @private
         * @static
         */
        startX: 0,

        /**
         * The Y position of the mousedown event stored for later use when a 
         * drag threshold is met.
         * @property startY
         * @type int
         * @private
         * @static
         */
        startY: 0,

        /**
         * Flag to determine if the drag event was fired from the click timeout and
         * not the mouse move threshold.
         * @property fromTimeout
         * @type boolean
         * @private
         * @static
         */
        fromTimeout: false,

        /**
         * Each DragDrop instance must be registered with the DragDropMgr.  
         * This is executed in DragDrop.init()
         * @method regDragDrop
         * @param {DragDrop} oDD the DragDrop object to register
         * @param {String} sGroup the name of the group this element belongs to
         * @static
         */
        regDragDrop: function(oDD, sGroup) {
            if (!this.initialized) { this.init(); }
            
            if (!this.ids[sGroup]) {
                this.ids[sGroup] = {};
            }
            this.ids[sGroup][oDD.id] = oDD;
        },

        /**
         * Removes the supplied dd instance from the supplied group. Executed
         * by DragDrop.removeFromGroup, so don't call this function directly.
         * @method removeDDFromGroup
         * @private
         * @static
         */
        removeDDFromGroup: function(oDD, sGroup) {
            if (!this.ids[sGroup]) {
                this.ids[sGroup] = {};
            }

            var obj = this.ids[sGroup];
            if (obj && obj[oDD.id]) {
                delete obj[oDD.id];
            }
        },

        /**
         * Unregisters a drag and drop item.  This is executed in 
         * DragDrop.unreg, use that method instead of calling this directly.
         * @method _remove
         * @private
         * @static
         */
        _remove: function(oDD) {
            for (var g in oDD.groups) {
                if (g) {
                    var item = this.ids[g];
                    if (item && item[oDD.id]) {
                        delete item[oDD.id];
                    }
                }
                
            }
            delete this.handleIds[oDD.id];
        },

        /**
         * Each DragDrop handle element must be registered.  This is done
         * automatically when executing DragDrop.setHandleElId()
         * @method regHandle
         * @param {String} sDDId the DragDrop id this element is a handle for
         * @param {String} sHandleId the id of the element that is the drag 
         * handle
         * @static
         */
        regHandle: function(sDDId, sHandleId) {
            if (!this.handleIds[sDDId]) {
                this.handleIds[sDDId] = {};
            }
            this.handleIds[sDDId][sHandleId] = sHandleId;
        },

        /**
         * Utility function to determine if a given element has been 
         * registered as a drag drop item.
         * @method isDragDrop
         * @param {String} id the element id to check
         * @return {boolean} true if this element is a DragDrop item, 
         * false otherwise
         * @static
         */
        isDragDrop: function(id) {
            return ( this.getDDById(id) ) ? true : false;
        },

        /**
         * Returns the drag and drop instances that are in all groups the
         * passed in instance belongs to.
         * @method getRelated
         * @param {DragDrop} p_oDD the obj to get related data for
         * @param {boolean} bTargetsOnly if true, only return targetable objs
         * @return {DragDrop[]} the related instances
         * @static
         */
        getRelated: function(p_oDD, bTargetsOnly) {
            var oDDs = [];
            for (var i in p_oDD.groups) {
                for (var j in this.ids[i]) {
                    var dd = this.ids[i][j];
                    if (! this.isTypeOfDD(dd)) {
                        continue;
                    }
                    if (!bTargetsOnly || dd.isTarget) {
                        oDDs[oDDs.length] = dd;
                    }
                }
            }

            return oDDs;
        },

        /**
         * Returns true if the specified dd target is a legal target for 
         * the specifice drag obj
         * @method isLegalTarget
         * @param {DragDrop} the drag obj
         * @param {DragDrop} the target
         * @return {boolean} true if the target is a legal target for the 
         * dd obj
         * @static
         */
        isLegalTarget: function (oDD, oTargetDD) {
            var targets = this.getRelated(oDD, true);
            for (var i=0, len=targets.length;i<len;++i) {
                if (targets[i].id == oTargetDD.id) {
                    return true;
                }
            }

            return false;
        },

        /**
         * My goal is to be able to transparently determine if an object is
         * typeof DragDrop, and the exact subclass of DragDrop.  typeof 
         * returns "object", oDD.constructor.toString() always returns
         * "DragDrop" and not the name of the subclass.  So for now it just
         * evaluates a well-known variable in DragDrop.
         * @method isTypeOfDD
         * @param {Object} the object to evaluate
         * @return {boolean} true if typeof oDD = DragDrop
         * @static
         */
        isTypeOfDD: function (oDD) {
            return (oDD && oDD.__ygDragDrop);
        },

        /**
         * Utility function to determine if a given element has been 
         * registered as a drag drop handle for the given Drag Drop object.
         * @method isHandle
         * @param {String} id the element id to check
         * @return {boolean} true if this element is a DragDrop handle, false 
         * otherwise
         * @static
         */
        isHandle: function(sDDId, sHandleId) {
            return ( this.handleIds[sDDId] && 
                            this.handleIds[sDDId][sHandleId] );
        },

        /**
         * Returns the DragDrop instance for a given id
         * @method getDDById
         * @param {String} id the id of the DragDrop object
         * @return {DragDrop} the drag drop object, null if it is not found
         * @static
         */
        getDDById: function(id) {
            for (var i in this.ids) {
                if (this.ids[i][id]) {
                    return this.ids[i][id];
                }
            }
            return null;
        },

        /**
         * Fired after a registered DragDrop object gets the mousedown event.
         * Sets up the events required to track the object being dragged
         * @method handleMouseDown
         * @param {Event} e the event
         * @param oDD the DragDrop object being dragged
         * @private
         * @static
         */
        handleMouseDown: function(e, oDD) {
            //this._activateShim();

            this.currentTarget = YAHOO.util.Event.getTarget(e);

            this.dragCurrent = oDD;

            var el = oDD.getEl();

            // track start position
            this.startX = YAHOO.util.Event.getPageX(e);
            this.startY = YAHOO.util.Event.getPageY(e);

            this.deltaX = this.startX - el.offsetLeft;
            this.deltaY = this.startY - el.offsetTop;

            this.dragThreshMet = false;

            this.clickTimeout = setTimeout( 
                    function() { 
                        var DDM = YAHOO.util.DDM;
                        DDM.startDrag(DDM.startX, DDM.startY);
                        DDM.fromTimeout = true;
                    }, 
                    this.clickTimeThresh );
        },

        /**
         * Fired when either the drag pixel threshold or the mousedown hold 
         * time threshold has been met.
         * @method startDrag
         * @param x {int} the X position of the original mousedown
         * @param y {int} the Y position of the original mousedown
         * @static
         */
        startDrag: function(x, y) {
            if (this.dragCurrent && this.dragCurrent.useShim) {
                this._shimState = this.useShim;
                this.useShim = true;
            }
            this._activateShim();
            clearTimeout(this.clickTimeout);
            var dc = this.dragCurrent;
            if (dc && dc.events.b4StartDrag) {
                dc.b4StartDrag(x, y);
                dc.fireEvent('b4StartDragEvent', { x: x, y: y });
            }
            if (dc && dc.events.startDrag) {
                dc.startDrag(x, y);
                dc.fireEvent('startDragEvent', { x: x, y: y });
            }
            this.dragThreshMet = true;
        },

        /**
         * Internal function to handle the mouseup event.  Will be invoked 
         * from the context of the document.
         * @method handleMouseUp
         * @param {Event} e the event
         * @private
         * @static
         */
        handleMouseUp: function(e) {
            if (this.dragCurrent) {
                clearTimeout(this.clickTimeout);

                if (this.dragThreshMet) {
                    if (this.fromTimeout) {
                        this.fromTimeout = false;
                        this.handleMouseMove(e);
                    }
                    this.fromTimeout = false;
                    this.fireEvents(e, true);
                } else {
                }

                this.stopDrag(e);

                this.stopEvent(e);
            }
        },

        /**
         * Utility to stop event propagation and event default, if these 
         * features are turned on.
         * @method stopEvent
         * @param {Event} e the event as returned by this.getEvent()
         * @static
         */
        stopEvent: function(e) {
            if (this.stopPropagation) {
                YAHOO.util.Event.stopPropagation(e);
            }

            if (this.preventDefault) {
                YAHOO.util.Event.preventDefault(e);
            }
        },

        /** 
         * Ends the current drag, cleans up the state, and fires the endDrag
         * and mouseUp events.  Called internally when a mouseup is detected
         * during the drag.  Can be fired manually during the drag by passing
         * either another event (such as the mousemove event received in onDrag)
         * or a fake event with pageX and pageY defined (so that endDrag and
         * onMouseUp have usable position data.).  Alternatively, pass true
         * for the silent parameter so that the endDrag and onMouseUp events
         * are skipped (so no event data is needed.)
         *
         * @method stopDrag
         * @param {Event} e the mouseup event, another event (or a fake event) 
         *                  with pageX and pageY defined, or nothing if the 
         *                  silent parameter is true
         * @param {boolean} silent skips the enddrag and mouseup events if true
         * @static
         */
        stopDrag: function(e, silent) {
            var dc = this.dragCurrent;
            // Fire the drag end event for the item that was dragged
            if (dc && !silent) {
                if (this.dragThreshMet) {
                    if (dc.events.b4EndDrag) {
                        dc.b4EndDrag(e);
                        dc.fireEvent('b4EndDragEvent', { e: e });
                    }
                    if (dc.events.endDrag) {
                        dc.endDrag(e);
                        dc.fireEvent('endDragEvent', { e: e });
                    }
                }
                if (dc.events.mouseUp) {
                    dc.onMouseUp(e);
                    dc.fireEvent('mouseUpEvent', { e: e });
                }
            }

            if (this._shimActive) {
                this._deactivateShim();
                if (this.dragCurrent && this.dragCurrent.useShim) {
                    this.useShim = this._shimState;
                    this._shimState = false;
                }
            }

            this.dragCurrent = null;
            this.dragOvers = {};
        },

        /** 
         * Internal function to handle the mousemove event.  Will be invoked 
         * from the context of the html element.
         *
         * @TODO figure out what we can do about mouse events lost when the 
         * user drags objects beyond the window boundary.  Currently we can 
         * detect this in internet explorer by verifying that the mouse is 
         * down during the mousemove event.  Firefox doesn't give us the 
         * button state on the mousemove event.
         * @method handleMouseMove
         * @param {Event} e the event
         * @private
         * @static
         */
        handleMouseMove: function(e) {

            var dc = this.dragCurrent;
            if (dc) {

                // var button = e.which || e.button;

                // check for IE < 9 mouseup outside of page boundary
                if (YAHOO.env.ua.ie && (YAHOO.env.ua.ie < 9) && !e.button) {
                    this.stopEvent(e);
                    return this.handleMouseUp(e);
                } else {
                    if (e.clientX < 0 || e.clientY < 0) {
                        //This will stop the element from leaving the viewport in FF, Opera & Safari
                        //Not turned on yet
                        //this.stopEvent(e);
                        //return false;
                    }
                }

                if (!this.dragThreshMet) {
                    var diffX = Math.abs(this.startX - YAHOO.util.Event.getPageX(e));
                    var diffY = Math.abs(this.startY - YAHOO.util.Event.getPageY(e));
                    if (diffX > this.clickPixelThresh || 
                                diffY > this.clickPixelThresh) {
                        this.startDrag(this.startX, this.startY);
                    }
                }

                if (this.dragThreshMet) {
                    if (dc && dc.events.b4Drag) {
                        dc.b4Drag(e);
                        dc.fireEvent('b4DragEvent', { e: e});
                    }
                    if (dc && dc.events.drag) {
                        dc.onDrag(e);
                        dc.fireEvent('dragEvent', { e: e});
                    }
                    if (dc) {
                        this.fireEvents(e, false);
                    }
                }

                this.stopEvent(e);
            }
        },
        
        /**
         * Iterates over all of the DragDrop elements to find ones we are 
         * hovering over or dropping on
         * @method fireEvents
         * @param {Event} e the event
         * @param {boolean} isDrop is this a drop op or a mouseover op?
         * @private
         * @static
         */
        fireEvents: function(e, isDrop) {
            var dc = this.dragCurrent;

            // If the user did the mouse up outside of the window, we could 
            // get here even though we have ended the drag.
            // If the config option dragOnly is true, bail out and don't fire the events
            if (!dc || dc.isLocked() || dc.dragOnly) {
                return;
            }

            var x = YAHOO.util.Event.getPageX(e),
                y = YAHOO.util.Event.getPageY(e),
                pt = new YAHOO.util.Point(x,y),
                pos = dc.getTargetCoord(pt.x, pt.y),
                el = dc.getDragEl(),
                events = ['out', 'over', 'drop', 'enter'],
                curRegion = new YAHOO.util.Region( pos.y, 
                                               pos.x + el.offsetWidth,
                                               pos.y + el.offsetHeight, 
                                               pos.x ),
            
                oldOvers = [], // cache the previous dragOver array
                inGroupsObj  = {},
                b4Results = {},
                inGroups  = [],
                data = {
                    outEvts: [],
                    overEvts: [],
                    dropEvts: [],
                    enterEvts: []
                };


            // Check to see if the object(s) we were hovering over is no longer 
            // being hovered over so we can fire the onDragOut event
            for (var i in this.dragOvers) {

                var ddo = this.dragOvers[i];

                if (! this.isTypeOfDD(ddo)) {
                    continue;
                }
                if (! this.isOverTarget(pt, ddo, this.mode, curRegion)) {
                    data.outEvts.push( ddo );
                }

                oldOvers[i] = true;
                delete this.dragOvers[i];
            }

            for (var sGroup in dc.groups) {
                
                if ("string" != typeof sGroup) {
                    continue;
                }

                for (i in this.ids[sGroup]) {
                    var oDD = this.ids[sGroup][i];
                    if (! this.isTypeOfDD(oDD)) {
                        continue;
                    }

                    if (oDD.isTarget && !oDD.isLocked() && oDD != dc) {
                        if (this.isOverTarget(pt, oDD, this.mode, curRegion)) {
                            inGroupsObj[sGroup] = true;
                            // look for drop interactions
                            if (isDrop) {
                                data.dropEvts.push( oDD );
                            // look for drag enter and drag over interactions
                            } else {

                                // initial drag over: dragEnter fires
                                if (!oldOvers[oDD.id]) {
                                    data.enterEvts.push( oDD );
                                // subsequent drag overs: dragOver fires
                                } else {
                                    data.overEvts.push( oDD );
                                }

                                this.dragOvers[oDD.id] = oDD;
                            }
                        }
                    }
                }
            }

            this.interactionInfo = {
                out:       data.outEvts,
                enter:     data.enterEvts,
                over:      data.overEvts,
                drop:      data.dropEvts,
                point:     pt,
                draggedRegion:    curRegion,
                sourceRegion: this.locationCache[dc.id],
                validDrop: isDrop
            };

            
            for (var inG in inGroupsObj) {
                inGroups.push(inG);
            }

            // notify about a drop that did not find a target
            if (isDrop && !data.dropEvts.length) {
                this.interactionInfo.validDrop = false;
                if (dc.events.invalidDrop) {
                    dc.onInvalidDrop(e);
                    dc.fireEvent('invalidDropEvent', { e: e });
                }
            }
            for (i = 0; i < events.length; i++) {
                var tmp = null;
                if (data[events[i] + 'Evts']) {
                    tmp = data[events[i] + 'Evts'];
                }
                if (tmp && tmp.length) {
                    var type = events[i].charAt(0).toUpperCase() + events[i].substr(1),
                        ev = 'onDrag' + type,
                        b4 = 'b4Drag' + type,
                        cev = 'drag' + type + 'Event',
                        check = 'drag' + type;
                    if (this.mode) {
                        if (dc.events[b4]) {
                            dc[b4](e, tmp, inGroups);
                            b4Results[ev] = dc.fireEvent(b4 + 'Event', { event: e, info: tmp, group: inGroups });
                            
                        }
                        if (dc.events[check] && (b4Results[ev] !== false)) {
                            dc[ev](e, tmp, inGroups);
                            dc.fireEvent(cev, { event: e, info: tmp, group: inGroups });
                        }
                    } else {
                        for (var b = 0, len = tmp.length; b < len; ++b) {
                            if (dc.events[b4]) {
                                dc[b4](e, tmp[b].id, inGroups[0]);
                                b4Results[ev] = dc.fireEvent(b4 + 'Event', { event: e, info: tmp[b].id, group: inGroups[0] });
                            }
                            if (dc.events[check] && (b4Results[ev] !== false)) {
                                dc[ev](e, tmp[b].id, inGroups[0]);
                                dc.fireEvent(cev, { event: e, info: tmp[b].id, group: inGroups[0] });
                            }
                        }
                    }
                }
            }
        },

        /**
         * Helper function for getting the best match from the list of drag 
         * and drop objects returned by the drag and drop events when we are 
         * in INTERSECT mode.  It returns either the first object that the 
         * cursor is over, or the object that has the greatest overlap with 
         * the dragged element.
         * @method getBestMatch
         * @param  {DragDrop[]} dds The array of drag and drop objects 
         * targeted
         * @return {DragDrop}       The best single match
         * @static
         */
        getBestMatch: function(dds) {
            var winner = null;

            var len = dds.length;

            if (len == 1) {
                winner = dds[0];
            } else {
                // Loop through the targeted items
                for (var i=0; i<len; ++i) {
                    var dd = dds[i];
                    // If the cursor is over the object, it wins.  If the 
                    // cursor is over multiple matches, the first one we come
                    // to wins.
                    if (this.mode == this.INTERSECT && dd.cursorIsOver) {
                        winner = dd;
                        break;
                    // Otherwise the object with the most overlap wins
                    } else {
                        if (!winner || !winner.overlap || (dd.overlap &&
                            winner.overlap.getArea() < dd.overlap.getArea())) {
                            winner = dd;
                        }
                    }
                }
            }

            return winner;
        },

        /**
         * Refreshes the cache of the top-left and bottom-right points of the 
         * drag and drop objects in the specified group(s).  This is in the
         * format that is stored in the drag and drop instance, so typical 
         * usage is:
         * <code>
         * YAHOO.util.DragDropMgr.refreshCache(ddinstance.groups);
         * </code>
         * Alternatively:
         * <code>
         * YAHOO.util.DragDropMgr.refreshCache({group1:true, group2:true});
         * </code>
         * @TODO this really should be an indexed array.  Alternatively this
         * method could accept both.
         * @method refreshCache
         * @param {Object} groups an associative array of groups to refresh
         * @static
         */
        refreshCache: function(groups) {

            // refresh everything if group array is not provided
            var g = groups || this.ids;

            for (var sGroup in g) {
                if ("string" != typeof sGroup) {
                    continue;
                }
                for (var i in this.ids[sGroup]) {
                    var oDD = this.ids[sGroup][i];

                    if (this.isTypeOfDD(oDD)) {
                        var loc = this.getLocation(oDD);
                        if (loc) {
                            this.locationCache[oDD.id] = loc;
                        } else {
                            delete this.locationCache[oDD.id];
                        }
                    }
                }
            }
        },

        /**
         * This checks to make sure an element exists and is in the DOM.  The
         * main purpose is to handle cases where innerHTML is used to remove
         * drag and drop objects from the DOM.  IE provides an 'unspecified
         * error' when trying to access the offsetParent of such an element
         * @method verifyEl
         * @param {HTMLElement} el the element to check
         * @return {boolean} true if the element looks usable
         * @static
         */
        verifyEl: function(el) {
            try {
                if (el) {
                    var parent = el.offsetParent;
                    if (parent) {
                        return true;
                    }
                }
            } catch(e) {
            }

            return false;
        },
        
        /**
         * Returns a Region object containing the drag and drop element's position
         * and size, including the padding configured for it
         * @method getLocation
         * @param {DragDrop} oDD the drag and drop object to get the 
         *                       location for
         * @return {YAHOO.util.Region} a Region object representing the total area
         *                             the element occupies, including any padding
         *                             the instance is configured for.
         * @static
         */
        getLocation: function(oDD) {
            if (! this.isTypeOfDD(oDD)) {
                return null;
            }

            var el = oDD.getEl(), pos, x1, x2, y1, y2, t, r, b, l;

            try {
                pos= YAHOO.util.Dom.getXY(el);
            } catch (e) { }

            if (!pos) {
                return null;
            }

            x1 = pos[0];
            x2 = x1 + el.offsetWidth;
            y1 = pos[1];
            y2 = y1 + el.offsetHeight;

            t = y1 - oDD.padding[0];
            r = x2 + oDD.padding[1];
            b = y2 + oDD.padding[2];
            l = x1 - oDD.padding[3];

            return new YAHOO.util.Region( t, r, b, l );
        },

        /**
         * Checks the cursor location to see if it over the target
         * @method isOverTarget
         * @param {YAHOO.util.Point} pt The point to evaluate
         * @param {DragDrop} oTarget the DragDrop object we are inspecting
         * @param {boolean} intersect true if we are in intersect mode
         * @param {YAHOO.util.Region} pre-cached location of the dragged element
         * @return {boolean} true if the mouse is over the target
         * @private
         * @static
         */
        isOverTarget: function(pt, oTarget, intersect, curRegion) {
            // use cache if available
            var loc = this.locationCache[oTarget.id];
            if (!loc || !this.useCache) {
                loc = this.getLocation(oTarget);
                this.locationCache[oTarget.id] = loc;

            }

            if (!loc) {
                return false;
            }

            oTarget.cursorIsOver = loc.contains( pt );

            // DragDrop is using this as a sanity check for the initial mousedown
            // in this case we are done.  In POINT mode, if the drag obj has no
            // contraints, we are done. Otherwise we need to evaluate the 
            // region the target as occupies to determine if the dragged element
            // overlaps with it.
            
            var dc = this.dragCurrent;
            if (!dc || (!intersect && !dc.constrainX && !dc.constrainY)) {

                //if (oTarget.cursorIsOver) {
                //}
                return oTarget.cursorIsOver;
            }

            oTarget.overlap = null;


            // Get the current location of the drag element, this is the
            // location of the mouse event less the delta that represents
            // where the original mousedown happened on the element.  We
            // need to consider constraints and ticks as well.

            if (!curRegion) {
                var pos = dc.getTargetCoord(pt.x, pt.y);
                var el = dc.getDragEl();
                curRegion = new YAHOO.util.Region( pos.y, 
                                                   pos.x + el.offsetWidth,
                                                   pos.y + el.offsetHeight, 
                                                   pos.x );
            }

            var overlap = curRegion.intersect(loc);

            if (overlap) {
                oTarget.overlap = overlap;
                return (intersect) ? true : oTarget.cursorIsOver;
            } else {
                return false;
            }
        },

        /**
         * unload event handler
         * @method _onUnload
         * @private
         * @static
         */
        _onUnload: function(e, me) {
            this.unregAll();
        },

        /**
         * Cleans up the drag and drop events and objects.
         * @method unregAll
         * @private
         * @static
         */
        unregAll: function() {

            if (this.dragCurrent) {
                this.stopDrag();
                this.dragCurrent = null;
            }

            this._execOnAll("unreg", []);

            //for (var i in this.elementCache) {
                //delete this.elementCache[i];
            //}
            //this.elementCache = {};

            this.ids = {};
        },

        /**
         * A cache of DOM elements
         * @property elementCache
         * @private
         * @static
         * @deprecated elements are not cached now
         */
        elementCache: {},
        
        /**
         * Get the wrapper for the DOM element specified
         * @method getElWrapper
         * @param {String} id the id of the element to get
         * @return {YAHOO.util.DDM.ElementWrapper} the wrapped element
         * @private
         * @deprecated This wrapper isn't that useful
         * @static
         */
        getElWrapper: function(id) {
            var oWrapper = this.elementCache[id];
            if (!oWrapper || !oWrapper.el) {
                oWrapper = this.elementCache[id] = 
                    new this.ElementWrapper(YAHOO.util.Dom.get(id));
            }
            return oWrapper;
        },

        /**
         * Returns the actual DOM element
         * @method getElement
         * @param {String} id the id of the elment to get
         * @return {Object} The element
         * @deprecated use YAHOO.util.Dom.get instead
         * @static
         */
        getElement: function(id) {
            return YAHOO.util.Dom.get(id);
        },
        
        /**
         * Returns the style property for the DOM element (i.e., 
         * document.getElById(id).style)
         * @method getCss
         * @param {String} id the id of the elment to get
         * @return {Object} The style property of the element
         * @deprecated use YAHOO.util.Dom instead
         * @static
         */
        getCss: function(id) {
            var el = YAHOO.util.Dom.get(id);
            return (el) ? el.style : null;
        },

        /**
         * Inner class for cached elements
         * @class DragDropMgr.ElementWrapper
         * @for DragDropMgr
         * @private
         * @deprecated
         */
        ElementWrapper: function(el) {
                /**
                 * The element
                 * @property el
                 */
                this.el = el || null;
                /**
                 * The element id
                 * @property id
                 */
                this.id = this.el && el.id;
                /**
                 * A reference to the style property
                 * @property css
                 */
                this.css = this.el && el.style;
            },

        /**
         * Returns the X position of an html element
         * @method getPosX
         * @param el the element for which to get the position
         * @return {int} the X coordinate
         * @for DragDropMgr
         * @deprecated use YAHOO.util.Dom.getX instead
         * @static
         */
        getPosX: function(el) {
            return YAHOO.util.Dom.getX(el);
        },

        /**
         * Returns the Y position of an html element
         * @method getPosY
         * @param el the element for which to get the position
         * @return {int} the Y coordinate
         * @deprecated use YAHOO.util.Dom.getY instead
         * @static
         */
        getPosY: function(el) {
            return YAHOO.util.Dom.getY(el); 
        },

        /**
         * Swap two nodes.  In IE, we use the native method, for others we 
         * emulate the IE behavior
         * @method swapNode
         * @param n1 the first node to swap
         * @param n2 the other node to swap
         * @static
         */
        swapNode: function(n1, n2) {
            if (n1.swapNode) {
                n1.swapNode(n2);
            } else {
                var p = n2.parentNode;
                var s = n2.nextSibling;

                if (s == n1) {
                    p.insertBefore(n1, n2);
                } else if (n2 == n1.nextSibling) {
                    p.insertBefore(n2, n1);
                } else {
                    n1.parentNode.replaceChild(n2, n1);
                    p.insertBefore(n1, s);
                }
            }
        },

        /**
         * Returns the current scroll position
         * @method getScroll
         * @private
         * @static
         */
        getScroll: function () {
            var t, l, dde=document.documentElement, db=document.body;
            if (dde && (dde.scrollTop || dde.scrollLeft)) {
                t = dde.scrollTop;
                l = dde.scrollLeft;
            } else if (db) {
                t = db.scrollTop;
                l = db.scrollLeft;
            } else {
            }
            return { top: t, left: l };
        },

        /**
         * Returns the specified element style property
         * @method getStyle
         * @param {HTMLElement} el          the element
         * @param {string}      styleProp   the style property
         * @return {string} The value of the style property
         * @deprecated use YAHOO.util.Dom.getStyle
         * @static
         */
        getStyle: function(el, styleProp) {
            return YAHOO.util.Dom.getStyle(el, styleProp);
        },

        /**
         * Gets the scrollTop
         * @method getScrollTop
         * @return {int} the document's scrollTop
         * @static
         */
        getScrollTop: function () { return this.getScroll().top; },

        /**
         * Gets the scrollLeft
         * @method getScrollLeft
         * @return {int} the document's scrollTop
         * @static
         */
        getScrollLeft: function () { return this.getScroll().left; },

        /**
         * Sets the x/y position of an element to the location of the
         * target element.
         * @method moveToEl
         * @param {HTMLElement} moveEl      The element to move
         * @param {HTMLElement} targetEl    The position reference element
         * @static
         */
        moveToEl: function (moveEl, targetEl) {
            var aCoord = YAHOO.util.Dom.getXY(targetEl);
            YAHOO.util.Dom.setXY(moveEl, aCoord);
        },

        /**
         * Gets the client height
         * @method getClientHeight
         * @return {int} client height in px
         * @deprecated use YAHOO.util.Dom.getViewportHeight instead
         * @static
         */
        getClientHeight: function() {
            return YAHOO.util.Dom.getViewportHeight();
        },

        /**
         * Gets the client width
         * @method getClientWidth
         * @return {int} client width in px
         * @deprecated use YAHOO.util.Dom.getViewportWidth instead
         * @static
         */
        getClientWidth: function() {
            return YAHOO.util.Dom.getViewportWidth();
        },

        /**
         * Numeric array sort function
         * @method numericSort
         * @static
         */
        numericSort: function(a, b) { return (a - b); },

        /**
         * Internal counter
         * @property _timeoutCount
         * @private
         * @static
         */
        _timeoutCount: 0,

        /**
         * Trying to make the load order less important.  Without this we get
         * an error if this file is loaded before the Event Utility.
         * @method _addListeners
         * @private
         * @static
         */
        _addListeners: function() {
            var DDM = YAHOO.util.DDM;
            if ( YAHOO.util.Event && document ) {
                DDM._onLoad();
            } else {
                if (DDM._timeoutCount > 2000) {
                } else {
                    setTimeout(DDM._addListeners, 10);
                    if (document && document.body) {
                        DDM._timeoutCount += 1;
                    }
                }
            }
        },

        /**
         * Recursively searches the immediate parent and all child nodes for 
         * the handle element in order to determine wheter or not it was 
         * clicked.
         * @method handleWasClicked
         * @param node the html element to inspect
         * @static
         */
        handleWasClicked: function(node, id) {
            if (this.isHandle(id, node.id)) {
                return true;
            } else {
                // check to see if this is a text node child of the one we want
                var p = node.parentNode;

                while (p) {
                    if (this.isHandle(id, p.id)) {
                        return true;
                    } else {
                        p = p.parentNode;
                    }
                }
            }

            return false;
        }

    };

}();

// shorter alias, save a few bytes
YAHOO.util.DDM = YAHOO.util.DragDropMgr;
YAHOO.util.DDM._addListeners();

}

(function() {

var Event=YAHOO.util.Event; 
var Dom=YAHOO.util.Dom;

/**
 * Defines the interface and base operation of items that that can be 
 * dragged or can be drop targets.  It was designed to be extended, overriding
 * the event handlers for startDrag, onDrag, onDragOver, onDragOut.
 * Up to three html elements can be associated with a DragDrop instance:
 * <ul>
 * <li>linked element: the element that is passed into the constructor.
 * This is the element which defines the boundaries for interaction with 
 * other DragDrop objects.</li>
 * <li>handle element(s): The drag operation only occurs if the element that 
 * was clicked matches a handle element.  By default this is the linked 
 * element, but there are times that you will want only a portion of the 
 * linked element to initiate the drag operation, and the setHandleElId() 
 * method provides a way to define this.</li>
 * <li>drag element: this represents an the element that would be moved along
 * with the cursor during a drag operation.  By default, this is the linked
 * element itself as in {@link YAHOO.util.DD}.  setDragElId() lets you define
 * a separate element that would be moved, as in {@link YAHOO.util.DDProxy}
 * </li>
 * </ul>
 * This class should not be instantiated until the onload event to ensure that
 * the associated elements are available.
 * The following would define a DragDrop obj that would interact with any 
 * other DragDrop obj in the "group1" group:
 * <pre>
 *  dd = new YAHOO.util.DragDrop("div1", "group1");
 * </pre>
 * Since none of the event handlers have been implemented, nothing would 
 * actually happen if you were to run the code above.  Normally you would 
 * override this class or one of the default implementations, but you can 
 * also override the methods you want on an instance of the class...
 * <pre>
 *  dd.onDragDrop = function(e, id) {
 *  &nbsp;&nbsp;alert("dd was dropped on " + id);
 *  }
 * </pre>
 * @namespace YAHOO.util
 * @class DragDrop
 * @constructor
 * @param {String} id of the element that is linked to this instance
 * @param {String} sGroup the group of related DragDrop objects
 * @param {object} config an object containing configurable attributes
 *                Valid properties for DragDrop: 
 *                    padding, isTarget, maintainOffset, primaryButtonOnly,
 */
YAHOO.util.DragDrop = function(id, sGroup, config) {
    if (id) {
        this.init(id, sGroup, config); 
    }
};

YAHOO.util.DragDrop.prototype = {
    /**
     * An Object Literal containing the events that we will be using: mouseDown, b4MouseDown, mouseUp, b4StartDrag, startDrag, b4EndDrag, endDrag, mouseUp, drag, b4Drag, invalidDrop, b4DragOut, dragOut, dragEnter, b4DragOver, dragOver, b4DragDrop, dragDrop
     * By setting any of these to false, then event will not be fired.
     * @property events
     * @type object
     */
    events: null,
    /**
    * @method on
    * @description Shortcut for EventProvider.subscribe, see <a href="YAHOO.util.EventProvider.html#subscribe">YAHOO.util.EventProvider.subscribe</a>
    */
    on: function() {
        this.subscribe.apply(this, arguments);
    },
    /**
     * The id of the element associated with this object.  This is what we 
     * refer to as the "linked element" because the size and position of 
     * this element is used to determine when the drag and drop objects have 
     * interacted.
     * @property id
     * @type String
     */
    id: null,

    /**
     * Configuration attributes passed into the constructor
     * @property config
     * @type object
     */
    config: null,

    /**
     * The id of the element that will be dragged.  By default this is same 
     * as the linked element , but could be changed to another element. Ex: 
     * YAHOO.util.DDProxy
     * @property dragElId
     * @type String
     * @private
     */
    dragElId: null, 

    /**
     * the id of the element that initiates the drag operation.  By default 
     * this is the linked element, but could be changed to be a child of this
     * element.  This lets us do things like only starting the drag when the 
     * header element within the linked html element is clicked.
     * @property handleElId
     * @type String
     * @private
     */
    handleElId: null, 

    /**
     * An associative array of HTML tags that will be ignored if clicked.
     * @property invalidHandleTypes
     * @type {string: string}
     */
    invalidHandleTypes: null, 

    /**
     * An associative array of ids for elements that will be ignored if clicked
     * @property invalidHandleIds
     * @type {string: string}
     */
    invalidHandleIds: null, 

    /**
     * An indexted array of css class names for elements that will be ignored
     * if clicked.
     * @property invalidHandleClasses
     * @type string[]
     */
    invalidHandleClasses: null, 

    /**
     * The linked element's absolute X position at the time the drag was 
     * started
     * @property startPageX
     * @type int
     * @private
     */
    startPageX: 0,

    /**
     * The linked element's absolute X position at the time the drag was 
     * started
     * @property startPageY
     * @type int
     * @private
     */
    startPageY: 0,

    /**
     * The group defines a logical collection of DragDrop objects that are 
     * related.  Instances only get events when interacting with other 
     * DragDrop object in the same group.  This lets us define multiple 
     * groups using a single DragDrop subclass if we want.
     * @property groups
     * @type {string: string}
     */
    groups: null,

    /**
     * Individual drag/drop instances can be locked.  This will prevent 
     * onmousedown start drag.
     * @property locked
     * @type boolean
     * @private
     */
    locked: false,

    /**
     * Lock this instance
     * @method lock
     */
    lock: function() { this.locked = true; },

    /**
     * Unlock this instace
     * @method unlock
     */
    unlock: function() { this.locked = false; },

    /**
     * By default, all instances can be a drop target.  This can be disabled by
     * setting isTarget to false.
     * @property isTarget
     * @type boolean
     */
    isTarget: true,

    /**
     * The padding configured for this drag and drop object for calculating
     * the drop zone intersection with this object.
     * @property padding
     * @type int[]
     */
    padding: null,
    /**
     * If this flag is true, do not fire drop events. The element is a drag only element (for movement not dropping)
     * @property dragOnly
     * @type Boolean
     */
    dragOnly: false,

    /**
     * If this flag is true, a shim will be placed over the screen/viewable area to track mouse events. Should help with dragging elements over iframes and other controls.
     * @property useShim
     * @type Boolean
     */
    useShim: false,

    /**
     * Cached reference to the linked element
     * @property _domRef
     * @private
     */
    _domRef: null,

    /**
     * Internal typeof flag
     * @property __ygDragDrop
     * @private
     */
    __ygDragDrop: true,

    /**
     * Set to true when horizontal contraints are applied
     * @property constrainX
     * @type boolean
     * @private
     */
    constrainX: false,

    /**
     * Set to true when vertical contraints are applied
     * @property constrainY
     * @type boolean
     * @private
     */
    constrainY: false,

    /**
     * The left constraint
     * @property minX
     * @type int
     * @private
     */
    minX: 0,

    /**
     * The right constraint
     * @property maxX
     * @type int
     * @private
     */
    maxX: 0,

    /**
     * The up constraint 
     * @property minY
     * @type int
     * @type int
     * @private
     */
    minY: 0,

    /**
     * The down constraint 
     * @property maxY
     * @type int
     * @private
     */
    maxY: 0,

    /**
     * The difference between the click position and the source element's location
     * @property deltaX
     * @type int
     * @private
     */
    deltaX: 0,

    /**
     * The difference between the click position and the source element's location
     * @property deltaY
     * @type int
     * @private
     */
    deltaY: 0,

    /**
     * Maintain offsets when we resetconstraints.  Set to true when you want
     * the position of the element relative to its parent to stay the same
     * when the page changes
     *
     * @property maintainOffset
     * @type boolean
     */
    maintainOffset: false,

    /**
     * Array of pixel locations the element will snap to if we specified a 
     * horizontal graduation/interval.  This array is generated automatically
     * when you define a tick interval.
     * @property xTicks
     * @type int[]
     */
    xTicks: null,

    /**
     * Array of pixel locations the element will snap to if we specified a 
     * vertical graduation/interval.  This array is generated automatically 
     * when you define a tick interval.
     * @property yTicks
     * @type int[]
     */
    yTicks: null,

    /**
     * By default the drag and drop instance will only respond to the primary
     * button click (left button for a right-handed mouse).  Set to true to
     * allow drag and drop to start with any mouse click that is propogated
     * by the browser
     * @property primaryButtonOnly
     * @type boolean
     */
    primaryButtonOnly: true,

    /**
     * The availabe property is false until the linked dom element is accessible.
     * @property available
     * @type boolean
     */
    available: false,

    /**
     * By default, drags can only be initiated if the mousedown occurs in the
     * region the linked element is.  This is done in part to work around a
     * bug in some browsers that mis-report the mousedown if the previous
     * mouseup happened outside of the window.  This property is set to true
     * if outer handles are defined.
     *
     * @property hasOuterHandles
     * @type boolean
     * @default false
     */
    hasOuterHandles: false,

    /**
     * Property that is assigned to a drag and drop object when testing to
     * see if it is being targeted by another dd object.  This property
     * can be used in intersect mode to help determine the focus of
     * the mouse interaction.  DDM.getBestMatch uses this property first to
     * determine the closest match in INTERSECT mode when multiple targets
     * are part of the same interaction.
     * @property cursorIsOver
     * @type boolean
     */
    cursorIsOver: false,

    /**
     * Property that is assigned to a drag and drop object when testing to
     * see if it is being targeted by another dd object.  This is a region
     * that represents the area the draggable element overlaps this target.
     * DDM.getBestMatch uses this property to compare the size of the overlap
     * to that of other targets in order to determine the closest match in
     * INTERSECT mode when multiple targets are part of the same interaction.
     * @property overlap 
     * @type YAHOO.util.Region
     */
    overlap: null,

    /**
     * Code that executes immediately before the startDrag event
     * @method b4StartDrag
     * @private
     */
    b4StartDrag: function(x, y) { },

    /**
     * Abstract method called after a drag/drop object is clicked
     * and the drag or mousedown time thresholds have beeen met.
     * @method startDrag
     * @param {int} X click location
     * @param {int} Y click location
     */
    startDrag: function(x, y) { /* override this */ },

    /**
     * Code that executes immediately before the onDrag event
     * @method b4Drag
     * @private
     */
    b4Drag: function(e) { },

    /**
     * Abstract method called during the onMouseMove event while dragging an 
     * object.
     * @method onDrag
     * @param {Event} e the mousemove event
     */
    onDrag: function(e) { /* override this */ },

    /**
     * Abstract method called when this element fist begins hovering over 
     * another DragDrop obj
     * @method onDragEnter
     * @param {Event} e the mousemove event
     * @param {String|DragDrop[]} id In POINT mode, the element
     * id this is hovering over.  In INTERSECT mode, an array of one or more 
     * dragdrop items being hovered over.
     */
    onDragEnter: function(e, id) { /* override this */ },

    /**
     * Code that executes immediately before the onDragOver event
     * @method b4DragOver
     * @private
     */
    b4DragOver: function(e) { },

    /**
     * Abstract method called when this element is hovering over another 
     * DragDrop obj
     * @method onDragOver
     * @param {Event} e the mousemove event
     * @param {String|DragDrop[]} id In POINT mode, the element
     * id this is hovering over.  In INTERSECT mode, an array of dd items 
     * being hovered over.
     */
    onDragOver: function(e, id) { /* override this */ },

    /**
     * Code that executes immediately before the onDragOut event
     * @method b4DragOut
     * @private
     */
    b4DragOut: function(e) { },

    /**
     * Abstract method called when we are no longer hovering over an element
     * @method onDragOut
     * @param {Event} e the mousemove event
     * @param {String|DragDrop[]} id In POINT mode, the element
     * id this was hovering over.  In INTERSECT mode, an array of dd items 
     * that the mouse is no longer over.
     */
    onDragOut: function(e, id) { /* override this */ },

    /**
     * Code that executes immediately before the onDragDrop event
     * @method b4DragDrop
     * @private
     */
    b4DragDrop: function(e) { },

    /**
     * Abstract method called when this item is dropped on another DragDrop 
     * obj
     * @method onDragDrop
     * @param {Event} e the mouseup event
     * @param {String|DragDrop[]} id In POINT mode, the element
     * id this was dropped on.  In INTERSECT mode, an array of dd items this 
     * was dropped on.
     */
    onDragDrop: function(e, id) { /* override this */ },

    /**
     * Abstract method called when this item is dropped on an area with no
     * drop target
     * @method onInvalidDrop
     * @param {Event} e the mouseup event
     */
    onInvalidDrop: function(e) { /* override this */ },

    /**
     * Code that executes immediately before the endDrag event
     * @method b4EndDrag
     * @private
     */
    b4EndDrag: function(e) { },

    /**
     * Fired when we are done dragging the object
     * @method endDrag
     * @param {Event} e the mouseup event
     */
    endDrag: function(e) { /* override this */ },

    /**
     * Code executed immediately before the onMouseDown event
     * @method b4MouseDown
     * @param {Event} e the mousedown event
     * @private
     */
    b4MouseDown: function(e) {  },

    /**
     * Event handler that fires when a drag/drop obj gets a mousedown
     * @method onMouseDown
     * @param {Event} e the mousedown event
     */
    onMouseDown: function(e) { /* override this */ },

    /**
     * Event handler that fires when a drag/drop obj gets a mouseup
     * @method onMouseUp
     * @param {Event} e the mouseup event
     */
    onMouseUp: function(e) { /* override this */ },
   
    /**
     * Override the onAvailable method to do what is needed after the initial
     * position was determined.
     * @method onAvailable
     */
    onAvailable: function () { 
    },

    /**
     * Returns a reference to the linked element
     * @method getEl
     * @return {HTMLElement} the html element 
     */
    getEl: function() { 
        if (!this._domRef) {
            this._domRef = Dom.get(this.id); 
        }

        return this._domRef;
    },

    /**
     * Returns a reference to the actual element to drag.  By default this is
     * the same as the html element, but it can be assigned to another 
     * element. An example of this can be found in YAHOO.util.DDProxy
     * @method getDragEl
     * @return {HTMLElement} the html element 
     */
    getDragEl: function() {
        return Dom.get(this.dragElId);
    },

    /**
     * Sets up the DragDrop object.  Must be called in the constructor of any
     * YAHOO.util.DragDrop subclass
     * @method init
     * @param id the id of the linked element
     * @param {String} sGroup the group of related items
     * @param {object} config configuration attributes
     */
    init: function(id, sGroup, config) {
        this.initTarget(id, sGroup, config);
        Event.on(this._domRef || this.id, "mousedown", 
                        this.handleMouseDown, this, true);

        // Event.on(this.id, "selectstart", Event.preventDefault);
        for (var i in this.events) {
            this.createEvent(i + 'Event');
        }
        
    },

    /**
     * Initializes Targeting functionality only... the object does not
     * get a mousedown handler.
     * @method initTarget
     * @param id the id of the linked element
     * @param {String} sGroup the group of related items
     * @param {object} config configuration attributes
     */
    initTarget: function(id, sGroup, config) {

        // configuration attributes 
        this.config = config || {};

        this.events = {};

        // create a local reference to the drag and drop manager
        this.DDM = YAHOO.util.DDM;

        // initialize the groups object
        this.groups = {};

        // assume that we have an element reference instead of an id if the
        // parameter is not a string
        if (typeof id !== "string") {
            this._domRef = id;
            id = Dom.generateId(id);
        }

        // set the id
        this.id = id;

        // add to an interaction group
        this.addToGroup((sGroup) ? sGroup : "default");

        // We don't want to register this as the handle with the manager
        // so we just set the id rather than calling the setter.
        this.handleElId = id;

        Event.onAvailable(id, this.handleOnAvailable, this, true);


        // the linked element is the element that gets dragged by default
        this.setDragElId(id); 

        // by default, clicked anchors will not start drag operations. 
        // @TODO what else should be here?  Probably form fields.
        this.invalidHandleTypes = { A: "A" };
        this.invalidHandleIds = {};
        this.invalidHandleClasses = [];

        this.applyConfig();
    },

    /**
     * Applies the configuration parameters that were passed into the constructor.
     * This is supposed to happen at each level through the inheritance chain.  So
     * a DDProxy implentation will execute apply config on DDProxy, DD, and 
     * DragDrop in order to get all of the parameters that are available in
     * each object.
     * @method applyConfig
     */
    applyConfig: function() {
        this.events = {
            mouseDown: true,
            b4MouseDown: true,
            mouseUp: true,
            b4StartDrag: true,
            startDrag: true,
            b4EndDrag: true,
            endDrag: true,
            drag: true,
            b4Drag: true,
            invalidDrop: true,
            b4DragOut: true,
            dragOut: true,
            dragEnter: true,
            b4DragOver: true,
            dragOver: true,
            b4DragDrop: true,
            dragDrop: true
        };
        
        if (this.config.events) {
            for (var i in this.config.events) {
                if (this.config.events[i] === false) {
                    this.events[i] = false;
                }
            }
        }


        // configurable properties: 
        //    padding, isTarget, maintainOffset, primaryButtonOnly
        this.padding           = this.config.padding || [0, 0, 0, 0];
        this.isTarget          = (this.config.isTarget !== false);
        this.maintainOffset    = (this.config.maintainOffset);
        this.primaryButtonOnly = (this.config.primaryButtonOnly !== false);
        this.dragOnly = ((this.config.dragOnly === true) ? true : false);
        this.useShim = ((this.config.useShim === true) ? true : false);
    },

    /**
     * Executed when the linked element is available
     * @method handleOnAvailable
     * @private
     */
    handleOnAvailable: function() {
        this.available = true;
        this.resetConstraints();
        this.onAvailable();
    },

     /**
     * Configures the padding for the target zone in px.  Effectively expands
     * (or reduces) the virtual object size for targeting calculations.  
     * Supports css-style shorthand; if only one parameter is passed, all sides
     * will have that padding, and if only two are passed, the top and bottom
     * will have the first param, the left and right the second.
     * @method setPadding
     * @param {int} iTop    Top pad
     * @param {int} iRight  Right pad
     * @param {int} iBot    Bot pad
     * @param {int} iLeft   Left pad
     */
    setPadding: function(iTop, iRight, iBot, iLeft) {
        // this.padding = [iLeft, iRight, iTop, iBot];
        if (!iRight && 0 !== iRight) {
            this.padding = [iTop, iTop, iTop, iTop];
        } else if (!iBot && 0 !== iBot) {
            this.padding = [iTop, iRight, iTop, iRight];
        } else {
            this.padding = [iTop, iRight, iBot, iLeft];
        }
    },

    /**
     * Stores the initial placement of the linked element.
     * @method setInitialPosition
     * @param {int} diffX   the X offset, default 0
     * @param {int} diffY   the Y offset, default 0
     * @private
     */
    setInitPosition: function(diffX, diffY) {
        var el = this.getEl();

        if (!this.DDM.verifyEl(el)) {
            if (el && el.style && (el.style.display == 'none')) {
            } else {
            }
            return;
        }

        var dx = diffX || 0;
        var dy = diffY || 0;

        var p = Dom.getXY( el );

        this.initPageX = p[0] - dx;
        this.initPageY = p[1] - dy;

        this.lastPageX = p[0];
        this.lastPageY = p[1];



        this.setStartPosition(p);
    },

    /**
     * Sets the start position of the element.  This is set when the obj
     * is initialized, the reset when a drag is started.
     * @method setStartPosition
     * @param pos current position (from previous lookup)
     * @private
     */
    setStartPosition: function(pos) {
        var p = pos || Dom.getXY(this.getEl());

        this.deltaSetXY = null;

        this.startPageX = p[0];
        this.startPageY = p[1];
    },

    /**
     * Add this instance to a group of related drag/drop objects.  All 
     * instances belong to at least one group, and can belong to as many 
     * groups as needed.
     * @method addToGroup
     * @param sGroup {string} the name of the group
     */
    addToGroup: function(sGroup) {
        this.groups[sGroup] = true;
        this.DDM.regDragDrop(this, sGroup);
    },

    /**
     * Remove's this instance from the supplied interaction group
     * @method removeFromGroup
     * @param {string}  sGroup  The group to drop
     */
    removeFromGroup: function(sGroup) {
        if (this.groups[sGroup]) {
            delete this.groups[sGroup];
        }

        this.DDM.removeDDFromGroup(this, sGroup);
    },

    /**
     * Allows you to specify that an element other than the linked element 
     * will be moved with the cursor during a drag
     * @method setDragElId
     * @param id {string} the id of the element that will be used to initiate the drag
     */
    setDragElId: function(id) {
        this.dragElId = id;
    },

    /**
     * Allows you to specify a child of the linked element that should be 
     * used to initiate the drag operation.  An example of this would be if 
     * you have a content div with text and links.  Clicking anywhere in the 
     * content area would normally start the drag operation.  Use this method
     * to specify that an element inside of the content div is the element 
     * that starts the drag operation.
     * @method setHandleElId
     * @param id {string} the id of the element that will be used to 
     * initiate the drag.
     */
    setHandleElId: function(id) {
        if (typeof id !== "string") {
            id = Dom.generateId(id);
        }
        this.handleElId = id;
        this.DDM.regHandle(this.id, id);
    },

    /**
     * Allows you to set an element outside of the linked element as a drag 
     * handle
     * @method setOuterHandleElId
     * @param id the id of the element that will be used to initiate the drag
     */
    setOuterHandleElId: function(id) {
        if (typeof id !== "string") {
            id = Dom.generateId(id);
        }
        Event.on(id, "mousedown", 
                this.handleMouseDown, this, true);
        this.setHandleElId(id);

        this.hasOuterHandles = true;
    },

    /**
     * Remove all drag and drop hooks for this element
     * @method unreg
     */
    unreg: function() {
        Event.removeListener(this.id, "mousedown", 
                this.handleMouseDown);
        this._domRef = null;
        this.DDM._remove(this);
    },

    /**
     * Returns true if this instance is locked, or the drag drop mgr is locked
     * (meaning that all drag/drop is disabled on the page.)
     * @method isLocked
     * @return {boolean} true if this obj or all drag/drop is locked, else 
     * false
     */
    isLocked: function() {
        return (this.DDM.isLocked() || this.locked);
    },

    /**
     * Fired when this object is clicked
     * @method handleMouseDown
     * @param {Event} e 
     * @param {YAHOO.util.DragDrop} oDD the clicked dd object (this dd obj)
     * @private
     */
    handleMouseDown: function(e, oDD) {

        var button = e.which || e.button;

        if (this.primaryButtonOnly && button > 1) {
            return;
        }

        if (this.isLocked()) {
            return;
        }



        // firing the mousedown events prior to calculating positions
        var b4Return = this.b4MouseDown(e),
        b4Return2 = true;

        if (this.events.b4MouseDown) {
            b4Return2 = this.fireEvent('b4MouseDownEvent', e);
        }
        var mDownReturn = this.onMouseDown(e),
            mDownReturn2 = true;
        if (this.events.mouseDown) {
            if (mDownReturn === false) {
                //Fixes #2528759 - Mousedown function returned false, don't fire the event and cancel everything.
                 mDownReturn2 = false;
            } else {
                mDownReturn2 = this.fireEvent('mouseDownEvent', e);
            }
        }

        if ((b4Return === false) || (mDownReturn === false) || (b4Return2 === false) || (mDownReturn2 === false)) {
            return;
        }

        this.DDM.refreshCache(this.groups);
        // var self = this;
        // setTimeout( function() { self.DDM.refreshCache(self.groups); }, 0);

        // Only process the event if we really clicked within the linked 
        // element.  The reason we make this check is that in the case that 
        // another element was moved between the clicked element and the 
        // cursor in the time between the mousedown and mouseup events. When 
        // this happens, the element gets the next mousedown event 
        // regardless of where on the screen it happened.  
        var pt = new YAHOO.util.Point(Event.getPageX(e), Event.getPageY(e));
        if (!this.hasOuterHandles && !this.DDM.isOverTarget(pt, this) )  {
        } else {
            if (this.clickValidator(e)) {


                // set the initial element position
                this.setStartPosition();

                // start tracking mousemove distance and mousedown time to
                // determine when to start the actual drag
                this.DDM.handleMouseDown(e, this);

                // this mousedown is mine
                this.DDM.stopEvent(e);
            } else {


            }
        }
    },

    /**
     * @method clickValidator
     * @description Method validates that the clicked element
     * was indeed the handle or a valid child of the handle
     * @param {Event} e 
     */
    clickValidator: function(e) {
        var target = YAHOO.util.Event.getTarget(e);
        return ( this.isValidHandleChild(target) &&
                    (this.id == this.handleElId || 
                        this.DDM.handleWasClicked(target, this.id)) );
    },

    /**
     * Finds the location the element should be placed if we want to move
     * it to where the mouse location less the click offset would place us.
     * @method getTargetCoord
     * @param {int} iPageX the X coordinate of the click
     * @param {int} iPageY the Y coordinate of the click
     * @return an object that contains the coordinates (Object.x and Object.y)
     * @private
     */
    getTargetCoord: function(iPageX, iPageY) {


        var x = iPageX - this.deltaX;
        var y = iPageY - this.deltaY;

        if (this.constrainX) {
            if (x < this.minX) { x = this.minX; }
            if (x > this.maxX) { x = this.maxX; }
        }

        if (this.constrainY) {
            if (y < this.minY) { y = this.minY; }
            if (y > this.maxY) { y = this.maxY; }
        }

        x = this.getTick(x, this.xTicks);
        y = this.getTick(y, this.yTicks);


        return {x:x, y:y};
    },

    /**
     * Allows you to specify a tag name that should not start a drag operation
     * when clicked.  This is designed to facilitate embedding links within a
     * drag handle that do something other than start the drag.
     * @method addInvalidHandleType
     * @param {string} tagName the type of element to exclude
     */
    addInvalidHandleType: function(tagName) {
        var type = tagName.toUpperCase();
        this.invalidHandleTypes[type] = type;
    },

    /**
     * Lets you to specify an element id for a child of a drag handle
     * that should not initiate a drag
     * @method addInvalidHandleId
     * @param {string} id the element id of the element you wish to ignore
     */
    addInvalidHandleId: function(id) {
        if (typeof id !== "string") {
            id = Dom.generateId(id);
        }
        this.invalidHandleIds[id] = id;
    },


    /**
     * Lets you specify a css class of elements that will not initiate a drag
     * @method addInvalidHandleClass
     * @param {string} cssClass the class of the elements you wish to ignore
     */
    addInvalidHandleClass: function(cssClass) {
        this.invalidHandleClasses.push(cssClass);
    },

    /**
     * Unsets an excluded tag name set by addInvalidHandleType
     * @method removeInvalidHandleType
     * @param {string} tagName the type of element to unexclude
     */
    removeInvalidHandleType: function(tagName) {
        var type = tagName.toUpperCase();
        // this.invalidHandleTypes[type] = null;
        delete this.invalidHandleTypes[type];
    },
    
    /**
     * Unsets an invalid handle id
     * @method removeInvalidHandleId
     * @param {string} id the id of the element to re-enable
     */
    removeInvalidHandleId: function(id) {
        if (typeof id !== "string") {
            id = Dom.generateId(id);
        }
        delete this.invalidHandleIds[id];
    },

    /**
     * Unsets an invalid css class
     * @method removeInvalidHandleClass
     * @param {string} cssClass the class of the element(s) you wish to 
     * re-enable
     */
    removeInvalidHandleClass: function(cssClass) {
        for (var i=0, len=this.invalidHandleClasses.length; i<len; ++i) {
            if (this.invalidHandleClasses[i] == cssClass) {
                delete this.invalidHandleClasses[i];
            }
        }
    },

    /**
     * Checks the tag exclusion list to see if this click should be ignored
     * @method isValidHandleChild
     * @param {HTMLElement} node the HTMLElement to evaluate
     * @return {boolean} true if this is a valid tag type, false if not
     */
    isValidHandleChild: function(node) {

        var valid = true;
        // var n = (node.nodeName == "#text") ? node.parentNode : node;
        var nodeName;
        try {
            nodeName = node.nodeName.toUpperCase();
        } catch(e) {
            nodeName = node.nodeName;
        }
        valid = valid && !this.invalidHandleTypes[nodeName];
        valid = valid && !this.invalidHandleIds[node.id];

        for (var i=0, len=this.invalidHandleClasses.length; valid && i<len; ++i) {
            valid = !Dom.hasClass(node, this.invalidHandleClasses[i]);
        }


        return valid;

    },

    /**
     * Create the array of horizontal tick marks if an interval was specified
     * in setXConstraint().
     * @method setXTicks
     * @private
     */
    setXTicks: function(iStartX, iTickSize) {
        this.xTicks = [];
        this.xTickSize = iTickSize;
        
        var tickMap = {};

        for (var i = this.initPageX; i >= this.minX; i = i - iTickSize) {
            if (!tickMap[i]) {
                this.xTicks[this.xTicks.length] = i;
                tickMap[i] = true;
            }
        }

        for (i = this.initPageX; i <= this.maxX; i = i + iTickSize) {
            if (!tickMap[i]) {
                this.xTicks[this.xTicks.length] = i;
                tickMap[i] = true;
            }
        }

        this.xTicks.sort(this.DDM.numericSort) ;
    },

    /**
     * Create the array of vertical tick marks if an interval was specified in 
     * setYConstraint().
     * @method setYTicks
     * @private
     */
    setYTicks: function(iStartY, iTickSize) {
        this.yTicks = [];
        this.yTickSize = iTickSize;

        var tickMap = {};

        for (var i = this.initPageY; i >= this.minY; i = i - iTickSize) {
            if (!tickMap[i]) {
                this.yTicks[this.yTicks.length] = i;
                tickMap[i] = true;
            }
        }

        for (i = this.initPageY; i <= this.maxY; i = i + iTickSize) {
            if (!tickMap[i]) {
                this.yTicks[this.yTicks.length] = i;
                tickMap[i] = true;
            }
        }

        this.yTicks.sort(this.DDM.numericSort) ;
    },

    /**
     * By default, the element can be dragged any place on the screen.  Use 
     * this method to limit the horizontal travel of the element.  Pass in 
     * 0,0 for the parameters if you want to lock the drag to the y axis.
     * @method setXConstraint
     * @param {int} iLeft the number of pixels the element can move to the left
     * @param {int} iRight the number of pixels the element can move to the 
     * right
     * @param {int} iTickSize optional parameter for specifying that the 
     * element
     * should move iTickSize pixels at a time.
     */
    setXConstraint: function(iLeft, iRight, iTickSize) {
        this.leftConstraint = parseInt(iLeft, 10);
        this.rightConstraint = parseInt(iRight, 10);

        this.minX = this.initPageX - this.leftConstraint;
        this.maxX = this.initPageX + this.rightConstraint;
        if (iTickSize) { this.setXTicks(this.initPageX, iTickSize); }

        this.constrainX = true;
    },

    /**
     * Clears any constraints applied to this instance.  Also clears ticks
     * since they can't exist independent of a constraint at this time.
     * @method clearConstraints
     */
    clearConstraints: function() {
        this.constrainX = false;
        this.constrainY = false;
        this.clearTicks();
    },

    /**
     * Clears any tick interval defined for this instance
     * @method clearTicks
     */
    clearTicks: function() {
        this.xTicks = null;
        this.yTicks = null;
        this.xTickSize = 0;
        this.yTickSize = 0;
    },

    /**
     * By default, the element can be dragged any place on the screen.  Set 
     * this to limit the vertical travel of the element.  Pass in 0,0 for the
     * parameters if you want to lock the drag to the x axis.
     * @method setYConstraint
     * @param {int} iUp the number of pixels the element can move up
     * @param {int} iDown the number of pixels the element can move down
     * @param {int} iTickSize optional parameter for specifying that the 
     * element should move iTickSize pixels at a time.
     */
    setYConstraint: function(iUp, iDown, iTickSize) {
        this.topConstraint = parseInt(iUp, 10);
        this.bottomConstraint = parseInt(iDown, 10);

        this.minY = this.initPageY - this.topConstraint;
        this.maxY = this.initPageY + this.bottomConstraint;
        if (iTickSize) { this.setYTicks(this.initPageY, iTickSize); }

        this.constrainY = true;
        
    },

    /**
     * resetConstraints must be called if you manually reposition a dd element.
     * @method resetConstraints
     */
    resetConstraints: function() {


        // Maintain offsets if necessary
        if (this.initPageX || this.initPageX === 0) {
            // figure out how much this thing has moved
            var dx = (this.maintainOffset) ? this.lastPageX - this.initPageX : 0;
            var dy = (this.maintainOffset) ? this.lastPageY - this.initPageY : 0;

            this.setInitPosition(dx, dy);

        // This is the first time we have detected the element's position
        } else {
            this.setInitPosition();
        }

        if (this.constrainX) {
            this.setXConstraint( this.leftConstraint, 
                                 this.rightConstraint, 
                                 this.xTickSize        );
        }

        if (this.constrainY) {
            this.setYConstraint( this.topConstraint, 
                                 this.bottomConstraint, 
                                 this.yTickSize         );
        }
    },

    /**
     * Normally the drag element is moved pixel by pixel, but we can specify 
     * that it move a number of pixels at a time.  This method resolves the 
     * location when we have it set up like this.
     * @method getTick
     * @param {int} val where we want to place the object
     * @param {int[]} tickArray sorted array of valid points
     * @return {int} the closest tick
     * @private
     */
    getTick: function(val, tickArray) {

        if (!tickArray) {
            // If tick interval is not defined, it is effectively 1 pixel, 
            // so we return the value passed to us.
            return val; 
        } else if (tickArray[0] >= val) {
            // The value is lower than the first tick, so we return the first
            // tick.
            return tickArray[0];
        } else {
            for (var i=0, len=tickArray.length; i<len; ++i) {
                var next = i + 1;
                if (tickArray[next] && tickArray[next] >= val) {
                    var diff1 = val - tickArray[i];
                    var diff2 = tickArray[next] - val;
                    return (diff2 > diff1) ? tickArray[i] : tickArray[next];
                }
            }

            // The value is larger than the last tick, so we return the last
            // tick.
            return tickArray[tickArray.length - 1];
        }
    },

    /**
     * toString method
     * @method toString
     * @return {string} string representation of the dd obj
     */
    toString: function() {
        return ("DragDrop " + this.id);
    }

};
YAHOO.augment(YAHOO.util.DragDrop, YAHOO.util.EventProvider);

/**
* @event mouseDownEvent
* @description Provides access to the mousedown event. The mousedown does not always result in a drag operation.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/

/**
* @event b4MouseDownEvent
* @description Provides access to the mousedown event, before the mouseDownEvent gets fired. Returning false will cancel the drag.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/

/**
* @event mouseUpEvent
* @description Fired from inside DragDropMgr when the drag operation is finished.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/

/**
* @event b4StartDragEvent
* @description Fires before the startDragEvent, returning false will cancel the startDrag Event.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/

/**
* @event startDragEvent
* @description Occurs after a mouse down and the drag threshold has been met. The drag threshold default is either 3 pixels of mouse movement or 1 full second of holding the mousedown. 
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/

/**
* @event b4EndDragEvent
* @description Fires before the endDragEvent. Returning false will cancel.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/

/**
* @event endDragEvent
* @description Fires on the mouseup event after a drag has been initiated (startDrag fired).
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/

/**
* @event dragEvent
* @description Occurs every mousemove event while dragging.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/
/**
* @event b4DragEvent
* @description Fires before the dragEvent.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/
/**
* @event invalidDropEvent
* @description Fires when the dragged objects is dropped in a location that contains no drop targets.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/
/**
* @event b4DragOutEvent
* @description Fires before the dragOutEvent
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/
/**
* @event dragOutEvent
* @description Fires when a dragged object is no longer over an object that had the onDragEnter fire. 
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/
/**
* @event dragEnterEvent
* @description Occurs when the dragged object first interacts with another targettable drag and drop object.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/
/**
* @event b4DragOverEvent
* @description Fires before the dragOverEvent.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/
/**
* @event dragOverEvent
* @description Fires every mousemove event while over a drag and drop object.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/
/**
* @event b4DragDropEvent 
* @description Fires before the dragDropEvent
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/
/**
* @event dragDropEvent
* @description Fires when the dragged objects is dropped on another.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/
})();
/**
 * A DragDrop implementation where the linked element follows the 
 * mouse cursor during a drag.
 * @class DD
 * @extends YAHOO.util.DragDrop
 * @constructor
 * @param {String} id the id of the linked element 
 * @param {String} sGroup the group of related DragDrop items
 * @param {object} config an object containing configurable attributes
 *                Valid properties for DD: 
 *                    scroll
 */
YAHOO.util.DD = function(id, sGroup, config) {
    if (id) {
        this.init(id, sGroup, config);
    }
};

YAHOO.extend(YAHOO.util.DD, YAHOO.util.DragDrop, {

    /**
     * When set to true, the utility automatically tries to scroll the browser
     * window when a drag and drop element is dragged near the viewport boundary.
     * Defaults to true.
     * @property scroll
     * @type boolean
     */
    scroll: true, 

    /**
     * Sets the pointer offset to the distance between the linked element's top 
     * left corner and the location the element was clicked
     * @method autoOffset
     * @param {int} iPageX the X coordinate of the click
     * @param {int} iPageY the Y coordinate of the click
     */
    autoOffset: function(iPageX, iPageY) {
        var x = iPageX - this.startPageX;
        var y = iPageY - this.startPageY;
        this.setDelta(x, y);
    },

    /** 
     * Sets the pointer offset.  You can call this directly to force the 
     * offset to be in a particular location (e.g., pass in 0,0 to set it 
     * to the center of the object, as done in YAHOO.widget.Slider)
     * @method setDelta
     * @param {int} iDeltaX the distance from the left
     * @param {int} iDeltaY the distance from the top
     */
    setDelta: function(iDeltaX, iDeltaY) {
        this.deltaX = iDeltaX;
        this.deltaY = iDeltaY;
    },

    /**
     * Sets the drag element to the location of the mousedown or click event, 
     * maintaining the cursor location relative to the location on the element 
     * that was clicked.  Override this if you want to place the element in a 
     * location other than where the cursor is.
     * @method setDragElPos
     * @param {int} iPageX the X coordinate of the mousedown or drag event
     * @param {int} iPageY the Y coordinate of the mousedown or drag event
     */
    setDragElPos: function(iPageX, iPageY) {
        // the first time we do this, we are going to check to make sure
        // the element has css positioning

        var el = this.getDragEl();
        this.alignElWithMouse(el, iPageX, iPageY);
    },

    /**
     * Sets the element to the location of the mousedown or click event, 
     * maintaining the cursor location relative to the location on the element 
     * that was clicked.  Override this if you want to place the element in a 
     * location other than where the cursor is.
     * @method alignElWithMouse
     * @param {HTMLElement} el the element to move
     * @param {int} iPageX the X coordinate of the mousedown or drag event
     * @param {int} iPageY the Y coordinate of the mousedown or drag event
     */
    alignElWithMouse: function(el, iPageX, iPageY) {
        var oCoord = this.getTargetCoord(iPageX, iPageY);

        if (!this.deltaSetXY) {
            var aCoord = [oCoord.x, oCoord.y];
            YAHOO.util.Dom.setXY(el, aCoord);

            var newLeft = parseInt( YAHOO.util.Dom.getStyle(el, "left"), 10 );
            var newTop  = parseInt( YAHOO.util.Dom.getStyle(el, "top" ), 10 );

            this.deltaSetXY = [ newLeft - oCoord.x, newTop - oCoord.y ];
        } else {
            YAHOO.util.Dom.setStyle(el, "left", (oCoord.x + this.deltaSetXY[0]) + "px");
            YAHOO.util.Dom.setStyle(el, "top",  (oCoord.y + this.deltaSetXY[1]) + "px");
        }
        
        this.cachePosition(oCoord.x, oCoord.y);
        var self = this;
        setTimeout(function() {
            self.autoScroll.call(self, oCoord.x, oCoord.y, el.offsetHeight, el.offsetWidth);
        }, 0);
    },

    /**
     * Saves the most recent position so that we can reset the constraints and
     * tick marks on-demand.  We need to know this so that we can calculate the
     * number of pixels the element is offset from its original position.
     * @method cachePosition
     * @param iPageX the current x position (optional, this just makes it so we
     * don't have to look it up again)
     * @param iPageY the current y position (optional, this just makes it so we
     * don't have to look it up again)
     */
    cachePosition: function(iPageX, iPageY) {
        if (iPageX) {
            this.lastPageX = iPageX;
            this.lastPageY = iPageY;
        } else {
            var aCoord = YAHOO.util.Dom.getXY(this.getEl());
            this.lastPageX = aCoord[0];
            this.lastPageY = aCoord[1];
        }
    },

    /**
     * Auto-scroll the window if the dragged object has been moved beyond the 
     * visible window boundary.
     * @method autoScroll
     * @param {int} x the drag element's x position
     * @param {int} y the drag element's y position
     * @param {int} h the height of the drag element
     * @param {int} w the width of the drag element
     * @private
     */
    autoScroll: function(x, y, h, w) {

        if (this.scroll) {
            // The client height
            var clientH = this.DDM.getClientHeight();

            // The client width
            var clientW = this.DDM.getClientWidth();

            // The amt scrolled down
            var st = this.DDM.getScrollTop();

            // The amt scrolled right
            var sl = this.DDM.getScrollLeft();

            // Location of the bottom of the element
            var bot = h + y;

            // Location of the right of the element
            var right = w + x;

            // The distance from the cursor to the bottom of the visible area, 
            // adjusted so that we don't scroll if the cursor is beyond the
            // element drag constraints
            var toBot = (clientH + st - y - this.deltaY);

            // The distance from the cursor to the right of the visible area
            var toRight = (clientW + sl - x - this.deltaX);


            // How close to the edge the cursor must be before we scroll
            // var thresh = (document.all) ? 100 : 40;
            var thresh = 40;

            // How many pixels to scroll per autoscroll op.  This helps to reduce 
            // clunky scrolling. IE is more sensitive about this ... it needs this 
            // value to be higher.
            var scrAmt = (document.all) ? 80 : 30;

            // Scroll down if we are near the bottom of the visible page and the 
            // obj extends below the crease
            if ( bot > clientH && toBot < thresh ) { 
                window.scrollTo(sl, st + scrAmt); 
            }

            // Scroll up if the window is scrolled down and the top of the object
            // goes above the top border
            if ( y < st && st > 0 && y - st < thresh ) { 
                window.scrollTo(sl, st - scrAmt); 
            }

            // Scroll right if the obj is beyond the right border and the cursor is
            // near the border.
            if ( right > clientW && toRight < thresh ) { 
                window.scrollTo(sl + scrAmt, st); 
            }

            // Scroll left if the window has been scrolled to the right and the obj
            // extends past the left border
            if ( x < sl && sl > 0 && x - sl < thresh ) { 
                window.scrollTo(sl - scrAmt, st);
            }
        }
    },

    /*
     * Sets up config options specific to this class. Overrides
     * YAHOO.util.DragDrop, but all versions of this method through the 
     * inheritance chain are called
     */
    applyConfig: function() {
        YAHOO.util.DD.superclass.applyConfig.call(this);
        this.scroll = (this.config.scroll !== false);
    },

    /*
     * Event that fires prior to the onMouseDown event.  Overrides 
     * YAHOO.util.DragDrop.
     */
    b4MouseDown: function(e) {
        this.setStartPosition();
        // this.resetConstraints();
        this.autoOffset(YAHOO.util.Event.getPageX(e), 
                            YAHOO.util.Event.getPageY(e));
    },

    /*
     * Event that fires prior to the onDrag event.  Overrides 
     * YAHOO.util.DragDrop.
     */
    b4Drag: function(e) {
        this.setDragElPos(YAHOO.util.Event.getPageX(e), 
                            YAHOO.util.Event.getPageY(e));
    },

    toString: function() {
        return ("DD " + this.id);
    }

    //////////////////////////////////////////////////////////////////////////
    // Debugging ygDragDrop events that can be overridden
    //////////////////////////////////////////////////////////////////////////
    /*
    startDrag: function(x, y) {
    },

    onDrag: function(e) {
    },

    onDragEnter: function(e, id) {
    },

    onDragOver: function(e, id) {
    },

    onDragOut: function(e, id) {
    },

    onDragDrop: function(e, id) {
    },

    endDrag: function(e) {
    }

    */

/**
* @event mouseDownEvent
* @description Provides access to the mousedown event. The mousedown does not always result in a drag operation.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/

/**
* @event b4MouseDownEvent
* @description Provides access to the mousedown event, before the mouseDownEvent gets fired. Returning false will cancel the drag.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/

/**
* @event mouseUpEvent
* @description Fired from inside DragDropMgr when the drag operation is finished.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/

/**
* @event b4StartDragEvent
* @description Fires before the startDragEvent, returning false will cancel the startDrag Event.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/

/**
* @event startDragEvent
* @description Occurs after a mouse down and the drag threshold has been met. The drag threshold default is either 3 pixels of mouse movement or 1 full second of holding the mousedown. 
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/

/**
* @event b4EndDragEvent
* @description Fires before the endDragEvent. Returning false will cancel.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/

/**
* @event endDragEvent
* @description Fires on the mouseup event after a drag has been initiated (startDrag fired).
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/

/**
* @event dragEvent
* @description Occurs every mousemove event while dragging.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/
/**
* @event b4DragEvent
* @description Fires before the dragEvent.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/
/**
* @event invalidDropEvent
* @description Fires when the dragged objects is dropped in a location that contains no drop targets.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/
/**
* @event b4DragOutEvent
* @description Fires before the dragOutEvent
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/
/**
* @event dragOutEvent
* @description Fires when a dragged object is no longer over an object that had the onDragEnter fire. 
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/
/**
* @event dragEnterEvent
* @description Occurs when the dragged object first interacts with another targettable drag and drop object.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/
/**
* @event b4DragOverEvent
* @description Fires before the dragOverEvent.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/
/**
* @event dragOverEvent
* @description Fires every mousemove event while over a drag and drop object.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/
/**
* @event b4DragDropEvent 
* @description Fires before the dragDropEvent
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/
/**
* @event dragDropEvent
* @description Fires when the dragged objects is dropped on another.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/
});
/**
 * A DragDrop implementation that inserts an empty, bordered div into
 * the document that follows the cursor during drag operations.  At the time of
 * the click, the frame div is resized to the dimensions of the linked html
 * element, and moved to the exact location of the linked element.
 *
 * References to the "frame" element refer to the single proxy element that
 * was created to be dragged in place of all DDProxy elements on the
 * page.
 *
 * @class DDProxy
 * @extends YAHOO.util.DD
 * @constructor
 * @param {String} id the id of the linked html element
 * @param {String} sGroup the group of related DragDrop objects
 * @param {object} config an object containing configurable attributes
 *                Valid properties for DDProxy in addition to those in DragDrop: 
 *                   resizeFrame, centerFrame, dragElId
 */
YAHOO.util.DDProxy = function(id, sGroup, config) {
    if (id) {
        this.init(id, sGroup, config);
        this.initFrame(); 
    }
};

/**
 * The default drag frame div id
 * @property YAHOO.util.DDProxy.dragElId
 * @type String
 * @static
 */
YAHOO.util.DDProxy.dragElId = "ygddfdiv";

YAHOO.extend(YAHOO.util.DDProxy, YAHOO.util.DD, {

    /**
     * By default we resize the drag frame to be the same size as the element
     * we want to drag (this is to get the frame effect).  We can turn it off
     * if we want a different behavior.
     * @property resizeFrame
     * @type boolean
     */
    resizeFrame: true,

    /**
     * By default the frame is positioned exactly where the drag element is, so
     * we use the cursor offset provided by YAHOO.util.DD.  Another option that works only if
     * you do not have constraints on the obj is to have the drag frame centered
     * around the cursor.  Set centerFrame to true for this effect.
     * @property centerFrame
     * @type boolean
     */
    centerFrame: false,

    /**
     * Creates the proxy element if it does not yet exist
     * @method createFrame
     */
    createFrame: function() {
        var self=this, body=document.body;

        if (!body || !body.firstChild) {
            setTimeout( function() { self.createFrame(); }, 50 );
            return;
        }

        var div=this.getDragEl(), Dom=YAHOO.util.Dom;

        if (!div) {
            div    = document.createElement("div");
            div.id = this.dragElId;
            var s  = div.style;

            s.position   = "absolute";
            s.visibility = "hidden";
            s.cursor     = "move";
            s.border     = "2px solid #aaa";
            s.zIndex     = 999;
            s.height     = "25px";
            s.width      = "25px";

            var _data = document.createElement('div');
            Dom.setStyle(_data, 'height', '100%');
            Dom.setStyle(_data, 'width', '100%');
            /**
            * If the proxy element has no background-color, then it is considered to the "transparent" by Internet Explorer.
            * Since it is "transparent" then the events pass through it to the iframe below.
            * So creating a "fake" div inside the proxy element and giving it a background-color, then setting it to an
            * opacity of 0, it appears to not be there, however IE still thinks that it is so the events never pass through.
            */
            Dom.setStyle(_data, 'background-color', '#ccc');
            Dom.setStyle(_data, 'opacity', '0');
            div.appendChild(_data);

            // appendChild can blow up IE if invoked prior to the window load event
            // while rendering a table.  It is possible there are other scenarios 
            // that would cause this to happen as well.
            body.insertBefore(div, body.firstChild);
        }
    },

    /**
     * Initialization for the drag frame element.  Must be called in the
     * constructor of all subclasses
     * @method initFrame
     */
    initFrame: function() {
        this.createFrame();
    },

    applyConfig: function() {
        YAHOO.util.DDProxy.superclass.applyConfig.call(this);

        this.resizeFrame = (this.config.resizeFrame !== false);
        this.centerFrame = (this.config.centerFrame);
        this.setDragElId(this.config.dragElId || YAHOO.util.DDProxy.dragElId);
    },

    /**
     * Resizes the drag frame to the dimensions of the clicked object, positions 
     * it over the object, and finally displays it
     * @method showFrame
     * @param {int} iPageX X click position
     * @param {int} iPageY Y click position
     * @private
     */
    showFrame: function(iPageX, iPageY) {
        var el = this.getEl();
        var dragEl = this.getDragEl();
        var s = dragEl.style;

        this._resizeProxy();

        if (this.centerFrame) {
            this.setDelta( Math.round(parseInt(s.width,  10)/2), 
                           Math.round(parseInt(s.height, 10)/2) );
        }

        this.setDragElPos(iPageX, iPageY);

        YAHOO.util.Dom.setStyle(dragEl, "visibility", "visible"); 
    },

    /**
     * The proxy is automatically resized to the dimensions of the linked
     * element when a drag is initiated, unless resizeFrame is set to false
     * @method _resizeProxy
     * @private
     */
    _resizeProxy: function() {
        if (this.resizeFrame) {
            var DOM    = YAHOO.util.Dom;
            var el     = this.getEl();
            var dragEl = this.getDragEl();

            var bt = parseInt( DOM.getStyle(dragEl, "borderTopWidth"    ), 10);
            var br = parseInt( DOM.getStyle(dragEl, "borderRightWidth"  ), 10);
            var bb = parseInt( DOM.getStyle(dragEl, "borderBottomWidth" ), 10);
            var bl = parseInt( DOM.getStyle(dragEl, "borderLeftWidth"   ), 10);

            if (isNaN(bt)) { bt = 0; }
            if (isNaN(br)) { br = 0; }
            if (isNaN(bb)) { bb = 0; }
            if (isNaN(bl)) { bl = 0; }


            var newWidth  = Math.max(0, el.offsetWidth  - br - bl);                                                                                           
            var newHeight = Math.max(0, el.offsetHeight - bt - bb);


            DOM.setStyle( dragEl, "width",  newWidth  + "px" );
            DOM.setStyle( dragEl, "height", newHeight + "px" );
        }
    },

    // overrides YAHOO.util.DragDrop
    b4MouseDown: function(e) {
        this.setStartPosition();
        var x = YAHOO.util.Event.getPageX(e);
        var y = YAHOO.util.Event.getPageY(e);
        this.autoOffset(x, y);

        // This causes the autoscroll code to kick off, which means autoscroll can
        // happen prior to the check for a valid drag handle.
        // this.setDragElPos(x, y);
    },

    // overrides YAHOO.util.DragDrop
    b4StartDrag: function(x, y) {
        // show the drag frame
        this.showFrame(x, y);
    },

    // overrides YAHOO.util.DragDrop
    b4EndDrag: function(e) {
        YAHOO.util.Dom.setStyle(this.getDragEl(), "visibility", "hidden"); 
    },

    // overrides YAHOO.util.DragDrop
    // By default we try to move the element to the last location of the frame.  
    // This is so that the default behavior mirrors that of YAHOO.util.DD.  
    endDrag: function(e) {
        var DOM = YAHOO.util.Dom;
        var lel = this.getEl();
        var del = this.getDragEl();

        // Show the drag frame briefly so we can get its position
        // del.style.visibility = "";
        DOM.setStyle(del, "visibility", ""); 

        // Hide the linked element before the move to get around a Safari 
        // rendering bug.
        //lel.style.visibility = "hidden";
        DOM.setStyle(lel, "visibility", "hidden"); 
        YAHOO.util.DDM.moveToEl(lel, del);
        //del.style.visibility = "hidden";
        DOM.setStyle(del, "visibility", "hidden"); 
        //lel.style.visibility = "";
        DOM.setStyle(lel, "visibility", ""); 
    },

    toString: function() {
        return ("DDProxy " + this.id);
    }
/**
* @event mouseDownEvent
* @description Provides access to the mousedown event. The mousedown does not always result in a drag operation.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/

/**
* @event b4MouseDownEvent
* @description Provides access to the mousedown event, before the mouseDownEvent gets fired. Returning false will cancel the drag.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/

/**
* @event mouseUpEvent
* @description Fired from inside DragDropMgr when the drag operation is finished.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/

/**
* @event b4StartDragEvent
* @description Fires before the startDragEvent, returning false will cancel the startDrag Event.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/

/**
* @event startDragEvent
* @description Occurs after a mouse down and the drag threshold has been met. The drag threshold default is either 3 pixels of mouse movement or 1 full second of holding the mousedown. 
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/

/**
* @event b4EndDragEvent
* @description Fires before the endDragEvent. Returning false will cancel.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/

/**
* @event endDragEvent
* @description Fires on the mouseup event after a drag has been initiated (startDrag fired).
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/

/**
* @event dragEvent
* @description Occurs every mousemove event while dragging.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/
/**
* @event b4DragEvent
* @description Fires before the dragEvent.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/
/**
* @event invalidDropEvent
* @description Fires when the dragged objects is dropped in a location that contains no drop targets.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/
/**
* @event b4DragOutEvent
* @description Fires before the dragOutEvent
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/
/**
* @event dragOutEvent
* @description Fires when a dragged object is no longer over an object that had the onDragEnter fire. 
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/
/**
* @event dragEnterEvent
* @description Occurs when the dragged object first interacts with another targettable drag and drop object.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/
/**
* @event b4DragOverEvent
* @description Fires before the dragOverEvent.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/
/**
* @event dragOverEvent
* @description Fires every mousemove event while over a drag and drop object.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/
/**
* @event b4DragDropEvent 
* @description Fires before the dragDropEvent
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/
/**
* @event dragDropEvent
* @description Fires when the dragged objects is dropped on another.
* @type YAHOO.util.CustomEvent See <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for more information on listening for this event.
*/

});
/**
 * A DragDrop implementation that does not move, but can be a drop 
 * target.  You would get the same result by simply omitting implementation 
 * for the event callbacks, but this way we reduce the processing cost of the 
 * event listener and the callbacks.
 * @class DDTarget
 * @extends YAHOO.util.DragDrop 
 * @constructor
 * @param {String} id the id of the element that is a drop target
 * @param {String} sGroup the group of related DragDrop objects
 * @param {object} config an object containing configurable attributes
 *                 Valid properties for DDTarget in addition to those in 
 *                 DragDrop: 
 *                    none
 */
YAHOO.util.DDTarget = function(id, sGroup, config) {
    if (id) {
        this.initTarget(id, sGroup, config);
    }
};

// YAHOO.util.DDTarget.prototype = new YAHOO.util.DragDrop();
YAHOO.extend(YAHOO.util.DDTarget, YAHOO.util.DragDrop, {
    toString: function() {
        return ("DDTarget " + this.id);
    }
});
YAHOO.register("dragdrop", YAHOO.util.DragDropMgr, {version: "2.9.0", build: "2800"});

/*
Copyright (c) 2011, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://developer.yahoo.com/yui/license.html
version: 2.9.0
*/
if(typeof YAHOO=="undefined"||!YAHOO){var YAHOO={};}YAHOO.namespace=function(){var b=arguments,g=null,e,c,f;for(e=0;e<b.length;e=e+1){f=(""+b[e]).split(".");g=YAHOO;for(c=(f[0]=="YAHOO")?1:0;c<f.length;c=c+1){g[f[c]]=g[f[c]]||{};g=g[f[c]];}}return g;};YAHOO.log=function(d,a,c){var b=YAHOO.widget.Logger;if(b&&b.log){return b.log(d,a,c);}else{return false;}};YAHOO.register=function(a,f,e){var k=YAHOO.env.modules,c,j,h,g,d;if(!k[a]){k[a]={versions:[],builds:[]};}c=k[a];j=e.version;h=e.build;g=YAHOO.env.listeners;c.name=a;c.version=j;c.build=h;c.versions.push(j);c.builds.push(h);c.mainClass=f;for(d=0;d<g.length;d=d+1){g[d](c);}if(f){f.VERSION=j;f.BUILD=h;}else{YAHOO.log("mainClass is undefined for module "+a,"warn");}};YAHOO.env=YAHOO.env||{modules:[],listeners:[]};YAHOO.env.getVersion=function(a){return YAHOO.env.modules[a]||null;};YAHOO.env.parseUA=function(d){var e=function(i){var j=0;return parseFloat(i.replace(/\./g,function(){return(j++==1)?"":".";}));},h=navigator,g={ie:0,opera:0,gecko:0,webkit:0,chrome:0,mobile:null,air:0,ipad:0,iphone:0,ipod:0,ios:null,android:0,webos:0,caja:h&&h.cajaVersion,secure:false,os:null},c=d||(navigator&&navigator.userAgent),f=window&&window.location,b=f&&f.href,a;g.secure=b&&(b.toLowerCase().indexOf("https")===0);if(c){if((/windows|win32/i).test(c)){g.os="windows";}else{if((/macintosh/i).test(c)){g.os="macintosh";}else{if((/rhino/i).test(c)){g.os="rhino";}}}if((/KHTML/).test(c)){g.webkit=1;}a=c.match(/AppleWebKit\/([^\s]*)/);if(a&&a[1]){g.webkit=e(a[1]);if(/ Mobile\//.test(c)){g.mobile="Apple";a=c.match(/OS ([^\s]*)/);if(a&&a[1]){a=e(a[1].replace("_","."));}g.ios=a;g.ipad=g.ipod=g.iphone=0;a=c.match(/iPad|iPod|iPhone/);if(a&&a[0]){g[a[0].toLowerCase()]=g.ios;}}else{a=c.match(/NokiaN[^\/]*|Android \d\.\d|webOS\/\d\.\d/);if(a){g.mobile=a[0];}if(/webOS/.test(c)){g.mobile="WebOS";a=c.match(/webOS\/([^\s]*);/);if(a&&a[1]){g.webos=e(a[1]);}}if(/ Android/.test(c)){g.mobile="Android";a=c.match(/Android ([^\s]*);/);if(a&&a[1]){g.android=e(a[1]);}}}a=c.match(/Chrome\/([^\s]*)/);if(a&&a[1]){g.chrome=e(a[1]);}else{a=c.match(/AdobeAIR\/([^\s]*)/);if(a){g.air=a[0];}}}if(!g.webkit){a=c.match(/Opera[\s\/]([^\s]*)/);if(a&&a[1]){g.opera=e(a[1]);a=c.match(/Version\/([^\s]*)/);if(a&&a[1]){g.opera=e(a[1]);}a=c.match(/Opera Mini[^;]*/);if(a){g.mobile=a[0];}}else{a=c.match(/MSIE\s([^;]*)/);if(a&&a[1]){g.ie=e(a[1]);}else{a=c.match(/Gecko\/([^\s]*)/);if(a){g.gecko=1;a=c.match(/rv:([^\s\)]*)/);if(a&&a[1]){g.gecko=e(a[1]);}}}}}}return g;};YAHOO.env.ua=YAHOO.env.parseUA();(function(){YAHOO.namespace("util","widget","example");if("undefined"!==typeof YAHOO_config){var b=YAHOO_config.listener,a=YAHOO.env.listeners,d=true,c;if(b){for(c=0;c<a.length;c++){if(a[c]==b){d=false;break;}}if(d){a.push(b);}}}})();YAHOO.lang=YAHOO.lang||{};(function(){var f=YAHOO.lang,a=Object.prototype,c="[object Array]",h="[object Function]",i="[object Object]",b=[],g={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;","/":"&#x2F;","`":"&#x60;"},d=["toString","valueOf"],e={isArray:function(j){return a.toString.apply(j)===c;},isBoolean:function(j){return typeof j==="boolean";},isFunction:function(j){return(typeof j==="function")||a.toString.apply(j)===h;},isNull:function(j){return j===null;},isNumber:function(j){return typeof j==="number"&&isFinite(j);},isObject:function(j){return(j&&(typeof j==="object"||f.isFunction(j)))||false;},isString:function(j){return typeof j==="string";},isUndefined:function(j){return typeof j==="undefined";},_IEEnumFix:(YAHOO.env.ua.ie)?function(l,k){var j,n,m;for(j=0;j<d.length;j=j+1){n=d[j];m=k[n];if(f.isFunction(m)&&m!=a[n]){l[n]=m;}}}:function(){},escapeHTML:function(j){return j.replace(/[&<>"'\/`]/g,function(k){return g[k];});},extend:function(m,n,l){if(!n||!m){throw new Error("extend failed, please check that "+"all dependencies are included.");}var k=function(){},j;k.prototype=n.prototype;m.prototype=new k();m.prototype.constructor=m;m.superclass=n.prototype;if(n.prototype.constructor==a.constructor){n.prototype.constructor=n;}if(l){for(j in l){if(f.hasOwnProperty(l,j)){m.prototype[j]=l[j];}}f._IEEnumFix(m.prototype,l);}},augmentObject:function(n,m){if(!m||!n){throw new Error("Absorb failed, verify dependencies.");}var j=arguments,l,o,k=j[2];if(k&&k!==true){for(l=2;l<j.length;l=l+1){n[j[l]]=m[j[l]];}}else{for(o in m){if(k||!(o in n)){n[o]=m[o];}}f._IEEnumFix(n,m);}return n;},augmentProto:function(m,l){if(!l||!m){throw new Error("Augment failed, verify dependencies.");}var j=[m.prototype,l.prototype],k;for(k=2;k<arguments.length;k=k+1){j.push(arguments[k]);}f.augmentObject.apply(this,j);return m;},dump:function(j,p){var l,n,r=[],t="{...}",k="f(){...}",q=", ",m=" => ";if(!f.isObject(j)){return j+"";}else{if(j instanceof Date||("nodeType" in j&&"tagName" in j)){return j;}else{if(f.isFunction(j)){return k;}}}p=(f.isNumber(p))?p:3;if(f.isArray(j)){r.push("[");for(l=0,n=j.length;l<n;l=l+1){if(f.isObject(j[l])){r.push((p>0)?f.dump(j[l],p-1):t);}else{r.push(j[l]);}r.push(q);}if(r.length>1){r.pop();}r.push("]");}else{r.push("{");for(l in j){if(f.hasOwnProperty(j,l)){r.push(l+m);if(f.isObject(j[l])){r.push((p>0)?f.dump(j[l],p-1):t);}else{r.push(j[l]);}r.push(q);}}if(r.length>1){r.pop();}r.push("}");}return r.join("");},substitute:function(x,y,E,l){var D,C,B,G,t,u,F=[],p,z=x.length,A="dump",r=" ",q="{",m="}",n,w;for(;;){D=x.lastIndexOf(q,z);if(D<0){break;}C=x.indexOf(m,D);if(D+1>C){break;}p=x.substring(D+1,C);G=p;u=null;B=G.indexOf(r);if(B>-1){u=G.substring(B+1);G=G.substring(0,B);}t=y[G];if(E){t=E(G,t,u);}if(f.isObject(t)){if(f.isArray(t)){t=f.dump(t,parseInt(u,10));}else{u=u||"";n=u.indexOf(A);if(n>-1){u=u.substring(4);}w=t.toString();if(w===i||n>-1){t=f.dump(t,parseInt(u,10));}else{t=w;}}}else{if(!f.isString(t)&&!f.isNumber(t)){t="~-"+F.length+"-~";F[F.length]=p;}}x=x.substring(0,D)+t+x.substring(C+1);if(l===false){z=D-1;}}for(D=F.length-1;D>=0;D=D-1){x=x.replace(new RegExp("~-"+D+"-~"),"{"+F[D]+"}","g");}return x;},trim:function(j){try{return j.replace(/^\s+|\s+$/g,"");}catch(k){return j;
}},merge:function(){var n={},k=arguments,j=k.length,m;for(m=0;m<j;m=m+1){f.augmentObject(n,k[m],true);}return n;},later:function(t,k,u,n,p){t=t||0;k=k||{};var l=u,s=n,q,j;if(f.isString(u)){l=k[u];}if(!l){throw new TypeError("method undefined");}if(!f.isUndefined(n)&&!f.isArray(s)){s=[n];}q=function(){l.apply(k,s||b);};j=(p)?setInterval(q,t):setTimeout(q,t);return{interval:p,cancel:function(){if(this.interval){clearInterval(j);}else{clearTimeout(j);}}};},isValue:function(j){return(f.isObject(j)||f.isString(j)||f.isNumber(j)||f.isBoolean(j));}};f.hasOwnProperty=(a.hasOwnProperty)?function(j,k){return j&&j.hasOwnProperty&&j.hasOwnProperty(k);}:function(j,k){return !f.isUndefined(j[k])&&j.constructor.prototype[k]!==j[k];};e.augmentObject(f,e,true);YAHOO.util.Lang=f;f.augment=f.augmentProto;YAHOO.augment=f.augmentProto;YAHOO.extend=f.extend;})();YAHOO.register("yahoo",YAHOO,{version:"2.9.0",build:"2800"});(function(){YAHOO.env._id_counter=YAHOO.env._id_counter||0;var e=YAHOO.util,k=YAHOO.lang,L=YAHOO.env.ua,a=YAHOO.lang.trim,B={},F={},m=/^t(?:able|d|h)$/i,w=/color$/i,j=window.document,v=j.documentElement,C="ownerDocument",M="defaultView",U="documentElement",S="compatMode",z="offsetLeft",o="offsetTop",T="offsetParent",x="parentNode",K="nodeType",c="tagName",n="scrollLeft",H="scrollTop",p="getBoundingClientRect",V="getComputedStyle",y="currentStyle",l="CSS1Compat",A="BackCompat",E="class",f="className",i="",b=" ",R="(?:^|\\s)",J="(?= |$)",t="g",O="position",D="fixed",u="relative",I="left",N="top",Q="medium",P="borderLeftWidth",q="borderTopWidth",d=L.opera,h=L.webkit,g=L.gecko,s=L.ie;e.Dom={CUSTOM_ATTRIBUTES:(!v.hasAttribute)?{"for":"htmlFor","class":f}:{"htmlFor":"for","className":E},DOT_ATTRIBUTES:{checked:true},get:function(aa){var ac,X,ab,Z,W,G,Y=null;if(aa){if(typeof aa=="string"||typeof aa=="number"){ac=aa+"";aa=j.getElementById(aa);G=(aa)?aa.attributes:null;if(aa&&G&&G.id&&G.id.value===ac){return aa;}else{if(aa&&j.all){aa=null;X=j.all[ac];if(X&&X.length){for(Z=0,W=X.length;Z<W;++Z){if(X[Z].id===ac){return X[Z];}}}}}}else{if(e.Element&&aa instanceof e.Element){aa=aa.get("element");}else{if(!aa.nodeType&&"length" in aa){ab=[];for(Z=0,W=aa.length;Z<W;++Z){ab[ab.length]=e.Dom.get(aa[Z]);}aa=ab;}}}Y=aa;}return Y;},getComputedStyle:function(G,W){if(window[V]){return G[C][M][V](G,null)[W];}else{if(G[y]){return e.Dom.IE_ComputedStyle.get(G,W);}}},getStyle:function(G,W){return e.Dom.batch(G,e.Dom._getStyle,W);},_getStyle:function(){if(window[V]){return function(G,Y){Y=(Y==="float")?Y="cssFloat":e.Dom._toCamel(Y);var X=G.style[Y],W;if(!X){W=G[C][M][V](G,null);if(W){X=W[Y];}}return X;};}else{if(v[y]){return function(G,Y){var X;switch(Y){case"opacity":X=100;try{X=G.filters["DXImageTransform.Microsoft.Alpha"].opacity;}catch(Z){try{X=G.filters("alpha").opacity;}catch(W){}}return X/100;case"float":Y="styleFloat";default:Y=e.Dom._toCamel(Y);X=G[y]?G[y][Y]:null;return(G.style[Y]||X);}};}}}(),setStyle:function(G,W,X){e.Dom.batch(G,e.Dom._setStyle,{prop:W,val:X});},_setStyle:function(){if(!window.getComputedStyle&&j.documentElement.currentStyle){return function(W,G){var X=e.Dom._toCamel(G.prop),Y=G.val;if(W){switch(X){case"opacity":if(Y===""||Y===null||Y===1){W.style.removeAttribute("filter");}else{if(k.isString(W.style.filter)){W.style.filter="alpha(opacity="+Y*100+")";if(!W[y]||!W[y].hasLayout){W.style.zoom=1;}}}break;case"float":X="styleFloat";default:W.style[X]=Y;}}else{}};}else{return function(W,G){var X=e.Dom._toCamel(G.prop),Y=G.val;if(W){if(X=="float"){X="cssFloat";}W.style[X]=Y;}else{}};}}(),getXY:function(G){return e.Dom.batch(G,e.Dom._getXY);},_canPosition:function(G){return(e.Dom._getStyle(G,"display")!=="none"&&e.Dom._inDoc(G));},_getXY:function(W){var X,G,Z,ab,Y,aa,ac=Math.round,ad=false;if(e.Dom._canPosition(W)){Z=W[p]();ab=W[C];X=e.Dom.getDocumentScrollLeft(ab);G=e.Dom.getDocumentScrollTop(ab);ad=[Z[I],Z[N]];if(Y||aa){ad[0]-=aa;ad[1]-=Y;}if((G||X)){ad[0]+=X;ad[1]+=G;}ad[0]=ac(ad[0]);ad[1]=ac(ad[1]);}else{}return ad;},getX:function(G){var W=function(X){return e.Dom.getXY(X)[0];};return e.Dom.batch(G,W,e.Dom,true);},getY:function(G){var W=function(X){return e.Dom.getXY(X)[1];};return e.Dom.batch(G,W,e.Dom,true);},setXY:function(G,X,W){e.Dom.batch(G,e.Dom._setXY,{pos:X,noRetry:W});},_setXY:function(G,Z){var aa=e.Dom._getStyle(G,O),Y=e.Dom.setStyle,ad=Z.pos,W=Z.noRetry,ab=[parseInt(e.Dom.getComputedStyle(G,I),10),parseInt(e.Dom.getComputedStyle(G,N),10)],ac,X;ac=e.Dom._getXY(G);if(!ad||ac===false){return false;}if(aa=="static"){aa=u;Y(G,O,aa);}if(isNaN(ab[0])){ab[0]=(aa==u)?0:G[z];}if(isNaN(ab[1])){ab[1]=(aa==u)?0:G[o];}if(ad[0]!==null){Y(G,I,ad[0]-ac[0]+ab[0]+"px");}if(ad[1]!==null){Y(G,N,ad[1]-ac[1]+ab[1]+"px");}if(!W){X=e.Dom._getXY(G);if((ad[0]!==null&&X[0]!=ad[0])||(ad[1]!==null&&X[1]!=ad[1])){e.Dom._setXY(G,{pos:ad,noRetry:true});}}},setX:function(W,G){e.Dom.setXY(W,[G,null]);},setY:function(G,W){e.Dom.setXY(G,[null,W]);},getRegion:function(G){var W=function(X){var Y=false;if(e.Dom._canPosition(X)){Y=e.Region.getRegion(X);}else{}return Y;};return e.Dom.batch(G,W,e.Dom,true);},getClientWidth:function(){return e.Dom.getViewportWidth();},getClientHeight:function(){return e.Dom.getViewportHeight();},getElementsByClassName:function(ab,af,ac,ae,X,ad){af=af||"*";ac=(ac)?e.Dom.get(ac):null||j;if(!ac){return[];}var W=[],G=ac.getElementsByTagName(af),Z=e.Dom.hasClass;for(var Y=0,aa=G.length;Y<aa;++Y){if(Z(G[Y],ab)){W[W.length]=G[Y];}}if(ae){e.Dom.batch(W,ae,X,ad);}return W;},hasClass:function(W,G){return e.Dom.batch(W,e.Dom._hasClass,G);},_hasClass:function(X,W){var G=false,Y;if(X&&W){Y=e.Dom._getAttribute(X,f)||i;if(Y){Y=Y.replace(/\s+/g,b);}if(W.exec){G=W.test(Y);}else{G=W&&(b+Y+b).indexOf(b+W+b)>-1;}}else{}return G;},addClass:function(W,G){return e.Dom.batch(W,e.Dom._addClass,G);},_addClass:function(X,W){var G=false,Y;if(X&&W){Y=e.Dom._getAttribute(X,f)||i;if(!e.Dom._hasClass(X,W)){e.Dom.setAttribute(X,f,a(Y+b+W));G=true;}}else{}return G;},removeClass:function(W,G){return e.Dom.batch(W,e.Dom._removeClass,G);},_removeClass:function(Y,X){var W=false,aa,Z,G;if(Y&&X){aa=e.Dom._getAttribute(Y,f)||i;e.Dom.setAttribute(Y,f,aa.replace(e.Dom._getClassRegex(X),i));Z=e.Dom._getAttribute(Y,f);if(aa!==Z){e.Dom.setAttribute(Y,f,a(Z));W=true;if(e.Dom._getAttribute(Y,f)===""){G=(Y.hasAttribute&&Y.hasAttribute(E))?E:f;Y.removeAttribute(G);}}}else{}return W;},replaceClass:function(X,W,G){return e.Dom.batch(X,e.Dom._replaceClass,{from:W,to:G});},_replaceClass:function(Y,X){var W,ab,aa,G=false,Z;if(Y&&X){ab=X.from;aa=X.to;if(!aa){G=false;}else{if(!ab){G=e.Dom._addClass(Y,X.to);}else{if(ab!==aa){Z=e.Dom._getAttribute(Y,f)||i;W=(b+Z.replace(e.Dom._getClassRegex(ab),b+aa).replace(/\s+/g,b)).split(e.Dom._getClassRegex(aa));W.splice(1,0,b+aa);e.Dom.setAttribute(Y,f,a(W.join(i)));G=true;}}}}else{}return G;},generateId:function(G,X){X=X||"yui-gen";var W=function(Y){if(Y&&Y.id){return Y.id;}var Z=X+YAHOO.env._id_counter++;
if(Y){if(Y[C]&&Y[C].getElementById(Z)){return e.Dom.generateId(Y,Z+X);}Y.id=Z;}return Z;};return e.Dom.batch(G,W,e.Dom,true)||W.apply(e.Dom,arguments);},isAncestor:function(W,X){W=e.Dom.get(W);X=e.Dom.get(X);var G=false;if((W&&X)&&(W[K]&&X[K])){if(W.contains&&W!==X){G=W.contains(X);}else{if(W.compareDocumentPosition){G=!!(W.compareDocumentPosition(X)&16);}}}else{}return G;},inDocument:function(G,W){return e.Dom._inDoc(e.Dom.get(G),W);},_inDoc:function(W,X){var G=false;if(W&&W[c]){X=X||W[C];G=e.Dom.isAncestor(X[U],W);}else{}return G;},getElementsBy:function(W,af,ab,ad,X,ac,ae){af=af||"*";ab=(ab)?e.Dom.get(ab):null||j;var aa=(ae)?null:[],G;if(ab){G=ab.getElementsByTagName(af);for(var Y=0,Z=G.length;Y<Z;++Y){if(W(G[Y])){if(ae){aa=G[Y];break;}else{aa[aa.length]=G[Y];}}}if(ad){e.Dom.batch(aa,ad,X,ac);}}return aa;},getElementBy:function(X,G,W){return e.Dom.getElementsBy(X,G,W,null,null,null,true);},batch:function(X,ab,aa,Z){var Y=[],W=(Z)?aa:null;X=(X&&(X[c]||X.item))?X:e.Dom.get(X);if(X&&ab){if(X[c]||X.length===undefined){return ab.call(W,X,aa);}for(var G=0;G<X.length;++G){Y[Y.length]=ab.call(W||X[G],X[G],aa);}}else{return false;}return Y;},getDocumentHeight:function(){var W=(j[S]!=l||h)?j.body.scrollHeight:v.scrollHeight,G=Math.max(W,e.Dom.getViewportHeight());return G;},getDocumentWidth:function(){var W=(j[S]!=l||h)?j.body.scrollWidth:v.scrollWidth,G=Math.max(W,e.Dom.getViewportWidth());return G;},getViewportHeight:function(){var G=self.innerHeight,W=j[S];if((W||s)&&!d){G=(W==l)?v.clientHeight:j.body.clientHeight;}return G;},getViewportWidth:function(){var G=self.innerWidth,W=j[S];if(W||s){G=(W==l)?v.clientWidth:j.body.clientWidth;}return G;},getAncestorBy:function(G,W){while((G=G[x])){if(e.Dom._testElement(G,W)){return G;}}return null;},getAncestorByClassName:function(W,G){W=e.Dom.get(W);if(!W){return null;}var X=function(Y){return e.Dom.hasClass(Y,G);};return e.Dom.getAncestorBy(W,X);},getAncestorByTagName:function(W,G){W=e.Dom.get(W);if(!W){return null;}var X=function(Y){return Y[c]&&Y[c].toUpperCase()==G.toUpperCase();};return e.Dom.getAncestorBy(W,X);},getPreviousSiblingBy:function(G,W){while(G){G=G.previousSibling;if(e.Dom._testElement(G,W)){return G;}}return null;},getPreviousSibling:function(G){G=e.Dom.get(G);if(!G){return null;}return e.Dom.getPreviousSiblingBy(G);},getNextSiblingBy:function(G,W){while(G){G=G.nextSibling;if(e.Dom._testElement(G,W)){return G;}}return null;},getNextSibling:function(G){G=e.Dom.get(G);if(!G){return null;}return e.Dom.getNextSiblingBy(G);},getFirstChildBy:function(G,X){var W=(e.Dom._testElement(G.firstChild,X))?G.firstChild:null;return W||e.Dom.getNextSiblingBy(G.firstChild,X);},getFirstChild:function(G,W){G=e.Dom.get(G);if(!G){return null;}return e.Dom.getFirstChildBy(G);},getLastChildBy:function(G,X){if(!G){return null;}var W=(e.Dom._testElement(G.lastChild,X))?G.lastChild:null;return W||e.Dom.getPreviousSiblingBy(G.lastChild,X);},getLastChild:function(G){G=e.Dom.get(G);return e.Dom.getLastChildBy(G);},getChildrenBy:function(W,Y){var X=e.Dom.getFirstChildBy(W,Y),G=X?[X]:[];e.Dom.getNextSiblingBy(X,function(Z){if(!Y||Y(Z)){G[G.length]=Z;}return false;});return G;},getChildren:function(G){G=e.Dom.get(G);if(!G){}return e.Dom.getChildrenBy(G);},getDocumentScrollLeft:function(G){G=G||j;return Math.max(G[U].scrollLeft,G.body.scrollLeft);},getDocumentScrollTop:function(G){G=G||j;return Math.max(G[U].scrollTop,G.body.scrollTop);},insertBefore:function(W,G){W=e.Dom.get(W);G=e.Dom.get(G);if(!W||!G||!G[x]){return null;}return G[x].insertBefore(W,G);},insertAfter:function(W,G){W=e.Dom.get(W);G=e.Dom.get(G);if(!W||!G||!G[x]){return null;}if(G.nextSibling){return G[x].insertBefore(W,G.nextSibling);}else{return G[x].appendChild(W);}},getClientRegion:function(){var X=e.Dom.getDocumentScrollTop(),W=e.Dom.getDocumentScrollLeft(),Y=e.Dom.getViewportWidth()+W,G=e.Dom.getViewportHeight()+X;return new e.Region(X,Y,G,W);},setAttribute:function(W,G,X){e.Dom.batch(W,e.Dom._setAttribute,{attr:G,val:X});},_setAttribute:function(X,W){var G=e.Dom._toCamel(W.attr),Y=W.val;if(X&&X.setAttribute){if(e.Dom.DOT_ATTRIBUTES[G]&&X.tagName&&X.tagName!="BUTTON"){X[G]=Y;}else{G=e.Dom.CUSTOM_ATTRIBUTES[G]||G;X.setAttribute(G,Y);}}else{}},getAttribute:function(W,G){return e.Dom.batch(W,e.Dom._getAttribute,G);},_getAttribute:function(W,G){var X;G=e.Dom.CUSTOM_ATTRIBUTES[G]||G;if(e.Dom.DOT_ATTRIBUTES[G]){X=W[G];}else{if(W&&"getAttribute" in W){if(/^(?:href|src)$/.test(G)){X=W.getAttribute(G,2);}else{X=W.getAttribute(G);}}else{}}return X;},_toCamel:function(W){var X=B;function G(Y,Z){return Z.toUpperCase();}return X[W]||(X[W]=W.indexOf("-")===-1?W:W.replace(/-([a-z])/gi,G));},_getClassRegex:function(W){var G;if(W!==undefined){if(W.exec){G=W;}else{G=F[W];if(!G){W=W.replace(e.Dom._patterns.CLASS_RE_TOKENS,"\\$1");W=W.replace(/\s+/g,b);G=F[W]=new RegExp(R+W+J,t);}}}return G;},_patterns:{ROOT_TAG:/^body|html$/i,CLASS_RE_TOKENS:/([\.\(\)\^\$\*\+\?\|\[\]\{\}\\])/g},_testElement:function(G,W){return G&&G[K]==1&&(!W||W(G));},_calcBorders:function(X,Y){var W=parseInt(e.Dom[V](X,q),10)||0,G=parseInt(e.Dom[V](X,P),10)||0;if(g){if(m.test(X[c])){W=0;G=0;}}Y[0]+=G;Y[1]+=W;return Y;}};var r=e.Dom[V];if(L.opera){e.Dom[V]=function(W,G){var X=r(W,G);if(w.test(G)){X=e.Dom.Color.toRGB(X);}return X;};}if(L.webkit){e.Dom[V]=function(W,G){var X=r(W,G);if(X==="rgba(0, 0, 0, 0)"){X="transparent";}return X;};}if(L.ie&&L.ie>=8){e.Dom.DOT_ATTRIBUTES.type=true;}})();YAHOO.util.Region=function(d,e,a,c){this.top=d;this.y=d;this[1]=d;this.right=e;this.bottom=a;this.left=c;this.x=c;this[0]=c;this.width=this.right-this.left;this.height=this.bottom-this.top;};YAHOO.util.Region.prototype.contains=function(a){return(a.left>=this.left&&a.right<=this.right&&a.top>=this.top&&a.bottom<=this.bottom);};YAHOO.util.Region.prototype.getArea=function(){return((this.bottom-this.top)*(this.right-this.left));};YAHOO.util.Region.prototype.intersect=function(f){var d=Math.max(this.top,f.top),e=Math.min(this.right,f.right),a=Math.min(this.bottom,f.bottom),c=Math.max(this.left,f.left);
if(a>=d&&e>=c){return new YAHOO.util.Region(d,e,a,c);}else{return null;}};YAHOO.util.Region.prototype.union=function(f){var d=Math.min(this.top,f.top),e=Math.max(this.right,f.right),a=Math.max(this.bottom,f.bottom),c=Math.min(this.left,f.left);return new YAHOO.util.Region(d,e,a,c);};YAHOO.util.Region.prototype.toString=function(){return("Region {"+"top: "+this.top+", right: "+this.right+", bottom: "+this.bottom+", left: "+this.left+", height: "+this.height+", width: "+this.width+"}");};YAHOO.util.Region.getRegion=function(e){var g=YAHOO.util.Dom.getXY(e),d=g[1],f=g[0]+e.offsetWidth,a=g[1]+e.offsetHeight,c=g[0];return new YAHOO.util.Region(d,f,a,c);};YAHOO.util.Point=function(a,b){if(YAHOO.lang.isArray(a)){b=a[1];a=a[0];}YAHOO.util.Point.superclass.constructor.call(this,b,a,b,a);};YAHOO.extend(YAHOO.util.Point,YAHOO.util.Region);(function(){var b=YAHOO.util,a="clientTop",f="clientLeft",j="parentNode",k="right",w="hasLayout",i="px",u="opacity",l="auto",d="borderLeftWidth",g="borderTopWidth",p="borderRightWidth",v="borderBottomWidth",s="visible",q="transparent",n="height",e="width",h="style",t="currentStyle",r=/^width|height$/,o=/^(\d[.\d]*)+(em|ex|px|gd|rem|vw|vh|vm|ch|mm|cm|in|pt|pc|deg|rad|ms|s|hz|khz|%){1}?/i,m={get:function(x,z){var y="",A=x[t][z];if(z===u){y=b.Dom.getStyle(x,u);}else{if(!A||(A.indexOf&&A.indexOf(i)>-1)){y=A;}else{if(b.Dom.IE_COMPUTED[z]){y=b.Dom.IE_COMPUTED[z](x,z);}else{if(o.test(A)){y=b.Dom.IE.ComputedStyle.getPixel(x,z);}else{y=A;}}}}return y;},getOffset:function(z,E){var B=z[t][E],x=E.charAt(0).toUpperCase()+E.substr(1),C="offset"+x,y="pixel"+x,A="",D;if(B==l){D=z[C];if(D===undefined){A=0;}A=D;if(r.test(E)){z[h][E]=D;if(z[C]>D){A=D-(z[C]-D);}z[h][E]=l;}}else{if(!z[h][y]&&!z[h][E]){z[h][E]=B;}A=z[h][y];}return A+i;},getBorderWidth:function(x,z){var y=null;if(!x[t][w]){x[h].zoom=1;}switch(z){case g:y=x[a];break;case v:y=x.offsetHeight-x.clientHeight-x[a];break;case d:y=x[f];break;case p:y=x.offsetWidth-x.clientWidth-x[f];break;}return y+i;},getPixel:function(y,x){var A=null,B=y[t][k],z=y[t][x];y[h][k]=z;A=y[h].pixelRight;y[h][k]=B;return A+i;},getMargin:function(y,x){var z;if(y[t][x]==l){z=0+i;}else{z=b.Dom.IE.ComputedStyle.getPixel(y,x);}return z;},getVisibility:function(y,x){var z;while((z=y[t])&&z[x]=="inherit"){y=y[j];}return(z)?z[x]:s;},getColor:function(y,x){return b.Dom.Color.toRGB(y[t][x])||q;},getBorderColor:function(y,x){var z=y[t],A=z[x]||z.color;return b.Dom.Color.toRGB(b.Dom.Color.toHex(A));}},c={};c.top=c.right=c.bottom=c.left=c[e]=c[n]=m.getOffset;c.color=m.getColor;c[g]=c[p]=c[v]=c[d]=m.getBorderWidth;c.marginTop=c.marginRight=c.marginBottom=c.marginLeft=m.getMargin;c.visibility=m.getVisibility;c.borderColor=c.borderTopColor=c.borderRightColor=c.borderBottomColor=c.borderLeftColor=m.getBorderColor;b.Dom.IE_COMPUTED=c;b.Dom.IE_ComputedStyle=m;})();(function(){var c="toString",a=parseInt,b=RegExp,d=YAHOO.util;d.Dom.Color={KEYWORDS:{black:"000",silver:"c0c0c0",gray:"808080",white:"fff",maroon:"800000",red:"f00",purple:"800080",fuchsia:"f0f",green:"008000",lime:"0f0",olive:"808000",yellow:"ff0",navy:"000080",blue:"00f",teal:"008080",aqua:"0ff"},re_RGB:/^rgb\(([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)\)$/i,re_hex:/^#?([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})$/i,re_hex3:/([0-9A-F])/gi,toRGB:function(e){if(!d.Dom.Color.re_RGB.test(e)){e=d.Dom.Color.toHex(e);}if(d.Dom.Color.re_hex.exec(e)){e="rgb("+[a(b.$1,16),a(b.$2,16),a(b.$3,16)].join(", ")+")";}return e;},toHex:function(f){f=d.Dom.Color.KEYWORDS[f]||f;if(d.Dom.Color.re_RGB.exec(f)){f=[Number(b.$1).toString(16),Number(b.$2).toString(16),Number(b.$3).toString(16)];for(var e=0;e<f.length;e++){if(f[e].length<2){f[e]="0"+f[e];}}f=f.join("");}if(f.length<6){f=f.replace(d.Dom.Color.re_hex3,"$1$1");}if(f!=="transparent"&&f.indexOf("#")<0){f="#"+f;}return f.toUpperCase();}};}());YAHOO.register("dom",YAHOO.util.Dom,{version:"2.9.0",build:"2800"});YAHOO.util.CustomEvent=function(d,c,b,a,e){this.type=d;this.scope=c||window;this.silent=b;this.fireOnce=e;this.fired=false;this.firedWith=null;this.signature=a||YAHOO.util.CustomEvent.LIST;this.subscribers=[];if(!this.silent){}var f="_YUICEOnSubscribe";if(d!==f){this.subscribeEvent=new YAHOO.util.CustomEvent(f,this,true);}this.lastError=null;};YAHOO.util.CustomEvent.LIST=0;YAHOO.util.CustomEvent.FLAT=1;YAHOO.util.CustomEvent.prototype={subscribe:function(b,c,d){if(!b){throw new Error("Invalid callback for subscriber to '"+this.type+"'");}if(this.subscribeEvent){this.subscribeEvent.fire(b,c,d);}var a=new YAHOO.util.Subscriber(b,c,d);if(this.fireOnce&&this.fired){this.notify(a,this.firedWith);}else{this.subscribers.push(a);}},unsubscribe:function(d,f){if(!d){return this.unsubscribeAll();}var e=false;for(var b=0,a=this.subscribers.length;b<a;++b){var c=this.subscribers[b];if(c&&c.contains(d,f)){this._delete(b);e=true;}}return e;},fire:function(){this.lastError=null;var h=[],a=this.subscribers.length;var d=[].slice.call(arguments,0),c=true,f,b=false;if(this.fireOnce){if(this.fired){return true;}else{this.firedWith=d;}}this.fired=true;if(!a&&this.silent){return true;}if(!this.silent){}var e=this.subscribers.slice();for(f=0;f<a;++f){var g=e[f];if(!g||!g.fn){b=true;}else{c=this.notify(g,d);if(false===c){if(!this.silent){}break;}}}return(c!==false);},notify:function(g,c){var b,i=null,f=g.getScope(this.scope),a=YAHOO.util.Event.throwErrors;if(!this.silent){}if(this.signature==YAHOO.util.CustomEvent.FLAT){if(c.length>0){i=c[0];}try{b=g.fn.call(f,i,g.obj);}catch(h){this.lastError=h;if(a){throw h;}}}else{try{b=g.fn.call(f,this.type,c,g.obj);}catch(d){this.lastError=d;if(a){throw d;}}}return b;},unsubscribeAll:function(){var a=this.subscribers.length,b;for(b=a-1;b>-1;b--){this._delete(b);}this.subscribers=[];return a;},_delete:function(a){var b=this.subscribers[a];if(b){delete b.fn;delete b.obj;}this.subscribers.splice(a,1);},toString:function(){return"CustomEvent: "+"'"+this.type+"', "+"context: "+this.scope;}};YAHOO.util.Subscriber=function(a,b,c){this.fn=a;this.obj=YAHOO.lang.isUndefined(b)?null:b;this.overrideContext=c;};YAHOO.util.Subscriber.prototype.getScope=function(a){if(this.overrideContext){if(this.overrideContext===true){return this.obj;}else{return this.overrideContext;}}return a;};YAHOO.util.Subscriber.prototype.contains=function(a,b){if(b){return(this.fn==a&&this.obj==b);}else{return(this.fn==a);}};YAHOO.util.Subscriber.prototype.toString=function(){return"Subscriber { obj: "+this.obj+", overrideContext: "+(this.overrideContext||"no")+" }";};if(!YAHOO.util.Event){YAHOO.util.Event=function(){var g=false,h=[],j=[],a=0,e=[],b=0,c={63232:38,63233:40,63234:37,63235:39,63276:33,63277:34,25:9},d=YAHOO.env.ua.ie,f="focusin",i="focusout";return{POLL_RETRYS:500,POLL_INTERVAL:40,EL:0,TYPE:1,FN:2,WFN:3,UNLOAD_OBJ:3,ADJ_SCOPE:4,OBJ:5,OVERRIDE:6,CAPTURE:7,lastError:null,isSafari:YAHOO.env.ua.webkit,webkit:YAHOO.env.ua.webkit,isIE:d,_interval:null,_dri:null,_specialTypes:{focusin:(d?"focusin":"focus"),focusout:(d?"focusout":"blur")},DOMReady:false,throwErrors:false,startInterval:function(){if(!this._interval){this._interval=YAHOO.lang.later(this.POLL_INTERVAL,this,this._tryPreloadAttach,null,true);}},onAvailable:function(q,m,o,p,n){var k=(YAHOO.lang.isString(q))?[q]:q;for(var l=0;l<k.length;l=l+1){e.push({id:k[l],fn:m,obj:o,overrideContext:p,checkReady:n});}a=this.POLL_RETRYS;this.startInterval();},onContentReady:function(n,k,l,m){this.onAvailable(n,k,l,m,true);},onDOMReady:function(){this.DOMReadyEvent.subscribe.apply(this.DOMReadyEvent,arguments);},_addListener:function(m,k,v,p,t,y){if(!v||!v.call){return false;}if(this._isValidCollection(m)){var w=true;for(var q=0,s=m.length;q<s;++q){w=this.on(m[q],k,v,p,t)&&w;}return w;}else{if(YAHOO.lang.isString(m)){var o=this.getEl(m);if(o){m=o;}else{this.onAvailable(m,function(){YAHOO.util.Event._addListener(m,k,v,p,t,y);});return true;}}}if(!m){return false;}if("unload"==k&&p!==this){j[j.length]=[m,k,v,p,t];return true;}var l=m;if(t){if(t===true){l=p;}else{l=t;}}var n=function(z){return v.call(l,YAHOO.util.Event.getEvent(z,m),p);};var x=[m,k,v,n,l,p,t,y];var r=h.length;h[r]=x;try{this._simpleAdd(m,k,n,y);}catch(u){this.lastError=u;this.removeListener(m,k,v);return false;}return true;},_getType:function(k){return this._specialTypes[k]||k;},addListener:function(m,p,l,n,o){var k=((p==f||p==i)&&!YAHOO.env.ua.ie)?true:false;return this._addListener(m,this._getType(p),l,n,o,k);},addFocusListener:function(l,k,m,n){return this.on(l,f,k,m,n);},removeFocusListener:function(l,k){return this.removeListener(l,f,k);},addBlurListener:function(l,k,m,n){return this.on(l,i,k,m,n);},removeBlurListener:function(l,k){return this.removeListener(l,i,k);},removeListener:function(l,k,r){var m,p,u;k=this._getType(k);if(typeof l=="string"){l=this.getEl(l);}else{if(this._isValidCollection(l)){var s=true;for(m=l.length-1;m>-1;m--){s=(this.removeListener(l[m],k,r)&&s);}return s;}}if(!r||!r.call){return this.purgeElement(l,false,k);}if("unload"==k){for(m=j.length-1;m>-1;m--){u=j[m];if(u&&u[0]==l&&u[1]==k&&u[2]==r){j.splice(m,1);return true;}}return false;}var n=null;var o=arguments[3];if("undefined"===typeof o){o=this._getCacheIndex(h,l,k,r);}if(o>=0){n=h[o];}if(!l||!n){return false;}var t=n[this.CAPTURE]===true?true:false;try{this._simpleRemove(l,k,n[this.WFN],t);}catch(q){this.lastError=q;return false;}delete h[o][this.WFN];delete h[o][this.FN];h.splice(o,1);return true;},getTarget:function(m,l){var k=m.target||m.srcElement;return this.resolveTextNode(k);},resolveTextNode:function(l){try{if(l&&3==l.nodeType){return l.parentNode;}}catch(k){return null;}return l;},getPageX:function(l){var k=l.pageX;if(!k&&0!==k){k=l.clientX||0;if(this.isIE){k+=this._getScrollLeft();}}return k;},getPageY:function(k){var l=k.pageY;if(!l&&0!==l){l=k.clientY||0;if(this.isIE){l+=this._getScrollTop();}}return l;},getXY:function(k){return[this.getPageX(k),this.getPageY(k)];},getRelatedTarget:function(l){var k=l.relatedTarget;
if(!k){if(l.type=="mouseout"){k=l.toElement;}else{if(l.type=="mouseover"){k=l.fromElement;}}}return this.resolveTextNode(k);},getTime:function(m){if(!m.time){var l=new Date().getTime();try{m.time=l;}catch(k){this.lastError=k;return l;}}return m.time;},stopEvent:function(k){this.stopPropagation(k);this.preventDefault(k);},stopPropagation:function(k){if(k.stopPropagation){k.stopPropagation();}else{k.cancelBubble=true;}},preventDefault:function(k){if(k.preventDefault){k.preventDefault();}else{k.returnValue=false;}},getEvent:function(m,k){var l=m||window.event;if(!l){var n=this.getEvent.caller;while(n){l=n.arguments[0];if(l&&Event==l.constructor){break;}n=n.caller;}}return l;},getCharCode:function(l){var k=l.keyCode||l.charCode||0;if(YAHOO.env.ua.webkit&&(k in c)){k=c[k];}return k;},_getCacheIndex:function(n,q,r,p){for(var o=0,m=n.length;o<m;o=o+1){var k=n[o];if(k&&k[this.FN]==p&&k[this.EL]==q&&k[this.TYPE]==r){return o;}}return -1;},generateId:function(k){var l=k.id;if(!l){l="yuievtautoid-"+b;++b;k.id=l;}return l;},_isValidCollection:function(l){try{return(l&&typeof l!=="string"&&l.length&&!l.tagName&&!l.alert&&typeof l[0]!=="undefined");}catch(k){return false;}},elCache:{},getEl:function(k){return(typeof k==="string")?document.getElementById(k):k;},clearCache:function(){},DOMReadyEvent:new YAHOO.util.CustomEvent("DOMReady",YAHOO,0,0,1),_load:function(l){if(!g){g=true;var k=YAHOO.util.Event;k._ready();k._tryPreloadAttach();}},_ready:function(l){var k=YAHOO.util.Event;if(!k.DOMReady){k.DOMReady=true;k.DOMReadyEvent.fire();k._simpleRemove(document,"DOMContentLoaded",k._ready);}},_tryPreloadAttach:function(){if(e.length===0){a=0;if(this._interval){this._interval.cancel();this._interval=null;}return;}if(this.locked){return;}if(this.isIE){if(!this.DOMReady){this.startInterval();return;}}this.locked=true;var q=!g;if(!q){q=(a>0&&e.length>0);}var p=[];var r=function(t,u){var s=t;if(u.overrideContext){if(u.overrideContext===true){s=u.obj;}else{s=u.overrideContext;}}u.fn.call(s,u.obj);};var l,k,o,n,m=[];for(l=0,k=e.length;l<k;l=l+1){o=e[l];if(o){n=this.getEl(o.id);if(n){if(o.checkReady){if(g||n.nextSibling||!q){m.push(o);e[l]=null;}}else{r(n,o);e[l]=null;}}else{p.push(o);}}}for(l=0,k=m.length;l<k;l=l+1){o=m[l];r(this.getEl(o.id),o);}a--;if(q){for(l=e.length-1;l>-1;l--){o=e[l];if(!o||!o.id){e.splice(l,1);}}this.startInterval();}else{if(this._interval){this._interval.cancel();this._interval=null;}}this.locked=false;},purgeElement:function(p,q,s){var n=(YAHOO.lang.isString(p))?this.getEl(p):p;var r=this.getListeners(n,s),o,k;if(r){for(o=r.length-1;o>-1;o--){var m=r[o];this.removeListener(n,m.type,m.fn);}}if(q&&n&&n.childNodes){for(o=0,k=n.childNodes.length;o<k;++o){this.purgeElement(n.childNodes[o],q,s);}}},getListeners:function(n,k){var q=[],m;if(!k){m=[h,j];}else{if(k==="unload"){m=[j];}else{k=this._getType(k);m=[h];}}var s=(YAHOO.lang.isString(n))?this.getEl(n):n;for(var p=0;p<m.length;p=p+1){var u=m[p];if(u){for(var r=0,t=u.length;r<t;++r){var o=u[r];if(o&&o[this.EL]===s&&(!k||k===o[this.TYPE])){q.push({type:o[this.TYPE],fn:o[this.FN],obj:o[this.OBJ],adjust:o[this.OVERRIDE],scope:o[this.ADJ_SCOPE],index:r});}}}}return(q.length)?q:null;},_unload:function(s){var m=YAHOO.util.Event,p,o,n,r,q,t=j.slice(),k;for(p=0,r=j.length;p<r;++p){n=t[p];if(n){try{k=window;if(n[m.ADJ_SCOPE]){if(n[m.ADJ_SCOPE]===true){k=n[m.UNLOAD_OBJ];}else{k=n[m.ADJ_SCOPE];}}n[m.FN].call(k,m.getEvent(s,n[m.EL]),n[m.UNLOAD_OBJ]);}catch(w){}t[p]=null;}}n=null;k=null;j=null;if(h){for(o=h.length-1;o>-1;o--){n=h[o];if(n){try{m.removeListener(n[m.EL],n[m.TYPE],n[m.FN],o);}catch(v){}}}n=null;}try{m._simpleRemove(window,"unload",m._unload);m._simpleRemove(window,"load",m._load);}catch(u){}},_getScrollLeft:function(){return this._getScroll()[1];},_getScrollTop:function(){return this._getScroll()[0];},_getScroll:function(){var k=document.documentElement,l=document.body;if(k&&(k.scrollTop||k.scrollLeft)){return[k.scrollTop,k.scrollLeft];}else{if(l){return[l.scrollTop,l.scrollLeft];}else{return[0,0];}}},regCE:function(){},_simpleAdd:function(){if(window.addEventListener){return function(m,n,l,k){m.addEventListener(n,l,(k));};}else{if(window.attachEvent){return function(m,n,l,k){m.attachEvent("on"+n,l);};}else{return function(){};}}}(),_simpleRemove:function(){if(window.removeEventListener){return function(m,n,l,k){m.removeEventListener(n,l,(k));};}else{if(window.detachEvent){return function(l,m,k){l.detachEvent("on"+m,k);};}else{return function(){};}}}()};}();(function(){var a=YAHOO.util.Event;a.on=a.addListener;a.onFocus=a.addFocusListener;a.onBlur=a.addBlurListener;
/*! DOMReady: based on work by: Dean Edwards/John Resig/Matthias Miller/Diego Perini */
if(a.isIE){if(self!==self.top){document.onreadystatechange=function(){if(document.readyState=="complete"){document.onreadystatechange=null;a._ready();}};}else{YAHOO.util.Event.onDOMReady(YAHOO.util.Event._tryPreloadAttach,YAHOO.util.Event,true);var b=document.createElement("p");a._dri=setInterval(function(){try{b.doScroll("left");clearInterval(a._dri);a._dri=null;a._ready();b=null;}catch(c){}},a.POLL_INTERVAL);}}else{if(a.webkit&&a.webkit<525){a._dri=setInterval(function(){var c=document.readyState;if("loaded"==c||"complete"==c){clearInterval(a._dri);a._dri=null;a._ready();}},a.POLL_INTERVAL);}else{a._simpleAdd(document,"DOMContentLoaded",a._ready);}}a._simpleAdd(window,"load",a._load);a._simpleAdd(window,"unload",a._unload);a._tryPreloadAttach();})();}YAHOO.util.EventProvider=function(){};YAHOO.util.EventProvider.prototype={__yui_events:null,__yui_subscribers:null,subscribe:function(a,c,f,e){this.__yui_events=this.__yui_events||{};var d=this.__yui_events[a];if(d){d.subscribe(c,f,e);}else{this.__yui_subscribers=this.__yui_subscribers||{};var b=this.__yui_subscribers;if(!b[a]){b[a]=[];}b[a].push({fn:c,obj:f,overrideContext:e});}},unsubscribe:function(c,e,g){this.__yui_events=this.__yui_events||{};var a=this.__yui_events;if(c){var f=a[c];if(f){return f.unsubscribe(e,g);}}else{var b=true;for(var d in a){if(YAHOO.lang.hasOwnProperty(a,d)){b=b&&a[d].unsubscribe(e,g);
}}return b;}return false;},unsubscribeAll:function(a){return this.unsubscribe(a);},createEvent:function(b,g){this.__yui_events=this.__yui_events||{};var e=g||{},d=this.__yui_events,f;if(d[b]){}else{f=new YAHOO.util.CustomEvent(b,e.scope||this,e.silent,YAHOO.util.CustomEvent.FLAT,e.fireOnce);d[b]=f;if(e.onSubscribeCallback){f.subscribeEvent.subscribe(e.onSubscribeCallback);}this.__yui_subscribers=this.__yui_subscribers||{};var a=this.__yui_subscribers[b];if(a){for(var c=0;c<a.length;++c){f.subscribe(a[c].fn,a[c].obj,a[c].overrideContext);}}}return d[b];},fireEvent:function(b){this.__yui_events=this.__yui_events||{};var d=this.__yui_events[b];if(!d){return null;}var a=[];for(var c=1;c<arguments.length;++c){a.push(arguments[c]);}return d.fire.apply(d,a);},hasEvent:function(a){if(this.__yui_events){if(this.__yui_events[a]){return true;}}return false;}};(function(){var a=YAHOO.util.Event,c=YAHOO.lang;YAHOO.util.KeyListener=function(d,i,e,f){if(!d){}else{if(!i){}else{if(!e){}}}if(!f){f=YAHOO.util.KeyListener.KEYDOWN;}var g=new YAHOO.util.CustomEvent("keyPressed");this.enabledEvent=new YAHOO.util.CustomEvent("enabled");this.disabledEvent=new YAHOO.util.CustomEvent("disabled");if(c.isString(d)){d=document.getElementById(d);}if(c.isFunction(e)){g.subscribe(e);}else{g.subscribe(e.fn,e.scope,e.correctScope);}function h(o,n){if(!i.shift){i.shift=false;}if(!i.alt){i.alt=false;}if(!i.ctrl){i.ctrl=false;}if(o.shiftKey==i.shift&&o.altKey==i.alt&&o.ctrlKey==i.ctrl){var j,m=i.keys,l;if(YAHOO.lang.isArray(m)){for(var k=0;k<m.length;k++){j=m[k];l=a.getCharCode(o);if(j==l){g.fire(l,o);break;}}}else{l=a.getCharCode(o);if(m==l){g.fire(l,o);}}}}this.enable=function(){if(!this.enabled){a.on(d,f,h);this.enabledEvent.fire(i);}this.enabled=true;};this.disable=function(){if(this.enabled){a.removeListener(d,f,h);this.disabledEvent.fire(i);}this.enabled=false;};this.toString=function(){return"KeyListener ["+i.keys+"] "+d.tagName+(d.id?"["+d.id+"]":"");};};var b=YAHOO.util.KeyListener;b.KEYDOWN="keydown";b.KEYUP="keyup";b.KEY={ALT:18,BACK_SPACE:8,CAPS_LOCK:20,CONTROL:17,DELETE:46,DOWN:40,END:35,ENTER:13,ESCAPE:27,HOME:36,LEFT:37,META:224,NUM_LOCK:144,PAGE_DOWN:34,PAGE_UP:33,PAUSE:19,PRINTSCREEN:44,RIGHT:39,SCROLL_LOCK:145,SHIFT:16,SPACE:32,TAB:9,UP:38};})();YAHOO.register("event",YAHOO.util.Event,{version:"2.9.0",build:"2800"});YAHOO.register("yahoo-dom-event", YAHOO, {version: "2.9.0", build: "2800"});
/*
Copyright (c) 2011, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://developer.yahoo.com/yui/license.html
version: 2.9.0
*/
(function() {

var Y = YAHOO.util;

/*
Copyright (c) 2006, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://developer.yahoo.net/yui/license.txt
*/

/**
 * The animation module provides allows effects to be added to HTMLElements.
 * @module animation
 * @requires yahoo, event, dom
 */

/**
 *
 * Base animation class that provides the interface for building animated effects.
 * <p>Usage: var myAnim = new YAHOO.util.Anim(el, { width: { from: 10, to: 100 } }, 1, YAHOO.util.Easing.easeOut);</p>
 * @class Anim
 * @namespace YAHOO.util
 * @requires YAHOO.util.AnimMgr
 * @requires YAHOO.util.Easing
 * @requires YAHOO.util.Dom
 * @requires YAHOO.util.Event
 * @requires YAHOO.util.CustomEvent
 * @constructor
 * @param {String | HTMLElement} el Reference to the element that will be animated
 * @param {Object} attributes The attribute(s) to be animated.  
 * Each attribute is an object with at minimum a "to" or "by" member defined.  
 * Additional optional members are "from" (defaults to current value), "units" (defaults to "px").  
 * All attribute names use camelCase.
 * @param {Number} duration (optional, defaults to 1 second) Length of animation (frames or seconds), defaults to time-based
 * @param {Function} method (optional, defaults to YAHOO.util.Easing.easeNone) Computes the values that are applied to the attributes per frame (generally a YAHOO.util.Easing method)
 */

var Anim = function(el, attributes, duration, method) {
    if (!el) {
    }
    this.init(el, attributes, duration, method); 
};

Anim.NAME = 'Anim';

Anim.prototype = {
    /**
     * Provides a readable name for the Anim instance.
     * @method toString
     * @return {String}
     */
    toString: function() {
        var el = this.getEl() || {};
        var id = el.id || el.tagName;
        return (this.constructor.NAME + ': ' + id);
    },
    
    patterns: { // cached for performance
        noNegatives:        /width|height|opacity|padding/i, // keep at zero or above
        offsetAttribute:  /^((width|height)|(top|left))$/, // use offsetValue as default
        defaultUnit:        /width|height|top$|bottom$|left$|right$/i, // use 'px' by default
        offsetUnit:         /\d+(em|%|en|ex|pt|in|cm|mm|pc)$/i // IE may return these, so convert these to offset
    },
    
    /**
     * Returns the value computed by the animation's "method".
     * @method doMethod
     * @param {String} attr The name of the attribute.
     * @param {Number} start The value this attribute should start from for this animation.
     * @param {Number} end  The value this attribute should end at for this animation.
     * @return {Number} The Value to be applied to the attribute.
     */
    doMethod: function(attr, start, end) {
        return this.method(this.currentFrame, start, end - start, this.totalFrames);
    },
    
    /**
     * Applies a value to an attribute.
     * @method setAttribute
     * @param {String} attr The name of the attribute.
     * @param {Number} val The value to be applied to the attribute.
     * @param {String} unit The unit ('px', '%', etc.) of the value.
     */
    setAttribute: function(attr, val, unit) {
        var el = this.getEl();
        if ( this.patterns.noNegatives.test(attr) ) {
            val = (val > 0) ? val : 0;
        }

        if (attr in el && !('style' in el && attr in el.style)) {
            el[attr] = val;
        } else {
            Y.Dom.setStyle(el, attr, val + unit);
        }
    },                        
    
    /**
     * Returns current value of the attribute.
     * @method getAttribute
     * @param {String} attr The name of the attribute.
     * @return {Number} val The current value of the attribute.
     */
    getAttribute: function(attr) {
        var el = this.getEl();
        var val = Y.Dom.getStyle(el, attr);

        if (val !== 'auto' && !this.patterns.offsetUnit.test(val)) {
            return parseFloat(val);
        }
        
        var a = this.patterns.offsetAttribute.exec(attr) || [];
        var pos = !!( a[3] ); // top or left
        var box = !!( a[2] ); // width or height
        
        if ('style' in el) {
            // use offsets for width/height and abs pos top/left
            if ( box || (Y.Dom.getStyle(el, 'position') == 'absolute' && pos) ) {
                val = el['offset' + a[0].charAt(0).toUpperCase() + a[0].substr(1)];
            } else { // default to zero for other 'auto'
                val = 0;
            }
        } else if (attr in el) {
            val = el[attr];
        }

        return val;
    },
    
    /**
     * Returns the unit to use when none is supplied.
     * @method getDefaultUnit
     * @param {attr} attr The name of the attribute.
     * @return {String} The default unit to be used.
     */
    getDefaultUnit: function(attr) {
         if ( this.patterns.defaultUnit.test(attr) ) {
            return 'px';
         }
         
         return '';
    },
        
    /**
     * Sets the actual values to be used during the animation.  Should only be needed for subclass use.
     * @method setRuntimeAttribute
     * @param {Object} attr The attribute object
     * @private 
     */
    setRuntimeAttribute: function(attr) {
        var start;
        var end;
        var attributes = this.attributes;

        this.runtimeAttributes[attr] = {};
        
        var isset = function(prop) {
            return (typeof prop !== 'undefined');
        };
        
        if ( !isset(attributes[attr]['to']) && !isset(attributes[attr]['by']) ) {
            return false; // note return; nothing to animate to
        }
        
        start = ( isset(attributes[attr]['from']) ) ? attributes[attr]['from'] : this.getAttribute(attr);

        // To beats by, per SMIL 2.1 spec
        if ( isset(attributes[attr]['to']) ) {
            end = attributes[attr]['to'];
        } else if ( isset(attributes[attr]['by']) ) {
            if (start.constructor == Array) {
                end = [];
                for (var i = 0, len = start.length; i < len; ++i) {
                    end[i] = start[i] + attributes[attr]['by'][i] * 1; // times 1 to cast "by" 
                }
            } else {
                end = start + attributes[attr]['by'] * 1;
            }
        }
        
        this.runtimeAttributes[attr].start = start;
        this.runtimeAttributes[attr].end = end;

        // set units if needed
        this.runtimeAttributes[attr].unit = ( isset(attributes[attr].unit) ) ?
                attributes[attr]['unit'] : this.getDefaultUnit(attr);
        return true;
    },

    /**
     * Constructor for Anim instance.
     * @method init
     * @param {String | HTMLElement} el Reference to the element that will be animated
     * @param {Object} attributes The attribute(s) to be animated.  
     * Each attribute is an object with at minimum a "to" or "by" member defined.  
     * Additional optional members are "from" (defaults to current value), "units" (defaults to "px").  
     * All attribute names use camelCase.
     * @param {Number} duration (optional, defaults to 1 second) Length of animation (frames or seconds), defaults to time-based
     * @param {Function} method (optional, defaults to YAHOO.util.Easing.easeNone) Computes the values that are applied to the attributes per frame (generally a YAHOO.util.Easing method)
     */ 
    init: function(el, attributes, duration, method) {
        /**
         * Whether or not the animation is running.
         * @property isAnimated
         * @private
         * @type Boolean
         */
        var isAnimated = false;
        
        /**
         * A Date object that is created when the animation begins.
         * @property startTime
         * @private
         * @type Date
         */
        var startTime = null;
        
        /**
         * The number of frames this animation was able to execute.
         * @property actualFrames
         * @private
         * @type Int
         */
        var actualFrames = 0; 

        /**
         * The element to be animated.
         * @property el
         * @private
         * @type HTMLElement
         */
        el = Y.Dom.get(el);
        
        /**
         * The collection of attributes to be animated.  
         * Each attribute must have at least a "to" or "by" defined in order to animate.  
         * If "to" is supplied, the animation will end with the attribute at that value.  
         * If "by" is supplied, the animation will end at that value plus its starting value. 
         * If both are supplied, "to" is used, and "by" is ignored. 
         * Optional additional member include "from" (the value the attribute should start animating from, defaults to current value), and "unit" (the units to apply to the values).
         * @property attributes
         * @type Object
         */
        this.attributes = attributes || {};
        
        /**
         * The length of the animation.  Defaults to "1" (second).
         * @property duration
         * @type Number
         */
        this.duration = !YAHOO.lang.isUndefined(duration) ? duration : 1;
        
        /**
         * The method that will provide values to the attribute(s) during the animation. 
         * Defaults to "YAHOO.util.Easing.easeNone".
         * @property method
         * @type Function
         */
        this.method = method || Y.Easing.easeNone;

        /**
         * Whether or not the duration should be treated as seconds.
         * Defaults to true.
         * @property useSeconds
         * @type Boolean
         */
        this.useSeconds = true; // default to seconds
        
        /**
         * The location of the current animation on the timeline.
         * In time-based animations, this is used by AnimMgr to ensure the animation finishes on time.
         * @property currentFrame
         * @type Int
         */
        this.currentFrame = 0;
        
        /**
         * The total number of frames to be executed.
         * In time-based animations, this is used by AnimMgr to ensure the animation finishes on time.
         * @property totalFrames
         * @type Int
         */
        this.totalFrames = Y.AnimMgr.fps;
        
        /**
         * Changes the animated element
         * @method setEl
         */
        this.setEl = function(element) {
            el = Y.Dom.get(element);
        };
        
        /**
         * Returns a reference to the animated element.
         * @method getEl
         * @return {HTMLElement}
         */
        this.getEl = function() { return el; };
        
        /**
         * Checks whether the element is currently animated.
         * @method isAnimated
         * @return {Boolean} current value of isAnimated.     
         */
        this.isAnimated = function() {
            return isAnimated;
        };
        
        /**
         * Returns the animation start time.
         * @method getStartTime
         * @return {Date} current value of startTime.      
         */
        this.getStartTime = function() {
            return startTime;
        };        
        
        this.runtimeAttributes = {};
        
        
        
        /**
         * Starts the animation by registering it with the animation manager. 
         * @method animate  
         */
        this.animate = function() {
            if ( this.isAnimated() ) {
                return false;
            }
            
            this.currentFrame = 0;
            
            this.totalFrames = ( this.useSeconds ) ? Math.ceil(Y.AnimMgr.fps * this.duration) : this.duration;
    
            if (this.duration === 0 && this.useSeconds) { // jump to last frame if zero second duration 
                this.totalFrames = 1; 
            }
            Y.AnimMgr.registerElement(this);
            return true;
        };
          
        /**
         * Stops the animation.  Normally called by AnimMgr when animation completes.
         * @method stop
         * @param {Boolean} finish (optional) If true, animation will jump to final frame.
         */ 
        this.stop = function(finish) {
            if (!this.isAnimated()) { // nothing to stop
                return false;
            }

            if (finish) {
                 this.currentFrame = this.totalFrames;
                 this._onTween.fire();
            }
            Y.AnimMgr.stop(this);
        };
        
        this._handleStart = function() {            
            this.onStart.fire();
            
            this.runtimeAttributes = {};
            for (var attr in this.attributes) {
                if (this.attributes.hasOwnProperty(attr)) {
                    this.setRuntimeAttribute(attr);
                }
            }
            
            isAnimated = true;
            actualFrames = 0;
            startTime = new Date(); 
        };
        
        /**
         * Feeds the starting and ending values for each animated attribute to doMethod once per frame, then applies the resulting value to the attribute(s).
         * @private
         */
         
        this._handleTween = function() {
            var data = {
                duration: new Date() - this.getStartTime(),
                currentFrame: this.currentFrame
            };
            
            data.toString = function() {
                return (
                    'duration: ' + data.duration +
                    ', currentFrame: ' + data.currentFrame
                );
            };
            
            this.onTween.fire(data);
            
            var runtimeAttributes = this.runtimeAttributes;
            
            for (var attr in runtimeAttributes) {
                if (runtimeAttributes.hasOwnProperty(attr)) {
                    this.setAttribute(attr, this.doMethod(attr, runtimeAttributes[attr].start, runtimeAttributes[attr].end), runtimeAttributes[attr].unit); 
                }
            }
            
            this.afterTween.fire(data);
            
            actualFrames += 1;
        };
        
        this._handleComplete = function() {
            var actual_duration = (new Date() - startTime) / 1000 ;
            
            var data = {
                duration: actual_duration,
                frames: actualFrames,
                fps: actualFrames / actual_duration
            };
            
            data.toString = function() {
                return (
                    'duration: ' + data.duration +
                    ', frames: ' + data.frames +
                    ', fps: ' + data.fps
                );
            };
            
            isAnimated = false;
            actualFrames = 0;
            this.onComplete.fire(data);
        };
        
        /**
         * Custom event that fires after onStart, useful in subclassing
         * @private
         */    
        this._onStart = new Y.CustomEvent('_start', this, true);

        /**
         * Custom event that fires when animation begins
         * Listen via subscribe method (e.g. myAnim.onStart.subscribe(someFunction)
         * @event onStart
         */    
        this.onStart = new Y.CustomEvent('start', this);
        
        /**
         * Custom event that fires between each frame
         * Listen via subscribe method (e.g. myAnim.onTween.subscribe(someFunction)
         * @event onTween
         */
        this.onTween = new Y.CustomEvent('tween', this);
        
        /**
         * Custom event that fires between each frame
         * Listen via subscribe method (e.g. myAnim.afterTween.subscribe(someFunction)
         * @event afterTween
         */
        this.afterTween = new Y.CustomEvent('afterTween', this);
        
        /**
         * Custom event that fires after onTween
         * @private
         */
        this._onTween = new Y.CustomEvent('_tween', this, true);
        
        /**
         * Custom event that fires when animation ends
         * Listen via subscribe method (e.g. myAnim.onComplete.subscribe(someFunction)
         * @event onComplete
         */
        this.onComplete = new Y.CustomEvent('complete', this);
        /**
         * Custom event that fires after onComplete
         * @private
         */
        this._onComplete = new Y.CustomEvent('_complete', this, true);

        this._onStart.subscribe(this._handleStart);
        this._onTween.subscribe(this._handleTween);
        this._onComplete.subscribe(this._handleComplete);
    }
};

    Y.Anim = Anim;
})();
/**
 * Handles animation queueing and threading.
 * Used by Anim and subclasses.
 * @class AnimMgr
 * @namespace YAHOO.util
 */
YAHOO.util.AnimMgr = new function() {
    /** 
     * Reference to the animation Interval.
     * @property thread
     * @private
     * @type Int
     */
    var thread = null;
    
    /** 
     * The current queue of registered animation objects.
     * @property queue
     * @private
     * @type Array
     */    
    var queue = [];

    /** 
     * The number of active animations.
     * @property tweenCount
     * @private
     * @type Int
     */        
    var tweenCount = 0;

    /** 
     * Base frame rate (frames per second). 
     * Arbitrarily high for better x-browser calibration (slower browsers drop more frames).
     * @property fps
     * @type Int
     * 
     */
    this.fps = 1000;

    /** 
     * Interval delay in milliseconds, defaults to fastest possible.
     * @property delay
     * @type Int
     * 
     */
    this.delay = 20;

    /**
     * Adds an animation instance to the animation queue.
     * All animation instances must be registered in order to animate.
     * @method registerElement
     * @param {object} tween The Anim instance to be be registered
     */
    this.registerElement = function(tween) {
        queue[queue.length] = tween;
        tweenCount += 1;
        tween._onStart.fire();
        this.start();
    };
    
    var _unregisterQueue = [];
    var _unregistering = false;

    var doUnregister = function() {
        var next_args = _unregisterQueue.shift();
        unRegister.apply(YAHOO.util.AnimMgr,next_args);
        if (_unregisterQueue.length) {
            arguments.callee();
        }
    };

    var unRegister = function(tween, index) {
        index = index || getIndex(tween);
        if (!tween.isAnimated() || index === -1) {
            return false;
        }
        
        tween._onComplete.fire();
        queue.splice(index, 1);

        tweenCount -= 1;
        if (tweenCount <= 0) {
            this.stop();
        }

        return true;
    };

    /**
     * removes an animation instance from the animation queue.
     * All animation instances must be registered in order to animate.
     * @method unRegister
     * @param {object} tween The Anim instance to be be registered
     * @param {Int} index The index of the Anim instance
     * @private
     */
    this.unRegister = function() {
        _unregisterQueue.push(arguments);
        if (!_unregistering) {
            _unregistering = true;
            doUnregister();
            _unregistering = false;
        }
    }

    /**
     * Starts the animation thread.
	* Only one thread can run at a time.
     * @method start
     */    
    this.start = function() {
        if (thread === null) {
            thread = setInterval(this.run, this.delay);
        }
    };

    /**
     * Stops the animation thread or a specific animation instance.
     * @method stop
     * @param {object} tween A specific Anim instance to stop (optional)
     * If no instance given, Manager stops thread and all animations.
     */    
    this.stop = function(tween) {
        if (!tween) {
            clearInterval(thread);
            
            for (var i = 0, len = queue.length; i < len; ++i) {
                this.unRegister(queue[0], 0);  
            }

            queue = [];
            thread = null;
            tweenCount = 0;
        }
        else {
            this.unRegister(tween);
        }
    };
    
    /**
     * Called per Interval to handle each animation frame.
     * @method run
     */    
    this.run = function() {
        for (var i = 0, len = queue.length; i < len; ++i) {
            var tween = queue[i];
            if ( !tween || !tween.isAnimated() ) { continue; }

            if (tween.currentFrame < tween.totalFrames || tween.totalFrames === null)
            {
                tween.currentFrame += 1;
                
                if (tween.useSeconds) {
                    correctFrame(tween);
                }
                tween._onTween.fire();          
            }
            else { YAHOO.util.AnimMgr.stop(tween, i); }
        }
    };
    
    var getIndex = function(anim) {
        for (var i = 0, len = queue.length; i < len; ++i) {
            if (queue[i] === anim) {
                return i; // note return;
            }
        }
        return -1;
    };
    
    /**
     * On the fly frame correction to keep animation on time.
     * @method correctFrame
     * @private
     * @param {Object} tween The Anim instance being corrected.
     */
    var correctFrame = function(tween) {
        var frames = tween.totalFrames;
        var frame = tween.currentFrame;
        var expected = (tween.currentFrame * tween.duration * 1000 / tween.totalFrames);
        var elapsed = (new Date() - tween.getStartTime());
        var tweak = 0;
        
        if (elapsed < tween.duration * 1000) { // check if falling behind
            tweak = Math.round((elapsed / expected - 1) * tween.currentFrame);
        } else { // went over duration, so jump to end
            tweak = frames - (frame + 1); 
        }
        if (tweak > 0 && isFinite(tweak)) { // adjust if needed
            if (tween.currentFrame + tweak >= frames) {// dont go past last frame
                tweak = frames - (frame + 1);
            }
            
            tween.currentFrame += tweak;      
        }
    };
    this._queue = queue;
    this._getIndex = getIndex;
};
/**
 * Used to calculate Bezier splines for any number of control points.
 * @class Bezier
 * @namespace YAHOO.util
 *
 */
YAHOO.util.Bezier = new function() {
    /**
     * Get the current position of the animated element based on t.
     * Each point is an array of "x" and "y" values (0 = x, 1 = y)
     * At least 2 points are required (start and end).
     * First point is start. Last point is end.
     * Additional control points are optional.     
     * @method getPosition
     * @param {Array} points An array containing Bezier points
     * @param {Number} t A number between 0 and 1 which is the basis for determining current position
     * @return {Array} An array containing int x and y member data
     */
    this.getPosition = function(points, t) {  
        var n = points.length;
        var tmp = [];

        for (var i = 0; i < n; ++i){
            tmp[i] = [points[i][0], points[i][1]]; // save input
        }
        
        for (var j = 1; j < n; ++j) {
            for (i = 0; i < n - j; ++i) {
                tmp[i][0] = (1 - t) * tmp[i][0] + t * tmp[parseInt(i + 1, 10)][0];
                tmp[i][1] = (1 - t) * tmp[i][1] + t * tmp[parseInt(i + 1, 10)][1]; 
            }
        }
    
        return [ tmp[0][0], tmp[0][1] ]; 
    
    };
};
(function() {
/**
 * Anim subclass for color transitions.
 * <p>Usage: <code>var myAnim = new Y.ColorAnim(el, { backgroundColor: { from: '#FF0000', to: '#FFFFFF' } }, 1, Y.Easing.easeOut);</code> Color values can be specified with either 112233, #112233, 
 * [255,255,255], or rgb(255,255,255)</p>
 * @class ColorAnim
 * @namespace YAHOO.util
 * @requires YAHOO.util.Anim
 * @requires YAHOO.util.AnimMgr
 * @requires YAHOO.util.Easing
 * @requires YAHOO.util.Bezier
 * @requires YAHOO.util.Dom
 * @requires YAHOO.util.Event
 * @constructor
 * @extends YAHOO.util.Anim
 * @param {HTMLElement | String} el Reference to the element that will be animated
 * @param {Object} attributes The attribute(s) to be animated.
 * Each attribute is an object with at minimum a "to" or "by" member defined.
 * Additional optional members are "from" (defaults to current value), "units" (defaults to "px").
 * All attribute names use camelCase.
 * @param {Number} duration (optional, defaults to 1 second) Length of animation (frames or seconds), defaults to time-based
 * @param {Function} method (optional, defaults to YAHOO.util.Easing.easeNone) Computes the values that are applied to the attributes per frame (generally a YAHOO.util.Easing method)
 */
    var ColorAnim = function(el, attributes, duration,  method) {
        ColorAnim.superclass.constructor.call(this, el, attributes, duration, method);
    };
    
    ColorAnim.NAME = 'ColorAnim';

    ColorAnim.DEFAULT_BGCOLOR = '#fff';
    // shorthand
    var Y = YAHOO.util;
    YAHOO.extend(ColorAnim, Y.Anim);

    var superclass = ColorAnim.superclass;
    var proto = ColorAnim.prototype;
    
    proto.patterns.color = /color$/i;
    proto.patterns.rgb            = /^rgb\(([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)\)$/i;
    proto.patterns.hex            = /^#?([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})$/i;
    proto.patterns.hex3          = /^#?([0-9A-F]{1})([0-9A-F]{1})([0-9A-F]{1})$/i;
    proto.patterns.transparent = /^transparent|rgba\(0, 0, 0, 0\)$/; // need rgba for safari
    
    /**
     * Attempts to parse the given string and return a 3-tuple.
     * @method parseColor
     * @param {String} s The string to parse.
     * @return {Array} The 3-tuple of rgb values.
     */
    proto.parseColor = function(s) {
        if (s.length == 3) { return s; }
    
        var c = this.patterns.hex.exec(s);
        if (c && c.length == 4) {
            return [ parseInt(c[1], 16), parseInt(c[2], 16), parseInt(c[3], 16) ];
        }
    
        c = this.patterns.rgb.exec(s);
        if (c && c.length == 4) {
            return [ parseInt(c[1], 10), parseInt(c[2], 10), parseInt(c[3], 10) ];
        }
    
        c = this.patterns.hex3.exec(s);
        if (c && c.length == 4) {
            return [ parseInt(c[1] + c[1], 16), parseInt(c[2] + c[2], 16), parseInt(c[3] + c[3], 16) ];
        }
        
        return null;
    };

    proto.getAttribute = function(attr) {
        var el = this.getEl();
        if (this.patterns.color.test(attr) ) {
            var val = YAHOO.util.Dom.getStyle(el, attr);
            
            var that = this;
            if (this.patterns.transparent.test(val)) { // bgcolor default
                var parent = YAHOO.util.Dom.getAncestorBy(el, function(node) {
                    return !that.patterns.transparent.test(val);
                });

                if (parent) {
                    val = Y.Dom.getStyle(parent, attr);
                } else {
                    val = ColorAnim.DEFAULT_BGCOLOR;
                }
            }
        } else {
            val = superclass.getAttribute.call(this, attr);
        }

        return val;
    };
    
    proto.doMethod = function(attr, start, end) {
        var val;
    
        if ( this.patterns.color.test(attr) ) {
            val = [];
            for (var i = 0, len = start.length; i < len; ++i) {
                val[i] = superclass.doMethod.call(this, attr, start[i], end[i]);
            }
            
            val = 'rgb('+Math.floor(val[0])+','+Math.floor(val[1])+','+Math.floor(val[2])+')';
        }
        else {
            val = superclass.doMethod.call(this, attr, start, end);
        }

        return val;
    };

    proto.setRuntimeAttribute = function(attr) {
        superclass.setRuntimeAttribute.call(this, attr);
        
        if ( this.patterns.color.test(attr) ) {
            var attributes = this.attributes;
            var start = this.parseColor(this.runtimeAttributes[attr].start);
            var end = this.parseColor(this.runtimeAttributes[attr].end);
            // fix colors if going "by"
            if ( typeof attributes[attr]['to'] === 'undefined' && typeof attributes[attr]['by'] !== 'undefined' ) {
                end = this.parseColor(attributes[attr].by);
            
                for (var i = 0, len = start.length; i < len; ++i) {
                    end[i] = start[i] + end[i];
                }
            }
            
            this.runtimeAttributes[attr].start = start;
            this.runtimeAttributes[attr].end = end;
        }
    };

    Y.ColorAnim = ColorAnim;
})();
/*!
TERMS OF USE - EASING EQUATIONS
Open source under the BSD License.
Copyright 2001 Robert Penner All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * Neither the name of the author nor the names of contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/**
 * Singleton that determines how an animation proceeds from start to end.
 * @class Easing
 * @namespace YAHOO.util
*/

YAHOO.util.Easing = {

    /**
     * Uniform speed between points.
     * @method easeNone
     * @param {Number} t Time value used to compute current value
     * @param {Number} b Starting value
     * @param {Number} c Delta between start and end values
     * @param {Number} d Total length of animation
     * @return {Number} The computed value for the current animation frame
     */
    easeNone: function (t, b, c, d) {
    	return c*t/d + b;
    },
    
    /**
     * Begins slowly and accelerates towards end.
     * @method easeIn
     * @param {Number} t Time value used to compute current value
     * @param {Number} b Starting value
     * @param {Number} c Delta between start and end values
     * @param {Number} d Total length of animation
     * @return {Number} The computed value for the current animation frame
     */
    easeIn: function (t, b, c, d) {
    	return c*(t/=d)*t + b;
    },

    /**
     * Begins quickly and decelerates towards end.
     * @method easeOut
     * @param {Number} t Time value used to compute current value
     * @param {Number} b Starting value
     * @param {Number} c Delta between start and end values
     * @param {Number} d Total length of animation
     * @return {Number} The computed value for the current animation frame
     */
    easeOut: function (t, b, c, d) {
    	return -c *(t/=d)*(t-2) + b;
    },
    
    /**
     * Begins slowly and decelerates towards end.
     * @method easeBoth
     * @param {Number} t Time value used to compute current value
     * @param {Number} b Starting value
     * @param {Number} c Delta between start and end values
     * @param {Number} d Total length of animation
     * @return {Number} The computed value for the current animation frame
     */
    easeBoth: function (t, b, c, d) {
    	if ((t/=d/2) < 1) {
            return c/2*t*t + b;
        }
        
    	return -c/2 * ((--t)*(t-2) - 1) + b;
    },
    
    /**
     * Begins slowly and accelerates towards end.
     * @method easeInStrong
     * @param {Number} t Time value used to compute current value
     * @param {Number} b Starting value
     * @param {Number} c Delta between start and end values
     * @param {Number} d Total length of animation
     * @return {Number} The computed value for the current animation frame
     */
    easeInStrong: function (t, b, c, d) {
    	return c*(t/=d)*t*t*t + b;
    },
    
    /**
     * Begins quickly and decelerates towards end.
     * @method easeOutStrong
     * @param {Number} t Time value used to compute current value
     * @param {Number} b Starting value
     * @param {Number} c Delta between start and end values
     * @param {Number} d Total length of animation
     * @return {Number} The computed value for the current animation frame
     */
    easeOutStrong: function (t, b, c, d) {
    	return -c * ((t=t/d-1)*t*t*t - 1) + b;
    },
    
    /**
     * Begins slowly and decelerates towards end.
     * @method easeBothStrong
     * @param {Number} t Time value used to compute current value
     * @param {Number} b Starting value
     * @param {Number} c Delta between start and end values
     * @param {Number} d Total length of animation
     * @return {Number} The computed value for the current animation frame
     */
    easeBothStrong: function (t, b, c, d) {
    	if ((t/=d/2) < 1) {
            return c/2*t*t*t*t + b;
        }
        
    	return -c/2 * ((t-=2)*t*t*t - 2) + b;
    },

    /**
     * Snap in elastic effect.
     * @method elasticIn
     * @param {Number} t Time value used to compute current value
     * @param {Number} b Starting value
     * @param {Number} c Delta between start and end values
     * @param {Number} d Total length of animation
     * @param {Number} a Amplitude (optional)
     * @param {Number} p Period (optional)
     * @return {Number} The computed value for the current animation frame
     */

    elasticIn: function (t, b, c, d, a, p) {
    	if (t == 0) {
            return b;
        }
        if ( (t /= d) == 1 ) {
            return b+c;
        }
        if (!p) {
            p=d*.3;
        }
        
    	if (!a || a < Math.abs(c)) {
            a = c; 
            var s = p/4;
        }
    	else {
            var s = p/(2*Math.PI) * Math.asin (c/a);
        }
        
    	return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
    },

    /**
     * Snap out elastic effect.
     * @method elasticOut
     * @param {Number} t Time value used to compute current value
     * @param {Number} b Starting value
     * @param {Number} c Delta between start and end values
     * @param {Number} d Total length of animation
     * @param {Number} a Amplitude (optional)
     * @param {Number} p Period (optional)
     * @return {Number} The computed value for the current animation frame
     */
    elasticOut: function (t, b, c, d, a, p) {
    	if (t == 0) {
            return b;
        }
        if ( (t /= d) == 1 ) {
            return b+c;
        }
        if (!p) {
            p=d*.3;
        }
        
    	if (!a || a < Math.abs(c)) {
            a = c;
            var s = p / 4;
        }
    	else {
            var s = p/(2*Math.PI) * Math.asin (c/a);
        }
        
    	return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
    },
    
    /**
     * Snap both elastic effect.
     * @method elasticBoth
     * @param {Number} t Time value used to compute current value
     * @param {Number} b Starting value
     * @param {Number} c Delta between start and end values
     * @param {Number} d Total length of animation
     * @param {Number} a Amplitude (optional)
     * @param {Number} p Period (optional)
     * @return {Number} The computed value for the current animation frame
     */
    elasticBoth: function (t, b, c, d, a, p) {
    	if (t == 0) {
            return b;
        }
        
        if ( (t /= d/2) == 2 ) {
            return b+c;
        }
        
        if (!p) {
            p = d*(.3*1.5);
        }
        
    	if ( !a || a < Math.abs(c) ) {
            a = c; 
            var s = p/4;
        }
    	else {
            var s = p/(2*Math.PI) * Math.asin (c/a);
        }
        
    	if (t < 1) {
            return -.5*(a*Math.pow(2,10*(t-=1)) * 
                    Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
        }
    	return a*Math.pow(2,-10*(t-=1)) * 
                Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
    },


    /**
     * Backtracks slightly, then reverses direction and moves to end.
     * @method backIn
     * @param {Number} t Time value used to compute current value
     * @param {Number} b Starting value
     * @param {Number} c Delta between start and end values
     * @param {Number} d Total length of animation
     * @param {Number} s Overshoot (optional)
     * @return {Number} The computed value for the current animation frame
     */
    backIn: function (t, b, c, d, s) {
    	if (typeof s == 'undefined') {
            s = 1.70158;
        }
    	return c*(t/=d)*t*((s+1)*t - s) + b;
    },

    /**
     * Overshoots end, then reverses and comes back to end.
     * @method backOut
     * @param {Number} t Time value used to compute current value
     * @param {Number} b Starting value
     * @param {Number} c Delta between start and end values
     * @param {Number} d Total length of animation
     * @param {Number} s Overshoot (optional)
     * @return {Number} The computed value for the current animation frame
     */
    backOut: function (t, b, c, d, s) {
    	if (typeof s == 'undefined') {
            s = 1.70158;
        }
    	return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
    },
    
    /**
     * Backtracks slightly, then reverses direction, overshoots end, 
     * then reverses and comes back to end.
     * @method backBoth
     * @param {Number} t Time value used to compute current value
     * @param {Number} b Starting value
     * @param {Number} c Delta between start and end values
     * @param {Number} d Total length of animation
     * @param {Number} s Overshoot (optional)
     * @return {Number} The computed value for the current animation frame
     */
    backBoth: function (t, b, c, d, s) {
    	if (typeof s == 'undefined') {
            s = 1.70158; 
        }
        
    	if ((t /= d/2 ) < 1) {
            return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
        }
    	return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
    },

    /**
     * Bounce off of start.
     * @method bounceIn
     * @param {Number} t Time value used to compute current value
     * @param {Number} b Starting value
     * @param {Number} c Delta between start and end values
     * @param {Number} d Total length of animation
     * @return {Number} The computed value for the current animation frame
     */
    bounceIn: function (t, b, c, d) {
    	return c - YAHOO.util.Easing.bounceOut(d-t, 0, c, d) + b;
    },
    
    /**
     * Bounces off end.
     * @method bounceOut
     * @param {Number} t Time value used to compute current value
     * @param {Number} b Starting value
     * @param {Number} c Delta between start and end values
     * @param {Number} d Total length of animation
     * @return {Number} The computed value for the current animation frame
     */
    bounceOut: function (t, b, c, d) {
    	if ((t/=d) < (1/2.75)) {
    		return c*(7.5625*t*t) + b;
    	} else if (t < (2/2.75)) {
    		return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
    	} else if (t < (2.5/2.75)) {
    		return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
    	}
        return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
    },
    
    /**
     * Bounces off start and end.
     * @method bounceBoth
     * @param {Number} t Time value used to compute current value
     * @param {Number} b Starting value
     * @param {Number} c Delta between start and end values
     * @param {Number} d Total length of animation
     * @return {Number} The computed value for the current animation frame
     */
    bounceBoth: function (t, b, c, d) {
    	if (t < d/2) {
            return YAHOO.util.Easing.bounceIn(t*2, 0, c, d) * .5 + b;
        }
    	return YAHOO.util.Easing.bounceOut(t*2-d, 0, c, d) * .5 + c*.5 + b;
    }
};

(function() {
/**
 * Anim subclass for moving elements along a path defined by the "points" 
 * member of "attributes".  All "points" are arrays with x, y coordinates.
 * <p>Usage: <code>var myAnim = new YAHOO.util.Motion(el, { points: { to: [800, 800] } }, 1, YAHOO.util.Easing.easeOut);</code></p>
 * @class Motion
 * @namespace YAHOO.util
 * @requires YAHOO.util.Anim
 * @requires YAHOO.util.AnimMgr
 * @requires YAHOO.util.Easing
 * @requires YAHOO.util.Bezier
 * @requires YAHOO.util.Dom
 * @requires YAHOO.util.Event
 * @requires YAHOO.util.CustomEvent 
 * @constructor
 * @extends YAHOO.util.ColorAnim
 * @param {String | HTMLElement} el Reference to the element that will be animated
 * @param {Object} attributes The attribute(s) to be animated.  
 * Each attribute is an object with at minimum a "to" or "by" member defined.  
 * Additional optional members are "from" (defaults to current value), "units" (defaults to "px").  
 * All attribute names use camelCase.
 * @param {Number} duration (optional, defaults to 1 second) Length of animation (frames or seconds), defaults to time-based
 * @param {Function} method (optional, defaults to YAHOO.util.Easing.easeNone) Computes the values that are applied to the attributes per frame (generally a YAHOO.util.Easing method)
 */
    var Motion = function(el, attributes, duration,  method) {
        if (el) { // dont break existing subclasses not using YAHOO.extend
            Motion.superclass.constructor.call(this, el, attributes, duration, method);
        }
    };


    Motion.NAME = 'Motion';

    // shorthand
    var Y = YAHOO.util;
    YAHOO.extend(Motion, Y.ColorAnim);
    
    var superclass = Motion.superclass;
    var proto = Motion.prototype;

    proto.patterns.points = /^points$/i;
    
    proto.setAttribute = function(attr, val, unit) {
        if (  this.patterns.points.test(attr) ) {
            unit = unit || 'px';
            superclass.setAttribute.call(this, 'left', val[0], unit);
            superclass.setAttribute.call(this, 'top', val[1], unit);
        } else {
            superclass.setAttribute.call(this, attr, val, unit);
        }
    };

    proto.getAttribute = function(attr) {
        if (  this.patterns.points.test(attr) ) {
            var val = [
                superclass.getAttribute.call(this, 'left'),
                superclass.getAttribute.call(this, 'top')
            ];
        } else {
            val = superclass.getAttribute.call(this, attr);
        }

        return val;
    };

    proto.doMethod = function(attr, start, end) {
        var val = null;

        if ( this.patterns.points.test(attr) ) {
            var t = this.method(this.currentFrame, 0, 100, this.totalFrames) / 100;				
            val = Y.Bezier.getPosition(this.runtimeAttributes[attr], t);
        } else {
            val = superclass.doMethod.call(this, attr, start, end);
        }
        return val;
    };

    proto.setRuntimeAttribute = function(attr) {
        if ( this.patterns.points.test(attr) ) {
            var el = this.getEl();
            var attributes = this.attributes;
            var start;
            var control = attributes['points']['control'] || [];
            var end;
            var i, len;
            
            if (control.length > 0 && !(control[0] instanceof Array) ) { // could be single point or array of points
                control = [control];
            } else { // break reference to attributes.points.control
                var tmp = []; 
                for (i = 0, len = control.length; i< len; ++i) {
                    tmp[i] = control[i];
                }
                control = tmp;
            }

            if (Y.Dom.getStyle(el, 'position') == 'static') { // default to relative
                Y.Dom.setStyle(el, 'position', 'relative');
            }
    
            if ( isset(attributes['points']['from']) ) {
                Y.Dom.setXY(el, attributes['points']['from']); // set position to from point
            } 
            else { Y.Dom.setXY( el, Y.Dom.getXY(el) ); } // set it to current position
            
            start = this.getAttribute('points'); // get actual top & left
            
            // TO beats BY, per SMIL 2.1 spec
            if ( isset(attributes['points']['to']) ) {
                end = translateValues.call(this, attributes['points']['to'], start);
                
                var pageXY = Y.Dom.getXY(this.getEl());
                for (i = 0, len = control.length; i < len; ++i) {
                    control[i] = translateValues.call(this, control[i], start);
                }

                
            } else if ( isset(attributes['points']['by']) ) {
                end = [ start[0] + attributes['points']['by'][0], start[1] + attributes['points']['by'][1] ];
                
                for (i = 0, len = control.length; i < len; ++i) {
                    control[i] = [ start[0] + control[i][0], start[1] + control[i][1] ];
                }
            }

            this.runtimeAttributes[attr] = [start];
            
            if (control.length > 0) {
                this.runtimeAttributes[attr] = this.runtimeAttributes[attr].concat(control); 
            }

            this.runtimeAttributes[attr][this.runtimeAttributes[attr].length] = end;
        }
        else {
            superclass.setRuntimeAttribute.call(this, attr);
        }
    };
    
    var translateValues = function(val, start) {
        var pageXY = Y.Dom.getXY(this.getEl());
        val = [ val[0] - pageXY[0] + start[0], val[1] - pageXY[1] + start[1] ];

        return val; 
    };
    
    var isset = function(prop) {
        return (typeof prop !== 'undefined');
    };

    Y.Motion = Motion;
})();
(function() {
/**
 * Anim subclass for scrolling elements to a position defined by the "scroll"
 * member of "attributes".  All "scroll" members are arrays with x, y scroll positions.
 * <p>Usage: <code>var myAnim = new YAHOO.util.Scroll(el, { scroll: { to: [0, 800] } }, 1, YAHOO.util.Easing.easeOut);</code></p>
 * @class Scroll
 * @namespace YAHOO.util
 * @requires YAHOO.util.Anim
 * @requires YAHOO.util.AnimMgr
 * @requires YAHOO.util.Easing
 * @requires YAHOO.util.Bezier
 * @requires YAHOO.util.Dom
 * @requires YAHOO.util.Event
 * @requires YAHOO.util.CustomEvent 
 * @extends YAHOO.util.ColorAnim
 * @constructor
 * @param {String or HTMLElement} el Reference to the element that will be animated
 * @param {Object} attributes The attribute(s) to be animated.  
 * Each attribute is an object with at minimum a "to" or "by" member defined.  
 * Additional optional members are "from" (defaults to current value), "units" (defaults to "px").  
 * All attribute names use camelCase.
 * @param {Number} duration (optional, defaults to 1 second) Length of animation (frames or seconds), defaults to time-based
 * @param {Function} method (optional, defaults to YAHOO.util.Easing.easeNone) Computes the values that are applied to the attributes per frame (generally a YAHOO.util.Easing method)
 */
    var Scroll = function(el, attributes, duration,  method) {
        if (el) { // dont break existing subclasses not using YAHOO.extend
            Scroll.superclass.constructor.call(this, el, attributes, duration, method);
        }
    };

    Scroll.NAME = 'Scroll';

    // shorthand
    var Y = YAHOO.util;
    YAHOO.extend(Scroll, Y.ColorAnim);
    
    var superclass = Scroll.superclass;
    var proto = Scroll.prototype;

    proto.doMethod = function(attr, start, end) {
        var val = null;
    
        if (attr == 'scroll') {
            val = [
                this.method(this.currentFrame, start[0], end[0] - start[0], this.totalFrames),
                this.method(this.currentFrame, start[1], end[1] - start[1], this.totalFrames)
            ];
            
        } else {
            val = superclass.doMethod.call(this, attr, start, end);
        }
        return val;
    };

    proto.getAttribute = function(attr) {
        var val = null;
        var el = this.getEl();
        
        if (attr == 'scroll') {
            val = [ el.scrollLeft, el.scrollTop ];
        } else {
            val = superclass.getAttribute.call(this, attr);
        }
        
        return val;
    };

    proto.setAttribute = function(attr, val, unit) {
        var el = this.getEl();
        
        if (attr == 'scroll') {
            el.scrollLeft = val[0];
            el.scrollTop = val[1];
        } else {
            superclass.setAttribute.call(this, attr, val, unit);
        }
    };

    Y.Scroll = Scroll;
})();
YAHOO.register("animation", YAHOO.util.Anim, {version: "2.9.0", build: "2800"});

/*
Copyright (c) 2011, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://developer.yahoo.com/yui/license.html
version: 2.9.0
*/
/**
 * The Connection Manager provides a simplified interface to the XMLHttpRequest
 * object.  It handles cross-browser instantiantion of XMLHttpRequest, negotiates the
 * interactive states and server response, returning the results to a pre-defined
 * callback you create.
 *
 * @namespace YAHOO.util
 * @module connection
 * @requires yahoo
 * @requires event
 */

/**
 * The Connection Manager singleton provides methods for creating and managing
 * asynchronous transactions.
 *
 * @class YAHOO.util.Connect
 */

YAHOO.util.Connect =
{
  /**
   * @description Array of MSFT ActiveX ids for XMLHttpRequest.
   * @property _msxml_progid
   * @private
   * @static
   * @type array
   */
    _msxml_progid:[
        'Microsoft.XMLHTTP',
        'MSXML2.XMLHTTP.3.0',
        'MSXML2.XMLHTTP'
        ],

  /**
   * @description Object literal of HTTP header(s)
   * @property _http_header
   * @private
   * @static
   * @type object
   */
    _http_headers:{},

  /**
   * @description Determines if HTTP headers are set.
   * @property _has_http_headers
   * @private
   * @static
   * @type boolean
   */
    _has_http_headers:false,

 /**
  * @description Determines if a default header of
  * Content-Type of 'application/x-www-form-urlencoded'
  * will be added to any client HTTP headers sent for POST
  * transactions.
  * @property _use_default_post_header
  * @private
  * @static
  * @type boolean
  */
    _use_default_post_header:true,

 /**
  * @description The default header used for POST transactions.
  * @property _default_post_header
  * @private
  * @static
  * @type boolean
  */
    _default_post_header:'application/x-www-form-urlencoded; charset=UTF-8',

 /**
  * @description The default header used for transactions involving the
  * use of HTML forms.
  * @property _default_form_header
  * @private
  * @static
  * @type boolean
  */
    _default_form_header:'application/x-www-form-urlencoded',

 /**
  * @description Determines if a default header of
  * 'X-Requested-With: XMLHttpRequest'
  * will be added to each transaction.
  * @property _use_default_xhr_header
  * @private
  * @static
  * @type boolean
  */
    _use_default_xhr_header:true,

 /**
  * @description The default header value for the label
  * "X-Requested-With".  This is sent with each
  * transaction, by default, to identify the
  * request as being made by YUI Connection Manager.
  * @property _default_xhr_header
  * @private
  * @static
  * @type boolean
  */
    _default_xhr_header:'XMLHttpRequest',

 /**
  * @description Determines if custom, default headers
  * are set for each transaction.
  * @property _has_default_header
  * @private
  * @static
  * @type boolean
  */
    _has_default_headers:true,

 /**
   * @description Property modified by setForm() to determine if the data
   * should be submitted as an HTML form.
   * @property _isFormSubmit
   * @private
   * @static
   * @type boolean
   */
	_isFormSubmit:false,

 /**
  * @description Determines if custom, default headers
  * are set for each transaction.
  * @property _has_default_header
  * @private
  * @static
  * @type boolean
  */
    _default_headers:{},

 /**
  * @description Collection of polling references to the polling mechanism in handleReadyState.
  * @property _poll
  * @private
  * @static
  * @type object
  */
    _poll:{},

 /**
  * @description Queue of timeout values for each transaction callback with a defined timeout value.
  * @property _timeOut
  * @private
  * @static
  * @type object
  */
    _timeOut:{},

  /**
   * @description The polling frequency, in milliseconds, for HandleReadyState.
   * when attempting to determine a transaction's XHR readyState.
   * The default is 50 milliseconds.
   * @property _polling_interval
   * @private
   * @static
   * @type int
   */
     _polling_interval:50,

  /**
   * @description A transaction counter that increments the transaction id for each transaction.
   * @property _transaction_id
   * @private
   * @static
   * @type int
   */
     _transaction_id:0,

  /**
   * @description Custom event that fires at the start of a transaction
   * @property startEvent
   * @private
   * @static
   * @type CustomEvent
   */
    startEvent: new YAHOO.util.CustomEvent('start'),

  /**
   * @description Custom event that fires when a transaction response has completed.
   * @property completeEvent
   * @private
   * @static
   * @type CustomEvent
   */
    completeEvent: new YAHOO.util.CustomEvent('complete'),

  /**
   * @description Custom event that fires when handleTransactionResponse() determines a
   * response in the HTTP 2xx range.
   * @property successEvent
   * @private
   * @static
   * @type CustomEvent
   */
    successEvent: new YAHOO.util.CustomEvent('success'),

  /**
   * @description Custom event that fires when handleTransactionResponse() determines a
   * response in the HTTP 4xx/5xx range.
   * @property failureEvent
   * @private
   * @static
   * @type CustomEvent
   */
    failureEvent: new YAHOO.util.CustomEvent('failure'),

  /**
   * @description Custom event that fires when a transaction is successfully aborted.
   * @property abortEvent
   * @private
   * @static
   * @type CustomEvent
   */
    abortEvent: new YAHOO.util.CustomEvent('abort'),

  /**
   * @description A reference table that maps callback custom events members to its specific
   * event name.
   * @property _customEvents
   * @private
   * @static
   * @type object
   */
    _customEvents:
    {
        onStart:['startEvent', 'start'],
        onComplete:['completeEvent', 'complete'],
        onSuccess:['successEvent', 'success'],
        onFailure:['failureEvent', 'failure'],
        onUpload:['uploadEvent', 'upload'],
        onAbort:['abortEvent', 'abort']
    },

  /**
   * @description Member to add an ActiveX id to the existing xml_progid array.
   * In the event(unlikely) a new ActiveX id is introduced, it can be added
   * without internal code modifications.
   * @method setProgId
   * @public
   * @static
   * @param {string} id The ActiveX id to be added to initialize the XHR object.
   * @return void
   */
    setProgId:function(id)
    {
        this._msxml_progid.unshift(id);
    },

  /**
   * @description Member to override the default POST header.
   * @method setDefaultPostHeader
   * @public
   * @static
   * @param {boolean} b Set and use default header - true or false .
   * @return void
   */
    setDefaultPostHeader:function(b)
    {
        if(typeof b == 'string'){
            this._default_post_header = b;
			this._use_default_post_header = true;

        }
        else if(typeof b == 'boolean'){
            this._use_default_post_header = b;
        }
    },

  /**
   * @description Member to override the default transaction header..
   * @method setDefaultXhrHeader
   * @public
   * @static
   * @param {boolean} b Set and use default header - true or false .
   * @return void
   */
    setDefaultXhrHeader:function(b)
    {
        if(typeof b == 'string'){
            this._default_xhr_header = b;
        }
        else{
            this._use_default_xhr_header = b;
        }
    },

  /**
   * @description Member to modify the default polling interval.
   * @method setPollingInterval
   * @public
   * @static
   * @param {int} i The polling interval in milliseconds.
   * @return void
   */
    setPollingInterval:function(i)
    {
        if(typeof i == 'number' && isFinite(i)){
            this._polling_interval = i;
        }
    },

  /**
   * @description Instantiates a XMLHttpRequest object and returns an object with two properties:
   * the XMLHttpRequest instance and the transaction id.
   * @method createXhrObject
   * @private
   * @static
   * @param {int} transactionId Property containing the transaction id for this transaction.
   * @return object
   */
    createXhrObject:function(transactionId)
    {
        var obj,http,i;
        try
        {
            // Instantiates XMLHttpRequest in non-IE browsers and assigns to http.
            http = new XMLHttpRequest();
            //  Object literal with http and tId properties
            obj = { conn:http, tId:transactionId, xhr: true };
        }
        catch(e)
        {
            for(i=0; i<this._msxml_progid.length; ++i){
                try
                {
                    // Instantiates XMLHttpRequest for IE and assign to http
                    http = new ActiveXObject(this._msxml_progid[i]);
                    //  Object literal with conn and tId properties
                    obj = { conn:http, tId:transactionId, xhr: true };
                    break;
                }
                catch(e1){}
            }
        }
        finally
        {
            return obj;
        }
    },

  /**
   * @description This method is called by asyncRequest to create a
   * valid connection object for the transaction.  It also passes a
   * transaction id and increments the transaction id counter.
   * @method getConnectionObject
   * @private
   * @static
   * @return {object}
   */
    getConnectionObject:function(t)
    {
        var o, tId = this._transaction_id;

        try
        {
            if(!t){
                o = this.createXhrObject(tId);
            }
            else{
                o = {tId:tId};
                if(t==='xdr'){
                    o.conn = this._transport;
                    o.xdr = true;
                }
                else if(t==='upload'){
                    o.upload = true;
                }
            }

            if(o){
                this._transaction_id++;
            }
        }
        catch(e){}
        return o;
    },

  /**
   * @description Method for initiating an asynchronous request via the XHR object.
   * @method asyncRequest
   * @public
   * @static
   * @param {string} method HTTP transaction method
   * @param {string} uri Fully qualified path of resource
   * @param {callback} callback User-defined callback function or object
   * @param {string} postData POST body
   * @return {object} Returns the connection object
   */
    asyncRequest:function(method, uri, callback, postData)
    {
        var args = callback&&callback.argument?callback.argument:null,
            YCM = this,
            o, t;

        if(this._isFileUpload){
            t = 'upload';
        }
        else if(callback && callback.xdr){
            t = 'xdr';
        }

        o = this.getConnectionObject(t);
        if(!o){
            return null;
        }
        else{

            // Intialize any transaction-specific custom events, if provided.
            if(callback && callback.customevents){
                this.initCustomEvents(o, callback);
            }

            if(this._isFormSubmit){
                if(this._isFileUpload){
                    window.setTimeout(function(){YCM.uploadFile(o, callback, uri, postData);}, 10);
                    return o;
                }

                // If the specified HTTP method is GET, setForm() will return an
                // encoded string that is concatenated to the uri to
                // create a querystring.
                if(method.toUpperCase() == 'GET'){
                    if(this._sFormData.length !== 0){
                        // If the URI already contains a querystring, append an ampersand
                        // and then concatenate _sFormData to the URI.
                        uri += ((uri.indexOf('?') == -1)?'?':'&') + this._sFormData;
                    }
                }
                else if(method.toUpperCase() == 'POST'){
                    // If POST data exist in addition to the HTML form data,
                    // it will be concatenated to the form data.
                    postData = postData?this._sFormData + "&" + postData:this._sFormData;
                }
            }

            if(method.toUpperCase() == 'GET' && (callback && callback.cache === false)){
                // If callback.cache is defined and set to false, a
                // timestamp value will be added to the querystring.
                uri += ((uri.indexOf('?') == -1)?'?':'&') + "rnd=" + new Date().valueOf().toString();
            }

            // Each transaction will automatically include a custom header of
            // "X-Requested-With: XMLHttpRequest" to identify the request as
            // having originated from Connection Manager.
            if(this._use_default_xhr_header){
                if(!this._default_headers['X-Requested-With']){
                    this.initHeader('X-Requested-With', this._default_xhr_header, true);
                }
            }

            //If the transaction method is POST and the POST header value is set to true
            //or a custom value, initalize the Content-Type header to this value.
            if((method.toUpperCase() === 'POST' && this._use_default_post_header) && this._isFormSubmit === false){
                this.initHeader('Content-Type', this._default_post_header);
            }

            if(o.xdr){
                this.xdr(o, method, uri, callback, postData);
                return o;
            }

            o.conn.open(method, uri, true);
            //Initialize all default and custom HTTP headers,
            if(this._has_default_headers || this._has_http_headers){
                this.setHeader(o);
            }

            this.handleReadyState(o, callback);
            o.conn.send(postData || '');

            // Reset the HTML form data and state properties as
            // soon as the data are submitted.
            if(this._isFormSubmit === true){
                this.resetFormState();
            }

            // Fire global custom event -- startEvent
            this.startEvent.fire(o, args);

            if(o.startEvent){
                // Fire transaction custom event -- startEvent
                o.startEvent.fire(o, args);
            }

            return o;
        }
    },

  /**
   * @description This method creates and subscribes custom events,
   * specific to each transaction
   * @method initCustomEvents
   * @private
   * @static
   * @param {object} o The connection object
   * @param {callback} callback The user-defined callback object
   * @return {void}
   */
    initCustomEvents:function(o, callback)
    {
        var prop;
        // Enumerate through callback.customevents members and bind/subscribe
        // events that match in the _customEvents table.
        for(prop in callback.customevents){
            if(this._customEvents[prop][0]){
                // Create the custom event
                o[this._customEvents[prop][0]] = new YAHOO.util.CustomEvent(this._customEvents[prop][1], (callback.scope)?callback.scope:null);

                // Subscribe the custom event
                o[this._customEvents[prop][0]].subscribe(callback.customevents[prop]);
            }
        }
    },

  /**
   * @description This method serves as a timer that polls the XHR object's readyState
   * property during a transaction, instead of binding a callback to the
   * onreadystatechange event.  Upon readyState 4, handleTransactionResponse
   * will process the response, and the timer will be cleared.
   * @method handleReadyState
   * @private
   * @static
   * @param {object} o The connection object
   * @param {callback} callback The user-defined callback object
   * @return {void}
   */

    handleReadyState:function(o, callback)

    {
        var oConn = this,
            args = (callback && callback.argument)?callback.argument:null;

        if(callback && callback.timeout){
            this._timeOut[o.tId] = window.setTimeout(function(){ oConn.abort(o, callback, true); }, callback.timeout);
        }

        this._poll[o.tId] = window.setInterval(
            function(){
                if(o.conn && o.conn.readyState === 4){

                    // Clear the polling interval for the transaction
                    // and remove the reference from _poll.
                    window.clearInterval(oConn._poll[o.tId]);
                    delete oConn._poll[o.tId];

                    if(callback && callback.timeout){
                        window.clearTimeout(oConn._timeOut[o.tId]);
                        delete oConn._timeOut[o.tId];
                    }

                    // Fire global custom event -- completeEvent
                    oConn.completeEvent.fire(o, args);

                    if(o.completeEvent){
                        // Fire transaction custom event -- completeEvent
                        o.completeEvent.fire(o, args);
                    }

                    oConn.handleTransactionResponse(o, callback);
                }
            }
        ,this._polling_interval);
    },

  /**
   * @description This method attempts to interpret the server response and
   * determine whether the transaction was successful, or if an error or
   * exception was encountered.
   * @method handleTransactionResponse
   * @private
   * @static
   * @param {object} o The connection object
   * @param {object} callback The user-defined callback object
   * @param {boolean} isAbort Determines if the transaction was terminated via abort().
   * @return {void}
   */
    handleTransactionResponse:function(o, callback, isAbort)
    {
        var httpStatus, responseObject,
            args = (callback && callback.argument)?callback.argument:null,
            xdrS = (o.r && o.r.statusText === 'xdr:success')?true:false,
            xdrF = (o.r && o.r.statusText === 'xdr:failure')?true:false,
            xdrA = isAbort;

        try
        {
            if((o.conn.status !== undefined && o.conn.status !== 0) || xdrS){
                // XDR requests will not have HTTP status defined. The
                // statusText property will define the response status
                // set by the Flash transport.
                httpStatus = o.conn.status;
            }
            else if(xdrF && !xdrA){
                // Set XDR transaction failure to a status of 0, which
                // resolves as an HTTP failure, instead of an exception.
                httpStatus = 0;
            }
            else{
                httpStatus = 13030;
            }
        }
        catch(e){

             // 13030 is a custom code to indicate the condition -- in Mozilla/FF --
             // when the XHR object's status and statusText properties are
             // unavailable, and a query attempt throws an exception.
            httpStatus = 13030;
        }

        if((httpStatus >= 200 && httpStatus < 300) || httpStatus === 1223 || xdrS){
            responseObject = o.xdr ? o.r : this.createResponseObject(o, args);
            if(callback && callback.success){
                if(!callback.scope){
                    callback.success(responseObject);
                }
                else{
                    // If a scope property is defined, the callback will be fired from
                    // the context of the object.
                    callback.success.apply(callback.scope, [responseObject]);
                }
            }

            // Fire global custom event -- successEvent
            this.successEvent.fire(responseObject);

            if(o.successEvent){
                // Fire transaction custom event -- successEvent
                o.successEvent.fire(responseObject);
            }
        }
        else{
            switch(httpStatus){
                // The following cases are wininet.dll error codes that may be encountered.
                case 12002: // Server timeout
                case 12029: // 12029 to 12031 correspond to dropped connections.
                case 12030:
                case 12031:
                case 12152: // Connection closed by server.
                case 13030: // See above comments for variable status.
                    // XDR transactions will not resolve to this case, since the
                    // response object is already built in the xdr response.
                    responseObject = this.createExceptionObject(o.tId, args, (isAbort?isAbort:false));
                    if(callback && callback.failure){
                        if(!callback.scope){
                            callback.failure(responseObject);
                        }
                        else{
                            callback.failure.apply(callback.scope, [responseObject]);
                        }
                    }

                    break;
                default:
                    responseObject = (o.xdr) ? o.response : this.createResponseObject(o, args);
                    if(callback && callback.failure){
                        if(!callback.scope){
                            callback.failure(responseObject);
                        }
                        else{
                            callback.failure.apply(callback.scope, [responseObject]);
                        }
                    }
            }

            // Fire global custom event -- failureEvent
            this.failureEvent.fire(responseObject);

            if(o.failureEvent){
                // Fire transaction custom event -- failureEvent
                o.failureEvent.fire(responseObject);
            }

        }

        this.releaseObject(o);
        responseObject = null;
    },

  /**
   * @description This method evaluates the server response, creates and returns the results via
   * its properties.  Success and failure cases will differ in the response
   * object's property values.
   * @method createResponseObject
   * @private
   * @static
   * @param {object} o The connection object
   * @param {callbackArg} callbackArg The user-defined argument or arguments to be passed to the callback
   * @return {object}
   */
    createResponseObject:function(o, callbackArg)
    {
        var obj = {}, headerObj = {},
            i, headerStr, header, delimitPos;

        try
        {
            headerStr = o.conn.getAllResponseHeaders();
            header = headerStr.split('\n');
            for(i=0; i<header.length; i++){
                delimitPos = header[i].indexOf(':');
                if(delimitPos != -1){
                    headerObj[header[i].substring(0,delimitPos)] = YAHOO.lang.trim(header[i].substring(delimitPos+2));
                }
            }
        }
        catch(e){}

        obj.tId = o.tId;
        // Normalize IE's response to HTTP 204 when Win error 1223.
        obj.status = (o.conn.status == 1223)?204:o.conn.status;
        // Normalize IE's statusText to "No Content" instead of "Unknown".
        obj.statusText = (o.conn.status == 1223)?"No Content":o.conn.statusText;
        obj.getResponseHeader = headerObj;
        obj.getAllResponseHeaders = headerStr;
        obj.responseText = o.conn.responseText;
        obj.responseXML = o.conn.responseXML;

        if(callbackArg){
            obj.argument = callbackArg;
        }

        return obj;
    },

  /**
   * @description If a transaction cannot be completed due to dropped or closed connections,
   * there may be not be enough information to build a full response object.
   * The failure callback will be fired and this specific condition can be identified
   * by a status property value of 0.
   *
   * If an abort was successful, the status property will report a value of -1.
   *
   * @method createExceptionObject
   * @private
   * @static
   * @param {int} tId The Transaction Id
   * @param {callbackArg} callbackArg The user-defined argument or arguments to be passed to the callback
   * @param {boolean} isAbort Determines if the exception case is caused by a transaction abort
   * @return {object}
   */
    createExceptionObject:function(tId, callbackArg, isAbort)
    {
        var COMM_CODE = 0,
            COMM_ERROR = 'communication failure',
            ABORT_CODE = -1,
            ABORT_ERROR = 'transaction aborted',
            obj = {};

        obj.tId = tId;
        if(isAbort){
            obj.status = ABORT_CODE;
            obj.statusText = ABORT_ERROR;
        }
        else{
            obj.status = COMM_CODE;
            obj.statusText = COMM_ERROR;
        }

        if(callbackArg){
            obj.argument = callbackArg;
        }

        return obj;
    },

  /**
   * @description Method that initializes the custom HTTP headers for the each transaction.
   * @method initHeader
   * @public
   * @static
   * @param {string} label The HTTP header label
   * @param {string} value The HTTP header value
   * @param {string} isDefault Determines if the specific header is a default header
   * automatically sent with each transaction.
   * @return {void}
   */
    initHeader:function(label, value, isDefault)
    {
        var headerObj = (isDefault)?this._default_headers:this._http_headers;

        headerObj[label] = value;
        if(isDefault){
            this._has_default_headers = true;
        }
        else{
            this._has_http_headers = true;
        }
    },


  /**
   * @description Accessor that sets the HTTP headers for each transaction.
   * @method setHeader
   * @private
   * @static
   * @param {object} o The connection object for the transaction.
   * @return {void}
   */
    setHeader:function(o)
    {
        var prop;
        if(this._has_default_headers){
            for(prop in this._default_headers){
                if(YAHOO.lang.hasOwnProperty(this._default_headers, prop)){
                    o.conn.setRequestHeader(prop, this._default_headers[prop]);
                }
            }
        }

        if(this._has_http_headers){
            for(prop in this._http_headers){
                if(YAHOO.lang.hasOwnProperty(this._http_headers, prop)){
                    o.conn.setRequestHeader(prop, this._http_headers[prop]);
                }
            }

            this._http_headers = {};
            this._has_http_headers = false;
        }
    },

  /**
   * @description Resets the default HTTP headers object
   * @method resetDefaultHeaders
   * @public
   * @static
   * @return {void}
   */
    resetDefaultHeaders:function(){
        this._default_headers = {};
        this._has_default_headers = false;
    },

  /**
   * @description Method to terminate a transaction, if it has not reached readyState 4.
   * @method abort
   * @public
   * @static
   * @param {object} o The connection object returned by asyncRequest.
   * @param {object} callback  User-defined callback object.
   * @param {string} isTimeout boolean to indicate if abort resulted from a callback timeout.
   * @return {boolean}
   */
    abort:function(o, callback, isTimeout)
    {
        var abortStatus,
            args = (callback && callback.argument)?callback.argument:null;
            o = o || {};

        if(o.conn){
            if(o.xhr){
                if(this.isCallInProgress(o)){
                    // Issue abort request
                    o.conn.abort();

                    window.clearInterval(this._poll[o.tId]);
                    delete this._poll[o.tId];

                    if(isTimeout){
                        window.clearTimeout(this._timeOut[o.tId]);
                        delete this._timeOut[o.tId];
                    }

                    abortStatus = true;
                }
            }
            else if(o.xdr){
                o.conn.abort(o.tId);
                abortStatus = true;
            }
        }
        else if(o.upload){
            var frameId = 'yuiIO' + o.tId;
            var io = document.getElementById(frameId);

            if(io){
                // Remove all listeners on the iframe prior to
                // its destruction.
                YAHOO.util.Event.removeListener(io, "load");
                // Destroy the iframe facilitating the transaction.
                document.body.removeChild(io);

                if(isTimeout){
                    window.clearTimeout(this._timeOut[o.tId]);
                    delete this._timeOut[o.tId];
                }

                abortStatus = true;
            }
        }
        else{
            abortStatus = false;
        }

        if(abortStatus === true){
            // Fire global custom event -- abortEvent
            this.abortEvent.fire(o, args);

            if(o.abortEvent){
                // Fire transaction custom event -- abortEvent
                o.abortEvent.fire(o, args);
            }

            this.handleTransactionResponse(o, callback, true);
        }

        return abortStatus;
    },

  /**
   * @description Determines if the transaction is still being processed.
   * @method isCallInProgress
   * @public
   * @static
   * @param {object} o The connection object returned by asyncRequest
   * @return {boolean}
   */
    isCallInProgress:function(o)
    {
        o = o || {};
        // if the XHR object assigned to the transaction has not been dereferenced,
        // then check its readyState status.  Otherwise, return false.
        if(o.xhr && o.conn){
            return o.conn.readyState !== 4 && o.conn.readyState !== 0;
        }
        else if(o.xdr && o.conn){
            return o.conn.isCallInProgress(o.tId);
        }
        else if(o.upload === true){
            return document.getElementById('yuiIO' + o.tId)?true:false;
        }
        else{
            return false;
        }
    },

  /**
   * @description Dereference the XHR instance and the connection object after the transaction is completed.
   * @method releaseObject
   * @private
   * @static
   * @param {object} o The connection object
   * @return {void}
   */
    releaseObject:function(o)
    {
        if(o && o.conn){
            //dereference the XHR instance.
            o.conn = null;


            //dereference the connection object.
            o = null;
        }
    }
};

/**
  * @for YAHOO.util.Connect
  */
(function() {
	var YCM = YAHOO.util.Connect, _fn = {};

   /**
    * @description This method creates and instantiates the Flash transport.
    * @method _swf
    * @private
    * @static
    * @param {string} URI to connection.swf.
    * @return {void}
    */
	function _swf(uri) {
		var o = '<object id="YUIConnectionSwf" type="application/x-shockwave-flash" data="' +
				uri + '" width="0" height="0">' +
				'<param name="movie" value="' + uri + '">' +
				'<param name="allowScriptAccess" value="always">' +
				'</object>',
		    c = document.createElement('div');

		document.body.appendChild(c);
		c.innerHTML = o;
	}

   /**
    * @description This method calls the public method on the
    * Flash transport to start the XDR transaction.  It is analogous
    * to Connection Manager's asyncRequest method.
    * @method xdr
    * @private
    * @static
    * @param {object} The transaction object.
    * @param {string} HTTP request method.
    * @param {string} URI for the transaction.
    * @param {object} The transaction's callback object.
    * @param {object} The JSON object used as HTTP POST data.
    * @return {void}
    */
	function _xdr(o, m, u, c, d) {
		_fn[parseInt(o.tId)] = { 'o':o, 'c':c };
		if (d) {
			c.method = m;
			c.data = d;
		}

		o.conn.send(u, c, o.tId);
	}

   /**
    * @description This method instantiates the Flash transport and
    * establishes a static reference to it, used for all XDR requests.
    * @method transport
    * @public
    * @static
    * @param {string} URI to connection.swf.
    * @return {void}
    */
	function _init(uri) {
		_swf(uri);
		YCM._transport = document.getElementById('YUIConnectionSwf');
	}

	function _xdrReady() {
		YCM.xdrReadyEvent.fire();
	}

   /**
    * @description This method fires the global and transaction start
    * events.
    * @method _xdrStart
    * @private
    * @static
    * @param {object} The transaction object.
    * @param {string} The transaction's callback object.
    * @return {void}
    */
	function _xdrStart(o, cb) {
		if (o) {
			// Fire global custom event -- startEvent
			YCM.startEvent.fire(o, cb.argument);

			if(o.startEvent){
				// Fire transaction custom event -- startEvent
				o.startEvent.fire(o, cb.argument);
			}
		}
	}

   /**
    * @description This method is the initial response handler
    * for XDR transactions.  The Flash transport calls this
    * function and sends the response payload.
    * @method handleXdrResponse
    * @private
    * @static
    * @param {object} The response object sent from the Flash transport.
    * @return {void}
    */
	function _handleXdrResponse(r) {
		var o = _fn[r.tId].o,
			cb = _fn[r.tId].c;

		if (r.statusText === 'xdr:start') {
			_xdrStart(o, cb);
			return;
		}

		r.responseText = decodeURI(r.responseText);
		o.r = r;
		if (cb.argument) {
			o.r.argument = cb.argument;
		}

		this.handleTransactionResponse(o, cb, r.statusText === 'xdr:abort' ? true : false);
		delete _fn[r.tId];
	}

	// Bind the functions to Connection Manager as static fields.
	YCM.xdr = _xdr;
	YCM.swf = _swf;
	YCM.transport = _init;
	YCM.xdrReadyEvent = new YAHOO.util.CustomEvent('xdrReady');
	YCM.xdrReady = _xdrReady;
	YCM.handleXdrResponse = _handleXdrResponse;
})();

/**
  * @for YAHOO.util.Connect
  */
(function(){
	var YCM = YAHOO.util.Connect,
		YE = YAHOO.util.Event,
		dM = document.documentMode ? document.documentMode : false;

   /**
	* @description Property modified by setForm() to determine if a file(s)
	* upload is expected.
	* @property _isFileUpload
	* @private
	* @static
	* @type boolean
	*/
	YCM._isFileUpload = false;

   /**
	* @description Property modified by setForm() to set a reference to the HTML
	* form node if the desired action is file upload.
	* @property _formNode
	* @private
	* @static
	* @type object
	*/
	YCM._formNode = null;

   /**
	* @description Property modified by setForm() to set the HTML form data
	* for each transaction.
	* @property _sFormData
	* @private
	* @static
	* @type string
	*/
	YCM._sFormData = null;

   /**
	* @description Tracks the name-value pair of the "clicked" submit button if multiple submit
	* buttons are present in an HTML form; and, if YAHOO.util.Event is available.
	* @property _submitElementValue
	* @private
	* @static
	* @type string
	*/
	YCM._submitElementValue = null;

   /**
    * @description Custom event that fires when handleTransactionResponse() determines a
    * response in the HTTP 4xx/5xx range.
    * @property failureEvent
    * @private
    * @static
    * @type CustomEvent
    */
	YCM.uploadEvent = new YAHOO.util.CustomEvent('upload');

   /**
	* @description Determines whether YAHOO.util.Event is available and returns true or false.
	* If true, an event listener is bound at the document level to trap click events that
	* resolve to a target type of "Submit".  This listener will enable setForm() to determine
	* the clicked "Submit" value in a multi-Submit button, HTML form.
	* @property _hasSubmitListener
	* @private
	* @static
	*/
	YCM._hasSubmitListener = function() {
		if(YE){
			YE.addListener(
				document,
				'click',
				function(e){
					var obj = YE.getTarget(e),
						name = obj.nodeName.toLowerCase();

					if((name === 'input' || name === 'button') && (obj.type && obj.type.toLowerCase() == 'submit')){
						YCM._submitElementValue = encodeURIComponent(obj.name) + "=" + encodeURIComponent(obj.value);
					}
				});
			return true;
		}
		return false;
	}();

  /**
   * @description This method assembles the form label and value pairs and
   * constructs an encoded string.
   * asyncRequest() will automatically initialize the transaction with a
   * a HTTP header Content-Type of application/x-www-form-urlencoded.
   * @method setForm
   * @public
   * @static
   * @param {string || object} form id or name attribute, or form object.
   * @param {boolean} optional enable file upload.
   * @param {boolean} optional enable file upload over SSL in IE only.
   * @return {string} string of the HTML form field name and value pairs..
   */
	function _setForm(formId, isUpload, secureUri)
	{
		var oForm, oElement, oName, oValue, oDisabled,
			hasSubmit = false,
			data = [], item = 0,
			i,len,j,jlen,opt;

		this.resetFormState();

		if(typeof formId == 'string'){
			// Determine if the argument is a form id or a form name.
			// Note form name usage is deprecated by supported
			// here for legacy reasons.
			oForm = (document.getElementById(formId) || document.forms[formId]);
		}
		else if(typeof formId == 'object'){
			// Treat argument as an HTML form object.
			oForm = formId;
		}
		else{
			return;
		}

		// If the isUpload argument is true, setForm will call createFrame to initialize
		// an iframe as the form target.
		//
		// The argument secureURI is also required by IE in SSL environments
		// where the secureURI string is a fully qualified HTTP path, used to set the source
		// of the iframe, to a stub resource in the same domain.
		if(isUpload){

			// Create iframe in preparation for file upload.
			this.createFrame(secureUri?secureUri:null);

			// Set form reference and file upload properties to true.
			this._isFormSubmit = true;
			this._isFileUpload = true;
			this._formNode = oForm;

			return;
		}

		// Iterate over the form elements collection to construct the
		// label-value pairs.
		for (i=0,len=oForm.elements.length; i<len; ++i){
			oElement  = oForm.elements[i];
			oDisabled = oElement.disabled;
			oName     = oElement.name;

			// Do not submit fields that are disabled or
			// do not have a name attribute value.
			if(!oDisabled && oName)
			{
				oName  = encodeURIComponent(oName)+'=';
				oValue = encodeURIComponent(oElement.value);

				switch(oElement.type)
				{
					// Safari, Opera, FF all default opt.value from .text if
					// value attribute not specified in markup
					case 'select-one':
						if (oElement.selectedIndex > -1) {
							opt = oElement.options[oElement.selectedIndex];
							data[item++] = oName + encodeURIComponent(
								(opt.attributes.value && opt.attributes.value.specified) ? opt.value : opt.text);
						}
						break;
					case 'select-multiple':
						if (oElement.selectedIndex > -1) {
							for(j=oElement.selectedIndex, jlen=oElement.options.length; j<jlen; ++j){
								opt = oElement.options[j];
								if (opt.selected) {
									data[item++] = oName + encodeURIComponent(
										(opt.attributes.value && opt.attributes.value.specified) ? opt.value : opt.text);
								}
							}
						}
						break;
					case 'radio':
					case 'checkbox':
						if(oElement.checked){
							data[item++] = oName + oValue;
						}
						break;
					case 'file':
						// stub case as XMLHttpRequest will only send the file path as a string.
					case undefined:
						// stub case for fieldset element which returns undefined.
					case 'reset':
						// stub case for input type reset button.
					case 'button':
						// stub case for input type button elements.
						break;
					case 'submit':
						if(hasSubmit === false){
							if(this._hasSubmitListener && this._submitElementValue){
								data[item++] = this._submitElementValue;
							}
							hasSubmit = true;
						}
						break;
					default:
						data[item++] = oName + oValue;
				}
			}
		}

		this._isFormSubmit = true;
		this._sFormData = data.join('&');


		this.initHeader('Content-Type', this._default_form_header);

		return this._sFormData;
	}

   /**
    * @description Resets HTML form properties when an HTML form or HTML form
    * with file upload transaction is sent.
    * @method resetFormState
    * @private
    * @static
    * @return {void}
    */
	function _resetFormState(){
		this._isFormSubmit = false;
		this._isFileUpload = false;
		this._formNode = null;
		this._sFormData = "";
	}


   /**
    * @description Creates an iframe to be used for form file uploads.  It is remove from the
    * document upon completion of the upload transaction.
    * @method createFrame
    * @private
    * @static
    * @param {string} optional qualified path of iframe resource for SSL in IE.
    * @return {void}
    */
	function _createFrame(secureUri){

		// IE does not allow the setting of id and name attributes as object
		// properties via createElement().  A different iframe creation
		// pattern is required for IE.
		var frameId = 'yuiIO' + this._transaction_id,
			ie9 = (dM === 9) ? true : false,
			io;

		if(YAHOO.env.ua.ie && !ie9){
			io = document.createElement('<iframe id="' + frameId + '" name="' + frameId + '" />');

			// IE will throw a security exception in an SSL environment if the
			// iframe source is undefined.
			if(typeof secureUri == 'boolean'){
				io.src = 'javascript:false';
			}
		}
		else{
			io = document.createElement('iframe');
			io.id = frameId;
			io.name = frameId;
		}

		io.style.position = 'absolute';
		io.style.top = '-1000px';
		io.style.left = '-1000px';

		document.body.appendChild(io);
	}

   /**
    * @description Parses the POST data and creates hidden form elements
    * for each key-value, and appends them to the HTML form object.
    * @method appendPostData
    * @private
    * @static
    * @param {string} postData The HTTP POST data
    * @return {array} formElements Collection of hidden fields.
    */
	function _appendPostData(postData){
		var formElements = [],
			postMessage = postData.split('&'),
			i, delimitPos;

		for(i=0; i < postMessage.length; i++){
			delimitPos = postMessage[i].indexOf('=');
			if(delimitPos != -1){
				formElements[i] = document.createElement('input');
				formElements[i].type = 'hidden';
				formElements[i].name = decodeURIComponent(postMessage[i].substring(0,delimitPos));
				formElements[i].value = decodeURIComponent(postMessage[i].substring(delimitPos+1));
				this._formNode.appendChild(formElements[i]);
			}
		}

		return formElements;
	}

   /**
    * @description Uploads HTML form, inclusive of files/attachments, using the
    * iframe created in createFrame to facilitate the transaction.
    * @method uploadFile
    * @private
    * @static
    * @param {int} id The transaction id.
    * @param {object} callback User-defined callback object.
    * @param {string} uri Fully qualified path of resource.
    * @param {string} postData POST data to be submitted in addition to HTML form.
    * @return {void}
    */
	function _uploadFile(o, callback, uri, postData){
		// Each iframe has an id prefix of "yuiIO" followed
		// by the unique transaction id.
		var frameId = 'yuiIO' + o.tId,
		    uploadEncoding = 'multipart/form-data',
		    io = document.getElementById(frameId),
		    ie8 = (dM >= 8) ? true : false,
		    oConn = this,
			args = (callback && callback.argument)?callback.argument:null,
            oElements,i,prop,obj, rawFormAttributes, uploadCallback;

		// Track original HTML form attribute values.
		rawFormAttributes = {
			action:this._formNode.getAttribute('action'),
			method:this._formNode.getAttribute('method'),
			target:this._formNode.getAttribute('target')
		};

		// Initialize the HTML form properties in case they are
		// not defined in the HTML form.
		this._formNode.setAttribute('action', uri);
		this._formNode.setAttribute('method', 'POST');
		this._formNode.setAttribute('target', frameId);

		if(YAHOO.env.ua.ie && !ie8){
			// IE does not respect property enctype for HTML forms.
			// Instead it uses the property - "encoding".
			this._formNode.setAttribute('encoding', uploadEncoding);
		}
		else{
			this._formNode.setAttribute('enctype', uploadEncoding);
		}

		if(postData){
			oElements = this.appendPostData(postData);
		}

		// Start file upload.
		this._formNode.submit();

		// Fire global custom event -- startEvent
		this.startEvent.fire(o, args);

		if(o.startEvent){
			// Fire transaction custom event -- startEvent
			o.startEvent.fire(o, args);
		}

		// Start polling if a callback is present and the timeout
		// property has been defined.
		if(callback && callback.timeout){
			this._timeOut[o.tId] = window.setTimeout(function(){ oConn.abort(o, callback, true); }, callback.timeout);
		}

		// Remove HTML elements created by appendPostData
		if(oElements && oElements.length > 0){
			for(i=0; i < oElements.length; i++){
				this._formNode.removeChild(oElements[i]);
			}
		}

		// Restore HTML form attributes to their original
		// values prior to file upload.
		for(prop in rawFormAttributes){
			if(YAHOO.lang.hasOwnProperty(rawFormAttributes, prop)){
				if(rawFormAttributes[prop]){
					this._formNode.setAttribute(prop, rawFormAttributes[prop]);
				}
				else{
					this._formNode.removeAttribute(prop);
				}
			}
		}

		// Reset HTML form state properties.
		this.resetFormState();

		// Create the upload callback handler that fires when the iframe
		// receives the load event.  Subsequently, the event handler is detached
		// and the iframe removed from the document.
		uploadCallback = function() {
			var body, pre, text;

			if(callback && callback.timeout){
				window.clearTimeout(oConn._timeOut[o.tId]);
				delete oConn._timeOut[o.tId];
			}

			// Fire global custom event -- completeEvent
			oConn.completeEvent.fire(o, args);

			if(o.completeEvent){
				// Fire transaction custom event -- completeEvent
				o.completeEvent.fire(o, args);
			}

			obj = {
			    tId : o.tId,
			    argument : args
            };

			try
			{
				body = io.contentWindow.document.getElementsByTagName('body')[0];
				pre = io.contentWindow.document.getElementsByTagName('pre')[0];

				if (body) {
					if (pre) {
						text = pre.textContent?pre.textContent:pre.innerText;
					}
					else {
						text = body.textContent?body.textContent:body.innerText;
					}
				}
				obj.responseText = text;
				// responseText and responseXML will be populated with the same data from the iframe.
				// Since the HTTP headers cannot be read from the iframe
				obj.responseXML = io.contentWindow.document.XMLDocument?io.contentWindow.document.XMLDocument:io.contentWindow.document;
			}
			catch(e){}

			if(callback && callback.upload){
				if(!callback.scope){
					callback.upload(obj);
				}
				else{
					callback.upload.apply(callback.scope, [obj]);
				}
			}

			// Fire global custom event -- uploadEvent
			oConn.uploadEvent.fire(obj);

			if(o.uploadEvent){
				// Fire transaction custom event -- uploadEvent
				o.uploadEvent.fire(obj);
			}

			YE.removeListener(io, "load", uploadCallback);

			setTimeout(
				function(){
					document.body.removeChild(io);
					oConn.releaseObject(o);
				}, 100);
		};

		// Bind the onload handler to the iframe to detect the file upload response.
		YE.addListener(io, "load", uploadCallback);
	}

	YCM.setForm = _setForm;
	YCM.resetFormState = _resetFormState;
	YCM.createFrame = _createFrame;
	YCM.appendPostData = _appendPostData;
	YCM.uploadFile = _uploadFile;
})();

YAHOO.register("connection", YAHOO.util.Connect, {version: "2.9.0", build: "2800"});

/*
Copyright (c) 2011, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://developer.yahoo.com/yui/license.html
version: 2.9.0
*/
/**
 * Provides Attribute configurations.
 * @namespace YAHOO.util
 * @class Attribute
 * @constructor
 * @param hash {Object} The intial Attribute.
 * @param {YAHOO.util.AttributeProvider} The owner of the Attribute instance.
 */

YAHOO.util.Attribute = function(hash, owner) {
    if (owner) { 
        this.owner = owner;
        this.configure(hash, true);
    }
};

YAHOO.util.Attribute.INVALID_VALUE = {};

YAHOO.util.Attribute.prototype = {
    /**
     * The name of the attribute.
     * @property name
     * @type String
     */
    name: undefined,
    
    /**
     * The value of the attribute.
     * @property value
     * @type String
     */
    value: null,
    
    /**
     * The owner of the attribute.
     * @property owner
     * @type YAHOO.util.AttributeProvider
     */
    owner: null,
    
    /**
     * Whether or not the attribute is read only.
     * @property readOnly
     * @type Boolean
     */
    readOnly: false,
    
    /**
     * Whether or not the attribute can only be written once.
     * @property writeOnce
     * @type Boolean
     */
    writeOnce: false,

    /**
     * The attribute's initial configuration.
     * @private
     * @property _initialConfig
     * @type Object
     */
    _initialConfig: null,
    
    /**
     * Whether or not the attribute's value has been set.
     * @private
     * @property _written
     * @type Boolean
     */
    _written: false,
    
    /**
     * A function to call when setting the attribute's value.
     * The method receives the new value as the first arg and the attribute name as the 2nd
     * @property method
     * @type Function
     */
    method: null,
    
    /**
     * The function to use when setting the attribute's value.
     * The setter receives the new value as the first arg and the attribute name as the 2nd
     * The return value of the setter replaces the value passed to set(). 
     * @property setter
     * @type Function
     */
    setter: null,
    
    /**
     * The function to use when getting the attribute's value.
     * The getter receives the new value as the first arg and the attribute name as the 2nd
     * The return value of the getter will be used as the return from get().
     * @property getter
     * @type Function
     */
    getter: null,

    /**
     * The validator to use when setting the attribute's value.
     * @property validator
     * @type Function
     * @return Boolean
     */
    validator: null,
    
    /**
     * Retrieves the current value of the attribute.
     * @method getValue
     * @return {any} The current value of the attribute.
     */
    getValue: function() {
        var val = this.value;

        if (this.getter) {
            val = this.getter.call(this.owner, this.name, val);
        }

        return val;
    },
    
    /**
     * Sets the value of the attribute and fires beforeChange and change events.
     * @method setValue
     * @param {Any} value The value to apply to the attribute.
     * @param {Boolean} silent If true the change events will not be fired.
     * @return {Boolean} Whether or not the value was set.
     */
    setValue: function(value, silent) {
        var beforeRetVal,
            owner = this.owner,
            name = this.name,
            invalidValue = YAHOO.util.Attribute.INVALID_VALUE,
        
            event = {
                type: name, 
                prevValue: this.getValue(),
                newValue: value
        };
        
        if (this.readOnly || ( this.writeOnce && this._written) ) {
            return false; // write not allowed
        }
        
        if (this.validator && !this.validator.call(owner, value) ) {
            return false; // invalid value
        }

        if (!silent) {
            beforeRetVal = owner.fireBeforeChangeEvent(event);
            if (beforeRetVal === false) {
                return false;
            }
        }

        if (this.setter) {
            value = this.setter.call(owner, value, this.name);
            if (value === undefined) {
            }

            if (value === invalidValue) {
                return false;
            }
        }
        
        if (this.method) {
            if (this.method.call(owner, value, this.name) === invalidValue) {
                return false; 
            }
        }
        
        this.value = value; // TODO: set before calling setter/method?
        this._written = true;
        
        event.type = name;
        
        if (!silent) {
            this.owner.fireChangeEvent(event);
        }
        
        return true;
    },
    
    /**
     * Allows for configuring the Attribute's properties.
     * @method configure
     * @param {Object} map A key-value map of Attribute properties.
     * @param {Boolean} init Whether or not this should become the initial config.
     */
    configure: function(map, init) {
        map = map || {};

        if (init) {
            this._written = false; // reset writeOnce
        }

        this._initialConfig = this._initialConfig || {};
        
        for (var key in map) {
            if ( map.hasOwnProperty(key) ) {
                this[key] = map[key];
                if (init) {
                    this._initialConfig[key] = map[key];
                }
            }
        }
    },
    
    /**
     * Resets the value to the initial config value.
     * @method resetValue
     * @return {Boolean} Whether or not the value was set.
     */
    resetValue: function() {
        return this.setValue(this._initialConfig.value);
    },
    
    /**
     * Resets the attribute config to the initial config state.
     * @method resetConfig
     */
    resetConfig: function() {
        this.configure(this._initialConfig, true);
    },
    
    /**
     * Resets the value to the current value.
     * Useful when values may have gotten out of sync with actual properties.
     * @method refresh
     * @return {Boolean} Whether or not the value was set.
     */
    refresh: function(silent) {
        this.setValue(this.value, silent);
    }
};

(function() {
    var Lang = YAHOO.util.Lang;

    /*
    Copyright (c) 2006, Yahoo! Inc. All rights reserved.
    Code licensed under the BSD License:
    http://developer.yahoo.net/yui/license.txt
    */
    
    /**
     * Provides and manages YAHOO.util.Attribute instances
     * @namespace YAHOO.util
     * @class AttributeProvider
     * @uses YAHOO.util.EventProvider
     */
    YAHOO.util.AttributeProvider = function() {};

    YAHOO.util.AttributeProvider.prototype = {
        
        /**
         * A key-value map of Attribute configurations
         * @property _configs
         * @protected (may be used by subclasses and augmentors)
         * @private
         * @type {Object}
         */
        _configs: null,
        /**
         * Returns the current value of the attribute.
         * @method get
         * @param {String} key The attribute whose value will be returned.
         * @return {Any} The current value of the attribute.
         */
        get: function(key){
            this._configs = this._configs || {};
            var config = this._configs[key];
            
            if (!config || !this._configs.hasOwnProperty(key)) {
                return null;
            }
            
            return config.getValue();
        },
        
        /**
         * Sets the value of a config.
         * @method set
         * @param {String} key The name of the attribute
         * @param {Any} value The value to apply to the attribute
         * @param {Boolean} silent Whether or not to suppress change events
         * @return {Boolean} Whether or not the value was set.
         */
        set: function(key, value, silent){
            this._configs = this._configs || {};
            var config = this._configs[key];
            
            if (!config) {
                return false;
            }
            
            return config.setValue(value, silent);
        },
    
        /**
         * Returns an array of attribute names.
         * @method getAttributeKeys
         * @return {Array} An array of attribute names.
         */
        getAttributeKeys: function(){
            this._configs = this._configs;
            var keys = [], key;

            for (key in this._configs) {
                if ( Lang.hasOwnProperty(this._configs, key) && 
                        !Lang.isUndefined(this._configs[key]) ) {
                    keys[keys.length] = key;
                }
            }
            
            return keys;
        },
        
        /**
         * Sets multiple attribute values.
         * @method setAttributes
         * @param {Object} map  A key-value map of attributes
         * @param {Boolean} silent Whether or not to suppress change events
         */
        setAttributes: function(map, silent){
            for (var key in map) {
                if ( Lang.hasOwnProperty(map, key) ) {
                    this.set(key, map[key], silent);
                }
            }
        },
    
        /**
         * Resets the specified attribute's value to its initial value.
         * @method resetValue
         * @param {String} key The name of the attribute
         * @param {Boolean} silent Whether or not to suppress change events
         * @return {Boolean} Whether or not the value was set
         */
        resetValue: function(key, silent){
            this._configs = this._configs || {};
            if (this._configs[key]) {
                this.set(key, this._configs[key]._initialConfig.value, silent);
                return true;
            }
            return false;
        },
    
        /**
         * Sets the attribute's value to its current value.
         * @method refresh
         * @param {String | Array} key The attribute(s) to refresh
         * @param {Boolean} silent Whether or not to suppress change events
         */
        refresh: function(key, silent) {
            this._configs = this._configs || {};
            var configs = this._configs;
            
            key = ( ( Lang.isString(key) ) ? [key] : key ) || 
                    this.getAttributeKeys();
            
            for (var i = 0, len = key.length; i < len; ++i) { 
                if (configs.hasOwnProperty(key[i])) {
                    this._configs[key[i]].refresh(silent);
                }
            }
        },
    
        /**
         * Adds an Attribute to the AttributeProvider instance. 
         * @method register
         * @param {String} key The attribute's name
         * @param {Object} map A key-value map containing the
         * attribute's properties.
         * @deprecated Use setAttributeConfig
         */
        register: function(key, map) {
            this.setAttributeConfig(key, map);
        },
        
        
        /**
         * Returns the attribute's properties.
         * @method getAttributeConfig
         * @param {String} key The attribute's name
         * @private
         * @return {object} A key-value map containing all of the
         * attribute's properties.
         */
        getAttributeConfig: function(key) {
            this._configs = this._configs || {};
            var config = this._configs[key] || {};
            var map = {}; // returning a copy to prevent overrides
            
            for (key in config) {
                if ( Lang.hasOwnProperty(config, key) ) {
                    map[key] = config[key];
                }
            }
    
            return map;
        },
        
        /**
         * Sets or updates an Attribute instance's properties. 
         * @method setAttributeConfig
         * @param {String} key The attribute's name.
         * @param {Object} map A key-value map of attribute properties
         * @param {Boolean} init Whether or not this should become the intial config.
         */
        setAttributeConfig: function(key, map, init) {
            this._configs = this._configs || {};
            map = map || {};
            if (!this._configs[key]) {
                map.name = key;
                this._configs[key] = this.createAttribute(map);
            } else {
                this._configs[key].configure(map, init);
            }
        },
        
        /**
         * Sets or updates an Attribute instance's properties. 
         * @method configureAttribute
         * @param {String} key The attribute's name.
         * @param {Object} map A key-value map of attribute properties
         * @param {Boolean} init Whether or not this should become the intial config.
         * @deprecated Use setAttributeConfig
         */
        configureAttribute: function(key, map, init) {
            this.setAttributeConfig(key, map, init);
        },
        
        /**
         * Resets an attribute to its intial configuration. 
         * @method resetAttributeConfig
         * @param {String} key The attribute's name.
         * @private
         */
        resetAttributeConfig: function(key){
            this._configs = this._configs || {};
            this._configs[key].resetConfig();
        },
        
        // wrapper for EventProvider.subscribe
        // to create events on the fly
        subscribe: function(type, callback) {
            this._events = this._events || {};

            if ( !(type in this._events) ) {
                this._events[type] = this.createEvent(type);
            }

            YAHOO.util.EventProvider.prototype.subscribe.apply(this, arguments);
        },

        on: function() {
            this.subscribe.apply(this, arguments);
        },

        addListener: function() {
            this.subscribe.apply(this, arguments);
        },

        /**
         * Fires the attribute's beforeChange event. 
         * @method fireBeforeChangeEvent
         * @param {String} key The attribute's name.
         * @param {Obj} e The event object to pass to handlers.
         */
        fireBeforeChangeEvent: function(e) {
            var type = 'before';
            type += e.type.charAt(0).toUpperCase() + e.type.substr(1) + 'Change';
            e.type = type;
            return this.fireEvent(e.type, e);
        },
        
        /**
         * Fires the attribute's change event. 
         * @method fireChangeEvent
         * @param {String} key The attribute's name.
         * @param {Obj} e The event object to pass to the handlers.
         */
        fireChangeEvent: function(e) {
            e.type += 'Change';
            return this.fireEvent(e.type, e);
        },

        createAttribute: function(map) {
            return new YAHOO.util.Attribute(map, this);
        }
    };
    
    YAHOO.augment(YAHOO.util.AttributeProvider, YAHOO.util.EventProvider);
})();

(function() {
// internal shorthand
var Dom = YAHOO.util.Dom,
    AttributeProvider = YAHOO.util.AttributeProvider,
	specialTypes = {
		mouseenter: true,
		mouseleave: true
	};

/**
 * Element provides an wrapper object to simplify adding
 * event listeners, using dom methods, and managing attributes. 
 * @module element
 * @namespace YAHOO.util
 * @requires yahoo, dom, event
 */

/**
 * Element provides an wrapper object to simplify adding
 * event listeners, using dom methods, and managing attributes. 
 * @class Element
 * @uses YAHOO.util.AttributeProvider
 * @constructor
 * @param el {HTMLElement | String} The html element that 
 * represents the Element.
 * @param {Object} map A key-value map of initial config names and values
 */
var Element = function(el, map) {
    this.init.apply(this, arguments);
};

Element.DOM_EVENTS = {
    'click': true,
    'dblclick': true,
    'keydown': true,
    'keypress': true,
    'keyup': true,
    'mousedown': true,
    'mousemove': true,
    'mouseout': true, 
    'mouseover': true, 
    'mouseup': true,
    'mouseenter': true, 
    'mouseleave': true,
    'focus': true,
    'blur': true,
    'submit': true,
    'change': true
};

Element.prototype = {
    /**
     * Dom events supported by the Element instance.
     * @property DOM_EVENTS
     * @type Object
     */
    DOM_EVENTS: null,

    DEFAULT_HTML_SETTER: function(value, key) {
        var el = this.get('element');
        
        if (el) {
            el[key] = value;
        }

		return value;

    },

    DEFAULT_HTML_GETTER: function(key) {
        var el = this.get('element'),
            val;

        if (el) {
            val = el[key];
        }

        return val;
    },

    /**
     * Wrapper for HTMLElement method.
     * @method appendChild
     * @param {YAHOO.util.Element || HTMLElement} child The element to append. 
     * @return {HTMLElement} The appended DOM element. 
     */
    appendChild: function(child) {
        child = child.get ? child.get('element') : child;
        return this.get('element').appendChild(child);
    },
    
    /**
     * Wrapper for HTMLElement method.
     * @method getElementsByTagName
     * @param {String} tag The tagName to collect
     * @return {HTMLCollection} A collection of DOM elements. 
     */
    getElementsByTagName: function(tag) {
        return this.get('element').getElementsByTagName(tag);
    },
    
    /**
     * Wrapper for HTMLElement method.
     * @method hasChildNodes
     * @return {Boolean} Whether or not the element has childNodes
     */
    hasChildNodes: function() {
        return this.get('element').hasChildNodes();
    },
    
    /**
     * Wrapper for HTMLElement method.
     * @method insertBefore
     * @param {HTMLElement} element The HTMLElement to insert
     * @param {HTMLElement} before The HTMLElement to insert
     * the element before.
     * @return {HTMLElement} The inserted DOM element. 
     */
    insertBefore: function(element, before) {
        element = element.get ? element.get('element') : element;
        before = (before && before.get) ? before.get('element') : before;
        
        return this.get('element').insertBefore(element, before);
    },
    
    /**
     * Wrapper for HTMLElement method.
     * @method removeChild
     * @param {HTMLElement} child The HTMLElement to remove
     * @return {HTMLElement} The removed DOM element. 
     */
    removeChild: function(child) {
        child = child.get ? child.get('element') : child;
        return this.get('element').removeChild(child);
    },
    
    /**
     * Wrapper for HTMLElement method.
     * @method replaceChild
     * @param {HTMLElement} newNode The HTMLElement to insert
     * @param {HTMLElement} oldNode The HTMLElement to replace
     * @return {HTMLElement} The replaced DOM element. 
     */
    replaceChild: function(newNode, oldNode) {
        newNode = newNode.get ? newNode.get('element') : newNode;
        oldNode = oldNode.get ? oldNode.get('element') : oldNode;
        return this.get('element').replaceChild(newNode, oldNode);
    },

    
    /**
     * Registers Element specific attributes.
     * @method initAttributes
     * @param {Object} map A key-value map of initial attribute configs
     */
    initAttributes: function(map) {
    },

    /**
     * Adds a listener for the given event.  These may be DOM or 
     * customEvent listeners.  Any event that is fired via fireEvent
     * can be listened for.  All handlers receive an event object. 
     * @method addListener
     * @param {String} type The name of the event to listen for
     * @param {Function} fn The handler to call when the event fires
     * @param {Any} obj A variable to pass to the handler
     * @param {Object} scope The object to use for the scope of the handler 
     */
    addListener: function(type, fn, obj, scope) {

        scope = scope || this;

        var Event = YAHOO.util.Event,
			el = this.get('element') || this.get('id'),
        	self = this;


		if (specialTypes[type] && !Event._createMouseDelegate) {
	        return false;	
		}


        if (!this._events[type]) { // create on the fly

            if (el && this.DOM_EVENTS[type]) {
				Event.on(el, type, function(e, matchedEl) {

					// Supplement IE with target, currentTarget relatedTarget

	                if (e.srcElement && !e.target) { 
	                    e.target = e.srcElement;
	                }

					if ((e.toElement && !e.relatedTarget) || (e.fromElement && !e.relatedTarget)) {
						e.relatedTarget = Event.getRelatedTarget(e);
					}
					
					if (!e.currentTarget) {
						e.currentTarget = el;
					}

					//	Note: matchedEl el is passed back for delegated listeners
		            self.fireEvent(type, e, matchedEl);

		        }, obj, scope);
            }
            this.createEvent(type, {scope: this});
        }
        
        return YAHOO.util.EventProvider.prototype.subscribe.apply(this, arguments); // notify via customEvent
    },


    /**
     * Alias for addListener
     * @method on
     * @param {String} type The name of the event to listen for
     * @param {Function} fn The function call when the event fires
     * @param {Any} obj A variable to pass to the handler
     * @param {Object} scope The object to use for the scope of the handler 
     */
    on: function() {
        return this.addListener.apply(this, arguments);
    },
    
    /**
     * Alias for addListener
     * @method subscribe
     * @param {String} type The name of the event to listen for
     * @param {Function} fn The function call when the event fires
     * @param {Any} obj A variable to pass to the handler
     * @param {Object} scope The object to use for the scope of the handler 
     */
    subscribe: function() {
        return this.addListener.apply(this, arguments);
    },
    
    /**
     * Remove an event listener
     * @method removeListener
     * @param {String} type The name of the event to listen for
     * @param {Function} fn The function call when the event fires
     */
    removeListener: function(type, fn) {
        return this.unsubscribe.apply(this, arguments);
    },
    
    /**
     * Wrapper for Dom method.
     * @method addClass
     * @param {String} className The className to add
     */
    addClass: function(className) {
        Dom.addClass(this.get('element'), className);
    },
    
    /**
     * Wrapper for Dom method.
     * @method getElementsByClassName
     * @param {String} className The className to collect
     * @param {String} tag (optional) The tag to use in
     * conjunction with class name
     * @return {Array} Array of HTMLElements
     */
    getElementsByClassName: function(className, tag) {
        return Dom.getElementsByClassName(className, tag,
                this.get('element') );
    },
    
    /**
     * Wrapper for Dom method.
     * @method hasClass
     * @param {String} className The className to add
     * @return {Boolean} Whether or not the element has the class name
     */
    hasClass: function(className) {
        return Dom.hasClass(this.get('element'), className); 
    },
    
    /**
     * Wrapper for Dom method.
     * @method removeClass
     * @param {String} className The className to remove
     */
    removeClass: function(className) {
        return Dom.removeClass(this.get('element'), className);
    },
    
    /**
     * Wrapper for Dom method.
     * @method replaceClass
     * @param {String} oldClassName The className to replace
     * @param {String} newClassName The className to add
     */
    replaceClass: function(oldClassName, newClassName) {
        return Dom.replaceClass(this.get('element'), 
                oldClassName, newClassName);
    },
    
    /**
     * Wrapper for Dom method.
     * @method setStyle
     * @param {String} property The style property to set
     * @param {String} value The value to apply to the style property
     */
    setStyle: function(property, value) {
        return Dom.setStyle(this.get('element'),  property, value); // TODO: always queuing?
    },
    
    /**
     * Wrapper for Dom method.
     * @method getStyle
     * @param {String} property The style property to retrieve
     * @return {String} The current value of the property
     */
    getStyle: function(property) {
        return Dom.getStyle(this.get('element'),  property);
    },
    
    /**
     * Apply any queued set calls.
     * @method fireQueue
     */
    fireQueue: function() {
        var queue = this._queue;
        for (var i = 0, len = queue.length; i < len; ++i) {
            this[queue[i][0]].apply(this, queue[i][1]);
        }
    },
    
    /**
     * Appends the HTMLElement into either the supplied parentNode.
     * @method appendTo
     * @param {HTMLElement | Element} parentNode The node to append to
     * @param {HTMLElement | Element} before An optional node to insert before
     * @return {HTMLElement} The appended DOM element. 
     */
    appendTo: function(parent, before) {
        parent = (parent.get) ?  parent.get('element') : Dom.get(parent);
        
        this.fireEvent('beforeAppendTo', {
            type: 'beforeAppendTo',
            target: parent
        });
        
        
        before = (before && before.get) ? 
                before.get('element') : Dom.get(before);
        var element = this.get('element');
        
        if (!element) {
            return false;
        }
        
        if (!parent) {
            return false;
        }
        
        if (element.parent != parent) {
            if (before) {
                parent.insertBefore(element, before);
            } else {
                parent.appendChild(element);
            }
        }
        
        
        this.fireEvent('appendTo', {
            type: 'appendTo',
            target: parent
        });

        return element;
    },
    
    get: function(key) {
        var configs = this._configs || {},
            el = configs.element; // avoid loop due to 'element'

        if (el && !configs[key] && !YAHOO.lang.isUndefined(el.value[key]) ) {
            this._setHTMLAttrConfig(key);
        }

        return AttributeProvider.prototype.get.call(this, key);
    },

    setAttributes: function(map, silent) {
        // set based on configOrder
        var done = {},
            configOrder = this._configOrder;

        // set based on configOrder
        for (var i = 0, len = configOrder.length; i < len; ++i) {
            if (map[configOrder[i]] !== undefined) {
                done[configOrder[i]] = true;
                this.set(configOrder[i], map[configOrder[i]], silent);
            }
        }

        // unconfigured (e.g. Dom attributes)
        for (var att in map) {
            if (map.hasOwnProperty(att) && !done[att]) {
                this.set(att, map[att], silent);
            }
        }
    },

    set: function(key, value, silent) {
        var el = this.get('element');
        if (!el) {
            this._queue[this._queue.length] = ['set', arguments];
            if (this._configs[key]) {
                this._configs[key].value = value; // so "get" works while queueing
            
            }
            return;
        }
        
        // set it on the element if not configured and is an HTML attribute
        if ( !this._configs[key] && !YAHOO.lang.isUndefined(el[key]) ) {
            this._setHTMLAttrConfig(key);
        }

        return AttributeProvider.prototype.set.apply(this, arguments);
    },
    
    setAttributeConfig: function(key, map, init) {
        this._configOrder.push(key);
        AttributeProvider.prototype.setAttributeConfig.apply(this, arguments);
    },

    createEvent: function(type, config) {
        this._events[type] = true;
        return AttributeProvider.prototype.createEvent.apply(this, arguments);
    },
    
    init: function(el, attr) {
        this._initElement(el, attr); 
    },

    destroy: function() {
        var el = this.get('element');
        YAHOO.util.Event.purgeElement(el, true); // purge DOM listeners recursively
        this.unsubscribeAll(); // unsubscribe all custom events

        if (el && el.parentNode) {
            el.parentNode.removeChild(el); // pull from the DOM
        }

        // revert initial configs
        this._queue = [];
        this._events = {};
        this._configs = {};
        this._configOrder = []; 
    },

    _initElement: function(el, attr) {
        this._queue = this._queue || [];
        this._events = this._events || {};
        this._configs = this._configs || {};
        this._configOrder = []; 
        attr = attr || {};
        attr.element = attr.element || el || null;

        var isReady = false;  // to determine when to init HTMLElement and content

        var DOM_EVENTS = Element.DOM_EVENTS;
        this.DOM_EVENTS = this.DOM_EVENTS || {};

        for (var event in DOM_EVENTS) {
            if (DOM_EVENTS.hasOwnProperty(event)) {
                this.DOM_EVENTS[event] = DOM_EVENTS[event];
            }
        }

        if (typeof attr.element === 'string') { // register ID for get() access
            this._setHTMLAttrConfig('id', { value: attr.element });
        }

        if (Dom.get(attr.element)) {
            isReady = true;
            this._initHTMLElement(attr);
            this._initContent(attr);
        }

        YAHOO.util.Event.onAvailable(attr.element, function() {
            if (!isReady) { // otherwise already done
                this._initHTMLElement(attr);
            }

            this.fireEvent('available', { type: 'available', target: Dom.get(attr.element) });  
        }, this, true);
        
        YAHOO.util.Event.onContentReady(attr.element, function() {
            if (!isReady) { // otherwise already done
                this._initContent(attr);
            }
            this.fireEvent('contentReady', { type: 'contentReady', target: Dom.get(attr.element) });  
        }, this, true);
    },

    _initHTMLElement: function(attr) {
        /**
         * The HTMLElement the Element instance refers to.
         * @attribute element
         * @type HTMLElement
         */
        this.setAttributeConfig('element', {
            value: Dom.get(attr.element),
            readOnly: true
         });
    },

    _initContent: function(attr) {
        this.initAttributes(attr);
        this.setAttributes(attr, true);
        this.fireQueue();

    },

    /**
     * Sets the value of the property and fires beforeChange and change events.
     * @private
     * @method _setHTMLAttrConfig
     * @param {YAHOO.util.Element} element The Element instance to
     * register the config to.
     * @param {String} key The name of the config to register
     * @param {Object} map A key-value map of the config's params
     */
    _setHTMLAttrConfig: function(key, map) {
        var el = this.get('element');
        map = map || {};
        map.name = key;

        map.setter = map.setter || this.DEFAULT_HTML_SETTER;
        map.getter = map.getter || this.DEFAULT_HTML_GETTER;

        map.value = map.value || el[key];
        this._configs[key] = new YAHOO.util.Attribute(map, this);
    }
};

/**
 * Fires when the Element's HTMLElement can be retrieved by Id.
 * <p>See: <a href="#addListener">Element.addListener</a></p>
 * <p><strong>Event fields:</strong><br>
 * <code>&lt;String&gt; type</code> available<br>
 * <code>&lt;HTMLElement&gt;
 * target</code> the HTMLElement bound to this Element instance<br>
 * <p><strong>Usage:</strong><br>
 * <code>var handler = function(e) {var target = e.target};<br>
 * myTabs.addListener('available', handler);</code></p>
 * @event available
 */
 
/**
 * Fires when the Element's HTMLElement subtree is rendered.
 * <p>See: <a href="#addListener">Element.addListener</a></p>
 * <p><strong>Event fields:</strong><br>
 * <code>&lt;String&gt; type</code> contentReady<br>
 * <code>&lt;HTMLElement&gt;
 * target</code> the HTMLElement bound to this Element instance<br>
 * <p><strong>Usage:</strong><br>
 * <code>var handler = function(e) {var target = e.target};<br>
 * myTabs.addListener('contentReady', handler);</code></p>
 * @event contentReady
 */

/**
 * Fires before the Element is appended to another Element.
 * <p>See: <a href="#addListener">Element.addListener</a></p>
 * <p><strong>Event fields:</strong><br>
 * <code>&lt;String&gt; type</code> beforeAppendTo<br>
 * <code>&lt;HTMLElement/Element&gt;
 * target</code> the HTMLElement/Element being appended to 
 * <p><strong>Usage:</strong><br>
 * <code>var handler = function(e) {var target = e.target};<br>
 * myTabs.addListener('beforeAppendTo', handler);</code></p>
 * @event beforeAppendTo
 */

/**
 * Fires after the Element is appended to another Element.
 * <p>See: <a href="#addListener">Element.addListener</a></p>
 * <p><strong>Event fields:</strong><br>
 * <code>&lt;String&gt; type</code> appendTo<br>
 * <code>&lt;HTMLElement/Element&gt;
 * target</code> the HTMLElement/Element being appended to 
 * <p><strong>Usage:</strong><br>
 * <code>var handler = function(e) {var target = e.target};<br>
 * myTabs.addListener('appendTo', handler);</code></p>
 * @event appendTo
 */

YAHOO.augment(Element, AttributeProvider);
YAHOO.util.Element = Element;
})();

YAHOO.register("element", YAHOO.util.Element, {version: "2.9.0", build: "2800"});

/*
Copyright (c) 2011, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://developer.yahoo.com/yui/license.html
version: 2.9.0
*/
/**
* @module button
* @description <p>The Button Control enables the creation of rich, graphical 
* buttons that function like traditional HTML form buttons.  <em>Unlike</em> 
* traditional HTML form buttons, buttons created with the Button Control can have 
* a label that is different from its value.  With the inclusion of the optional 
* <a href="module_menu.html">Menu Control</a>, the Button Control can also be
* used to create menu buttons and split buttons, controls that are not 
* available natively in HTML.  The Button Control can also be thought of as a 
* way to create more visually engaging implementations of the browser's 
* default radio-button and check-box controls.</p>
* <p>The Button Control supports the following types:</p>
* <dl>
* <dt>push</dt>
* <dd>Basic push button that can execute a user-specified command when 
* pressed.</dd>
* <dt>link</dt>
* <dd>Navigates to a specified url when pressed.</dd>
* <dt>submit</dt>
* <dd>Submits the parent form when pressed.</dd>
* <dt>reset</dt>
* <dd>Resets the parent form when pressed.</dd>
* <dt>checkbox</dt>
* <dd>Maintains a "checked" state that can be toggled on and off.</dd>
* <dt>radio</dt>
* <dd>Maintains a "checked" state that can be toggled on and off.  Use with 
* the ButtonGroup class to create a set of controls that are mutually 
* exclusive; checking one button in the set will uncheck all others in 
* the group.</dd>
* <dt>menu</dt>
* <dd>When pressed will show/hide a menu.</dd>
* <dt>split</dt>
* <dd>Can execute a user-specified command or display a menu when pressed.</dd>
* </dl>
* @title Button
* @namespace YAHOO.widget
* @requires yahoo, dom, element, event
* @optional container, menu
*/


(function () {


    /**
    * The Button class creates a rich, graphical button.
    * @param {String} p_oElement String specifying the id attribute of the 
    * <code>&#60;input&#62;</code>, <code>&#60;button&#62;</code>,
    * <code>&#60;a&#62;</code>, or <code>&#60;span&#62;</code> element to 
    * be used to create the button.
    * @param {<a href="http://www.w3.org/TR/2000/WD-DOM-Level-1-20000929/level-
    * one-html.html#ID-6043025">HTMLInputElement</a>|<a href="http://www.w3.org
    * /TR/2000/WD-DOM-Level-1-20000929/level-one-html.html#ID-34812697">
    * HTMLButtonElement</a>|<a href="
    * http://www.w3.org/TR/2000/WD-DOM-Level-1-20000929/level-one-html.html#
    * ID-33759296">HTMLElement</a>} p_oElement Object reference for the 
    * <code>&#60;input&#62;</code>, <code>&#60;button&#62;</code>, 
    * <code>&#60;a&#62;</code>, or <code>&#60;span&#62;</code> element to be 
    * used to create the button.
    * @param {Object} p_oElement Object literal specifying a set of   
    * configuration attributes used to create the button.
    * @param {Object} p_oAttributes Optional. Object literal specifying a set  
    * of configuration attributes used to create the button.
    * @namespace YAHOO.widget
    * @class Button
    * @constructor
    * @extends YAHOO.util.Element
    */



    // Shorthard for utilities

    var Dom = YAHOO.util.Dom,
        Event = YAHOO.util.Event,
        Lang = YAHOO.lang,
        UA = YAHOO.env.ua,
        Overlay = YAHOO.widget.Overlay,
        Menu = YAHOO.widget.Menu,
    
    
        // Private member variables
    
        m_oButtons = {},    // Collection of all Button instances
        m_oOverlayManager = null,   // YAHOO.widget.OverlayManager instance
        m_oSubmitTrigger = null,    // The button that submitted the form 
        m_oFocusedButton = null;    // The button that has focus



    // Private methods

    
    
    /**
    * @method createInputElement
    * @description Creates an <code>&#60;input&#62;</code> element of the 
    * specified type.
    * @private
    * @param {String} p_sType String specifying the type of 
    * <code>&#60;input&#62;</code> element to create.
    * @param {String} p_sName String specifying the name of 
    * <code>&#60;input&#62;</code> element to create.
    * @param {String} p_sValue String specifying the value of 
    * <code>&#60;input&#62;</code> element to create.
    * @param {String} p_bChecked Boolean specifying if the  
    * <code>&#60;input&#62;</code> element is to be checked.
    * @return {<a href="http://www.w3.org/TR/2000/WD-DOM-Level-1-20000929/level-
    * one-html.html#ID-6043025">HTMLInputElement</a>}
    */
    function createInputElement(p_sType, p_sName, p_sValue, p_bChecked) {
    
        var oInput,
            sInput;
    
        if (Lang.isString(p_sType) && Lang.isString(p_sName)) {
        
            if (UA.ie && (UA.ie < 9)) {
        
                /*
                    For IE it is necessary to create the element with the 
                    "type," "name," "value," and "checked" properties set all 
                    at once.
                */
            
                sInput = "<input type=\"" + p_sType + "\" name=\"" + 
                    p_sName + "\"";
        
                if (p_bChecked) {
        
                    sInput += " checked";
                
                }
                
                sInput += ">";
        
                oInput = document.createElement(sInput);
        
                oInput.value = p_sValue;

            } else {
            
                oInput = document.createElement("input");
                oInput.name = p_sName;
                oInput.type = p_sType;
                oInput.value = p_sValue;
        
                if (p_bChecked) {
        
                    oInput.checked = true;
                
                }
        
            }
        
        
        }

		return oInput;
    
    }
    
    
    /**
    * @method setAttributesFromSrcElement
    * @description Gets the values for all the attributes of the source element 
    * (either <code>&#60;input&#62;</code> or <code>&#60;a&#62;</code>) that 
    * map to Button configuration attributes and sets them into a collection 
    * that is passed to the Button constructor.
    * @private
    * @param {<a href="http://www.w3.org/TR/2000/WD-DOM-Level-1-20000929/level-
    * one-html.html#ID-6043025">HTMLInputElement</a>|<a href="http://www.w3.org/
    * TR/2000/WD-DOM-Level-1-20000929/level-one-html.html#ID-
    * 48250443">HTMLAnchorElement</a>} p_oElement Object reference to the HTML 
    * element (either <code>&#60;input&#62;</code> or <code>&#60;span&#62;
    * </code>) used to create the button.
    * @param {Object} p_oAttributes Object reference for the collection of 
    * configuration attributes used to create the button.
    */
    function setAttributesFromSrcElement(p_oElement, p_oAttributes) {
    
        var sSrcElementNodeName = p_oElement.nodeName.toUpperCase(),
			sClass = (this.CLASS_NAME_PREFIX + this.CSS_CLASS_NAME),
            me = this,
            oAttribute,
            oRootNode,
            sText;
            
    
        /**
        * @method setAttributeFromDOMAttribute
        * @description Gets the value of the specified DOM attribute and sets it 
        * into the collection of configuration attributes used to configure 
        * the button.
        * @private
        * @param {String} p_sAttribute String representing the name of the 
        * attribute to retrieve from the DOM element.
        */
        function setAttributeFromDOMAttribute(p_sAttribute) {
    
            if (!(p_sAttribute in p_oAttributes)) {
    
                /*
                    Need to use "getAttributeNode" instead of "getAttribute" 
                    because using "getAttribute," IE will return the innerText 
                    of a <code>&#60;button&#62;</code> for the value attribute  
                    rather than the value of the "value" attribute.
                */
        
                oAttribute = p_oElement.getAttributeNode(p_sAttribute);
        
    
                if (oAttribute && ("value" in oAttribute)) {
    
    
                    p_oAttributes[p_sAttribute] = oAttribute.value;
    
                }
    
            }
        
        }
    
    
        /**
        * @method setFormElementProperties
        * @description Gets the value of the attributes from the form element  
        * and sets them into the collection of configuration attributes used to 
        * configure the button.
        * @private
        */
        function setFormElementProperties() {
    
            setAttributeFromDOMAttribute("type");
    
            if (p_oAttributes.type == "button") {
            
                p_oAttributes.type = "push";
            
            }
    
            if (!("disabled" in p_oAttributes)) {
    
                p_oAttributes.disabled = p_oElement.disabled;
    
            }
    
            setAttributeFromDOMAttribute("name");
            setAttributeFromDOMAttribute("value");
            setAttributeFromDOMAttribute("title");
    
        }

    
        switch (sSrcElementNodeName) {
        
        case "A":
            
            p_oAttributes.type = "link";
            
            setAttributeFromDOMAttribute("href");
            setAttributeFromDOMAttribute("target");
        
            break;
    
        case "INPUT":

            setFormElementProperties();

            if (!("checked" in p_oAttributes)) {
    
                p_oAttributes.checked = p_oElement.checked;
    
            }

            break;

        case "BUTTON":

            setFormElementProperties();

            oRootNode = p_oElement.parentNode.parentNode;

            if (Dom.hasClass(oRootNode, sClass + "-checked")) {
            
                p_oAttributes.checked = true;
            
            }

            if (Dom.hasClass(oRootNode, sClass + "-disabled")) {

                p_oAttributes.disabled = true;
            
            }

            p_oElement.removeAttribute("value");

            p_oElement.setAttribute("type", "button");

            break;
        
        }

        p_oElement.removeAttribute("id");
        p_oElement.removeAttribute("name");
        
        if (!("tabindex" in p_oAttributes)) {

            p_oAttributes.tabindex = p_oElement.tabIndex;

        }
    
        if (!("label" in p_oAttributes)) {
    
            // Set the "label" property
        
            sText = sSrcElementNodeName == "INPUT" ? 
                            p_oElement.value : p_oElement.innerHTML;
        
    
            if (sText && sText.length > 0) {
                
                p_oAttributes.label = sText;
                
            } 
    
        }
    
    }
    
    
    /**
    * @method initConfig
    * @description Initializes the set of configuration attributes that are 
    * used to instantiate the button.
    * @private
    * @param {Object} Object representing the button's set of 
    * configuration attributes.
    */
    function initConfig(p_oConfig) {
    
        var oAttributes = p_oConfig.attributes,
            oSrcElement = oAttributes.srcelement,
            sSrcElementNodeName = oSrcElement.nodeName.toUpperCase(),
            me = this;
    
    
        if (sSrcElementNodeName == this.NODE_NAME) {
    
            p_oConfig.element = oSrcElement;
            p_oConfig.id = oSrcElement.id;

            Dom.getElementsBy(function (p_oElement) {
            
                switch (p_oElement.nodeName.toUpperCase()) {
                
                case "BUTTON":
                case "A":
                case "INPUT":

                    setAttributesFromSrcElement.call(me, p_oElement, 
                        oAttributes);

                    break;                        
                
                }
            
            }, "*", oSrcElement);
        
        }
        else {
    
            switch (sSrcElementNodeName) {

            case "BUTTON":
            case "A":
            case "INPUT":

                setAttributesFromSrcElement.call(this, oSrcElement, 
                    oAttributes);

                break;

            }
        
        }
    
    }



    //  Constructor

    YAHOO.widget.Button = function (p_oElement, p_oAttributes) {
    
		if (!Overlay && YAHOO.widget.Overlay) {
		
			Overlay = YAHOO.widget.Overlay;
		
		}


		if (!Menu && YAHOO.widget.Menu) {
		
			Menu = YAHOO.widget.Menu;
		
		}


        var fnSuperClass = YAHOO.widget.Button.superclass.constructor,
            oConfig,
            oElement;
    

        if (arguments.length == 1 && !Lang.isString(p_oElement) && !p_oElement.nodeName) {
    
            if (!p_oElement.id) {
    
                p_oElement.id = Dom.generateId();
    
    
            }
    
    
            fnSuperClass.call(this, (this.createButtonElement(p_oElement.type)), p_oElement);
    
        }
        else {
    
            oConfig = { element: null, attributes: (p_oAttributes || {}) };
    
    
            if (Lang.isString(p_oElement)) {
    
                oElement = Dom.get(p_oElement);
    
                if (oElement) {

                    if (!oConfig.attributes.id) {
                    
                        oConfig.attributes.id = p_oElement;
                    
                    }
    
                
                
                    oConfig.attributes.srcelement = oElement;
                
                    initConfig.call(this, oConfig);
                
                
                    if (!oConfig.element) {
                
                
                        oConfig.element = this.createButtonElement(oConfig.attributes.type);
                
                    }
                
                    fnSuperClass.call(this, oConfig.element, oConfig.attributes);
    
                }
    
            }
            else if (p_oElement.nodeName) {
    
                if (!oConfig.attributes.id) {
    
                    if (p_oElement.id) {
        
                        oConfig.attributes.id = p_oElement.id;
                    
                    }
                    else {
        
                        oConfig.attributes.id = Dom.generateId();
        
        
                    }
    
                }
    
    
    
                oConfig.attributes.srcelement = p_oElement;
        
                initConfig.call(this, oConfig);
        
        
                if (!oConfig.element) {
    
            
                    oConfig.element = this.createButtonElement(oConfig.attributes.type);
            
                }
            
                fnSuperClass.call(this, oConfig.element, oConfig.attributes);
            
            }
    
        }
    
    };



    YAHOO.extend(YAHOO.widget.Button, YAHOO.util.Element, {
    
    
        // Protected properties
        
        
        /** 
        * @property _button
        * @description Object reference to the button's internal 
        * <code>&#60;a&#62;</code> or <code>&#60;button&#62;</code> element.
        * @default null
        * @protected
        * @type <a href="http://www.w3.org/TR/2000/WD-DOM-Level-1-20000929/
        * level-one-html.html#ID-48250443">HTMLAnchorElement</a>|<a href="
        * http://www.w3.org/TR/2000/WD-DOM-Level-1-20000929/level-one-html.html
        * #ID-34812697">HTMLButtonElement</a>
        */
        _button: null,
        
        
        /** 
        * @property _menu
        * @description Object reference to the button's menu.
        * @default null
        * @protected
        * @type {<a href="YAHOO.widget.Overlay.html">YAHOO.widget.Overlay</a>|
        * <a href="YAHOO.widget.Menu.html">YAHOO.widget.Menu</a>}
        */
        _menu: null,
        
        
        /** 
        * @property _hiddenFields
        * @description Object reference to the <code>&#60;input&#62;</code>  
        * element, or array of HTML form elements used to represent the button
        *  when its parent form is submitted.
        * @default null
        * @protected
        * @type <a href="http://www.w3.org/TR/2000/WD-DOM-Level-1-20000929/
        * level-one-html.html#ID-6043025">HTMLInputElement</a>|Array
        */
        _hiddenFields: null,
        
        
        /** 
        * @property _onclickAttributeValue
        * @description Object reference to the button's current value for the 
        * "onclick" configuration attribute.
        * @default null
        * @protected
        * @type Object
        */
        _onclickAttributeValue: null,
        
        
        /** 
        * @property _activationKeyPressed
        * @description Boolean indicating if the key(s) that toggle the button's 
        * "active" state have been pressed.
        * @default false
        * @protected
        * @type Boolean
        */
        _activationKeyPressed: false,
        
        
        /** 
        * @property _activationButtonPressed
        * @description Boolean indicating if the mouse button that toggles 
        * the button's "active" state has been pressed.
        * @default false
        * @protected
        * @type Boolean
        */
        _activationButtonPressed: false,
        
        
        /** 
        * @property _hasKeyEventHandlers
        * @description Boolean indicating if the button's "blur", "keydown" and 
        * "keyup" event handlers are assigned
        * @default false
        * @protected
        * @type Boolean
        */
        _hasKeyEventHandlers: false,
        
        
        /** 
        * @property _hasMouseEventHandlers
        * @description Boolean indicating if the button's "mouseout," 
        * "mousedown," and "mouseup" event handlers are assigned
        * @default false
        * @protected
        * @type Boolean
        */
        _hasMouseEventHandlers: false,


        /** 
        * @property _nOptionRegionX
        * @description Number representing the X coordinate of the leftmost edge of the Button's 
        * option region.  Applies only to Buttons of type "split".
        * @default 0
        * @protected
        * @type Number
        */        
        _nOptionRegionX: 0,
        


        // Constants

        /**
        * @property CLASS_NAME_PREFIX
        * @description Prefix used for all class names applied to a Button.
        * @default "yui-"
        * @final
        * @type String
        */
        CLASS_NAME_PREFIX: "yui-",
        
        
        /**
        * @property NODE_NAME
        * @description The name of the node to be used for the button's 
        * root element.
        * @default "SPAN"
        * @final
        * @type String
        */
        NODE_NAME: "SPAN",
        
        
        /**
        * @property CHECK_ACTIVATION_KEYS
        * @description Array of numbers representing keys that (when pressed) 
        * toggle the button's "checked" attribute.
        * @default [32]
        * @final
        * @type Array
        */
        CHECK_ACTIVATION_KEYS: [32],
        
        
        /**
        * @property ACTIVATION_KEYS
        * @description Array of numbers representing keys that (when presed) 
        * toggle the button's "active" state.
        * @default [13, 32]
        * @final
        * @type Array
        */
        ACTIVATION_KEYS: [13, 32],
        
        
        /**
        * @property OPTION_AREA_WIDTH
        * @description Width (in pixels) of the area of a split button that  
        * when pressed will display a menu.
        * @default 20
        * @final
        * @type Number
        */
        OPTION_AREA_WIDTH: 20,
        
        
        /**
        * @property CSS_CLASS_NAME
        * @description String representing the CSS class(es) to be applied to  
        * the button's root element.
        * @default "button"
        * @final
        * @type String
        */
        CSS_CLASS_NAME: "button",
        
        
        
        // Protected attribute setter methods
        
        
        /**
        * @method _setType
        * @description Sets the value of the button's "type" attribute.
        * @protected
        * @param {String} p_sType String indicating the value for the button's 
        * "type" attribute.
        */
        _setType: function (p_sType) {
        
            if (p_sType == "split") {
        
                this.on("option", this._onOption);
        
            }
        
        },
        
        
        /**
        * @method _setLabel
        * @description Sets the value of the button's "label" attribute.
        * @protected
        * @param {HTML} p_sLabel String indicating the value for the button's 
        * "label" attribute.
        */
        _setLabel: function (p_sLabel) {

            this._button.innerHTML = p_sLabel;

            
            /*
                Remove and add the default class name from the root element
                for Gecko to ensure that the button shrinkwraps to the label.
                Without this the button will not be rendered at the correct 
                width when the label changes.  The most likely cause for this 
                bug is button's use of the Gecko-specific CSS display type of 
                "-moz-inline-box" to simulate "inline-block" supported by IE, 
                Safari and Opera.
            */
            
            var sClass,
                nGeckoVersion = UA.gecko;
				
            
            if (nGeckoVersion && nGeckoVersion < 1.9 && Dom.inDocument(this.get("element"))) {
            
                sClass = (this.CLASS_NAME_PREFIX + this.CSS_CLASS_NAME);

                this.removeClass(sClass);
                
                Lang.later(0, this, this.addClass, sClass);

            }
        
        },
        
        
        /**
        * @method _setTabIndex
        * @description Sets the value of the button's "tabindex" attribute.
        * @protected
        * @param {Number} p_nTabIndex Number indicating the value for the 
        * button's "tabindex" attribute.
        */
        _setTabIndex: function (p_nTabIndex) {
        
            this._button.tabIndex = p_nTabIndex;
        
        },
        
        
        /**
        * @method _setTitle
        * @description Sets the value of the button's "title" attribute.
        * @protected
        * @param {String} p_nTabIndex Number indicating the value for 
        * the button's "title" attribute.
        */
        _setTitle: function (p_sTitle) {
        
            if (this.get("type") != "link") {
        
                this._button.title = p_sTitle;
        
            }
        
        },
        
        
        /**
        * @method _setDisabled
        * @description Sets the value of the button's "disabled" attribute.
        * @protected
        * @param {Boolean} p_bDisabled Boolean indicating the value for 
        * the button's "disabled" attribute.
        */
        _setDisabled: function (p_bDisabled) {
        
            if (this.get("type") != "link") {
        
                if (p_bDisabled) {
        
                    if (this._menu) {
        
                        this._menu.hide();
        
                    }
        
                    if (this.hasFocus()) {
                    
                        this.blur();
                    
                    }
        
                    this._button.setAttribute("disabled", "disabled");
        
                    this.addStateCSSClasses("disabled");

                    this.removeStateCSSClasses("hover");
                    this.removeStateCSSClasses("active");
                    this.removeStateCSSClasses("focus");
        
                }
                else {
        
                    this._button.removeAttribute("disabled");
        
                    this.removeStateCSSClasses("disabled");
                
                }
        
            }
        
        },

        
        /**
        * @method _setHref
        * @description Sets the value of the button's "href" attribute.
        * @protected
        * @param {String} p_sHref String indicating the value for the button's 
        * "href" attribute.
        */
        _setHref: function (p_sHref) {
        
            if (this.get("type") == "link") {
        
                this._button.href = p_sHref;
            
            }
        
        },
        
        
        /**
        * @method _setTarget
        * @description Sets the value of the button's "target" attribute.
        * @protected
        * @param {String} p_sTarget String indicating the value for the button's 
        * "target" attribute.
        */
        _setTarget: function (p_sTarget) {
        
            if (this.get("type") == "link") {
        
                this._button.setAttribute("target", p_sTarget);
            
            }
        
        },
        
        
        /**
        * @method _setChecked
        * @description Sets the value of the button's "target" attribute.
        * @protected
        * @param {Boolean} p_bChecked Boolean indicating the value for  
        * the button's "checked" attribute.
        */
        _setChecked: function (p_bChecked) {
        
            var sType = this.get("type");
        
            if (sType == "checkbox" || sType == "radio") {
        
                if (p_bChecked) {
                    this.addStateCSSClasses("checked");
                }
                else {
                    this.removeStateCSSClasses("checked");
                }
        
            }
        
        },

        
        /**
        * @method _setMenu
        * @description Sets the value of the button's "menu" attribute.
        * @protected
        * @param {Object} p_oMenu Object indicating the value for the button's 
        * "menu" attribute.
        */
        _setMenu: function (p_oMenu) {

            var bLazyLoad = this.get("lazyloadmenu"),
                oButtonElement = this.get("element"),
                sMenuCSSClassName,
        
                /*
                    Boolean indicating if the value of p_oMenu is an instance 
                    of YAHOO.widget.Menu or YAHOO.widget.Overlay.
                */
        
                bInstance = false,
                oMenu,
                oMenuElement,
                oSrcElement;
        

			function onAppendTo() {

				oMenu.render(oButtonElement.parentNode);
				
				this.removeListener("appendTo", onAppendTo);
			
			}
			
			
			function setMenuContainer() {

				oMenu.cfg.queueProperty("container", oButtonElement.parentNode);
				
				this.removeListener("appendTo", setMenuContainer);
			
			}


			function initMenu() {
		
				var oContainer;
		
				if (oMenu) {

					Dom.addClass(oMenu.element, this.get("menuclassname"));
					Dom.addClass(oMenu.element, this.CLASS_NAME_PREFIX + this.get("type") + "-button-menu");

					oMenu.showEvent.subscribe(this._onMenuShow, null, this);
					oMenu.hideEvent.subscribe(this._onMenuHide, null, this);
					oMenu.renderEvent.subscribe(this._onMenuRender, null, this);


					if (Menu && oMenu instanceof Menu) {

						if (bLazyLoad) {

							oContainer = this.get("container");

							if (oContainer) {

								oMenu.cfg.queueProperty("container", oContainer);

							}
							else {

								this.on("appendTo", setMenuContainer);

							}

						}

						oMenu.cfg.queueProperty("clicktohide", false);

						oMenu.keyDownEvent.subscribe(this._onMenuKeyDown, this, true);
						oMenu.subscribe("click", this._onMenuClick, this, true);

						this.on("selectedMenuItemChange", this._onSelectedMenuItemChange);
		
						oSrcElement = oMenu.srcElement;
		
						if (oSrcElement && oSrcElement.nodeName.toUpperCase() == "SELECT") {

							oSrcElement.style.display = "none";
							oSrcElement.parentNode.removeChild(oSrcElement);
		
						}
		
					}
					else if (Overlay && oMenu instanceof Overlay) {
		
						if (!m_oOverlayManager) {
		
							m_oOverlayManager = new YAHOO.widget.OverlayManager();
						
						}
						
						m_oOverlayManager.register(oMenu);
						
					}
		
		
					this._menu = oMenu;

		
					if (!bInstance && !bLazyLoad) {
		
						if (Dom.inDocument(oButtonElement)) {
	
							oMenu.render(oButtonElement.parentNode);
						
						}
						else {
		
							this.on("appendTo", onAppendTo);
						
						}
					
					}
		
				}
		
			}

        
            if (Overlay) {
        
				if (Menu) {
				
					sMenuCSSClassName = Menu.prototype.CSS_CLASS_NAME;
				
				}
			
				if (p_oMenu && Menu && (p_oMenu instanceof Menu)) {
			
					oMenu = p_oMenu;
					bInstance = true;
			
					initMenu.call(this);
			
				}
				else if (Overlay && p_oMenu && (p_oMenu instanceof Overlay)) {
			
					oMenu = p_oMenu;
					bInstance = true;
			
					oMenu.cfg.queueProperty("visible", false);
			
					initMenu.call(this);
			
				}
				else if (Menu && Lang.isArray(p_oMenu)) {

					oMenu = new Menu(Dom.generateId(), { lazyload: bLazyLoad, itemdata: p_oMenu });
						
					this._menu = oMenu;
			
					this.on("appendTo", initMenu);
			
				}
				else if (Lang.isString(p_oMenu)) {
			
					oMenuElement = Dom.get(p_oMenu);
			
					if (oMenuElement) {
			
						if (Menu && Dom.hasClass(oMenuElement, sMenuCSSClassName) || 
							oMenuElement.nodeName.toUpperCase() == "SELECT") {
				
							oMenu = new Menu(p_oMenu, { lazyload: bLazyLoad });
				
							initMenu.call(this);
				
						}
						else if (Overlay) {
			
							oMenu = new Overlay(p_oMenu, { visible: false });
				
							initMenu.call(this);
				
						}
			
					}
			
				}
				else if (p_oMenu && p_oMenu.nodeName) {
			
					if (Menu && Dom.hasClass(p_oMenu, sMenuCSSClassName) || 
							p_oMenu.nodeName.toUpperCase() == "SELECT") {
			
						oMenu = new Menu(p_oMenu, { lazyload: bLazyLoad });
					
						initMenu.call(this);
			
					}
					else if (Overlay) {
			
						if (!p_oMenu.id) {
						
							Dom.generateId(p_oMenu);
						
						}
			
						oMenu = new Overlay(p_oMenu, { visible: false });
			
						initMenu.call(this);
					
					}
				
				}
            
            }
        
        },
        
        
        /**
        * @method _setOnClick
        * @description Sets the value of the button's "onclick" attribute.
        * @protected
        * @param {Object} p_oObject Object indicating the value for the button's 
        * "onclick" attribute.
        */
        _setOnClick: function (p_oObject) {
        
            /*
                Remove any existing listeners if a "click" event handler 
                has already been specified.
            */
        
            if (this._onclickAttributeValue && 
                (this._onclickAttributeValue != p_oObject)) {
        
                this.removeListener("click", this._onclickAttributeValue.fn);
        
                this._onclickAttributeValue = null;
        
            }
        
        
            if (!this._onclickAttributeValue && 
                Lang.isObject(p_oObject) && 
                Lang.isFunction(p_oObject.fn)) {
        
                this.on("click", p_oObject.fn, p_oObject.obj, p_oObject.scope);
        
                this._onclickAttributeValue = p_oObject;
        
            }
        
        },

        
        
        // Protected methods

        
        
        /**
        * @method _isActivationKey
        * @description Determines if the specified keycode is one that toggles  
        * the button's "active" state.
        * @protected
        * @param {Number} p_nKeyCode Number representing the keycode to 
        * be evaluated.
        * @return {Boolean}
        */
        _isActivationKey: function (p_nKeyCode) {
        
            var sType = this.get("type"),
                aKeyCodes = (sType == "checkbox" || sType == "radio") ? 
                    this.CHECK_ACTIVATION_KEYS : this.ACTIVATION_KEYS,
        
                nKeyCodes = aKeyCodes.length,
                bReturnVal = false,
                i;
        

            if (nKeyCodes > 0) {
        
                i = nKeyCodes - 1;
        
                do {
        
                    if (p_nKeyCode == aKeyCodes[i]) {
        
                        bReturnVal = true;
                        break;
        
                    }
        
                }
                while (i--);
            
            }
            
            return bReturnVal;
        
        },
        
        
        /**
        * @method _isSplitButtonOptionKey
        * @description Determines if the specified keycode is one that toggles  
        * the display of the split button's menu.
        * @protected
        * @param {Event} p_oEvent Object representing the DOM event object  
        * passed back by the event utility (YAHOO.util.Event).
        * @return {Boolean}
        */
        _isSplitButtonOptionKey: function (p_oEvent) {

			var bShowMenu = (Event.getCharCode(p_oEvent) == 40);


			var onKeyPress = function (p_oEvent) {

				Event.preventDefault(p_oEvent);

				this.removeListener("keypress", onKeyPress);
			
			};


			// Prevent the browser from scrolling the window
			if (bShowMenu) {

				if (UA.opera) {
	
					this.on("keypress", onKeyPress);
	
				}

				Event.preventDefault(p_oEvent);
			}

            return bShowMenu;
        
        },
        
        
        /**
        * @method _addListenersToForm
        * @description Adds event handlers to the button's form.
        * @protected
        */
        _addListenersToForm: function () {
        
            var oForm = this.getForm(),
                onFormKeyPress = YAHOO.widget.Button.onFormKeyPress,
                bHasKeyPressListener,
                oSrcElement,
                aListeners,
                nListeners,
                i;
        
        
            if (oForm) {
        
                Event.on(oForm, "reset", this._onFormReset, null, this);
                Event.on(oForm, "submit", this._onFormSubmit, null, this);
        
                oSrcElement = this.get("srcelement");
        
        
                if (this.get("type") == "submit" || 
                    (oSrcElement && oSrcElement.type == "submit")) 
                {
                
                    aListeners = Event.getListeners(oForm, "keypress");
                    bHasKeyPressListener = false;
            
                    if (aListeners) {
            
                        nListeners = aListeners.length;
        
                        if (nListeners > 0) {
            
                            i = nListeners - 1;
                            
                            do {
               
                                if (aListeners[i].fn == onFormKeyPress) {
                
                                    bHasKeyPressListener = true;
                                    break;
                                
                                }
                
                            }
                            while (i--);
                        
                        }
                    
                    }
            
            
                    if (!bHasKeyPressListener) {
               
                        Event.on(oForm, "keypress", onFormKeyPress);
            
                    }
        
                }
            
            }
        
        },
        
        
        
        /**
        * @method _showMenu
        * @description Shows the button's menu.
        * @protected
        * @param {Event} p_oEvent Object representing the DOM event object 
        * passed back by the event utility (YAHOO.util.Event) that triggered 
        * the display of the menu.
        */
        _showMenu: function (p_oEvent) {

            if (YAHOO.widget.MenuManager) {
                YAHOO.widget.MenuManager.hideVisible();
            }

        
            if (m_oOverlayManager) {
                m_oOverlayManager.hideAll();
            }


            var oMenu = this._menu,
            	aMenuAlignment = this.get("menualignment"),
            	bFocusMenu = this.get("focusmenu"),
				fnFocusMethod;


			if (this._renderedMenu) {

				oMenu.cfg.setProperty("context", 
								[this.get("element"), aMenuAlignment[0], aMenuAlignment[1]]);
	
				oMenu.cfg.setProperty("preventcontextoverlap", true);
				oMenu.cfg.setProperty("constraintoviewport", true);

			}
			else {

				oMenu.cfg.queueProperty("context", 
								[this.get("element"), aMenuAlignment[0], aMenuAlignment[1]]);
	
				oMenu.cfg.queueProperty("preventcontextoverlap", true);
				oMenu.cfg.queueProperty("constraintoviewport", true);
			
			}


			/*
				 Refocus the Button before showing its Menu in case the call to 
				 YAHOO.widget.MenuManager.hideVisible() resulted in another element in the 
				 DOM being focused after another Menu was hidden.
			*/
			
			this.focus();


            if (Menu && oMenu && (oMenu instanceof Menu)) {

				// Since Menus automatically focus themselves when made visible, temporarily 
				// replace the Menu focus method so that the value of the Button's "focusmenu"
				// attribute determines if the Menu should be focus when made visible.

				fnFocusMethod = oMenu.focus;

				oMenu.focus = function () {};

				if (this._renderedMenu) {

					oMenu.cfg.setProperty("minscrollheight", this.get("menuminscrollheight"));
					oMenu.cfg.setProperty("maxheight", this.get("menumaxheight"));
				
				}
				else {

					oMenu.cfg.queueProperty("minscrollheight", this.get("menuminscrollheight"));
					oMenu.cfg.queueProperty("maxheight", this.get("menumaxheight"));
				
				}


                oMenu.show();

        		oMenu.focus = fnFocusMethod;

				oMenu.align();
        

                /*
                    Stop the propagation of the event so that the MenuManager 
                    doesn't blur the menu after it gets focus.
                */
        
                if (p_oEvent.type == "mousedown") {
                    Event.stopPropagation(p_oEvent);
                }

        
                if (bFocusMenu) { 
                    oMenu.focus();
                }

            }
            else if (Overlay && oMenu && (oMenu instanceof Overlay)) {

				if (!this._renderedMenu) {
		            oMenu.render(this.get("element").parentNode);
				}

                oMenu.show();
				oMenu.align();

            }
        
        },
        
        
        /**
        * @method _hideMenu
        * @description Hides the button's menu.
        * @protected
        */
        _hideMenu: function () {
        
            var oMenu = this._menu;
        
            if (oMenu) {
        
                oMenu.hide();
        
            }
        
        },
        
        
        
        
        // Protected event handlers
        
        
        /**
        * @method _onMouseOver
        * @description "mouseover" event handler for the button.
        * @protected
        * @param {Event} p_oEvent Object representing the DOM event object  
        * passed back by the event utility (YAHOO.util.Event).
        */
        _onMouseOver: function (p_oEvent) {
        
        	var sType = this.get("type"),
        		oElement,
				nOptionRegionX;


			if (sType === "split") {

				oElement = this.get("element");
				nOptionRegionX = 
					(Dom.getX(oElement) + (oElement.offsetWidth - this.OPTION_AREA_WIDTH));
					
				this._nOptionRegionX = nOptionRegionX;
			
			}
        

            if (!this._hasMouseEventHandlers) {
        
				if (sType === "split") {
        
	        		this.on("mousemove", this._onMouseMove);

        		}

                this.on("mouseout", this._onMouseOut);
        
                this._hasMouseEventHandlers = true;
        
            }
        

            this.addStateCSSClasses("hover");


			if (sType === "split" && (Event.getPageX(p_oEvent) > nOptionRegionX)) {
	
				this.addStateCSSClasses("hoveroption");
	
			}

        
            if (this._activationButtonPressed) {
        
                this.addStateCSSClasses("active");
        
            }
        
        
            if (this._bOptionPressed) {
        
                this.addStateCSSClasses("activeoption");
            
            }


            if (this._activationButtonPressed || this._bOptionPressed) {
        
                Event.removeListener(document, "mouseup", this._onDocumentMouseUp);
        
            }

        },


        /**
        * @method _onMouseMove
        * @description "mousemove" event handler for the button.
        * @protected
        * @param {Event} p_oEvent Object representing the DOM event object  
        * passed back by the event utility (YAHOO.util.Event).
        */        
        _onMouseMove: function (p_oEvent) {
        
        	var nOptionRegionX = this._nOptionRegionX;
        
        	if (nOptionRegionX) {

				if (Event.getPageX(p_oEvent) > nOptionRegionX) {
					
					this.addStateCSSClasses("hoveroption");
	
				}
				else {

					this.removeStateCSSClasses("hoveroption");
				
				}
				
        	}
        
        },
        
        /**
        * @method _onMouseOut
        * @description "mouseout" event handler for the button.
        * @protected
        * @param {Event} p_oEvent Object representing the DOM event object  
        * passed back by the event utility (YAHOO.util.Event).
        */
        _onMouseOut: function (p_oEvent) {

			var sType = this.get("type");
        
            this.removeStateCSSClasses("hover");
        

            if (sType != "menu") {
        
                this.removeStateCSSClasses("active");
        
            }
        

            if (this._activationButtonPressed || this._bOptionPressed) {
        
                Event.on(document, "mouseup", this._onDocumentMouseUp, null, this);
        
            }


			if (sType === "split" && (Event.getPageX(p_oEvent) > this._nOptionRegionX)) {
			
				this.removeStateCSSClasses("hoveroption");
	
			}
            
        },
        
        
        /**
        * @method _onDocumentMouseUp
        * @description "mouseup" event handler for the button.
        * @protected
        * @param {Event} p_oEvent Object representing the DOM event object  
        * passed back by the event utility (YAHOO.util.Event).
        */
        _onDocumentMouseUp: function (p_oEvent) {
        
            this._activationButtonPressed = false;
            this._bOptionPressed = false;
        
            var sType = this.get("type"),
                oTarget,
                oMenuElement;
        
            if (sType == "menu" || sType == "split") {

                oTarget = Event.getTarget(p_oEvent);
                oMenuElement = this._menu.element;
        
                if (oTarget != oMenuElement && 
                    !Dom.isAncestor(oMenuElement, oTarget)) {

                    this.removeStateCSSClasses((sType == "menu" ? 
                        "active" : "activeoption"));
            
                    this._hideMenu();

                }
        
            }
        
            Event.removeListener(document, "mouseup", this._onDocumentMouseUp);
        
        },
        
        
        /**
        * @method _onMouseDown
        * @description "mousedown" event handler for the button.
        * @protected
        * @param {Event} p_oEvent Object representing the DOM event object  
        * passed back by the event utility (YAHOO.util.Event).
        */
        _onMouseDown: function (p_oEvent) {

            var sType,
            	bReturnVal = true;
        
        
            function onMouseUp() {
            
                this._hideMenu();
                this.removeListener("mouseup", onMouseUp);
            
            }
        
        
            if ((p_oEvent.which || p_oEvent.button) == 1) {
        
        
                if (!this.hasFocus()) {
                    Lang.later(0, this, this.focus);
                    //this.focus();
                }
        
        
                sType = this.get("type");
        
        
                if (sType == "split") {
                
                    if (Event.getPageX(p_oEvent) > this._nOptionRegionX) {
                        
                        this.fireEvent("option", p_oEvent);
						bReturnVal = false;
        
                    }
                    else {
        
                        this.addStateCSSClasses("active");
        
                        this._activationButtonPressed = true;
        
                    }
        
                }
                else if (sType == "menu") {
        
                    if (this.isActive()) {
        
                        this._hideMenu();
        
                        this._activationButtonPressed = false;
        
                    }
                    else {
        
                        this._showMenu(p_oEvent);
        
                        this._activationButtonPressed = true;
                    
                    }
        
                }
                else {
        
                    this.addStateCSSClasses("active");
        
                    this._activationButtonPressed = true;
                
                }
        
        
        
                if (sType == "split" || sType == "menu") {

                    this._hideMenuTimer = Lang.later(250, this, this.on, ["mouseup", onMouseUp]);
        
                }
        
            }
            
            return bReturnVal;
            
        },
        
        
        /**
        * @method _onMouseUp
        * @description "mouseup" event handler for the button.
        * @protected
        * @param {Event} p_oEvent Object representing the DOM event object  
        * passed back by the event utility (YAHOO.util.Event).
        */
        _onMouseUp: function (p_oEvent) {
            this.inMouseDown = false;
        
            var sType = this.get("type"),
            	oHideMenuTimer = this._hideMenuTimer,
            	bReturnVal = true;
        
        
            if (oHideMenuTimer) {
  
  				oHideMenuTimer.cancel();
        
            }
        
        
            if (sType == "checkbox" || sType == "radio") {
                if ((p_oEvent.which || p_oEvent.button) != 1) {
                    return;
                }

                this.set("checked", !(this.get("checked")));
            
            }
        
        
            this._activationButtonPressed = false;
            
        
            if (sType != "menu") {
        
                this.removeStateCSSClasses("active");
            
            }

                
			if (sType == "split" && Event.getPageX(p_oEvent) > this._nOptionRegionX) {
				
				bReturnVal = false;

			}

			return bReturnVal;
            
        },
        
        
        /**
        * @method _onFocus
        * @description "focus" event handler for the button.
        * @protected
        * @param {Event} p_oEvent Object representing the DOM event object  
        * passed back by the event utility (YAHOO.util.Event).
        */
        _onFocus: function (p_oEvent) {
        
            var oElement;
        
            this.addStateCSSClasses("focus");
        
            if (this._activationKeyPressed) {
        
                this.addStateCSSClasses("active");
           
            }
        
            m_oFocusedButton = this;
        
        
            if (!this._hasKeyEventHandlers) {
        
                oElement = this._button;
        
                Event.on(oElement, "blur", this._onBlur, null, this);
                Event.on(oElement, "keydown", this._onKeyDown, null, this);
                Event.on(oElement, "keyup", this._onKeyUp, null, this);
        
                this._hasKeyEventHandlers = true;
        
            }
        
        
            this.fireEvent("focus", p_oEvent);
        
        },
        
        
        /**
        * @method _onBlur
        * @description "blur" event handler for the button.
        * @protected
        * @param {Event} p_oEvent Object representing the DOM event object  
        * passed back by the event utility (YAHOO.util.Event).
        */
        _onBlur: function (p_oEvent) {
        
            this.removeStateCSSClasses("focus");
        
            if (this.get("type") != "menu") {
        
                this.removeStateCSSClasses("active");

            }    
        
            if (this._activationKeyPressed) {
        
                Event.on(document, "keyup", this._onDocumentKeyUp, null, this);
        
            }
        
        
            m_oFocusedButton = null;
        
            this.fireEvent("blur", p_oEvent);
           
        },
        
        
        /**
        * @method _onDocumentKeyUp
        * @description "keyup" event handler for the document.
        * @protected
        * @param {Event} p_oEvent Object representing the DOM event object  
        * passed back by the event utility (YAHOO.util.Event).
        */
        _onDocumentKeyUp: function (p_oEvent) {
        
            if (this._isActivationKey(Event.getCharCode(p_oEvent))) {
        
                this._activationKeyPressed = false;
                
                Event.removeListener(document, "keyup", this._onDocumentKeyUp);
            
            }
        
        },
        
        
        /**
        * @method _onKeyDown
        * @description "keydown" event handler for the button.
        * @protected
        * @param {Event} p_oEvent Object representing the DOM event object  
        * passed back by the event utility (YAHOO.util.Event).
        */
        _onKeyDown: function (p_oEvent) {
        
            var oMenu = this._menu;
        
        
            if (this.get("type") == "split" && 
                this._isSplitButtonOptionKey(p_oEvent)) {
        
                this.fireEvent("option", p_oEvent);
        
            }
            else if (this._isActivationKey(Event.getCharCode(p_oEvent))) {
        
                if (this.get("type") == "menu") {
        
                    this._showMenu(p_oEvent);
        
                }
                else {
        
                    this._activationKeyPressed = true;
                    
                    this.addStateCSSClasses("active");
                
                }
            
            }
        
        
            if (oMenu && oMenu.cfg.getProperty("visible") && 
                Event.getCharCode(p_oEvent) == 27) {
            
                oMenu.hide();
                this.focus();
            
            }
        
        },
        
        
        /**
        * @method _onKeyUp
        * @description "keyup" event handler for the button.
        * @protected
        * @param {Event} p_oEvent Object representing the DOM event object  
        * passed back by the event utility (YAHOO.util.Event).
        */
        _onKeyUp: function (p_oEvent) {
        
            var sType;
        
            if (this._isActivationKey(Event.getCharCode(p_oEvent))) {
        
                sType = this.get("type");
        
                if (sType == "checkbox" || sType == "radio") {
        
                    this.set("checked", !(this.get("checked")));
                
                }
        
                this._activationKeyPressed = false;
        
                if (this.get("type") != "menu") {
        
                    this.removeStateCSSClasses("active");
        
                }
        
            }
        
        },
        
        
        /**
        * @method _onClick
        * @description "click" event handler for the button.
        * @protected
        * @param {Event} p_oEvent Object representing the DOM event object  
        * passed back by the event utility (YAHOO.util.Event).
        */
        _onClick: function (p_oEvent) {
        
            var sType = this.get("type"),
                oForm,
                oSrcElement,
                bReturnVal;
        

			switch (sType) {

			case "submit":

				if (p_oEvent.returnValue !== false) {

					this.submitForm();

				}

				break;

			case "reset":

				oForm = this.getForm();

				if (oForm) {

					oForm.reset();

				}

				break;


			case "split":

				if (this._nOptionRegionX > 0 && 
						(Event.getPageX(p_oEvent) > this._nOptionRegionX)) {

					bReturnVal = false;

				}
				else {

					this._hideMenu();

					oSrcElement = this.get("srcelement");

					if (oSrcElement && oSrcElement.type == "submit" && 
							p_oEvent.returnValue !== false) {

						this.submitForm();

					}

				}

				break;

			}

			return bReturnVal;
        
        },
        
        
        /**
        * @method _onDblClick
        * @description "dblclick" event handler for the button.
        * @protected
        * @param {Event} p_oEvent Object representing the DOM event object  
        * passed back by the event utility (YAHOO.util.Event).
        */
        _onDblClick: function (p_oEvent) {
        
            var bReturnVal = true;
    
			if (this.get("type") == "split" && Event.getPageX(p_oEvent) > this._nOptionRegionX) {

				bReturnVal = false;
			
			}
        
        	return bReturnVal;
        
        },        
        
        
        /**
        * @method _onAppendTo
        * @description "appendTo" event handler for the button.
        * @protected
        * @param {Event} p_oEvent Object representing the DOM event object  
        * passed back by the event utility (YAHOO.util.Event).
        */
        _onAppendTo: function (p_oEvent) {
        
            /*
                It is necessary to call "_addListenersToForm" using 
                "setTimeout" to make sure that the button's "form" property 
                returns a node reference.  Sometimes, if you try to get the 
                reference immediately after appending the field, it is null.
            */
        
            Lang.later(0, this, this._addListenersToForm);
        
        },
        
        
        /**
        * @method _onFormReset
        * @description "reset" event handler for the button's form.
        * @protected
        * @param {Event} p_oEvent Object representing the DOM event 
        * object passed back by the event utility (YAHOO.util.Event).
        */
        _onFormReset: function (p_oEvent) {
        
            var sType = this.get("type"),
                oMenu = this._menu;
        
            if (sType == "checkbox" || sType == "radio") {
        
                this.resetValue("checked");
        
            }
        
        
            if (Menu && oMenu && (oMenu instanceof Menu)) {
        
                this.resetValue("selectedMenuItem");
        
            }
        
        },


        /**
        * @method _onFormSubmit
        * @description "submit" event handler for the button's form.
        * @protected
        * @param {Event} p_oEvent Object representing the DOM event 
        * object passed back by the event utility (YAHOO.util.Event).
        */        
        _onFormSubmit: function (p_oEvent) {
        
        	this.createHiddenFields();
        
        },
        
        
        /**
        * @method _onDocumentMouseDown
        * @description "mousedown" event handler for the document.
        * @protected
        * @param {Event} p_oEvent Object representing the DOM event object  
        * passed back by the event utility (YAHOO.util.Event).
        */
        _onDocumentMouseDown: function (p_oEvent) {

            var oTarget = Event.getTarget(p_oEvent),
                oButtonElement = this.get("element"),
                oMenuElement = this._menu.element;
           
            function findTargetInSubmenus(aSubmenus) {
                var i, iMax, oSubmenuElement;
                if (!aSubmenus) {
                    return true;
                }
                for (i = 0, iMax = aSubmenus.length; i < iMax; i++) {
                    oSubmenuElement = aSubmenus[i].element;
                    if (oTarget == oSubmenuElement || Dom.isAncestor(oSubmenuElement, oTarget)) {
                        return true;
                    }
                    if (aSubmenus[i] && aSubmenus[i].getSubmenus) {
                        if (findTargetInSubmenus(aSubmenus[i].getSubmenus())) {
                            return true;
                        }
                    }
                }
        
                return false;
            }

            if (oTarget != oButtonElement && 
                !Dom.isAncestor(oButtonElement, oTarget) && 
                oTarget != oMenuElement && 
                !Dom.isAncestor(oMenuElement, oTarget)) {
                
                
                if (this._menu  && this._menu.getSubmenus) {
                    if (!findTargetInSubmenus(this._menu.getSubmenus())) {
                        return;
                    }
                }
                

                this._hideMenu();

				//	In IE when the user mouses down on a focusable element
				//	that element will be focused and become the "activeElement".
				//	(http://msdn.microsoft.com/en-us/library/ms533065(VS.85).aspx)
				//	However, there is a bug in IE where if there is a  
				//	positioned element with a focused descendant that is 
				//	hidden in response to the mousedown event, the target of 
				//	the mousedown event will appear to have focus, but will 
				//	not be set as the activeElement.  This will result 
				//	in the element not firing key events, even though it
				//	appears to have focus.	The following call to "setActive"
				//	fixes this bug.

                if (UA.ie && (UA.ie < 9) && oTarget.focus) {
					oTarget.setActive();
				}
        
                Event.removeListener(document, "mousedown", 
                    this._onDocumentMouseDown);    
            
            }
        
        },
        
        
        /**
        * @method _onOption
        * @description "option" event handler for the button.
        * @protected
        * @param {Event} p_oEvent Object representing the DOM event object  
        * passed back by the event utility (YAHOO.util.Event).
        */
        _onOption: function (p_oEvent) {
        
            if (this.hasClass(this.CLASS_NAME_PREFIX + "split-button-activeoption")) {
        
                this._hideMenu();
        
                this._bOptionPressed = false;
        
            }
            else {
        
                this._showMenu(p_oEvent);    
        
                this._bOptionPressed = true;
        
            }
        
        },
        
        
        /**
        * @method _onMenuShow
        * @description "show" event handler for the button's menu.
        * @private
        * @param {String} p_sType String representing the name of the event  
        * that was fired.
        */
        _onMenuShow: function (p_sType) {
        
            Event.on(document, "mousedown", this._onDocumentMouseDown, 
                null, this);
        
            var sState = (this.get("type") == "split") ? "activeoption" : "active";
        
            this.addStateCSSClasses(sState);
        
        },
        
        
        /**
        * @method _onMenuHide
        * @description "hide" event handler for the button's menu.
        * @private
        * @param {String} p_sType String representing the name of the event  
        * that was fired.
        */
        _onMenuHide: function (p_sType) {
            
            var sState = (this.get("type") == "split") ? "activeoption" : "active";
        
            this.removeStateCSSClasses(sState);
        
        
            if (this.get("type") == "split") {
        
                this._bOptionPressed = false;
            
            }
        
        },
        
        
        /**
        * @method _onMenuKeyDown
        * @description "keydown" event handler for the button's menu.
        * @private
        * @param {String} p_sType String representing the name of the event  
        * that was fired.
        * @param {Array} p_aArgs Array of arguments sent when the event 
        * was fired.
        */
        _onMenuKeyDown: function (p_sType, p_aArgs) {
        
            var oEvent = p_aArgs[0];
        
            if (Event.getCharCode(oEvent) == 27) {
        
                this.focus();
        
                if (this.get("type") == "split") {
                
                    this._bOptionPressed = false;
                
                }
        
            }
        
        },
        
        
        /**
        * @method _onMenuRender
        * @description "render" event handler for the button's menu.
        * @private
        * @param {String} p_sType String representing the name of the  
        * event thatwas fired.
        */
        _onMenuRender: function (p_sType) {
        
            var oButtonElement = this.get("element"),
                oButtonParent = oButtonElement.parentNode,
				oMenu = this._menu,
                oMenuElement = oMenu.element,
				oSrcElement = oMenu.srcElement,
				oItem;
        
        
            if (oButtonParent != oMenuElement.parentNode) {
        
                oButtonParent.appendChild(oMenuElement);
            
            }

			this._renderedMenu = true;

			//	If the user has designated an <option> of the Menu's source 
			//	<select> element to be selected, sync the selectedIndex with 
			//	the "selectedMenuItem" Attribute.

			if (oSrcElement && 
					oSrcElement.nodeName.toLowerCase() === "select" && 
					oSrcElement.value) {
				
				
				oItem = oMenu.getItem(oSrcElement.selectedIndex);
				
				//	Set the value of the "selectedMenuItem" attribute
				//	silently since this is the initial set--synchronizing 
				//	the value of the source <SELECT> element in the DOM with 
				//	its corresponding Menu instance.

				this.set("selectedMenuItem", oItem, true);
				
				//	Call the "_onSelectedMenuItemChange" method since the 
				//	attribute was set silently.

				this._onSelectedMenuItemChange({ newValue: oItem });
				
			}

        },

        
        
        /**
        * @method _onMenuClick
        * @description "click" event handler for the button's menu.
        * @private
        * @param {String} p_sType String representing the name of the event  
        * that was fired.
        * @param {Array} p_aArgs Array of arguments sent when the event 
        * was fired.
        */
        _onMenuClick: function (p_sType, p_aArgs) {

            var oItem = p_aArgs[1],
                oSrcElement;
        
            if (oItem) {
        
				this.set("selectedMenuItem", oItem);

                oSrcElement = this.get("srcelement");
            
                if (oSrcElement && oSrcElement.type == "submit") {
        
                    this.submitForm();
            
                }
            
                this._hideMenu();
            
            }
        
        },


        /**
        * @method _onSelectedMenuItemChange
        * @description "selectedMenuItemChange" event handler for the Button's
		* "selectedMenuItem" attribute.
        * @param {Event} event Object representing the DOM event object  
        * passed back by the event utility (YAHOO.util.Event).
        */
		_onSelectedMenuItemChange: function (event) {
		
			var oSelected = event.prevValue,
				oItem = event.newValue,
				sPrefix = this.CLASS_NAME_PREFIX;

			if (oSelected) {
				Dom.removeClass(oSelected.element, (sPrefix + "button-selectedmenuitem"));
			}
			
			if (oItem) {
				Dom.addClass(oItem.element, (sPrefix + "button-selectedmenuitem"));
			}
			
		},        
        

        /**
        * @method _onLabelClick
        * @description "click" event handler for the Button's
		* <code>&#60;label&#62;</code> element.
        * @param {Event} event Object representing the DOM event object  
        * passed back by the event utility (YAHOO.util.Event).
        */
		_onLabelClick: function (event) {

			this.focus();

			var sType = this.get("type");

			if (sType == "radio" || sType == "checkbox") {
				this.set("checked", (!this.get("checked")));						
			}
			
		},

        
        // Public methods
        
        
        /**
        * @method createButtonElement
        * @description Creates the button's HTML elements.
        * @param {String} p_sType String indicating the type of element 
        * to create.
        * @return {<a href="http://www.w3.org/TR/2000/WD-DOM-Level-1-20000929/
        * level-one-html.html#ID-58190037">HTMLElement</a>}
        */
        createButtonElement: function (p_sType) {
        
            var sNodeName = this.NODE_NAME,
                oElement = document.createElement(sNodeName);
        
            oElement.innerHTML =  "<" + sNodeName + " class=\"first-child\">" + 
                (p_sType == "link" ? "<a></a>" : 
                "<button type=\"button\"></button>") + "</" + sNodeName + ">";
        
            return oElement;
        
        },

        
        /**
        * @method addStateCSSClasses
        * @description Appends state-specific CSS classes to the button's root 
        * DOM element.
        */
        addStateCSSClasses: function (p_sState) {
        
            var sType = this.get("type"),
				sPrefix = this.CLASS_NAME_PREFIX;
        
            if (Lang.isString(p_sState)) {
        
                if (p_sState != "activeoption" && p_sState != "hoveroption") {
        
                    this.addClass(sPrefix + this.CSS_CLASS_NAME + ("-" + p_sState));
        
                }
        
                this.addClass(sPrefix + sType + ("-button-" + p_sState));
            
            }
        
        },
        
        
        /**
        * @method removeStateCSSClasses
        * @description Removes state-specific CSS classes to the button's root 
        * DOM element.
        */
        removeStateCSSClasses: function (p_sState) {
        
            var sType = this.get("type"),
				sPrefix = this.CLASS_NAME_PREFIX;
        
            if (Lang.isString(p_sState)) {
        
                this.removeClass(sPrefix + this.CSS_CLASS_NAME + ("-" + p_sState));
                this.removeClass(sPrefix + sType + ("-button-" + p_sState));
            
            }
        
        },
        
        
        /**
        * @method createHiddenFields
        * @description Creates the button's hidden form field and appends it 
        * to its parent form.
        * @return {<a href="http://www.w3.org/TR/2000/WD-DOM-Level-1-20000929/
        * level-one-html.html#ID-6043025">HTMLInputElement</a>|Array}
        */
        createHiddenFields: function () {
        
            this.removeHiddenFields();
        
            var oForm = this.getForm(),
                oButtonField,
                sType,
                bCheckable,
                oMenu,
                oMenuItem,
                sButtonName,
                oValue,
                oMenuField,
                oReturnVal,
				sMenuFieldName,
				oMenuSrcElement,
				bMenuSrcElementIsSelect = false;
        
        
            if (oForm && !this.get("disabled")) {
        
                sType = this.get("type");
                bCheckable = (sType == "checkbox" || sType == "radio");
        
        
                if ((bCheckable && this.get("checked")) || (m_oSubmitTrigger == this)) {
                
        
                    oButtonField = createInputElement((bCheckable ? sType : "hidden"),
                                    this.get("name"), this.get("value"), this.get("checked"));
            
            
                    if (oButtonField) {
            
                        if (bCheckable) {
            
                            oButtonField.style.display = "none";
            
                        }
            
                        oForm.appendChild(oButtonField);
            
                    }
        
                }
                    
        
                oMenu = this._menu;
            
            
                if (Menu && oMenu && (oMenu instanceof Menu)) {
        
        
                    oMenuItem = this.get("selectedMenuItem");
					oMenuSrcElement = oMenu.srcElement;
					bMenuSrcElementIsSelect = (oMenuSrcElement && 
												oMenuSrcElement.nodeName.toUpperCase() == "SELECT");

                    if (oMenuItem) {

						oValue = (oMenuItem.value === null || oMenuItem.value === "") ? 
									oMenuItem.cfg.getProperty("text") : oMenuItem.value;

						sButtonName = this.get("name");


						if (bMenuSrcElementIsSelect) {
						
							sMenuFieldName = oMenuSrcElement.name;
						
						}
						else if (sButtonName) {

							sMenuFieldName = (sButtonName + "_options");
						
						}
						

						if (oValue && sMenuFieldName) {
		
							oMenuField = createInputElement("hidden", sMenuFieldName, oValue);
							oForm.appendChild(oMenuField);
		
						}
                    
                    }
                    else if (bMenuSrcElementIsSelect) {
					
						oMenuField = oForm.appendChild(oMenuSrcElement);
                    
                    }
        
                }
            
            
                if (oButtonField && oMenuField) {
        
                    this._hiddenFields = [oButtonField, oMenuField];
        
                }
                else if (!oButtonField && oMenuField) {
        
                    this._hiddenFields = oMenuField;
                
                }
                else if (oButtonField && !oMenuField) {
        
                    this._hiddenFields = oButtonField;
                
                }
        
        		oReturnVal = this._hiddenFields;
        
            }

			return oReturnVal;
        
        },
        
        
        /**
        * @method removeHiddenFields
        * @description Removes the button's hidden form field(s) from its 
        * parent form.
        */
        removeHiddenFields: function () {
        
            var oField = this._hiddenFields,
                nFields,
                i;
        
            function removeChild(p_oElement) {
        
                if (Dom.inDocument(p_oElement)) {
        
                    p_oElement.parentNode.removeChild(p_oElement);

                }
                
            }
            
        
            if (oField) {
        
                if (Lang.isArray(oField)) {
        
                    nFields = oField.length;
                    
                    if (nFields > 0) {
                    
                        i = nFields - 1;
                        
                        do {
        
                            removeChild(oField[i]);
        
                        }
                        while (i--);
                    
                    }
                
                }
                else {
        
                    removeChild(oField);
        
                }
        
                this._hiddenFields = null;
            
            }
        
        },
        
        
        /**
        * @method submitForm
        * @description Submits the form to which the button belongs.  Returns  
        * true if the form was submitted successfully, false if the submission 
        * was cancelled.
        * @protected
        * @return {Boolean}
        */
        submitForm: function () {
        
            var oForm = this.getForm(),
        
                oSrcElement = this.get("srcelement"),
        
                /*
                    Boolean indicating if the event fired successfully 
                    (was not cancelled by any handlers)
                */
        
                bSubmitForm = false,
                
                oEvent;
        
        
            if (oForm) {
        
                if (this.get("type") == "submit" || (oSrcElement && oSrcElement.type == "submit")) {
        
                    m_oSubmitTrigger = this;
                    
                }
        
        
                if (UA.ie && (UA.ie < 9)) {
        
                    bSubmitForm = oForm.fireEvent("onsubmit");
        
                }
                else {  // Gecko, Opera, and Safari
        
                    oEvent = document.createEvent("HTMLEvents");
                    oEvent.initEvent("submit", true, true);
        
                    bSubmitForm = oForm.dispatchEvent(oEvent);
        
                }
        
        
                /*
                    In IE and Safari, dispatching a "submit" event to a form 
                    WILL cause the form's "submit" event to fire, but WILL NOT 
                    submit the form.  Therefore, we need to call the "submit" 
                    method as well.
                */
              
                if ((UA.ie || UA.webkit) && bSubmitForm) {
        
                    oForm.submit();
                
                }
            
            }
        
            return bSubmitForm;
            
        },
        
        
        /**
        * @method init
        * @description The Button class's initialization method.
        * @param {String} p_oElement String specifying the id attribute of the 
        * <code>&#60;input&#62;</code>, <code>&#60;button&#62;</code>,
        * <code>&#60;a&#62;</code>, or <code>&#60;span&#62;</code> element to 
        * be used to create the button.
        * @param {<a href="http://www.w3.org/TR/2000/WD-DOM-Level-1-20000929/
        * level-one-html.html#ID-6043025">HTMLInputElement</a>|<a href="http://
        * www.w3.org/TR/2000/WD-DOM-Level-1-20000929/level-one-html.html
        * #ID-34812697">HTMLButtonElement</a>|<a href="http://www.w3.org/TR
        * /2000/WD-DOM-Level-1-20000929/level-one-html.html#ID-33759296">
        * HTMLElement</a>} p_oElement Object reference for the 
        * <code>&#60;input&#62;</code>, <code>&#60;button&#62;</code>, 
        * <code>&#60;a&#62;</code>, or <code>&#60;span&#62;</code> element to be 
        * used to create the button.
        * @param {Object} p_oElement Object literal specifying a set of 
        * configuration attributes used to create the button.
        * @param {Object} p_oAttributes Optional. Object literal specifying a 
        * set of configuration attributes used to create the button.
        */
        init: function (p_oElement, p_oAttributes) {
        
            var sNodeName = p_oAttributes.type == "link" ? "a" : "button",
                oSrcElement = p_oAttributes.srcelement,
                oButton = p_oElement.getElementsByTagName(sNodeName)[0],
                oInput;


            if (!oButton) {

                oInput = p_oElement.getElementsByTagName("input")[0];


                if (oInput) {

                    oButton = document.createElement("button");
                    oButton.setAttribute("type", "button");

                    oInput.parentNode.replaceChild(oButton, oInput);
                
                }

            }

            this._button = oButton;


            YAHOO.widget.Button.superclass.init.call(this, p_oElement, p_oAttributes);


			var sId = this.get("id"),
				sButtonId = sId + "-button";


        	oButton.id = sButtonId;


			var aLabels,
				oLabel;


        	var hasLabel = function (element) {
        	
				return (element.htmlFor === sId);

        	};


			var setLabel = function () {

				oLabel.setAttribute((UA.ie ? "htmlFor" : "for"), sButtonId);
			
			};


			if (oSrcElement && this.get("type") != "link") {

				aLabels = Dom.getElementsBy(hasLabel, "label");

				if (Lang.isArray(aLabels) && aLabels.length > 0) {
				
					oLabel = aLabels[0];
				
				}

			}
        

            m_oButtons[sId] = this;

        	var sPrefix = this.CLASS_NAME_PREFIX;

            this.addClass(sPrefix + this.CSS_CLASS_NAME);
            this.addClass(sPrefix + this.get("type") + "-button");
        
            Event.on(this._button, "focus", this._onFocus, null, this);
            this.on("mouseover", this._onMouseOver);
			this.on("mousedown", this._onMouseDown);
			this.on("mouseup", this._onMouseUp);
            this.on("click", this._onClick);

			//	Need to reset the value of the "onclick" Attribute so that any
			//	handlers registered via the "onclick" Attribute are fired after 
			//	Button's default "_onClick" listener.

			var fnOnClick = this.get("onclick");

			this.set("onclick", null);
			this.set("onclick", fnOnClick);

            this.on("dblclick", this._onDblClick);


			var oParentNode;

            if (oLabel) {
            
				if (this.get("replaceLabel")) {

					this.set("label", oLabel.innerHTML);
					
					oParentNode = oLabel.parentNode;
					
					oParentNode.removeChild(oLabel);
					
				}
				else {

					this.on("appendTo", setLabel); 

					Event.on(oLabel, "click", this._onLabelClick, null, this);

					this._label = oLabel;
					
				}
            
            }
            
            this.on("appendTo", this._onAppendTo);
       
        

            var oContainer = this.get("container"),
                oElement = this.get("element"),
                bElInDoc = Dom.inDocument(oElement);


            if (oContainer) {
        
                if (oSrcElement && oSrcElement != oElement) {
                
                    oParentNode = oSrcElement.parentNode;

                    if (oParentNode) {
                    
                        oParentNode.removeChild(oSrcElement);
                    
                    }

                }
        
                if (Lang.isString(oContainer)) {
        
                    Event.onContentReady(oContainer, this.appendTo, oContainer, this);
        
                }
                else {
        
        			this.on("init", function () {
        			
        				Lang.later(0, this, this.appendTo, oContainer);
        			
        			});
        
                }
        
            }
            else if (!bElInDoc && oSrcElement && oSrcElement != oElement) {

                oParentNode = oSrcElement.parentNode;
        
                if (oParentNode) {
        
                    this.fireEvent("beforeAppendTo", {
                        type: "beforeAppendTo",
                        target: oParentNode
                    });
            
                    oParentNode.replaceChild(oElement, oSrcElement);
            
                    this.fireEvent("appendTo", {
                        type: "appendTo",
                        target: oParentNode
                    });
                
                }
        
            }
            else if (this.get("type") != "link" && bElInDoc && oSrcElement && 
                oSrcElement == oElement) {
        
                this._addListenersToForm();
        
            }
        
        

			this.fireEvent("init", {
				type: "init",
				target: this
			});        
        
        },
        
        
        /**
        * @method initAttributes
        * @description Initializes all of the configuration attributes used to  
        * create the button.
        * @param {Object} p_oAttributes Object literal specifying a set of 
        * configuration attributes used to create the button.
        */
        initAttributes: function (p_oAttributes) {
        
            var oAttributes = p_oAttributes || {};
        
            YAHOO.widget.Button.superclass.initAttributes.call(this, 
                oAttributes);
        
        
            /**
            * @attribute type
            * @description String specifying the button's type.  Possible 
            * values are: "push," "link," "submit," "reset," "checkbox," 
            * "radio," "menu," and "split."
            * @default "push"
            * @type String
			* @writeonce
            */
            this.setAttributeConfig("type", {
        
                value: (oAttributes.type || "push"),
                validator: Lang.isString,
                writeOnce: true,
                method: this._setType

            });
        
        
            /**
            * @attribute label
            * @description {HTML} specifying the button's text label 
            * or innerHTML.
            * @default null
            * @type String
            */
            this.setAttributeConfig("label", {
        
                value: oAttributes.label,
                validator: Lang.isString,
                method: this._setLabel
        
            });
        
        
            /**
            * @attribute value
            * @description Object specifying the value for the button.
            * @default null
            * @type Object
            */
            this.setAttributeConfig("value", {
        
                value: oAttributes.value
        
            });
        
        
            /**
            * @attribute name
            * @description String specifying the name for the button.
            * @default null
            * @type String
            */
            this.setAttributeConfig("name", {
        
                value: oAttributes.name,
                validator: Lang.isString
        
            });
        
        
            /**
            * @attribute tabindex
            * @description Number specifying the tabindex for the button.
            * @default null
            * @type Number
            */
            this.setAttributeConfig("tabindex", {
        
                value: oAttributes.tabindex,
                validator: Lang.isNumber,
                method: this._setTabIndex
        
            });
        
        
            /**
            * @attribute title
            * @description String specifying the title for the button.
            * @default null
            * @type String
            */
            this.configureAttribute("title", {
        
                value: oAttributes.title,
                validator: Lang.isString,
                method: this._setTitle
        
            });
        
        
            /**
            * @attribute disabled
            * @description Boolean indicating if the button should be disabled.  
            * (Disabled buttons are dimmed and will not respond to user input 
            * or fire events.  Does not apply to button's of type "link.")
            * @default false
            * @type Boolean
            */
            this.setAttributeConfig("disabled", {
        
                value: (oAttributes.disabled || false),
                validator: Lang.isBoolean,
                method: this._setDisabled
        
            });
        
        
            /**
            * @attribute href
            * @description String specifying the href for the button.  Applies
            * only to buttons of type "link."
            * @type String
            */
            this.setAttributeConfig("href", {
        
                value: oAttributes.href,
                validator: Lang.isString,
                method: this._setHref
        
            });
        
        
            /**
            * @attribute target
            * @description String specifying the target for the button.  
            * Applies only to buttons of type "link."
            * @type String
            */
            this.setAttributeConfig("target", {
        
                value: oAttributes.target,
                validator: Lang.isString,
                method: this._setTarget
        
            });
        
        
            /**
            * @attribute checked
            * @description Boolean indicating if the button is checked. 
            * Applies only to buttons of type "radio" and "checkbox."
            * @default false
            * @type Boolean
            */
            this.setAttributeConfig("checked", {
        
                value: (oAttributes.checked || false),
                validator: Lang.isBoolean,
                method: this._setChecked
        
            });
        
        
            /**
            * @attribute container
            * @description HTML element reference or string specifying the id 
            * attribute of the HTML element that the button's markup should be 
            * rendered into.
            * @type <a href="http://www.w3.org/TR/2000/WD-DOM-Level-1-20000929/
            * level-one-html.html#ID-58190037">HTMLElement</a>|String
            * @default null
			* @writeonce
            */
            this.setAttributeConfig("container", {
        
                value: oAttributes.container,
                writeOnce: true
        
            });
        
        
            /**
            * @attribute srcelement
            * @description Object reference to the HTML element (either 
            * <code>&#60;input&#62;</code> or <code>&#60;span&#62;</code>) 
            * used to create the button.
            * @type <a href="http://www.w3.org/TR/2000/WD-DOM-Level-1-20000929/
            * level-one-html.html#ID-58190037">HTMLElement</a>|String
            * @default null
			* @writeonce
            */
            this.setAttributeConfig("srcelement", {
        
                value: oAttributes.srcelement,
                writeOnce: true
        
            });
        
        
            /**
            * @attribute menu
            * @description Object specifying the menu for the button.  
            * The value can be one of the following:
            * <ul>
            * <li>Object specifying a rendered <a href="YAHOO.widget.Menu.html">
            * YAHOO.widget.Menu</a> instance.</li>
            * <li>Object specifying a rendered <a href="YAHOO.widget.Overlay.html">
            * YAHOO.widget.Overlay</a> instance.</li>
            * <li>String specifying the id attribute of the <code>&#60;div&#62;
            * </code> element used to create the menu.  By default the menu 
            * will be created as an instance of 
            * <a href="YAHOO.widget.Overlay.html">YAHOO.widget.Overlay</a>.  
            * If the <a href="YAHOO.widget.Menu.html#CSS_CLASS_NAME">
            * default CSS class name for YAHOO.widget.Menu</a> is applied to 
            * the <code>&#60;div&#62;</code> element, it will be created as an
            * instance of <a href="YAHOO.widget.Menu.html">YAHOO.widget.Menu
            * </a>.</li><li>String specifying the id attribute of the 
            * <code>&#60;select&#62;</code> element used to create the menu.
            * </li><li>Object specifying the <code>&#60;div&#62;</code> element
            * used to create the menu.</li>
            * <li>Object specifying the <code>&#60;select&#62;</code> element
            * used to create the menu.</li>
            * <li>Array of object literals, each representing a set of 
            * <a href="YAHOO.widget.MenuItem.html">YAHOO.widget.MenuItem</a> 
            * configuration attributes.</li>
            * <li>Array of strings representing the text labels for each menu 
            * item in the menu.</li>
            * </ul>
            * @type <a href="YAHOO.widget.Menu.html">YAHOO.widget.Menu</a>|<a 
            * href="YAHOO.widget.Overlay.html">YAHOO.widget.Overlay</a>|<a 
            * href="http://www.w3.org/TR/2000/WD-DOM-Level-1-20000929/level-
            * one-html.html#ID-58190037">HTMLElement</a>|String|Array
            * @default null
			* @writeonce
            */
            this.setAttributeConfig("menu", {
        
                value: null,
                method: this._setMenu,
                writeOnce: true
            
            });
        
        
            /**
            * @attribute lazyloadmenu
            * @description Boolean indicating the value to set for the 
            * <a href="YAHOO.widget.Menu.html#lazyLoad">"lazyload"</a>
            * configuration property of the button's menu.  Setting 
            * "lazyloadmenu" to <code>true </code> will defer rendering of 
            * the button's menu until the first time it is made visible.  
            * If "lazyloadmenu" is set to <code>false</code>, the button's 
            * menu will be rendered immediately if the button is in the 
            * document, or in response to the button's "appendTo" event if 
            * the button is not yet in the document.  In either case, the 
            * menu is rendered into the button's parent HTML element.  
            * <em>This attribute does not apply if a 
            * <a href="YAHOO.widget.Menu.html">YAHOO.widget.Menu</a> or 
            * <a href="YAHOO.widget.Overlay.html">YAHOO.widget.Overlay</a> 
            * instance is passed as the value of the button's "menu" 
            * configuration attribute. <a href="YAHOO.widget.Menu.html">
            * YAHOO.widget.Menu</a> or <a href="YAHOO.widget.Overlay.html">
            * YAHOO.widget.Overlay</a> instances should be rendered before 
            * being set as the value for the "menu" configuration 
            * attribute.</em>
            * @default true
            * @type Boolean
			* @writeonce
            */
            this.setAttributeConfig("lazyloadmenu", {
        
                value: (oAttributes.lazyloadmenu === false ? false : true),
                validator: Lang.isBoolean,
                writeOnce: true
        
            });


            /**
            * @attribute menuclassname
            * @description String representing the CSS class name to be 
            * applied to the root element of the button's menu.
            * @type String
            * @default "yui-button-menu"
			* @writeonce
            */
            this.setAttributeConfig("menuclassname", {
        
                value: (oAttributes.menuclassname || (this.CLASS_NAME_PREFIX + "button-menu")),
                validator: Lang.isString,
                method: this._setMenuClassName,
                writeOnce: true
        
            });        


			/**
			* @attribute menuminscrollheight
			* @description Number defining the minimum threshold for the "menumaxheight" 
			* configuration attribute.  When set this attribute is automatically applied 
			* to all submenus.
			* @default 90
			* @type Number
			*/
            this.setAttributeConfig("menuminscrollheight", {
        
                value: (oAttributes.menuminscrollheight || 90),
                validator: Lang.isNumber
        
            });


            /**
            * @attribute menumaxheight
			* @description Number defining the maximum height (in pixels) for a menu's 
			* body element (<code>&#60;div class="bd"&#60;</code>).  Once a menu's body 
			* exceeds this height, the contents of the body are scrolled to maintain 
			* this value.  This value cannot be set lower than the value of the 
			* "minscrollheight" configuration property.
            * @type Number
            * @default 0
            */
            this.setAttributeConfig("menumaxheight", {
        
                value: (oAttributes.menumaxheight || 0),
                validator: Lang.isNumber
        
            });


            /**
            * @attribute menualignment
			* @description Array defining how the Button's Menu is aligned to the Button.  
            * The default value of ["tl", "bl"] aligns the Menu's top left corner to the Button's 
            * bottom left corner.
            * @type Array
            * @default ["tl", "bl"]
            */
            this.setAttributeConfig("menualignment", {
        
                value: (oAttributes.menualignment || ["tl", "bl"]),
                validator: Lang.isArray
        
            });
            

            /**
            * @attribute selectedMenuItem
            * @description Object representing the item in the button's menu 
            * that is currently selected.
            * @type YAHOO.widget.MenuItem
            * @default null
            */
            this.setAttributeConfig("selectedMenuItem", {
        
                value: null
        
            });
        
        
            /**
            * @attribute onclick
            * @description Object literal representing the code to be executed  
            * when the button is clicked.  Format:<br> <code> {<br> 
            * <strong>fn:</strong> Function,   &#47;&#47; The handler to call 
            * when the event fires.<br> <strong>obj:</strong> Object, 
            * &#47;&#47; An object to pass back to the handler.<br> 
            * <strong>scope:</strong> Object &#47;&#47;  The object to use 
            * for the scope of the handler.<br> } </code>
            * @type Object
            * @default null
            */
            this.setAttributeConfig("onclick", {
        
                value: oAttributes.onclick,
                method: this._setOnClick
            
            });


            /**
            * @attribute focusmenu
            * @description Boolean indicating whether or not the button's menu 
            * should be focused when it is made visible.
            * @type Boolean
            * @default true
            */
            this.setAttributeConfig("focusmenu", {
        
                value: (oAttributes.focusmenu === false ? false : true),
                validator: Lang.isBoolean
        
            });


            /**
            * @attribute replaceLabel
            * @description Boolean indicating whether or not the text of the 
			* button's <code>&#60;label&#62;</code> element should be used as
			* the source for the button's label configuration attribute and 
			* removed from the DOM.
            * @type Boolean
            * @default false
            */
            this.setAttributeConfig("replaceLabel", {
        
                value: false,
                validator: Lang.isBoolean,
                writeOnce: true
        
            });

        },
        
        
        /**
        * @method focus
        * @description Causes the button to receive the focus and fires the 
        * button's "focus" event.
        */
        focus: function () {
        
            if (!this.get("disabled")) {
                //Adding a try/catch in case the element is not
                //  visible by the time it's focus is being called.
                //  for example, on a dialog that closes on button click
                try {
                    this._button.focus();
                } catch (e) {}
            
            }
        
        },
        
        
        /**
        * @method blur
        * @description Causes the button to lose focus and fires the button's
        * "blur" event.
        */
        blur: function () {
        
            if (!this.get("disabled")) {
                //Adding a try/catch in case the element is not
                //  visible by the time it's focus is being called.
                //  for example, on a dialog that closes on button click
                try {
                    this._button.blur();
                } catch (e) {}
        
            }
        
        },
        
        
        /**
        * @method hasFocus
        * @description Returns a boolean indicating whether or not the button 
        * has focus.
        * @return {Boolean}
        */
        hasFocus: function () {
        
            return (m_oFocusedButton == this);
        
        },
        
        
        /**
        * @method isActive
        * @description Returns a boolean indicating whether or not the button 
        * is active.
        * @return {Boolean}
        */
        isActive: function () {
        
            return this.hasClass(this.CLASS_NAME_PREFIX + this.CSS_CLASS_NAME + "-active");
        
        },
        
        
        /**
        * @method getMenu
        * @description Returns a reference to the button's menu.
        * @return {<a href="YAHOO.widget.Overlay.html">
        * YAHOO.widget.Overlay</a>|<a 
        * href="YAHOO.widget.Menu.html">YAHOO.widget.Menu</a>}
        */
        getMenu: function () {
        
            return this._menu;
        
        },
        
        
        /**
        * @method getForm
        * @description Returns a reference to the button's parent form.
        * @return {<a href="http://www.w3.org/TR/2000/WD-DOM-Level-1-
        * 20000929/level-one-html.html#ID-40002357">HTMLFormElement</a>}
        */
        getForm: function () {
        
        	var oButton = this._button,
        		oForm;
        
            if (oButton) {
            
            	oForm = oButton.form;
            
            }
        
        	return oForm;
        
        },
        
        
        /** 
        * @method getHiddenFields
        * @description Returns an <code>&#60;input&#62;</code> element or 
        * array of form elements used to represent the button when its parent 
        * form is submitted.  
        * @return {<a href="http://www.w3.org/TR/2000/WD-DOM-Level-1-20000929/
        * level-one-html.html#ID-6043025">HTMLInputElement</a>|Array}
        */
        getHiddenFields: function () {
        
            return this._hiddenFields;
        
        },
        
        
        /**
        * @method destroy
        * @description Removes the button's element from its parent element and 
        * removes all event handlers.
        */
        destroy: function () {
        
        
            var oElement = this.get("element"),
                oMenu = this._menu,
				oLabel = this._label,
                oParentNode,
                aButtons;
        
            if (oMenu) {
        

                if (m_oOverlayManager && m_oOverlayManager.find(oMenu)) {

                    m_oOverlayManager.remove(oMenu);

                }
        
                oMenu.destroy();
        
            }
        
        
            Event.purgeElement(oElement);
            Event.purgeElement(this._button);
            Event.removeListener(document, "mouseup", this._onDocumentMouseUp);
            Event.removeListener(document, "keyup", this._onDocumentKeyUp);
            Event.removeListener(document, "mousedown", this._onDocumentMouseDown);


			if (oLabel) {

            	Event.removeListener(oLabel, "click", this._onLabelClick);
				
				oParentNode = oLabel.parentNode;
				oParentNode.removeChild(oLabel);
				
			}
        
        
            var oForm = this.getForm();
            
            if (oForm) {
        
                Event.removeListener(oForm, "reset", this._onFormReset);
                Event.removeListener(oForm, "submit", this._onFormSubmit);
        
            }


            this.unsubscribeAll();

			oParentNode = oElement.parentNode;

            if (oParentNode) {

                oParentNode.removeChild(oElement);
            
            }
        
        
            delete m_oButtons[this.get("id")];

			var sClass = (this.CLASS_NAME_PREFIX + this.CSS_CLASS_NAME);

            aButtons = Dom.getElementsByClassName(sClass, 
                                this.NODE_NAME, oForm); 

            if (Lang.isArray(aButtons) && aButtons.length === 0) {

                Event.removeListener(oForm, "keypress", 
                        YAHOO.widget.Button.onFormKeyPress);

            }

        
        },
        
        
        fireEvent: function (p_sType , p_aArgs) {
        
			var sType = arguments[0];
		
			//  Disabled buttons should not respond to DOM events
		
			if (this.DOM_EVENTS[sType] && this.get("disabled")) {
		
				return false;
		
			}
		
			return YAHOO.widget.Button.superclass.fireEvent.apply(this, arguments);
        
        },
        
        
        /**
        * @method toString
        * @description Returns a string representing the button.
        * @return {String}
        */
        toString: function () {
        
            return ("Button " + this.get("id"));
        
        }
    
    });
    
    
    /**
    * @method YAHOO.widget.Button.onFormKeyPress
    * @description "keypress" event handler for the button's form.
    * @param {Event} p_oEvent Object representing the DOM event object passed 
    * back by the event utility (YAHOO.util.Event).
    */
    YAHOO.widget.Button.onFormKeyPress = function (p_oEvent) {
    
        var oTarget = Event.getTarget(p_oEvent),
            nCharCode = Event.getCharCode(p_oEvent),
            sNodeName = oTarget.nodeName && oTarget.nodeName.toUpperCase(),
            sType = oTarget.type,
    
            /*
                Boolean indicating if the form contains any enabled or 
                disabled YUI submit buttons
            */
    
            bFormContainsYUIButtons = false,
    
            oButton,
    
            oYUISubmitButton,   // The form's first, enabled YUI submit button
    
            /*
                 The form's first, enabled HTML submit button that precedes any 
                 YUI submit button
            */
    
            oPrecedingSubmitButton,
            
            oEvent; 
    
    
        function isSubmitButton(p_oElement) {
    
            var sId,
                oSrcElement;
    
            switch (p_oElement.nodeName.toUpperCase()) {
    
            case "INPUT":
            case "BUTTON":
            
                if (p_oElement.type == "submit" && !p_oElement.disabled) {
                    
                    if (!bFormContainsYUIButtons && !oPrecedingSubmitButton) {

                        oPrecedingSubmitButton = p_oElement;

                    }
                
                }

                break;
            

            default:
            
                sId = p_oElement.id;
    
                if (sId) {
    
                    oButton = m_oButtons[sId];
        
                    if (oButton) {

                        bFormContainsYUIButtons = true;
        
                        if (!oButton.get("disabled")) {

                            oSrcElement = oButton.get("srcelement");
    
                            if (!oYUISubmitButton && (oButton.get("type") == "submit" || 
                                (oSrcElement && oSrcElement.type == "submit"))) {

                                oYUISubmitButton = oButton;
                            
                            }
                        
                        }
                        
                    }
                
                }

                break;
    
            }
    
        }
    
    
        if (nCharCode == 13 && ((sNodeName == "INPUT" && (sType == "text" || 
            sType == "password" || sType == "checkbox" || sType == "radio" || 
            sType == "file")) || sNodeName == "SELECT")) {
    
            Dom.getElementsBy(isSubmitButton, "*", this);
    
    
            if (oPrecedingSubmitButton) {
    
                /*
                     Need to set focus to the first enabled submit button
                     to make sure that IE includes its name and value 
                     in the form's data set.
                */
    
                oPrecedingSubmitButton.focus();
            
            }
            else if (!oPrecedingSubmitButton && oYUISubmitButton) {
    
				/*
					Need to call "preventDefault" to ensure that the form doesn't end up getting
					submitted twice.
				*/
    
    			Event.preventDefault(p_oEvent);


				if (UA.ie) {
				
					oYUISubmitButton.get("element").fireEvent("onclick");
				
				}
				else {

					oEvent = document.createEvent("HTMLEvents");
					oEvent.initEvent("click", true, true);
			

					if (UA.gecko < 1.9) {
					
						oYUISubmitButton.fireEvent("click", oEvent);
					
					}
					else {

						oYUISubmitButton.get("element").dispatchEvent(oEvent);
					
					}
  
                }

            }
            
        }
    
    };
    
    
    /**
    * @method YAHOO.widget.Button.addHiddenFieldsToForm
    * @description Searches the specified form and adds hidden fields for  
    * instances of YAHOO.widget.Button that are of type "radio," "checkbox," 
    * "menu," and "split."
    * @param {<a href="http://www.w3.org/TR/2000/WD-DOM-Level-1-20000929/level-
    * one-html.html#ID-40002357">HTMLFormElement</a>} p_oForm Object reference 
    * for the form to search.
    */
    YAHOO.widget.Button.addHiddenFieldsToForm = function (p_oForm) {
    
        var proto = YAHOO.widget.Button.prototype,
			aButtons = Dom.getElementsByClassName(
							(proto.CLASS_NAME_PREFIX + proto.CSS_CLASS_NAME), 
                            "*", 
                            p_oForm),
    
            nButtons = aButtons.length,
            oButton,
            sId,
            i;
    
        if (nButtons > 0) {
    
    
            for (i = 0; i < nButtons; i++) {
    
                sId = aButtons[i].id;
    
                if (sId) {
    
                    oButton = m_oButtons[sId];
        
                    if (oButton) {
           
                        oButton.createHiddenFields();
                        
                    }
                
                }
            
            }
    
        }
    
    };
    

    /**
    * @method YAHOO.widget.Button.getButton
    * @description Returns a button with the specified id.
    * @param {String} p_sId String specifying the id of the root node of the 
    * HTML element representing the button to be retrieved.
    * @return {YAHOO.widget.Button}
    */
    YAHOO.widget.Button.getButton = function (p_sId) {

		return m_oButtons[p_sId];

    };
    
    
    // Events
    
    
    /**
    * @event focus
    * @description Fires when the menu item receives focus.  Passes back a  
    * single object representing the original DOM event object passed back by 
    * the event utility (YAHOO.util.Event) when the event was fired.  See 
    * <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> 
    * for more information on listening for this event.
    * @type YAHOO.util.CustomEvent
    */
    
    
    /**
    * @event blur
    * @description Fires when the menu item loses the input focus.  Passes back  
    * a single object representing the original DOM event object passed back by 
    * the event utility (YAHOO.util.Event) when the event was fired.  See 
    * <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> for  
    * more information on listening for this event.
    * @type YAHOO.util.CustomEvent
    */
    
    
    /**
    * @event option
    * @description Fires when the user invokes the button's option.  Passes 
    * back a single object representing the original DOM event (either 
    * "mousedown" or "keydown") that caused the "option" event to fire.  See 
    * <a href="YAHOO.util.Element.html#addListener">Element.addListener</a> 
    * for more information on listening for this event.
    * @type YAHOO.util.CustomEvent
    */

})();
(function () {

    // Shorthard for utilities
    
    var Dom = YAHOO.util.Dom,
        Event = YAHOO.util.Event,
        Lang = YAHOO.lang,
        Button = YAHOO.widget.Button,  
    
        // Private collection of radio buttons
    
        m_oButtons = {};



    /**
    * The ButtonGroup class creates a set of buttons that are mutually 
    * exclusive; checking one button in the set will uncheck all others in the 
    * button group.
    * @param {String} p_oElement String specifying the id attribute of the 
    * <code>&#60;div&#62;</code> element of the button group.
    * @param {<a href="http://www.w3.org/TR/2000/WD-DOM-Level-1-20000929/
    * level-one-html.html#ID-22445964">HTMLDivElement</a>} p_oElement Object 
    * specifying the <code>&#60;div&#62;</code> element of the button group.
    * @param {Object} p_oElement Object literal specifying a set of 
    * configuration attributes used to create the button group.
    * @param {Object} p_oAttributes Optional. Object literal specifying a set 
    * of configuration attributes used to create the button group.
    * @namespace YAHOO.widget
    * @class ButtonGroup
    * @constructor
    * @extends YAHOO.util.Element
    */
    YAHOO.widget.ButtonGroup = function (p_oElement, p_oAttributes) {
    
        var fnSuperClass = YAHOO.widget.ButtonGroup.superclass.constructor,
            sNodeName,
            oElement,
            sId;
    
        if (arguments.length == 1 && !Lang.isString(p_oElement) && 
            !p_oElement.nodeName) {
    
            if (!p_oElement.id) {
    
                sId = Dom.generateId();
    
                p_oElement.id = sId;
    
    
            }
    
    
    
            fnSuperClass.call(this, (this._createGroupElement()), p_oElement);
    
        }
        else if (Lang.isString(p_oElement)) {
    
            oElement = Dom.get(p_oElement);
    
            if (oElement) {
            
                if (oElement.nodeName.toUpperCase() == this.NODE_NAME) {
    
            
                    fnSuperClass.call(this, oElement, p_oAttributes);
    
                }
    
            }
        
        }
        else {
    
            sNodeName = p_oElement.nodeName.toUpperCase();
    
            if (sNodeName && sNodeName == this.NODE_NAME) {
        
                if (!p_oElement.id) {
        
                    p_oElement.id = Dom.generateId();
        
        
                }
        
        
                fnSuperClass.call(this, p_oElement, p_oAttributes);
    
            }
    
        }
    
    };
    
    
    YAHOO.extend(YAHOO.widget.ButtonGroup, YAHOO.util.Element, {
    
    
        // Protected properties
        
        
        /** 
        * @property _buttons
        * @description Array of buttons in the button group.
        * @default null
        * @protected
        * @type Array
        */
        _buttons: null,
        
        
        
        // Constants
        
        
        /**
        * @property NODE_NAME
        * @description The name of the tag to be used for the button 
        * group's element. 
        * @default "DIV"
        * @final
        * @type String
        */
        NODE_NAME: "DIV",


        /**
        * @property CLASS_NAME_PREFIX
        * @description Prefix used for all class names applied to a ButtonGroup.
        * @default "yui-"
        * @final
        * @type String
        */
        CLASS_NAME_PREFIX: "yui-",
        
        
        /**
        * @property CSS_CLASS_NAME
        * @description String representing the CSS class(es) to be applied  
        * to the button group's element.
        * @default "buttongroup"
        * @final
        * @type String
        */
        CSS_CLASS_NAME: "buttongroup",
    
    
    
        // Protected methods
        
        
        /**
        * @method _createGroupElement
        * @description Creates the button group's element.
        * @protected
        * @return {<a href="http://www.w3.org/TR/2000/WD-DOM-Level-1-20000929/
        * level-one-html.html#ID-22445964">HTMLDivElement</a>}
        */
        _createGroupElement: function () {
        
            var oElement = document.createElement(this.NODE_NAME);
        
            return oElement;
        
        },
        
        
        
        // Protected attribute setter methods
        
        
        /**
        * @method _setDisabled
        * @description Sets the value of the button groups's 
        * "disabled" attribute.
        * @protected
        * @param {Boolean} p_bDisabled Boolean indicating the value for
        * the button group's "disabled" attribute.
        */
        _setDisabled: function (p_bDisabled) {
        
            var nButtons = this.getCount(),
                i;
        
            if (nButtons > 0) {
        
                i = nButtons - 1;
                
                do {
        
                    this._buttons[i].set("disabled", p_bDisabled);
                
                }
                while (i--);
        
            }
        
        },
        
        
        
        // Protected event handlers
        
        
        /**
        * @method _onKeyDown
        * @description "keydown" event handler for the button group.
        * @protected
        * @param {Event} p_oEvent Object representing the DOM event object  
        * passed back by the event utility (YAHOO.util.Event).
        */
        _onKeyDown: function (p_oEvent) {
        
            var oTarget = Event.getTarget(p_oEvent),
                nCharCode = Event.getCharCode(p_oEvent),
                sId = oTarget.parentNode.parentNode.id,
                oButton = m_oButtons[sId],
                nIndex = -1;
        
        
            if (nCharCode == 37 || nCharCode == 38) {
        
                nIndex = (oButton.index === 0) ? 
                            (this._buttons.length - 1) : (oButton.index - 1);
            
            }
            else if (nCharCode == 39 || nCharCode == 40) {
        
                nIndex = (oButton.index === (this._buttons.length - 1)) ? 
                            0 : (oButton.index + 1);
        
            }
        
        
            if (nIndex > -1) {
        
                this.check(nIndex);
                this.getButton(nIndex).focus();
            
            }        
        
        },
        
        
        /**
        * @method _onAppendTo
        * @description "appendTo" event handler for the button group.
        * @protected
        * @param {Event} p_oEvent Object representing the event that was fired.
        */
        _onAppendTo: function (p_oEvent) {
        
            var aButtons = this._buttons,
                nButtons = aButtons.length,
                i;
        
            for (i = 0; i < nButtons; i++) {
        
                aButtons[i].appendTo(this.get("element"));
        
            }
        
        },
        
        
        /**
        * @method _onButtonCheckedChange
        * @description "checkedChange" event handler for each button in the 
        * button group.
        * @protected
        * @param {Event} p_oEvent Object representing the event that was fired.
        * @param {<a href="YAHOO.widget.Button.html">YAHOO.widget.Button</a>}  
        * p_oButton Object representing the button that fired the event.
        */
        _onButtonCheckedChange: function (p_oEvent, p_oButton) {
        
            var bChecked = p_oEvent.newValue,
                oCheckedButton = this.get("checkedButton");
        
            if (bChecked && oCheckedButton != p_oButton) {
        
                if (oCheckedButton) {
        
                    oCheckedButton.set("checked", false, true);
        
                }
        
                this.set("checkedButton", p_oButton);
                this.set("value", p_oButton.get("value"));
        
            }
            else if (oCheckedButton && !oCheckedButton.set("checked")) {
        
                oCheckedButton.set("checked", true, true);
        
            }
           
        },
        
        
        
        // Public methods
        
        
        /**
        * @method init
        * @description The ButtonGroup class's initialization method.
        * @param {String} p_oElement String specifying the id attribute of the 
        * <code>&#60;div&#62;</code> element of the button group.
        * @param {<a href="http://www.w3.org/TR/2000/WD-DOM-Level-1-20000929/
        * level-one-html.html#ID-22445964">HTMLDivElement</a>} p_oElement Object 
        * specifying the <code>&#60;div&#62;</code> element of the button group.
        * @param {Object} p_oElement Object literal specifying a set of  
        * configuration attributes used to create the button group.
        * @param {Object} p_oAttributes Optional. Object literal specifying a
        * set of configuration attributes used to create the button group.
        */
        init: function (p_oElement, p_oAttributes) {
        
            this._buttons = [];
        
            YAHOO.widget.ButtonGroup.superclass.init.call(this, p_oElement, 
                    p_oAttributes);
        
            this.addClass(this.CLASS_NAME_PREFIX + this.CSS_CLASS_NAME);

        
            var sClass = (YAHOO.widget.Button.prototype.CLASS_NAME_PREFIX + "radio-button"),
				aButtons = this.getElementsByClassName(sClass);

        
        
            if (aButtons.length > 0) {
        
        
                this.addButtons(aButtons);
        
            }
        
        
        
            function isRadioButton(p_oElement) {
        
                return (p_oElement.type == "radio");
        
            }
        
            aButtons = 
                Dom.getElementsBy(isRadioButton, "input", this.get("element"));
        
        
            if (aButtons.length > 0) {
        
        
                this.addButtons(aButtons);
        
            }
        
            this.on("keydown", this._onKeyDown);
            this.on("appendTo", this._onAppendTo);
        

            var oContainer = this.get("container");

            if (oContainer) {
        
                if (Lang.isString(oContainer)) {
        
                    Event.onContentReady(oContainer, function () {
        
                        this.appendTo(oContainer);            
                    
                    }, null, this);
        
                }
                else {
        
                    this.appendTo(oContainer);
        
                }
        
            }
        
        
        
        },
        
        
        /**
        * @method initAttributes
        * @description Initializes all of the configuration attributes used to  
        * create the button group.
        * @param {Object} p_oAttributes Object literal specifying a set of 
        * configuration attributes used to create the button group.
        */
        initAttributes: function (p_oAttributes) {
        
            var oAttributes = p_oAttributes || {};
        
            YAHOO.widget.ButtonGroup.superclass.initAttributes.call(
                this, oAttributes);
        
        
            /**
            * @attribute name
            * @description String specifying the name for the button group.  
            * This name will be applied to each button in the button group.
            * @default null
            * @type String
            */
            this.setAttributeConfig("name", {
        
                value: oAttributes.name,
                validator: Lang.isString
        
            });
        
        
            /**
            * @attribute disabled
            * @description Boolean indicating if the button group should be 
            * disabled.  Disabling the button group will disable each button 
            * in the button group.  Disabled buttons are dimmed and will not 
            * respond to user input or fire events.
            * @default false
            * @type Boolean
            */
            this.setAttributeConfig("disabled", {
        
                value: (oAttributes.disabled || false),
                validator: Lang.isBoolean,
                method: this._setDisabled
        
            });
        
        
            /**
            * @attribute value
            * @description Object specifying the value for the button group.
            * @default null
            * @type Object
            */
            this.setAttributeConfig("value", {
        
                value: oAttributes.value
        
            });
        
        
            /**
            * @attribute container
            * @description HTML element reference or string specifying the id 
            * attribute of the HTML element that the button group's markup
            * should be rendered into.
            * @type <a href="http://www.w3.org/TR/2000/WD-DOM-Level-1-20000929/
            * level-one-html.html#ID-58190037">HTMLElement</a>|String
            * @default null
			* @writeonce
            */
            this.setAttributeConfig("container", {
        
                value: oAttributes.container,
                writeOnce: true
        
            });
        
        
            /**
            * @attribute checkedButton
            * @description Reference for the button in the button group that 
            * is checked.
            * @type {<a href="YAHOO.widget.Button.html">YAHOO.widget.Button</a>}
            * @default null
            */
            this.setAttributeConfig("checkedButton", {
        
                value: null
        
            });
        
        },
        
        
        /**
        * @method addButton
        * @description Adds the button to the button group.
        * @param {<a href="YAHOO.widget.Button.html">YAHOO.widget.Button</a>}  
        * p_oButton Object reference for the <a href="YAHOO.widget.Button.html">
        * YAHOO.widget.Button</a> instance to be added to the button group.
        * @param {String} p_oButton String specifying the id attribute of the 
        * <code>&#60;input&#62;</code> or <code>&#60;span&#62;</code> element 
        * to be used to create the button to be added to the button group.
        * @param {<a href="http://www.w3.org/TR/2000/WD-DOM-Level-1-20000929/
        * level-one-html.html#ID-6043025">HTMLInputElement</a>|<a href="
        * http://www.w3.org/TR/2000/WD-DOM-Level-1-20000929/level-one-html.html#
        * ID-33759296">HTMLElement</a>} p_oButton Object reference for the 
        * <code>&#60;input&#62;</code> or <code>&#60;span&#62;</code> element 
        * to be used to create the button to be added to the button group.
        * @param {Object} p_oButton Object literal specifying a set of 
        * <a href="YAHOO.widget.Button.html">YAHOO.widget.Button</a> 
        * configuration attributes used to configure the button to be added to 
        * the button group.
        * @return {<a href="YAHOO.widget.Button.html">YAHOO.widget.Button</a>} 
        */
        addButton: function (p_oButton) {
        
            var oButton,
                oButtonElement,
                oGroupElement,
                nIndex,
                sButtonName,
                sGroupName;
        
        
            if (p_oButton instanceof Button && 
                p_oButton.get("type") == "radio") {
        
                oButton = p_oButton;
        
            }
            else if (!Lang.isString(p_oButton) && !p_oButton.nodeName) {
        
                p_oButton.type = "radio";
        
                oButton = new Button(p_oButton);

            }
            else {
        
                oButton = new Button(p_oButton, { type: "radio" });
        
            }
        
        
            if (oButton) {
        
                nIndex = this._buttons.length;
                sButtonName = oButton.get("name");
                sGroupName = this.get("name");
        
                oButton.index = nIndex;
        
                this._buttons[nIndex] = oButton;
                m_oButtons[oButton.get("id")] = oButton;
        
        
                if (sButtonName != sGroupName) {
        
                    oButton.set("name", sGroupName);
                
                }
        
        
                if (this.get("disabled")) {
        
                    oButton.set("disabled", true);
        
                }
        
        
                if (oButton.get("checked")) {
        
                    this.set("checkedButton", oButton);
        
                }

                
                oButtonElement = oButton.get("element");
                oGroupElement = this.get("element");
                
                if (oButtonElement.parentNode != oGroupElement) {
                
                    oGroupElement.appendChild(oButtonElement);
                
                }
        
                
                oButton.on("checkedChange", 
                    this._onButtonCheckedChange, oButton, this);
        
        
            }

			return oButton;
        
        },
        
        
        /**
        * @method addButtons
        * @description Adds the array of buttons to the button group.
        * @param {Array} p_aButtons Array of <a href="YAHOO.widget.Button.html">
        * YAHOO.widget.Button</a> instances to be added 
        * to the button group.
        * @param {Array} p_aButtons Array of strings specifying the id 
        * attribute of the <code>&#60;input&#62;</code> or <code>&#60;span&#62;
        * </code> elements to be used to create the buttons to be added to the 
        * button group.
        * @param {Array} p_aButtons Array of object references for the 
        * <code>&#60;input&#62;</code> or <code>&#60;span&#62;</code> elements 
        * to be used to create the buttons to be added to the button group.
        * @param {Array} p_aButtons Array of object literals, each containing
        * a set of <a href="YAHOO.widget.Button.html">YAHOO.widget.Button</a>  
        * configuration attributes used to configure each button to be added 
        * to the button group.
        * @return {Array}
        */
        addButtons: function (p_aButtons) {
    
            var nButtons,
                oButton,
                aButtons,
                i;
        
            if (Lang.isArray(p_aButtons)) {
            
                nButtons = p_aButtons.length;
                aButtons = [];
        
                if (nButtons > 0) {
        
                    for (i = 0; i < nButtons; i++) {
        
                        oButton = this.addButton(p_aButtons[i]);
                        
                        if (oButton) {
        
                            aButtons[aButtons.length] = oButton;
        
                        }
                    
                    }
                
                }
        
            }

			return aButtons;
        
        },
        
        
        /**
        * @method removeButton
        * @description Removes the button at the specified index from the 
        * button group.
        * @param {Number} p_nIndex Number specifying the index of the button 
        * to be removed from the button group.
        */
        removeButton: function (p_nIndex) {
        
            var oButton = this.getButton(p_nIndex),
                nButtons,
                i;
            
            if (oButton) {
        
        
                this._buttons.splice(p_nIndex, 1);
                delete m_oButtons[oButton.get("id")];
        
                oButton.removeListener("checkedChange", 
                    this._onButtonCheckedChange);

                oButton.destroy();
        
        
                nButtons = this._buttons.length;
                
                if (nButtons > 0) {
        
                    i = this._buttons.length - 1;
                    
                    do {
        
                        this._buttons[i].index = i;
        
                    }
                    while (i--);
                
                }
        
        
            }
        
        },
        
        
        /**
        * @method getButton
        * @description Returns the button at the specified index.
        * @param {Number} p_nIndex The index of the button to retrieve from the 
        * button group.
        * @return {<a href="YAHOO.widget.Button.html">YAHOO.widget.Button</a>}
        */
        getButton: function (p_nIndex) {
        
            return this._buttons[p_nIndex];
        
        },
        
        
        /**
        * @method getButtons
        * @description Returns an array of the buttons in the button group.
        * @return {Array}
        */
        getButtons: function () {
        
            return this._buttons;
        
        },
        
        
        /**
        * @method getCount
        * @description Returns the number of buttons in the button group.
        * @return {Number}
        */
        getCount: function () {
        
            return this._buttons.length;
        
        },
        
        
        /**
        * @method focus
        * @description Sets focus to the button at the specified index.
        * @param {Number} p_nIndex Number indicating the index of the button 
        * to focus. 
        */
        focus: function (p_nIndex) {
        
            var oButton,
                nButtons,
                i;
        
            if (Lang.isNumber(p_nIndex)) {
        
                oButton = this._buttons[p_nIndex];
                
                if (oButton) {
        
                    oButton.focus();
        
                }
            
            }
            else {
        
                nButtons = this.getCount();
        
                for (i = 0; i < nButtons; i++) {
        
                    oButton = this._buttons[i];
        
                    if (!oButton.get("disabled")) {
        
                        oButton.focus();
                        break;
        
                    }
        
                }
        
            }
        
        },
        
        
        /**
        * @method check
        * @description Checks the button at the specified index.
        * @param {Number} p_nIndex Number indicating the index of the button 
        * to check. 
        */
        check: function (p_nIndex) {
        
            var oButton = this.getButton(p_nIndex);
            
            if (oButton) {
        
                oButton.set("checked", true);
            
            }
        
        },
        
        
        /**
        * @method destroy
        * @description Removes the button group's element from its parent 
        * element and removes all event handlers.
        */
        destroy: function () {
        
        
            var nButtons = this._buttons.length,
                oElement = this.get("element"),
                oParentNode = oElement.parentNode,
                i;
            
            if (nButtons > 0) {
        
                i = this._buttons.length - 1;
        
                do {
        
                    this._buttons[i].destroy();
        
                }
                while (i--);
            
            }
        
        
            Event.purgeElement(oElement);
            
        
            oParentNode.removeChild(oElement);
        
        },
        
        
        /**
        * @method toString
        * @description Returns a string representing the button group.
        * @return {String}
        */
        toString: function () {
        
            return ("ButtonGroup " + this.get("id"));
        
        }
    
    });

})();
YAHOO.register("button", YAHOO.widget.Button, {version: "2.9.0", build: "2800"});

/*
Copyright (c) 2011, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://developer.yahoo.com/yui/license.html
version: 2.9.0
*/
(function () {

    /**
    * Config is a utility used within an Object to allow the implementer to
    * maintain a list of local configuration properties and listen for changes 
    * to those properties dynamically using CustomEvent. The initial values are 
    * also maintained so that the configuration can be reset at any given point 
    * to its initial state.
    * @namespace YAHOO.util
    * @class Config
    * @constructor
    * @param {Object} owner The owner Object to which this Config Object belongs
    */
    YAHOO.util.Config = function (owner) {

        if (owner) {
            this.init(owner);
        }


    };


    var Lang = YAHOO.lang,
        CustomEvent = YAHOO.util.CustomEvent,
        Config = YAHOO.util.Config;


    /**
     * Constant representing the CustomEvent type for the config changed event.
     * @property YAHOO.util.Config.CONFIG_CHANGED_EVENT
     * @private
     * @static
     * @final
     */
    Config.CONFIG_CHANGED_EVENT = "configChanged";
    
    /**
     * Constant representing the boolean type string
     * @property YAHOO.util.Config.BOOLEAN_TYPE
     * @private
     * @static
     * @final
     */
    Config.BOOLEAN_TYPE = "boolean";
    
    Config.prototype = {
     
        /**
        * Object reference to the owner of this Config Object
        * @property owner
        * @type Object
        */
        owner: null,
        
        /**
        * Boolean flag that specifies whether a queue is currently 
        * being executed
        * @property queueInProgress
        * @type Boolean
        */
        queueInProgress: false,
        
        /**
        * Maintains the local collection of configuration property objects and 
        * their specified values
        * @property config
        * @private
        * @type Object
        */ 
        config: null,
        
        /**
        * Maintains the local collection of configuration property objects as 
        * they were initially applied.
        * This object is used when resetting a property.
        * @property initialConfig
        * @private
        * @type Object
        */ 
        initialConfig: null,
        
        /**
        * Maintains the local, normalized CustomEvent queue
        * @property eventQueue
        * @private
        * @type Object
        */ 
        eventQueue: null,
        
        /**
        * Custom Event, notifying subscribers when Config properties are set 
        * (setProperty is called without the silent flag
        * @event configChangedEvent
        */
        configChangedEvent: null,
    
        /**
        * Initializes the configuration Object and all of its local members.
        * @method init
        * @param {Object} owner The owner Object to which this Config 
        * Object belongs
        */
        init: function (owner) {
    
            this.owner = owner;
    
            this.configChangedEvent = 
                this.createEvent(Config.CONFIG_CHANGED_EVENT);
    
            this.configChangedEvent.signature = CustomEvent.LIST;
            this.queueInProgress = false;
            this.config = {};
            this.initialConfig = {};
            this.eventQueue = [];
        
        },
        
        /**
        * Validates that the value passed in is a Boolean.
        * @method checkBoolean
        * @param {Object} val The value to validate
        * @return {Boolean} true, if the value is valid
        */ 
        checkBoolean: function (val) {
            return (typeof val == Config.BOOLEAN_TYPE);
        },
        
        /**
        * Validates that the value passed in is a number.
        * @method checkNumber
        * @param {Object} val The value to validate
        * @return {Boolean} true, if the value is valid
        */
        checkNumber: function (val) {
            return (!isNaN(val));
        },
        
        /**
        * Fires a configuration property event using the specified value. 
        * @method fireEvent
        * @private
        * @param {String} key The configuration property's name
        * @param {value} Object The value of the correct type for the property
        */ 
        fireEvent: function ( key, value ) {
            var property = this.config[key];
        
            if (property && property.event) {
                property.event.fire(value);
            } 
        },
        
        /**
        * Adds a property to the Config Object's private config hash.
        * @method addProperty
        * @param {String} key The configuration property's name
        * @param {Object} propertyObject The Object containing all of this 
        * property's arguments
        */
        addProperty: function ( key, propertyObject ) {
            key = key.toLowerCase();
        
            this.config[key] = propertyObject;
        
            propertyObject.event = this.createEvent(key, { scope: this.owner });
            propertyObject.event.signature = CustomEvent.LIST;
            
            
            propertyObject.key = key;
        
            if (propertyObject.handler) {
                propertyObject.event.subscribe(propertyObject.handler, 
                    this.owner);
            }
        
            this.setProperty(key, propertyObject.value, true);
            
            if (! propertyObject.suppressEvent) {
                this.queueProperty(key, propertyObject.value);
            }
            
        },
        
        /**
        * Returns a key-value configuration map of the values currently set in  
        * the Config Object.
        * @method getConfig
        * @return {Object} The current config, represented in a key-value map
        */
        getConfig: function () {
        
            var cfg = {},
                currCfg = this.config,
                prop,
                property;
                
            for (prop in currCfg) {
                if (Lang.hasOwnProperty(currCfg, prop)) {
                    property = currCfg[prop];
                    if (property && property.event) {
                        cfg[prop] = property.value;
                    }
                }
            }

            return cfg;
        },
        
        /**
        * Returns the value of specified property.
        * @method getProperty
        * @param {String} key The name of the property
        * @return {Object}  The value of the specified property
        */
        getProperty: function (key) {
            var property = this.config[key.toLowerCase()];
            if (property && property.event) {
                return property.value;
            } else {
                return undefined;
            }
        },
        
        /**
        * Resets the specified property's value to its initial value.
        * @method resetProperty
        * @param {String} key The name of the property
        * @return {Boolean} True is the property was reset, false if not
        */
        resetProperty: function (key) {
            key = key.toLowerCase();

            var property = this.config[key];

            if (property && property.event) {
                if (key in this.initialConfig) {
                    this.setProperty(key, this.initialConfig[key]);
                    return true;
                }
            } else {
                return false;
            }
        },
        
        /**
        * Sets the value of a property. If the silent property is passed as 
        * true, the property's event will not be fired.
        * @method setProperty
        * @param {String} key The name of the property
        * @param {String} value The value to set the property to
        * @param {Boolean} silent Whether the value should be set silently, 
        * without firing the property event.
        * @return {Boolean} True, if the set was successful, false if it failed.
        */
        setProperty: function (key, value, silent) {
        
            var property;
        
            key = key.toLowerCase();
        
            if (this.queueInProgress && ! silent) {
                // Currently running through a queue... 
                this.queueProperty(key,value);
                return true;
    
            } else {
                property = this.config[key];
                if (property && property.event) {
                    if (property.validator && !property.validator(value)) {
                        return false;
                    } else {
                        property.value = value;
                        if (! silent) {
                            this.fireEvent(key, value);
                            this.configChangedEvent.fire([key, value]);
                        }
                        return true;
                    }
                } else {
                    return false;
                }
            }
        },
        
        /**
        * Sets the value of a property and queues its event to execute. If the 
        * event is already scheduled to execute, it is
        * moved from its current position to the end of the queue.
        * @method queueProperty
        * @param {String} key The name of the property
        * @param {String} value The value to set the property to
        * @return {Boolean}  true, if the set was successful, false if 
        * it failed.
        */ 
        queueProperty: function (key, value) {
        
            key = key.toLowerCase();
        
            var property = this.config[key],
                foundDuplicate = false,
                iLen,
                queueItem,
                queueItemKey,
                queueItemValue,
                sLen,
                supercedesCheck,
                qLen,
                queueItemCheck,
                queueItemCheckKey,
                queueItemCheckValue,
                i,
                s,
                q;
                                
            if (property && property.event) {
    
                if (!Lang.isUndefined(value) && property.validator && 
                    !property.validator(value)) { // validator
                    return false;
                } else {
        
                    if (!Lang.isUndefined(value)) {
                        property.value = value;
                    } else {
                        value = property.value;
                    }
        
                    foundDuplicate = false;
                    iLen = this.eventQueue.length;
        
                    for (i = 0; i < iLen; i++) {
                        queueItem = this.eventQueue[i];
        
                        if (queueItem) {
                            queueItemKey = queueItem[0];
                            queueItemValue = queueItem[1];

                            if (queueItemKey == key) {
    
                                /*
                                    found a dupe... push to end of queue, null 
                                    current item, and break
                                */
    
                                this.eventQueue[i] = null;
    
                                this.eventQueue.push(
                                    [key, (!Lang.isUndefined(value) ? 
                                    value : queueItemValue)]);
    
                                foundDuplicate = true;
                                break;
                            }
                        }
                    }
                    
                    // this is a refire, or a new property in the queue
    
                    if (! foundDuplicate && !Lang.isUndefined(value)) { 
                        this.eventQueue.push([key, value]);
                    }
                }
        
                if (property.supercedes) {

                    sLen = property.supercedes.length;

                    for (s = 0; s < sLen; s++) {

                        supercedesCheck = property.supercedes[s];
                        qLen = this.eventQueue.length;

                        for (q = 0; q < qLen; q++) {
                            queueItemCheck = this.eventQueue[q];

                            if (queueItemCheck) {
                                queueItemCheckKey = queueItemCheck[0];
                                queueItemCheckValue = queueItemCheck[1];

                                if (queueItemCheckKey == 
                                    supercedesCheck.toLowerCase() ) {

                                    this.eventQueue.push([queueItemCheckKey, 
                                        queueItemCheckValue]);

                                    this.eventQueue[q] = null;
                                    break;

                                }
                            }
                        }
                    }
                }


                return true;
            } else {
                return false;
            }
        },
        
        /**
        * Fires the event for a property using the property's current value.
        * @method refireEvent
        * @param {String} key The name of the property
        */
        refireEvent: function (key) {
    
            key = key.toLowerCase();
        
            var property = this.config[key];
    
            if (property && property.event && 
    
                !Lang.isUndefined(property.value)) {
    
                if (this.queueInProgress) {
    
                    this.queueProperty(key);
    
                } else {
    
                    this.fireEvent(key, property.value);
    
                }
    
            }
        },
        
        /**
        * Applies a key-value Object literal to the configuration, replacing  
        * any existing values, and queueing the property events.
        * Although the values will be set, fireQueue() must be called for their 
        * associated events to execute.
        * @method applyConfig
        * @param {Object} userConfig The configuration Object literal
        * @param {Boolean} init  When set to true, the initialConfig will 
        * be set to the userConfig passed in, so that calling a reset will 
        * reset the properties to the passed values.
        */
        applyConfig: function (userConfig, init) {
        
            var sKey,
                oConfig;

            if (init) {
                oConfig = {};
                for (sKey in userConfig) {
                    if (Lang.hasOwnProperty(userConfig, sKey)) {
                        oConfig[sKey.toLowerCase()] = userConfig[sKey];
                    }
                }
                this.initialConfig = oConfig;
            }

            for (sKey in userConfig) {
                if (Lang.hasOwnProperty(userConfig, sKey)) {
                    this.queueProperty(sKey, userConfig[sKey]);
                }
            }
        },
        
        /**
        * Refires the events for all configuration properties using their 
        * current values.
        * @method refresh
        */
        refresh: function () {

            var prop;

            for (prop in this.config) {
                if (Lang.hasOwnProperty(this.config, prop)) {
                    this.refireEvent(prop);
                }
            }
        },
        
        /**
        * Fires the normalized list of queued property change events
        * @method fireQueue
        */
        fireQueue: function () {
        
            var i, 
                queueItem,
                key,
                value,
                property;
        
            this.queueInProgress = true;
            for (i = 0;i < this.eventQueue.length; i++) {
                queueItem = this.eventQueue[i];
                if (queueItem) {
        
                    key = queueItem[0];
                    value = queueItem[1];
                    property = this.config[key];

                    property.value = value;

                    // Clear out queue entry, to avoid it being 
                    // re-added to the queue by any queueProperty/supercedes
                    // calls which are invoked during fireEvent
                    this.eventQueue[i] = null;

                    this.fireEvent(key,value);
                }
            }
            
            this.queueInProgress = false;
            this.eventQueue = [];
        },
        
        /**
        * Subscribes an external handler to the change event for any 
        * given property. 
        * @method subscribeToConfigEvent
        * @param {String} key The property name
        * @param {Function} handler The handler function to use subscribe to 
        * the property's event
        * @param {Object} obj The Object to use for scoping the event handler 
        * (see CustomEvent documentation)
        * @param {Boolean} overrideContext Optional. If true, will override
        * "this" within the handler to map to the scope Object passed into the
        * method.
        * @return {Boolean} True, if the subscription was successful, 
        * otherwise false.
        */ 
        subscribeToConfigEvent: function (key, handler, obj, overrideContext) {
    
            var property = this.config[key.toLowerCase()];
    
            if (property && property.event) {
                if (!Config.alreadySubscribed(property.event, handler, obj)) {
                    property.event.subscribe(handler, obj, overrideContext);
                }
                return true;
            } else {
                return false;
            }
    
        },
        
        /**
        * Unsubscribes an external handler from the change event for any 
        * given property. 
        * @method unsubscribeFromConfigEvent
        * @param {String} key The property name
        * @param {Function} handler The handler function to use subscribe to 
        * the property's event
        * @param {Object} obj The Object to use for scoping the event 
        * handler (see CustomEvent documentation)
        * @return {Boolean} True, if the unsubscription was successful, 
        * otherwise false.
        */
        unsubscribeFromConfigEvent: function (key, handler, obj) {
            var property = this.config[key.toLowerCase()];
            if (property && property.event) {
                return property.event.unsubscribe(handler, obj);
            } else {
                return false;
            }
        },
        
        /**
        * Returns a string representation of the Config object
        * @method toString
        * @return {String} The Config object in string format.
        */
        toString: function () {
            var output = "Config";
            if (this.owner) {
                output += " [" + this.owner.toString() + "]";
            }
            return output;
        },
        
        /**
        * Returns a string representation of the Config object's current 
        * CustomEvent queue
        * @method outputEventQueue
        * @return {String} The string list of CustomEvents currently queued 
        * for execution
        */
        outputEventQueue: function () {

            var output = "",
                queueItem,
                q,
                nQueue = this.eventQueue.length;
              
            for (q = 0; q < nQueue; q++) {
                queueItem = this.eventQueue[q];
                if (queueItem) {
                    output += queueItem[0] + "=" + queueItem[1] + ", ";
                }
            }
            return output;
        },

        /**
        * Sets all properties to null, unsubscribes all listeners from each 
        * property's change event and all listeners from the configChangedEvent.
        * @method destroy
        */
        destroy: function () {

            var oConfig = this.config,
                sProperty,
                oProperty;


            for (sProperty in oConfig) {
            
                if (Lang.hasOwnProperty(oConfig, sProperty)) {

                    oProperty = oConfig[sProperty];

                    oProperty.event.unsubscribeAll();
                    oProperty.event = null;

                }
            
            }
            
            this.configChangedEvent.unsubscribeAll();
            
            this.configChangedEvent = null;
            this.owner = null;
            this.config = null;
            this.initialConfig = null;
            this.eventQueue = null;
        
        }

    };
    
    
    
    /**
    * Checks to determine if a particular function/Object pair are already 
    * subscribed to the specified CustomEvent
    * @method YAHOO.util.Config.alreadySubscribed
    * @static
    * @param {YAHOO.util.CustomEvent} evt The CustomEvent for which to check 
    * the subscriptions
    * @param {Function} fn The function to look for in the subscribers list
    * @param {Object} obj The execution scope Object for the subscription
    * @return {Boolean} true, if the function/Object pair is already subscribed 
    * to the CustomEvent passed in
    */
    Config.alreadySubscribed = function (evt, fn, obj) {
    
        var nSubscribers = evt.subscribers.length,
            subsc,
            i;

        if (nSubscribers > 0) {
            i = nSubscribers - 1;
            do {
                subsc = evt.subscribers[i];
                if (subsc && subsc.obj == obj && subsc.fn == fn) {
                    return true;
                }
            }
            while (i--);
        }

        return false;

    };

    YAHOO.lang.augmentProto(Config, YAHOO.util.EventProvider);

}());
(function () {

    /**
    * The Container family of components is designed to enable developers to 
    * create different kinds of content-containing modules on the web. Module 
    * and Overlay are the most basic containers, and they can be used directly 
    * or extended to build custom containers. Also part of the Container family 
    * are four UI controls that extend Module and Overlay: Tooltip, Panel, 
    * Dialog, and SimpleDialog.
    * @module container
    * @title Container
    * @requires yahoo, dom, event 
    * @optional dragdrop, animation, button
    */
    
    /**
    * Module is a JavaScript representation of the Standard Module Format. 
    * Standard Module Format is a simple standard for markup containers where 
    * child nodes representing the header, body, and footer of the content are 
    * denoted using the CSS classes "hd", "bd", and "ft" respectively. 
    * Module is the base class for all other classes in the YUI 
    * Container package.
    * @namespace YAHOO.widget
    * @class Module
    * @constructor
    * @param {String} el The element ID representing the Module <em>OR</em>
    * @param {HTMLElement} el The element representing the Module
    * @param {Object} userConfig The configuration Object literal containing 
    * the configuration that should be set for this module. See configuration 
    * documentation for more details.
    */
    YAHOO.widget.Module = function (el, userConfig) {
        if (el) {
            this.init(el, userConfig);
        } else {
        }
    };

    var Dom = YAHOO.util.Dom,
        Config = YAHOO.util.Config,
        Event = YAHOO.util.Event,
        CustomEvent = YAHOO.util.CustomEvent,
        Module = YAHOO.widget.Module,
        UA = YAHOO.env.ua,

        m_oModuleTemplate,
        m_oHeaderTemplate,
        m_oBodyTemplate,
        m_oFooterTemplate,

        /**
        * Constant representing the name of the Module's events
        * @property EVENT_TYPES
        * @private
        * @final
        * @type Object
        */
        EVENT_TYPES = {
            "BEFORE_INIT": "beforeInit",
            "INIT": "init",
            "APPEND": "append",
            "BEFORE_RENDER": "beforeRender",
            "RENDER": "render",
            "CHANGE_HEADER": "changeHeader",
            "CHANGE_BODY": "changeBody",
            "CHANGE_FOOTER": "changeFooter",
            "CHANGE_CONTENT": "changeContent",
            "DESTROY": "destroy",
            "BEFORE_SHOW": "beforeShow",
            "SHOW": "show",
            "BEFORE_HIDE": "beforeHide",
            "HIDE": "hide"
        },
            
        /**
        * Constant representing the Module's configuration properties
        * @property DEFAULT_CONFIG
        * @private
        * @final
        * @type Object
        */
        DEFAULT_CONFIG = {
        
            "VISIBLE": { 
                key: "visible", 
                value: true, 
                validator: YAHOO.lang.isBoolean 
            },

            "EFFECT": {
                key: "effect",
                suppressEvent: true,
                supercedes: ["visible"]
            },

            "MONITOR_RESIZE": {
                key: "monitorresize",
                value: true
            },

            "APPEND_TO_DOCUMENT_BODY": {
                key: "appendtodocumentbody",
                value: false
            }
        };

    /**
    * Constant representing the prefix path to use for non-secure images
    * @property YAHOO.widget.Module.IMG_ROOT
    * @static
    * @final
    * @type String
    */
    Module.IMG_ROOT = null;
    
    /**
    * Constant representing the prefix path to use for securely served images
    * @property YAHOO.widget.Module.IMG_ROOT_SSL
    * @static
    * @final
    * @type String
    */
    Module.IMG_ROOT_SSL = null;
    
    /**
    * Constant for the default CSS class name that represents a Module
    * @property YAHOO.widget.Module.CSS_MODULE
    * @static
    * @final
    * @type String
    */
    Module.CSS_MODULE = "yui-module";
    
    /**
    * CSS classname representing the module header. NOTE: The classname is inserted into the DOM as HTML, and should be escaped by the implementor if coming from an external source.
    * @property YAHOO.widget.Module.CSS_HEADER
    * @static
    * @final
    * @type String
    */
    Module.CSS_HEADER = "hd";

    /**
    * CSS classname representing the module body. NOTE: The classname is inserted into the DOM as HTML, and should be escaped by the implementor if coming from an external source.
    * @property YAHOO.widget.Module.CSS_BODY
    * @static
    * @final
    * @type String
    */
    Module.CSS_BODY = "bd";
    
    /**
    * CSS classname representing the module footer. NOTE: The classname is inserted into the DOM as HTML, and should be escaped by the implementor if coming from an external source.
    * @property YAHOO.widget.Module.CSS_FOOTER
    * @static
    * @final
    * @type String
    */
    Module.CSS_FOOTER = "ft";
    
    /**
    * Constant representing the url for the "src" attribute of the iframe 
    * used to monitor changes to the browser's base font size
    * @property YAHOO.widget.Module.RESIZE_MONITOR_SECURE_URL
    * @static
    * @final
    * @type String
    */
    Module.RESIZE_MONITOR_SECURE_URL = "javascript:false;";

    /**
    * Constant representing the buffer amount (in pixels) to use when positioning
    * the text resize monitor offscreen. The resize monitor is positioned
    * offscreen by an amount eqaul to its offsetHeight + the buffer value.
    * 
    * @property YAHOO.widget.Module.RESIZE_MONITOR_BUFFER
    * @static
    * @type Number
    */
    // Set to 1, to work around pixel offset in IE8, which increases when zoom is used
    Module.RESIZE_MONITOR_BUFFER = 1;

    /**
    * Singleton CustomEvent fired when the font size is changed in the browser.
    * Opera's "zoom" functionality currently does not support text 
    * size detection.
    * @event YAHOO.widget.Module.textResizeEvent
    */
    Module.textResizeEvent = new CustomEvent("textResize");

    /**
     * Helper utility method, which forces a document level 
     * redraw for Opera, which can help remove repaint
     * irregularities after applying DOM changes.
     *
     * @method YAHOO.widget.Module.forceDocumentRedraw
     * @static
     */
    Module.forceDocumentRedraw = function() {
        var docEl = document.documentElement;
        if (docEl) {
            docEl.className += " ";
            docEl.className = YAHOO.lang.trim(docEl.className);
        }
    };

    function createModuleTemplate() {

        if (!m_oModuleTemplate) {
            m_oModuleTemplate = document.createElement("div");
            
            m_oModuleTemplate.innerHTML = ("<div class=\"" + 
                Module.CSS_HEADER + "\"></div>" + "<div class=\"" + 
                Module.CSS_BODY + "\"></div><div class=\"" + 
                Module.CSS_FOOTER + "\"></div>");

            m_oHeaderTemplate = m_oModuleTemplate.firstChild;
            m_oBodyTemplate = m_oHeaderTemplate.nextSibling;
            m_oFooterTemplate = m_oBodyTemplate.nextSibling;
        }

        return m_oModuleTemplate;
    }

    function createHeader() {
        if (!m_oHeaderTemplate) {
            createModuleTemplate();
        }
        return (m_oHeaderTemplate.cloneNode(false));
    }

    function createBody() {
        if (!m_oBodyTemplate) {
            createModuleTemplate();
        }
        return (m_oBodyTemplate.cloneNode(false));
    }

    function createFooter() {
        if (!m_oFooterTemplate) {
            createModuleTemplate();
        }
        return (m_oFooterTemplate.cloneNode(false));
    }

    Module.prototype = {

        /**
        * The class's constructor function
        * @property contructor
        * @type Function
        */
        constructor: Module,
        
        /**
        * The main module element that contains the header, body, and footer
        * @property element
        * @type HTMLElement
        */
        element: null,

        /**
        * The header element, denoted with CSS class "hd"
        * @property header
        * @type HTMLElement
        */
        header: null,

        /**
        * The body element, denoted with CSS class "bd"
        * @property body
        * @type HTMLElement
        */
        body: null,

        /**
        * The footer element, denoted with CSS class "ft"
        * @property footer
        * @type HTMLElement
        */
        footer: null,

        /**
        * The id of the element
        * @property id
        * @type String
        */
        id: null,

        /**
        * A string representing the root path for all images created by
        * a Module instance.
        * @deprecated It is recommend that any images for a Module be applied
        * via CSS using the "background-image" property.
        * @property imageRoot
        * @type String
        */
        imageRoot: Module.IMG_ROOT,

        /**
        * Initializes the custom events for Module which are fired 
        * automatically at appropriate times by the Module class.
        * @method initEvents
        */
        initEvents: function () {

            var SIGNATURE = CustomEvent.LIST;

            /**
            * CustomEvent fired prior to class initalization.
            * @event beforeInitEvent
            * @param {class} classRef class reference of the initializing 
            * class, such as this.beforeInitEvent.fire(Module)
            */
            this.beforeInitEvent = this.createEvent(EVENT_TYPES.BEFORE_INIT);
            this.beforeInitEvent.signature = SIGNATURE;

            /**
            * CustomEvent fired after class initalization.
            * @event initEvent
            * @param {class} classRef class reference of the initializing 
            * class, such as this.beforeInitEvent.fire(Module)
            */  
            this.initEvent = this.createEvent(EVENT_TYPES.INIT);
            this.initEvent.signature = SIGNATURE;

            /**
            * CustomEvent fired when the Module is appended to the DOM
            * @event appendEvent
            */
            this.appendEvent = this.createEvent(EVENT_TYPES.APPEND);
            this.appendEvent.signature = SIGNATURE;

            /**
            * CustomEvent fired before the Module is rendered
            * @event beforeRenderEvent
            */
            this.beforeRenderEvent = this.createEvent(EVENT_TYPES.BEFORE_RENDER);
            this.beforeRenderEvent.signature = SIGNATURE;
        
            /**
            * CustomEvent fired after the Module is rendered
            * @event renderEvent
            */
            this.renderEvent = this.createEvent(EVENT_TYPES.RENDER);
            this.renderEvent.signature = SIGNATURE;
        
            /**
            * CustomEvent fired when the header content of the Module 
            * is modified
            * @event changeHeaderEvent
            * @param {String/HTMLElement} content String/element representing 
            * the new header content
            */
            this.changeHeaderEvent = this.createEvent(EVENT_TYPES.CHANGE_HEADER);
            this.changeHeaderEvent.signature = SIGNATURE;
            
            /**
            * CustomEvent fired when the body content of the Module is modified
            * @event changeBodyEvent
            * @param {String/HTMLElement} content String/element representing 
            * the new body content
            */  
            this.changeBodyEvent = this.createEvent(EVENT_TYPES.CHANGE_BODY);
            this.changeBodyEvent.signature = SIGNATURE;
            
            /**
            * CustomEvent fired when the footer content of the Module 
            * is modified
            * @event changeFooterEvent
            * @param {String/HTMLElement} content String/element representing 
            * the new footer content
            */
            this.changeFooterEvent = this.createEvent(EVENT_TYPES.CHANGE_FOOTER);
            this.changeFooterEvent.signature = SIGNATURE;
        
            /**
            * CustomEvent fired when the content of the Module is modified
            * @event changeContentEvent
            */
            this.changeContentEvent = this.createEvent(EVENT_TYPES.CHANGE_CONTENT);
            this.changeContentEvent.signature = SIGNATURE;

            /**
            * CustomEvent fired when the Module is destroyed
            * @event destroyEvent
            */
            this.destroyEvent = this.createEvent(EVENT_TYPES.DESTROY);
            this.destroyEvent.signature = SIGNATURE;

            /**
            * CustomEvent fired before the Module is shown
            * @event beforeShowEvent
            */
            this.beforeShowEvent = this.createEvent(EVENT_TYPES.BEFORE_SHOW);
            this.beforeShowEvent.signature = SIGNATURE;

            /**
            * CustomEvent fired after the Module is shown
            * @event showEvent
            */
            this.showEvent = this.createEvent(EVENT_TYPES.SHOW);
            this.showEvent.signature = SIGNATURE;

            /**
            * CustomEvent fired before the Module is hidden
            * @event beforeHideEvent
            */
            this.beforeHideEvent = this.createEvent(EVENT_TYPES.BEFORE_HIDE);
            this.beforeHideEvent.signature = SIGNATURE;

            /**
            * CustomEvent fired after the Module is hidden
            * @event hideEvent
            */
            this.hideEvent = this.createEvent(EVENT_TYPES.HIDE);
            this.hideEvent.signature = SIGNATURE;
        }, 

        /**
        * String identifying whether the current platform is windows or mac. This property
        * currently only identifies these 2 platforms, and returns false otherwise. 
        * @property platform
        * @deprecated Use YAHOO.env.ua
        * @type {String|Boolean}
        */
        platform: function () {
            var ua = navigator.userAgent.toLowerCase();

            if (ua.indexOf("windows") != -1 || ua.indexOf("win32") != -1) {
                return "windows";
            } else if (ua.indexOf("macintosh") != -1) {
                return "mac";
            } else {
                return false;
            }
        }(),
        
        /**
        * String representing the user-agent of the browser
        * @deprecated Use YAHOO.env.ua
        * @property browser
        * @type {String|Boolean}
        */
        browser: function () {
            var ua = navigator.userAgent.toLowerCase();
            /*
                 Check Opera first in case of spoof and check Safari before
                 Gecko since Safari's user agent string includes "like Gecko"
            */
            if (ua.indexOf('opera') != -1) { 
                return 'opera';
            } else if (ua.indexOf('msie 7') != -1) {
                return 'ie7';
            } else if (ua.indexOf('msie') != -1) {
                return 'ie';
            } else if (ua.indexOf('safari') != -1) { 
                return 'safari';
            } else if (ua.indexOf('gecko') != -1) {
                return 'gecko';
            } else {
                return false;
            }
        }(),
        
        /**
        * Boolean representing whether or not the current browsing context is 
        * secure (https)
        * @property isSecure
        * @type Boolean
        */
        isSecure: function () {
            if (window.location.href.toLowerCase().indexOf("https") === 0) {
                return true;
            } else {
                return false;
            }
        }(),
        
        /**
        * Initializes the custom events for Module which are fired 
        * automatically at appropriate times by the Module class.
        */
        initDefaultConfig: function () {
            // Add properties //
            /**
            * Specifies whether the Module is visible on the page.
            * @config visible
            * @type Boolean
            * @default true
            */
            this.cfg.addProperty(DEFAULT_CONFIG.VISIBLE.key, {
                handler: this.configVisible, 
                value: DEFAULT_CONFIG.VISIBLE.value, 
                validator: DEFAULT_CONFIG.VISIBLE.validator
            });

            /**
            * <p>
            * Object or array of objects representing the ContainerEffect 
            * classes that are active for animating the container.
            * </p>
            * <p>
            * <strong>NOTE:</strong> Although this configuration 
            * property is introduced at the Module level, an out of the box
            * implementation is not shipped for the Module class so setting
            * the proroperty on the Module class has no effect. The Overlay 
            * class is the first class to provide out of the box ContainerEffect 
            * support.
            * </p>
            * @config effect
            * @type Object
            * @default null
            */
            this.cfg.addProperty(DEFAULT_CONFIG.EFFECT.key, {
                handler: this.configEffect,
                suppressEvent: DEFAULT_CONFIG.EFFECT.suppressEvent, 
                supercedes: DEFAULT_CONFIG.EFFECT.supercedes
            });

            /**
            * Specifies whether to create a special proxy iframe to monitor 
            * for user font resizing in the document
            * @config monitorresize
            * @type Boolean
            * @default true
            */
            this.cfg.addProperty(DEFAULT_CONFIG.MONITOR_RESIZE.key, {
                handler: this.configMonitorResize,
                value: DEFAULT_CONFIG.MONITOR_RESIZE.value
            });

            /**
            * Specifies if the module should be rendered as the first child 
            * of document.body or appended as the last child when render is called
            * with document.body as the "appendToNode".
            * <p>
            * Appending to the body while the DOM is still being constructed can 
            * lead to Operation Aborted errors in IE hence this flag is set to 
            * false by default.
            * </p>
            * 
            * @config appendtodocumentbody
            * @type Boolean
            * @default false
            */
            this.cfg.addProperty(DEFAULT_CONFIG.APPEND_TO_DOCUMENT_BODY.key, {
                value: DEFAULT_CONFIG.APPEND_TO_DOCUMENT_BODY.value
            });
        },

        /**
        * The Module class's initialization method, which is executed for
        * Module and all of its subclasses. This method is automatically 
        * called by the constructor, and  sets up all DOM references for 
        * pre-existing markup, and creates required markup if it is not 
        * already present.
        * <p>
        * If the element passed in does not have an id, one will be generated
        * for it.
        * </p>
        * @method init
        * @param {String} el The element ID representing the Module <em>OR</em>
        * @param {HTMLElement} el The element representing the Module
        * @param {Object} userConfig The configuration Object literal 
        * containing the configuration that should be set for this module. 
        * See configuration documentation for more details.
        */
        init: function (el, userConfig) {

            var elId, child;

            this.initEvents();
            this.beforeInitEvent.fire(Module);

            /**
            * The Module's Config object used for monitoring 
            * configuration properties.
            * @property cfg
            * @type YAHOO.util.Config
            */
            this.cfg = new Config(this);

            if (this.isSecure) {
                this.imageRoot = Module.IMG_ROOT_SSL;
            }

            if (typeof el == "string") {
                elId = el;
                el = document.getElementById(el);
                if (! el) {
                    el = (createModuleTemplate()).cloneNode(false);
                    el.id = elId;
                }
            }

            this.id = Dom.generateId(el);
            this.element = el;

            child = this.element.firstChild;

            if (child) {
                var fndHd = false, fndBd = false, fndFt = false;
                do {
                    // We're looking for elements
                    if (1 == child.nodeType) {
                        if (!fndHd && Dom.hasClass(child, Module.CSS_HEADER)) {
                            this.header = child;
                            fndHd = true;
                        } else if (!fndBd && Dom.hasClass(child, Module.CSS_BODY)) {
                            this.body = child;
                            fndBd = true;
                        } else if (!fndFt && Dom.hasClass(child, Module.CSS_FOOTER)){
                            this.footer = child;
                            fndFt = true;
                        }
                    }
                } while ((child = child.nextSibling));
            }

            this.initDefaultConfig();

            Dom.addClass(this.element, Module.CSS_MODULE);

            if (userConfig) {
                this.cfg.applyConfig(userConfig, true);
            }

            /*
                Subscribe to the fireQueue() method of Config so that any 
                queued configuration changes are excecuted upon render of 
                the Module
            */ 

            if (!Config.alreadySubscribed(this.renderEvent, this.cfg.fireQueue, this.cfg)) {
                this.renderEvent.subscribe(this.cfg.fireQueue, this.cfg, true);
            }

            this.initEvent.fire(Module);
        },

        /**
        * Initialize an empty IFRAME that is placed out of the visible area 
        * that can be used to detect text resize.
        * @method initResizeMonitor
        */
        initResizeMonitor: function () {

            var isGeckoWin = (UA.gecko && this.platform == "windows");
            if (isGeckoWin) {
                // Help prevent spinning loading icon which 
                // started with FireFox 2.0.0.8/Win
                var self = this;
                setTimeout(function(){self._initResizeMonitor();}, 0);
            } else {
                this._initResizeMonitor();
            }
        },

        /**
         * Create and initialize the text resize monitoring iframe.
         * 
         * @protected
         * @method _initResizeMonitor
         */
        _initResizeMonitor : function() {

            var oDoc, 
                oIFrame, 
                sHTML;

            function fireTextResize() {
                Module.textResizeEvent.fire();
            }

            if (!UA.opera) {
                oIFrame = Dom.get("_yuiResizeMonitor");

                var supportsCWResize = this._supportsCWResize();

                if (!oIFrame) {
                    oIFrame = document.createElement("iframe");

                    if (this.isSecure && Module.RESIZE_MONITOR_SECURE_URL && UA.ie) {
                        oIFrame.src = Module.RESIZE_MONITOR_SECURE_URL;
                    }

                    if (!supportsCWResize) {
                        // Can't monitor on contentWindow, so fire from inside iframe
                        sHTML = ["<html><head><script ",
                                 "type=\"text/javascript\">",
                                 "window.onresize=function(){window.parent.",
                                 "YAHOO.widget.Module.textResizeEvent.",
                                 "fire();};<",
                                 "\/script></head>",
                                 "<body></body></html>"].join('');

                        oIFrame.src = "data:text/html;charset=utf-8," + encodeURIComponent(sHTML);
                    }

                    oIFrame.id = "_yuiResizeMonitor";
                    oIFrame.title = "Text Resize Monitor";
                    oIFrame.tabIndex = -1;
                    oIFrame.setAttribute("role", "presentation");

                    /*
                        Need to set "position" property before inserting the 
                        iframe into the document or Safari's status bar will 
                        forever indicate the iframe is loading 
                        (See YUILibrary bug #1723064)
                    */
                    oIFrame.style.position = "absolute";
                    oIFrame.style.visibility = "hidden";

                    var db = document.body,
                        fc = db.firstChild;
                    if (fc) {
                        db.insertBefore(oIFrame, fc);
                    } else {
                        db.appendChild(oIFrame);
                    }

                    // Setting the background color fixes an issue with IE6/IE7, where
                    // elements in the DOM, with -ve margin-top which positioned them 
                    // offscreen (so they would be overlapped by the iframe and its -ve top
                    // setting), would have their -ve margin-top ignored, when the iframe 
                    // was added.
                    oIFrame.style.backgroundColor = "transparent";

                    oIFrame.style.borderWidth = "0";
                    oIFrame.style.width = "2em";
                    oIFrame.style.height = "2em";
                    oIFrame.style.left = "0";
                    oIFrame.style.top = (-1 * (oIFrame.offsetHeight + Module.RESIZE_MONITOR_BUFFER)) + "px";
                    oIFrame.style.visibility = "visible";

                    /*
                       Don't open/close the document for Gecko like we used to, since it
                       leads to duplicate cookies. (See YUILibrary bug #1721755)
                    */
                    if (UA.webkit) {
                        oDoc = oIFrame.contentWindow.document;
                        oDoc.open();
                        oDoc.close();
                    }
                }

                if (oIFrame && oIFrame.contentWindow) {
                    Module.textResizeEvent.subscribe(this.onDomResize, this, true);

                    if (!Module.textResizeInitialized) {
                        if (supportsCWResize) {
                            if (!Event.on(oIFrame.contentWindow, "resize", fireTextResize)) {
                                /*
                                     This will fail in IE if document.domain has 
                                     changed, so we must change the listener to 
                                     use the oIFrame element instead
                                */
                                Event.on(oIFrame, "resize", fireTextResize);
                            }
                        }
                        Module.textResizeInitialized = true;
                    }
                    this.resizeMonitor = oIFrame;
                }
            }
        },

        /**
         * Text resize monitor helper method.
         * Determines if the browser supports resize events on iframe content windows.
         * 
         * @private
         * @method _supportsCWResize
         */
        _supportsCWResize : function() {
            /*
                Gecko 1.8.0 (FF1.5), 1.8.1.0-5 (FF2) won't fire resize on contentWindow.
                Gecko 1.8.1.6+ (FF2.0.0.6+) and all other browsers will fire resize on contentWindow.

                We don't want to start sniffing for patch versions, so fire textResize the same
                way on all FF2 flavors
             */
            var bSupported = true;
            if (UA.gecko && UA.gecko <= 1.8) {
                bSupported = false;
            }
            return bSupported;
        },

        /**
        * Event handler fired when the resize monitor element is resized.
        * @method onDomResize
        * @param {DOMEvent} e The DOM resize event
        * @param {Object} obj The scope object passed to the handler
        */
        onDomResize: function (e, obj) {

            var nTop = -1 * (this.resizeMonitor.offsetHeight + Module.RESIZE_MONITOR_BUFFER);

            this.resizeMonitor.style.top = nTop + "px";
            this.resizeMonitor.style.left = "0";
        },

        /**
        * Sets the Module's header content to the markup specified, or appends 
        * the passed element to the header. 
        * 
        * If no header is present, one will 
        * be automatically created. An empty string can be passed to the method
        * to clear the contents of the header.
        * 
        * @method setHeader
        * @param {HTML} headerContent The markup used to set the header content.
        * As a convenience, non HTMLElement objects can also be passed into 
        * the method, and will be treated as strings, with the header innerHTML
        * set to their default toString implementations. 
        * 
        * <p>NOTE: Markup passed into this method is added to the DOM as HTML, and should be escaped by the implementor if coming from an external source.</p>
        * 
        * <em>OR</em>
        * @param {HTMLElement} headerContent The HTMLElement to append to 
        * <em>OR</em>
        * @param {DocumentFragment} headerContent The document fragment 
        * containing elements which are to be added to the header
        */
        setHeader: function (headerContent) {
            var oHeader = this.header || (this.header = createHeader());

            if (headerContent.nodeName) {
                oHeader.innerHTML = "";
                oHeader.appendChild(headerContent);
            } else {
                oHeader.innerHTML = headerContent;
            }

            if (this._rendered) {
                this._renderHeader();
            }

            this.changeHeaderEvent.fire(headerContent);
            this.changeContentEvent.fire();

        },

        /**
        * Appends the passed element to the header. If no header is present, 
        * one will be automatically created.
        * @method appendToHeader
        * @param {HTMLElement | DocumentFragment} element The element to 
        * append to the header. In the case of a document fragment, the
        * children of the fragment will be appended to the header.
        */
        appendToHeader: function (element) {
            var oHeader = this.header || (this.header = createHeader());

            oHeader.appendChild(element);

            this.changeHeaderEvent.fire(element);
            this.changeContentEvent.fire();

        },

        /**
        * Sets the Module's body content to the HTML specified. 
        * 
        * If no body is present, one will be automatically created. 
        * 
        * An empty string can be passed to the method to clear the contents of the body.
        * @method setBody
        * @param {HTML} bodyContent The HTML used to set the body content 
        * As a convenience, non HTMLElement objects can also be passed into 
        * the method, and will be treated as strings, with the body innerHTML
        * set to their default toString implementations.
        * 
        * <p>NOTE: Markup passed into this method is added to the DOM as HTML, and should be escaped by the implementor if coming from an external source.</p>
        * 
        * <em>OR</em>
        * @param {HTMLElement} bodyContent The HTMLElement to add as the first and only
        * child of the body element.
        * <em>OR</em>
        * @param {DocumentFragment} bodyContent The document fragment 
        * containing elements which are to be added to the body
        */
        setBody: function (bodyContent) {
            var oBody = this.body || (this.body = createBody());

            if (bodyContent.nodeName) {
                oBody.innerHTML = "";
                oBody.appendChild(bodyContent);
            } else {
                oBody.innerHTML = bodyContent;
            }

            if (this._rendered) {
                this._renderBody();
            }

            this.changeBodyEvent.fire(bodyContent);
            this.changeContentEvent.fire();
        },

        /**
        * Appends the passed element to the body. If no body is present, one 
        * will be automatically created.
        * @method appendToBody
        * @param {HTMLElement | DocumentFragment} element The element to 
        * append to the body. In the case of a document fragment, the
        * children of the fragment will be appended to the body.
        * 
        */
        appendToBody: function (element) {
            var oBody = this.body || (this.body = createBody());
        
            oBody.appendChild(element);

            this.changeBodyEvent.fire(element);
            this.changeContentEvent.fire();

        },

        /**
        * Sets the Module's footer content to the HTML specified, or appends 
        * the passed element to the footer. If no footer is present, one will 
        * be automatically created. An empty string can be passed to the method
        * to clear the contents of the footer.
        * @method setFooter
        * @param {HTML} footerContent The HTML used to set the footer 
        * As a convenience, non HTMLElement objects can also be passed into 
        * the method, and will be treated as strings, with the footer innerHTML
        * set to their default toString implementations.
        * 
        * <p>NOTE: Markup passed into this method is added to the DOM as HTML, and should be escaped by the implementor if coming from an external source.</p>
        * 
        * <em>OR</em>
        * @param {HTMLElement} footerContent The HTMLElement to append to 
        * the footer
        * <em>OR</em>
        * @param {DocumentFragment} footerContent The document fragment containing 
        * elements which are to be added to the footer
        */
        setFooter: function (footerContent) {

            var oFooter = this.footer || (this.footer = createFooter());

            if (footerContent.nodeName) {
                oFooter.innerHTML = "";
                oFooter.appendChild(footerContent);
            } else {
                oFooter.innerHTML = footerContent;
            }

            if (this._rendered) {
                this._renderFooter();
            }

            this.changeFooterEvent.fire(footerContent);
            this.changeContentEvent.fire();
        },

        /**
        * Appends the passed element to the footer. If no footer is present, 
        * one will be automatically created.
        * @method appendToFooter
        * @param {HTMLElement | DocumentFragment} element The element to 
        * append to the footer. In the case of a document fragment, the
        * children of the fragment will be appended to the footer
        */
        appendToFooter: function (element) {

            var oFooter = this.footer || (this.footer = createFooter());

            oFooter.appendChild(element);

            this.changeFooterEvent.fire(element);
            this.changeContentEvent.fire();

        },

        /**
        * Renders the Module by inserting the elements that are not already 
        * in the main Module into their correct places. Optionally appends 
        * the Module to the specified node prior to the render's execution. 
        * <p>
        * For Modules without existing markup, the appendToNode argument 
        * is REQUIRED. If this argument is ommitted and the current element is 
        * not present in the document, the function will return false, 
        * indicating that the render was a failure.
        * </p>
        * <p>
        * NOTE: As of 2.3.1, if the appendToNode is the document's body element
        * then the module is rendered as the first child of the body element, 
        * and not appended to it, to avoid Operation Aborted errors in IE when 
        * rendering the module before window's load event is fired. You can 
        * use the appendtodocumentbody configuration property to change this 
        * to append to document.body if required.
        * </p>
        * @method render
        * @param {String} appendToNode The element id to which the Module 
        * should be appended to prior to rendering <em>OR</em>
        * @param {HTMLElement} appendToNode The element to which the Module 
        * should be appended to prior to rendering
        * @param {HTMLElement} moduleElement OPTIONAL. The element that 
        * represents the actual Standard Module container.
        * @return {Boolean} Success or failure of the render
        */
        render: function (appendToNode, moduleElement) {

            var me = this;

            function appendTo(parentNode) {
                if (typeof parentNode == "string") {
                    parentNode = document.getElementById(parentNode);
                }

                if (parentNode) {
                    me._addToParent(parentNode, me.element);
                    me.appendEvent.fire();
                }
            }

            this.beforeRenderEvent.fire();

            if (! moduleElement) {
                moduleElement = this.element;
            }

            if (appendToNode) {
                appendTo(appendToNode);
            } else { 
                // No node was passed in. If the element is not already in the Dom, this fails
                if (! Dom.inDocument(this.element)) {
                    return false;
                }
            }

            this._renderHeader(moduleElement);
            this._renderBody(moduleElement);
            this._renderFooter(moduleElement);

            this._rendered = true;

            this.renderEvent.fire();
            return true;
        },

        /**
         * Renders the currently set header into it's proper position under the 
         * module element. If the module element is not provided, "this.element" 
         * is used.
         * 
         * @method _renderHeader
         * @protected
         * @param {HTMLElement} moduleElement Optional. A reference to the module element
         */
        _renderHeader: function(moduleElement){
            moduleElement = moduleElement || this.element;

            // Need to get everything into the DOM if it isn't already
            if (this.header && !Dom.inDocument(this.header)) {
                // There is a header, but it's not in the DOM yet. Need to add it.
                var firstChild = moduleElement.firstChild;
                if (firstChild) {
                    moduleElement.insertBefore(this.header, firstChild);
                } else {
                    moduleElement.appendChild(this.header);
                }
            }
        },

        /**
         * Renders the currently set body into it's proper position under the 
         * module element. If the module element is not provided, "this.element" 
         * is used.
         * 
         * @method _renderBody
         * @protected
         * @param {HTMLElement} moduleElement Optional. A reference to the module element.
         */
        _renderBody: function(moduleElement){
            moduleElement = moduleElement || this.element;

            if (this.body && !Dom.inDocument(this.body)) {
                // There is a body, but it's not in the DOM yet. Need to add it.
                if (this.footer && Dom.isAncestor(moduleElement, this.footer)) {
                    moduleElement.insertBefore(this.body, this.footer);
                } else {
                    moduleElement.appendChild(this.body);
                }
            }
        },

        /**
         * Renders the currently set footer into it's proper position under the 
         * module element. If the module element is not provided, "this.element" 
         * is used.
         * 
         * @method _renderFooter
         * @protected
         * @param {HTMLElement} moduleElement Optional. A reference to the module element
         */
        _renderFooter: function(moduleElement){
            moduleElement = moduleElement || this.element;

            if (this.footer && !Dom.inDocument(this.footer)) {
                // There is a footer, but it's not in the DOM yet. Need to add it.
                moduleElement.appendChild(this.footer);
            }
        },

        /**
        * Removes the Module element from the DOM, sets all child elements to null, and purges the bounding element of event listeners.
        * @method destroy
        * @param {boolean} shallowPurge If true, only the parent element's DOM event listeners are purged. If false, or not provided, all children are also purged of DOM event listeners. 
        * NOTE: The flag is a "shallowPurge" flag, as opposed to what may be a more intuitive "purgeChildren" flag to maintain backwards compatibility with behavior prior to 2.9.0.
        */
        destroy: function (shallowPurge) {

            var parent,
                purgeChildren = !(shallowPurge);

            if (this.element) {
                Event.purgeElement(this.element, purgeChildren);
                parent = this.element.parentNode;
            }

            if (parent) {
                parent.removeChild(this.element);
            }
        
            this.element = null;
            this.header = null;
            this.body = null;
            this.footer = null;

            Module.textResizeEvent.unsubscribe(this.onDomResize, this);

            this.cfg.destroy();
            this.cfg = null;

            this.destroyEvent.fire();
        },

        /**
        * Shows the Module element by setting the visible configuration 
        * property to true. Also fires two events: beforeShowEvent prior to 
        * the visibility change, and showEvent after.
        * @method show
        */
        show: function () {
            this.cfg.setProperty("visible", true);
        },

        /**
        * Hides the Module element by setting the visible configuration 
        * property to false. Also fires two events: beforeHideEvent prior to 
        * the visibility change, and hideEvent after.
        * @method hide
        */
        hide: function () {
            this.cfg.setProperty("visible", false);
        },
        
        // BUILT-IN EVENT HANDLERS FOR MODULE //
        /**
        * Default event handler for changing the visibility property of a 
        * Module. By default, this is achieved by switching the "display" style 
        * between "block" and "none".
        * This method is responsible for firing showEvent and hideEvent.
        * @param {String} type The CustomEvent type (usually the property name)
        * @param {Object[]} args The CustomEvent arguments. For configuration 
        * handlers, args[0] will equal the newly applied value for the property.
        * @param {Object} obj The scope object. For configuration handlers, 
        * this will usually equal the owner.
        * @method configVisible
        */
        configVisible: function (type, args, obj) {
            var visible = args[0];
            if (visible) {
                if(this.beforeShowEvent.fire()) {
                    Dom.setStyle(this.element, "display", "block");
                    this.showEvent.fire();
                }
            } else {
                if (this.beforeHideEvent.fire()) {
                    Dom.setStyle(this.element, "display", "none");
                    this.hideEvent.fire();
                }
            }
        },

        /**
        * Default event handler for the "effect" configuration property
        * @param {String} type The CustomEvent type (usually the property name)
        * @param {Object[]} args The CustomEvent arguments. For configuration 
        * handlers, args[0] will equal the newly applied value for the property.
        * @param {Object} obj The scope object. For configuration handlers, 
        * this will usually equal the owner.
        * @method configEffect
        */
        configEffect: function (type, args, obj) {
            this._cachedEffects = (this.cacheEffects) ? this._createEffects(args[0]) : null;
        },

        /**
         * If true, ContainerEffects (and Anim instances) are cached when "effect" is set, and reused. 
         * If false, new instances are created each time the container is hidden or shown, as was the 
         * behavior prior to 2.9.0. 
         *
         * @property cacheEffects
         * @since 2.9.0
         * @default true
         * @type boolean
         */
        cacheEffects : true,

        /**
         * Creates an array of ContainerEffect instances from the provided configs
         * 
         * @method _createEffects
         * @param {Array|Object} effectCfg An effect configuration or array of effect configurations
         * @return {Array} An array of ContainerEffect instances.
         * @protected
         */
        _createEffects: function(effectCfg) {
            var effectInstances = null,
                n, 
                i,
                eff;

            if (effectCfg) {
                if (effectCfg instanceof Array) {
                    effectInstances = [];
                    n = effectCfg.length;
                    for (i = 0; i < n; i++) {
                        eff = effectCfg[i];
                        if (eff.effect) {
                            effectInstances[effectInstances.length] = eff.effect(this, eff.duration);
                        }
                    }
                } else if (effectCfg.effect) {
                    effectInstances = [effectCfg.effect(this, effectCfg.duration)];
                }
            }

            return effectInstances;
        },

        /**
        * Default event handler for the "monitorresize" configuration property
        * @param {String} type The CustomEvent type (usually the property name)
        * @param {Object[]} args The CustomEvent arguments. For configuration 
        * handlers, args[0] will equal the newly applied value for the property.
        * @param {Object} obj The scope object. For configuration handlers, 
        * this will usually equal the owner.
        * @method configMonitorResize
        */
        configMonitorResize: function (type, args, obj) {
            var monitor = args[0];
            if (monitor) {
                this.initResizeMonitor();
            } else {
                Module.textResizeEvent.unsubscribe(this.onDomResize, this, true);
                this.resizeMonitor = null;
            }
        },

        /**
         * This method is a protected helper, used when constructing the DOM structure for the module 
         * to account for situations which may cause Operation Aborted errors in IE. It should not 
         * be used for general DOM construction.
         * <p>
         * If the parentNode is not document.body, the element is appended as the last element.
         * </p>
         * <p>
         * If the parentNode is document.body the element is added as the first child to help
         * prevent Operation Aborted errors in IE.
         * </p>
         *
         * @param {parentNode} The HTML element to which the element will be added
         * @param {element} The HTML element to be added to parentNode's children
         * @method _addToParent
         * @protected
         */
        _addToParent: function(parentNode, element) {
            if (!this.cfg.getProperty("appendtodocumentbody") && parentNode === document.body && parentNode.firstChild) {
                parentNode.insertBefore(element, parentNode.firstChild);
            } else {
                parentNode.appendChild(element);
            }
        },

        /**
        * Returns a String representation of the Object.
        * @method toString
        * @return {String} The string representation of the Module
        */
        toString: function () {
            return "Module " + this.id;
        }
    };

    YAHOO.lang.augmentProto(Module, YAHOO.util.EventProvider);

}());
(function () {

    /**
    * Overlay is a Module that is absolutely positioned above the page flow. It 
    * has convenience methods for positioning and sizing, as well as options for 
    * controlling zIndex and constraining the Overlay's position to the current 
    * visible viewport. Overlay also contains a dynamicly generated IFRAME which 
    * is placed beneath it for Internet Explorer 6 and 5.x so that it will be 
    * properly rendered above SELECT elements.
    * @namespace YAHOO.widget
    * @class Overlay
    * @extends YAHOO.widget.Module
    * @param {String} el The element ID representing the Overlay <em>OR</em>
    * @param {HTMLElement} el The element representing the Overlay
    * @param {Object} userConfig The configuration object literal containing 
    * the configuration that should be set for this Overlay. See configuration 
    * documentation for more details.
    * @constructor
    */
    YAHOO.widget.Overlay = function (el, userConfig) {
        YAHOO.widget.Overlay.superclass.constructor.call(this, el, userConfig);
    };

    var Lang = YAHOO.lang,
        CustomEvent = YAHOO.util.CustomEvent,
        Module = YAHOO.widget.Module,
        Event = YAHOO.util.Event,
        Dom = YAHOO.util.Dom,
        Config = YAHOO.util.Config,
        UA = YAHOO.env.ua,
        Overlay = YAHOO.widget.Overlay,

        _SUBSCRIBE = "subscribe",
        _UNSUBSCRIBE = "unsubscribe",
        _CONTAINED = "contained",

        m_oIFrameTemplate,

        /**
        * Constant representing the name of the Overlay's events
        * @property EVENT_TYPES
        * @private
        * @final
        * @type Object
        */
        EVENT_TYPES = {
            "BEFORE_MOVE": "beforeMove",
            "MOVE": "move"
        },

        /**
        * Constant representing the Overlay's configuration properties
        * @property DEFAULT_CONFIG
        * @private
        * @final
        * @type Object
        */
        DEFAULT_CONFIG = {

            "X": { 
                key: "x", 
                validator: Lang.isNumber, 
                suppressEvent: true, 
                supercedes: ["iframe"]
            },

            "Y": { 
                key: "y", 
                validator: Lang.isNumber, 
                suppressEvent: true, 
                supercedes: ["iframe"]
            },

            "XY": { 
                key: "xy", 
                suppressEvent: true, 
                supercedes: ["iframe"] 
            },

            "CONTEXT": { 
                key: "context", 
                suppressEvent: true, 
                supercedes: ["iframe"] 
            },

            "FIXED_CENTER": { 
                key: "fixedcenter", 
                value: false, 
                supercedes: ["iframe", "visible"] 
            },

            "WIDTH": { 
                key: "width",
                suppressEvent: true,
                supercedes: ["context", "fixedcenter", "iframe"]
            }, 

            "HEIGHT": { 
                key: "height", 
                suppressEvent: true, 
                supercedes: ["context", "fixedcenter", "iframe"] 
            },

            "AUTO_FILL_HEIGHT" : {
                key: "autofillheight",
                supercedes: ["height"],
                value:"body"
            },

            "ZINDEX": { 
                key: "zindex", 
                value: null 
            },

            "CONSTRAIN_TO_VIEWPORT": { 
                key: "constraintoviewport", 
                value: false, 
                validator: Lang.isBoolean, 
                supercedes: ["iframe", "x", "y", "xy"]
            }, 

            "IFRAME": { 
                key: "iframe", 
                value: (UA.ie == 6 ? true : false), 
                validator: Lang.isBoolean, 
                supercedes: ["zindex"] 
            },

            "PREVENT_CONTEXT_OVERLAP": {
                key: "preventcontextoverlap",
                value: false,
                validator: Lang.isBoolean,  
                supercedes: ["constraintoviewport"]
            }

        };

    /**
    * The URL that will be placed in the iframe
    * @property YAHOO.widget.Overlay.IFRAME_SRC
    * @static
    * @final
    * @type String
    */
    Overlay.IFRAME_SRC = "javascript:false;";

    /**
    * Number representing how much the iframe shim should be offset from each 
    * side of an Overlay instance, in pixels.
    * @property YAHOO.widget.Overlay.IFRAME_SRC
    * @default 3
    * @static
    * @final
    * @type Number
    */
    Overlay.IFRAME_OFFSET = 3;

    /**
    * Number representing the minimum distance an Overlay instance should be 
    * positioned relative to the boundaries of the browser's viewport, in pixels.
    * @property YAHOO.widget.Overlay.VIEWPORT_OFFSET
    * @default 10
    * @static
    * @final
    * @type Number
    */
    Overlay.VIEWPORT_OFFSET = 10;

    /**
    * Constant representing the top left corner of an element, used for 
    * configuring the context element alignment
    * @property YAHOO.widget.Overlay.TOP_LEFT
    * @static
    * @final
    * @type String
    */
    Overlay.TOP_LEFT = "tl";

    /**
    * Constant representing the top right corner of an element, used for 
    * configuring the context element alignment
    * @property YAHOO.widget.Overlay.TOP_RIGHT
    * @static
    * @final
    * @type String
    */
    Overlay.TOP_RIGHT = "tr";

    /**
    * Constant representing the top bottom left corner of an element, used for 
    * configuring the context element alignment
    * @property YAHOO.widget.Overlay.BOTTOM_LEFT
    * @static
    * @final
    * @type String
    */
    Overlay.BOTTOM_LEFT = "bl";

    /**
    * Constant representing the bottom right corner of an element, used for 
    * configuring the context element alignment
    * @property YAHOO.widget.Overlay.BOTTOM_RIGHT
    * @static
    * @final
    * @type String
    */
    Overlay.BOTTOM_RIGHT = "br";

    Overlay.PREVENT_OVERLAP_X = {
        "tltr": true,
        "blbr": true,
        "brbl": true,
        "trtl": true
    };
            
    Overlay.PREVENT_OVERLAP_Y = {
        "trbr": true,
        "tlbl": true,
        "bltl": true,
        "brtr": true
    };

    /**
    * Constant representing the default CSS class used for an Overlay
    * @property YAHOO.widget.Overlay.CSS_OVERLAY
    * @static
    * @final
    * @type String
    */
    Overlay.CSS_OVERLAY = "yui-overlay";

    /**
    * Constant representing the default hidden CSS class used for an Overlay. This class is 
    * applied to the overlay's outer DIV whenever it's hidden.
    *
    * @property YAHOO.widget.Overlay.CSS_HIDDEN
    * @static
    * @final
    * @type String
    */
    Overlay.CSS_HIDDEN = "yui-overlay-hidden";

    /**
    * Constant representing the default CSS class used for an Overlay iframe shim.
    * 
    * @property YAHOO.widget.Overlay.CSS_IFRAME
    * @static
    * @final
    * @type String
    */
    Overlay.CSS_IFRAME = "yui-overlay-iframe";

    /**
     * Constant representing the names of the standard module elements
     * used in the overlay.
     * @property YAHOO.widget.Overlay.STD_MOD_RE
     * @static
     * @final
     * @type RegExp
     */
    Overlay.STD_MOD_RE = /^\s*?(body|footer|header)\s*?$/i;

    /**
    * A singleton CustomEvent used for reacting to the DOM event for 
    * window scroll
    * @event YAHOO.widget.Overlay.windowScrollEvent
    */
    Overlay.windowScrollEvent = new CustomEvent("windowScroll");

    /**
    * A singleton CustomEvent used for reacting to the DOM event for
    * window resize
    * @event YAHOO.widget.Overlay.windowResizeEvent
    */
    Overlay.windowResizeEvent = new CustomEvent("windowResize");

    /**
    * The DOM event handler used to fire the CustomEvent for window scroll
    * @method YAHOO.widget.Overlay.windowScrollHandler
    * @static
    * @param {DOMEvent} e The DOM scroll event
    */
    Overlay.windowScrollHandler = function (e) {
        var t = Event.getTarget(e);

        // - Webkit (Safari 2/3) and Opera 9.2x bubble scroll events from elements to window
        // - FF2/3 and IE6/7, Opera 9.5x don't bubble scroll events from elements to window
        // - IE doesn't recognize scroll registered on the document.
        //
        // Also, when document view is scrolled, IE doesn't provide a target, 
        // rest of the browsers set target to window.document, apart from opera 
        // which sets target to window.
        if (!t || t === window || t === window.document) {
            if (UA.ie) {

                if (! window.scrollEnd) {
                    window.scrollEnd = -1;
                }

                clearTimeout(window.scrollEnd);
        
                window.scrollEnd = setTimeout(function () { 
                    Overlay.windowScrollEvent.fire(); 
                }, 1);
        
            } else {
                Overlay.windowScrollEvent.fire();
            }
        }
    };

    /**
    * The DOM event handler used to fire the CustomEvent for window resize
    * @method YAHOO.widget.Overlay.windowResizeHandler
    * @static
    * @param {DOMEvent} e The DOM resize event
    */
    Overlay.windowResizeHandler = function (e) {

        if (UA.ie) {
            if (! window.resizeEnd) {
                window.resizeEnd = -1;
            }

            clearTimeout(window.resizeEnd);

            window.resizeEnd = setTimeout(function () {
                Overlay.windowResizeEvent.fire(); 
            }, 100);
        } else {
            Overlay.windowResizeEvent.fire();
        }
    };

    /**
    * A boolean that indicated whether the window resize and scroll events have 
    * already been subscribed to.
    * @property YAHOO.widget.Overlay._initialized
    * @private
    * @type Boolean
    */
    Overlay._initialized = null;

    if (Overlay._initialized === null) {
        Event.on(window, "scroll", Overlay.windowScrollHandler);
        Event.on(window, "resize", Overlay.windowResizeHandler);
        Overlay._initialized = true;
    }

    /**
     * Internal map of special event types, which are provided
     * by the instance. It maps the event type to the custom event 
     * instance. Contains entries for the "windowScroll", "windowResize" and
     * "textResize" static container events.
     *
     * @property YAHOO.widget.Overlay._TRIGGER_MAP
     * @type Object
     * @static
     * @private
     */
    Overlay._TRIGGER_MAP = {
        "windowScroll" : Overlay.windowScrollEvent,
        "windowResize" : Overlay.windowResizeEvent,
        "textResize"   : Module.textResizeEvent
    };

    YAHOO.extend(Overlay, Module, {

        /**
         * <p>
         * Array of default event types which will trigger
         * context alignment for the Overlay class.
         * </p>
         * <p>The array is empty by default for Overlay,
         * but maybe populated in future releases, so classes extending
         * Overlay which need to define their own set of CONTEXT_TRIGGERS
         * should concatenate their super class's prototype.CONTEXT_TRIGGERS 
         * value with their own array of values.
         * </p>
         * <p>
         * E.g.:
         * <code>CustomOverlay.prototype.CONTEXT_TRIGGERS = YAHOO.widget.Overlay.prototype.CONTEXT_TRIGGERS.concat(["windowScroll"]);</code>
         * </p>
         * 
         * @property CONTEXT_TRIGGERS
         * @type Array
         * @final
         */
        CONTEXT_TRIGGERS : [],

        /**
        * The Overlay initialization method, which is executed for Overlay and  
        * all of its subclasses. This method is automatically called by the 
        * constructor, and  sets up all DOM references for pre-existing markup, 
        * and creates required markup if it is not already present.
        * @method init
        * @param {String} el The element ID representing the Overlay <em>OR</em>
        * @param {HTMLElement} el The element representing the Overlay
        * @param {Object} userConfig The configuration object literal 
        * containing the configuration that should be set for this Overlay. 
        * See configuration documentation for more details.
        */
        init: function (el, userConfig) {

            /*
                 Note that we don't pass the user config in here yet because we
                 only want it executed once, at the lowest subclass level
            */

            Overlay.superclass.init.call(this, el/*, userConfig*/);

            this.beforeInitEvent.fire(Overlay);

            Dom.addClass(this.element, Overlay.CSS_OVERLAY);

            if (userConfig) {
                this.cfg.applyConfig(userConfig, true);
            }

            if (this.platform == "mac" && UA.gecko) {

                if (! Config.alreadySubscribed(this.showEvent,
                    this.showMacGeckoScrollbars, this)) {

                    this.showEvent.subscribe(this.showMacGeckoScrollbars, 
                        this, true);

                }

                if (! Config.alreadySubscribed(this.hideEvent, 
                    this.hideMacGeckoScrollbars, this)) {

                    this.hideEvent.subscribe(this.hideMacGeckoScrollbars, 
                        this, true);

                }
            }

            this.initEvent.fire(Overlay);
        },
        
        /**
        * Initializes the custom events for Overlay which are fired  
        * automatically at appropriate times by the Overlay class.
        * @method initEvents
        */
        initEvents: function () {

            Overlay.superclass.initEvents.call(this);

            var SIGNATURE = CustomEvent.LIST;

            /**
            * CustomEvent fired before the Overlay is moved.
            * @event beforeMoveEvent
            * @param {Number} x x coordinate
            * @param {Number} y y coordinate
            */
            this.beforeMoveEvent = this.createEvent(EVENT_TYPES.BEFORE_MOVE);
            this.beforeMoveEvent.signature = SIGNATURE;

            /**
            * CustomEvent fired after the Overlay is moved.
            * @event moveEvent
            * @param {Number} x x coordinate
            * @param {Number} y y coordinate
            */
            this.moveEvent = this.createEvent(EVENT_TYPES.MOVE);
            this.moveEvent.signature = SIGNATURE;

        },
        
        /**
        * Initializes the class's configurable properties which can be changed 
        * using the Overlay's Config object (cfg).
        * @method initDefaultConfig
        */
        initDefaultConfig: function () {
    
            Overlay.superclass.initDefaultConfig.call(this);

            var cfg = this.cfg;

            // Add overlay config properties //
            
            /**
            * The absolute x-coordinate position of the Overlay
            * @config x
            * @type Number
            * @default null
            */
            cfg.addProperty(DEFAULT_CONFIG.X.key, { 
    
                handler: this.configX, 
                validator: DEFAULT_CONFIG.X.validator, 
                suppressEvent: DEFAULT_CONFIG.X.suppressEvent, 
                supercedes: DEFAULT_CONFIG.X.supercedes
    
            });

            /**
            * The absolute y-coordinate position of the Overlay
            * @config y
            * @type Number
            * @default null
            */
            cfg.addProperty(DEFAULT_CONFIG.Y.key, {

                handler: this.configY, 
                validator: DEFAULT_CONFIG.Y.validator, 
                suppressEvent: DEFAULT_CONFIG.Y.suppressEvent, 
                supercedes: DEFAULT_CONFIG.Y.supercedes

            });

            /**
            * An array with the absolute x and y positions of the Overlay
            * @config xy
            * @type Number[]
            * @default null
            */
            cfg.addProperty(DEFAULT_CONFIG.XY.key, {
                handler: this.configXY, 
                suppressEvent: DEFAULT_CONFIG.XY.suppressEvent, 
                supercedes: DEFAULT_CONFIG.XY.supercedes
            });

            /**
            * <p>
            * The array of context arguments for context-sensitive positioning. 
            * </p>
            *
            * <p>
            * The format of the array is: <code>[contextElementOrId, overlayCorner, contextCorner, arrayOfTriggerEvents (optional), xyOffset (optional)]</code>, the
            * the 5 array elements described in detail below:
            * </p>
            *
            * <dl>
            * <dt>contextElementOrId &#60;String|HTMLElement&#62;</dt>
            * <dd>A reference to the context element to which the overlay should be aligned (or it's id).</dd>
            * <dt>overlayCorner &#60;String&#62;</dt>
            * <dd>The corner of the overlay which is to be used for alignment. This corner will be aligned to the 
            * corner of the context element defined by the "contextCorner" entry which follows. Supported string values are: 
            * "tr" (top right), "tl" (top left), "br" (bottom right), or "bl" (bottom left).</dd>
            * <dt>contextCorner &#60;String&#62;</dt>
            * <dd>The corner of the context element which is to be used for alignment. Supported string values are the same ones listed for the "overlayCorner" entry above.</dd>
            * <dt>arrayOfTriggerEvents (optional) &#60;Array[String|CustomEvent]&#62;</dt>
            * <dd>
            * <p>
            * By default, context alignment is a one time operation, aligning the Overlay to the context element when context configuration property is set, or when the <a href="#method_align">align</a> 
            * method is invoked. However, you can use the optional "arrayOfTriggerEvents" entry to define the list of events which should force the overlay to re-align itself with the context element. 
            * This is useful in situations where the layout of the document may change, resulting in the context element's position being modified.
            * </p>
            * <p>
            * The array can contain either event type strings for events the instance publishes (e.g. "beforeShow") or CustomEvent instances. Additionally the following
            * 3 static container event types are also currently supported : <code>"windowResize", "windowScroll", "textResize"</code> (defined in <a href="#property__TRIGGER_MAP">_TRIGGER_MAP</a> private property).
            * </p>
            * </dd>
            * <dt>xyOffset &#60;Number[]&#62;</dt>
            * <dd>
            * A 2 element Array specifying the X and Y pixel amounts by which the Overlay should be offset from the aligned corner. e.g. [5,0] offsets the Overlay 5 pixels to the left, <em>after</em> aligning the given context corners.
            * NOTE: If using this property and no triggers need to be defined, the arrayOfTriggerEvents property should be set to null to maintain correct array positions for the arguments. 
            * </dd>
            * </dl>
            *
            * <p>
            * For example, setting this property to <code>["img1", "tl", "bl"]</code> will 
            * align the Overlay's top left corner to the bottom left corner of the
            * context element with id "img1".
            * </p>
            * <p>
            * Setting this property to <code>["img1", "tl", "bl", null, [0,5]</code> will 
            * align the Overlay's top left corner to the bottom left corner of the
            * context element with id "img1", and then offset it by 5 pixels on the Y axis (providing a 5 pixel gap between the bottom of the context element and top of the overlay).
            * </p>
            * <p>
            * Adding the optional trigger values: <code>["img1", "tl", "bl", ["beforeShow", "windowResize"], [0,5]]</code>,
            * will re-align the overlay position, whenever the "beforeShow" or "windowResize" events are fired.
            * </p>
            *
            * @config context
            * @type Array
            * @default null
            */
            cfg.addProperty(DEFAULT_CONFIG.CONTEXT.key, {
                handler: this.configContext, 
                suppressEvent: DEFAULT_CONFIG.CONTEXT.suppressEvent, 
                supercedes: DEFAULT_CONFIG.CONTEXT.supercedes
            });

            /**
            * Determines whether or not the Overlay should be anchored 
            * to the center of the viewport.
            * 
            * <p>This property can be set to:</p>
            * 
            * <dl>
            * <dt>true</dt>
            * <dd>
            * To enable fixed center positioning
            * <p>
            * When enabled, the overlay will 
            * be positioned in the center of viewport when initially displayed, and 
            * will remain in the center of the viewport whenever the window is 
            * scrolled or resized.
            * </p>
            * <p>
            * If the overlay is too big for the viewport, 
            * it's top left corner will be aligned with the top left corner of the viewport.
            * </p>
            * </dd>
            * <dt>false</dt>
            * <dd>
            * To disable fixed center positioning.
            * <p>In this case the overlay can still be 
            * centered as a one-off operation, by invoking the <code>center()</code> method,
            * however it will not remain centered when the window is scrolled/resized.
            * </dd>
            * <dt>"contained"<dt>
            * <dd>To enable fixed center positioning, as with the <code>true</code> option.
            * <p>However, unlike setting the property to <code>true</code>, 
            * when the property is set to <code>"contained"</code>, if the overlay is 
            * too big for the viewport, it will not get automatically centered when the 
            * user scrolls or resizes the window (until the window is large enough to contain the 
            * overlay). This is useful in cases where the Overlay has both header and footer 
            * UI controls which the user may need to access.
            * </p>
            * </dd>
            * </dl>
            *
            * @config fixedcenter
            * @type Boolean | String
            * @default false
            */
            cfg.addProperty(DEFAULT_CONFIG.FIXED_CENTER.key, {
                handler: this.configFixedCenter,
                value: DEFAULT_CONFIG.FIXED_CENTER.value, 
                validator: DEFAULT_CONFIG.FIXED_CENTER.validator, 
                supercedes: DEFAULT_CONFIG.FIXED_CENTER.supercedes
            });
    
            /**
            * CSS width of the Overlay.
            * @config width
            * @type String
            * @default null
            */
            cfg.addProperty(DEFAULT_CONFIG.WIDTH.key, {
                handler: this.configWidth, 
                suppressEvent: DEFAULT_CONFIG.WIDTH.suppressEvent, 
                supercedes: DEFAULT_CONFIG.WIDTH.supercedes
            });

            /**
            * CSS height of the Overlay.
            * @config height
            * @type String
            * @default null
            */
            cfg.addProperty(DEFAULT_CONFIG.HEIGHT.key, {
                handler: this.configHeight, 
                suppressEvent: DEFAULT_CONFIG.HEIGHT.suppressEvent, 
                supercedes: DEFAULT_CONFIG.HEIGHT.supercedes
            });

            /**
            * Standard module element which should auto fill out the height of the Overlay if the height config property is set.
            * Supported values are "header", "body", "footer".
            *
            * @config autofillheight
            * @type String
            * @default null
            */
            cfg.addProperty(DEFAULT_CONFIG.AUTO_FILL_HEIGHT.key, {
                handler: this.configAutoFillHeight, 
                value : DEFAULT_CONFIG.AUTO_FILL_HEIGHT.value,
                validator : this._validateAutoFill,
                supercedes: DEFAULT_CONFIG.AUTO_FILL_HEIGHT.supercedes
            });

            /**
            * CSS z-index of the Overlay.
            * @config zIndex
            * @type Number
            * @default null
            */
            cfg.addProperty(DEFAULT_CONFIG.ZINDEX.key, {
                handler: this.configzIndex,
                value: DEFAULT_CONFIG.ZINDEX.value
            });

            /**
            * True if the Overlay should be prevented from being positioned 
            * out of the viewport.
            * @config constraintoviewport
            * @type Boolean
            * @default false
            */
            cfg.addProperty(DEFAULT_CONFIG.CONSTRAIN_TO_VIEWPORT.key, {

                handler: this.configConstrainToViewport, 
                value: DEFAULT_CONFIG.CONSTRAIN_TO_VIEWPORT.value, 
                validator: DEFAULT_CONFIG.CONSTRAIN_TO_VIEWPORT.validator, 
                supercedes: DEFAULT_CONFIG.CONSTRAIN_TO_VIEWPORT.supercedes

            });

            /**
            * @config iframe
            * @description Boolean indicating whether or not the Overlay should 
            * have an IFRAME shim; used to prevent SELECT elements from 
            * poking through an Overlay instance in IE6.  When set to "true", 
            * the iframe shim is created when the Overlay instance is intially
            * made visible.
            * @type Boolean
            * @default true for IE6 and below, false for all other browsers.
            */
            cfg.addProperty(DEFAULT_CONFIG.IFRAME.key, {

                handler: this.configIframe, 
                value: DEFAULT_CONFIG.IFRAME.value, 
                validator: DEFAULT_CONFIG.IFRAME.validator, 
                supercedes: DEFAULT_CONFIG.IFRAME.supercedes

            });

            /**
            * @config preventcontextoverlap
            * @description Boolean indicating whether or not the Overlay should overlap its 
            * context element (defined using the "context" configuration property) when the 
            * "constraintoviewport" configuration property is set to "true".
            * @type Boolean
            * @default false
            */
            cfg.addProperty(DEFAULT_CONFIG.PREVENT_CONTEXT_OVERLAP.key, {
                value: DEFAULT_CONFIG.PREVENT_CONTEXT_OVERLAP.value, 
                validator: DEFAULT_CONFIG.PREVENT_CONTEXT_OVERLAP.validator, 
                supercedes: DEFAULT_CONFIG.PREVENT_CONTEXT_OVERLAP.supercedes
            });
        },

        /**
        * Moves the Overlay to the specified position. This function is  
        * identical to calling this.cfg.setProperty("xy", [x,y]);
        * @method moveTo
        * @param {Number} x The Overlay's new x position
        * @param {Number} y The Overlay's new y position
        */
        moveTo: function (x, y) {
            this.cfg.setProperty("xy", [x, y]);
        },

        /**
        * Adds a CSS class ("hide-scrollbars") and removes a CSS class 
        * ("show-scrollbars") to the Overlay to fix a bug in Gecko on Mac OS X 
        * (https://bugzilla.mozilla.org/show_bug.cgi?id=187435)
        * @method hideMacGeckoScrollbars
        */
        hideMacGeckoScrollbars: function () {
            Dom.replaceClass(this.element, "show-scrollbars", "hide-scrollbars");
        },

        /**
        * Adds a CSS class ("show-scrollbars") and removes a CSS class 
        * ("hide-scrollbars") to the Overlay to fix a bug in Gecko on Mac OS X 
        * (https://bugzilla.mozilla.org/show_bug.cgi?id=187435)
        * @method showMacGeckoScrollbars
        */
        showMacGeckoScrollbars: function () {
            Dom.replaceClass(this.element, "hide-scrollbars", "show-scrollbars");
        },

        /**
         * Internal implementation to set the visibility of the overlay in the DOM.
         *
         * @method _setDomVisibility
         * @param {boolean} visible Whether to show or hide the Overlay's outer element
         * @protected
         */
        _setDomVisibility : function(show) {
            Dom.setStyle(this.element, "visibility", (show) ? "visible" : "hidden");
            var hiddenClass = Overlay.CSS_HIDDEN;

            if (show) {
                Dom.removeClass(this.element, hiddenClass);
            } else {
                Dom.addClass(this.element, hiddenClass);
            }
        },

        // BEGIN BUILT-IN PROPERTY EVENT HANDLERS //
        /**
        * The default event handler fired when the "visible" property is 
        * changed.  This method is responsible for firing showEvent
        * and hideEvent.
        * @method configVisible
        * @param {String} type The CustomEvent type (usually the property name)
        * @param {Object[]} args The CustomEvent arguments. For configuration
        * handlers, args[0] will equal the newly applied value for the property.
        * @param {Object} obj The scope object. For configuration handlers, 
        * this will usually equal the owner.
        */
        configVisible: function (type, args, obj) {

            var visible = args[0],
                currentVis = Dom.getStyle(this.element, "visibility"),
                effects = this._cachedEffects || this._createEffects(this.cfg.getProperty("effect")),
                isMacGecko = (this.platform == "mac" && UA.gecko),
                alreadySubscribed = Config.alreadySubscribed,
                ei, e, j, k, h,
                nEffectInstances;

            if (currentVis == "inherit") {
                e = this.element.parentNode;

                while (e.nodeType != 9 && e.nodeType != 11) {
                    currentVis = Dom.getStyle(e, "visibility");

                    if (currentVis != "inherit") {
                        break;
                    }

                    e = e.parentNode;
                }

                if (currentVis == "inherit") {
                    currentVis = "visible";
                }
            }

            if (visible) { // Show

                if (isMacGecko) {
                    this.showMacGeckoScrollbars();
                }

                if (effects) { // Animate in
                    if (visible) { // Animate in if not showing

                         // Fading out is a bit of a hack, but didn't want to risk doing 
                         // something broader (e.g a generic this._animatingOut) for 2.9.0

                        if (currentVis != "visible" || currentVis === "" || this._fadingOut) {
                            if (this.beforeShowEvent.fire()) {

                                nEffectInstances = effects.length;

                                for (j = 0; j < nEffectInstances; j++) {
                                    ei = effects[j];
                                    if (j === 0 && !alreadySubscribed(ei.animateInCompleteEvent, this.showEvent.fire, this.showEvent)) {
                                        ei.animateInCompleteEvent.subscribe(this.showEvent.fire, this.showEvent, true);
                                    }
                                    ei.animateIn();
                                }
                            }
                        }
                    }
                } else { // Show
                    if (currentVis != "visible" || currentVis === "") {
                        if (this.beforeShowEvent.fire()) {
                            this._setDomVisibility(true);
                            this.cfg.refireEvent("iframe");
                            this.showEvent.fire();
                        }
                    } else {
                        this._setDomVisibility(true);
                    }
                }
            } else { // Hide

                if (isMacGecko) {
                    this.hideMacGeckoScrollbars();
                }

                if (effects) { // Animate out if showing
                    if (currentVis == "visible" || this._fadingIn) {
                        if (this.beforeHideEvent.fire()) {
                            nEffectInstances = effects.length;
                            for (k = 0; k < nEffectInstances; k++) {
                                h = effects[k];
        
                                if (k === 0 && !alreadySubscribed(h.animateOutCompleteEvent, this.hideEvent.fire, this.hideEvent)) {
                                    h.animateOutCompleteEvent.subscribe(this.hideEvent.fire, this.hideEvent, true);
                                }
                                h.animateOut();
                            }
                        }

                    } else if (currentVis === "") {
                        this._setDomVisibility(false);
                    }

                } else { // Simple hide

                    if (currentVis == "visible" || currentVis === "") {
                        if (this.beforeHideEvent.fire()) {
                            this._setDomVisibility(false);
                            this.hideEvent.fire();
                        }
                    } else {
                        this._setDomVisibility(false);
                    }
                }
            }
        },

        /**
        * Fixed center event handler used for centering on scroll/resize, but only if 
        * the overlay is visible and, if "fixedcenter" is set to "contained", only if 
        * the overlay fits within the viewport.
        *
        * @method doCenterOnDOMEvent
        */
        doCenterOnDOMEvent: function () {
            var cfg = this.cfg,
                fc = cfg.getProperty("fixedcenter");

            if (cfg.getProperty("visible")) {
                if (fc && (fc !== _CONTAINED || this.fitsInViewport())) {
                    this.center();
                }
            }
        },

        /**
         * Determines if the Overlay (including the offset value defined by Overlay.VIEWPORT_OFFSET) 
         * will fit entirely inside the viewport, in both dimensions - width and height.
         * 
         * @method fitsInViewport
         * @return boolean true if the Overlay will fit, false if not
         */
        fitsInViewport : function() {
            var nViewportOffset = Overlay.VIEWPORT_OFFSET,
                element = this.element,
                elementWidth = element.offsetWidth,
                elementHeight = element.offsetHeight,
                viewportWidth = Dom.getViewportWidth(),
                viewportHeight = Dom.getViewportHeight();

            return ((elementWidth + nViewportOffset < viewportWidth) && (elementHeight + nViewportOffset < viewportHeight));
        },

        /**
        * The default event handler fired when the "fixedcenter" property 
        * is changed.
        * @method configFixedCenter
        * @param {String} type The CustomEvent type (usually the property name)
        * @param {Object[]} args The CustomEvent arguments. For configuration 
        * handlers, args[0] will equal the newly applied value for the property.
        * @param {Object} obj The scope object. For configuration handlers, 
        * this will usually equal the owner.
        */
        configFixedCenter: function (type, args, obj) {

            var val = args[0],
                alreadySubscribed = Config.alreadySubscribed,
                windowResizeEvent = Overlay.windowResizeEvent,
                windowScrollEvent = Overlay.windowScrollEvent;

            if (val) {
                this.center();

                if (!alreadySubscribed(this.beforeShowEvent, this.center)) {
                    this.beforeShowEvent.subscribe(this.center);
                }

                if (!alreadySubscribed(windowResizeEvent, this.doCenterOnDOMEvent, this)) {
                    windowResizeEvent.subscribe(this.doCenterOnDOMEvent, this, true);
                }

                if (!alreadySubscribed(windowScrollEvent, this.doCenterOnDOMEvent, this)) {
                    windowScrollEvent.subscribe(this.doCenterOnDOMEvent, this, true);
                }

            } else {
                this.beforeShowEvent.unsubscribe(this.center);

                windowResizeEvent.unsubscribe(this.doCenterOnDOMEvent, this);
                windowScrollEvent.unsubscribe(this.doCenterOnDOMEvent, this);
            }
        },

        /**
        * The default event handler fired when the "height" property is changed.
        * @method configHeight
        * @param {String} type The CustomEvent type (usually the property name)
        * @param {Object[]} args The CustomEvent arguments. For configuration 
        * handlers, args[0] will equal the newly applied value for the property.
        * @param {Object} obj The scope object. For configuration handlers, 
        * this will usually equal the owner.
        */
        configHeight: function (type, args, obj) {

            var height = args[0],
                el = this.element;

            Dom.setStyle(el, "height", height);
            this.cfg.refireEvent("iframe");
        },

        /**
         * The default event handler fired when the "autofillheight" property is changed.
         * @method configAutoFillHeight
         *
         * @param {String} type The CustomEvent type (usually the property name)
         * @param {Object[]} args The CustomEvent arguments. For configuration 
         * handlers, args[0] will equal the newly applied value for the property.
         * @param {Object} obj The scope object. For configuration handlers, 
         * this will usually equal the owner.
         */
        configAutoFillHeight: function (type, args, obj) {
            var fillEl = args[0],
                cfg = this.cfg,
                autoFillHeight = "autofillheight",
                height = "height",
                currEl = cfg.getProperty(autoFillHeight),
                autoFill = this._autoFillOnHeightChange;

            cfg.unsubscribeFromConfigEvent(height, autoFill);
            Module.textResizeEvent.unsubscribe(autoFill);
            this.changeContentEvent.unsubscribe(autoFill);

            if (currEl && fillEl !== currEl && this[currEl]) {
                Dom.setStyle(this[currEl], height, "");
            }

            if (fillEl) {
                fillEl = Lang.trim(fillEl.toLowerCase());

                cfg.subscribeToConfigEvent(height, autoFill, this[fillEl], this);
                Module.textResizeEvent.subscribe(autoFill, this[fillEl], this);
                this.changeContentEvent.subscribe(autoFill, this[fillEl], this);

                cfg.setProperty(autoFillHeight, fillEl, true);
            }
        },

        /**
        * The default event handler fired when the "width" property is changed.
        * @method configWidth
        * @param {String} type The CustomEvent type (usually the property name)
        * @param {Object[]} args The CustomEvent arguments. For configuration 
        * handlers, args[0] will equal the newly applied value for the property.
        * @param {Object} obj The scope object. For configuration handlers, 
        * this will usually equal the owner.
        */
        configWidth: function (type, args, obj) {

            var width = args[0],
                el = this.element;

            Dom.setStyle(el, "width", width);
            this.cfg.refireEvent("iframe");
        },

        /**
        * The default event handler fired when the "zIndex" property is changed.
        * @method configzIndex
        * @param {String} type The CustomEvent type (usually the property name)
        * @param {Object[]} args The CustomEvent arguments. For configuration 
        * handlers, args[0] will equal the newly applied value for the property.
        * @param {Object} obj The scope object. For configuration handlers, 
        * this will usually equal the owner.
        */
        configzIndex: function (type, args, obj) {

            var zIndex = args[0],
                el = this.element;

            if (! zIndex) {
                zIndex = Dom.getStyle(el, "zIndex");
                if (! zIndex || isNaN(zIndex)) {
                    zIndex = 0;
                }
            }

            if (this.iframe || this.cfg.getProperty("iframe") === true) {
                if (zIndex <= 0) {
                    zIndex = 1;
                }
            }

            Dom.setStyle(el, "zIndex", zIndex);
            this.cfg.setProperty("zIndex", zIndex, true);

            if (this.iframe) {
                this.stackIframe();
            }
        },

        /**
        * The default event handler fired when the "xy" property is changed.
        * @method configXY
        * @param {String} type The CustomEvent type (usually the property name)
        * @param {Object[]} args The CustomEvent arguments. For configuration 
        * handlers, args[0] will equal the newly applied value for the property.
        * @param {Object} obj The scope object. For configuration handlers, 
        * this will usually equal the owner.
        */
        configXY: function (type, args, obj) {

            var pos = args[0],
                x = pos[0],
                y = pos[1];

            this.cfg.setProperty("x", x);
            this.cfg.setProperty("y", y);

            this.beforeMoveEvent.fire([x, y]);

            x = this.cfg.getProperty("x");
            y = this.cfg.getProperty("y");


            this.cfg.refireEvent("iframe");
            this.moveEvent.fire([x, y]);
        },

        /**
        * The default event handler fired when the "x" property is changed.
        * @method configX
        * @param {String} type The CustomEvent type (usually the property name)
        * @param {Object[]} args The CustomEvent arguments. For configuration 
        * handlers, args[0] will equal the newly applied value for the property.
        * @param {Object} obj The scope object. For configuration handlers, 
        * this will usually equal the owner.
        */
        configX: function (type, args, obj) {

            var x = args[0],
                y = this.cfg.getProperty("y");

            this.cfg.setProperty("x", x, true);
            this.cfg.setProperty("y", y, true);

            this.beforeMoveEvent.fire([x, y]);

            x = this.cfg.getProperty("x");
            y = this.cfg.getProperty("y");

            Dom.setX(this.element, x, true);

            this.cfg.setProperty("xy", [x, y], true);

            this.cfg.refireEvent("iframe");
            this.moveEvent.fire([x, y]);
        },

        /**
        * The default event handler fired when the "y" property is changed.
        * @method configY
        * @param {String} type The CustomEvent type (usually the property name)
        * @param {Object[]} args The CustomEvent arguments. For configuration 
        * handlers, args[0] will equal the newly applied value for the property.
        * @param {Object} obj The scope object. For configuration handlers, 
        * this will usually equal the owner.
        */
        configY: function (type, args, obj) {

            var x = this.cfg.getProperty("x"),
                y = args[0];

            this.cfg.setProperty("x", x, true);
            this.cfg.setProperty("y", y, true);

            this.beforeMoveEvent.fire([x, y]);

            x = this.cfg.getProperty("x");
            y = this.cfg.getProperty("y");

            Dom.setY(this.element, y, true);

            this.cfg.setProperty("xy", [x, y], true);

            this.cfg.refireEvent("iframe");
            this.moveEvent.fire([x, y]);
        },
        
        /**
        * Shows the iframe shim, if it has been enabled.
        * @method showIframe
        */
        showIframe: function () {

            var oIFrame = this.iframe,
                oParentNode;

            if (oIFrame) {
                oParentNode = this.element.parentNode;

                if (oParentNode != oIFrame.parentNode) {
                    this._addToParent(oParentNode, oIFrame);
                }
                oIFrame.style.display = "block";
            }
        },

        /**
        * Hides the iframe shim, if it has been enabled.
        * @method hideIframe
        */
        hideIframe: function () {
            if (this.iframe) {
                this.iframe.style.display = "none";
            }
        },

        /**
        * Syncronizes the size and position of iframe shim to that of its 
        * corresponding Overlay instance.
        * @method syncIframe
        */
        syncIframe: function () {

            var oIFrame = this.iframe,
                oElement = this.element,
                nOffset = Overlay.IFRAME_OFFSET,
                nDimensionOffset = (nOffset * 2),
                aXY;

            if (oIFrame) {
                // Size <iframe>
                oIFrame.style.width = (oElement.offsetWidth + nDimensionOffset + "px");
                oIFrame.style.height = (oElement.offsetHeight + nDimensionOffset + "px");

                // Position <iframe>
                aXY = this.cfg.getProperty("xy");

                if (!Lang.isArray(aXY) || (isNaN(aXY[0]) || isNaN(aXY[1]))) {
                    this.syncPosition();
                    aXY = this.cfg.getProperty("xy");
                }
                Dom.setXY(oIFrame, [(aXY[0] - nOffset), (aXY[1] - nOffset)]);
            }
        },

        /**
         * Sets the zindex of the iframe shim, if it exists, based on the zindex of
         * the Overlay element. The zindex of the iframe is set to be one less 
         * than the Overlay element's zindex.
         * 
         * <p>NOTE: This method will not bump up the zindex of the Overlay element
         * to ensure that the iframe shim has a non-negative zindex.
         * If you require the iframe zindex to be 0 or higher, the zindex of 
         * the Overlay element should be set to a value greater than 0, before 
         * this method is called.
         * </p>
         * @method stackIframe
         */
        stackIframe: function () {
            if (this.iframe) {
                var overlayZ = Dom.getStyle(this.element, "zIndex");
                if (!YAHOO.lang.isUndefined(overlayZ) && !isNaN(overlayZ)) {
                    Dom.setStyle(this.iframe, "zIndex", (overlayZ - 1));
                }
            }
        },

        /**
        * The default event handler fired when the "iframe" property is changed.
        * @method configIframe
        * @param {String} type The CustomEvent type (usually the property name)
        * @param {Object[]} args The CustomEvent arguments. For configuration 
        * handlers, args[0] will equal the newly applied value for the property.
        * @param {Object} obj The scope object. For configuration handlers, 
        * this will usually equal the owner.
        */
        configIframe: function (type, args, obj) {

            var bIFrame = args[0];

            function createIFrame() {

                var oIFrame = this.iframe,
                    oElement = this.element,
                    oParent;

                if (!oIFrame) {
                    if (!m_oIFrameTemplate) {
                        m_oIFrameTemplate = document.createElement("iframe");

                        if (this.isSecure) {
                            m_oIFrameTemplate.src = Overlay.IFRAME_SRC;
                        }

                        /*
                            Set the opacity of the <iframe> to 0 so that it 
                            doesn't modify the opacity of any transparent 
                            elements that may be on top of it (like a shadow).
                        */
                        if (UA.ie) {
                            m_oIFrameTemplate.style.filter = "alpha(opacity=0)";
                            /*
                                 Need to set the "frameBorder" property to 0 
                                 supress the default <iframe> border in IE.  
                                 Setting the CSS "border" property alone 
                                 doesn't supress it.
                            */
                            m_oIFrameTemplate.frameBorder = 0;
                        }
                        else {
                            m_oIFrameTemplate.style.opacity = "0";
                        }

                        m_oIFrameTemplate.style.position = "absolute";
                        m_oIFrameTemplate.style.border = "none";
                        m_oIFrameTemplate.style.margin = "0";
                        m_oIFrameTemplate.style.padding = "0";
                        m_oIFrameTemplate.style.display = "none";
                        m_oIFrameTemplate.tabIndex = -1;
                        m_oIFrameTemplate.className = Overlay.CSS_IFRAME;
                    }

                    oIFrame = m_oIFrameTemplate.cloneNode(false);
                    oIFrame.id = this.id + "_f";
                    oParent = oElement.parentNode;

                    var parentNode = oParent || document.body;

                    this._addToParent(parentNode, oIFrame);
                    this.iframe = oIFrame;
                }

                /*
                     Show the <iframe> before positioning it since the "setXY" 
                     method of DOM requires the element be in the document 
                     and visible.
                */
                this.showIframe();

                /*
                     Syncronize the size and position of the <iframe> to that 
                     of the Overlay.
                */
                this.syncIframe();
                this.stackIframe();

                // Add event listeners to update the <iframe> when necessary
                if (!this._hasIframeEventListeners) {
                    this.showEvent.subscribe(this.showIframe);
                    this.hideEvent.subscribe(this.hideIframe);
                    this.changeContentEvent.subscribe(this.syncIframe);

                    this._hasIframeEventListeners = true;
                }
            }

            function onBeforeShow() {
                createIFrame.call(this);
                this.beforeShowEvent.unsubscribe(onBeforeShow);
                this._iframeDeferred = false;
            }

            if (bIFrame) { // <iframe> shim is enabled

                if (this.cfg.getProperty("visible")) {
                    createIFrame.call(this);
                } else {
                    if (!this._iframeDeferred) {
                        this.beforeShowEvent.subscribe(onBeforeShow);
                        this._iframeDeferred = true;
                    }
                }

            } else {    // <iframe> shim is disabled
                this.hideIframe();

                if (this._hasIframeEventListeners) {
                    this.showEvent.unsubscribe(this.showIframe);
                    this.hideEvent.unsubscribe(this.hideIframe);
                    this.changeContentEvent.unsubscribe(this.syncIframe);

                    this._hasIframeEventListeners = false;
                }
            }
        },

        /**
         * Set's the container's XY value from DOM if not already set.
         * 
         * Differs from syncPosition, in that the XY value is only sync'd with DOM if 
         * not already set. The method also refire's the XY config property event, so any
         * beforeMove, Move event listeners are invoked.
         * 
         * @method _primeXYFromDOM
         * @protected
         */
        _primeXYFromDOM : function() {
            if (YAHOO.lang.isUndefined(this.cfg.getProperty("xy"))) {
                // Set CFG XY based on DOM XY
                this.syncPosition();
                // Account for XY being set silently in syncPosition (no moveTo fired/called)
                this.cfg.refireEvent("xy");
                this.beforeShowEvent.unsubscribe(this._primeXYFromDOM);
            }
        },

        /**
        * The default event handler fired when the "constraintoviewport" 
        * property is changed.
        * @method configConstrainToViewport
        * @param {String} type The CustomEvent type (usually the property name)
        * @param {Object[]} args The CustomEvent arguments. For configuration 
        * handlers, args[0] will equal the newly applied value for 
        * the property.
        * @param {Object} obj The scope object. For configuration handlers, 
        * this will usually equal the owner.
        */
        configConstrainToViewport: function (type, args, obj) {
            var val = args[0];

            if (val) {
                if (! Config.alreadySubscribed(this.beforeMoveEvent, this.enforceConstraints, this)) {
                    this.beforeMoveEvent.subscribe(this.enforceConstraints, this, true);
                }
                if (! Config.alreadySubscribed(this.beforeShowEvent, this._primeXYFromDOM)) {
                    this.beforeShowEvent.subscribe(this._primeXYFromDOM);
                }
            } else {
                this.beforeShowEvent.unsubscribe(this._primeXYFromDOM);
                this.beforeMoveEvent.unsubscribe(this.enforceConstraints, this);
            }
        },

         /**
        * The default event handler fired when the "context" property
        * is changed.
        *
        * @method configContext
        * @param {String} type The CustomEvent type (usually the property name)
        * @param {Object[]} args The CustomEvent arguments. For configuration 
        * handlers, args[0] will equal the newly applied value for the property.
        * @param {Object} obj The scope object. For configuration handlers, 
        * this will usually equal the owner.
        */
        configContext: function (type, args, obj) {

            var contextArgs = args[0],
                contextEl,
                elementMagnetCorner,
                contextMagnetCorner,
                triggers,
                offset,
                defTriggers = this.CONTEXT_TRIGGERS;

            if (contextArgs) {

                contextEl = contextArgs[0];
                elementMagnetCorner = contextArgs[1];
                contextMagnetCorner = contextArgs[2];
                triggers = contextArgs[3];
                offset = contextArgs[4];

                if (defTriggers && defTriggers.length > 0) {
                    triggers = (triggers || []).concat(defTriggers);
                }

                if (contextEl) {
                    if (typeof contextEl == "string") {
                        this.cfg.setProperty("context", [
                                document.getElementById(contextEl), 
                                elementMagnetCorner,
                                contextMagnetCorner,
                                triggers,
                                offset],
                                true);
                    }

                    if (elementMagnetCorner && contextMagnetCorner) {
                        this.align(elementMagnetCorner, contextMagnetCorner, offset);
                    }

                    if (this._contextTriggers) {
                        // Unsubscribe Old Set
                        this._processTriggers(this._contextTriggers, _UNSUBSCRIBE, this._alignOnTrigger);
                    }

                    if (triggers) {
                        // Subscribe New Set
                        this._processTriggers(triggers, _SUBSCRIBE, this._alignOnTrigger);
                        this._contextTriggers = triggers;
                    }
                }
            }
        },

        /**
         * Custom Event handler for context alignment triggers. Invokes the align method
         * 
         * @method _alignOnTrigger
         * @protected
         * 
         * @param {String} type The event type (not used by the default implementation)
         * @param {Any[]} args The array of arguments for the trigger event (not used by the default implementation)
         */
        _alignOnTrigger: function(type, args) {
            this.align();
        },

        /**
         * Helper method to locate the custom event instance for the event name string
         * passed in. As a convenience measure, any custom events passed in are returned.
         *
         * @method _findTriggerCE
         * @private
         *
         * @param {String|CustomEvent} t Either a CustomEvent, or event type (e.g. "windowScroll") for which a 
         * custom event instance needs to be looked up from the Overlay._TRIGGER_MAP.
         */
        _findTriggerCE : function(t) {
            var tce = null;
            if (t instanceof CustomEvent) {
                tce = t;
            } else if (Overlay._TRIGGER_MAP[t]) {
                tce = Overlay._TRIGGER_MAP[t];
            }
            return tce;
        },

        /**
         * Utility method that subscribes or unsubscribes the given 
         * function from the list of trigger events provided.
         *
         * @method _processTriggers
         * @protected 
         *
         * @param {Array[String|CustomEvent]} triggers An array of either CustomEvents, event type strings 
         * (e.g. "beforeShow", "windowScroll") to/from which the provided function should be 
         * subscribed/unsubscribed respectively.
         *
         * @param {String} mode Either "subscribe" or "unsubscribe", specifying whether or not
         * we are subscribing or unsubscribing trigger listeners
         * 
         * @param {Function} fn The function to be subscribed/unsubscribed to/from the trigger event.
         * Context is always set to the overlay instance, and no additional object argument 
         * get passed to the subscribed function.
         */
        _processTriggers : function(triggers, mode, fn) {
            var t, tce;

            for (var i = 0, l = triggers.length; i < l; ++i) {
                t = triggers[i];
                tce = this._findTriggerCE(t);
                if (tce) {
                    tce[mode](fn, this, true);
                } else {
                    this[mode](t, fn);
                }
            }
        },

        // END BUILT-IN PROPERTY EVENT HANDLERS //
        /**
        * Aligns the Overlay to its context element using the specified corner 
        * points (represented by the constants TOP_LEFT, TOP_RIGHT, BOTTOM_LEFT, 
        * and BOTTOM_RIGHT.
        * @method align
        * @param {String} elementAlign  The String representing the corner of 
        * the Overlay that should be aligned to the context element
        * @param {String} contextAlign  The corner of the context element 
        * that the elementAlign corner should stick to.
        * @param {Number[]} xyOffset Optional. A 2 element array specifying the x and y pixel offsets which should be applied
        * after aligning the element and context corners. For example, passing in [5, -10] for this value, would offset the 
        * Overlay by 5 pixels along the X axis (horizontally) and -10 pixels along the Y axis (vertically) after aligning the specified corners.
        */
        align: function (elementAlign, contextAlign, xyOffset) {

            var contextArgs = this.cfg.getProperty("context"),
                me = this,
                context,
                element,
                contextRegion;

            function doAlign(v, h) {

                var alignX = null, alignY = null;

                switch (elementAlign) {
    
                    case Overlay.TOP_LEFT:
                        alignX = h;
                        alignY = v;
                        break;
        
                    case Overlay.TOP_RIGHT:
                        alignX = h - element.offsetWidth;
                        alignY = v;
                        break;
        
                    case Overlay.BOTTOM_LEFT:
                        alignX = h;
                        alignY = v - element.offsetHeight;
                        break;
        
                    case Overlay.BOTTOM_RIGHT:
                        alignX = h - element.offsetWidth; 
                        alignY = v - element.offsetHeight;
                        break;
                }

                if (alignX !== null && alignY !== null) {
                    if (xyOffset) {
                        alignX += xyOffset[0];
                        alignY += xyOffset[1];
                    }
                    me.moveTo(alignX, alignY);
                }
            }

            if (contextArgs) {
                context = contextArgs[0];
                element = this.element;
                me = this;

                if (! elementAlign) {
                    elementAlign = contextArgs[1];
                }

                if (! contextAlign) {
                    contextAlign = contextArgs[2];
                }

                if (!xyOffset && contextArgs[4]) {
                    xyOffset = contextArgs[4];
                }

                if (element && context) {
                    contextRegion = Dom.getRegion(context);

                    switch (contextAlign) {
    
                        case Overlay.TOP_LEFT:
                            doAlign(contextRegion.top, contextRegion.left);
                            break;
        
                        case Overlay.TOP_RIGHT:
                            doAlign(contextRegion.top, contextRegion.right);
                            break;
        
                        case Overlay.BOTTOM_LEFT:
                            doAlign(contextRegion.bottom, contextRegion.left);
                            break;
        
                        case Overlay.BOTTOM_RIGHT:
                            doAlign(contextRegion.bottom, contextRegion.right);
                            break;
                    }
                }
            }
        },

        /**
        * The default event handler executed when the moveEvent is fired, if the 
        * "constraintoviewport" is set to true.
        * @method enforceConstraints
        * @param {String} type The CustomEvent type (usually the property name)
        * @param {Object[]} args The CustomEvent arguments. For configuration 
        * handlers, args[0] will equal the newly applied value for the property.
        * @param {Object} obj The scope object. For configuration handlers, 
        * this will usually equal the owner.
        */
        enforceConstraints: function (type, args, obj) {
            var pos = args[0];

            var cXY = this.getConstrainedXY(pos[0], pos[1]);
            this.cfg.setProperty("x", cXY[0], true);
            this.cfg.setProperty("y", cXY[1], true);
            this.cfg.setProperty("xy", cXY, true);
        },

        /**
         * Shared implementation method for getConstrainedX and getConstrainedY.
         * 
         * <p>
         * Given a coordinate value, returns the calculated coordinate required to 
         * position the Overlay if it is to be constrained to the viewport, based on the 
         * current element size, viewport dimensions, scroll values and preventoverlap 
         * settings
         * </p>
         *
         * @method _getConstrainedPos
         * @protected
         * @param {String} pos The coordinate which needs to be constrained, either "x" or "y"
         * @param {Number} The coordinate value which needs to be constrained
         * @return {Number} The constrained coordinate value
         */
        _getConstrainedPos: function(pos, val) {

            var overlayEl = this.element,

                buffer = Overlay.VIEWPORT_OFFSET,

                x = (pos == "x"),

                overlaySize      = (x) ? overlayEl.offsetWidth : overlayEl.offsetHeight,
                viewportSize     = (x) ? Dom.getViewportWidth() : Dom.getViewportHeight(),
                docScroll        = (x) ? Dom.getDocumentScrollLeft() : Dom.getDocumentScrollTop(),
                overlapPositions = (x) ? Overlay.PREVENT_OVERLAP_X : Overlay.PREVENT_OVERLAP_Y,

                context = this.cfg.getProperty("context"),

                bOverlayFitsInViewport = (overlaySize + buffer < viewportSize),
                bPreventContextOverlap = this.cfg.getProperty("preventcontextoverlap") && context && overlapPositions[(context[1] + context[2])],

                minConstraint = docScroll + buffer,
                maxConstraint = docScroll + viewportSize - overlaySize - buffer,

                constrainedVal = val;

            if (val < minConstraint || val > maxConstraint) {
                if (bPreventContextOverlap) {
                    constrainedVal = this._preventOverlap(pos, context[0], overlaySize, viewportSize, docScroll);
                } else {
                    if (bOverlayFitsInViewport) {
                        if (val < minConstraint) {
                            constrainedVal = minConstraint;
                        } else if (val > maxConstraint) {
                            constrainedVal = maxConstraint;
                        }
                    } else {
                        constrainedVal = minConstraint;
                    }
                }
            }

            return constrainedVal;
        },

        /**
         * Helper method, used to position the Overlap to prevent overlap with the 
         * context element (used when preventcontextoverlap is enabled)
         *
         * @method _preventOverlap
         * @protected
         * @param {String} pos The coordinate to prevent overlap for, either "x" or "y".
         * @param {HTMLElement} contextEl The context element
         * @param {Number} overlaySize The related overlay dimension value (for "x", the width, for "y", the height)
         * @param {Number} viewportSize The related viewport dimension value (for "x", the width, for "y", the height)
         * @param {Object} docScroll  The related document scroll value (for "x", the scrollLeft, for "y", the scrollTop)
         *
         * @return {Number} The new coordinate value which was set to prevent overlap
         */
        _preventOverlap : function(pos, contextEl, overlaySize, viewportSize, docScroll) {
            
            var x = (pos == "x"),

                buffer = Overlay.VIEWPORT_OFFSET,

                overlay = this,

                contextElPos   = ((x) ? Dom.getX(contextEl) : Dom.getY(contextEl)) - docScroll,
                contextElSize  = (x) ? contextEl.offsetWidth : contextEl.offsetHeight,

                minRegionSize = contextElPos - buffer,
                maxRegionSize = (viewportSize - (contextElPos + contextElSize)) - buffer,

                bFlipped = false,

                flip = function () {
                    var flippedVal;

                    if ((overlay.cfg.getProperty(pos) - docScroll) > contextElPos) {
                        flippedVal = (contextElPos - overlaySize);
                    } else {
                        flippedVal = (contextElPos + contextElSize);
                    }

                    overlay.cfg.setProperty(pos, (flippedVal + docScroll), true);

                    return flippedVal;
                },

                setPosition = function () {

                    var displayRegionSize = ((overlay.cfg.getProperty(pos) - docScroll) > contextElPos) ? maxRegionSize : minRegionSize,
                        position;

                    if (overlaySize > displayRegionSize) {
                        if (bFlipped) {
                            /*
                                 All possible positions and values have been 
                                 tried, but none were successful, so fall back 
                                 to the original size and position.
                            */
                            flip();
                        } else {
                            flip();
                            bFlipped = true;
                            position = setPosition();
                        }
                    }

                    return position;
                };

            setPosition();

            return this.cfg.getProperty(pos);
        },

        /**
         * Given x coordinate value, returns the calculated x coordinate required to 
         * position the Overlay if it is to be constrained to the viewport, based on the 
         * current element size, viewport dimensions and scroll values.
         *
         * @param {Number} x The X coordinate value to be constrained
         * @return {Number} The constrained x coordinate
         */		
        getConstrainedX: function (x) {
            return this._getConstrainedPos("x", x);
        },

        /**
         * Given y coordinate value, returns the calculated y coordinate required to 
         * position the Overlay if it is to be constrained to the viewport, based on the 
         * current element size, viewport dimensions and scroll values.
         *
         * @param {Number} y The Y coordinate value to be constrained
         * @return {Number} The constrained y coordinate
         */		
        getConstrainedY : function (y) {
            return this._getConstrainedPos("y", y);
        },

        /**
         * Given x, y coordinate values, returns the calculated coordinates required to 
         * position the Overlay if it is to be constrained to the viewport, based on the 
         * current element size, viewport dimensions and scroll values.
         *
         * @param {Number} x The X coordinate value to be constrained
         * @param {Number} y The Y coordinate value to be constrained
         * @return {Array} The constrained x and y coordinates at index 0 and 1 respectively;
         */
        getConstrainedXY: function(x, y) {
            return [this.getConstrainedX(x), this.getConstrainedY(y)];
        },

        /**
        * Centers the container in the viewport.
        * @method center
        */
        center: function () {

            var nViewportOffset = Overlay.VIEWPORT_OFFSET,
                elementWidth = this.element.offsetWidth,
                elementHeight = this.element.offsetHeight,
                viewPortWidth = Dom.getViewportWidth(),
                viewPortHeight = Dom.getViewportHeight(),
                x,
                y;

            if (elementWidth < viewPortWidth) {
                x = (viewPortWidth / 2) - (elementWidth / 2) + Dom.getDocumentScrollLeft();
            } else {
                x = nViewportOffset + Dom.getDocumentScrollLeft();
            }

            if (elementHeight < viewPortHeight) {
                y = (viewPortHeight / 2) - (elementHeight / 2) + Dom.getDocumentScrollTop();
            } else {
                y = nViewportOffset + Dom.getDocumentScrollTop();
            }

            this.cfg.setProperty("xy", [parseInt(x, 10), parseInt(y, 10)]);
            this.cfg.refireEvent("iframe");

            if (UA.webkit) {
                this.forceContainerRedraw();
            }
        },

        /**
        * Synchronizes the Panel's "xy", "x", and "y" properties with the 
        * Panel's position in the DOM. This is primarily used to update  
        * position information during drag & drop.
        * @method syncPosition
        */
        syncPosition: function () {

            var pos = Dom.getXY(this.element);

            this.cfg.setProperty("x", pos[0], true);
            this.cfg.setProperty("y", pos[1], true);
            this.cfg.setProperty("xy", pos, true);

        },

        /**
        * Event handler fired when the resize monitor element is resized.
        * @method onDomResize
        * @param {DOMEvent} e The resize DOM event
        * @param {Object} obj The scope object
        */
        onDomResize: function (e, obj) {

            var me = this;

            Overlay.superclass.onDomResize.call(this, e, obj);

            setTimeout(function () {
                me.syncPosition();
                me.cfg.refireEvent("iframe");
                me.cfg.refireEvent("context");
            }, 0);
        },

        /**
         * Determines the content box height of the given element (height of the element, without padding or borders) in pixels.
         *
         * @method _getComputedHeight
         * @private
         * @param {HTMLElement} el The element for which the content height needs to be determined
         * @return {Number} The content box height of the given element, or null if it could not be determined.
         */
        _getComputedHeight : (function() {

            if (document.defaultView && document.defaultView.getComputedStyle) {
                return function(el) {
                    var height = null;
                    if (el.ownerDocument && el.ownerDocument.defaultView) {
                        var computed = el.ownerDocument.defaultView.getComputedStyle(el, '');
                        if (computed) {
                            height = parseInt(computed.height, 10);
                        }
                    }
                    return (Lang.isNumber(height)) ? height : null;
                };
            } else {
                return function(el) {
                    var height = null;
                    if (el.style.pixelHeight) {
                        height = el.style.pixelHeight;
                    }
                    return (Lang.isNumber(height)) ? height : null;
                };
            }
        })(),

        /**
         * autofillheight validator. Verifies that the autofill value is either null 
         * or one of the strings : "body", "header" or "footer".
         *
         * @method _validateAutoFillHeight
         * @protected
         * @param {String} val
         * @return true, if valid, false otherwise
         */
        _validateAutoFillHeight : function(val) {
            return (!val) || (Lang.isString(val) && Overlay.STD_MOD_RE.test(val));
        },

        /**
         * The default custom event handler executed when the overlay's height is changed, 
         * if the autofillheight property has been set.
         *
         * @method _autoFillOnHeightChange
         * @protected
         * @param {String} type The event type
         * @param {Array} args The array of arguments passed to event subscribers
         * @param {HTMLElement} el The header, body or footer element which is to be resized to fill
         * out the containers height
         */
        _autoFillOnHeightChange : function(type, args, el) {
            var height = this.cfg.getProperty("height");
            if ((height && height !== "auto") || (height === 0)) {
                this.fillHeight(el);
            }
        },

        /**
         * Returns the sub-pixel height of the el, using getBoundingClientRect, if available,
         * otherwise returns the offsetHeight
         * @method _getPreciseHeight
         * @private
         * @param {HTMLElement} el
         * @return {Float} The sub-pixel height if supported by the browser, else the rounded height.
         */
        _getPreciseHeight : function(el) {
            var height = el.offsetHeight;

            if (el.getBoundingClientRect) {
                var rect = el.getBoundingClientRect();
                height = rect.bottom - rect.top;
            }

            return height;
        },

        /**
         * <p>
         * Sets the height on the provided header, body or footer element to 
         * fill out the height of the container. It determines the height of the 
         * containers content box, based on it's configured height value, and 
         * sets the height of the autofillheight element to fill out any 
         * space remaining after the other standard module element heights 
         * have been accounted for.
         * </p>
         * <p><strong>NOTE:</strong> This method is not designed to work if an explicit 
         * height has not been set on the container, since for an "auto" height container, 
         * the heights of the header/body/footer will drive the height of the container.</p>
         *
         * @method fillHeight
         * @param {HTMLElement} el The element which should be resized to fill out the height
         * of the container element.
         */
        fillHeight : function(el) {
            if (el) {
                var container = this.innerElement || this.element,
                    containerEls = [this.header, this.body, this.footer],
                    containerEl,
                    total = 0,
                    filled = 0,
                    remaining = 0,
                    validEl = false;

                for (var i = 0, l = containerEls.length; i < l; i++) {
                    containerEl = containerEls[i];
                    if (containerEl) {
                        if (el !== containerEl) {
                            filled += this._getPreciseHeight(containerEl);
                        } else {
                            validEl = true;
                        }
                    }
                }

                if (validEl) {

                    if (UA.ie || UA.opera) {
                        // Need to set height to 0, to allow height to be reduced
                        Dom.setStyle(el, 'height', 0 + 'px');
                    }

                    total = this._getComputedHeight(container);

                    // Fallback, if we can't get computed value for content height
                    if (total === null) {
                        Dom.addClass(container, "yui-override-padding");
                        total = container.clientHeight; // Content, No Border, 0 Padding (set by yui-override-padding)
                        Dom.removeClass(container, "yui-override-padding");
                    }
    
                    remaining = Math.max(total - filled, 0);
    
                    Dom.setStyle(el, "height", remaining + "px");
    
                    // Re-adjust height if required, to account for el padding and border
                    if (el.offsetHeight != remaining) {
                        remaining = Math.max(remaining - (el.offsetHeight - remaining), 0);
                    }
                    Dom.setStyle(el, "height", remaining + "px");
                }
            }
        },

        /**
        * Places the Overlay on top of all other instances of 
        * YAHOO.widget.Overlay.
        * @method bringToTop
        */
        bringToTop: function () {

            var aOverlays = [],
                oElement = this.element;

            function compareZIndexDesc(p_oOverlay1, p_oOverlay2) {

                var sZIndex1 = Dom.getStyle(p_oOverlay1, "zIndex"),
                    sZIndex2 = Dom.getStyle(p_oOverlay2, "zIndex"),

                    nZIndex1 = (!sZIndex1 || isNaN(sZIndex1)) ? 0 : parseInt(sZIndex1, 10),
                    nZIndex2 = (!sZIndex2 || isNaN(sZIndex2)) ? 0 : parseInt(sZIndex2, 10);

                if (nZIndex1 > nZIndex2) {
                    return -1;
                } else if (nZIndex1 < nZIndex2) {
                    return 1;
                } else {
                    return 0;
                }
            }

            function isOverlayElement(p_oElement) {

                var isOverlay = Dom.hasClass(p_oElement, Overlay.CSS_OVERLAY),
                    Panel = YAHOO.widget.Panel;

                if (isOverlay && !Dom.isAncestor(oElement, p_oElement)) {
                    if (Panel && Dom.hasClass(p_oElement, Panel.CSS_PANEL)) {
                        aOverlays[aOverlays.length] = p_oElement.parentNode;
                    } else {
                        aOverlays[aOverlays.length] = p_oElement;
                    }
                }
            }

            Dom.getElementsBy(isOverlayElement, "div", document.body);

            aOverlays.sort(compareZIndexDesc);

            var oTopOverlay = aOverlays[0],
                nTopZIndex;

            if (oTopOverlay) {
                nTopZIndex = Dom.getStyle(oTopOverlay, "zIndex");

                if (!isNaN(nTopZIndex)) {
                    var bRequiresBump = false;

                    if (oTopOverlay != oElement) {
                        bRequiresBump = true;
                    } else if (aOverlays.length > 1) {
                        var nNextZIndex = Dom.getStyle(aOverlays[1], "zIndex");
                        // Don't rely on DOM order to stack if 2 overlays are at the same zindex.
                        if (!isNaN(nNextZIndex) && (nTopZIndex == nNextZIndex)) {
                            bRequiresBump = true;
                        }
                    }
                    if (bRequiresBump) {
                        this.cfg.setProperty("zindex", (parseInt(nTopZIndex, 10) + 2));
                    }
                }
            }
        },

        /**
        * Removes the Overlay element from the DOM and sets all child 
        * elements to null.
        * @method destroy
        * @param {boolean} shallowPurge If true, only the parent element's DOM event listeners are purged. If false, or not provided, all children are also purged of DOM event listeners. 
        * NOTE: The flag is a "shallowPurge" flag, as opposed to what may be a more intuitive "purgeChildren" flag to maintain backwards compatibility with behavior prior to 2.9.0.
        */
        destroy: function (shallowPurge) {

            if (this.iframe) {
                this.iframe.parentNode.removeChild(this.iframe);
            }

            this.iframe = null;

            Overlay.windowResizeEvent.unsubscribe(
                this.doCenterOnDOMEvent, this);
    
            Overlay.windowScrollEvent.unsubscribe(
                this.doCenterOnDOMEvent, this);

            Module.textResizeEvent.unsubscribe(this._autoFillOnHeightChange);

            if (this._contextTriggers) {
                // Unsubscribe context triggers - to cover context triggers which listen for global
                // events such as windowResize and windowScroll. Easier just to unsubscribe all
                this._processTriggers(this._contextTriggers, _UNSUBSCRIBE, this._alignOnTrigger);
            }

            Overlay.superclass.destroy.call(this, shallowPurge);
        },

        /**
         * Can be used to force the container to repaint/redraw it's contents.
         * <p>
         * By default applies and then removes a 1px bottom margin through the 
         * application/removal of a "yui-force-redraw" class.
         * </p>
         * <p>
         * It is currently used by Overlay to force a repaint for webkit 
         * browsers, when centering.
         * </p>
         * @method forceContainerRedraw
         */
        forceContainerRedraw : function() {
            var c = this;
            Dom.addClass(c.element, "yui-force-redraw");
            setTimeout(function() {
                Dom.removeClass(c.element, "yui-force-redraw");
            }, 0);
        },

        /**
        * Returns a String representation of the object.
        * @method toString
        * @return {String} The string representation of the Overlay.
        */
        toString: function () {
            return "Overlay " + this.id;
        }

    });
}());
(function () {

    /**
    * OverlayManager is used for maintaining the focus status of 
    * multiple Overlays.
    * @namespace YAHOO.widget
    * @namespace YAHOO.widget
    * @class OverlayManager
    * @constructor
    * @param {Array} overlays Optional. A collection of Overlays to register 
    * with the manager.
    * @param {Object} userConfig  The object literal representing the user 
    * configuration of the OverlayManager
    */
    YAHOO.widget.OverlayManager = function (userConfig) {
        this.init(userConfig);
    };

    var Overlay = YAHOO.widget.Overlay,
        Event = YAHOO.util.Event,
        Dom = YAHOO.util.Dom,
        Config = YAHOO.util.Config,
        CustomEvent = YAHOO.util.CustomEvent,
        OverlayManager = YAHOO.widget.OverlayManager;

    /**
    * The CSS class representing a focused Overlay
    * @property OverlayManager.CSS_FOCUSED
    * @static
    * @final
    * @type String
    */
    OverlayManager.CSS_FOCUSED = "focused";

    OverlayManager.prototype = {

        /**
        * The class's constructor function
        * @property contructor
        * @type Function
        */
        constructor: OverlayManager,

        /**
        * The array of Overlays that are currently registered
        * @property overlays
        * @type YAHOO.widget.Overlay[]
        */
        overlays: null,

        /**
        * Initializes the default configuration of the OverlayManager
        * @method initDefaultConfig
        */
        initDefaultConfig: function () {
            /**
            * The collection of registered Overlays in use by 
            * the OverlayManager
            * @config overlays
            * @type YAHOO.widget.Overlay[]
            * @default null
            */
            this.cfg.addProperty("overlays", { suppressEvent: true } );

            /**
            * The default DOM event that should be used to focus an Overlay
            * @config focusevent
            * @type String
            * @default "mousedown"
            */
            this.cfg.addProperty("focusevent", { value: "mousedown" } );
        },

        /**
        * Initializes the OverlayManager
        * @method init
        * @param {Overlay[]} overlays Optional. A collection of Overlays to 
        * register with the manager.
        * @param {Object} userConfig  The object literal representing the user 
        * configuration of the OverlayManager
        */
        init: function (userConfig) {

            /**
            * The OverlayManager's Config object used for monitoring 
            * configuration properties.
            * @property cfg
            * @type Config
            */
            this.cfg = new Config(this);

            this.initDefaultConfig();

            if (userConfig) {
                this.cfg.applyConfig(userConfig, true);
            }
            this.cfg.fireQueue();

            /**
            * The currently activated Overlay
            * @property activeOverlay
            * @private
            * @type YAHOO.widget.Overlay
            */
            var activeOverlay = null;

            /**
            * Returns the currently focused Overlay
            * @method getActive
            * @return {Overlay} The currently focused Overlay
            */
            this.getActive = function () {
                return activeOverlay;
            };

            /**
            * Focuses the specified Overlay
            * @method focus
            * @param {Overlay} overlay The Overlay to focus
            * @param {String} overlay The id of the Overlay to focus
            */
            this.focus = function (overlay) {
                var o = this.find(overlay);
                if (o) {
                    o.focus();
                }
            };

            /**
            * Removes the specified Overlay from the manager
            * @method remove
            * @param {Overlay} overlay The Overlay to remove
            * @param {String} overlay The id of the Overlay to remove
            */
            this.remove = function (overlay) {

                var o = this.find(overlay), 
                        originalZ;

                if (o) {
                    if (activeOverlay == o) {
                        activeOverlay = null;
                    }

                    var bDestroyed = (o.element === null && o.cfg === null) ? true : false;

                    if (!bDestroyed) {
                        // Set it's zindex so that it's sorted to the end.
                        originalZ = Dom.getStyle(o.element, "zIndex");
                        o.cfg.setProperty("zIndex", -1000, true);
                    }

                    this.overlays.sort(this.compareZIndexDesc);
                    this.overlays = this.overlays.slice(0, (this.overlays.length - 1));

                    o.hideEvent.unsubscribe(o.blur);
                    o.destroyEvent.unsubscribe(this._onOverlayDestroy, o);
                    o.focusEvent.unsubscribe(this._onOverlayFocusHandler, o);
                    o.blurEvent.unsubscribe(this._onOverlayBlurHandler, o);

                    if (!bDestroyed) {
                        Event.removeListener(o.element, this.cfg.getProperty("focusevent"), this._onOverlayElementFocus);
                        o.cfg.setProperty("zIndex", originalZ, true);
                        o.cfg.setProperty("manager", null);
                    }

                    /* _managed Flag for custom or existing. Don't want to remove existing */
                    if (o.focusEvent._managed) { o.focusEvent = null; }
                    if (o.blurEvent._managed) { o.blurEvent = null; }

                    if (o.focus._managed) { o.focus = null; }
                    if (o.blur._managed) { o.blur = null; }
                }
            };

            /**
            * Removes focus from all registered Overlays in the manager
            * @method blurAll
            */
            this.blurAll = function () {

                var nOverlays = this.overlays.length,
                    i;

                if (nOverlays > 0) {
                    i = nOverlays - 1;
                    do {
                        this.overlays[i].blur();
                    }
                    while(i--);
                }
            };

            /**
             * Updates the state of the OverlayManager and overlay, as a result of the overlay
             * being blurred.
             * 
             * @method _manageBlur
             * @param {Overlay} overlay The overlay instance which got blurred.
             * @protected
             */
            this._manageBlur = function (overlay) {
                var changed = false;
                if (activeOverlay == overlay) {
                    Dom.removeClass(activeOverlay.element, OverlayManager.CSS_FOCUSED);
                    activeOverlay = null;
                    changed = true;
                }
                return changed;
            };

            /**
             * Updates the state of the OverlayManager and overlay, as a result of the overlay 
             * receiving focus.
             *
             * @method _manageFocus
             * @param {Overlay} overlay The overlay instance which got focus.
             * @protected
             */
            this._manageFocus = function(overlay) {
                var changed = false;
                if (activeOverlay != overlay) {
                    if (activeOverlay) {
                        activeOverlay.blur();
                    }
                    activeOverlay = overlay;
                    this.bringToTop(activeOverlay);
                    Dom.addClass(activeOverlay.element, OverlayManager.CSS_FOCUSED);
                    changed = true;
                }
                return changed;
            };

            var overlays = this.cfg.getProperty("overlays");

            if (! this.overlays) {
                this.overlays = [];
            }

            if (overlays) {
                this.register(overlays);
                this.overlays.sort(this.compareZIndexDesc);
            }
        },

        /**
        * @method _onOverlayElementFocus
        * @description Event handler for the DOM event that is used to focus 
        * the Overlay instance as specified by the "focusevent" 
        * configuration property.
        * @private
        * @param {Event} p_oEvent Object representing the DOM event 
        * object passed back by the event utility (Event).
        */
        _onOverlayElementFocus: function (p_oEvent) {

            var oTarget = Event.getTarget(p_oEvent),
                oClose = this.close;

            if (oClose && (oTarget == oClose || Dom.isAncestor(oClose, oTarget))) {
                this.blur();
            } else {
                this.focus();
            }
        },

        /**
        * @method _onOverlayDestroy
        * @description "destroy" event handler for the Overlay.
        * @private
        * @param {String} p_sType String representing the name of the event  
        * that was fired.
        * @param {Array} p_aArgs Array of arguments sent when the event 
        * was fired.
        * @param {Overlay} p_oOverlay Object representing the overlay that 
        * fired the event.
        */
        _onOverlayDestroy: function (p_sType, p_aArgs, p_oOverlay) {
            this.remove(p_oOverlay);
        },

        /**
        * @method _onOverlayFocusHandler
        *
        * @description focusEvent Handler, used to delegate to _manageFocus with the correct arguments.
        *
        * @private
        * @param {String} p_sType String representing the name of the event  
        * that was fired.
        * @param {Array} p_aArgs Array of arguments sent when the event 
        * was fired.
        * @param {Overlay} p_oOverlay Object representing the overlay that 
        * fired the event.
        */
        _onOverlayFocusHandler: function(p_sType, p_aArgs, p_oOverlay) {
            this._manageFocus(p_oOverlay);
        },

        /**
        * @method _onOverlayBlurHandler
        * @description blurEvent Handler, used to delegate to _manageBlur with the correct arguments.
        *
        * @private
        * @param {String} p_sType String representing the name of the event  
        * that was fired.
        * @param {Array} p_aArgs Array of arguments sent when the event 
        * was fired.
        * @param {Overlay} p_oOverlay Object representing the overlay that 
        * fired the event.
        */
        _onOverlayBlurHandler: function(p_sType, p_aArgs, p_oOverlay) {
            this._manageBlur(p_oOverlay);
        },

        /**
         * Subscribes to the Overlay based instance focusEvent, to allow the OverlayManager to
         * monitor focus state.
         * 
         * If the instance already has a focusEvent (e.g. Menu), OverlayManager will subscribe 
         * to the existing focusEvent, however if a focusEvent or focus method does not exist
         * on the instance, the _bindFocus method will add them, and the focus method will 
         * update the OverlayManager's state directly.
         * 
         * @method _bindFocus
         * @param {Overlay} overlay The overlay for which focus needs to be managed
         * @protected
         */
        _bindFocus : function(overlay) {
            var mgr = this;

            if (!overlay.focusEvent) {
                overlay.focusEvent = overlay.createEvent("focus");
                overlay.focusEvent.signature = CustomEvent.LIST;
                overlay.focusEvent._managed = true;
            } else {
                overlay.focusEvent.subscribe(mgr._onOverlayFocusHandler, overlay, mgr);
            }

            if (!overlay.focus) {
                Event.on(overlay.element, mgr.cfg.getProperty("focusevent"), mgr._onOverlayElementFocus, null, overlay);
                overlay.focus = function () {
                    if (mgr._manageFocus(this)) {
                        // For Panel/Dialog
                        if (this.cfg.getProperty("visible") && this.focusFirst) {
                            this.focusFirst();
                        }
                        this.focusEvent.fire();
                    }
                };
                overlay.focus._managed = true;
            }
        },

        /**
         * Subscribes to the Overlay based instance's blurEvent to allow the OverlayManager to
         * monitor blur state.
         *
         * If the instance already has a blurEvent (e.g. Menu), OverlayManager will subscribe 
         * to the existing blurEvent, however if a blurEvent or blur method does not exist
         * on the instance, the _bindBlur method will add them, and the blur method 
         * update the OverlayManager's state directly.
         *
         * @method _bindBlur
         * @param {Overlay} overlay The overlay for which blur needs to be managed
         * @protected
         */
        _bindBlur : function(overlay) {
            var mgr = this;

            if (!overlay.blurEvent) {
                overlay.blurEvent = overlay.createEvent("blur");
                overlay.blurEvent.signature = CustomEvent.LIST;
                overlay.focusEvent._managed = true;
            } else {
                overlay.blurEvent.subscribe(mgr._onOverlayBlurHandler, overlay, mgr);
            }

            if (!overlay.blur) {
                overlay.blur = function () {
                    if (mgr._manageBlur(this)) {
                        this.blurEvent.fire();
                    }
                };
                overlay.blur._managed = true;
            }

            overlay.hideEvent.subscribe(overlay.blur);
        },

        /**
         * Subscribes to the Overlay based instance's destroyEvent, to allow the Overlay
         * to be removed for the OverlayManager when destroyed.
         * 
         * @method _bindDestroy
         * @param {Overlay} overlay The overlay instance being managed
         * @protected
         */
        _bindDestroy : function(overlay) {
            var mgr = this;
            overlay.destroyEvent.subscribe(mgr._onOverlayDestroy, overlay, mgr);
        },

        /**
         * Ensures the zIndex configuration property on the managed overlay based instance
         * is set to the computed zIndex value from the DOM (with "auto" translating to 0).
         *
         * @method _syncZIndex
         * @param {Overlay} overlay The overlay instance being managed
         * @protected
         */
        _syncZIndex : function(overlay) {
            var zIndex = Dom.getStyle(overlay.element, "zIndex");
            if (!isNaN(zIndex)) {
                overlay.cfg.setProperty("zIndex", parseInt(zIndex, 10));
            } else {
                overlay.cfg.setProperty("zIndex", 0);
            }
        },

        /**
        * Registers an Overlay or an array of Overlays with the manager. Upon 
        * registration, the Overlay receives functions for focus and blur, 
        * along with CustomEvents for each.
        *
        * @method register
        * @param {Overlay} overlay  An Overlay to register with the manager.
        * @param {Overlay[]} overlay  An array of Overlays to register with 
        * the manager.
        * @return {boolean} true if any Overlays are registered.
        */
        register: function (overlay) {

            var registered = false,
                i,
                n;

            if (overlay instanceof Overlay) {

                overlay.cfg.addProperty("manager", { value: this } );

                this._bindFocus(overlay);
                this._bindBlur(overlay);
                this._bindDestroy(overlay);
                this._syncZIndex(overlay);

                this.overlays.push(overlay);
                this.bringToTop(overlay);

                registered = true;

            } else if (overlay instanceof Array) {

                for (i = 0, n = overlay.length; i < n; i++) {
                    registered = this.register(overlay[i]) || registered;
                }

            }

            return registered;
        },

        /**
        * Places the specified Overlay instance on top of all other 
        * Overlay instances.
        * @method bringToTop
        * @param {YAHOO.widget.Overlay} p_oOverlay Object representing an 
        * Overlay instance.
        * @param {String} p_oOverlay String representing the id of an 
        * Overlay instance.
        */        
        bringToTop: function (p_oOverlay) {

            var oOverlay = this.find(p_oOverlay),
                nTopZIndex,
                oTopOverlay,
                aOverlays;

            if (oOverlay) {

                aOverlays = this.overlays;
                aOverlays.sort(this.compareZIndexDesc);

                oTopOverlay = aOverlays[0];

                if (oTopOverlay) {
                    nTopZIndex = Dom.getStyle(oTopOverlay.element, "zIndex");

                    if (!isNaN(nTopZIndex)) {

                        var bRequiresBump = false;

                        if (oTopOverlay !== oOverlay) {
                            bRequiresBump = true;
                        } else if (aOverlays.length > 1) {
                            var nNextZIndex = Dom.getStyle(aOverlays[1].element, "zIndex");
                            // Don't rely on DOM order to stack if 2 overlays are at the same zindex.
                            if (!isNaN(nNextZIndex) && (nTopZIndex == nNextZIndex)) {
                                bRequiresBump = true;
                            }
                        }

                        if (bRequiresBump) {
                            oOverlay.cfg.setProperty("zindex", (parseInt(nTopZIndex, 10) + 2));
                        }
                    }
                    aOverlays.sort(this.compareZIndexDesc);
                }
            }
        },

        /**
        * Attempts to locate an Overlay by instance or ID.
        * @method find
        * @param {Overlay} overlay  An Overlay to locate within the manager
        * @param {String} overlay  An Overlay id to locate within the manager
        * @return {Overlay} The requested Overlay, if found, or null if it 
        * cannot be located.
        */
        find: function (overlay) {

            var isInstance = overlay instanceof Overlay,
                overlays = this.overlays,
                n = overlays.length,
                found = null,
                o,
                i;

            if (isInstance || typeof overlay == "string") {
                for (i = n-1; i >= 0; i--) {
                    o = overlays[i];
                    if ((isInstance && (o === overlay)) || (o.id == overlay)) {
                        found = o;
                        break;
                    }
                }
            }

            return found;
        },

        /**
        * Used for sorting the manager's Overlays by z-index.
        * @method compareZIndexDesc
        * @private
        * @return {Number} 0, 1, or -1, depending on where the Overlay should 
        * fall in the stacking order.
        */
        compareZIndexDesc: function (o1, o2) {

            var zIndex1 = (o1.cfg) ? o1.cfg.getProperty("zIndex") : null, // Sort invalid (destroyed)
                zIndex2 = (o2.cfg) ? o2.cfg.getProperty("zIndex") : null; // objects at bottom.

            if (zIndex1 === null && zIndex2 === null) {
                return 0;
            } else if (zIndex1 === null){
                return 1;
            } else if (zIndex2 === null) {
                return -1;
            } else if (zIndex1 > zIndex2) {
                return -1;
            } else if (zIndex1 < zIndex2) {
                return 1;
            } else {
                return 0;
            }
        },

        /**
        * Shows all Overlays in the manager.
        * @method showAll
        */
        showAll: function () {
            var overlays = this.overlays,
                n = overlays.length,
                i;

            for (i = n - 1; i >= 0; i--) {
                overlays[i].show();
            }
        },

        /**
        * Hides all Overlays in the manager.
        * @method hideAll
        */
        hideAll: function () {
            var overlays = this.overlays,
                n = overlays.length,
                i;

            for (i = n - 1; i >= 0; i--) {
                overlays[i].hide();
            }
        },

        /**
        * Returns a string representation of the object.
        * @method toString
        * @return {String} The string representation of the OverlayManager
        */
        toString: function () {
            return "OverlayManager";
        }
    };
}());
(function () {

    /**
    * Tooltip is an implementation of Overlay that behaves like an OS tooltip, 
    * displaying when the user mouses over a particular element, and 
    * disappearing on mouse out.
    * @namespace YAHOO.widget
    * @class Tooltip
    * @extends YAHOO.widget.Overlay
    * @constructor
    * @param {String} el The element ID representing the Tooltip <em>OR</em>
    * @param {HTMLElement} el The element representing the Tooltip
    * @param {Object} userConfig The configuration object literal containing 
    * the configuration that should be set for this Overlay. See configuration 
    * documentation for more details.
    */
    YAHOO.widget.Tooltip = function (el, userConfig) {
        YAHOO.widget.Tooltip.superclass.constructor.call(this, el, userConfig);
    };

    var Lang = YAHOO.lang,
        Event = YAHOO.util.Event,
        CustomEvent = YAHOO.util.CustomEvent,
        Dom = YAHOO.util.Dom,
        Tooltip = YAHOO.widget.Tooltip,
        UA = YAHOO.env.ua,
        bIEQuirks = (UA.ie && (UA.ie <= 6 || document.compatMode == "BackCompat")),

        m_oShadowTemplate,

        /**
        * Constant representing the Tooltip's configuration properties
        * @property DEFAULT_CONFIG
        * @private
        * @final
        * @type Object
        */
        DEFAULT_CONFIG = {

            "PREVENT_OVERLAP": { 
                key: "preventoverlap", 
                value: true, 
                validator: Lang.isBoolean, 
                supercedes: ["x", "y", "xy"] 
            },

            "SHOW_DELAY": { 
                key: "showdelay", 
                value: 200, 
                validator: Lang.isNumber 
            }, 

            "AUTO_DISMISS_DELAY": { 
                key: "autodismissdelay", 
                value: 5000, 
                validator: Lang.isNumber 
            }, 

            "HIDE_DELAY": { 
                key: "hidedelay", 
                value: 250, 
                validator: Lang.isNumber 
            }, 

            "TEXT": { 
                key: "text", 
                suppressEvent: true 
            }, 

            "CONTAINER": { 
                key: "container"
            },

            "DISABLED": {
                key: "disabled",
                value: false,
                suppressEvent: true
            },

            "XY_OFFSET": {
                key: "xyoffset",
                value: [0, 25],
                suppressEvent: true
            }
        },

        /**
        * Constant representing the name of the Tooltip's events
        * @property EVENT_TYPES
        * @private
        * @final
        * @type Object
        */
        EVENT_TYPES = {
            "CONTEXT_MOUSE_OVER": "contextMouseOver",
            "CONTEXT_MOUSE_OUT": "contextMouseOut",
            "CONTEXT_TRIGGER": "contextTrigger"
        };

    /**
    * Constant representing the Tooltip CSS class
    * @property YAHOO.widget.Tooltip.CSS_TOOLTIP
    * @static
    * @final
    * @type String
    */
    Tooltip.CSS_TOOLTIP = "yui-tt";

    function restoreOriginalWidth(sOriginalWidth, sForcedWidth) {

        var oConfig = this.cfg,
            sCurrentWidth = oConfig.getProperty("width");

        if (sCurrentWidth == sForcedWidth) {
            oConfig.setProperty("width", sOriginalWidth);
        }
    }

    /* 
        changeContent event handler that sets a Tooltip instance's "width"
        configuration property to the value of its root HTML 
        elements's offsetWidth if a specific width has not been set.
    */

    function setWidthToOffsetWidth(p_sType, p_aArgs) {

        if ("_originalWidth" in this) {
            restoreOriginalWidth.call(this, this._originalWidth, this._forcedWidth);
        }

        var oBody = document.body,
            oConfig = this.cfg,
            sOriginalWidth = oConfig.getProperty("width"),
            sNewWidth,
            oClone;

        if ((!sOriginalWidth || sOriginalWidth == "auto") && 
            (oConfig.getProperty("container") != oBody || 
            oConfig.getProperty("x") >= Dom.getViewportWidth() || 
            oConfig.getProperty("y") >= Dom.getViewportHeight())) {

            oClone = this.element.cloneNode(true);
            oClone.style.visibility = "hidden";
            oClone.style.top = "0px";
            oClone.style.left = "0px";

            oBody.appendChild(oClone);

            sNewWidth = (oClone.offsetWidth + "px");

            oBody.removeChild(oClone);
            oClone = null;

            oConfig.setProperty("width", sNewWidth);
            oConfig.refireEvent("xy");

            this._originalWidth = sOriginalWidth || "";
            this._forcedWidth = sNewWidth;
        }
    }

    // "onDOMReady" that renders the ToolTip

    function onDOMReady(p_sType, p_aArgs, p_oObject) {
        this.render(p_oObject);
    }

    //  "init" event handler that automatically renders the Tooltip

    function onInit() {
        Event.onDOMReady(onDOMReady, this.cfg.getProperty("container"), this);
    }

    YAHOO.extend(Tooltip, YAHOO.widget.Overlay, { 

        /**
        * The Tooltip initialization method. This method is automatically 
        * called by the constructor. A Tooltip is automatically rendered by 
        * the init method, and it also is set to be invisible by default, 
        * and constrained to viewport by default as well.
        * @method init
        * @param {String} el The element ID representing the Tooltip <em>OR</em>
        * @param {HTMLElement} el The element representing the Tooltip
        * @param {Object} userConfig The configuration object literal 
        * containing the configuration that should be set for this Tooltip. 
        * See configuration documentation for more details.
        */
        init: function (el, userConfig) {


            Tooltip.superclass.init.call(this, el);

            this.beforeInitEvent.fire(Tooltip);

            Dom.addClass(this.element, Tooltip.CSS_TOOLTIP);

            if (userConfig) {
                this.cfg.applyConfig(userConfig, true);
            }

            this.cfg.queueProperty("visible", false);
            this.cfg.queueProperty("constraintoviewport", true);

            this.setBody("");

            this.subscribe("changeContent", setWidthToOffsetWidth);
            this.subscribe("init", onInit);
            this.subscribe("render", this.onRender);

            this.initEvent.fire(Tooltip);
        },

        /**
        * Initializes the custom events for Tooltip
        * @method initEvents
        */
        initEvents: function () {

            Tooltip.superclass.initEvents.call(this);
            var SIGNATURE = CustomEvent.LIST;

            /**
            * CustomEvent fired when user mouses over a context element. Returning false from
            * a subscriber to this event will prevent the tooltip from being displayed for
            * the current context element.
            * 
            * @event contextMouseOverEvent
            * @param {HTMLElement} context The context element which the user just moused over
            * @param {DOMEvent} e The DOM event object, associated with the mouse over
            */
            this.contextMouseOverEvent = this.createEvent(EVENT_TYPES.CONTEXT_MOUSE_OVER);
            this.contextMouseOverEvent.signature = SIGNATURE;

            /**
            * CustomEvent fired when the user mouses out of a context element.
            * 
            * @event contextMouseOutEvent
            * @param {HTMLElement} context The context element which the user just moused out of
            * @param {DOMEvent} e The DOM event object, associated with the mouse out
            */
            this.contextMouseOutEvent = this.createEvent(EVENT_TYPES.CONTEXT_MOUSE_OUT);
            this.contextMouseOutEvent.signature = SIGNATURE;

            /**
            * CustomEvent fired just before the tooltip is displayed for the current context.
            * <p>
            *  You can subscribe to this event if you need to set up the text for the 
            *  tooltip based on the context element for which it is about to be displayed.
            * </p>
            * <p>This event differs from the beforeShow event in following respects:</p>
            * <ol>
            *   <li>
            *    When moving from one context element to another, if the tooltip is not
            *    hidden (the <code>hidedelay</code> is not reached), the beforeShow and Show events will not
            *    be fired when the tooltip is displayed for the new context since it is already visible.
            *    However the contextTrigger event is always fired before displaying the tooltip for
            *    a new context.
            *   </li>
            *   <li>
            *    The trigger event provides access to the context element, allowing you to 
            *    set the text of the tooltip based on context element for which the tooltip is
            *    triggered.
            *   </li>
            * </ol>
            * <p>
            *  It is not possible to prevent the tooltip from being displayed
            *  using this event. You can use the contextMouseOverEvent if you need to prevent
            *  the tooltip from being displayed.
            * </p>
            * @event contextTriggerEvent
            * @param {HTMLElement} context The context element for which the tooltip is triggered
            */
            this.contextTriggerEvent = this.createEvent(EVENT_TYPES.CONTEXT_TRIGGER);
            this.contextTriggerEvent.signature = SIGNATURE;
        },

        /**
        * Initializes the class's configurable properties which can be 
        * changed using the Overlay's Config object (cfg).
        * @method initDefaultConfig
        */
        initDefaultConfig: function () {

            Tooltip.superclass.initDefaultConfig.call(this);

            /**
            * Specifies whether the Tooltip should be kept from overlapping 
            * its context element.
            * @config preventoverlap
            * @type Boolean
            * @default true
            */
            this.cfg.addProperty(DEFAULT_CONFIG.PREVENT_OVERLAP.key, {
                value: DEFAULT_CONFIG.PREVENT_OVERLAP.value, 
                validator: DEFAULT_CONFIG.PREVENT_OVERLAP.validator, 
                supercedes: DEFAULT_CONFIG.PREVENT_OVERLAP.supercedes
            });

            /**
            * The number of milliseconds to wait before showing a Tooltip 
            * on mouseover.
            * @config showdelay
            * @type Number
            * @default 200
            */
            this.cfg.addProperty(DEFAULT_CONFIG.SHOW_DELAY.key, {
                handler: this.configShowDelay,
                value: 200, 
                validator: DEFAULT_CONFIG.SHOW_DELAY.validator
            });

            /**
            * The number of milliseconds to wait before automatically 
            * dismissing a Tooltip after the mouse has been resting on the 
            * context element.
            * @config autodismissdelay
            * @type Number
            * @default 5000
            */
            this.cfg.addProperty(DEFAULT_CONFIG.AUTO_DISMISS_DELAY.key, {
                handler: this.configAutoDismissDelay,
                value: DEFAULT_CONFIG.AUTO_DISMISS_DELAY.value,
                validator: DEFAULT_CONFIG.AUTO_DISMISS_DELAY.validator
            });

            /**
            * The number of milliseconds to wait before hiding a Tooltip 
            * after mouseout.
            * @config hidedelay
            * @type Number
            * @default 250
            */
            this.cfg.addProperty(DEFAULT_CONFIG.HIDE_DELAY.key, {
                handler: this.configHideDelay,
                value: DEFAULT_CONFIG.HIDE_DELAY.value, 
                validator: DEFAULT_CONFIG.HIDE_DELAY.validator
            });

            /**
            * Specifies the Tooltip's text. The text is inserted into the DOM as HTML, and should be escaped by the implementor if coming from an external source. 
            * @config text
            * @type HTML
            * @default null
            */
            this.cfg.addProperty(DEFAULT_CONFIG.TEXT.key, {
                handler: this.configText,
                suppressEvent: DEFAULT_CONFIG.TEXT.suppressEvent
            });

            /**
            * Specifies the container element that the Tooltip's markup 
            * should be rendered into.
            * @config container
            * @type HTMLElement/String
            * @default document.body
            */
            this.cfg.addProperty(DEFAULT_CONFIG.CONTAINER.key, {
                handler: this.configContainer,
                value: document.body
            });

            /**
            * Specifies whether or not the tooltip is disabled. Disabled tooltips
            * will not be displayed. If the tooltip is driven by the title attribute
            * of the context element, the title attribute will still be removed for 
            * disabled tooltips, to prevent default tooltip behavior.
            * 
            * @config disabled
            * @type Boolean
            * @default false
            */
            this.cfg.addProperty(DEFAULT_CONFIG.DISABLED.key, {
                handler: this.configContainer,
                value: DEFAULT_CONFIG.DISABLED.value,
                supressEvent: DEFAULT_CONFIG.DISABLED.suppressEvent
            });

            /**
            * Specifies the XY offset from the mouse position, where the tooltip should be displayed, specified
            * as a 2 element array (e.g. [10, 20]); 
            *
            * @config xyoffset
            * @type Array
            * @default [0, 25]
            */
            this.cfg.addProperty(DEFAULT_CONFIG.XY_OFFSET.key, {
                value: DEFAULT_CONFIG.XY_OFFSET.value.concat(),
                supressEvent: DEFAULT_CONFIG.XY_OFFSET.suppressEvent 
            });

            /**
            * Specifies the element or elements that the Tooltip should be 
            * anchored to on mouseover.
            * @config context
            * @type HTMLElement[]/String[]
            * @default null
            */ 

            /**
            * String representing the width of the Tooltip.  <em>Please note:
            * </em> As of version 2.3 if either no value or a value of "auto" 
            * is specified, and the Toolip's "container" configuration property
            * is set to something other than <code>document.body</code> or 
            * its "context" element resides outside the immediately visible 
            * portion of the document, the width of the Tooltip will be 
            * calculated based on the offsetWidth of its root HTML and set just 
            * before it is made visible.  The original value will be 
            * restored when the Tooltip is hidden. This ensures the Tooltip is 
            * rendered at a usable width.  For more information see 
            * YUILibrary bug #1685496 and YUILibrary 
            * bug #1735423.
            * @config width
            * @type String
            * @default null
            */
        
        },
        
        // BEGIN BUILT-IN PROPERTY EVENT HANDLERS //
        
        /**
        * The default event handler fired when the "text" property is changed.
        * @method configText
        * @param {String} type The CustomEvent type (usually the property name)
        * @param {Object[]} args The CustomEvent arguments. For configuration 
        * handlers, args[0] will equal the newly applied value for the property.
        * @param {Object} obj The scope object. For configuration handlers, 
        * this will usually equal the owner.
        */
        configText: function (type, args, obj) {
            var text = args[0];
            if (text) {
                this.setBody(text);
            }
        },
        
        /**
        * The default event handler fired when the "container" property 
        * is changed.
        * @method configContainer
        * @param {String} type The CustomEvent type (usually the property name)
        * @param {Object[]} args The CustomEvent arguments. For 
        * configuration handlers, args[0] will equal the newly applied value 
        * for the property.
        * @param {Object} obj The scope object. For configuration handlers,
        * this will usually equal the owner.
        */
        configContainer: function (type, args, obj) {
            var container = args[0];

            if (typeof container == 'string') {
                this.cfg.setProperty("container", document.getElementById(container), true);
            }
        },
        
        /**
        * @method _removeEventListeners
        * @description Removes all of the DOM event handlers from the HTML
        *  element(s) that trigger the display of the tooltip.
        * @protected
        */
        _removeEventListeners: function () {
        
            var aElements = this._context,
                nElements,
                oElement,
                i;

            if (aElements) {
                nElements = aElements.length;
                if (nElements > 0) {
                    i = nElements - 1;
                    do {
                        oElement = aElements[i];
                        Event.removeListener(oElement, "mouseover", this.onContextMouseOver);
                        Event.removeListener(oElement, "mousemove", this.onContextMouseMove);
                        Event.removeListener(oElement, "mouseout", this.onContextMouseOut);
                    }
                    while (i--);
                }
            }
        },
        
        /**
        * The default event handler fired when the "context" property 
        * is changed.
        * @method configContext
        * @param {String} type The CustomEvent type (usually the property name)
        * @param {Object[]} args The CustomEvent arguments. For configuration 
        * handlers, args[0] will equal the newly applied value for the property.
        * @param {Object} obj The scope object. For configuration handlers,
        * this will usually equal the owner.
        */
        configContext: function (type, args, obj) {

            var context = args[0],
                aElements,
                nElements,
                oElement,
                i;

            if (context) {

                // Normalize parameter into an array
                if (! (context instanceof Array)) {
                    if (typeof context == "string") {
                        this.cfg.setProperty("context", [document.getElementById(context)], true);
                    } else { // Assuming this is an element
                        this.cfg.setProperty("context", [context], true);
                    }
                    context = this.cfg.getProperty("context");
                }

                // Remove any existing mouseover/mouseout listeners
                this._removeEventListeners();

                // Add mouseover/mouseout listeners to context elements
                this._context = context;

                aElements = this._context;

                if (aElements) {
                    nElements = aElements.length;
                    if (nElements > 0) {
                        i = nElements - 1;
                        do {
                            oElement = aElements[i];
                            Event.on(oElement, "mouseover", this.onContextMouseOver, this);
                            Event.on(oElement, "mousemove", this.onContextMouseMove, this);
                            Event.on(oElement, "mouseout", this.onContextMouseOut, this);
                        }
                        while (i--);
                    }
                }
            }
        },

        // END BUILT-IN PROPERTY EVENT HANDLERS //

        // BEGIN BUILT-IN DOM EVENT HANDLERS //

        /**
        * The default event handler fired when the user moves the mouse while 
        * over the context element.
        * @method onContextMouseMove
        * @param {DOMEvent} e The current DOM event
        * @param {Object} obj The object argument
        */
        onContextMouseMove: function (e, obj) {
            obj.pageX = Event.getPageX(e);
            obj.pageY = Event.getPageY(e);
        },

        /**
        * The default event handler fired when the user mouses over the 
        * context element.
        * @method onContextMouseOver
        * @param {DOMEvent} e The current DOM event
        * @param {Object} obj The object argument
        */
        onContextMouseOver: function (e, obj) {
            var context = this;

            if (context.title) {
                obj._tempTitle = context.title;
                context.title = "";
            }

            // Fire first, to honor disabled set in the listner
            if (obj.fireEvent("contextMouseOver", context, e) !== false && !obj.cfg.getProperty("disabled")) {

                // Stop the tooltip from being hidden (set on last mouseout)
                if (obj.hideProcId) {
                    clearTimeout(obj.hideProcId);
                    obj.hideProcId = null;
                }

                Event.on(context, "mousemove", obj.onContextMouseMove, obj);

                /**
                * The unique process ID associated with the thread responsible 
                * for showing the Tooltip.
                * @type int
                */
                obj.showProcId = obj.doShow(e, context);
            }
        },

        /**
        * The default event handler fired when the user mouses out of 
        * the context element.
        * @method onContextMouseOut
        * @param {DOMEvent} e The current DOM event
        * @param {Object} obj The object argument
        */
        onContextMouseOut: function (e, obj) {
            var el = this;

            if (obj._tempTitle) {
                el.title = obj._tempTitle;
                obj._tempTitle = null;
            }

            if (obj.showProcId) {
                clearTimeout(obj.showProcId);
                obj.showProcId = null;
            }

            if (obj.hideProcId) {
                clearTimeout(obj.hideProcId);
                obj.hideProcId = null;
            }

            obj.fireEvent("contextMouseOut", el, e);

            obj.hideProcId = setTimeout(function () {
                obj.hide();
            }, obj.cfg.getProperty("hidedelay"));
        },

        // END BUILT-IN DOM EVENT HANDLERS //

        /**
        * Processes the showing of the Tooltip by setting the timeout delay 
        * and offset of the Tooltip.
        * @method doShow
        * @param {DOMEvent} e The current DOM event
        * @param {HTMLElement} context The current context element
        * @return {Number} The process ID of the timeout function associated 
        * with doShow
        */
        doShow: function (e, context) {

            var offset = this.cfg.getProperty("xyoffset"),
                xOffset = offset[0],
                yOffset = offset[1],
                me = this;

            if (UA.opera && context.tagName && 
                context.tagName.toUpperCase() == "A") {
                yOffset += 12;
            }

            return setTimeout(function () {

                var txt = me.cfg.getProperty("text");

                // title does not over-ride text
                if (me._tempTitle && (txt === "" || YAHOO.lang.isUndefined(txt) || YAHOO.lang.isNull(txt))) {
                    me.setBody(me._tempTitle);
                } else {
                    me.cfg.refireEvent("text");
                }

                me.moveTo(me.pageX + xOffset, me.pageY + yOffset);

                if (me.cfg.getProperty("preventoverlap")) {
                    me.preventOverlap(me.pageX, me.pageY);
                }

                Event.removeListener(context, "mousemove", me.onContextMouseMove);

                me.contextTriggerEvent.fire(context);

                me.show();

                me.hideProcId = me.doHide();

            }, this.cfg.getProperty("showdelay"));
        },

        /**
        * Sets the timeout for the auto-dismiss delay, which by default is 5 
        * seconds, meaning that a tooltip will automatically dismiss itself 
        * after 5 seconds of being displayed.
        * @method doHide
        */
        doHide: function () {

            var me = this;


            return setTimeout(function () {

                me.hide();

            }, this.cfg.getProperty("autodismissdelay"));

        },

        /**
        * Fired when the Tooltip is moved, this event handler is used to 
        * prevent the Tooltip from overlapping with its context element.
        * @method preventOverlay
        * @param {Number} pageX The x coordinate position of the mouse pointer
        * @param {Number} pageY The y coordinate position of the mouse pointer
        */
        preventOverlap: function (pageX, pageY) {
        
            var height = this.element.offsetHeight,
                mousePoint = new YAHOO.util.Point(pageX, pageY),
                elementRegion = Dom.getRegion(this.element);
        
            elementRegion.top -= 5;
            elementRegion.left -= 5;
            elementRegion.right += 5;
            elementRegion.bottom += 5;
        
        
            if (elementRegion.contains(mousePoint)) {
                this.cfg.setProperty("y", (pageY - height - 5));
            }
        },


        /**
        * @method onRender
        * @description "render" event handler for the Tooltip.
        * @param {String} p_sType String representing the name of the event  
        * that was fired.
        * @param {Array} p_aArgs Array of arguments sent when the event 
        * was fired.
        */
        onRender: function (p_sType, p_aArgs) {
    
            function sizeShadow() {
    
                var oElement = this.element,
                    oShadow = this.underlay;
            
                if (oShadow) {
                    oShadow.style.width = (oElement.offsetWidth + 6) + "px";
                    oShadow.style.height = (oElement.offsetHeight + 1) + "px"; 
                }
            
            }

            function addShadowVisibleClass() {
                Dom.addClass(this.underlay, "yui-tt-shadow-visible");

                if (UA.ie) {
                    this.forceUnderlayRedraw();
                }
            }

            function removeShadowVisibleClass() {
                Dom.removeClass(this.underlay, "yui-tt-shadow-visible");
            }

            function createShadow() {
    
                var oShadow = this.underlay,
                    oElement,
                    Module,
                    nIE,
                    me;
    
                if (!oShadow) {
    
                    oElement = this.element;
                    Module = YAHOO.widget.Module;
                    nIE = UA.ie;
                    me = this;

                    if (!m_oShadowTemplate) {
                        m_oShadowTemplate = document.createElement("div");
                        m_oShadowTemplate.className = "yui-tt-shadow";
                    }

                    oShadow = m_oShadowTemplate.cloneNode(false);

                    oElement.appendChild(oShadow);

                    this.underlay = oShadow;

                    // Backward compatibility, even though it's probably 
                    // intended to be "private", it isn't marked as such in the api docs
                    this._shadow = this.underlay;

                    addShadowVisibleClass.call(this);

                    this.subscribe("beforeShow", addShadowVisibleClass);
                    this.subscribe("hide", removeShadowVisibleClass);

                    if (bIEQuirks) {
                        window.setTimeout(function () { 
                            sizeShadow.call(me); 
                        }, 0);
    
                        this.cfg.subscribeToConfigEvent("width", sizeShadow);
                        this.cfg.subscribeToConfigEvent("height", sizeShadow);
                        this.subscribe("changeContent", sizeShadow);

                        Module.textResizeEvent.subscribe(sizeShadow, this, true);
                        this.subscribe("destroy", function () {
                            Module.textResizeEvent.unsubscribe(sizeShadow, this);
                        });
                    }
                }
            }

            function onBeforeShow() {
                createShadow.call(this);
                this.unsubscribe("beforeShow", onBeforeShow);
            }

            if (this.cfg.getProperty("visible")) {
                createShadow.call(this);
            } else {
                this.subscribe("beforeShow", onBeforeShow);
            }
        
        },

        /**
         * Forces the underlay element to be repainted, through the application/removal
         * of a yui-force-redraw class to the underlay element.
         * 
         * @method forceUnderlayRedraw
         */
        forceUnderlayRedraw : function() {
            var tt = this;
            Dom.addClass(tt.underlay, "yui-force-redraw");
            setTimeout(function() {Dom.removeClass(tt.underlay, "yui-force-redraw");}, 0);
        },

        /**
        * Removes the Tooltip element from the DOM and sets all child 
        * elements to null.
        * @method destroy
        */
        destroy: function () {
        
            // Remove any existing mouseover/mouseout listeners
            this._removeEventListeners();

            Tooltip.superclass.destroy.call(this);  
        
        },
        
        /**
        * Returns a string representation of the object.
        * @method toString
        * @return {String} The string representation of the Tooltip
        */
        toString: function () {
            return "Tooltip " + this.id;
        }
    
    });

}());
(function () {

    /**
    * Panel is an implementation of Overlay that behaves like an OS window, 
    * with a draggable header and an optional close icon at the top right.
    * @namespace YAHOO.widget
    * @class Panel
    * @extends YAHOO.widget.Overlay
    * @constructor
    * @param {String} el The element ID representing the Panel <em>OR</em>
    * @param {HTMLElement} el The element representing the Panel
    * @param {Object} userConfig The configuration object literal containing 
    * the configuration that should be set for this Panel. See configuration 
    * documentation for more details.
    */
    YAHOO.widget.Panel = function (el, userConfig) {
        YAHOO.widget.Panel.superclass.constructor.call(this, el, userConfig);
    };

    var _currentModal = null;

    var Lang = YAHOO.lang,
        Util = YAHOO.util,
        Dom = Util.Dom,
        Event = Util.Event,
        CustomEvent = Util.CustomEvent,
        KeyListener = YAHOO.util.KeyListener,
        Config = Util.Config,
        Overlay = YAHOO.widget.Overlay,
        Panel = YAHOO.widget.Panel,
        UA = YAHOO.env.ua,

        bIEQuirks = (UA.ie && (UA.ie <= 6 || document.compatMode == "BackCompat")),

        m_oMaskTemplate,
        m_oUnderlayTemplate,
        m_oCloseIconTemplate,

        /**
        * Constant representing the name of the Panel's events
        * @property EVENT_TYPES
        * @private
        * @final
        * @type Object
        */
        EVENT_TYPES = {
            "BEFORE_SHOW_MASK" : "beforeShowMask",
            "BEFORE_HIDE_MASK" : "beforeHideMask",
            "SHOW_MASK": "showMask",
            "HIDE_MASK": "hideMask",
            "DRAG": "drag"
        },

        /**
        * Constant representing the Panel's configuration properties
        * @property DEFAULT_CONFIG
        * @private
        * @final
        * @type Object
        */
        DEFAULT_CONFIG = {

            "CLOSE": { 
                key: "close", 
                value: true, 
                validator: Lang.isBoolean, 
                supercedes: ["visible"] 
            },

            "DRAGGABLE": {
                key: "draggable", 
                value: (Util.DD ? true : false), 
                validator: Lang.isBoolean, 
                supercedes: ["visible"]  
            },

            "DRAG_ONLY" : {
                key: "dragonly",
                value: false,
                validator: Lang.isBoolean,
                supercedes: ["draggable"]
            },

            "UNDERLAY": { 
                key: "underlay", 
                value: "shadow", 
                supercedes: ["visible"] 
            },

            "MODAL": { 
                key: "modal", 
                value: false, 
                validator: Lang.isBoolean, 
                supercedes: ["visible", "zindex"]
            },

            "KEY_LISTENERS": {
                key: "keylisteners",
                suppressEvent: true,
                supercedes: ["visible"]
            },

            "STRINGS" : {
                key: "strings",
                supercedes: ["close"],
                validator: Lang.isObject,
                value: {
                    close: "Close"
                }
            }
        };

    /**
    * Constant representing the default CSS class used for a Panel
    * @property YAHOO.widget.Panel.CSS_PANEL
    * @static
    * @final
    * @type String
    */
    Panel.CSS_PANEL = "yui-panel";
    
    /**
    * Constant representing the default CSS class used for a Panel's 
    * wrapping container
    * @property YAHOO.widget.Panel.CSS_PANEL_CONTAINER
    * @static
    * @final
    * @type String
    */
    Panel.CSS_PANEL_CONTAINER = "yui-panel-container";

    /**
     * Constant representing the default set of focusable elements 
     * on the pagewhich Modal Panels will prevent access to, when
     * the modal mask is displayed
     * 
     * @property YAHOO.widget.Panel.FOCUSABLE
     * @static
     * @type Array
     */
    Panel.FOCUSABLE = [
        "a",
        "button",
        "select",
        "textarea",
        "input",
        "iframe"
    ];

    // Private CustomEvent listeners

    /* 
        "beforeRender" event handler that creates an empty header for a Panel 
        instance if its "draggable" configuration property is set to "true" 
        and no header has been created.
    */

    function createHeader(p_sType, p_aArgs) {
        if (!this.header && this.cfg.getProperty("draggable")) {
            this.setHeader("&#160;");
        }
    }

    /* 
        "hide" event handler that sets a Panel instance's "width"
        configuration property back to its original value before 
        "setWidthToOffsetWidth" was called.
    */

    function restoreOriginalWidth(p_sType, p_aArgs, p_oObject) {

        var sOriginalWidth = p_oObject[0],
            sNewWidth = p_oObject[1],
            oConfig = this.cfg,
            sCurrentWidth = oConfig.getProperty("width");

        if (sCurrentWidth == sNewWidth) {
            oConfig.setProperty("width", sOriginalWidth);
        }

        this.unsubscribe("hide", restoreOriginalWidth, p_oObject);
    }

    /* 
        "beforeShow" event handler that sets a Panel instance's "width"
        configuration property to the value of its root HTML 
        elements's offsetWidth
    */

    function setWidthToOffsetWidth(p_sType, p_aArgs) {

        var oConfig,
            sOriginalWidth,
            sNewWidth;

        if (bIEQuirks) {

            oConfig = this.cfg;
            sOriginalWidth = oConfig.getProperty("width");
            
            if (!sOriginalWidth || sOriginalWidth == "auto") {
    
                sNewWidth = (this.element.offsetWidth + "px");
    
                oConfig.setProperty("width", sNewWidth);

                this.subscribe("hide", restoreOriginalWidth, 
                    [(sOriginalWidth || ""), sNewWidth]);
            
            }
        }
    }

    YAHOO.extend(Panel, Overlay, {

        /**
        * The Overlay initialization method, which is executed for Overlay and 
        * all of its subclasses. This method is automatically called by the 
        * constructor, and  sets up all DOM references for pre-existing markup, 
        * and creates required markup if it is not already present.
        * @method init
        * @param {String} el The element ID representing the Overlay <em>OR</em>
        * @param {HTMLElement} el The element representing the Overlay
        * @param {Object} userConfig The configuration object literal 
        * containing the configuration that should be set for this Overlay. 
        * See configuration documentation for more details.
        */
        init: function (el, userConfig) {
            /*
                 Note that we don't pass the user config in here yet because 
                 we only want it executed once, at the lowest subclass level
            */

            Panel.superclass.init.call(this, el/*, userConfig*/);

            this.beforeInitEvent.fire(Panel);

            Dom.addClass(this.element, Panel.CSS_PANEL);

            this.buildWrapper();

            if (userConfig) {
                this.cfg.applyConfig(userConfig, true);
            }

            this.subscribe("showMask", this._addFocusHandlers);
            this.subscribe("hideMask", this._removeFocusHandlers);
            this.subscribe("beforeRender", createHeader);

            this.subscribe("render", function() {
                this.setFirstLastFocusable();
                this.subscribe("changeContent", this.setFirstLastFocusable);
            });

            this.subscribe("show", this._focusOnShow);

            this.initEvent.fire(Panel);
        },

        /**
         * @method _onElementFocus
         * @private
         *
         * "focus" event handler for a focuable element. Used to automatically
         * blur the element when it receives focus to ensure that a Panel
         * instance's modality is not compromised.
         *
         * @param {Event} e The DOM event object
         */
        _onElementFocus : function(e){

            if(_currentModal === this) {

                var target = Event.getTarget(e),
                    doc = document.documentElement,
                    insideDoc = (target !== doc && target !== window);

                // mask and documentElement checks added for IE, which focuses on the mask when it's clicked on, and focuses on 
                // the documentElement, when the document scrollbars are clicked on
                if (insideDoc && target !== this.element && target !== this.mask && !Dom.isAncestor(this.element, target)) {
                    try {
                        this._focusFirstModal();
                    } catch(err){
                        // Just in case we fail to focus
                        try {
                            if (insideDoc && target !== document.body) {
                                target.blur();
                            }
                        } catch(err2) { }
                    }
                }
            }
        },

        /**
         * Focuses on the first element if present, otherwise falls back to the focus mechanisms used for 
         * modality. This method does not try/catch focus failures. The caller is responsible for catching exceptions,
         * and taking remedial measures.
         * 
         * @method _focusFirstModal
         */
        _focusFirstModal : function() {
            var el = this.firstElement;
            if (el) {
                el.focus();
            } else {
                if (this._modalFocus) {
                    this._modalFocus.focus();
                } else {
                    this.innerElement.focus();
                }
            }
        },

        /** 
         *  @method _addFocusHandlers
         *  @protected
         *  
         *  "showMask" event handler that adds a "focus" event handler to all
         *  focusable elements in the document to enforce a Panel instance's 
         *  modality from being compromised.
         *
         *  @param p_sType {String} Custom event type
         *  @param p_aArgs {Array} Custom event arguments
         */
        _addFocusHandlers: function(p_sType, p_aArgs) {
            if (!this.firstElement) {
                if (UA.webkit || UA.opera) {
                    if (!this._modalFocus) {
                        this._createHiddenFocusElement();
                    }
                } else {
                    this.innerElement.tabIndex = 0;
                }
            }
            this._setTabLoop(this.firstElement, this.lastElement);
            Event.onFocus(document.documentElement, this._onElementFocus, this, true);
            _currentModal = this;
        },

        /**
         * Creates a hidden focusable element, used to focus on,
         * to enforce modality for browsers in which focus cannot
         * be applied to the container box.
         * 
         * @method _createHiddenFocusElement
         * @private
         */
        _createHiddenFocusElement : function() {
            var e = document.createElement("button");
            e.style.height = "1px";
            e.style.width = "1px";
            e.style.position = "absolute";
            e.style.left = "-10000em";
            e.style.opacity = 0;
            e.tabIndex = -1;
            this.innerElement.appendChild(e);
            this._modalFocus = e;
        },

        /**
         *  @method _removeFocusHandlers
         *  @protected
         *
         *  "hideMask" event handler that removes all "focus" event handlers added 
         *  by the "addFocusEventHandlers" method.
         *
         *  @param p_sType {String} Event type
         *  @param p_aArgs {Array} Event Arguments
         */
        _removeFocusHandlers: function(p_sType, p_aArgs) {
            Event.removeFocusListener(document.documentElement, this._onElementFocus, this);

            if (_currentModal == this) {
                _currentModal = null;
            }
        },

        /**
         * Focus handler for the show event
         *
         * @method _focusOnShow
         * @param {String} type Event Type
         * @param {Array} args Event arguments
         * @param {Object} obj Additional data 
         */
        _focusOnShow : function(type, args, obj) {

            if (args && args[1]) {
                Event.stopEvent(args[1]);
            }

            if (!this.focusFirst(type, args, obj)) {
                if (this.cfg.getProperty("modal")) {
                    this._focusFirstModal();
                }
            }
        },

        /**
         * Sets focus to the first element in the Panel.
         *
         * @method focusFirst
         * @return {Boolean} true, if successfully focused, false otherwise 
         */
        focusFirst: function (type, args, obj) {
            var el = this.firstElement, focused = false;

            if (args && args[1]) {
                Event.stopEvent(args[1]);
            }

            if (el) {
                try {
                    el.focus();
                    focused = true;
                } catch(err) {
                    // Ignore
                }
            }

            return focused;
        },

        /**
         * Sets focus to the last element in the Panel.
         *
         * @method focusLast
         * @return {Boolean} true, if successfully focused, false otherwise
         */
        focusLast: function (type, args, obj) {
            var el = this.lastElement, focused = false;

            if (args && args[1]) {
                Event.stopEvent(args[1]);
            }

            if (el) {
                try {
                    el.focus();
                    focused = true;
                } catch(err) {
                    // Ignore
                }
            }

            return focused;
        },

        /**
         * Protected internal method for setTabLoop, which can be used by 
         * subclasses to jump in and modify the arguments passed in if required.
         *
         * @method _setTabLoop
         * @param {HTMLElement} firstElement
         * @param {HTMLElement} lastElement
         * @protected
         *
         */
        _setTabLoop : function(firstElement, lastElement) {
            this.setTabLoop(firstElement, lastElement);
        },

        /**
         * Sets up a tab, shift-tab loop between the first and last elements
         * provided. NOTE: Sets up the preventBackTab and preventTabOut KeyListener
         * instance properties, which are reset everytime this method is invoked.
         *
         * @method setTabLoop
         * @param {HTMLElement} firstElement
         * @param {HTMLElement} lastElement
         *
         */
        setTabLoop : function(firstElement, lastElement) {

            var backTab = this.preventBackTab, tab = this.preventTabOut,
                showEvent = this.showEvent, hideEvent = this.hideEvent;

            if (backTab) {
                backTab.disable();
                showEvent.unsubscribe(backTab.enable, backTab);
                hideEvent.unsubscribe(backTab.disable, backTab);
                backTab = this.preventBackTab = null;
            }

            if (tab) {
                tab.disable();
                showEvent.unsubscribe(tab.enable, tab);
                hideEvent.unsubscribe(tab.disable,tab);
                tab = this.preventTabOut = null;
            }

            if (firstElement) {
                this.preventBackTab = new KeyListener(firstElement, 
                    {shift:true, keys:9},
                    {fn:this.focusLast, scope:this, correctScope:true}
                );
                backTab = this.preventBackTab;

                showEvent.subscribe(backTab.enable, backTab, true);
                hideEvent.subscribe(backTab.disable,backTab, true);
            }

            if (lastElement) {
                this.preventTabOut = new KeyListener(lastElement, 
                    {shift:false, keys:9}, 
                    {fn:this.focusFirst, scope:this, correctScope:true}
                );
                tab = this.preventTabOut;

                showEvent.subscribe(tab.enable, tab, true);
                hideEvent.subscribe(tab.disable,tab, true);
            }
        },

        /**
         * Returns an array of the currently focusable items which reside within
         * Panel. The set of focusable elements the method looks for are defined
         * in the Panel.FOCUSABLE static property
         *
         * @method getFocusableElements
         * @param {HTMLElement} root element to start from.
         */
        getFocusableElements : function(root) {

            root = root || this.innerElement;

            var focusable = {}, panel = this;
            for (var i = 0; i < Panel.FOCUSABLE.length; i++) {
                focusable[Panel.FOCUSABLE[i]] = true;
            }

            // Not looking by Tag, since we want elements in DOM order
            
            return Dom.getElementsBy(function(el) { return panel._testIfFocusable(el, focusable); }, null, root);
        },

        /**
         * This is the test method used by getFocusableElements, to determine which elements to 
         * include in the focusable elements list. Users may override this to customize behavior.
         *
         * @method _testIfFocusable
         * @param {Object} el The element being tested
         * @param {Object} focusable The hash of known focusable elements, created by an array-to-map operation on Panel.FOCUSABLE
         * @protected
         */
        _testIfFocusable: function(el, focusable) {
            if (el.focus && el.type !== "hidden" && !el.disabled && focusable[el.tagName.toLowerCase()]) {
                return true;
            }
            return false;
        },

        /**
         * Sets the firstElement and lastElement instance properties
         * to the first and last focusable elements in the Panel.
         *
         * @method setFirstLastFocusable
         */
        setFirstLastFocusable : function() {

            this.firstElement = null;
            this.lastElement = null;

            var elements = this.getFocusableElements();
            this.focusableElements = elements;

            if (elements.length > 0) {
                this.firstElement = elements[0];
                this.lastElement = elements[elements.length - 1];
            }

            if (this.cfg.getProperty("modal")) {
                this._setTabLoop(this.firstElement, this.lastElement);
            }
        },

        /**
         * Initializes the custom events for Module which are fired 
         * automatically at appropriate times by the Module class.
         */
        initEvents: function () {
            Panel.superclass.initEvents.call(this);

            var SIGNATURE = CustomEvent.LIST;

            /**
            * CustomEvent fired after the modality mask is shown
            * @event showMaskEvent
            */
            this.showMaskEvent = this.createEvent(EVENT_TYPES.SHOW_MASK);
            this.showMaskEvent.signature = SIGNATURE;

            /**
            * CustomEvent fired before the modality mask is shown. Subscribers can return false to prevent the
            * mask from being shown
            * @event beforeShowMaskEvent
            */
            this.beforeShowMaskEvent = this.createEvent(EVENT_TYPES.BEFORE_SHOW_MASK);
            this.beforeShowMaskEvent.signature = SIGNATURE;

            /**
            * CustomEvent fired after the modality mask is hidden
            * @event hideMaskEvent
            */
            this.hideMaskEvent = this.createEvent(EVENT_TYPES.HIDE_MASK);
            this.hideMaskEvent.signature = SIGNATURE;

            /**
            * CustomEvent fired before the modality mask is hidden. Subscribers can return false to prevent the
            * mask from being hidden
            * @event beforeHideMaskEvent
            */
            this.beforeHideMaskEvent = this.createEvent(EVENT_TYPES.BEFORE_HIDE_MASK);
            this.beforeHideMaskEvent.signature = SIGNATURE;

            /**
            * CustomEvent when the Panel is dragged
            * @event dragEvent
            */
            this.dragEvent = this.createEvent(EVENT_TYPES.DRAG);
            this.dragEvent.signature = SIGNATURE;
        },

        /**
         * Initializes the class's configurable properties which can be changed 
         * using the Panel's Config object (cfg).
         * @method initDefaultConfig
         */
        initDefaultConfig: function () {
            Panel.superclass.initDefaultConfig.call(this);

            // Add panel config properties //

            /**
            * True if the Panel should display a "close" button
            * @config close
            * @type Boolean
            * @default true
            */
            this.cfg.addProperty(DEFAULT_CONFIG.CLOSE.key, { 
                handler: this.configClose, 
                value: DEFAULT_CONFIG.CLOSE.value, 
                validator: DEFAULT_CONFIG.CLOSE.validator, 
                supercedes: DEFAULT_CONFIG.CLOSE.supercedes 
            });

            /**
            * Boolean specifying if the Panel should be draggable.  The default 
            * value is "true" if the Drag and Drop utility is included, 
            * otherwise it is "false." <strong>PLEASE NOTE:</strong> There is a 
            * known issue in IE 6 (Strict Mode and Quirks Mode) and IE 7 
            * (Quirks Mode) where Panels that either don't have a value set for 
            * their "width" configuration property, or their "width" 
            * configuration property is set to "auto" will only be draggable by
            * placing the mouse on the text of the Panel's header element.
            * To fix this bug, draggable Panels missing a value for their 
            * "width" configuration property, or whose "width" configuration 
            * property is set to "auto" will have it set to the value of 
            * their root HTML element's offsetWidth before they are made 
            * visible.  The calculated width is then removed when the Panel is   
            * hidden. <em>This fix is only applied to draggable Panels in IE 6 
            * (Strict Mode and Quirks Mode) and IE 7 (Quirks Mode)</em>. For 
            * more information on this issue see:
            * YUILibrary bugs #1726972 and #1589210.
            * @config draggable
            * @type Boolean
            * @default true
            */
            this.cfg.addProperty(DEFAULT_CONFIG.DRAGGABLE.key, {
                handler: this.configDraggable,
                value: (Util.DD) ? true : false,
                validator: DEFAULT_CONFIG.DRAGGABLE.validator,
                supercedes: DEFAULT_CONFIG.DRAGGABLE.supercedes
            });

            /**
            * Boolean specifying if the draggable Panel should be drag only, not interacting with drop 
            * targets on the page.
            * <p>
            * When set to true, draggable Panels will not check to see if they are over drop targets,
            * or fire the DragDrop events required to support drop target interaction (onDragEnter, 
            * onDragOver, onDragOut, onDragDrop etc.).
            * If the Panel is not designed to be dropped on any target elements on the page, then this 
            * flag can be set to true to improve performance.
            * </p>
            * <p>
            * When set to false, all drop target related events will be fired.
            * </p>
            * <p>
            * The property is set to false by default to maintain backwards compatibility but should be 
            * set to true if drop target interaction is not required for the Panel, to improve performance.</p>
            * 
            * @config dragOnly
            * @type Boolean
            * @default false
            */
            this.cfg.addProperty(DEFAULT_CONFIG.DRAG_ONLY.key, { 
                value: DEFAULT_CONFIG.DRAG_ONLY.value, 
                validator: DEFAULT_CONFIG.DRAG_ONLY.validator, 
                supercedes: DEFAULT_CONFIG.DRAG_ONLY.supercedes 
            });

            /**
            * Sets the type of underlay to display for the Panel. Valid values 
            * are "shadow," "matte," and "none".  <strong>PLEASE NOTE:</strong> 
            * The creation of the underlay element is deferred until the Panel 
            * is initially made visible.  For Gecko-based browsers on Mac
            * OS X the underlay elment is always created as it is used as a 
            * shim to prevent Aqua scrollbars below a Panel instance from poking 
            * through it (See YUILibrary bug #1723530).
            * @config underlay
            * @type String
            * @default shadow
            */
            this.cfg.addProperty(DEFAULT_CONFIG.UNDERLAY.key, { 
                handler: this.configUnderlay, 
                value: DEFAULT_CONFIG.UNDERLAY.value, 
                supercedes: DEFAULT_CONFIG.UNDERLAY.supercedes 
            });
        
            /**
            * True if the Panel should be displayed in a modal fashion, 
            * automatically creating a transparent mask over the document that
            * will not be removed until the Panel is dismissed.
            * @config modal
            * @type Boolean
            * @default false
            */
            this.cfg.addProperty(DEFAULT_CONFIG.MODAL.key, { 
                handler: this.configModal, 
                value: DEFAULT_CONFIG.MODAL.value,
                validator: DEFAULT_CONFIG.MODAL.validator, 
                supercedes: DEFAULT_CONFIG.MODAL.supercedes 
            });

            /**
            * A KeyListener (or array of KeyListeners) that will be enabled 
            * when the Panel is shown, and disabled when the Panel is hidden.
            * @config keylisteners
            * @type YAHOO.util.KeyListener[]
            * @default null
            */
            this.cfg.addProperty(DEFAULT_CONFIG.KEY_LISTENERS.key, { 
                handler: this.configKeyListeners, 
                suppressEvent: DEFAULT_CONFIG.KEY_LISTENERS.suppressEvent, 
                supercedes: DEFAULT_CONFIG.KEY_LISTENERS.supercedes 
            });

            /**
            * UI Strings used by the Panel. The strings are inserted into the DOM as HTML, and should be escaped by the implementor if coming from an external source.
            * 
            * @config strings
            * @type Object
            * @default An object literal with the properties shown below:
            *     <dl>
            *         <dt>close</dt><dd><em>HTML</em> : The markup to use as the label for the close icon. Defaults to "Close".</dd>
            *     </dl>
            */
            this.cfg.addProperty(DEFAULT_CONFIG.STRINGS.key, { 
                value:DEFAULT_CONFIG.STRINGS.value,
                handler:this.configStrings,
                validator:DEFAULT_CONFIG.STRINGS.validator,
                supercedes:DEFAULT_CONFIG.STRINGS.supercedes
            });
        },

        // BEGIN BUILT-IN PROPERTY EVENT HANDLERS //
        
        /**
        * The default event handler fired when the "close" property is changed.
        * The method controls the appending or hiding of the close icon at the 
        * top right of the Panel.
        * @method configClose
        * @param {String} type The CustomEvent type (usually the property name)
        * @param {Object[]} args The CustomEvent arguments. For configuration 
        * handlers, args[0] will equal the newly applied value for the property.
        * @param {Object} obj The scope object. For configuration handlers, 
        * this will usually equal the owner.
        */
        configClose: function (type, args, obj) {

            var val = args[0],
                oClose = this.close,
                strings = this.cfg.getProperty("strings"),
                fc;

            if (val) {
                if (!oClose) {

                    if (!m_oCloseIconTemplate) {
                        m_oCloseIconTemplate = document.createElement("a");
                        m_oCloseIconTemplate.className = "container-close";
                        m_oCloseIconTemplate.href = "#";
                    }

                    oClose = m_oCloseIconTemplate.cloneNode(true);

                    fc = this.innerElement.firstChild;

                    if (fc) {
                        this.innerElement.insertBefore(oClose, fc);
                    } else {
                        this.innerElement.appendChild(oClose);
                    }

                    oClose.innerHTML = (strings && strings.close) ? strings.close : "&#160;";

                    Event.on(oClose, "click", this._doClose, this, true);

                    this.close = oClose;

                } else {
                    oClose.style.display = "block";
                }

            } else {
                if (oClose) {
                    oClose.style.display = "none";
                }
            }

        },

        /**
         * Event handler for the close icon
         * 
         * @method _doClose
         * @protected
         * 
         * @param {DOMEvent} e
         */
        _doClose : function (e) {
            Event.preventDefault(e);
            this.hide();
        },

        /**
        * The default event handler fired when the "draggable" property 
        * is changed.
        * @method configDraggable
        * @param {String} type The CustomEvent type (usually the property name)
        * @param {Object[]} args The CustomEvent arguments. For configuration 
        * handlers, args[0] will equal the newly applied value for the property.
        * @param {Object} obj The scope object. For configuration handlers, 
        * this will usually equal the owner.
        */
        configDraggable: function (type, args, obj) {
            var val = args[0];

            if (val) {
                if (!Util.DD) {
                    this.cfg.setProperty("draggable", false);
                    return;
                }

                if (this.header) {
                    Dom.setStyle(this.header, "cursor", "move");
                    this.registerDragDrop();
                }

                this.subscribe("beforeShow", setWidthToOffsetWidth);

            } else {

                if (this.dd) {
                    this.dd.unreg();
                }

                if (this.header) {
                    Dom.setStyle(this.header,"cursor","auto");
                }

                this.unsubscribe("beforeShow", setWidthToOffsetWidth);
            }
        },
      
        /**
        * The default event handler fired when the "underlay" property 
        * is changed.
        * @method configUnderlay
        * @param {String} type The CustomEvent type (usually the property name)
        * @param {Object[]} args The CustomEvent arguments. For configuration 
        * handlers, args[0] will equal the newly applied value for the property.
        * @param {Object} obj The scope object. For configuration handlers, 
        * this will usually equal the owner.
        */
        configUnderlay: function (type, args, obj) {

            var bMacGecko = (this.platform == "mac" && UA.gecko),
                sUnderlay = args[0].toLowerCase(),
                oUnderlay = this.underlay,
                oElement = this.element;

            function createUnderlay() {
                var bNew = false;
                if (!oUnderlay) { // create if not already in DOM

                    if (!m_oUnderlayTemplate) {
                        m_oUnderlayTemplate = document.createElement("div");
                        m_oUnderlayTemplate.className = "underlay";
                    }

                    oUnderlay = m_oUnderlayTemplate.cloneNode(false);
                    this.element.appendChild(oUnderlay);

                    this.underlay = oUnderlay;

                    if (bIEQuirks) {
                        this.sizeUnderlay();
                        this.cfg.subscribeToConfigEvent("width", this.sizeUnderlay);
                        this.cfg.subscribeToConfigEvent("height", this.sizeUnderlay);

                        this.changeContentEvent.subscribe(this.sizeUnderlay);
                        YAHOO.widget.Module.textResizeEvent.subscribe(this.sizeUnderlay, this, true);
                    }

                    if (UA.webkit && UA.webkit < 420) {
                        this.changeContentEvent.subscribe(this.forceUnderlayRedraw);
                    }

                    bNew = true;
                }
            }

            function onBeforeShow() {
                var bNew = createUnderlay.call(this);
                if (!bNew && bIEQuirks) {
                    this.sizeUnderlay();
                }
                this._underlayDeferred = false;
                this.beforeShowEvent.unsubscribe(onBeforeShow);
            }

            function destroyUnderlay() {
                if (this._underlayDeferred) {
                    this.beforeShowEvent.unsubscribe(onBeforeShow);
                    this._underlayDeferred = false;
                }

                if (oUnderlay) {
                    this.cfg.unsubscribeFromConfigEvent("width", this.sizeUnderlay);
                    this.cfg.unsubscribeFromConfigEvent("height",this.sizeUnderlay);
                    this.changeContentEvent.unsubscribe(this.sizeUnderlay);
                    this.changeContentEvent.unsubscribe(this.forceUnderlayRedraw);
                    YAHOO.widget.Module.textResizeEvent.unsubscribe(this.sizeUnderlay, this, true);

                    this.element.removeChild(oUnderlay);

                    this.underlay = null;
                }
            }

            switch (sUnderlay) {
                case "shadow":
                    Dom.removeClass(oElement, "matte");
                    Dom.addClass(oElement, "shadow");
                    break;
                case "matte":
                    if (!bMacGecko) {
                        destroyUnderlay.call(this);
                    }
                    Dom.removeClass(oElement, "shadow");
                    Dom.addClass(oElement, "matte");
                    break;
                default:
                    if (!bMacGecko) {
                        destroyUnderlay.call(this);
                    }
                    Dom.removeClass(oElement, "shadow");
                    Dom.removeClass(oElement, "matte");
                    break;
            }

            if ((sUnderlay == "shadow") || (bMacGecko && !oUnderlay)) {
                if (this.cfg.getProperty("visible")) {
                    var bNew = createUnderlay.call(this);
                    if (!bNew && bIEQuirks) {
                        this.sizeUnderlay();
                    }
                } else {
                    if (!this._underlayDeferred) {
                        this.beforeShowEvent.subscribe(onBeforeShow);
                        this._underlayDeferred = true;
                    }
                }
            }
        },
        
        /**
        * The default event handler fired when the "modal" property is 
        * changed. This handler subscribes or unsubscribes to the show and hide
        * events to handle the display or hide of the modality mask.
        * @method configModal
        * @param {String} type The CustomEvent type (usually the property name)
        * @param {Object[]} args The CustomEvent arguments. For configuration 
        * handlers, args[0] will equal the newly applied value for the property.
        * @param {Object} obj The scope object. For configuration handlers, 
        * this will usually equal the owner.
        */
        configModal: function (type, args, obj) {

            var modal = args[0];
            if (modal) {
                if (!this._hasModalityEventListeners) {

                    this.subscribe("beforeShow", this.buildMask);
                    this.subscribe("beforeShow", this.bringToTop);
                    this.subscribe("beforeShow", this.showMask);
                    this.subscribe("hide", this.hideMask);

                    Overlay.windowResizeEvent.subscribe(this.sizeMask, 
                        this, true);

                    this._hasModalityEventListeners = true;
                }
            } else {
                if (this._hasModalityEventListeners) {

                    if (this.cfg.getProperty("visible")) {
                        this.hideMask();
                        this.removeMask();
                    }

                    this.unsubscribe("beforeShow", this.buildMask);
                    this.unsubscribe("beforeShow", this.bringToTop);
                    this.unsubscribe("beforeShow", this.showMask);
                    this.unsubscribe("hide", this.hideMask);

                    Overlay.windowResizeEvent.unsubscribe(this.sizeMask, this);

                    this._hasModalityEventListeners = false;
                }
            }
        },

        /**
        * Removes the modality mask.
        * @method removeMask
        */
        removeMask: function () {

            var oMask = this.mask,
                oParentNode;

            if (oMask) {
                /*
                    Hide the mask before destroying it to ensure that DOM
                    event handlers on focusable elements get removed.
                */
                this.hideMask();

                oParentNode = oMask.parentNode;
                if (oParentNode) {
                    oParentNode.removeChild(oMask);
                }

                this.mask = null;
            }
        },
        
        /**
        * The default event handler fired when the "keylisteners" property 
        * is changed.
        * @method configKeyListeners
        * @param {String} type The CustomEvent type (usually the property name)
        * @param {Object[]} args The CustomEvent arguments. For configuration
        * handlers, args[0] will equal the newly applied value for the property.
        * @param {Object} obj The scope object. For configuration handlers, 
        * this will usually equal the owner.
        */
        configKeyListeners: function (type, args, obj) {

            var listeners = args[0],
                listener,
                nListeners,
                i;
        
            if (listeners) {

                if (listeners instanceof Array) {

                    nListeners = listeners.length;

                    for (i = 0; i < nListeners; i++) {

                        listener = listeners[i];
        
                        if (!Config.alreadySubscribed(this.showEvent, 
                            listener.enable, listener)) {

                            this.showEvent.subscribe(listener.enable, 
                                listener, true);

                        }

                        if (!Config.alreadySubscribed(this.hideEvent, 
                            listener.disable, listener)) {

                            this.hideEvent.subscribe(listener.disable, 
                                listener, true);

                            this.destroyEvent.subscribe(listener.disable, 
                                listener, true);
                        }
                    }

                } else {

                    if (!Config.alreadySubscribed(this.showEvent, 
                        listeners.enable, listeners)) {

                        this.showEvent.subscribe(listeners.enable, 
                            listeners, true);
                    }

                    if (!Config.alreadySubscribed(this.hideEvent, 
                        listeners.disable, listeners)) {

                        this.hideEvent.subscribe(listeners.disable, 
                            listeners, true);

                        this.destroyEvent.subscribe(listeners.disable, 
                            listeners, true);

                    }

                }

            }

        },

        /**
        * The default handler for the "strings" property
        * @method configStrings
        */
        configStrings : function(type, args, obj) {
            var val = Lang.merge(DEFAULT_CONFIG.STRINGS.value, args[0]);
            this.cfg.setProperty(DEFAULT_CONFIG.STRINGS.key, val, true);
        },

        /**
        * The default event handler fired when the "height" property is changed.
        * @method configHeight
        * @param {String} type The CustomEvent type (usually the property name)
        * @param {Object[]} args The CustomEvent arguments. For configuration 
        * handlers, args[0] will equal the newly applied value for the property.
        * @param {Object} obj The scope object. For configuration handlers, 
        * this will usually equal the owner.
        */
        configHeight: function (type, args, obj) {
            var height = args[0],
                el = this.innerElement;

            Dom.setStyle(el, "height", height);
            this.cfg.refireEvent("iframe");
        },

        /**
         * The default custom event handler executed when the Panel's height is changed, 
         * if the autofillheight property has been set.
         *
         * @method _autoFillOnHeightChange
         * @protected
         * @param {String} type The event type
         * @param {Array} args The array of arguments passed to event subscribers
         * @param {HTMLElement} el The header, body or footer element which is to be resized to fill
         * out the containers height
         */
        _autoFillOnHeightChange : function(type, args, el) {
            Panel.superclass._autoFillOnHeightChange.apply(this, arguments);
            if (bIEQuirks) {
                var panel = this;
                setTimeout(function() {
                    panel.sizeUnderlay();
                },0);
            }
        },

        /**
        * The default event handler fired when the "width" property is changed.
        * @method configWidth
        * @param {String} type The CustomEvent type (usually the property name)
        * @param {Object[]} args The CustomEvent arguments. For configuration 
        * handlers, args[0] will equal the newly applied value for the property.
        * @param {Object} obj The scope object. For configuration handlers, 
        * this will usually equal the owner.
        */
        configWidth: function (type, args, obj) {
    
            var width = args[0],
                el = this.innerElement;
    
            Dom.setStyle(el, "width", width);
            this.cfg.refireEvent("iframe");
    
        },
        
        /**
        * The default event handler fired when the "zIndex" property is changed.
        * @method configzIndex
        * @param {String} type The CustomEvent type (usually the property name)
        * @param {Object[]} args The CustomEvent arguments. For configuration 
        * handlers, args[0] will equal the newly applied value for the property.
        * @param {Object} obj The scope object. For configuration handlers, 
        * this will usually equal the owner.
        */
        configzIndex: function (type, args, obj) {
            Panel.superclass.configzIndex.call(this, type, args, obj);

            if (this.mask || this.cfg.getProperty("modal") === true) {
                var panelZ = Dom.getStyle(this.element, "zIndex");
                if (!panelZ || isNaN(panelZ)) {
                    panelZ = 0;
                }

                if (panelZ === 0) {
                    // Recursive call to configzindex (which should be stopped
                    // from going further because panelZ should no longer === 0)
                    this.cfg.setProperty("zIndex", 1);
                } else {
                    this.stackMask();
                }
            }
        },

        // END BUILT-IN PROPERTY EVENT HANDLERS //
        /**
        * Builds the wrapping container around the Panel that is used for 
        * positioning the shadow and matte underlays. The container element is 
        * assigned to a  local instance variable called container, and the 
        * element is reinserted inside of it.
        * @method buildWrapper
        */
        buildWrapper: function () {

            var elementParent = this.element.parentNode,
                originalElement = this.element,
                wrapper = document.createElement("div");

            wrapper.className = Panel.CSS_PANEL_CONTAINER;
            wrapper.id = originalElement.id + "_c";

            if (elementParent) {
                elementParent.insertBefore(wrapper, originalElement);
            }

            wrapper.appendChild(originalElement);

            this.element = wrapper;
            this.innerElement = originalElement;

            Dom.setStyle(this.innerElement, "visibility", "inherit");
        },

        /**
        * Adjusts the size of the shadow based on the size of the element.
        * @method sizeUnderlay
        */
        sizeUnderlay: function () {
            var oUnderlay = this.underlay,
                oElement;

            if (oUnderlay) {
                oElement = this.element;
                oUnderlay.style.width = oElement.offsetWidth + "px";
                oUnderlay.style.height = oElement.offsetHeight + "px";
            }
        },

        /**
        * Registers the Panel's header for drag & drop capability.
        * @method registerDragDrop
        */
        registerDragDrop: function () {

            var me = this;

            if (this.header) {

                if (!Util.DD) {
                    return;
                }

                var bDragOnly = (this.cfg.getProperty("dragonly") === true);

                /**
                 * The YAHOO.util.DD instance, used to implement the draggable header for the panel if draggable is enabled
                 *
                 * @property dd
                 * @type YAHOO.util.DD
                 */
                this.dd = new Util.DD(this.element.id, this.id, {dragOnly: bDragOnly});

                if (!this.header.id) {
                    this.header.id = this.id + "_h";
                }

                this.dd.startDrag = function () {

                    var offsetHeight,
                        offsetWidth,
                        viewPortWidth,
                        viewPortHeight,
                        scrollX,
                        scrollY;

                    if (YAHOO.env.ua.ie == 6) {
                        Dom.addClass(me.element,"drag");
                    }

                    if (me.cfg.getProperty("constraintoviewport")) {

                        var nViewportOffset = Overlay.VIEWPORT_OFFSET;

                        offsetHeight = me.element.offsetHeight;
                        offsetWidth = me.element.offsetWidth;

                        viewPortWidth = Dom.getViewportWidth();
                        viewPortHeight = Dom.getViewportHeight();

                        scrollX = Dom.getDocumentScrollLeft();
                        scrollY = Dom.getDocumentScrollTop();

                        if (offsetHeight + nViewportOffset < viewPortHeight) {
                            this.minY = scrollY + nViewportOffset;
                            this.maxY = scrollY + viewPortHeight - offsetHeight - nViewportOffset;
                        } else {
                            this.minY = scrollY + nViewportOffset;
                            this.maxY = scrollY + nViewportOffset;
                        }

                        if (offsetWidth + nViewportOffset < viewPortWidth) {
                            this.minX = scrollX + nViewportOffset;
                            this.maxX = scrollX + viewPortWidth - offsetWidth - nViewportOffset;
                        } else {
                            this.minX = scrollX + nViewportOffset;
                            this.maxX = scrollX + nViewportOffset;
                        }

                        this.constrainX = true;
                        this.constrainY = true;
                    } else {
                        this.constrainX = false;
                        this.constrainY = false;
                    }

                    me.dragEvent.fire("startDrag", arguments);
                };

                this.dd.onDrag = function () {
                    me.syncPosition();
                    me.cfg.refireEvent("iframe");
                    if (this.platform == "mac" && YAHOO.env.ua.gecko) {
                        this.showMacGeckoScrollbars();
                    }

                    me.dragEvent.fire("onDrag", arguments);
                };

                this.dd.endDrag = function () {

                    if (YAHOO.env.ua.ie == 6) {
                        Dom.removeClass(me.element,"drag");
                    }

                    me.dragEvent.fire("endDrag", arguments);
                    me.moveEvent.fire(me.cfg.getProperty("xy"));

                };

                this.dd.setHandleElId(this.header.id);
                this.dd.addInvalidHandleType("INPUT");
                this.dd.addInvalidHandleType("SELECT");
                this.dd.addInvalidHandleType("TEXTAREA");
            }
        },
        
        /**
        * Builds the mask that is laid over the document when the Panel is 
        * configured to be modal.
        * @method buildMask
        */
        buildMask: function () {
            var oMask = this.mask;
            if (!oMask) {
                if (!m_oMaskTemplate) {
                    m_oMaskTemplate = document.createElement("div");
                    m_oMaskTemplate.className = "mask";
                    m_oMaskTemplate.innerHTML = "&#160;";
                }
                oMask = m_oMaskTemplate.cloneNode(true);
                oMask.id = this.id + "_mask";

                document.body.insertBefore(oMask, document.body.firstChild);

                this.mask = oMask;

                if (YAHOO.env.ua.gecko && this.platform == "mac") {
                    Dom.addClass(this.mask, "block-scrollbars");
                }

                // Stack mask based on the element zindex
                this.stackMask();
            }
        },

        /**
        * Hides the modality mask.
        * @method hideMask
        */
        hideMask: function () {
            if (this.cfg.getProperty("modal") && this.mask && this.beforeHideMaskEvent.fire()) {
                this.mask.style.display = "none";
                Dom.removeClass(document.body, "masked");
                this.hideMaskEvent.fire();
            }
        },

        /**
        * Shows the modality mask.
        * @method showMask
        */
        showMask: function () {
            if (this.cfg.getProperty("modal") && this.mask && this.beforeShowMaskEvent.fire()) {
                Dom.addClass(document.body, "masked");
                this.sizeMask();
                this.mask.style.display = "block";
                this.showMaskEvent.fire();
            }
        },

        /**
        * Sets the size of the modality mask to cover the entire scrollable 
        * area of the document
        * @method sizeMask
        */
        sizeMask: function () {
            if (this.mask) {

                // Shrink mask first, so it doesn't affect the document size.
                var mask = this.mask,
                    viewWidth = Dom.getViewportWidth(),
                    viewHeight = Dom.getViewportHeight();

                if (mask.offsetHeight > viewHeight) {
                    mask.style.height = viewHeight + "px";
                }

                if (mask.offsetWidth > viewWidth) {
                    mask.style.width = viewWidth + "px";
                }

                // Then size it to the document
                mask.style.height = Dom.getDocumentHeight() + "px";
                mask.style.width = Dom.getDocumentWidth() + "px";
            }
        },

        /**
         * Sets the zindex of the mask, if it exists, based on the zindex of 
         * the Panel element. The zindex of the mask is set to be one less 
         * than the Panel element's zindex.
         * 
         * <p>NOTE: This method will not bump up the zindex of the Panel
         * to ensure that the mask has a non-negative zindex. If you require the
         * mask zindex to be 0 or higher, the zindex of the Panel 
         * should be set to a value higher than 0, before this method is called.
         * </p>
         * @method stackMask
         */
        stackMask: function() {
            if (this.mask) {
                var panelZ = Dom.getStyle(this.element, "zIndex");
                if (!YAHOO.lang.isUndefined(panelZ) && !isNaN(panelZ)) {
                    Dom.setStyle(this.mask, "zIndex", panelZ - 1);
                }
            }
        },

        /**
        * Renders the Panel by inserting the elements that are not already in 
        * the main Panel into their correct places. Optionally appends the 
        * Panel to the specified node prior to the render's execution. NOTE: 
        * For Panels without existing markup, the appendToNode argument is 
        * REQUIRED. If this argument is ommitted and the current element is 
        * not present in the document, the function will return false, 
        * indicating that the render was a failure.
        * @method render
        * @param {String} appendToNode The element id to which the Module 
        * should be appended to prior to rendering <em>OR</em>
        * @param {HTMLElement} appendToNode The element to which the Module 
        * should be appended to prior to rendering
        * @return {boolean} Success or failure of the render
        */
        render: function (appendToNode) {
            return Panel.superclass.render.call(this, appendToNode, this.innerElement);
        },

        /**
         * Renders the currently set header into it's proper position under the 
         * module element. If the module element is not provided, "this.innerElement" 
         * is used.
         *
         * @method _renderHeader
         * @protected
         * @param {HTMLElement} moduleElement Optional. A reference to the module element
         */
        _renderHeader: function(moduleElement){
            moduleElement = moduleElement || this.innerElement;
			Panel.superclass._renderHeader.call(this, moduleElement);
        },

        /**
         * Renders the currently set body into it's proper position under the 
         * module element. If the module element is not provided, "this.innerElement" 
         * is used.
         * 
         * @method _renderBody
         * @protected
         * @param {HTMLElement} moduleElement Optional. A reference to the module element.
         */
        _renderBody: function(moduleElement){
            moduleElement = moduleElement || this.innerElement;
            Panel.superclass._renderBody.call(this, moduleElement);
        },

        /**
         * Renders the currently set footer into it's proper position under the 
         * module element. If the module element is not provided, "this.innerElement" 
         * is used.
         *
         * @method _renderFooter
         * @protected
         * @param {HTMLElement} moduleElement Optional. A reference to the module element
         */
        _renderFooter: function(moduleElement){
            moduleElement = moduleElement || this.innerElement;
            Panel.superclass._renderFooter.call(this, moduleElement);
        },

        /**
        * Removes the Panel element from the DOM and sets all child elements
        * to null.
        * @method destroy
        * @param {boolean} shallowPurge If true, only the parent element's DOM event listeners are purged. If false, or not provided, all children are also purged of DOM event listeners. 
        * NOTE: The flag is a "shallowPurge" flag, as opposed to what may be a more intuitive "purgeChildren" flag to maintain backwards compatibility with behavior prior to 2.9.0.
        */
        destroy: function (shallowPurge) {
            Overlay.windowResizeEvent.unsubscribe(this.sizeMask, this);
            this.removeMask();
            if (this.close) {
                Event.purgeElement(this.close);
            }
            Panel.superclass.destroy.call(this, shallowPurge);  
        },

        /**
         * Forces the underlay element to be repainted through the application/removal 
         * of a yui-force-redraw class to the underlay element.
         *
         * @method forceUnderlayRedraw
         */
        forceUnderlayRedraw : function () {
            var u = this.underlay;
            Dom.addClass(u, "yui-force-redraw");
            setTimeout(function(){Dom.removeClass(u, "yui-force-redraw");}, 0);
        },

        /**
        * Returns a String representation of the object.
        * @method toString
        * @return {String} The string representation of the Panel.
        */
        toString: function () {
            return "Panel " + this.id;
        }
    
    });

}());
(function () {

    /**
    * <p>
    * Dialog is an implementation of Panel that can be used to submit form 
    * data.
    * </p>
    * <p>
    * Built-in functionality for buttons with event handlers is included. 
    * If the optional YUI Button dependancy is included on the page, the buttons
    * created will be instances of YAHOO.widget.Button, otherwise regular HTML buttons
    * will be created.
    * </p>
    * <p>
    * Forms can be processed in 3 ways -- via an asynchronous Connection utility call, 
    * a simple form POST or GET, or manually. The YUI Connection utility should be
    * included if you're using the default "async" postmethod, but is not required if
    * you're using any of the other postmethod values.
    * </p>
    * @namespace YAHOO.widget
    * @class Dialog
    * @extends YAHOO.widget.Panel
    * @constructor
    * @param {String} el The element ID representing the Dialog <em>OR</em>
    * @param {HTMLElement} el The element representing the Dialog
    * @param {Object} userConfig The configuration object literal containing 
    * the configuration that should be set for this Dialog. See configuration 
    * documentation for more details.
    */
    YAHOO.widget.Dialog = function (el, userConfig) {
        YAHOO.widget.Dialog.superclass.constructor.call(this, el, userConfig);
    };

    var Event = YAHOO.util.Event,
        CustomEvent = YAHOO.util.CustomEvent,
        Dom = YAHOO.util.Dom,
        Dialog = YAHOO.widget.Dialog,
        Lang = YAHOO.lang,

        /**
         * Constant representing the name of the Dialog's events
         * @property EVENT_TYPES
         * @private
         * @final
         * @type Object
         */
        EVENT_TYPES = {
            "BEFORE_SUBMIT": "beforeSubmit",
            "SUBMIT": "submit",
            "MANUAL_SUBMIT": "manualSubmit",
            "ASYNC_SUBMIT": "asyncSubmit",
            "FORM_SUBMIT": "formSubmit",
            "CANCEL": "cancel"
        },

        /**
        * Constant representing the Dialog's configuration properties
        * @property DEFAULT_CONFIG
        * @private
        * @final
        * @type Object
        */
        DEFAULT_CONFIG = {

            "POST_METHOD": { 
                key: "postmethod", 
                value: "async"
            },

            "POST_DATA" : {
                key: "postdata",
                value: null
            },

            "BUTTONS": {
                key: "buttons",
                value: "none",
                supercedes: ["visible"]
            },

            "HIDEAFTERSUBMIT" : {
                key: "hideaftersubmit",
                value: true
            }

        };

    /**
    * Constant representing the default CSS class used for a Dialog
    * @property YAHOO.widget.Dialog.CSS_DIALOG
    * @static
    * @final
    * @type String
    */
    Dialog.CSS_DIALOG = "yui-dialog";

    function removeButtonEventHandlers() {

        var aButtons = this._aButtons,
            nButtons,
            oButton,
            i;

        if (Lang.isArray(aButtons)) {
            nButtons = aButtons.length;

            if (nButtons > 0) {
                i = nButtons - 1;
                do {
                    oButton = aButtons[i];

                    if (YAHOO.widget.Button && oButton instanceof YAHOO.widget.Button) {
                        oButton.destroy();
                    }
                    else if (oButton.tagName.toUpperCase() == "BUTTON") {
                        Event.purgeElement(oButton);
                        Event.purgeElement(oButton, false);
                    }
                }
                while (i--);
            }
        }
    }

    YAHOO.extend(Dialog, YAHOO.widget.Panel, { 

        /**
        * @property form
        * @description Object reference to the Dialog's 
        * <code>&#60;form&#62;</code> element.
        * @default null 
        * @type <a href="http://www.w3.org/TR/2000/WD-DOM-Level-1-20000929/
        * level-one-html.html#ID-40002357">HTMLFormElement</a>
        */
        form: null,
    
        /**
        * Initializes the class's configurable properties which can be changed 
        * using the Dialog's Config object (cfg).
        * @method initDefaultConfig
        */
        initDefaultConfig: function () {
            Dialog.superclass.initDefaultConfig.call(this);

            /**
            * The internally maintained callback object for use with the 
            * Connection utility. The format of the callback object is 
            * similar to Connection Manager's callback object and is 
            * simply passed through to Connection Manager when the async 
            * request is made.
            * @property callback
            * @type Object
            */
            this.callback = {

                /**
                * The function to execute upon success of the 
                * Connection submission (when the form does not
                * contain a file input element).
                * 
                * @property callback.success
                * @type Function
                */
                success: null,

                /**
                * The function to execute upon failure of the 
                * Connection submission
                * @property callback.failure
                * @type Function
                */
                failure: null,

                /**
                *<p>
                * The function to execute upon success of the 
                * Connection submission, when the form contains
                * a file input element.
                * </p>
                * <p>
                * <em>NOTE:</em> Connection manager will not
                * invoke the success or failure handlers for the file
                * upload use case. This will be the only callback
                * handler invoked.
                * </p>
                * <p>
                * For more information, see the <a href="http://developer.yahoo.com/yui/connection/#file">
                * Connection Manager documenation on file uploads</a>.
                * </p>
                * @property callback.upload
                * @type Function
                */

                /**
                * The arbitrary argument or arguments to pass to the Connection 
                * callback functions
                * @property callback.argument
                * @type Object
                */
                argument: null

            };

            // Add form dialog config properties //
            /**
            * The method to use for posting the Dialog's form. Possible values 
            * are "async", "form", and "manual".
            * @config postmethod
            * @type String
            * @default async
            */
            this.cfg.addProperty(DEFAULT_CONFIG.POST_METHOD.key, {
                handler: this.configPostMethod, 
                value: DEFAULT_CONFIG.POST_METHOD.value, 
                validator: function (val) {
                    if (val != "form" && val != "async" && val != "none" && 
                        val != "manual") {
                        return false;
                    } else {
                        return true;
                    }
                }
            });

            /**
            * Any additional post data which needs to be sent when using the 
            * <a href="#config_postmethod">async</a> postmethod for dialog POST submissions.
            * The format for the post data string is defined by Connection Manager's 
            * <a href="YAHOO.util.Connect.html#method_asyncRequest">asyncRequest</a> 
            * method.
            * @config postdata
            * @type String
            * @default null
            */
            this.cfg.addProperty(DEFAULT_CONFIG.POST_DATA.key, {
                value: DEFAULT_CONFIG.POST_DATA.value
            });

            /**
            * This property is used to configure whether or not the 
            * dialog should be automatically hidden after submit.
            * 
            * @config hideaftersubmit
            * @type Boolean
            * @default true
            */
            this.cfg.addProperty(DEFAULT_CONFIG.HIDEAFTERSUBMIT.key, {
                value: DEFAULT_CONFIG.HIDEAFTERSUBMIT.value
            });

            /**
            * Array of object literals, each containing a set of properties 
            * defining a button to be appended into the Dialog's footer.
            *
            * <p>Each button object in the buttons array can have three properties:</p>
            * <dl>
            *    <dt>text:</dt>
            *    <dd>
            *       The text that will display on the face of the button. The text can 
            *       include HTML, as long as it is compliant with HTML Button specifications. The text is added to the DOM as HTML,
            *       and should be escaped by the implementor if coming from an external source. 
            *    </dd>
            *    <dt>handler:</dt>
            *    <dd>Can be either:
            *    <ol>
            *       <li>A reference to a function that should fire when the 
            *       button is clicked.  (In this case scope of this function is 
            *       always its Dialog instance.)</li>
            *
            *       <li>An object literal representing the code to be 
            *       executed when the button is clicked.
            *       
            *       <p>Format:</p>
            *
            *       <p>
            *       <code>{
            *       <br>
            *       <strong>fn:</strong> Function, &#47;&#47;
            *       The handler to call when  the event fires.
            *       <br>
            *       <strong>obj:</strong> Object, &#47;&#47; 
            *       An  object to pass back to the handler.
            *       <br>
            *       <strong>scope:</strong> Object &#47;&#47; 
            *       The object to use for the scope of the handler.
            *       <br>
            *       }</code>
            *       </p>
            *       </li>
            *     </ol>
            *     </dd>
            *     <dt>isDefault:</dt>
            *     <dd>
            *        An optional boolean value that specifies that a button 
            *        should be highlighted and focused by default.
            *     </dd>
            * </dl>
            *
            * <em>NOTE:</em>If the YUI Button Widget is included on the page, 
            * the buttons created will be instances of YAHOO.widget.Button. 
            * Otherwise, HTML Buttons (<code>&#60;BUTTON&#62;</code>) will be 
            * created.
            *
            * @config buttons
            * @type {Array|String}
            * @default "none"
            */
            this.cfg.addProperty(DEFAULT_CONFIG.BUTTONS.key, {
                handler: this.configButtons,
                value: DEFAULT_CONFIG.BUTTONS.value,
                supercedes : DEFAULT_CONFIG.BUTTONS.supercedes
            }); 

        },

        /**
        * Initializes the custom events for Dialog which are fired 
        * automatically at appropriate times by the Dialog class.
        * @method initEvents
        */
        initEvents: function () {
            Dialog.superclass.initEvents.call(this);

            var SIGNATURE = CustomEvent.LIST;

            /**
            * CustomEvent fired prior to submission
            * @event beforeSubmitEvent
            */ 
            this.beforeSubmitEvent = 
                this.createEvent(EVENT_TYPES.BEFORE_SUBMIT);
            this.beforeSubmitEvent.signature = SIGNATURE;
            
            /**
            * CustomEvent fired after submission
            * @event submitEvent
            */
            this.submitEvent = this.createEvent(EVENT_TYPES.SUBMIT);
            this.submitEvent.signature = SIGNATURE;
        
            /**
            * CustomEvent fired for manual submission, before the generic submit event is fired
            * @event manualSubmitEvent
            */
            this.manualSubmitEvent = 
                this.createEvent(EVENT_TYPES.MANUAL_SUBMIT);
            this.manualSubmitEvent.signature = SIGNATURE;

            /**
            * CustomEvent fired after asynchronous submission, before the generic submit event is fired
            *
            * @event asyncSubmitEvent
            * @param {Object} conn The connection object, returned by YAHOO.util.Connect.asyncRequest
            */
            this.asyncSubmitEvent = this.createEvent(EVENT_TYPES.ASYNC_SUBMIT);
            this.asyncSubmitEvent.signature = SIGNATURE;

            /**
            * CustomEvent fired after form-based submission, before the generic submit event is fired
            * @event formSubmitEvent
            */
            this.formSubmitEvent = this.createEvent(EVENT_TYPES.FORM_SUBMIT);
            this.formSubmitEvent.signature = SIGNATURE;

            /**
            * CustomEvent fired after cancel
            * @event cancelEvent
            */
            this.cancelEvent = this.createEvent(EVENT_TYPES.CANCEL);
            this.cancelEvent.signature = SIGNATURE;
        
        },
        
        /**
        * The Dialog initialization method, which is executed for Dialog and 
        * all of its subclasses. This method is automatically called by the 
        * constructor, and  sets up all DOM references for pre-existing markup, 
        * and creates required markup if it is not already present.
        * 
        * @method init
        * @param {String} el The element ID representing the Dialog <em>OR</em>
        * @param {HTMLElement} el The element representing the Dialog
        * @param {Object} userConfig The configuration object literal 
        * containing the configuration that should be set for this Dialog. 
        * See configuration documentation for more details.
        */
        init: function (el, userConfig) {

            /*
                 Note that we don't pass the user config in here yet because 
                 we only want it executed once, at the lowest subclass level
            */

            Dialog.superclass.init.call(this, el/*, userConfig*/); 

            this.beforeInitEvent.fire(Dialog);

            Dom.addClass(this.element, Dialog.CSS_DIALOG);

            this.cfg.setProperty("visible", false);

            if (userConfig) {
                this.cfg.applyConfig(userConfig, true);
            }

            //this.showEvent.subscribe(this.focusFirst, this, true);
            this.beforeHideEvent.subscribe(this.blurButtons, this, true);

            this.subscribe("changeBody", this.registerForm);

            this.initEvent.fire(Dialog);
        },

        /**
        * Submits the Dialog's form depending on the value of the 
        * "postmethod" configuration property.  <strong>Please note:
        * </strong> As of version 2.3 this method will automatically handle 
        * asyncronous file uploads should the Dialog instance's form contain 
        * <code>&#60;input type="file"&#62;</code> elements.  If a Dialog 
        * instance will be handling asyncronous file uploads, its 
        * <code>callback</code> property will need to be setup with a 
        * <code>upload</code> handler rather than the standard 
        * <code>success</code> and, or <code>failure</code> handlers.  For more 
        * information, see the <a href="http://developer.yahoo.com/yui/
        * connection/#file">Connection Manager documenation on file uploads</a>.
        * @method doSubmit
        */
        doSubmit: function () {

            var Connect = YAHOO.util.Connect,
                oForm = this.form,
                bUseFileUpload = false,
                bUseSecureFileUpload = false,
                aElements,
                nElements,
                i,
                formAttrs;

            switch (this.cfg.getProperty("postmethod")) {

                case "async":
                    aElements = oForm.elements;
                    nElements = aElements.length;

                    if (nElements > 0) {
                        i = nElements - 1;
                        do {
                            if (aElements[i].type == "file") {
                                bUseFileUpload = true;
                                break;
                            }
                        }
                        while(i--);
                    }

                    if (bUseFileUpload && YAHOO.env.ua.ie && this.isSecure) {
                        bUseSecureFileUpload = true;
                    }

                    formAttrs = this._getFormAttributes(oForm);

                    Connect.setForm(oForm, bUseFileUpload, bUseSecureFileUpload);

                    var postData = this.cfg.getProperty("postdata");
                    var c = Connect.asyncRequest(formAttrs.method, formAttrs.action, this.callback, postData);

                    this.asyncSubmitEvent.fire(c);

                    break;

                case "form":
                    oForm.submit();
                    this.formSubmitEvent.fire();
                    break;

                case "none":
                case "manual":
                    this.manualSubmitEvent.fire();
                    break;
            }
        },

        /**
         * Retrieves important attributes (currently method and action) from
         * the form element, accounting for any elements which may have the same name 
         * as the attributes. Defaults to "POST" and "" for method and action respectively
         * if the attribute cannot be retrieved.
         *
         * @method _getFormAttributes
         * @protected
         * @param {HTMLFormElement} oForm The HTML Form element from which to retrieve the attributes
         * @return {Object} Object literal, with method and action String properties.
         */
        _getFormAttributes : function(oForm){
            var attrs = {
                method : null,
                action : null
            };

            if (oForm) {
                if (oForm.getAttributeNode) {
                    var action = oForm.getAttributeNode("action");
                    var method = oForm.getAttributeNode("method");

                    if (action) {
                        attrs.action = action.value;
                    }

                    if (method) {
                        attrs.method = method.value;
                    }

                } else {
                    attrs.action = oForm.getAttribute("action");
                    attrs.method = oForm.getAttribute("method");
                }
            }

            attrs.method = (Lang.isString(attrs.method) ? attrs.method : "POST").toUpperCase();
            attrs.action = Lang.isString(attrs.action) ? attrs.action : "";

            return attrs;
        },

        /**
        * Prepares the Dialog's internal FORM object, creating one if one is
        * not currently present.
        * @method registerForm
        */
        registerForm: function() {

            var form = this.element.getElementsByTagName("form")[0];

            if (this.form) {
                if (this.form == form && Dom.isAncestor(this.element, this.form)) {
                    return;
                } else {
                    Event.purgeElement(this.form);
                    this.form = null;
                }
            }

            if (!form) {
                form = document.createElement("form");
                form.name = "frm_" + this.id;
                this.body.appendChild(form);
            }

            if (form) {
                this.form = form;
                Event.on(form, "submit", this._submitHandler, this, true);
            }
        },

        /**
         * Internal handler for the form submit event
         *
         * @method _submitHandler
         * @protected
         * @param {DOMEvent} e The DOM Event object
         */
        _submitHandler : function(e) {
            Event.stopEvent(e);
            this.submit();
            this.form.blur();
        },

        /**
         * Sets up a tab, shift-tab loop between the first and last elements
         * provided. NOTE: Sets up the preventBackTab and preventTabOut KeyListener
         * instance properties, which are reset everytime this method is invoked.
         *
         * @method setTabLoop
         * @param {HTMLElement} firstElement
         * @param {HTMLElement} lastElement
         *
         */
        setTabLoop : function(firstElement, lastElement) {

            firstElement = firstElement || this.firstButton;
            lastElement = lastElement || this.lastButton;

            Dialog.superclass.setTabLoop.call(this, firstElement, lastElement);
        },

        /**
         * Protected internal method for setTabLoop, which can be used by 
         * subclasses to jump in and modify the arguments passed in if required.
         *
         * @method _setTabLoop
         * @param {HTMLElement} firstElement
         * @param {HTMLElement} lastElement
         * @protected
         */
        _setTabLoop : function(firstElement, lastElement) {
            firstElement = firstElement || this.firstButton;
            lastElement = this.lastButton || lastElement;

            this.setTabLoop(firstElement, lastElement);
        },

        /**
         * Configures instance properties, pointing to the 
         * first and last focusable elements in the Dialog's form.
         *
         * @method setFirstLastFocusable
         */
        setFirstLastFocusable : function() {

            Dialog.superclass.setFirstLastFocusable.call(this);

            var i, l, el, elements = this.focusableElements;

            this.firstFormElement = null;
            this.lastFormElement = null;

            if (this.form && elements && elements.length > 0) {
                l = elements.length;

                for (i = 0; i < l; ++i) {
                    el = elements[i];
                    if (this.form === el.form) {
                        this.firstFormElement = el;
                        break;
                    }
                }

                for (i = l-1; i >= 0; --i) {
                    el = elements[i];
                    if (this.form === el.form) {
                        this.lastFormElement = el;
                        break;
                    }
                }
            }
        },

        // BEGIN BUILT-IN PROPERTY EVENT HANDLERS //
        /**
        * The default event handler fired when the "close" property is 
        * changed. The method controls the appending or hiding of the close
        * icon at the top right of the Dialog.
        * @method configClose
        * @param {String} type The CustomEvent type (usually the property name)
        * @param {Object[]} args The CustomEvent arguments. For 
        * configuration handlers, args[0] will equal the newly applied value 
        * for the property.
        * @param {Object} obj The scope object. For configuration handlers, 
        * this will usually equal the owner.
        */
        configClose: function (type, args, obj) {
            Dialog.superclass.configClose.apply(this, arguments);
        },

        /**
         * Event handler for the close icon
         * 
         * @method _doClose
         * @protected
         * 
         * @param {DOMEvent} e
         */
         _doClose : function(e) {
            Event.preventDefault(e);
            this.cancel();
        },

        /**
        * The default event handler for the "buttons" configuration property
        * @method configButtons
        * @param {String} type The CustomEvent type (usually the property name)
        * @param {Object[]} args The CustomEvent arguments. For configuration 
        * handlers, args[0] will equal the newly applied value for the property.
        * @param {Object} obj The scope object. For configuration handlers, 
        * this will usually equal the owner.
        */
        configButtons: function (type, args, obj) {

            var Button = YAHOO.widget.Button,
                aButtons = args[0],
                oInnerElement = this.innerElement,
                oButton,
                oButtonEl,
                oYUIButton,
                nButtons,
                oSpan,
                oFooter,
                i;

            removeButtonEventHandlers.call(this);

            this._aButtons = null;

            if (Lang.isArray(aButtons)) {

                oSpan = document.createElement("span");
                oSpan.className = "button-group";
                nButtons = aButtons.length;

                this._aButtons = [];
                this.defaultHtmlButton = null;

                for (i = 0; i < nButtons; i++) {
                    oButton = aButtons[i];

                    if (Button) {
                        oYUIButton = new Button({ label: oButton.text, type:oButton.type });
                        oYUIButton.appendTo(oSpan);

                        oButtonEl = oYUIButton.get("element");

                        if (oButton.isDefault) {
                            oYUIButton.addClass("default");
                            this.defaultHtmlButton = oButtonEl;
                        }

                        if (Lang.isFunction(oButton.handler)) {

                            oYUIButton.set("onclick", { 
                                fn: oButton.handler, 
                                obj: this, 
                                scope: this 
                            });

                        } else if (Lang.isObject(oButton.handler) && Lang.isFunction(oButton.handler.fn)) {

                            oYUIButton.set("onclick", { 
                                fn: oButton.handler.fn, 
                                obj: ((!Lang.isUndefined(oButton.handler.obj)) ? oButton.handler.obj : this), 
                                scope: (oButton.handler.scope || this) 
                            });

                        }

                        this._aButtons[this._aButtons.length] = oYUIButton;

                    } else {

                        oButtonEl = document.createElement("button");
                        oButtonEl.setAttribute("type", "button");

                        if (oButton.isDefault) {
                            oButtonEl.className = "default";
                            this.defaultHtmlButton = oButtonEl;
                        }

                        oButtonEl.innerHTML = oButton.text;

                        if (Lang.isFunction(oButton.handler)) {
                            Event.on(oButtonEl, "click", oButton.handler, this, true);
                        } else if (Lang.isObject(oButton.handler) && 
                            Lang.isFunction(oButton.handler.fn)) {
    
                            Event.on(oButtonEl, "click", 
                                oButton.handler.fn, 
                                ((!Lang.isUndefined(oButton.handler.obj)) ? oButton.handler.obj : this), 
                                (oButton.handler.scope || this));
                        }

                        oSpan.appendChild(oButtonEl);
                        this._aButtons[this._aButtons.length] = oButtonEl;
                    }

                    oButton.htmlButton = oButtonEl;

                    if (i === 0) {
                        this.firstButton = oButtonEl;
                    }

                    if (i == (nButtons - 1)) {
                        this.lastButton = oButtonEl;
                    }
                }

                this.setFooter(oSpan);

                oFooter = this.footer;

                if (Dom.inDocument(this.element) && !Dom.isAncestor(oInnerElement, oFooter)) {
                    oInnerElement.appendChild(oFooter);
                }

                this.buttonSpan = oSpan;

            } else { // Do cleanup
                oSpan = this.buttonSpan;
                oFooter = this.footer;
                if (oSpan && oFooter) {
                    oFooter.removeChild(oSpan);
                    this.buttonSpan = null;
                    this.firstButton = null;
                    this.lastButton = null;
                    this.defaultHtmlButton = null;
                }
            }

            this.changeContentEvent.fire();
        },

        /**
        * @method getButtons
        * @description Returns an array containing each of the Dialog's 
        * buttons, by default an array of HTML <code>&#60;BUTTON&#62;</code> 
        * elements.  If the Dialog's buttons were created using the 
        * YAHOO.widget.Button class (via the inclusion of the optional Button 
        * dependency on the page), an array of YAHOO.widget.Button instances 
        * is returned.
        * @return {Array}
        */
        getButtons: function () {
            return this._aButtons || null;
        },

        /**
         * <p>
         * Sets focus to the first focusable element in the Dialog's form if found, 
         * else, the default button if found, else the first button defined via the 
         * "buttons" configuration property.
         * </p>
         * <p>
         * This method is invoked when the Dialog is made visible.
         * </p>
         * @method focusFirst
         * @return {Boolean} true, if focused. false if not
         */
        focusFirst: function (type, args, obj) {

            var el = this.firstFormElement, 
                focused = false;

            if (args && args[1]) {
                Event.stopEvent(args[1]);

                // When tabbing here, use firstElement instead of firstFormElement
                if (args[0] === 9 && this.firstElement) {
                    el = this.firstElement;
                }
            }

            if (el) {
                try {
                    el.focus();
                    focused = true;
                } catch(oException) {
                    // Ignore
                }
            } else {
                if (this.defaultHtmlButton) {
                    focused = this.focusDefaultButton();
                } else {
                    focused = this.focusFirstButton();
                }
            }
            return focused;
        },

        /**
        * Sets focus to the last element in the Dialog's form or the last 
        * button defined via the "buttons" configuration property.
        * @method focusLast
        * @return {Boolean} true, if focused. false if not
        */
        focusLast: function (type, args, obj) {

            var aButtons = this.cfg.getProperty("buttons"),
                el = this.lastFormElement,
                focused = false;

            if (args && args[1]) {
                Event.stopEvent(args[1]);

                // When tabbing here, use lastElement instead of lastFormElement
                if (args[0] === 9 && this.lastElement) {
                    el = this.lastElement;
                }
            }

            if (aButtons && Lang.isArray(aButtons)) {
                focused = this.focusLastButton();
            } else {
                if (el) {
                    try {
                        el.focus();
                        focused = true;
                    } catch(oException) {
                        // Ignore
                    }
                }
            }

            return focused;
        },

        /**
         * Helper method to normalize button references. It either returns the 
         * YUI Button instance for the given element if found,
         * or the passes back the HTMLElement reference if a corresponding YUI Button
         * reference is not found or YAHOO.widget.Button does not exist on the page.
         *
         * @method _getButton
         * @private
         * @param {HTMLElement} button
         * @return {YAHOO.widget.Button|HTMLElement}
         */
        _getButton : function(button) {
            var Button = YAHOO.widget.Button;

            // If we have an HTML button and YUI Button is on the page, 
            // get the YUI Button reference if available.
            if (Button && button && button.nodeName && button.id) {
                button = Button.getButton(button.id) || button;
            }

            return button;
        },

        /**
        * Sets the focus to the button that is designated as the default via 
        * the "buttons" configuration property. By default, this method is 
        * called when the Dialog is made visible.
        * @method focusDefaultButton
        * @return {Boolean} true if focused, false if not
        */
        focusDefaultButton: function () {
            var button = this._getButton(this.defaultHtmlButton), 
                         focused = false;
            
            if (button) {
                /*
                    Place the call to the "focus" method inside a try/catch
                    block to prevent IE from throwing JavaScript errors if
                    the element is disabled or hidden.
                */
                try {
                    button.focus();
                    focused = true;
                } catch(oException) {
                }
            }
            return focused;
        },

        /**
        * Blurs all the buttons defined via the "buttons" 
        * configuration property.
        * @method blurButtons
        */
        blurButtons: function () {
            
            var aButtons = this.cfg.getProperty("buttons"),
                nButtons,
                oButton,
                oElement,
                i;

            if (aButtons && Lang.isArray(aButtons)) {
                nButtons = aButtons.length;
                if (nButtons > 0) {
                    i = (nButtons - 1);
                    do {
                        oButton = aButtons[i];
                        if (oButton) {
                            oElement = this._getButton(oButton.htmlButton);
                            if (oElement) {
                                /*
                                    Place the call to the "blur" method inside  
                                    a try/catch block to prevent IE from  
                                    throwing JavaScript errors if the element 
                                    is disabled or hidden.
                                */
                                try {
                                    oElement.blur();
                                } catch(oException) {
                                    // ignore
                                }
                            }
                        }
                    } while(i--);
                }
            }
        },

        /**
        * Sets the focus to the first button created via the "buttons"
        * configuration property.
        * @method focusFirstButton
        * @return {Boolean} true, if focused. false if not
        */
        focusFirstButton: function () {

            var aButtons = this.cfg.getProperty("buttons"),
                oButton,
                oElement,
                focused = false;

            if (aButtons && Lang.isArray(aButtons)) {
                oButton = aButtons[0];
                if (oButton) {
                    oElement = this._getButton(oButton.htmlButton);
                    if (oElement) {
                        /*
                            Place the call to the "focus" method inside a 
                            try/catch block to prevent IE from throwing 
                            JavaScript errors if the element is disabled 
                            or hidden.
                        */
                        try {
                            oElement.focus();
                            focused = true;
                        } catch(oException) {
                            // ignore
                        }
                    }
                }
            }

            return focused;
        },

        /**
        * Sets the focus to the last button created via the "buttons" 
        * configuration property.
        * @method focusLastButton
        * @return {Boolean} true, if focused. false if not
        */
        focusLastButton: function () {

            var aButtons = this.cfg.getProperty("buttons"),
                nButtons,
                oButton,
                oElement, 
                focused = false;

            if (aButtons && Lang.isArray(aButtons)) {
                nButtons = aButtons.length;
                if (nButtons > 0) {
                    oButton = aButtons[(nButtons - 1)];

                    if (oButton) {
                        oElement = this._getButton(oButton.htmlButton);
                        if (oElement) {
                            /*
                                Place the call to the "focus" method inside a 
                                try/catch block to prevent IE from throwing 
                                JavaScript errors if the element is disabled
                                or hidden.
                            */
        
                            try {
                                oElement.focus();
                                focused = true;
                            } catch(oException) {
                                // Ignore
                            }
                        }
                    }
                }
            }

            return focused;
        },

        /**
        * The default event handler for the "postmethod" configuration property
        * @method configPostMethod
        * @param {String} type The CustomEvent type (usually the property name)
        * @param {Object[]} args The CustomEvent arguments. For 
        * configuration handlers, args[0] will equal the newly applied value 
        * for the property.
        * @param {Object} obj The scope object. For configuration handlers, 
        * this will usually equal the owner.
        */
        configPostMethod: function (type, args, obj) {
            this.registerForm();
        },

        // END BUILT-IN PROPERTY EVENT HANDLERS //
        
        /**
        * Built-in function hook for writing a validation function that will 
        * be checked for a "true" value prior to a submit. This function, as 
        * implemented by default, always returns true, so it should be 
        * overridden if validation is necessary.
        * @method validate
        */
        validate: function () {
            return true;
        },

        /**
        * Executes a submit of the Dialog if validation 
        * is successful. By default the Dialog is hidden
        * after submission, but you can set the "hideaftersubmit"
        * configuration property to false, to prevent the Dialog
        * from being hidden.
        * 
        * @method submit
        */
        submit: function () {
            if (this.validate()) {
                if (this.beforeSubmitEvent.fire()) {
                    this.doSubmit();
                    this.submitEvent.fire();
    
                    if (this.cfg.getProperty("hideaftersubmit")) {
                        this.hide();
                    }
    
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        },

        /**
        * Executes the cancel of the Dialog followed by a hide.
        * @method cancel
        */
        cancel: function () {
            this.cancelEvent.fire();
            this.hide();
        },
        
        /**
        * Returns a JSON-compatible data structure representing the data 
        * currently contained in the form.
        * @method getData
        * @return {Object} A JSON object reprsenting the data of the 
        * current form.
        */
        getData: function () {

            var oForm = this.form,
                aElements,
                nTotalElements,
                oData,
                sName,
                oElement,
                nElements,
                sType,
                sTagName,
                aOptions,
                nOptions,
                aValues,
                oOption,
                oRadio,
                oCheckbox,
                valueAttr,
                i,
                n;    
    
            function isFormElement(p_oElement) {
                var sTag = p_oElement.tagName.toUpperCase();
                return ((sTag == "INPUT" || sTag == "TEXTAREA" || 
                        sTag == "SELECT") && p_oElement.name == sName);
            }

            if (oForm) {

                aElements = oForm.elements;
                nTotalElements = aElements.length;
                oData = {};

                for (i = 0; i < nTotalElements; i++) {
                    sName = aElements[i].name;

                    /*
                        Using "Dom.getElementsBy" to safeguard user from JS 
                        errors that result from giving a form field (or set of 
                        fields) the same name as a native method of a form 
                        (like "submit") or a DOM collection (such as the "item"
                        method). Originally tried accessing fields via the 
                        "namedItem" method of the "element" collection, but 
                        discovered that it won't return a collection of fields 
                        in Gecko.
                    */

                    oElement = Dom.getElementsBy(isFormElement, "*", oForm);
                    nElements = oElement.length;

                    if (nElements > 0) {
                        if (nElements == 1) {
                            oElement = oElement[0];

                            sType = oElement.type;
                            sTagName = oElement.tagName.toUpperCase();

                            switch (sTagName) {
                                case "INPUT":
                                    if (sType == "checkbox") {
                                        oData[sName] = oElement.checked;
                                    } else if (sType != "radio") {
                                        oData[sName] = oElement.value;
                                    }
                                    break;

                                case "TEXTAREA":
                                    oData[sName] = oElement.value;
                                    break;
    
                                case "SELECT":
                                    aOptions = oElement.options;
                                    nOptions = aOptions.length;
                                    aValues = [];
    
                                    for (n = 0; n < nOptions; n++) {
                                        oOption = aOptions[n];
                                        if (oOption.selected) {
                                            valueAttr = oOption.attributes.value;
                                            aValues[aValues.length] = (valueAttr && valueAttr.specified) ? oOption.value : oOption.text;
                                        }
                                    }
                                    oData[sName] = aValues;
                                    break;
                            }
        
                        } else {
                            sType = oElement[0].type;
                            switch (sType) {
                                case "radio":
                                    for (n = 0; n < nElements; n++) {
                                        oRadio = oElement[n];
                                        if (oRadio.checked) {
                                            oData[sName] = oRadio.value;
                                            break;
                                        }
                                    }
                                    break;
        
                                case "checkbox":
                                    aValues = [];
                                    for (n = 0; n < nElements; n++) {
                                        oCheckbox = oElement[n];
                                        if (oCheckbox.checked) {
                                            aValues[aValues.length] =  oCheckbox.value;
                                        }
                                    }
                                    oData[sName] = aValues;
                                    break;
                            }
                        }
                    }
                }
            }

            return oData;
        },

        /**
        * Removes the Panel element from the DOM and sets all child elements 
        * to null.
        * @method destroy
        * @param {boolean} shallowPurge If true, only the parent element's DOM event listeners are purged. If false, or not provided, all children are also purged of DOM event listeners. 
        * NOTE: The flag is a "shallowPurge" flag, as opposed to what may be a more intuitive "purgeChildren" flag to maintain backwards compatibility with behavior prior to 2.9.0.
        */
        destroy: function (shallowPurge) {
            removeButtonEventHandlers.call(this);

            this._aButtons = null;

            var aForms = this.element.getElementsByTagName("form"),
                oForm;

            if (aForms.length > 0) {
                oForm = aForms[0];

                if (oForm) {
                    Event.purgeElement(oForm);
                    if (oForm.parentNode) {
                        oForm.parentNode.removeChild(oForm);
                    }
                    this.form = null;
                }
            }
            Dialog.superclass.destroy.call(this, shallowPurge);
        },

        /**
        * Returns a string representation of the object.
        * @method toString
        * @return {String} The string representation of the Dialog
        */
        toString: function () {
            return "Dialog " + this.id;
        }
    
    });

}());
(function () {

    /**
    * SimpleDialog is a simple implementation of Dialog that can be used to 
    * submit a single value. Forms can be processed in 3 ways -- via an 
    * asynchronous Connection utility call, a simple form POST or GET, 
    * or manually.
    * @namespace YAHOO.widget
    * @class SimpleDialog
    * @extends YAHOO.widget.Dialog
    * @constructor
    * @param {String} el The element ID representing the SimpleDialog 
    * <em>OR</em>
    * @param {HTMLElement} el The element representing the SimpleDialog
    * @param {Object} userConfig The configuration object literal containing 
    * the configuration that should be set for this SimpleDialog. See 
    * configuration documentation for more details.
    */
    YAHOO.widget.SimpleDialog = function (el, userConfig) {
    
        YAHOO.widget.SimpleDialog.superclass.constructor.call(this, 
            el, userConfig);
    
    };

    var Dom = YAHOO.util.Dom,
        SimpleDialog = YAHOO.widget.SimpleDialog,
    
        /**
        * Constant representing the SimpleDialog's configuration properties
        * @property DEFAULT_CONFIG
        * @private
        * @final
        * @type Object
        */
        DEFAULT_CONFIG = {
        
            "ICON": { 
                key: "icon", 
                value: "none", 
                suppressEvent: true  
            },
        
            "TEXT": { 
                key: "text", 
                value: "", 
                suppressEvent: true, 
                supercedes: ["icon"] 
            }
        
        };

    /**
    * Constant for the standard network icon for a blocking action
    * @property YAHOO.widget.SimpleDialog.ICON_BLOCK
    * @static
    * @final
    * @type String
    */
    SimpleDialog.ICON_BLOCK = "blckicon";
    
    /**
    * Constant for the standard network icon for alarm
    * @property YAHOO.widget.SimpleDialog.ICON_ALARM
    * @static
    * @final
    * @type String
    */
    SimpleDialog.ICON_ALARM = "alrticon";
    
    /**
    * Constant for the standard network icon for help
    * @property YAHOO.widget.SimpleDialog.ICON_HELP
    * @static
    * @final
    * @type String
    */
    SimpleDialog.ICON_HELP  = "hlpicon";
    
    /**
    * Constant for the standard network icon for info
    * @property YAHOO.widget.SimpleDialog.ICON_INFO
    * @static
    * @final
    * @type String
    */
    SimpleDialog.ICON_INFO  = "infoicon";
    
    /**
    * Constant for the standard network icon for warn
    * @property YAHOO.widget.SimpleDialog.ICON_WARN
    * @static
    * @final
    * @type String
    */
    SimpleDialog.ICON_WARN  = "warnicon";
    
    /**
    * Constant for the standard network icon for a tip
    * @property YAHOO.widget.SimpleDialog.ICON_TIP
    * @static
    * @final
    * @type String
    */
    SimpleDialog.ICON_TIP   = "tipicon";

    /**
    * Constant representing the name of the CSS class applied to the element 
    * created by the "icon" configuration property.
    * @property YAHOO.widget.SimpleDialog.ICON_CSS_CLASSNAME
    * @static
    * @final
    * @type String
    */
    SimpleDialog.ICON_CSS_CLASSNAME = "yui-icon";
    
    /**
    * Constant representing the default CSS class used for a SimpleDialog
    * @property YAHOO.widget.SimpleDialog.CSS_SIMPLEDIALOG
    * @static
    * @final
    * @type String
    */
    SimpleDialog.CSS_SIMPLEDIALOG = "yui-simple-dialog";

    
    YAHOO.extend(SimpleDialog, YAHOO.widget.Dialog, {
    
        /**
        * Initializes the class's configurable properties which can be changed 
        * using the SimpleDialog's Config object (cfg).
        * @method initDefaultConfig
        */
        initDefaultConfig: function () {
        
            SimpleDialog.superclass.initDefaultConfig.call(this);
        
            // Add dialog config properties //
        
            /**
            * Sets the informational icon for the SimpleDialog
            * @config icon
            * @type String
            * @default "none"
            */
            this.cfg.addProperty(DEFAULT_CONFIG.ICON.key, {
                handler: this.configIcon,
                value: DEFAULT_CONFIG.ICON.value,
                suppressEvent: DEFAULT_CONFIG.ICON.suppressEvent
            });
        
            /**
            * Sets the text for the SimpleDialog. The text is inserted into the DOM as HTML, and should be escaped by the implementor if coming from an external source.
            * @config text
            * @type HTML
            * @default ""
            */
            this.cfg.addProperty(DEFAULT_CONFIG.TEXT.key, { 
                handler: this.configText, 
                value: DEFAULT_CONFIG.TEXT.value, 
                suppressEvent: DEFAULT_CONFIG.TEXT.suppressEvent, 
                supercedes: DEFAULT_CONFIG.TEXT.supercedes 
            });
        
        },
        
        
        /**
        * The SimpleDialog initialization method, which is executed for 
        * SimpleDialog and all of its subclasses. This method is automatically 
        * called by the constructor, and  sets up all DOM references for 
        * pre-existing markup, and creates required markup if it is not 
        * already present.
        * @method init
        * @param {String} el The element ID representing the SimpleDialog 
        * <em>OR</em>
        * @param {HTMLElement} el The element representing the SimpleDialog
        * @param {Object} userConfig The configuration object literal 
        * containing the configuration that should be set for this 
        * SimpleDialog. See configuration documentation for more details.
        */
        init: function (el, userConfig) {

            /*
                Note that we don't pass the user config in here yet because we 
                only want it executed once, at the lowest subclass level
            */

            SimpleDialog.superclass.init.call(this, el/*, userConfig*/);
        
            this.beforeInitEvent.fire(SimpleDialog);
        
            Dom.addClass(this.element, SimpleDialog.CSS_SIMPLEDIALOG);
        
            this.cfg.queueProperty("postmethod", "manual");
        
            if (userConfig) {
                this.cfg.applyConfig(userConfig, true);
            }
        
            this.beforeRenderEvent.subscribe(function () {
                if (! this.body) {
                    this.setBody("");
                }
            }, this, true);
        
            this.initEvent.fire(SimpleDialog);
        
        },
        
        /**
        * Prepares the SimpleDialog's internal FORM object, creating one if one 
        * is not currently present, and adding the value hidden field.
        * @method registerForm
        */
        registerForm: function () {
            SimpleDialog.superclass.registerForm.call(this);

            var doc = this.form.ownerDocument,
                input = doc.createElement("input");

            input.type = "hidden";
            input.name = this.id;
            input.value = "";

            this.form.appendChild(input);
        },

        // BEGIN BUILT-IN PROPERTY EVENT HANDLERS //
        
        /**
        * Fired when the "icon" property is set.
        * @method configIcon
        * @param {String} type The CustomEvent type (usually the property name)
        * @param {Object[]} args The CustomEvent arguments. For configuration 
        * handlers, args[0] will equal the newly applied value for the property.
        * @param {Object} obj The scope object. For configuration handlers, 
        * this will usually equal the owner.
        */
        configIcon: function (type,args,obj) {
        
            var sIcon = args[0],
                oBody = this.body,
                sCSSClass = SimpleDialog.ICON_CSS_CLASSNAME,
				aElements,
                oIcon,
                oIconParent;
        
            if (sIcon && sIcon != "none") {

                aElements = Dom.getElementsByClassName(sCSSClass, "*" , oBody);

				if (aElements.length === 1) {

					oIcon = aElements[0];
                    oIconParent = oIcon.parentNode;

                    if (oIconParent) {

                        oIconParent.removeChild(oIcon);

                        oIcon = null;

                    }

				}


                if (sIcon.indexOf(".") == -1) {

                    oIcon = document.createElement("span");
                    oIcon.className = (sCSSClass + " " + sIcon);
                    oIcon.innerHTML = "&#160;";

                } else {

                    oIcon = document.createElement("img");
                    oIcon.src = (this.imageRoot + sIcon);
                    oIcon.className = sCSSClass;

                }
                

                if (oIcon) {
                
                    oBody.insertBefore(oIcon, oBody.firstChild);
                
                }

            }

        },

        /**
        * Fired when the "text" property is set.
        * @method configText
        * @param {String} type The CustomEvent type (usually the property name)
        * @param {Object[]} args The CustomEvent arguments. For configuration 
        * handlers, args[0] will equal the newly applied value for the property.
        * @param {Object} obj The scope object. For configuration handlers, 
        * this will usually equal the owner.
        */
        configText: function (type,args,obj) {
            var text = args[0];
            if (text) {
                this.setBody(text);
                this.cfg.refireEvent("icon");
            }
        },
        
        // END BUILT-IN PROPERTY EVENT HANDLERS //
        
        /**
        * Returns a string representation of the object.
        * @method toString
        * @return {String} The string representation of the SimpleDialog
        */
        toString: function () {
            return "SimpleDialog " + this.id;
        }

        /**
        * <p>
        * Sets the SimpleDialog's body content to the HTML specified. 
        * If no body is present, one will be automatically created. 
        * An empty string can be passed to the method to clear the contents of the body.
        * </p>
        * <p><strong>NOTE:</strong> SimpleDialog provides the <a href="#config_text">text</a>
        * and <a href="#config_icon">icon</a> configuration properties to set the contents
        * of it's body element in accordance with the UI design for a SimpleDialog (an 
        * icon and message text). Calling setBody on the SimpleDialog will not enforce this 
        * UI design constraint and will replace the entire contents of the SimpleDialog body. 
        * It should only be used if you wish the replace the default icon/text body structure 
        * of a SimpleDialog with your own custom markup.</p>
        * 
        * @method setBody
        * @param {HTML} bodyContent The HTML used to set the body. 
        * As a convenience, non HTMLElement objects can also be passed into 
        * the method, and will be treated as strings, with the body innerHTML
        * set to their default toString implementations.
        * 
        * <p>NOTE: Markup passed into this method is added to the DOM as HTML, and should be escaped by the implementor if coming from an external source.</p>
        * 
        * <em>OR</em>
        * @param {HTMLElement} bodyContent The HTMLElement to add as the first and only child of the body element.
        * <em>OR</em>
        * @param {DocumentFragment} bodyContent The document fragment 
        * containing elements which are to be added to the body
        */
    });

}());
(function () {

    /**
    * ContainerEffect encapsulates animation transitions that are executed when 
    * an Overlay is shown or hidden.
    * @namespace YAHOO.widget
    * @class ContainerEffect
    * @constructor
    * @param {YAHOO.widget.Overlay} overlay The Overlay that the animation 
    * should be associated with
    * @param {Object} attrIn The object literal representing the animation 
    * arguments to be used for the animate-in transition. The arguments for 
    * this literal are: attributes(object, see YAHOO.util.Anim for description), 
    * duration(Number), and method(i.e. Easing.easeIn).
    * @param {Object} attrOut The object literal representing the animation 
    * arguments to be used for the animate-out transition. The arguments for  
    * this literal are: attributes(object, see YAHOO.util.Anim for description), 
    * duration(Number), and method(i.e. Easing.easeIn).
    * @param {HTMLElement} targetElement Optional. The target element that  
    * should be animated during the transition. Defaults to overlay.element.
    * @param {class} Optional. The animation class to instantiate. Defaults to 
    * YAHOO.util.Anim. Other options include YAHOO.util.Motion.
    */
    YAHOO.widget.ContainerEffect = function (overlay, attrIn, attrOut, targetElement, animClass) {

        if (!animClass) {
            animClass = YAHOO.util.Anim;
        }

        /**
        * The overlay to animate
        * @property overlay
        * @type YAHOO.widget.Overlay
        */
        this.overlay = overlay;
    
        /**
        * The animation attributes to use when transitioning into view
        * @property attrIn
        * @type Object
        */
        this.attrIn = attrIn;
    
        /**
        * The animation attributes to use when transitioning out of view
        * @property attrOut
        * @type Object
        */
        this.attrOut = attrOut;
    
        /**
        * The target element to be animated
        * @property targetElement
        * @type HTMLElement
        */
        this.targetElement = targetElement || overlay.element;
    
        /**
        * The animation class to use for animating the overlay
        * @property animClass
        * @type class
        */
        this.animClass = animClass;
    };

    var Dom = YAHOO.util.Dom,
        CustomEvent = YAHOO.util.CustomEvent,
        ContainerEffect = YAHOO.widget.ContainerEffect;

    /**
    * A pre-configured ContainerEffect instance that can be used for fading 
    * an overlay in and out.
    * @method FADE
    * @static
    * @param {YAHOO.widget.Overlay} overlay The Overlay object to animate
    * @param {Number} dur The duration of the animation
    * @return {YAHOO.widget.ContainerEffect} The configured ContainerEffect object
    */
    ContainerEffect.FADE = function (overlay, dur) {

        var Easing = YAHOO.util.Easing,
            fin = {
                attributes: {opacity:{from:0, to:1}},
                duration: dur,
                method: Easing.easeIn
            },
            fout = {
                attributes: {opacity:{to:0}},
                duration: dur,
                method: Easing.easeOut
            },
            fade = new ContainerEffect(overlay, fin, fout, overlay.element);

        fade.handleUnderlayStart = function() {
            var underlay = this.overlay.underlay;
            if (underlay && YAHOO.env.ua.ie) {
                var hasFilters = (underlay.filters && underlay.filters.length > 0);
                if(hasFilters) {
                    Dom.addClass(overlay.element, "yui-effect-fade");
                }
            }
        };

        fade.handleUnderlayComplete = function() {
            var underlay = this.overlay.underlay;
            if (underlay && YAHOO.env.ua.ie) {
                Dom.removeClass(overlay.element, "yui-effect-fade");
            }
        };

        fade.handleStartAnimateIn = function (type, args, obj) {
            obj.overlay._fadingIn = true;

            Dom.addClass(obj.overlay.element, "hide-select");

            if (!obj.overlay.underlay) {
                obj.overlay.cfg.refireEvent("underlay");
            }

            obj.handleUnderlayStart();

            obj.overlay._setDomVisibility(true);
            Dom.setStyle(obj.overlay.element, "opacity", 0);
        };

        fade.handleCompleteAnimateIn = function (type,args,obj) {
            obj.overlay._fadingIn = false;
            
            Dom.removeClass(obj.overlay.element, "hide-select");

            if (obj.overlay.element.style.filter) {
                obj.overlay.element.style.filter = null;
            }

            obj.handleUnderlayComplete();

            obj.overlay.cfg.refireEvent("iframe");
            obj.animateInCompleteEvent.fire();
        };

        fade.handleStartAnimateOut = function (type, args, obj) {
            obj.overlay._fadingOut = true;
            Dom.addClass(obj.overlay.element, "hide-select");
            obj.handleUnderlayStart();
        };

        fade.handleCompleteAnimateOut =  function (type, args, obj) {
            obj.overlay._fadingOut = false;
            Dom.removeClass(obj.overlay.element, "hide-select");

            if (obj.overlay.element.style.filter) {
                obj.overlay.element.style.filter = null;
            }
            obj.overlay._setDomVisibility(false);
            Dom.setStyle(obj.overlay.element, "opacity", 1);

            obj.handleUnderlayComplete();

            obj.overlay.cfg.refireEvent("iframe");
            obj.animateOutCompleteEvent.fire();
        };

        fade.init();
        return fade;
    };
    
    
    /**
    * A pre-configured ContainerEffect instance that can be used for sliding an 
    * overlay in and out.
    * @method SLIDE
    * @static
    * @param {YAHOO.widget.Overlay} overlay The Overlay object to animate
    * @param {Number} dur The duration of the animation
    * @return {YAHOO.widget.ContainerEffect} The configured ContainerEffect object
    */
    ContainerEffect.SLIDE = function (overlay, dur) {
        var Easing = YAHOO.util.Easing,

            x = overlay.cfg.getProperty("x") || Dom.getX(overlay.element),
            y = overlay.cfg.getProperty("y") || Dom.getY(overlay.element),
            clientWidth = Dom.getClientWidth(),
            offsetWidth = overlay.element.offsetWidth,

            sin =  { 
                attributes: { points: { to: [x, y] } },
                duration: dur,
                method: Easing.easeIn 
            },

            sout = {
                attributes: { points: { to: [(clientWidth + 25), y] } },
                duration: dur,
                method: Easing.easeOut 
            },

            slide = new ContainerEffect(overlay, sin, sout, overlay.element, YAHOO.util.Motion);

        slide.handleStartAnimateIn = function (type,args,obj) {
            obj.overlay.element.style.left = ((-25) - offsetWidth) + "px";
            obj.overlay.element.style.top  = y + "px";
        };

        slide.handleTweenAnimateIn = function (type, args, obj) {
        
            var pos = Dom.getXY(obj.overlay.element),
                currentX = pos[0],
                currentY = pos[1];
        
            if (Dom.getStyle(obj.overlay.element, "visibility") == 
                "hidden" && currentX < x) {

                obj.overlay._setDomVisibility(true);

            }
        
            obj.overlay.cfg.setProperty("xy", [currentX, currentY], true);
            obj.overlay.cfg.refireEvent("iframe");
        };
        
        slide.handleCompleteAnimateIn = function (type, args, obj) {
            obj.overlay.cfg.setProperty("xy", [x, y], true);
            obj.startX = x;
            obj.startY = y;
            obj.overlay.cfg.refireEvent("iframe");
            obj.animateInCompleteEvent.fire();
        };

        slide.handleStartAnimateOut = function (type, args, obj) {
    
            var vw = Dom.getViewportWidth(),
                pos = Dom.getXY(obj.overlay.element),
                yso = pos[1];
    
            obj.animOut.attributes.points.to = [(vw + 25), yso];
        };
        
        slide.handleTweenAnimateOut = function (type, args, obj) {
    
            var pos = Dom.getXY(obj.overlay.element),
                xto = pos[0],
                yto = pos[1];
        
            obj.overlay.cfg.setProperty("xy", [xto, yto], true);
            obj.overlay.cfg.refireEvent("iframe");
        };
        
        slide.handleCompleteAnimateOut = function (type, args, obj) {
            obj.overlay._setDomVisibility(false);

            obj.overlay.cfg.setProperty("xy", [x, y]);
            obj.animateOutCompleteEvent.fire();
        };

        slide.init();
        return slide;
    };

    ContainerEffect.prototype = {

        /**
        * Initializes the animation classes and events.
        * @method init
        */
        init: function () {

            this.beforeAnimateInEvent = this.createEvent("beforeAnimateIn");
            this.beforeAnimateInEvent.signature = CustomEvent.LIST;
            
            this.beforeAnimateOutEvent = this.createEvent("beforeAnimateOut");
            this.beforeAnimateOutEvent.signature = CustomEvent.LIST;
        
            this.animateInCompleteEvent = this.createEvent("animateInComplete");
            this.animateInCompleteEvent.signature = CustomEvent.LIST;
        
            this.animateOutCompleteEvent = this.createEvent("animateOutComplete");
            this.animateOutCompleteEvent.signature = CustomEvent.LIST;

            this.animIn = new this.animClass(
                this.targetElement, 
                this.attrIn.attributes, 
                this.attrIn.duration, 
                this.attrIn.method);

            this.animIn.onStart.subscribe(this.handleStartAnimateIn, this);
            this.animIn.onTween.subscribe(this.handleTweenAnimateIn, this);
            this.animIn.onComplete.subscribe(this.handleCompleteAnimateIn,this);
        
            this.animOut = new this.animClass(
                this.targetElement, 
                this.attrOut.attributes, 
                this.attrOut.duration, 
                this.attrOut.method);

            this.animOut.onStart.subscribe(this.handleStartAnimateOut, this);
            this.animOut.onTween.subscribe(this.handleTweenAnimateOut, this);
            this.animOut.onComplete.subscribe(this.handleCompleteAnimateOut, this);

        },

        /**
        * Triggers the in-animation.
        * @method animateIn
        */
        animateIn: function () {
            this._stopAnims(this.lastFrameOnStop);
            this.beforeAnimateInEvent.fire();
            this.animIn.animate();
        },

        /**
        * Triggers the out-animation.
        * @method animateOut
        */
        animateOut: function () {
            this._stopAnims(this.lastFrameOnStop);
            this.beforeAnimateOutEvent.fire();
            this.animOut.animate();
        },
        
        /**
         * Flag to define whether Anim should jump to the last frame,
         * when animateIn or animateOut is stopped.
         *
         * @property lastFrameOnStop
         * @default true
         * @type boolean
         */
        lastFrameOnStop : true,

        /**
         * Stops both animIn and animOut instances, if in progress.
         *
         * @method _stopAnims
         * @param {boolean} finish If true, animation will jump to final frame.
         * @protected
         */
        _stopAnims : function(finish) {
            if (this.animOut && this.animOut.isAnimated()) {
                this.animOut.stop(finish);
            }

            if (this.animIn && this.animIn.isAnimated()) {
                this.animIn.stop(finish);
            }
        },

        /**
        * The default onStart handler for the in-animation.
        * @method handleStartAnimateIn
        * @param {String} type The CustomEvent type
        * @param {Object[]} args The CustomEvent arguments
        * @param {Object} obj The scope object
        */
        handleStartAnimateIn: function (type, args, obj) { },

        /**
        * The default onTween handler for the in-animation.
        * @method handleTweenAnimateIn
        * @param {String} type The CustomEvent type
        * @param {Object[]} args The CustomEvent arguments
        * @param {Object} obj The scope object
        */
        handleTweenAnimateIn: function (type, args, obj) { },

        /**
        * The default onComplete handler for the in-animation.
        * @method handleCompleteAnimateIn
        * @param {String} type The CustomEvent type
        * @param {Object[]} args The CustomEvent arguments
        * @param {Object} obj The scope object
        */
        handleCompleteAnimateIn: function (type, args, obj) { },

        /**
        * The default onStart handler for the out-animation.
        * @method handleStartAnimateOut
        * @param {String} type The CustomEvent type
        * @param {Object[]} args The CustomEvent arguments
        * @param {Object} obj The scope object
        */
        handleStartAnimateOut: function (type, args, obj) { },

        /**
        * The default onTween handler for the out-animation.
        * @method handleTweenAnimateOut
        * @param {String} type The CustomEvent type
        * @param {Object[]} args The CustomEvent arguments
        * @param {Object} obj The scope object
        */
        handleTweenAnimateOut: function (type, args, obj) { },

        /**
        * The default onComplete handler for the out-animation.
        * @method handleCompleteAnimateOut
        * @param {String} type The CustomEvent type
        * @param {Object[]} args The CustomEvent arguments
        * @param {Object} obj The scope object
        */
        handleCompleteAnimateOut: function (type, args, obj) { },
        
        /**
        * Returns a string representation of the object.
        * @method toString
        * @return {String} The string representation of the ContainerEffect
        */
        toString: function () {
            var output = "ContainerEffect";
            if (this.overlay) {
                output += " [" + this.overlay.toString() + "]";
            }
            return output;
        }
    };

    YAHOO.lang.augmentProto(ContainerEffect, YAHOO.util.EventProvider);

})();
YAHOO.register("container", YAHOO.widget.Module, {version: "2.9.0", build: "2800"});

/*
Copyright (c) 2011, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://developer.yahoo.com/yui/license.html
version: 2.9.0
*/
/**
 * The Storage module manages client-side data storage.
 * @module Storage
 */

(function() {

	// internal shorthand
var Y = YAHOO,
	Util = Y.util,
	Lang = Y.lang,
	_logOverwriteError,
    Storage,

	RX_TYPE = /^type=(\w+)/i,
	RX_VALUE = /&value=(.*)/i;

if (! Util.Storage) {
	_logOverwriteError = function(fxName) {
		Y.log('Exception in YAHOO.util.Storage.?? - must be extended by a storage engine'.replace('??', fxName).replace('??', this.getName ? this.getName() : 'Unknown'), 'error');
	};

	/**
	 * The Storage class is an HTML 5 storage API clone, used to wrap individual storage implementations with a common API.
	 * @class Storage
	 * @namespace YAHOO.util
	 * @constructor
	 * @param sLocation {String} Required. The storage location.
	 * @parm sName {String} Required. The engine name.
	 * @param oConf {Object} Required. A configuration object.
	 */
	Storage = function(sLocation, sName, oConf) {
		var that = this;
		Y.env._id_counter += 1;

		// protected variables
		that._cfg = Lang.isObject(oConf) ? oConf : {};
		that._location = sLocation;
		that._name = sName;
		that.isReady = false;

		// public variables
		that.createEvent(Storage.CE_READY, {scope: that, fireOnce: true});
		that.createEvent(Storage.CE_CHANGE, {scope: that});
		
		that.subscribe(Storage.CE_READY, function() {
			that.isReady = true;
		});
	};

    Storage.CE_READY = 'YUIStorageReady';
    Storage.CE_CHANGE = 'YUIStorageChange';

	Storage.prototype = {

		/**
		 * The event name for when the storage item is ready.
		 * @property CE_READY
		 * @type {String}
		 * @public
		 */
		CE_READY: Storage.CE_READY,

		/**
		 * The event name for when the storage item has changed.
		 * @property CE_CHANGE
		 * @type {String}
		 * @public
		 */
		CE_CHANGE: Storage.CE_CHANGE,

		/**
		 * The configuration of the engine.
		 * @property _cfg
		 * @type {Object}
		 * @protected
		 */
		_cfg: '',

		/**
		 * The name of this engine.
		 * @property _name
		 * @type {String}
		 * @protected
		 */
		_name: '',

		/**
		 * The location for this instance.
		 * @property _location
		 * @type {String}
		 * @protected
		 */
		_location: '',

		/**
		 * The current length of the keys.
		 * @property length
		 * @type {Number}
		 * @public
		 */
		length: 0,

		/**
		 * This engine singleton has been initialized already.
		 * @property isReady
		 * @type {String}
		 * @protected
		 */
		isReady: false,

		/**
		 * Clears any existing key/value pairs.
		 * @method clear
		 * @public
		 */
		clear: function() {
			this._clear();
			this.length = 0;
		},

		/**
		 * Fetches the data stored and the provided key.
		 * @method getItem
		 * @param sKey {String} Required. The key used to reference this value (DOMString in HTML 5 spec).
		 * @return {String|NULL} The value stored at the provided key (DOMString in HTML 5 spec).
		 * @public
		 */
		getItem: function(sKey) {
			Y.log("Fetching item at  " + sKey);
			var oItem = this._getItem(sKey);
			return Lang.isValue(oItem) ? this._getValue(oItem) : null; // required by HTML 5 spec
		},

		/**
		 * Fetches the storage object's name; should be overwritten by storage engine.
		 * @method getName
		 * @return {String} The name of the data storage object.
		 * @public
		 */
		getName: function() {return this._name;},

		/**
		 * Tests if the key has been set (not in HTML 5 spec); should be overwritten by storage engine.
		 * @method hasKey
		 * @param sKey {String} Required. The key to search for.
		 * @return {Boolean} True when key has been set.
		 * @public
		 */
		hasKey: function(sKey) {
			return Lang.isString(sKey) && this._hasKey(sKey);
		},

		/**
		 * Retrieve the key stored at the provided index; should be overwritten by storage engine.
		 * @method key
		 * @param nIndex {Number} Required. The index to retrieve (unsigned long in HTML 5 spec).
		 * @return {String} Required. The key at the provided index (DOMString in HTML 5 spec).
		 * @public
		 */
		key: function(nIndex) {
			Y.log("Fetching key at " + nIndex);

			if (Lang.isNumber(nIndex) && -1 < nIndex && this.length > nIndex) {
				var value = this._key(nIndex);
				if (value) {return value;}
			}

			// this is thrown according to the HTML5 spec
			throw('INDEX_SIZE_ERR - Storage.setItem - The provided index (' + nIndex + ') is not available');
		},

		/**
		 * Remove an item from the data storage.
		 * @method removeItem
		 * @param sKey {String} Required. The key to remove (DOMString in HTML 5 spec).
		 * @public
		 */
		removeItem: function(sKey) {
			Y.log("removing " + sKey);
            var that = this,
                oOldValue;
			
			if (that.hasKey(sKey)) {
                oOldValue = that._getItem(sKey);
                if (! oOldValue) {oOldValue = null;}
                that._removeItem(sKey);
				that.fireEvent(Storage.CE_CHANGE, new Util.StorageEvent(that, sKey, oOldValue, null, Util.StorageEvent.TYPE_REMOVE_ITEM));
			}
			else {
				// HTML 5 spec says to do nothing
			}
		},

		/**
		 * Adds an item to the data storage.
		 * @method setItem
		 * @param sKey {String} Required. The key used to reference this value (DOMString in HTML 5 spec).
		 * @param oData {Object} Required. The data to store at key (DOMString in HTML 5 spec).
		 * @public
		 * @throws QUOTA_EXCEEDED_ERROR
		 */
		setItem: function(sKey, oData) {
			Y.log("SETTING " + oData + " to " + sKey);
			
			if (Lang.isString(sKey)) {
				var that = this,
                    oOldValue = that._getItem(sKey);

				if (! oOldValue) {oOldValue = null;}

				if (that._setItem(sKey, that._createValue(oData))) {
					that.fireEvent(Storage.CE_CHANGE, new Util.StorageEvent(that, sKey, oOldValue, oData,
                            that.hasKey(sKey) ? Util.StorageEvent.TYPE_UPDATE_ITEM : Util.StorageEvent.TYPE_ADD_ITEM));
				}
				else {
					// that is thrown according to the HTML5 spec
					throw('QUOTA_EXCEEDED_ERROR - Storage.setItem - The choosen storage method (' +
						  that.getName() + ') has exceeded capacity');
				}
			}
			else {
				// HTML 5 spec says to do nothing
			}
		},

		/**
		 * Implementation of the clear login; should be overwritten by storage engine.
		 * @method _clear
		 * @protected
		 */
		_clear: function() {
			_logOverwriteError('_clear');
			return '';
		},

		/**
		 * Converts the object into a string, with meta data (type), so it can be restored later.
		 * @method _createValue
		 * @param o {Object} Required. An object to store.
		 * @protected
		 */
		_createValue: function(o) {
			var sType = (Lang.isNull(o) || Lang.isUndefined(o)) ? ('' + o) : typeof o;
			return 'type=' + sType + '&value=' + encodeURIComponent('' + o);
		},

		/**
		 * Implementation of the getItem login; should be overwritten by storage engine.
		 * @method _getItem
		 * @param sKey {String} Required. The key used to reference this value.
		 * @return {String|NULL} The value stored at the provided key.
		 * @protected
		 */
		_getItem: function(sKey) {
			_logOverwriteError('_getItem');
			return '';
		},

		/**
		 * Converts the stored value into its appropriate type.
		 * @method _getValue
		 * @param s {String} Required. The stored value.
		 * @protected
		 */
		_getValue: function(s) {
			var sType = s.match(RX_TYPE)[1],
				sValue = s.match(RX_VALUE)[1];

			switch (sType) {
				case 'boolean': return 'true' == sValue;
				case 'number': return parseFloat(sValue);
				case 'null': return null;
				default: return decodeURIComponent(sValue);
			}
		},

		/**
		 * Implementation of the key logic; should be overwritten by storage engine.
		 * @method _key
		 * @param nIndex {Number} Required. The index to retrieve (unsigned long in HTML 5 spec).
		 * @return {String|NULL} Required. The key at the provided index (DOMString in HTML 5 spec).
		 * @protected
		 */
		_key: function(nIndex) {
			_logOverwriteError('_key');
			return '';
		},

		/*
		 * Implementation to fetch evaluate the existence of a key.
		 */
		_hasKey: function(sKey) {
			return null !== this._getItem(sKey);
		},

		/**
		 * Implementation of the removeItem login; should be overwritten by storage engine.
		 * @method _removeItem
		 * @param sKey {String} Required. The key to remove.
		 * @protected
		 */
		_removeItem: function(sKey) {
			_logOverwriteError('_removeItem');
			return '';
		},

		/**
		 * Implementation of the setItem login; should be overwritten by storage engine.
		 * @method _setItem
		 * @param sKey {String} Required. The key used to reference this value.
		 * @param oData {Object} Required. The data to storage at key.
		 * @return {Boolean} True when successful, false when size QUOTA exceeded.
		 * @protected
		 */
		_setItem: function(sKey, oData) {
			_logOverwriteError('_setItem');
			return '';
		}
	};

	Lang.augmentProto(Storage, Util.EventProvider);

    Util.Storage = Storage;
}

}());
/**
 * The StorageManager class is a singleton that registers DataStorage objects and returns instances of those objects.
 * @class StorageManager
 * @namespace YAHOO.util
 * @static
 */
(function() {
	// internal shorthand
var Util = YAHOO.util,
	Lang = YAHOO.lang,

	// private variables
	_locationEngineMap = {}, // cached engines
	_registeredEngineSet = [], // set of available engines
	_registeredEngineMap = {}, // map of available engines
	
	/**
	 * Fetches a storage constructor if it is available, otherwise returns NULL.
	 * @method _getClass
	 * @param fnClass {Function} Required. The storage constructor to test.
	 * @return {Function} An available storage constructor or NULL.
	 * @private
	 */
	_getClass = function(fnClass) {
		return (fnClass && fnClass.isAvailable()) ? fnClass : null;
	},

	/**
	 * Fetches the storage engine from the cache, or creates and caches it.
	 * @method _getStorageEngine
	 * @param sLocation {String} Required. The location to store.
	 * @param fnClass {Function} Required. A pointer to the engineType Class.
	 * @param oConf {Object} Optional. Additional configuration for the data source engine.
	 * @private
	 */
	_getStorageEngine = function(sLocation, fnClass, oConf) {
		var engine = _locationEngineMap[sLocation + fnClass.ENGINE_NAME];

		if (! engine) {
			engine = new fnClass(sLocation, oConf);
			_locationEngineMap[sLocation + fnClass.ENGINE_NAME] = engine;
		}

		return engine;
	},

	/**
	 * Ensures that the location is valid before returning it or a default value.
	 * @method _getValidLocation
	 * @param sLocation {String} Required. The location to evaluate.
	 * @private
	 */
	_getValidLocation = function(sLocation) {
		switch (sLocation) {
			case Util.StorageManager.LOCATION_LOCAL:
			case Util.StorageManager.LOCATION_SESSION:
				return sLocation;

			default: return Util.StorageManager.LOCATION_SESSION;
		}
	};

	// public namespace
	Util.StorageManager = {

        /**
         * The storage location - session; data cleared at the end of a user's session.
         * @property LOCATION_SESSION
         * @type {String}
         * @static
         */
		LOCATION_SESSION: 'sessionStorage',

        /**
         * The storage location - local; data cleared on demand.
         * @property LOCATION_LOCAL
         * @type {String}
         * @static
         */
		LOCATION_LOCAL: 'localStorage',

		/**
		 * Fetches the desired engine type or first available engine type.
		 * @method get
		 * @param engineType {String} Optional. The engine type, see engines.
		 * @param sLocation {String} Optional. The storage location - LOCATION_SESSION & LOCATION_LOCAL; default is LOCAL.
		 * @param oConf {Object} Optional. Additional configuration for the getting the storage engine.
		 * {
		 * 	engine: {Object} configuration parameters for the desired engine
		 * 	force: {Boolean} force the <code>engineType</code> or fail
		 * 	order: {Array} an array of storage engine names; the desired order to try engines}
		 * }
		 * @static
		 */
		get: function(engineType, sLocation, oConf) {
			var oCfg = Lang.isObject(oConf) ? oConf : {},
				fnClass = _getClass(_registeredEngineMap[engineType]),
                i , j;

			if (! fnClass && ! oCfg.force) {
				if (oCfg.order) {
					j = oCfg.order.length;

					for (i = 0; i < j && ! fnClass; i += 1) {
						fnClass = _getClass(oCfg.order[i]);
					}
				}

				if (! fnClass) {
					j = _registeredEngineSet.length;

					for (i = 0; i < j && ! fnClass; i += 1) {
						fnClass = _getClass(_registeredEngineSet[i]);
					}
				}
			}

			if (fnClass) {
				return _getStorageEngine(_getValidLocation(sLocation), fnClass, oCfg.engine);
			}

			throw('YAHOO.util.StorageManager.get - No engine available, please include an engine before calling this function.');
		},

        /*
         * Estimates the size of the string using 1 byte for each alpha-numeric character and 3 for each non-alpha-numeric character.
         * @method getByteSize
         * @param s {String} Required. The string to evaulate.
         * @return {Number} The estimated string size.
         * @private
         */
        getByteSize: function(s) {
			return encodeURIComponent('' + s).length;
        },

		/**
		 * Registers a engineType Class with the StorageManager singleton; first in is the first out.
		 * @method register
		 * @param engineConstructor {Function} Required. The engine constructor function, see engines.
		 * @return {Boolean} When successfully registered.
		 * @static
		 */
		register: function(engineConstructor) {
			if (Lang.isFunction(engineConstructor) && Lang.isFunction(engineConstructor.isAvailable) &&
                    Lang.isString(engineConstructor.ENGINE_NAME)) {
				_registeredEngineMap[engineConstructor.ENGINE_NAME] = engineConstructor;
				_registeredEngineSet.push(engineConstructor);
				return true;
			}

			return false;
		}
	};

	YAHOO.register("StorageManager", Util.SWFStore, {version: "2.9.0", build: "2800"});
}());
(function() {

/**
 * The StorageEvent class manages the storage events by emulating the HTML 5 implementation.
 * @namespace YAHOO.util
 * @class StorageEvent
 * @constructor
 * @param oStorageArea {Object} Required. The Storage object that was affected.
 * @param sKey {String} Required. The key being changed; DOMString in HTML 5 spec.
 * @param oOldValue {Mixed} Required. The old value of the key being changed; DOMString in HTML 5 spec.
 * @param oNewValue {Mixed} Required. The new value of the key being changed; DOMString in HTML 5 spec.
 * @param sType {String} Required. The storage event type.
 */
function StorageEvent(oStorageArea, sKey, oOldValue, oNewValue, sType) {
	this.key = sKey;
	this.oldValue = oOldValue;
	this.newValue = oNewValue;
	this.url = window.location.href;
	this.window = window; // todo: think about the CAJA and innocent code
	this.storageArea = oStorageArea;
	this.type = sType;
}

YAHOO.lang.augmentObject(StorageEvent, {
	TYPE_ADD_ITEM: 'addItem',
	TYPE_REMOVE_ITEM: 'removeItem',
	TYPE_UPDATE_ITEM: 'updateItem'
});

StorageEvent.prototype = {

    /**
     * The 'key' attribute represents the key being changed.
     * @property key
     * @type {String}
     * @static
     * @readonly
     */
    key: null,

    /**
     * The 'newValue' attribute represents the new value of the key being changed.
     * @property newValue
     * @type {Mixed}
     * @static
     * @readonly
     */
    newValue: null,

    /**
     * The 'oldValue' attribute represents the old value of the key being changed.
     * @property oldValue
     * @type {Mixed}
     * @static
     * @readonly
     */
    oldValue: null,

    /**
     * The 'source' attribute represents the WindowProxy object of the browsing context of the document whose key changed.
     * @property source
     * @type {Object}
     * @static
     * @readonly
     */
    source: null,

    /**
     * The 'storageArea' attribute represents the Storage object that was affected.
     * @property storageArea
     * @type {Object}
     * @static
     * @readonly
     */
    storageArea: null,

    /**
     * The 'type' attribute represents the Storage event type.
     * @property type
     * @type {Object}
     * @static
     * @readonly
     */
    type: null,

    /**
     * The 'url' attribute represents the address of the document whose key changed.
     * @property url
     * @type {String}
     * @static
     * @readonly
     */
    url: null
};

YAHOO.util.StorageEvent = StorageEvent;
	
}());
(function() {
var Util = YAHOO.util;

	/**
	 * The StorageEngineKeyed class implements the interface necessary for managing keys.
	 * @namespace YAHOO.util
	 * @class StorageEngineKeyed
	 * @constructor
	 * @extend YAHOO.util.Storage
	 */
	Util.StorageEngineKeyed = function() {
		Util.StorageEngineKeyed.superclass.constructor.apply(this, arguments);
		this._keys = [];
		this._keyMap = {};
	};

	YAHOO.lang.extend(Util.StorageEngineKeyed, Util.Storage, {

		/**
		 * A collection of keys applicable to the current location. This should never be edited by the developer.
		 * @property _keys
		 * @type {Array}
		 * @protected
		 */
		_keys: null,

		/**
		 * A map of keys to their applicable position in keys array. This should never be edited by the developer.
		 * @property _keyMap
		 * @type {Object}
		 * @protected
		 */
		_keyMap: null,

		/**
		 * Adds the key to the set.
		 * @method _addKey
		 * @param sKey {String} Required. The key to evaluate.
		 * @protected
		 */
		_addKey: function(sKey) {
		    if (!this._keyMap.hasOwnProperty(sKey)) {
    			this._keys.push(sKey);
			    this._keyMap[sKey] = this.length;
			    this.length = this._keys.length;
			}
		},

		/*
		 * Implementation to clear the values from the storage engine.
		 * @see YAHOO.util.Storage._clear
		 */
		_clear: function() {
			this._keys = [];
			this.length = 0;
		},

		/**
		 * Evaluates if a key exists in the keys array; indexOf does not work in all flavors of IE.
		 * @method _indexOfKey
		 * @param sKey {String} Required. The key to evaluate.
		 * @protected
		 */
		_indexOfKey: function(sKey) {
			var i = this._keyMap[sKey];
			return undefined === i ? -1 : i;
		},

		/*
		 * Implementation to fetch a key from the storage engine.
		 * @see YAHOO.util.Storage.key
		 */
		_key: function(nIndex) {return this._keys[nIndex];},

		/**
		 * Removes a key from the keys array.
		 * @method _removeItem
		 * @param sKey {String} Required. The key to remove.
		 * @protected
		 */
		_removeItem: function(sKey) {
			var that = this,
                j = that._indexOfKey(sKey),
				rest = that._keys.slice(j + 1),
                k;

			delete that._keyMap[sKey];

			// update values in keymap that are greater than current position
			for (k in that._keyMap) {
				if (j < that._keyMap[k]) {
					that._keyMap[k] -= 1;
				}
			}
			
			that._keys.length = j;
			that._keys = that._keys.concat(rest);
			that.length = that._keys.length;
		}
	});
}());
/*
 * HTML limitations:
 *  - 5MB in FF and Safari, 10MB in IE 8
 *  - only FF 3.5 recovers session storage after a browser crash
 *
 * Thoughts:
 *  - how can we not use cookies to handle session
 */
(function() {
	// internal shorthand
var Util = YAHOO.util,
	Lang = YAHOO.lang,

	/*
	 * Required for IE 8 to make synchronous.
	 */
	_beginTransaction = function(driver) {
		driver.begin();
	},

	/*
	 * Required for IE 8 to make synchronous.
	 */
	_commitTransaction = function(driver) {
		driver.commit();
	},

	/**
	 * The StorageEngineHTML5 class implements the HTML5 storage engine.
	 * @namespace YAHOO.util
	 * @class StorageEngineHTML5
	 * @constructor
	 * @extend YAHOO.util.Storage
	 * @param sLocation {String} Required. The storage location.
	 * @param oConf {Object} Required. A configuration object.
	 */
	StorageEngineHTML5 = function(sLocation, oConf) {
		var that = this,
            oDriver = window[sLocation];
        
		StorageEngineHTML5.superclass.constructor.call(that, sLocation, StorageEngineHTML5.ENGINE_NAME, oConf);// not set, are cookies available

		// simplifieds the begin/commit functions, if not using IE; this provides a massive performance boost
		if (! oDriver.begin) {_beginTransaction = function() {}; }
		if (! oDriver.commit) {_commitTransaction = function() {}; }

		that.length = oDriver.length;
        that._driver = oDriver;
        that.fireEvent(Util.Storage.CE_READY);
	};

	Lang.extend(StorageEngineHTML5, Util.Storage, {

		_driver: null,

		/*
		 * Implementation to clear the values from the storage engine.
		 * @see YAHOO.util.Storage._clear
		 */
		_clear: function() {
			var that = this, i, sKey;

			if (that._driver.clear) {
				that._driver.clear();
			}
			// for FF 3, fixed in FF 3.5
			else {
				for (i = that.length; 0 <= i; i -= 1) {
					sKey = that._key(i);
					that._removeItem(sKey);
				}
			}
		},

		/*
		 * Implementation to fetch an item from the storage engine.
		 * @see YAHOO.util.Storage._getItem
		 */
		_getItem: function(sKey) {
			var o = this._driver.getItem(sKey);
			return Lang.isObject(o) ? o.value : o; // for FF 3, fixed in FF 3.5
		},

		/*
		 * Implementation to fetch a key from the storage engine.
		 * @see YAHOO.util.Storage._key
		 */
		_key: function(nIndex) {return this._driver.key(nIndex);},

		/*
		 * Implementation to remove an item from the storage engine.
		 * @see YAHOO.util.Storage._removeItem
		 */
		_removeItem: function(sKey) {
			var oDriver = this._driver;
			_beginTransaction(oDriver);
			oDriver.removeItem(sKey);
			_commitTransaction(oDriver);
			this.length = oDriver.length;
		},

		/*
		 * Implementation to remove an item from the storage engine.
		 * @see YAHOO.util.Storage._setItem
		 */
		_setItem: function(sKey, oValue) {
			var oDriver = this._driver;

			try {
				_beginTransaction(oDriver);
				oDriver.setItem(sKey, oValue);
				_commitTransaction(oDriver);
				this.length = oDriver.length;
				return true;
			}
			catch (e) {
				return false;
			}
		}
	}, true);

	StorageEngineHTML5.ENGINE_NAME = 'html5';
    
	StorageEngineHTML5.isAvailable = function() {
        try {
            return ('localStorage' in window) && window['localStorage'] !== null &&
                    ('sessionStorage' in window) && window['sessionStorage'] !== null;
        }
        catch (e) {
            /*
                In FireFox and maybe other browsers, you can disable storage in the configuration settings, which
                will cause an error to be thrown instead of evaluating the simple if/else statement.
             */
            return false;
        }
    };

    Util.StorageManager.register(StorageEngineHTML5);
	Util.StorageEngineHTML5 = StorageEngineHTML5;
}());
/*
 * Gears limitation:
 *  - SQLite limitations - http://www.sqlite.org/limits.html
 *  - DB Best Practices - http://code.google.com/apis/gears/gears_faq.html#bestPracticeDB
 * 	- the user must approve before gears can be used
 *  - each SQL query has a limited number of characters (9948 bytes), data will need to be spread across rows
 *  - no query should insert or update more than 9948 bytes of data in a single statement or GEARs will throw:
 *  	[Exception... "'Error: SQL statement is too long.' when calling method: [nsIDOMEventListener::handleEvent]" nsresult: "0x8057001c (NS_ERROR_XPC_JS_THREW_JS_OBJECT)" location: "<unknown>" data: no]
 *
 * Thoughts:
 *  - we may want to implement additional functions for the gears only implementation
 *  - how can we not use cookies to handle session location
 */
(function() {
	// internal shorthand
var Util = YAHOO.util,
	Lang = YAHOO.lang,
	SQL_STMT_LIMIT = 9948,
	TABLE_NAME = 'YUIStorageEngine',

	// local variables
	_driver = null,

	eURI = encodeURIComponent,
	dURI = decodeURIComponent,

	/**
	 * The StorageEngineGears class implements the Google Gears storage engine.
	 * @namespace YAHOO.util
	 * @class StorageEngineGears
	 * @constructor
	 * @extend YAHOO.util.Storage
	 * @param sLocation {String} Required. The storage location.
	 * @param oConf {Object} Required. A configuration object.
	 */
	StorageEngineGears = function(sLocation, oConf) {
		var that = this,
            keyMap = {},
            isSessionStorage, sessionKey, rs;
        
		StorageEngineGears.superclass.constructor.call(that, sLocation, StorageEngineGears.ENGINE_NAME, oConf);

		if (! _driver) {
			// create the database
			_driver = google.gears.factory.create(StorageEngineGears.GEARS);
      // the replace regex fixes http://yuilibrary.com/projects/yui2/ticket/2529411, all ascii characters are allowede except / : * ? " < > | ; ,
			_driver.open(window.location.host.replace(/[\/\:\*\?"\<\>\|;,]/g, '') + '-' + StorageEngineGears.DATABASE);
			_driver.execute('CREATE TABLE IF NOT EXISTS ' + TABLE_NAME + ' (key TEXT, location TEXT, value TEXT)');
		}

		isSessionStorage = Util.StorageManager.LOCATION_SESSION === that._location;
		sessionKey = Util.Cookie.get('sessionKey' + StorageEngineGears.ENGINE_NAME);

		if (! sessionKey) {
			_driver.execute('BEGIN');
			_driver.execute('DELETE FROM ' + TABLE_NAME + ' WHERE location="' + eURI(Util.StorageManager.LOCATION_SESSION) + '"');
			_driver.execute('COMMIT');
		}

		rs = _driver.execute('SELECT key FROM ' + TABLE_NAME + ' WHERE location="' + eURI(that._location) + '"');
		keyMap = {};
	
		try {
			// iterate on the rows and map the keys
			while (rs.isValidRow()) {
				var fld = dURI(rs.field(0));

				if (! keyMap[fld]) {
					keyMap[fld] = true;
					that._addKey(fld);
				}

				rs.next();
			}
		} finally {
			rs.close();
		}

		// this is session storage, ensure that the session key is set
		if (isSessionStorage) {
			Util.Cookie.set('sessionKey' + StorageEngineGears.ENGINE_NAME, true);
		}

        that.fireEvent(Util.Storage.CE_READY);
	};

	Lang.extend(StorageEngineGears, Util.StorageEngineKeyed, {

		/*
		 * Implementation to clear the values from the storage engine.
		 * @see YAHOO.util.Storage._clear
		 */
		_clear: function() {
			StorageEngineGears.superclass._clear.call(this);
			_driver.execute('BEGIN');
			_driver.execute('DELETE FROM ' + TABLE_NAME + ' WHERE location="' + eURI(this._location) + '"');
			_driver.execute('COMMIT');
		},

		/*
		 * Implementation to fetch an item from the storage engine.
		 * @see YAHOO.util.Storage._getItem
		 */
		_getItem: function(sKey) {
			var rs = _driver.execute('SELECT value FROM ' + TABLE_NAME + ' WHERE key="' + eURI(sKey) + '" AND location="' + eURI(this._location) + '"'),
				value = '';

			try {
				while (rs.isValidRow()) {
					value += rs.field(0);
					rs.next();
				}
			} finally {
				rs.close();
			}

			return value ? dURI(value) : null;
		},

		/*
		 * Implementation to remove an item from the storage engine.
		 * @see YAHOO.util.Storage._removeItem
		 */
		_removeItem: function(sKey) {
			StorageEngineGears.superclass._removeItem.call(this, sKey);
			_driver.execute('BEGIN');
			_driver.execute('DELETE FROM ' + TABLE_NAME + ' WHERE key="' + eURI(sKey) + '" AND location="' + eURI(this._location) + '"');
			_driver.execute('COMMIT');
		},

		/*
		 * Implementation to remove an item from the storage engine.
		 * @see YAHOO.util.Storage._setItem
		 */
		_setItem: function(sKey, oData) {

			this._addKey(sKey);

			var sEscapedKey = eURI(sKey),
				sEscapedLocation = eURI(this._location),
				sEscapedValue = eURI(oData), // escaped twice, maybe not necessary
				aValues = [],
				nLen = SQL_STMT_LIMIT - (sEscapedKey + sEscapedLocation).length,
                i=0, j;

			// the length of the value exceeds the available space
			if (nLen < sEscapedValue.length) {
				for (j = sEscapedValue.length; i < j; i += nLen) {
					aValues.push(sEscapedValue.substr(i, nLen));
				}
			} else {
				aValues.push(sEscapedValue);
			}

			// Google recommends using INSERT instead of update, because it is faster
			_driver.execute('BEGIN');
			_driver.execute('DELETE FROM ' + TABLE_NAME + ' WHERE key="' + sEscapedKey + '" AND location="' + sEscapedLocation + '"');
			for (i = 0, j = aValues.length; i < j; i += 1) {
				_driver.execute('INSERT INTO ' + TABLE_NAME + ' VALUES ("' + sEscapedKey + '", "' + sEscapedLocation + '", "' + aValues[i] + '")');
			}
			_driver.execute('COMMIT');
			
			return true;
		}
	});

	// releases the engine when the page unloads
	Util.Event.on('unload', function() {
		if (_driver) {_driver.close();}
	});

    StorageEngineGears.ENGINE_NAME = 'gears';
	StorageEngineGears.GEARS = 'beta.database';
	StorageEngineGears.DATABASE = 'yui.database';

	StorageEngineGears.isAvailable = function() {
		if (('google' in window) && ('gears' in window.google)) {
			try {
				// this will throw an exception if the user denies gears
				google.gears.factory.create(StorageEngineGears.GEARS);
				return true;
			}
			catch (e) {
				// no need to do anything
			}
		}

		return false;
	};

    Util.StorageManager.register(StorageEngineGears);
	Util.StorageEngineGears = StorageEngineGears;
}());
/*
 * SWF limitation:
 * 	- only 100,000 bytes of data may be stored this way
 *  - data is publicly available on user machine
 *
 * Thoughts:
 *  - data can be shared across browsers
 *  - how can we not use cookies to handle session location
 */
(function() {
	// internal shorthand
var Y = YAHOO,
    Util = Y.util,
	Lang = Y.lang,
	Dom = Util.Dom,
	StorageManager = Util.StorageManager,
	
	/*
	 * The minimum width required to be able to display the settings panel within the SWF.
	 */	
	MINIMUM_WIDTH = 215,

	/*
	 * The minimum height required to be able to display the settings panel within the SWF.
	 */	
	MINIMUM_HEIGHT = 138,

	RX_STORAGE_PREFIX = new RegExp('^(' + StorageManager.LOCATION_SESSION + '|' + StorageManager.LOCATION_LOCAL + ')'),

	// local variables
	_driver = null,

	/*
	 * Creates a location bound key.
	 */
	_getKey = function(that, sKey) {
		return that._location + sKey;
	},

	/*
	 * Initializes the engine, if it isn't already initialized.
	 */
	_initDriver = function(oCfg) {
		if (! _driver) {
			if (! Lang.isString(oCfg.swfURL)) {oCfg.swfURL = StorageEngineSWF.SWFURL;}
			if (! oCfg.containerID) {
				var bd = document.getElementsByTagName('body')[0],
					container = bd.appendChild(document.createElement('div'));
				oCfg.containerID = Dom.generateId(container);
			}

			if (! oCfg.attributes) {oCfg.attributes  = {};}
			if (! oCfg.attributes.flashVars) {oCfg.attributes.flashVars = {};}
			oCfg.attributes.flashVars.allowedDomain = document.location.hostname;
			oCfg.attributes.flashVars.useCompression = 'true';
			oCfg.attributes.version = 9.115;
			_driver = new Y.widget.SWF(oCfg.containerID, oCfg.swfURL, oCfg.attributes);

			// subscribe to save for info
			_driver.subscribe('save', function(o) {
				Y.log(o.message, 'info');
			});

			// subscribe to errors
			_driver.subscribe('quotaExceededError', function(o) {
				Y.log(o.message, 'error');
			});
			_driver.subscribe('inadequateDimensions', function(o) {
				Y.log(o.message, 'error');
			});
			_driver.subscribe('error', function(o) {
				Y.log(o.message, 'error');
			});
			_driver.subscribe('securityError', function(o) {
				Y.log(o.message, 'error');
			});
		}
	},

	/**
	 * The StorageEngineSWF class implements the SWF storage engine.
	 * @namespace YAHOO.util
	 * @class StorageEngineSWF
	 * @uses YAHOO.widget.SWF
	 * @constructor
	 * @extend YAHOO.util.Storage
	 * @param sLocation {String} Required. The storage location.
	 * @param oConf {Object} Required. A configuration object.
	 */
	StorageEngineSWF = function(sLocation, oConf) {
		var that = this;
		StorageEngineSWF.superclass.constructor.call(that, sLocation, StorageEngineSWF.ENGINE_NAME, oConf);
		
		_initDriver(that._cfg);
		
		var _onContentReady = function() {
			that._swf = _driver._swf;
			_driver.initialized = true;
			
			var isSessionStorage = StorageManager.LOCATION_SESSION === that._location,
				sessionKey = Util.Cookie.get('sessionKey' + StorageEngineSWF.ENGINE_NAME),
                i, key, isKeySessionStorage;

			for (i = _driver.callSWF("getLength", []) - 1; 0 <= i; i -= 1) {
				key = _driver.callSWF("getNameAt", [i]);
				isKeySessionStorage = isSessionStorage && (-1 < key.indexOf(StorageManager.LOCATION_SESSION));

				// this is session storage, but the session key is not set, so remove item
				if (isKeySessionStorage && ! sessionKey) {
					_driver.callSWF("removeItem", [key]);
				}
				else if (isSessionStorage === isKeySessionStorage) {
                    // the key matches the storage type, add to key collection
					that._addKey(key);
				}
			}

			// this is session storage, ensure that the session key is set
			if (isSessionStorage) {
				Util.Cookie.set('sessionKey' + StorageEngineSWF.ENGINE_NAME, true);
			}

			that.fireEvent(Util.Storage.CE_READY);
		};
		
		// evaluate immediately, SWF is already loaded
		if (_driver.initialized) {
            _onContentReady();
		}
		else {
            // evaluates when the SWF is loaded
			_driver.addListener("contentReady", _onContentReady);
		}
	};

	Lang.extend(StorageEngineSWF, Util.StorageEngineKeyed, {
		/**
		 * The underlying SWF of the engine, exposed so developers can modify the adapter behavior.
		 * @property _swf
		 * @type {Object}
		 * @protected
		 */
		_swf: null,

		/*
		 * Implementation to clear the values from the storage engine.
		 * @see YAHOO.util.Storage._clear
		 */
		_clear: function() {
			for (var i = this._keys.length - 1, sKey; 0 <= i; i -= 1) {
				sKey = this._keys[i];
				_driver.callSWF("removeItem", [sKey]);
			}
			// since keys are used to clear, we call the super function second
			StorageEngineSWF.superclass._clear.call(this);
		},

		/*
		 * Implementation to fetch an item from the storage engine.
		 * @see YAHOO.util.Storage._getItem
		 */
		_getItem: function(sKey) {
			var sLocationKey = _getKey(this, sKey);
			return _driver.callSWF("getValueOf", [sLocationKey]);
		},

		/*
		 * Implementation to fetch a key from the storage engine.
		 * @see YAHOO.util.Storage.key
		 */
		_key: function(index) {
			return StorageEngineSWF.superclass._key.call(this, index).replace(RX_STORAGE_PREFIX, '');
		},

		/*
		 * Implementation to remove an item from the storage engine.
		 * @see YAHOO.util.Storage._removeItem
		 */
		_removeItem: function(sKey) {
			Y.log("removing SWF key: " + sKey);
			var sLocationKey = _getKey(this, sKey);
			StorageEngineSWF.superclass._removeItem.call(this, sLocationKey);
			_driver.callSWF("removeItem", [sLocationKey]);
		},

		/*
		 * Implementation to remove an item from the storage engine.
		 * @see YAHOO.util.Storage._setItem
		 */
		_setItem: function(sKey, oData) {
			var sLocationKey = _getKey(this, sKey), swfNode;

			if (_driver.callSWF("setItem", [sLocationKey, oData])) {
				this._addKey(sLocationKey);
				return true;
			}
			else {
                /*
                    note:
                        right if the FLASH SLO size needs to be adjusted, then this request and all future requests fail
                        should we queue these up and poll for when there is enough space?
                 */
				swfNode = Dom.get(_driver._id);
				if (MINIMUM_WIDTH > Dom.getStyle(swfNode, 'width').replace(/\D+/g, '')) {Dom.setStyle(swfNode, 'width', MINIMUM_WIDTH + 'px');}
				if (MINIMUM_HEIGHT > Dom.getStyle(swfNode, 'height').replace(/\D+/g, '')) {Dom.setStyle(swfNode, 'height', MINIMUM_HEIGHT + 'px');}
				Y.log("attempting to show settings. are dimensions adequate? " + _driver.callSWF("hasAdequateDimensions"));
				return _driver.callSWF("displaySettings", []);
			}
		}
	});

	StorageEngineSWF.SWFURL = "swfstore.swf";
	StorageEngineSWF.ENGINE_NAME = 'swf';

    StorageEngineSWF.isAvailable = function() {
		return (6 <= Y.env.ua.flash && Y.widget.SWF);
	};

    StorageManager.register(StorageEngineSWF);
	Util.StorageEngineSWF = StorageEngineSWF;
}());
YAHOO.register("storage", YAHOO.util.Storage, {version: "2.9.0", build: "2800"});
