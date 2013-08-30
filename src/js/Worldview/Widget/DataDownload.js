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
    var mapController = null;
    var downloadListPanel = null;
    
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
            .on("granuleSelect", updateSelection)
            .on("granuleUnselect", updateSelection);
        
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
            .html(
                "<div id='DataDownload_Button'>" + 
                    "<input id='DataDownload_Button' type='button'" +  
                        "class='ui-disabled' value=''>" + 
                "</div>" + 
                "<div id='productSelector'></div>" + 
                "<div data-role='fieldcontain'>" +
                    "<fieldset id='DataDownload_Prefer' data-role='controlgroup'>" +
                    "<input type='radio' id='DataDownload_BestAvailable' name='prefer' value='science' checked='checked'/>" + 
                    "<label for='DataDownload_BestAvailable'>Best Available</label>" +
                    "<input type='radio' id='DataDownload_PreferNRT' name='prefer' value='nrt'/>" + 
                    "<label for='DataDownload_PreferNRT'>Prefer Near Real Time</label>" +                
                "</fieldset></div>")
            .trigger("create");
        Worldview.DataDownload.ProductSelector(model,"#productSelector");       
        $(spec.selector + " input[type='button']").click(function() {
            model.activate();
        });  
        
        $("#DataDownload_Button .ui-btn").click(showDownloadList);
        $("#DataDownload_Prefer").on("change", updatePreference);
    };
    
    var toggleMode = function() {
        model.toggleMode();           
    };
    
    var onActivate = function() {
        log.debug("activate");
        
        if ( !mapController ) {
            mapController = 
                Worldview.DataDownload.MapController(model, spec.maps, config);
        }
        updateSelection();
    };
    
    var onDeactivate = function() {
        log.debug("deactivate");
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
    
    var updateSelection = function() {
        var selected = Worldview.size(model.selectedGranules);
        if ( selected > 0 ) {
            $("#DataDownload_Button input[type='button']").button("enable");
        } else {
            $("#DataDownload_Button input[type='button']").button("disable");            
        }
        $("#DataDownload_Button .ui-btn .ui-btn-text")
            .html("Download (" + selected + ")");   
            
        if ( downloadListPanel && downloadListPanel.visible() ) {
            downloadListPanel.show();
        }     
    };
    
    var showDownloadList = function() {
        if ( !downloadListPanel ) {
            downloadListPanel = 
                    Worldview.DataDownload.DownloadListPanel(config, model);
        }
        downloadListPanel.show(); 
    };
    
    var updatePreference = function(event, ui) {
        model.setPreference(event.target.value);
    };
    
    init();
    return self;
    
};

