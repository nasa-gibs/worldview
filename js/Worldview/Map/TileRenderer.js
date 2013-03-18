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

if ( !Worldview ) {
    var Worldview = {};
}
Worldview.Map = Worldview.Map || {};
Worldview.Map.TileRenderer = Worldview.Map.TileRenderer || {};

Worldview.Map.TileRenderer.renderLookup = function(lookupTable, source,
        destination) {

    var s = source.data;
    var d = destination.data;
    
    for ( var i = 0; i < s.length; i += 4 ) {
        var lookup = s[i + 0] + "," + 
                     s[i + 1] + "," + 
                     s[i + 2] + "," + 
                     s[i + 3];
        var color = lookupTable[lookup];
        if ( color ) {
            d[i + 0] = color.r
            d[i + 1] = color.g
            d[i + 2] = color.b
            d[i + 3] = 0xff;
        }
    };
        
}
