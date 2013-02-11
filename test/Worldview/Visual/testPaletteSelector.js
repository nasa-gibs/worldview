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

TestCase("Worldview.Visual.PaletteSelector", {
   
    // This namespace
    ns: null,
    
    // Array of palettes
    palettes: null,
        
    setUp: function() {
        ns = Worldview.Visual;
        
        $(document.body).append("<div id='--test-palette-selector'></div>");
        
        palettes = [{
            id: "0",
            name: "First",
            stops: []
        }, {
            id: "1",
            name: "Second",
            stops: []
        }];         
    },
    
    // Make sure the object can be created
    testValid: function() {
        var selector = ns.PaletteSelector({
            selector: "#--test-palette-selector",
            palettes: palettes
        });
    },
    
    // Check that an exception is raised if the container does not exist
    testNoContainer: function() {
        assertException(function() {
            ns.PaletteSelector({
                selector: "#foo",
                palettes: palettes
            });            
        });
    },
    
    // Check that an event is fired when selection is made and that it is
    // the correct value.
    testSelection: function() {
        var selected;
        var selector = ns.PaletteSelector({
            selector: "#--test-palette-selector",
            palettes: palettes
        });
        selector.addSelectionListener(function(item) {
            selected = item;
        });
        selector.select(1); 
        assertEquals("Second", selected.name);     
    },
    
    // Check that the event contains an undefined palette if the selection
    // is out of bounds.
    testSelectionOOB: function() {
        var selected;
        var selector = ns.PaletteSelector({
            selector: "#--test-palette-selector",
            palettes: palettes
        });
        selector.addSelectionListener(function(item) {
            selected = item;
        });
        selector.select(100); 
        assertUndefined(selected);         
    }
    
});
