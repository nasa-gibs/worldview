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

var naturalEventsMarkers = function(models, maps, config) {
  var self = {}, marker, boundingBox, map;
  map = map || maps.selected;

  self.draw = function(location) {
    var markerEl = document.createElement('div');
    var hasPolygon = Array.isArray(location[0]);

    // Clear previous markers
    map.addOverlay(marker);
    map.removeLayer(boundingBox);

    markerEl.className = 'map-marker';
    markerEl.appendChild(document.createTextNode('x'));
    marker = new ol.Overlay({
      element: markerEl
    });
    marker.setPosition(location);

    if (hasPolygon) {
      boundingBox = new ol.layer.Vector({
        source: new ol.source.Vector({
          features: [new ol.Feature({
            geometry: new ol.geom.Polygon(location),
            name: 'NaturalEvent'
          })],
          wrapX: false
        }),
        style: new ol.style.Style({
          fill: new ol.style.Fill({
            color: [255, 255, 255, 0.1]
          }),
          stroke: new ol.style.Stroke({
            color: [212, 85, 0, 0.8],
            width: 2
          })
        })
      });
      map.addLayer(boundingBox);
    }

    self.location = location;
  };

  self.dispose = function() {
    map.removeLayer(boundingBox);
  };
  return self;
};

var wv = wv || {};
wv.naturalEvents = wv.naturalEvents || {};
wv.naturalEvents.markers = wv.naturalEvents.markers || naturalEventsMarkers;
