Worldview.namespace("Support");

(function(ns) {
    
    ns.WEB_WORKERS = false;
    
    var log = Logging.Logger();

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
    
    var checkWebWorkers = function() {
        if ( window.Worker ) {
            ns.WEB_WORKERS = true;
        } else { 
            log.warn("Web workers are not supported");
        }
    };
        
    var init = function() {
        jQueryLayerFix();
        checkWebWorkers();
    };
    
    init();
    
})(Worldview.Support);
