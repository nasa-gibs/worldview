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

Worldview.Widget.Palette = function(containerId, config, spec) {
    
    var self = {};
    var log = Logging.getLogger("Worldview.Widget.Palette");
    var value = "";
    var dialog = null;
    var dialogForProduct = null;
    
    self.config = config;
    self.active = {};
    self.alignTo = spec.alignTo;
    
    var init = function() {
        //Logging.debug("Worldview.paletteWidget");        
        log.debug("paletteWidget.init");
        if ( REGISTRY ) {
            REGISTRY.register(containerId, self);
        } else {
            throw new Error("Cannot register paletteWidget, REGISTRY " + 
                    "not found");
        }
        REGISTRY.markComponentReady(containerId);        
    };
    
    self.getPalette = function(product) {
        var name = self.active[product];
        if ( !name ) {
            name = config.products[product].rendered;
        }
        if ( !name ) {
            return null;
        }
        return config.palettes[name];    
    }
    
    self.setValue = function(v) {
        if ( v === undefined ) {
            return;
        }
        self.active = {};
        var parts = v.split("~");
        $.each(parts, function(index, part) {
            var segments = part.split(",");
            self.active[segments[0]] = segments[1];    
        });
        REGISTRY.fire(self);
    };
    
    self.getValue = function() {
        try {
            var parts = [];
            $.each(self.active, function(product, palette) {
                if ( palette ) {
                    parts.push(product + "," + palette);
                }
            });
            var qs = "";
            if ( parts.length > 0 ) {
                qs = containerId + "=" + parts.join("~");
            }
            return qs;
        } catch ( error ) {
            Worldview.error("Unable to update", error);
        }
    };
    
    self.updateComponent = function(queryString) {
        queryString = queryString || "";
        var changed = false;
        try {
            var state = Worldview.queryStringToObject(queryString);
            state.products = splitProducts(state);
            $.each(self.active, function(product, palette) {
                if ( $.inArray(product, state.products) < 0 ) {
                    log.debug("Removing palette for " + product);
                    delete self.active[product];
                    changed = true;
                }    
            }); 
            if ( dialogForProduct && 
                    $.inArray(dialogForProduct, state.products) < 0 ) {
                dialog.hide();
            }        
            if ( changed ) {
                REGISTRY.fire(self);
            }
        } catch ( error ) {
            Worldview.error("Unable to update state", error);
        }
    };
    
    self.displaySelector = function(product) { 
        if ( dialog ) {
            dialog.hide();
            setTimeout(function() {
                showSelector(product);
            }, 6);
        } else {
            showSelector(product);
        }
    }
        
    var showSelector = function(product) {
        var productConfig = self.config.products[product];            
        var properties = {
            width: "245px", 
            height: "265px",
            visible: false,
            autofillheight: "body"             
        }
        if ( self.alignTo ) {
            var $element = $(self.alignTo);
            properties.x = Math.ceil($element.offset().left + 
                    $element.width() + 20);
            properties.y = Math.ceil($element.offset().top);
        }
        
        dialog = new YAHOO.widget.Panel("palette-selector-dialog", 
                properties);
        dialogForProduct = product;
        dialog.setHeader("Select palette");
        dialog.setBody([
            "<div class='product-name'>" + productConfig.name + "</div>",
            "<div class='product-description'>" +
                productConfig.description +
            "</div>" +
            "<div id='palette-selector'></div>"
        ].join("\n"));  
        dialog.hideEvent.subscribe(function(i) {
            setTimeout(function() { 
                dialog.destroy(); 
                dialog = null; 
                dialogForProduct = null
            }, 5);
        });       
        dialog.render(document.body);  
                
        var palettes = [];
        var canvas = document.createElement("canvas");
        canvas.width = 100;
        canvas.height = 14;
        
        // The default palette the product is rendered in
        var renderedName = productConfig.rendered;
        
        var renderedPalette = $.extend(true, {}, 
                config.palettes[renderedName]);
        var renderedColorBar = Worldview.Palette.ColorBar({
            canvas: canvas,
            palette: renderedPalette,
            bins: productConfig.bins,
            stops: productConfig.stops
        });
        renderedPalette.name = "Default";
        renderedPalette.image = renderedColorBar.toImage();
        palettes.push(renderedPalette);
                
        var activePalette = self.active[product];
        var selected = null;
                 
        // Palettes for the drop down, place the recommended ones first
        var recommendedPalettes = [];
        var otherPalettes = [];
                 
        $.each(self.config.paletteOrder, function(index, name) {
            var p = self.config.palettes[name];
            
            // Skip this palette if configuration says to exclude
            if ( $.inArray(name, productConfig.excludePalettes) >= 0 ) {
                return;
            }
            if ( !p ) {
                log.error("No such palette: " + name);
                return;
            }
            if ( p.source === "stock" ) {
                var palette = $.extend(true, {}, p);
                var colorBar = Worldview.Palette.ColorBar({
                    canvas: canvas, 
                    palette: palette, 
                    bins: productConfig.bins,
                    stops: productConfig.stops
                });
                palette.image = colorBar.toImage();
                if ( $.inArray(palette.id, 
                        productConfig.recommendedPalettes) >= 0 ) {
                    palette.name = "Recommended";
                    recommendedPalettes.push(palette);
                } else {
                    otherPalettes.push(palette);
                }
            }       
        });
        palettes = palettes.concat(recommendedPalettes, otherPalettes);
        
        $.each(palettes, function(index, palette) {
            if ( palette.id === activePalette ) {
                selected = index;
            }    
        });
        
        var paletteSelector = Worldview.Palette.PaletteSelector({
            selector: "#palette-selector",
            palettes: palettes
        });
        if ( selected !== null ) {
            paletteSelector.select(selected);
        }
                     
        paletteSelector.addSelectionListener(function(palette) {
            var log = Logging.getLogger("Worldview.PaletteSelection");
            if ( palette.source === "rendered" ) {
                delete self.active[product];
                log.debug("Palette: default");
            } else {
                self.active[product] = palette.id;
                log.debug("Palette: " + palette.id); 
            }
            REGISTRY.fire(self);
        });     
        
        dialog.show(); 
    };

    /**
     * Converts the product listed in the query string into an array.
     */    
    var splitProducts = function(state) {
        var results = [];
        if ( !state.products ) {
            return results;
        }
        var sets = state.products.split("~");
        for ( var i = 0; i < sets.length; i++ ) {
            var set = sets[i];
            var items = set.split(",");
            var values = [];
            // First item is the type (e.g., baselayer or overlay). Ignore it.
            for ( var j = 1; j < items.length; j++ ) {
                values.push(items[j]);
            }
            // Products are listed in the "opposite" order from what is 
            // expected--the first layer is the layer to be drawn last. 
            // Flip them.
            values.reverse();
            results = results.concat(values);
        }
        return results;
    };
    
    self.loadFromQuery = function(queryString) {
        log.debug("paletteWidget.loadFromQuery: " + queryString);
        var query = Worldview.queryStringToObject(queryString);
        if ( query.palettes && !Worldview.Support.allowCustomPalettes() ) {
            Worldview.Support.showUnsupportedMessage("custom palette");
        } else {
            self.setValue(query.palettes);
        }    
    };
    
    init();
    return self;
}
