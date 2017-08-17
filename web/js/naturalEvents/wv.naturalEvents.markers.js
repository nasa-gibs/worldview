var wv = wv || {};
wv.naturalEvents = wv.naturalEvents || {};
wv.naturalEvents.markers = wv.naturalEvents.markers || function(models, ui, config) {
  var self = {}, map;

  map = map || ui.map.selected;

  self.draw = function(events, date) {
    if (!events) return null;
    return events.map(function(event){
      var marker = {};
      var isSelected = event.id === ui.naturalEvents.selected.id;

      var geometry;
      if (date) {
        geometry = _.find(event.geometries, function(geom){
          return geom.date.split('T')[0] === date;
        });
      } else {
        geometry = event.geometries[0];
      }

      var coordinates = geometry.coordinates;
      var category = Array.isArray(event.categories)
        ? event.categories[0]
        : event.categories;
      // Assign a default category if we don't have an icon
      var icons = [
        "Dust and Haze",
        "Icebergs",
        "Manmade",
        "Sea and Lake Ice",
        "Severe Storms",
        "Snow",
        "Temperature Extremes",
        "Volcanoes",
        "Water Color",
        "Wildfires"
      ];
      category = icons.includes(category.title)
        ? category
        : {title: 'Default', slug: 'default'};

      if (geometry.type === 'Polygon') {
        var extent = ol.extent.boundingExtent(geometry.coordinates[0]);
        coordinates = ol.extent.getCenter(extent);
        if (isSelected) {
          marker.boundingBox = createBoundingBox(geometry.coordinates);
          map.addLayer(marker.boundingBox);
        }
      }

      marker.pin = createPin(event.id, category.slug);
      marker.pin.setPosition(coordinates);
      map.addOverlay(marker.pin);
      return marker;
    });
  };

  self.remove = function(markers) {
    markers = markers || [];
    if (markers.length<1) return;
    markers.forEach(function(marker){
      if (marker.boundingBox) map.removeLayer(marker.boundingBox);
      if (marker.pin) map.removeOverlay(marker.pin);
    });
  };

  return self;
};

var createPin = function(id, eventCategory){
  // Build SVG Element, using this instead of an img element allows styling with CSS
  var wrapper = document.createElement('div');
  var svgNS = 'http://www.w3.org/2000/svg';
  var svgEl = document.createElementNS(svgNS, 'svg');
  var eventSymbol = document.createElementNS(svgNS, 'use');
  var markerSymbol = eventSymbol.cloneNode(true);

  svgEl.setAttribute('width', 30);
  svgEl.setAttribute('height', 35);

  markerSymbol.setAttribute('href', '/images/natural-events/markers.svg#marker');
  eventSymbol.setAttribute('href', '/images/natural-events/markers.svg#' + eventCategory);

  wrapper.setAttribute('class', 'marker marker-' + eventCategory);

  svgEl.appendChild(markerSymbol);
  svgEl.appendChild(eventSymbol);
  wrapper.appendChild(svgEl);

  // Create Overlay
  return new ol.Overlay({
    element: wrapper,
    positioning: 'bottom-center',
    id: id
  });
};

var createBoundingBox = function(coordinates){
  var lightStroke = new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: [255, 255, 255, 0.6],
      width: 2,
      lineDash: [4,8],
      lineDashOffset: 6
    })
  });
  var darkStroke = new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: [0, 0, 0, 0.6],
      width: 2,
      lineDash: [4,8]
    })
  });
  return new ol.layer.Vector({
    source: new ol.source.Vector({
      features: [new ol.Feature({
        geometry: new ol.geom.Polygon(coordinates),
        name: 'NaturalEvent'
      })],
      wrapX: false
    }),
    style: [lightStroke, darkStroke]
  });
};
