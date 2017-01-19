/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2016 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

/**
 * @module wv.naturalEvents
 */
var wv = wv || {};
wv.naturalEvents = wv.naturalEvents || {};

/**
 * @class wv.naturalEvents.model
 */
wv.naturalEvents.model = wv.naturalEvents.model || function(models, config) {

    var self = {};
    self.selected = null;
    self.active = false;
    var state = {
        layersString: null,
        projection: null,
        epsg: null,
        time: null
    };
    self.EVENT_QUERY_RESULTS = "queryResults";
    self.EVENT_SELECT = "select";
    self.apiURL = config.features.naturalEvents.host;
    var querySuccessFlag = false;
    var lastIndex = -1;
    var lastDateIndex = -1;
    /**
     * Handler for events fired by this class.
     *
     * @attribute events {Events}
     * @readOnly
     * @type Events
     */
    self.events = wv.util.events();

    var layerLists = config.naturalEvents.layers;
    self.ignored = config.naturalEvents.skip || [];

    self.data = {};

    var init = function() {
        self.events.on( "queryResults", onQueryResults );
        //self.events.on( "select", onSelect );
        self.query();
    };
    // TODO: Reuse permalinks when we have historical events
    var onQueryResults = function(){
        if ( self.data ) {
            querySuccessFlag = true;
            //models.link.register(self);
            //models.link.load(self);
        }
    };
    var onSelect = function(){
        self.save();
    };

    self.select = function(index, dateIndex) {

        if ( index === lastIndex && lastDateIndex === dateIndex ) {
            return;
        }

        var method = "fly";
        if ( index == lastIndex && dateIndex != lastDateIndex ) {
            method = "pan";
        }
        lastIndex = index;
        lastDateIndex = lastDateIndex;

        if(models.proj.selected.id !=='geographic') {
            models.proj.select('geographic');
        }
        self.selected = index;
        event = self.data[index];

        eventItem = null;
        if ( event.geometries.length > 1 ) {
            eventItem = event.geometries[dateIndex || 0];
        } else {
            eventItem = event.geometries[0];
        }


        category = "Default";
        categories = event.categories;
        if ( categories.constructor !== Array ) {
            categories = [categories];
        }
        _.each(categories, function(c) {
            if ( layerLists[c.title] ) {
                category = c.title;
                return;
            }
        });

        layers = layerLists[category];
        if ( !layers ) {
            layers = layerLists.Default;
        }

        // Turn off all layers in list first
        _.each(models.layers.active, function(layer){
            models.layers.setVisibility( layer.id, false );
        });

        // Turn on or add new layers
        _.each(layers, function(layer) {
            var id = layer[0];
            var visible = layer[1];
            if( models.layers.exists( id ) ) {
                models.layers.setVisibility( id, visible );
            }
            else{
                models.layers.add(id, { visible: visible });
            }
        });

        // If an event is a Wildfire and the event date isn't "today", select
        // the following day to greatly improve the chance of the satellite
        // seeing the event
        //
        // NOTE: there is a risk that if the fire happened "yesterday" and
        // the satellite imagery is not yet available for "today", this
        // functionality may do more harm than good
        eventDate = wv.util.parseTimestampUTC(eventItem.date);
        var eventDateISOString = wv.util.toISOStringDate(eventDate);
        var todayDateISOString = wv.util.toISOStringDate(wv.util.today());
        var eventCategoryName = getEventCategoryName();
        if ((eventDateISOString !== todayDateISOString) &&
            ((eventCategoryName !== null) && (eventCategoryName == "Wildfires"))) {
            var eventDatePlusOne =
                wv.util.dateAdd(wv.util.parseDateUTC(eventItem.date), "day", 1);
            models.date.select(eventDatePlusOne);
        }
        else {
            models.date.select(eventDate);
        }
        if ( eventItem.type === "Point" ) {
            goTo(method, eventItem.coordinates);
        } else if ( eventItem.type === "Polygon" && eventItem.coordinates[0].length == 5 ) {
            c = eventItem.coordinates[0];
            var extent = [c[0][0], c[0][1], c[2][0], c[2][1]];
            goTo(method, extent);
        }
    };

    var goTo = function(method, location) {

        var map = wvx.ui.map.selected;
        var zoom = map.getView().getZoom();//3;
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
        var bounceZoom = (zoom >= 8) ? 4 : zoom-2;
        if (bounceZoom < 0) { bounceZoom = 0; }

        var bounce = ol.animation.bounce({
            duration: duration,
            resolution: models.proj.selected.resolutions[bounceZoom],
            start: start
        });
        var zoomTo = ol.animation.zoom({
            duration: duration,
            resolution: models.proj.selected.resolutions[zoom],
            start: start
        });
        //HAX
        if(zoom < 4){
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

                // Retrieve event category name, if possible
                var eventCategoryName = getEventCategoryName();

                // If an event is a Wildfire or Volcano, zoom in more
                if ((eventCategoryName !== null) && (eventCategoryName == "Wildfires")) {
                  map.getView().setZoom(8);
                } else if (eventCategoryName == "Volcanoes") {
                  map.getView().setZoom(6);
                } else {
                  map.getView().setZoom(5);
                }

            } else {
                map.getView().fit(location, map.getSize());
                if(map.getView().getZoom() > 8)
                    map.getView().setZoom(8);
            }
        }, wait);
    };

    self.save = function(state) {
        if ( self.active ){
            state.events = self.selected;
        }
    };

    self.load = function(state) {
        var eventsTab = state.events;
        if ( eventsTab ) {
            models.wv.events.on("startup", function() {
                wvx.ui.sidebar.selectTab("events");
            });
        }
    };
    /*
    self.register = function(crs, def) {
        if ( def && window.proj4 ) {
            proj4.defs(crs, def);
        }
    };
    */

    var queryEvents = function(callback) {
        var url = self.apiURL + "/events";
        $.getJSON(url, function(data) {
            self.data = data.events;
            self.events.trigger('queryResults');
        });
    };

    var queryTypes = function(callback) {
        var url = self.apiURL + "/categories";
        $.getJSON(url, function(data) {
            self.types = data.categories;
            self.events.trigger('queryResults');
        });
    };

    var querySources = function(callback) {
        var url = self.apiURL + "/sources";
        $.getJSON(url, function(data) {
            self.sources = data.sources;
            self.events.trigger('queryResults');
        });
    };

    self.query = function(callback) {
        queryTypes();
        queryEvents();
        querySources();
    };

    // Retrieve event category name, if possible;  otherwise returns null
    var getEventCategoryName = function() {
        var eventCategoryName = null;
        if ((lastIndex != -1) && (self.data !== null) && (self.data[lastIndex] !== null)) {
            var eventCategory = self.data[lastIndex].categories;
            if (eventCategory.length > 0)
            {
                eventCategory = eventCategory[0];
                eventCategoryName = eventCategory["#text"];
            }
        }
        return eventCategoryName;
    };

    init();
    return self;
};
