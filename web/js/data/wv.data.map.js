/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2014 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

/**
 * @module wv.data
 */
var wv = wv || {};
wv.data = wv.data || {};

wv.data.map = wv.data.map || function(model, maps, config) {

    var self = {};

    var map = null;
    var granules = [];
    var hoverLayer = null;
    var buttonLayer = null;
    var selectionLayer = null;
    var hovering = null;

    var init = function() {
        model.events
            .on("query", clear)
            .on("queryResults", updateGranules)
            .on("projectionUpdate", updateProjection)
            .on("granuleSelect", selectGranule)
            .on("granuleUnselect", unselectGranule);
        updateProjection();
    };

    var buttonStyle = function(feature) {
        var dim = getButtonDimensions();
        var image;
        if ( model.isSelected(feature.granule) ) {
            image = "images/data-download-minus-button-red.svg";
        } else {
            image = "images/data-download-plus-button-orange.svg";
        }

        if ( feature !== hovering ) {
            return [new ol.style.Style({
                image: new ol.style.Icon({
                    src: image,
                    scale: dim.scale
                })
            })];
        } else {
            var offset = -(dim.size / 2.0 + 14);
            return [new ol.style.Style({
                image: new ol.style.Icon({
                    src: image,
                    scale: dim.scale
                }),
                text: new ol.style.Text({
                    font: "bold 14px ‘Lucida Sans’, Arial, Sans-Serif",
                    text: feature.granule.label,
                    fill: new ol.style.Fill({color: "#ffffff"}),
                    stroke: new ol.style.Stroke({
                        color: "rgba(0, 0, 0, .7)",
                        width: 6
                    }),
                    offsetY: offset
                })
            })];
        }
    };

    var hoverStyle = function(feature) {
        if ( !model.isSelected(feature.granule) ) {
            return [new ol.style.Style({
                fill: new ol.style.Fill({
                    color: "rgba(181, 158, 50, 0.25)"
                }),
                stroke: new ol.style.Stroke({
                    color: "rgb(251, 226, 109)",
                    width: 3
                })
            })];
        } else {
            return [new ol.style.Style({
                fill: new ol.style.Fill({
                    color: "rgba(242, 12, 12, 0.25)"
                }),
                stroke: new ol.style.Stroke({
                    color: "rgb(255, 6, 0)",
                    width: 3
                })
            })];
        }
    };

    var createButtonLayer = function() {
        buttonLayer = new ol.layer.Vector({
            source: new ol.source.Vector(),
            style: buttonStyle
        });
        map.addLayer(buttonLayer);
    };

    var createHoverLayer = function() {
        hoverLayer = new ol.layer.Vector({
            source: new ol.source.Vector(),
            style: hoverStyle
        });
        map.addLayer(hoverLayer);
    };

    var createSelectionLayer = function() {
        selectionLayer = new ol.layer.Vector({
            source: new ol.source.Vector(),
            style: new ol.style.Style({
                fill: new ol.style.Fill({color: "rgba(127, 127, 127, 0.6)"}),
                stroke: new ol.style.Stroke({
                    color: "rgba(127, 127, 127, 0.6)",
                    width: 3
                })
            })
        });
        map.addLayer(selectionLayer);
    };

    var create = function() {
        createSelectionLayer();
        createHoverLayer();
        createButtonLayer();
        $(maps.selected.getViewport()).on("mousemove", hoverCheck);
        $(maps.selected.getViewport()).on("click", clickCheck);
    };

    var dispose = function() {
        if ( map ) {
            map.removeLayer(hoverLayer);
            map.removeLayer(buttonLayer);
            map.removeLayer(selectionLayer);
        }
        $(maps.selected.getViewport()).off("mousemove", hoverCheck);
        $(maps.selected.getViewport()).off("click", clickCheck);
    };
    self.dispose = dispose;

    var updateGranules = function(results) {
        granules = results.granules;
        updateButtons();
    };

    var updateButtons = function() {
        buttonLayer.getSource().clear();
        var features = [];
        _.each(granules, function(granule) {
            if ( !granule.centroid || !granule.centroid[model.crs] ) {
                return;
            }
            var centroid = granule.centroid[model.crs];
            var feature = new ol.Feature({
                geometry: centroid
            });
            feature.button = true;
            feature.granule = granule;
            granule.feature = feature;
            features.push(feature);
        });
        buttonLayer.getSource().addFeatures(features);
    };

    var selectGranule = function(granule) {
        granule.feature.changed();

        var feature = new ol.Feature(granule.geometry[model.crs]);
        feature.granule = granule;
        granule.selectedFeature = feature;
        selectionLayer.getSource().addFeature(feature);
    };

    var unselectGranule = function(granule) {
        granule.feature.changed();
        selectionLayer.getSource().removeFeature(granule.selectedFeature);
        delete granule.selectedFeature;
    };

    var updateProjection = function() {
        dispose();
        map = maps.selected;
        create();
        updateButtons();
    };

    var clear = function() {
        if ( map ) {
            hoverLayer.getSource().clear();
            buttonLayer.getSource().clear();
        }
    };

    var hoverCheck = function(event) {
        var pixel = map.getEventPixel(event.originalEvent);
        var newFeature = null;
        map.forEachFeatureAtPixel(pixel, function(feature, layer) {
            if ( feature.button ) {
                newFeature = feature;
            }
        });

        if ( hovering ) {
            hovering.changed();
        }
        if ( newFeature ) {
            newFeature.changed();
        }
        if ( hovering !== newFeature ) {
            if ( newFeature ) {
                hoverOver(newFeature);
            } else {
                hoverOut(hovering);
            }
        }
        hovering = newFeature;
    };

    var clickCheck = function(event) {
        var pixel = map.getEventPixel(event.originalEvent);
        map.forEachFeatureAtPixel(pixel, function(feature, layer) {
            if ( feature.button ) {
                model.toggleGranule(feature.granule);
                hovering = false;
                hoverCheck(event);
            }
        });
    };

    var hoverOver = function(feature) {
        granule = feature.granule;
        if ( !granule.geometry ) {
            return;
        }
        var hover = new ol.Feature(granule.geometry[model.crs]);
        hover.granule = granule;
        hoverLayer.getSource().clear();
        hoverLayer.getSource().addFeature(hover);
    };

    var hoverOut = function() {
        hoverLayer.getSource().clear();
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

    init();
    return self;
};
