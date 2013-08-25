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
Worldview.Widget.DataDownload = function(config, spec) {

    var log = Logging.getLogger("Worldview.DataDownload");
    Logging.debug("Worldview.DataDownload");
            
    var HTML_WIDGET_INACTIVE = "<img src='images/camera.png'></img>";
    var HTML_WIDGET_ACTIVE = "<img src='images/cameraon.png'></img>";
   
    var model = spec.model; 
    var controlDialog = null;
    var mapController = null;
   
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
            .on("queryError", onQueryError)
            .on("queryTimeout", onQueryTimeout)
            .on("granuleSelect", updateButton)
            .on("granuleUnselect", updateButton)
        
        REGISTRY.register(self.containerId, self);
        REGISTRY.markComponentReady(self.containerId);   
        self.updateComponent();     
    };    
    
    self.updateComponent = function(queryString) {
        try {
            model.update(REGISTRY.getState());
        } catch ( error ) {
            Worldview.error("Internal error", error);
        }
    };
    
    self.getValue = function() {
        if ( model.active ) {
            return "dataDownload=" + model.selectedLayer;
        } else {
            return "";
        }
    };
    
    self.setValue = function(value) {
        throw new Error("Unsupported: setValue");
    };
    
    self.loadFromQuery = function(queryString) {
        var query = Worldview.queryStringToObject(queryString);
        if ( query.dataDownload ) {
            model.activate(query.dataDownload);
        }    
    };
    
    self.render = function() {
        var tabsHeight = $(".ui-tabs-nav").outerHeight(true);
        $(spec.selector)
            .height($(spec.selector).parent().outerHeight() - tabsHeight)
            .html("<input type='button' class='ui-disabled' value=''>")
            .trigger("create");
        $(spec.selector + " input[type='button']").click(function() {
            model.activate();
        });  
    };
    
    var toggleMode = function() {
        model.toggleMode();           
    };
    
    var onActivate = function() {
        log.debug("activate");
        
        if ( !controlDialog ) {
            controlDialog = Worldview.DataDownload.ControlDialog(model);
            controlDialog.events.on("hide", function() {
                model.deactivate();
            });
        }
        controlDialog.show();
        
        if ( !mapController ) {
            mapController = 
                Worldview.DataDownload.MapController(model, spec.maps, config);
        }
        updateButton();
    };
    
    var onDeactivate = function() {
        log.debug("deactivate");
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
        log.debug("queryResults", results);
        Worldview.Indicator.hide();
        if ( results.granules.length === 0 ) {
            Worldview.Indicator.noData();
        }
    };
    
    var onQueryCancel = function() {
        log.debug("queryCancel");
        Worldview.Indicator.hide();
    };
    
    var onQueryError = function(status, error) {
        log.debug("queryError", status, error);
        Worldview.Indicator.hide();
        Worldview.notify("Unable to search at this time. Please try again later");
    };
    
    var onQueryTimeout = function() {
        log.debug("queryTimeout");
        Worldview.Indicator.hide();
        Worldview.notify(
            "No results received yet. This may be due to a " +
            "connectivity issue. Please try again later."
        );
    };
    
    var updateButton = function() {
        var selected = Worldview.size(model.selectedGranules);
        if ( selected > 0 ) {
            $(spec.selector + " input[type='button']").button("enable");
        } else {
            $(spec.selector + " input[type='button']").button("disable");            
        }
        $(spec.selector + " .ui-btn .ui-btn-text")
            .html("Download (" + selected + ")");        
    }
    
    init();
    return self;
    
};

