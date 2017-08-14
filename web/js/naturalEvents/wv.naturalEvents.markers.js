var wv = wv || {};
wv.naturalEvents = wv.naturalEvents || {};
wv.naturalEvents.markers = wv.naturalEvents.markers || function(models, maps, config) {

  var self = {},
    boundingBox,
    map,
    marker;

  map = map || maps.selected;

  self.draw = function(coordinates) {
    var hasPolygon = Array.isArray(coordinates[0]);
    self.remove();

    if (hasPolygon) {
      boundingBox = createBoundingBox(coordinates);
      map.addLayer(boundingBox);
    } else {
      marker = marker || createMarker();
      marker.setPosition(coordinates);
      map.addOverlay(marker);
    }

    self.activeMarker = coordinates;
  };

  self.remove = function() {
    map.removeOverlay(marker);
    map.removeLayer(boundingBox);
    self.activeMarker = null;
  };
  return self;
};

var createMarker = function(){
  markerEl = document.createElement('div');
  markerEl.className = 'map-marker';
  markerEl.appendChild(document.createTextNode('x'));
  return new ol.Overlay({
    element: markerEl
  });
};

var createBoundingBox = function(coordinates){
  return new ol.layer.Vector({
    source: new ol.source.Vector({
      features: [new ol.Feature({
        geometry: new ol.geom.Polygon(coordinates),
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
};
