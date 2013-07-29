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

Worldview.namespace("Map");

Worldview.Map.HoverControl = OpenLayers.Class(OpenLayers.Control, {
    
    layer: null,
    
    defaultHandlerOptions: {
        delay: 2000,
        pixelTolerance: 1,
        stopMove: false
    },
        
    initialize: function(layer, options) {
        this.layer = layer;
        this.handlerOptions = OpenLayers.Util.extend({}, 
                this.defaultHandlerOptions);
        OpenLayers.Control.prototype.initialize.apply(this, arguments);   
        
        this.handlers = {
             feature: new OpenLayers.Handler.Feature(this, this.layer, {
                 over: this.over,
                 out: this.out
             }, {})
         };
    },
    
    draw: function() {
        return false;
    },
    
    activate: function() {
        this.handlers.feature.activate();
    },
    
    deactivate: function() {
        this.handlers.feature.deactivate();
    },
    
    over: function(feature) {
        this.events.triggerEvent("hoverover", {feature: feature});
    },
    
    out: function(feature) {
        this.events.triggerEvent("hoverout", {feature: feature});
    }
});

    
    
    
    
