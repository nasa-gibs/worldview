var wv = wv || {};
wv.naturalEvents = wv.naturalEvents || {};
wv.naturalEvents.markers = wv.naturalEvents.markers || function(models, maps, config) {

  var self = {},
    boundingBox,
    map;

  map = map || maps.selected;

  self.draw = function(events, dateIndex) {
    if (!events) return null;
    return events.map(function(event){
      var geometry = event.geometries[dateIndex] || event.geometries[0];
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
        boundingBox = createBoundingBox(geometry.coordinates);
        map.addLayer(boundingBox);
        return {boundingBox: boundingBox};
      } else {
        pin = createPin(event.id, category.slug);
        pin.setPosition(geometry.coordinates);
        map.addOverlay(pin);
        return {pin: pin};;
      }
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
    positioning: 'bottom-center'
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
