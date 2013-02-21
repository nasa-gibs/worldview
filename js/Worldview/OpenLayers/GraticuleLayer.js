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

Worldview.namespace("OpenLayers");

Worldview.OpenLayers.GraticuleLayer = OpenLayers.Class(OpenLayers.Layer, {
    
    graticuleLineStyle: null,
    graticuleLabelStyle: null,
    graticule: null,
   
    initialize: function(name, options) {
        OpenLayers.Layer.prototype.initialize.apply(this, arguments);
        
        graticuleLineStyle = new OpenLayers.Symbolizer.Line({
            strokeColor: '#AAAAAA',
            strokeOpacity: 0.95,
            strokeWidth: 1.35,
            strokeLinecap: 'square',
            strokeDashstyle: 'dot'
        });
        
        graticuleLabelStyle = new OpenLayers.Symbolizer.Text({
            fontFamily: 'Gill Sans',
            fontSize: '16',
            fontWeight: '550',
            fontColor: '#0000e1',
            fontOpacity: 1.0
        });   
        

    },
    
    setMap: function(map) {
        OpenLayers.Layer.prototype.setMap.apply(this, arguments); 
        
        graticule = new OpenLayers.Control.Graticule({
            layerName: 'ol_graticule_control',
            numPoints: 2, 
            labelled: true,
            lineSymbolizer: graticuleLineStyle,
            labelSymbolizer: graticuleLabelStyle
        });
        
        map.addControl(graticule);       
    },
    
    removeMap: function(map) {
        OpenLayers.Layer.prototype.removeMap.apply(this, arguments); 
        map.removeControl(graticule);   
        graticule.destroy();
        graticule = null;
    },
    
    /*
     * Name of this class per OpenLayers convention.
     */
    CLASS_NAME: "Worldview.OpenLayers.GraticuleLayer"                      
});
