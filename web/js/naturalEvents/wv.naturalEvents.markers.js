var wv = wv || {};
wv.naturalEvents = wv.naturalEvents || {};
wv.naturalEvents.markers = wv.naturalEvents.markers || function(models, ui, config) {
  var self = {}, map;

  map = map || ui.map.selected;

  self.draw = function() {
    if (!(models.naturalEvents && models.naturalEvents.data)) return null;
    var events = models.naturalEvents.data.events;
    if (!events) return null;
    var markers = events.map(function(event){
      var marker = {};
      var selected = ui.naturalEvents.selected;
      var isSelected = event.id === selected.id;
      var date = ui.naturalEvents.getDefaultEventDate(event);

      if (isSelected && selected.date) {
        date = selected.date;
      }

      var geometry = _.find(event.geometries, function(geom){
        return geom.date.split('T')[0] === date;
      }) || event.geometries[0];

      if (!geometry) return marker;

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

      marker.pin = createPin(event.id, category.slug, isSelected);
      marker.pin.setPosition(coordinates);
      map.addOverlay(marker.pin);
      return marker; // Why is this returning undefined?
    });
    return markers;
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

var createPin = function(id, eventCategory, isSelected){
  // Build SVG Element, using this instead of an img element allows styling with CSS
  var wrapper = document.createElement('div');
  var svgNS = 'http://www.w3.org/2000/svg';
  var svgEl = document.createElementNS(svgNS, 'svg');
  var eventSymbol = document.createElementNS(svgNS, 'use');
  var root = window.location.origin + window.location.pathname;

  eventSymbol.setAttribute('href', root+'images/natural-events/markers.svg#' + eventCategory);
  wrapper.setAttribute('class', 'marker marker-' + eventCategory);

  if (isSelected) {
    var pinSymbol = eventSymbol.cloneNode(true);
    pinSymbol.setAttribute('href', root+'images/natural-events/markers.svg#pin');
    wrapper.classList.add('marker-selected');
    svgEl.setAttribute('width', 36);
    svgEl.setAttribute('height', 42);
    svgEl.appendChild(pinSymbol);
  } else {
    var dotSymbol = eventSymbol.cloneNode(true);
    dotSymbol.setAttribute('href', root+'images/natural-events/markers.svg#dot');
    svgEl.setAttribute('width', 25);
    svgEl.setAttribute('height', 29);
    svgEl.appendChild(dotSymbol);
  }

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
