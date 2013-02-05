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

/**
 * Class: Worldview.Visual.Lookup
 * Indexed based color lookup table.
 * 
 * Constructor: Lookup
 * Creates a new instance.
 * 
 * Parameters:
 * spec - Accepts all properties as an associative array.
 * 
 * Example:
 * (begin code)
 * var lookup = Worldview.Visual.Lookup({
 *     id: "my_lookup",
 *     name: "My Lookup",
 *     table: [
 *         { r: 0x01, g: 0x02, b: 0x03, a: 0x04 },
 *         { r: 0x05, g: 0x06, b: 0x07, a: 0x08 }
 *     ]
 * });
 */
Worldview.Visual.Lookup = function(spec) { 
        
    return {
        /**
         * Property: id
         * 
         * Identifier for this lookup (optional).
         */ 
        id: spec.id || undefined,
        
        /**
         * Property: name
         * 
         * Descriptive name for this lookup (optional).
         */  
        name: spec.name || undefined,
                
        /**
         * Property: table
         * 
         * Array that maps index values to <Worldview.Visual.ColorRGBA> 
         * objects. For example, a value of 2 should use the color found at 
         * table[2]. If not specified, this value is an empty array.
         */
        table: spec.table || [],
    }
}