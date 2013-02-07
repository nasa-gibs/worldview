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

Worldview.namespace("Visual");

Worldview.Visual.StockPaletteSelector = function(spec) {
    
    // This namespace
    var ns = Worldview.Visual;
    
    // Public exports
    var self = {};
    
    var $container;
    
    var init = function() {
        $container = $(spec.selector);
        if ( !$container ) {
            throw new "No such container for StockPaletteSelector: " + 
                $container;
        }
        
        $container.html("Loading...");   
        
        ns.loadStockPalettes(palettesLoaded, serviceError);     
    };
    
    var palettesLoaded = function() {
        var palettes = ns.STOCK_PALETTES;
        var items = [];      
        for ( var i = 0; i < palettes.length; i++ ) {
            var palette = palettes[i];
            var item = {
                text: palette.name,
                description: palette.description,
                value: i,
                selected: i == 0,
                imageSrc: palette.image
            };
            items.push(item);
        }
        $container.ddslick({
            data: items,
            width: 300,
            imagePosition: "left",
            selectText: "Select a palette",
            onSelected: function(data) {
                console.log(data);
            }
        })
    };
    
    var serviceError = function(jqXHR, textStatus, errorThrown) {
        $container.html("ERROR: " + errorThrown);
    };     
    
    init();
    return self;
};


Worldview.Visual.STOCK_PALETTE_ENDPOINT = "data/palettes";
Worldview.Visual.STOCK_PALETTES = null;

Worldview.Visual.loadStockPalettes = function(success, error) {
    
    var ns = Worldview.Visual;
    
    if ( Worldview.Visual.STOCK_PALETTES ) {
        success();
        return;    
    }
    
    var palettesLoaded = function(palettes) {
        ns.STOCK_PALETTES = palettes;
        
        var canvas = document.createElement("canvas");
        canvas.width = 100;
        canvas.height = 14;
        
        for ( var i = 0; i < palettes.length; i ++ ) {
            var palette = palettes[i];
            ns.ColorBar({
                canvas: canvas,
                palette: palette
            });
            palette.image = canvas.toDataURL("image/png");
        }
                
        success();    
    }
    
    $.ajax({
        url: ns.STOCK_PALETTE_ENDPOINT,
        dataType: "json",
        success: palettesLoaded,
        error: error
    });
    
}
