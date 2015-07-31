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

var wv = wv || {};
wv.data = wv.data || {};

wv.data.map = wv.data.map || function(model, maps, config) {

    var self = {};

    var map = null;
    var results = [];
    var granules = [];
    var hoverLayer = null;
    var buttonLayer = null;
    var selectionLayer = null;
    var gridLayer = null;
    var hovering = null;
    var selectedFeatures = null;

    var init = function() {
        model.events
            .on("activate", updateProjection)
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
            image = "images/data.minus-button.png";
        } else {
            image = "images/data.plus-button.png";
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
                        width: 5
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
                fill: new ol.style.Fill({color: "rgba(127, 127, 127, 0.2)"}),
                stroke: new ol.style.Stroke({
                    color: "rgb(127, 127, 127)",
                    width: 3
                }),
                opacity: 0.6
            })
        });
        map.addLayer(selectionLayer);
    };

    var createSwathLayer = function() {
        map.addLayer(new ol.layer.Vector({
            source: new ol.source.Vector(),
            style: new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: "rgba(195, 189, 123, 0.75)",
                    width: 2
                })
            })
        }));
    };

    var createGridLayer = function() {
        map.addLayer(new ol.layer.Vector({
            source: new ol.source.Vector(),
            style: new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: "rgba(186, 180, 152, 0.6)",
                    width: 1.5
                })
            })
        }));
    };

    var create = function() {
        //console.log("create");
        createSelectionLayer();
        createGridLayer();
        createSwathLayer();
        createHoverLayer();
        createButtonLayer();
        $(maps.selected.getViewport()).on("mousemove", hoverCheck);
        $(maps.selected.getViewport()).on("click", clickCheck);
    };

    var dispose = function() {
        if ( map ) {
            map.removeLayer(selectionLayer);
            map.removeLayer(gridLayer);
            map.removeLayer(swathLayer);
            map.removeLayer(hoverLayer);
            map.removeLayer(buttonLayer);
        }
        selectedFeatures = [];
        $(maps.selected.getViewport()).off("mousemove", hoverCheck);
        $(maps.selected.getViewport()).off("click", clickCheck);
    };
    self.dispose = dispose;

    var updateGranules = function(r) {
        //console.log("results");
        results = r;
        granules = r.granules;
        updateButtons();
        updateSwaths();
        updateGrid();
        _.each(model.selectedGranules, function(granule) {
            if ( selectedFeatures[granule.id] ) {
                selectionLayer.getSource().removeFeature(selectedFeatures[granule.id]);
                delete selectedFeatures[granule.id];
            }
            selectGranule(granule);
        });
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

    var updateSwaths = function() {
        swathLayer.getSource().clear();
        var swaths = results.meta.swaths;
        if ( !swaths ) {
            return;
        }
        var maxDistance = ( model.crs === wv.map.CRS_WGS_84) ?
            270 : Number.POSITIVE_INFINITY;
        var features = [];
        _.each(swaths, function(swath) {
            var lastGranule = null;
            _.each(swath, function(granule) {
                if ( !lastGranule ) {
                    lastGranule = granule;
                    return;
                }
                var polys1 = wv.map.toPolys(lastGranule.geometry[model.crs]);
                var polys2 = wv.map.toPolys(granule.geometry[model.crs]);
                _.each(polys1, function(poly1) {
                    _.each(polys2, function(poly2) {
                        var c1 = poly1.getInteriorPoint().getCoordinates();
                        var c2 = poly2.getInteriorPoint().getCoordinates();
                        var distanceX = wv.map.distanceX(c1[0], c2[0]);
                        if ( distanceX < maxDistance ) {
                            var ls = new ol.geom.LineString([c1, c2]);
                            features.push(new ol.Feature(ls));
                        }
                    });
                });
                lastGranule = granule;
            });
        });
        swathLayer.getSource().addFeatures(features);
    };

    var updateGrid = function() {
        gridLayer.getSource().clear();
        var grid = results.meta.grid;
        if ( !grid ) {
            return;
        }
        var features = [];
        var parser = new ol.format.GeoJSON();
        _.each(grid, function(cell) {
            var geom = parser.readGeometry(cell.geometry);
            var feature = new ol.Feature(geom);
            features.push(feature);
        });
        gridLayer.getSource().addFeatures(features);
    };

    var selectGranule = function(granule) {
        if ( !granule.feature ) {
            return;
        }
        granule.feature.changed();
        var select = new ol.Feature(granule.geometry[model.crs]);
        select.granule = granule;
        //granule.selectedFeature = select;
        selectionLayer.getSource().addFeature(select);
        selectedFeatures[granule.id] = select;
    };

    var unselectGranule = function(granule) {
        if ( !granule.feature ) {
            return;
        }
        granule.feature.changed();
        //selectionLayer.getSource().removeFeature(granule.selectedFeature);
        //delete granule.selectedFeature;
        selectionLayer.getSource().removeFeature(selectedFeatures[granule.id]);
        delete selectedFeatures[granule.id];
    };

    var updateProjection = function() {
        dispose();
        map = maps.selected;
        create();
    };

    var clear = function() {
        //console.log("clear");
        if ( map ) {
            swathLayer.getSource().clear();
            gridLayer.getSource().clear();
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
        var granule = feature.granule;
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
