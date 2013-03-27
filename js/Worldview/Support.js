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
        shimFreeze();
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
            
    var shimFreeze = function() {
        if ( !Object.freeze ) {
            Object.freeze = function() {}
        }
    };
    
    init();
    
})(Worldview.Support);
