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

Worldview.namespace("Palette");

/**
 * Class: Worldview.Palette.PaletteSelector
 * Combo box to select a color palette. This uses 
 * <msDropDown at http://www.marghoobsuleman.com/jquery-image-dropdown> to 
 * render the combo box. 
 * 
 * Constructor: PaletteSelector
 * Creates a new instance.
 * 
 * Parameters:
 * spec.selector - The jQuery selector of the container to render in.
 * spec.palettes - Array of <Palettes> to display in the combo box.
 */   
Worldview.Palette.PaletteSelector = function(spec) {
    
    // This namespace
    var ns = Worldview.Palette;
    
    // Public exports
    var self = {};
    
    // The palettes to display in the combo box
    var palettes = spec.palettes;
        
    // Container to render in
    var $container;

    var dropDown;
    
    // Listeners for selection events
    var listeners = [];
    
    //-------------------------------------------------------------------------
    // Public
    //-------------------------------------------------------------------------
        
    var init = function() {
        $container = $(spec.selector);
        if ( $container.length === 0 ) {
            throw "Container not found for PaletteSelector: " + spec.selector;
        }
                
        var items = [];      
        for ( var i = 0; i < palettes.length; i++ ) {
            var palette = palettes[i];
            var item = {
                text: palette.name,
                description: palette.description,
                value: i,
                image: palette.image
            };
            items.push(item);
        }
        
        dropDown = $container.msDropDown({
            byJson: {
                name: "Palettes",
                data: items     
            }
        }).data("dd");
         
        $container.on("change", function() { 
            fireSelectionEvent(palettes[dropDown.selectedIndex]);
        });
    };
    
    /**
     * Method: select
     * Selects an item in the selector by index. A selection event is fired
     * after the value changes.
     * 
     * Parameters:
     * index - The index of the value to set. 
     */
    self.select = function(index) {
       dropDown.set("selectedIndex", index);
       
       // Change event not fired on set, do it manually
       fireSelectionEvent(palettes[dropDown.selectedIndex]);
    }
    
    /**
     * Method: addSelectionListener
     * Adds a listener for selection events.
     * 
     * Parameters:
     * listener - Function to call when an item is selected. The function is
     * called with one parameter, the <Palette> that was selected. If no 
     * palette was selected, the passed in parameter is undefined. 
     */
    self.addSelectionListener = function(listener) {
        listeners.push(listener);        
    }
    
    //-------------------------------------------------------------------------
    // Private
    //-------------------------------------------------------------------------
        
    // Notifies all listeners on a selection event.
    var fireSelectionEvent = function(item) {
        for ( var i = 0; i < listeners.length; i++ ) { 
            var listener = listeners[i];
            listener(item);
        }
    }
    
    init();
    return self;
};



