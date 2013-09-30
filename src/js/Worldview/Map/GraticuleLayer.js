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

/**
 * Class: Worldview.Map.GraticleLayer
 * Standard OpenLayers graticle control that acts like a layer.
 */
Worldview.Map.GraticuleLayer = OpenLayers.Class(OpenLayers.Layer, {

    graticuleLineStyle: null,
    graticuleLabelStyle: null,
    graticule: null,
    isControl: true,

    initialize: function(name, options) {
        OpenLayers.Layer.prototype.initialize.apply(this, arguments);

        this.graticuleLineStyle = new OpenLayers.Symbolizer.Line({
            strokeColor: '#AAAAAA',
            strokeOpacity: 0.95,
            strokeWidth: 1.35,
            strokeLinecap: 'square',
            strokeDashstyle: 'dot'
        });

        this.graticuleLabelStyle = new OpenLayers.Symbolizer.Text({
            fontFamily: 'Gill Sans',
            fontSize: '16',
            fontWeight: '550',
            fontColor: '#0000e1',
            fontOpacity: 1.0
        });
    },

    /*
     * Add the control when the layer is added to the map
     */
    setMap: function(map) {
        OpenLayers.Layer.prototype.setMap.apply(this, arguments);

        this.graticule = new OpenLayers.Control.Graticule({
            layerName: 'ol_graticule_control',
            numPoints: 2,
            labelled: true,
            lineSymbolizer: this.graticuleLineStyle,
            labelSymbolizer: this.graticuleLabelStyle
        });

        map.addControl(this.graticule);
    },

    /*
     * Remove the contorl when the layer is removed from the map
     */
    removeMap: function(map) {
        OpenLayers.Layer.prototype.removeMap.apply(this, arguments);
        map.removeControl(this.graticule);
        this.graticule.destroy();
        this.graticule = null;
    },

    setVisibility: function(value) {
        if ( !this.granule ) {
            return;
        }
        if ( value ) {
            this.graticule.activate();
        } else {
            this.graticule.deactivate();
        }
    },

    /*
     * Name of this class per OpenLayers convention.
     */
    CLASS_NAME: "Worldview.Map.GraticuleLayer"
});
