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

Worldview.namespace("Widget");

/**
 * Handles UI interactions with the Data Download model.
 * 
 * @module Worldview.Widget
 * @class DataDownload
 * @constructor
 * 
 * @param model {Worldview.DataDownload.Model} FIXME
 * 
 * @param config Worldview config
 * 
 * @param spec.selector {string} jQuery selector for where the mode activation
 * button should be rendered.
 */
Worldview.Widget.DataDownload = function(spec) {

    var log = Logging.getLogger("Worldview.DataDownload");
    Logging.debug("Worldview.DataDownload");
            
    var HTML_WIDGET_INACTIVE = "<img src='images/camera.png'></img>";
    var HTML_WIDGET_ACTIVE = "<img src='images/cameraon.png'></img>";
    
    var model = spec.model;
    var controlDialog = null;
    var mapView = null;
    
    var self = {};
    self.containerId = "dataDownload";
        
    var init = function() {        
        model.events
            .on("activate", onActivate)
            .on("deactivate", onDeactivate)
            .on("layerSelect", onLayerSelect)
            .on("query", onQuery)
            .on("queryResults", onQueryResults)
            .on("queryCancel", onQueryCancel)
            .on("queryError", onQueryError);
        
        $(spec.selector).on("click", toggleMode);        
        $(spec.selector).html(HTML_WIDGET_INACTIVE);

        REGISTRY.register(self.containerId, self);
        REGISTRY.markComponentReady(self.containerId);        
    };    
    
    self.updateComponent = function(queryString) {
        try {
            model.update(REGISTRY.getState());
        } catch ( error ) {
            Worldview.error("Internal error", error);
        }
    };
    
    self.getValue = function() {};
    
    var toggleMode = function() {
        model.toggleMode();           
    };
    
    var onActivate = function() {
        log.debug("activate");
        $(spec.selector).html(HTML_WIDGET_ACTIVE);
        
        if ( !controlDialog ) {
            controlDialog = Worldview.DataDownload.ControlDialog(model);
            controlDialog.events.on("hide", function() {
                model.deactivate();
            });
        }
        controlDialog.show();
        
        if ( !mapView ) {
            mapView = Worldview.DataDownload.MapView(model, spec.maps, config);
        }
        
    };
    
    var onDeactivate = function() {
        log.debug("deactivate");
        $(spec.selector).html(HTML_WIDGET_INACTIVE);
        controlDialog.hide();
        Worldview.Indicator.hide();
    };
    
    var onLayerSelect = function(layerName) {
        log.debug("selectLayer", layerName);
    };
    
    var onQuery = function() {
        log.debug("query");
        Worldview.Indicator.searching();
    };
    
    var onQueryResults = function(results) {
        log.debug("queryResults", results.length);
        Worldview.Indicator.hide();
        if ( results.length === 0 ) {
            Worldview.Indicator.noData();
        }
    };
    
    var onQueryCancel = function() {
        log.debug("queryCancel");
        Worldview.Indicator.hide();
    };
    
    var onQueryError = function(status, error, parameters) {
        log.debug("queryError", status, error, parameters);
        Worldview.Indicator.hide();
        Worldview.notify("Unable to query at this time. Please try again later",
                error);
    };
    
    init();
    return self;
    
};

