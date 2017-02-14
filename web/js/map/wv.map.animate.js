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
    var lastLocation;

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

        var start = lastLocation || map.getView().getCenter();

        //Determine zoom and pan levels depending on distance to new point
        //var distance = ol.sphere.ESPG4326.haversineDistance(start, location);

        var currentZoom = map.getView().getZoom();
        var newZoom = zoomLevel || 5;
        
        var duration = ( method == "fly" ) ? 5000 : 1000;
        var wait = ( method == "fly" ) ? 1000 : 1;

        var startTime = +new Date();

        var pan = ol.animation.pan({
            duration: duration,
            source: map.getView().getCenter(),
            start: startTime
        });

        // use this to set proper zoom/res

        // For bounce, if zoom is too high, it bounces "in" insteade of "out";
        // force it to zoom out by starting at zoom 4
        var bounceZoom = (currentZoom >= 8) ? 4 : currentZoom - 3;
        if (bounceZoom < 0) {
            bounceZoom = 0;
        }

        var bounce = ol.animation.bounce({
            duration: duration,
            resolution: models.proj.selected.resolutions[bounceZoom],
            start: startTime
        });
        var zoomTo = ol.animation.zoom({
            duration: duration,
            resolution: models.proj.selected.resolutions[currentZoom],
            start: startTime
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

                map.getView().setZoom(newZoom);

            } else {
                map.getView().fit(location, map.getSize());
                if(map.getView().getZoom() > 8)
                    map.getView().setZoom(8);
            }
            callback();
        }, wait);

        lastLocation = location;
    };

    init();
    return self;

};
