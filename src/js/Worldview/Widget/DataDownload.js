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
   
    var list = null;
    var model = spec.model; 
    var mapController = null;
    var downloadListPanel = null;
    
    var self = {};
    self.containerId = "DataDownload";
    
    var init = function() {        
        model.events
            .on("activate", onActivate)
            .on("deactivate", onDeactivate)
            .on("productSelect", onProductSelect)
            .on("layerUpdate", onLayerUpdate)
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
        var tabs_height = $(".ui-tabs-nav").outerHeight(true);
        $(spec.selector).addClass('bank');
        $(spec.selector).height($(spec.selector).parent().outerHeight() - tabs_height); 
        
        list = new SOTE.widget.List(self.containerId, {
            config: config,
            data: [],
            selected: "~",
            close: false,
            filter: true,
            search: false,
            action: {
                text: "Download", 
                callback: function() { showDownloadList(); }
            },
            selectableCategories: {
                callback: function(product) { model.selectProduct(product); },
                defaultText: "0 selected"
            },
            onchange: function() { console.log("onchange", arguments); },
            args: self
        });
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
        onLayerUpdate();
    };
    
    var onDeactivate = function() {
        log.debug("deactivate");
        Worldview.Indicator.hide();
    };
    
    var onProductSelect = function(product) {
        log.debug("selectProduct", product);
        list.selectCategory(product);
    };
    
    var onLayerUpdate = function() {
        if ( !model.active ) {
            return;
        }
        list.data = model.groupByProducts();
        list.selected = list.unserialize(model.getProductsString())[1];
        list.update();
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
        if ( status !== "abort" ) {
            Worldview.notify("Unable to search at this time. Please try " + 
                    "again later");
        }
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
            list.setButtonEnabled(true);
            var totalSize = model.getSelectionSize();
            if ( totalSize ) {
                var formattedSize = Math.round(totalSize * 100) / 100;
                list.setActionButtonText("Download (" + formattedSize + " MB)");
            } else {
                list.setActionButtonText("Download");
            }
        } else {
            list.setButtonEnabled(false);
            list.setActionButtonText("Download");
        }
        
        var counts = model.getSelectionCounts();
        $.each(counts, function(productId, count) {
            list.setCategoryDynamicText(productId, "" + count + " selected");    
        });            
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

