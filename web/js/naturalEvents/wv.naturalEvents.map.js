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

wv.naturalEvents.map = wv.naturalEvents.map || function(models, maps, config) {

  var self = {};

  var vectorLayer = null;
  var map = null;
  self.current = null;

  var init = function() {
    if (!map) {
      map = maps.selected;
    }

  };
  var getButtonDimensions = function() {
    var zoom = map.getView()
      .getZoom();
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
  var fillStyle = function(feature) {
    return [new ol.style.Style({
      fill: new ol.style.Fill({
        color: [255, 255, 255, 0.1]
      }),
      stroke: new ol.style.Stroke({
        color: [212, 85, 0, 0.8],
        width: 2
      })
    })];
  };
  var onSelect = function() {

  };

  self.draw = function(location, currentMap) {
    //loads current map
    map = maps.selected;
    //remove any existing location first
    map.removeLayer(vectorLayer);

    //Polygon or point?
    var style, geoms;
    if (location[0].length > 2) {
      geoms = new ol.geom.Polygon(location);
      style = fillStyle;
    } else {
      geoms = new ol.geom.Point(location);
      style = buttonStyle;
    }
    var iconFeature = new ol.Feature({
      geometry: geoms,
      name: 'NaturalEvent',
      population: 4000,
      rainfall: 500
    });

    iconFeature.setStyle(style);

    var vectorSource = new ol.source.Vector({
      features: [iconFeature],
      wrapX: false
    });

    vectorLayer = new ol.layer.Vector({
      source: vectorSource
    });

    map.addLayer(vectorLayer);

    //save last selected location
    self.current = location;

  };

  var dispose = function() {
    map.removeLayer(vectorLayer);
  };
  //make dispose available to naturalEvents.ui
  self.dispose = dispose;

  init();
  return self;

};
