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

/**
 * Class: TestSuite.Patcher
 * Patches a series of mock objects which can be undone later. Create a 
 * patcher object, call <apply> in setUp to patch the code with each mock 
 * object, and then call <undo> in the tearDown to remove all patches.
 * 
 * Example:
 * This test checks to make sure console.error is invoked when an error
 * is handled.
 * 
 * (begin code)
 * var patcher: null,
 * 
 * setUp: function() {
 *     patcher = TestSuite.Patcher();
 *     patcher.apply("console.error", mockFunction());
 * },
 * 
 * tearDown: function() {
 *     patcher.undo();
 * },
 * 
 * testLog: function() {
 *     Worldview.error("This is an error");
 *     verify(console.error)("This is an error");
 * },
 * (end code)
 * 
 * Constructor: Patcher
 * Creates a new instance.
 */
TestSuite.Patcher = function() {
    
    var self = {};
    
    // Stack of patches that have been applied.
    var patches = [];
    
    /**
     * Method: apply
     * Patches an object with a mock.
     * 
     * Parameters:
     * - path: String name of the object to patch (e.g., "Worldview.log")
     * - mock: The object to substitute. 
     * 
     * Throws:
     * An exception if the object to patch has already been patched.
     */
    self.apply = function(path, mock) {
        
        var parent = null;
        var node = window;
        var names = path.split(".");

        for ( var i = 0; i < names.length; i++ ) {
            var name = names[i];
            parent = node;
            if ( parent[name] === undefined ) {
                throw "In " + path + ", " + name + " is undefined";
            }
            node = parent[name];
        }

        if ( mock !== undefined ) {
            mock.___PATCH = true;
        }
        
        var real = parent[name];
        parent[name] = mock;
        patches.push({
            parent: parent,
            name: name,
            real: real
        });
    }
    
    /**
     * Method: undo
     * Removes all patches.
     */
    self.undo = function() {
        while ( patches.length > 0 ) {
            var patch = patches.pop();
            patch.parent[patch.name] = patch.real;
        }
    }
    
    return self;
}
