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

TestCase("Permalink.fromObject", TestSuite.Tests({
    
    ns: null,
    
    setUp: function() {
        ns = Worldview.Permalink;    
    },
    
    // Check that key/value pairs are encoded correctly
    testFromObjectValid: function() {
        var p = { 
            "foo": 1,
            "bar": "baz"
        };
        assertEquals("?foo=1&bar=baz", ns.fromObject(p));
    },

    // Check that special characters are encoded correclty.
    testFromObjectSpecialCharacters: function() {
        var p = { 
            "foo": " Z",
            "<bar": "baz"
        };
        assertEquals("?foo=%20Z&%3Cbar=baz", ns.fromObject(p));
    }
        
}));

TestCase("Permalink.fromRegistry", TestSuite.Tests({
    
    ns: null,
    patcher: null,
    
    setUp: function() {
        ns = Worldview.Permalink; 
        patcher = TestSuite.Patcher();
        patcher.apply("REGISTRY", new SOTE.util.Registry());
        
        var foo = {
            getValue: function() {
                return "foo= Z";
            }
        };
        
        var bar = {
            getValue: function() {
                return "<bar=baz";
            }
        }
        
        REGISTRY.register("foo", foo);
        REGISTRY.register("bar", bar);    
    },
    
    tearDown: function() {
        patcher.undo();
    },
    
    // Check that values from components in the registry are encoded
    // properly
    testFromRegistry: function() {
        assertEquals("?foo=%20Z&%3Cbar=baz", ns.fromRegistry());
    }
    
}));

TestCase("Permalink.decode", TestSuite.Tests({
    
    ns: null,
    
    setUp: function() { 
        ns = Worldview.Permalink;  
    },
    
    // Check that special characters are encoded
    testDecode: function() {
        assertEquals("?foo= Z&<bar=baz", ns.decode("?foo=%20Z&%3Cbar=baz"));
    },
    
    // Check that commas are also included (encodeURIComponent vs encodeURI)
    testComma: function() {
        assertEquals("?foo=1,2", ns.decode("?foo=1%2C2"));
    },
    
    // Check that the function still works if not prefixed with a ?
    testNoQuestionMark: function() {
        assertEquals("foo=1,2", ns.decode("foo=1%2C2"));
    },
    
    // Check that empty strings are simply passed through
    testEmpty: function() {
        assertEquals("", ns.decode(""));
    }
    
}));
