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

Worldview.namespace("Worldview.Map");

Worldview.Map.TWMSLayer = OpenLayers.Class(OpenLayers.Layer.WMS, {

    parameterOrder: [
        "time",
        "layers",
        "format"
    ],
    
    initialize: function(name, url, params, options) {
        var newArguments = [];
        var newParams = {};
        
        $.each(this.parameterOrder, function(index, name) {
            if ( params[name] ) {
                newParams[name] = params[name];
            }
        });
        $.each(params, function(name, value) {
            if ( $.inArray(name, this.parameterOrder) < 0 ) {
                newParams[name] = value;
            }  
        });
        
        newArguments.push(name, url, newParams, options);
        OpenLayers.Layer.WMS.prototype.initialize.apply(this, newArguments);
    },
    
    CLASS_NAME: "Worldview.Map.TWMSLayer"
            
});
