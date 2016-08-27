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

    var layerLists = {
        Wildfires: [
            ["MODIS_Terra_CorrectedReflectance_TrueColor", true],
            ["MODIS_Aqua_CorrectedReflectance_TrueColor", false],
            ["VIIRS_SNPP_CorrectedReflectance_TrueColor", false],
            ["MODIS_Fires_Terra", true],
            ["MODIS_Fires_Aqua", false],
            ["Reference_Features", true],
            ["Reference_Labels", true],
            ["VIIRS_SNPP_Fires_375m_Day", false],
            ["VIIRS_SNPP_Fires_375m_Night", false]
        ],
        "Temperature Extremes": [
            ["MODIS_Aqua_CorrectedReflectance_TrueColor", false],
            ["MODIS_Terra_CorrectedReflectance_TrueColor", true],
            ["VIIRS_SNPP_CorrectedReflectance_TrueColor", false],
            ["Reference_Features", true],
            ["Reference_Labels", true],
            ["MODIS_Aqua_Land_Surface_Temp_Day", false],
            ["MODIS_Terra_Land_Surface_Temp_Day", true]
        ],
        Floods: [
            ["Reference_Features", true],
            ["Reference_Labels", true],
            ["MODIS_Aqua_SurfaceReflectance_Bands121", false],
            ["MODIS_Terra_SurfaceReflectance_Bands121", true]
        ],
        Volcanoes: [
            ["MODIS_Terra_CorrectedReflectance_TrueColor", true],
            ["MODIS_Aqua_CorrectedReflectance_TrueColor", false],
            ["VIIRS_SNPP_CorrectedReflectance_TrueColor", false],
            ["AIRS_Prata_SO2_Index_Day", true],
            ["AIRS_Prata_SO2_Index_Night", false],
            ["MODIS_Fires_Terra", true],
            ["MODIS_Fires_Aqua", false],
            ["Reference_Features", true],
            ["Reference_Labels", true],
            ["VIIRS_SNPP_Fires_375m_Day", false],
            ["VIIRS_SNPP_Fires_375m_Night", false]
        ],
        Default: [
            ["Reference_Features", true],
            ["Reference_Labels", true],
            ["MODIS_Terra_CorrectedReflectance_TrueColor", true],
            ["MODIS_Aqua_CorrectedReflectance_TrueColor", false],
            ["VIIRS_SNPP_CorrectedReflectance_TrueColor", false]
        ]
    };

    self.data = {};

    var init = function() {
        //self.events.on( "queryResults", onQueryResults );
        //self.events.on( "select", onSelect );
        self.query();
    };
    /* TODO: Reuse permalinks when we have historical events
    var onQueryResults = function(){
        if ( self.data && self.sources && self.types) {
            querySuccessFlag = true;
            models.link.register(self);
            models.link.load(self);
        }
    };
    var onSelect = function(){
        self.save();
    };
    */
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

        if(models.proj.selected.id !=='geographic'){
            models.proj.select('geographic');
        }
        self.selected = index;
        event = self.data[index];

        eventItem = null;
        if ( event.geometry.length > 1 ) {
            eventItem = event.geometry[dateIndex || 0];
        } else {
            eventItem = event.geometry[0];
        }
        eventDate = wv.util.parseTimestampUTC(eventItem.date);
        models.date.select(eventDate);

        category = "Default";
        categories = event.category;
        if ( categories.constructor !== Array ) {
            categories = [categories];
        }
        _.each(categories, function(c) {
            if ( layerLists[c["#text"]] ) {
                category = c["#text"];
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

        if ( eventItem.type === "Point" ) {
            goTo(method, eventItem.coordinates);
        } else if ( eventItem.type === "Polygon" && eventItem.coordinates.length == 5 ) {
            c = eventItem.coordinates;
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
        var bounce = ol.animation.bounce({
            duration: duration,
            resolution: models.proj.selected.resolutions[zoom-2],
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
                var eventCategoryName = null;
                if ((lastIndex != -1) && (self.data !== null) && (self.data[lastIndex] !== null)) {
                  var eventCategory = self.data[lastIndex].category;
                  if (eventCategory.length > 0)
                  {
                    eventCategory = eventCategory[0];
                    eventCategoryName = eventCategory["#text"];
                  }
                }

                // If an event is a Wildfire, zoom in more
                if ((eventCategoryName !== null) && (eventCategoryName == "Wildfires")) {
                  map.getView().setZoom(7);
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
        var url = "https://eonet.sci.gsfc.nasa.gov/api/v1/events";
        $.getJSON(url, function(data) {
            self.data = data.item;
            self.events.trigger('queryResults');
        });
    };

    var queryTypes = function(callback) {
        var url = "https://eonet.sci.gsfc.nasa.gov/api/v1/types";
        $.getJSON(url, function(data) {
            self.types = data.item;
            self.events.trigger('queryResults');
        });
    };

    var querySources = function(callback) {
        var url = "https://eonet.sci.gsfc.nasa.gov/api/v1/sources";
        $.getJSON(url, function(data) {
            self.sources = data.item;
            self.events.trigger('queryResults');
        });
    };

    self.query = function(callback) {
        queryTypes();
        queryEvents();
        querySources();
    };

    init();
    return self;
};
