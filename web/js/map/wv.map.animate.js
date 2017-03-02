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
        var start, currentZoom, newZoom, duration, wait, startTime, pan, bounceZoom, view, zoomTo, needsToZoomOut, flyParams;
        
        start = lastLocation || map.getView().getCenter();

        //Determine zoom and pan levels depending on distance to new point
        //var distance = ol.sphere.ESPG4326.haversineDistance(start, location);
        
        currentZoom = map.getView().getZoom();
        newZoom = zoomLevel || 5;
        
        duration = ( method == "fly" ) ? 5000 : 1000;
        wait = ( method == "fly" ) ? 1000 : 1;


        view = map.getView();
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
                bounce(view, duration, bounceZoom, newZoom);
                fly(view, duration, location, newZoom);
            } else if ( method === 'zoom' ) {
                zoom(view, duration, newZoom);
                fly(view, duration, location, newZoom);
            } else {
                fly(view, duration, location, newZoom);
            }
            callback();
        }, wait);

        lastLocation = location;
    };
    /*
     * Zooms in to next event location
     *
     * @method zoom
     * @private
     *
     * @param {object} view - OL view Object
     * @param {number} duration - time of map animation
     * @param {Object} newZoom - Zoom level at the end of animation
     *
     * @returns {void}
     */
    var zoom = function(view, duration, newZoom) {
        view.animate({
            duration: duration,
            zoom: newZoom
        });
    };
    /*
     * A method that zooms of a current zoom level and then
     *  back down into the zoom level of the next event
     *
     * @method bouce
     * @private
     *
     * @param {object} view - OL view Object
     * @param {number} duration - time of map animation
     * @param {array} bounceZoom - Outmost zoom level of animation
     * @param {Object} newZoom - Zoom level at the end of animation
     *
     * @returns {void}
     */
    var bounce = function(view, duration, bounceZoom, newZoom) {
        view.animate({
          zoom: bounceZoom,
          duration: duration / 2
        }, {
          zoom: newZoom,
          duration: duration / 2
        });
    };

    /*
     * Determines whether event provides a bounding box
     *  or a coord and triggers the method that will take
     *  the user to that location
     *
     * @method fly
     * @private
     *
     * @param {object} view - OL view Object
     * @param {number} duration - time of map animation
     * @param {array} location - Coordinates of Event
     *
     * @returns {void}
     */
    var fly = function(view, duration, location) {
        if(location.length > 2) {
            fitToBox(view, duration, location, map);
        } else {
            goToNewLocal(view, duration, location);
        }
    };

    /*
     * Animates in direction of new coordinates
     *
     * @method goToNewLocal
     * @private
     *
     * @param {object} view - OL view Object
     * @param {number} duration - time of map animation
     * @param {array} location - Coordinates of Event
     *
     * @returns {void}
     */
    var goToNewLocal = function(view, duration, location) {
        view.animate({
            duration: duration,
            center: location
        });
    };

    /*
     * Animates to Bounding Box
     *
     * @method setLineDefaults
     * @private
     *
     * @param {object} view - OL view Object
     * @param {number} duration - time of map animation
     * @param {array} extent - Bounding box of event
     *
     * @returns {void}
     */
    var fitToBox = function(view, duration, extent) {
        view.fit(extent, {size: map.getSize(), duration: duration});
    };

    init();
    return self;

};
