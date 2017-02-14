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
        var start, currentZoom, newZoom, duration, wait, startTime, pan, bounceZoom, bounce, view, zoomTo;
        
        start = lastLocation || map.getView().getCenter();

        //Determine zoom and pan levels depending on distance to new point
        //var distance = ol.sphere.ESPG4326.haversineDistance(start, location);

        currentZoom = map.getView().getZoom();
        newZoom = zoomLevel || 5;
        
        duration = ( method == "fly" ) ? 5000 : 1000;
        wait = ( method == "fly" ) ? 1000 : 1;


        view = map.getView();
        // pan = view.animate({
        //     duration: duration,
        // });

        // use this to set proper zoom/res

        // For bounce, if zoom is too high, it bounces "in" insteade of "out";
        // force it to zoom out by starting at zoom 4
        bounceZoom = (currentZoom >= 8) ? 4 : currentZoom - 3;
        if (bounceZoom < 0) {
            bounceZoom = 0;
        }

        if(currentZoom < 4) {
            method = 'zoom';
        }

        setTimeout(function() {
            if ( method === "fly" ) {
                view.animate({
                    duration: duration,
                    resolution: models.proj.selected.resolutions[bounceZoom],
                },
                {
                    duration: duration,
                    center: location,
                    zoom: newZoom
            });
            } else if ( method === 'zoom' ) {
                view.animate({
                    duration: duration,
                    zoom: models.proj.selected.resolutions[currentZoom]
                },
                {
                    duration: duration,
                    center: location,
                    zoom: newZoom
            });
            } else {
                view.animate({
                    duration: duration,
                    center: location,
                    zoom: newZoom
                });
            }

            callback();
        }, wait);

        lastLocation = location;
    };

    init();
    return self;

};
