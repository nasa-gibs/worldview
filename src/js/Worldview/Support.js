/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

Worldview.namespace("Support");

(function(ns) {

    var log = Logging.getLogger();
    var mobileSafari = false;

    ns.BROWSER = null;
    ns.VERSION = [];

    ns.allowCustomPalettes = function() {
        var result = true;
        var reason = "";

        if ( !window.Worker ) {
            result = false;
            reason = "No Web Workers";
        } else if ( ns.BROWSER === "Safari" && ns.VERSION[0]
                && ns.VERSION[0] < 6 ) {
            result = false;
            reason = "Safari version 6 required";
        } else if ( ns.BROWSER === "IE" ) {
            result = false;
            reason = "IE Unsupported";
        }
        if ( !result ) {
            log.warn("Custom palettes are not supported: " + reason);
        }
        return result;
    };

    ns.showUnsupportedMessage = function(featureName) {
        var prefix;
        if ( !featureName ) {
            prefix = "This feature";
        } else {
            prefix = "The " + featureName + " feature";
        }
        Worldview.notify(prefix + " is not supported with your web " +
                "browser. Upgrade or try again in a different browser.");
    };

    ns.quirks = function() {
        jQueryLayerFix();
        shimConsole();
        checkMobile();
        fixSize();
        modernSetTimeout();
        polyfillStringContains();
        polyfillStringStartsWith();
    };

    var init = function() {
        if ( / Safari\//.test(navigator.userAgent) ) {
            ns.BROWSER = "Safari";
            var version = navigator.userAgent.match(/ Version\/([^ ]+)/);
            if ( version ) {
                ns.VERSION = version[1].split(".");
            }
        } else if ( navigator.appName == 'Microsoft Internet Explorer' ) {
            ns.BROWSER = "IE";
        }
    };

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
    var jQueryLayerFix = function() {
        // remove layerX and layerY
        var all = $.event.props,
            len = all.length,
            res = [];
        while (len--) {
          var el = all[len];
          if (el != 'layerX' && el != 'layerY') res.push(el);
        }
        $.event.props = res;
    };

    var shimConsole = function() {
        if ( !window.console ) {
            window.console = {
                log: function() {}
            };
        }
    };

    // Get rid of address bar on iphone/ipod
    var fixSize = function() {
        var execute = function() {
            window.scrollTo(0,0);
            document.body.style.height = '100%';
            if (!(/(iphone|ipod)/.test(navigator.userAgent.toLowerCase()))) {
                if (document.body.parentNode) {
                    document.body.parentNode.style.height = '100%';
                }
            }
        };
        setTimeout(execute, 700);
        setTimeout(execute, 1500);
    };

    var hideURLbar = function() {
        window.scrollTo(0, 0);
    };

    var checkMobile = function() {
        if( navigator.userAgent.match(/Android/i)
         || navigator.userAgent.match(/webOS/i)
         || navigator.userAgent.match(/iPhone/i)
         || navigator.userAgent.match(/iPad/i)
         || navigator.userAgent.match(/iPod/i)
         || navigator.userAgent.match(/BlackBerry/i)
         || navigator.userAgent.match(/Windows Phone/i)
         ){
            mobile = true;
            if (!(window.orientation == 90 || window.orientation == -90)){
                portrait = true;
            }
        }
        if (navigator.userAgent.indexOf('iPhone') != -1 || navigator.userAgent.indexOf('Android') != -1) {
            // In Safari, the true version is after "Safari"
            if (navigator.userAgent.indexOf('Safari')!=-1) {
                // Set a variable to use later
                mobileSafari = true;
            }
            addEventListener("load", function() {
                if (mobileSafari){
                    setHeight();
                }
                if (mobile){
                    $(".layerPicker a[href='#DataDownload']").hide();
                    console.log("hey hey");
                }
                window.scrollTo(0, 1);
            }, false);
            addEventListener("orientationchange", function() {
                setHeight();
                window.scrollTo(0, 1);
            }, false);
        }

        // Set the div height
        function setHeight($body) {
            if (navigator.userAgent.match(/(iPad|iPhone|iPod touch);.*CPU.*OS 7_\d/i)){
                $("#mappage,.ui-mobile, .ui-mobile .ui-page").css("min-height", 0);
            }
            else {
                var new_height = $(window).height();
                // if mobileSafari add +60px
                new_height += 60;
                $('#mappage').css('min-height', 0 );
                $('#mappage').css('height', new_height );
            }
        }
        
    };

    var modernSetTimeout = function() {
        // From https://developer.mozilla.org/en-US/docs/Web/API/Window.setTimeout

        // The only case where this is helpful at the moment is IE9 -- only
        // attempt to do this in that case
        if ( ns.BROWSER === "IE" && ns.VERSION <= 9 ) {

            var __nativeST__ = window.setTimeout, __nativeSI__ = window.setInterval;

            window.setTimeout = function (vCallback, nDelay /*, argumentToPass1, argumentToPass2, etc. */) {
              var oThis = this, aArgs = Array.prototype.slice.call(arguments, 2);
              return __nativeST__(vCallback instanceof Function ? function () {
                vCallback.apply(oThis, aArgs);
              } : vCallback, nDelay);
            };

            window.setInterval = function (vCallback, nDelay /*, argumentToPass1, argumentToPass2, etc. */) {
              var oThis = this, aArgs = Array.prototype.slice.call(arguments, 2);
              return __nativeSI__(vCallback instanceof Function ? function () {
                vCallback.apply(oThis, aArgs);
              } : vCallback, nDelay);
            };
        }
    };

    var polyfillStringContains = function(){
        if ( ! ('contains' in String.prototype) ) {
            String.prototype.contains = function(str, startIndex) {
                return -1 !== String.prototype.indexOf.call(this, str,
                        startIndex);
            };
        };
    };

    var polyfillStringStartsWith = function() {
        if (!String.prototype.startsWith) {
            Object.defineProperty(String.prototype, 'startsWith', {
                enumerable: false,
                configurable: false,
                writable: false,
                value: function (searchString, position) {
                    position = position || 0;
                    return this.indexOf(searchString, position) === position;
                }
            });
        }
    };


    init();

})(Worldview.Support);
