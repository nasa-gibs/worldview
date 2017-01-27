/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2017 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

var wv = wv || {};
wv.naturalEvents = wv.naturalEvents || {};

wv.naturalEvents.map = wv.naturalEvents.map || function(location, map, config) {

    var self = {};

    vectorLayer = null;

    var init = function() {
        model.events
            .on("select", onSelect);
    };
    var getButtonDimensions = function() {
        var zoom = map.getView().getZoom();
        // Minimum size of the button is 15 pixels
        var base = 12;
        // Double the size for each zoom level
        var add = Math.pow(2, zoom);
        // But 47 pixels is the maximum size
        var size = Math.min(base + add, base + 32);
        return {
            scale: size / 48,
            size: size
        };
    };
    var buttonStyle = function(feature) {
        var dim = getButtonDimensions();
        var image = "images/event-icon2.png";
        return [new ol.style.Style({
            image: new ol.style.Icon({
                src: image,
                scale: dim.scale,
                anchor: [0.5, 46],
                anchorXUnits: 'fraction',
                anchorYUnits: 'pixels'
            })
        })];
    };
    var onSelect = function(){

        map.removeLayer(vectorLayer);

        var iconFeature = new ol.Feature({
            geometry: new ol.geom.Point(location),
            name: 'NaturalEvent',
            population: 4000,
            rainfall: 500
        });

        iconFeature.setStyle(buttonStyle);

        var vectorSource = new ol.source.Vector({
            features: [iconFeature],
            wrapX: false
        });

        var vectorLayer = new ol.layer.Vector({
            source: vectorSource
        });
        map.addLayer(vectorLayer);

    };

    onSelect();
    return self;

};
