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
                "browser. Upgrade or try again in a different browser.")
    };
    
    ns.quirks = function() {
        jQueryLayerFix();
        shimConsole();
        checkMobile();
        fixSize();
    };
    
    var init = function() {
        if ( / Safari\//.test(navigator.userAgent) ) {
            ns.BROWSER = "Safari";
            var version = navigator.userAgent.match(/ Version\/([^ ]+)/);
            if ( version ) {
                ns.VERSION = version[1].split(".");
            }
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
            }    
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
        }
        setTimeout(execute, 700);
        setTimeout(execute, 1500);            
    };

    var hideURLbar = function() {
        window.scrollTo(0, 1);
    };
    
    var checkMobile = function() {
        if (navigator.userAgent.indexOf('iPhone') != -1 || navigator.userAgent.indexOf('Android') != -1) {
            // In Safari, the true version is after "Safari" 
            if (navigator.userAgent.indexOf('Safari')!=-1) {
                // Set a variable to use later
                mobileSafari = true;
            }
            addEventListener("load", function() {
                    setTimeout(hideURLbar, 0);
            }, false);
            addEventListener("orientationchange", function() {
                    setTimeout(hideURLbar, 0);
            }, false);
        }
        
        // Set the div height
        function setHeight($body) {
            if (navigator.userAgent.indexOf('iPhone') != -1 && navigator.userAgent.indexOf('Safari')!=-1) {
                var new_height = $(window).height();
                // if mobileSafari add +60px
                new_height += 60; 
                $body.css('min-height', 0 );
                $body.css('height', new_height );
            
            }
            
        }
     
        setHeight( $('#mappage') );
        $(window).resize(function() {
            setHeight($('#mappage'));
        });
    };
            
    init();
    
})(Worldview.Support);
