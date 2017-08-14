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
  var self = {}, marker, markerEl, boundingBox, map;
  map = map || maps.selected;

  self.draw = function(location) {
    var hasPolygon = Array.isArray(location[0]);
    self.remove();

    if (!marker) {
      markerEl = document.createElement('div');
      markerEl.className = 'map-marker';
      markerEl.appendChild(document.createTextNode('x'));
      marker = new ol.Overlay({
        element: markerEl
      });
    }

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
    } else {
      marker.setPosition(location);
      map.addOverlay(marker);
    }

    self.activeMarker = location;
  };

  self.remove = function() {
    map.removeOverlay(marker);
    map.removeLayer(boundingBox);
    self.activeMarker = null;
  };
  return self;
};

var wv = wv || {};
wv.naturalEvents = wv.naturalEvents || {};
wv.naturalEvents.markers = wv.naturalEvents.markers || naturalEventsMarkers;
