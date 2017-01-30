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
var wv = wv || {};
wv.map = wv.map || {};

/*
 * @Class
 */
wv.map.animate = wv.map.animate || function(models, config, ui) {

    var model = models.map;
    var self = {};

    var map = ui.map.selected;

    var init = function(){

    };
    /*
     * Pan and zooms the map to a new location 
     *
     * @function move
     * @static
     *
     * @param {String} method - "fly" "pan" or "zoom"
     * @param {Array} location - Geographical coordinates
     * @param {Number} zoom - desired zoom level, if any
     *
     * @returns {void}
     */
    self.move = function(method, location, zoomLevel, callback) {

        var currentZoom = map.getView().getZoom();
        var newZoom = zoomLevel || 5;
        
        var duration = ( method == "fly" ) ? 5000 : 1000;
        var wait = ( method == "fly" ) ? 1000 : 1;

        var start = +new Date();

        var pan = ol.animation.pan({
            duration: duration,
            source: map.getView().getCenter(),
            start: start
        });

        // use this to set proper zoom/res

        // For bounce, if zoom is too high, it bounces "in" instead of "out";
        // force it to zoom out by starting at zoom 4
        var bounceZoom = (currentZoom >= 8) ? 4 : currentZoom - 2;
        if (bounceZoom < 0) {
            bounceZoom = 0;
        }

        var bounce = ol.animation.bounce({
            duration: duration,
            resolution: models.proj.selected.resolutions[bounceZoom],
            start: start
        });
        var zoomTo = ol.animation.zoom({
            duration: duration,
            resolution: models.proj.selected.resolutions[currentZoom],
            start: start
        });
        //If the zoom level is far out enough then it should start with a 'zoom'
        if(currentZoom < 4) {
            method = 'zoom';
        }

        setTimeout(function() {
            if ( method === "fly" ) {
                map.beforeRender(pan, bounce);
            } else if ( method === 'zoom' ) {
                map.beforeRender(pan, zoomTo);
            } else {
                map.beforeRender(pan);
            }
            if ( location.length == 2 ) {
                map.getView()
                    .setCenter(location);

                map.getView().setZoom(zoomLevel);

            } else {
                map.getView().fit(location, map.getSize());
                if(map.getView().getZoom() > 8)
                    map.getView().setZoom(8);
            }
            callback();
        }, wait);
    };

    
    init();
    return self;

}
