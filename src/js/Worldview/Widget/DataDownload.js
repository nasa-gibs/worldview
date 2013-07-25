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
 * @param model {Worldview.DataDownload.Model} model for which this widget
 * will be a view for.
 * 
 * @param config Worldview config
 * 
 * @param spec.selector {string} jQuery selector for where the mode activation
 * button should be rendered.
 */
Worldview.Widget.DataDownload = function(model, config, spec) {

    var log = Logging.getLogger("Widget.DataDownload");
            
    var HTML_WIDGET_INACTIVE = "<img src='images/camera.png'></img>";
    var HTML_WIDGET_ACTIVE = "<img src='images/cameraon.png'></img>";
    
    var preloader = Worldview.Preloader([
        "images/activity.gif",
        "images/cameraon.png"    
    ]);
    var controlDialog = null;
    
    var self = {};
    self.containerId = "dataDownload";
        
    var init = function() {        
        model.events.on("activate", onActivate);
        model.events.on("deactivate", onDeactivate);
        model.events.on("layerSelect", onLayerSelect);
        
        $(spec.selector).on("click", function() { toggleMode(); } );
        
        onDeactivate();
        
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
        preloader.execute(function() {
            model.toggleMode();
        });              
    }
    
    var onActivate = function() {
        log.debug("activate");
        $(spec.selector).html(HTML_WIDGET_ACTIVE);
        controlDialog = Worldview.DataDownload.ControlDialog(model);
        controlDialog.events.on("close", function() {
            model.deactivate();
        });
    };
    
    var onDeactivate = function() {
        log.debug("deactivate");
        $(spec.selector).html(HTML_WIDGET_INACTIVE);
    };
    
    var onLayerSelect = function(layerName) {
        log.debug("selectLayer", layerName);
    };
    
    init();
    return self;
    
};

