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

Worldview.Widget.PaletteManager = function(containerId, config) {
    
    var self = {};
    var log = Logging.Logger("Worldview.PaletteManager");
    var value = "";
    
    self.config = config;
    
    var init = function() {
        //Logging.debug("Worldview.PaletteManager");
        log.debug("PaletteManager.init");
        if ( REGISTRY ) {
            REGISTRY.register(containerId, self);
        } else {
            throw "Cannot register PaletteManager, REGISTRY not found";
        }
        REGISTRY.markComponentReady(containerId);        
    };
    
    self.setValue = function(v) {
        if ( v === undefined ) {
            return;
        }
        if ( v !== value ) {
            log.debug("PaletteManager.setValue: " + v);
            value = v;
            REGISTRY.fire(self);
        }
    };
    
    self.getValue = function() {
        return containerId + "=" + value;
    };
    
    self.displaySelector = function(product) { 
        var dialog = new YAHOO.widget.Panel("palette-selector-dialog", {
            width: "300px", 
            height: "500px",
            zIndex: 1020, 
            visible: false 
        });
        dialog.setHeader("Select palette");
        dialog.setBody("<div id='palette-selector'></div>");
        dialog.render(document.body);
        dialog.show();
        dialog.center();
        dialog.hideEvent.subscribe(function(i) {
            setTimeout(function() {dialog.destroy();}, 25);
        });       
        
        var palettes = [];
        var canvas = document.createElement("canvas");
        canvas.width = 100;
        canvas.height = 14;
        
        $.each(self.config.palettes, function(name, p) {
            if ( p.source === "stock" ) {
                var cb = Worldview.Palette.ColorBar({canvas: canvas, palette: p});
                p.image = cb.toImage();
                palettes.push(p);
            }       
        });
   
        var paletteSelector = Worldview.Palette.PaletteSelector({
            selector: "#palette-selector",
            palettes: palettes
        });
                 
        paletteSelector.addSelectionListener(function(palette) {
            console.log(palette); 
            self.setValue(product + "," + palette.id);
        });
                                 
    };

    self.loadFromQuery = function(queryString) {
        log.debug("PaletteManager.loadFromQuery: " + queryString);
        var query = Worldview.queryStringToObject(queryString);
        self.setValue(query.palettes);    
    };
    
    init();
    return self;
}
