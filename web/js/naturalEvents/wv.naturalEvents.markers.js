var wv = wv || {};
wv.naturalEvents = wv.naturalEvents || {};
wv.naturalEvents.markers = wv.naturalEvents.markers || function(models, ui, config) {
  var self = {}, map;
  map = map || ui.map.selected;
  var olViewport = map.getViewport();

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
      var category = event.categories[0];
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

      marker.pin = createPin(event.id, category, isSelected);
      marker.pin.setPosition(coordinates);
      map.addOverlay(marker.pin);

      // Add event listeners
      var willSelect = true;
      var pinEl = marker.pin.element_;
      ['pointerdown', 'mousedown', 'touchstart'].forEach(function(type){
        pinEl.addEventListener(type, function(e){
          willSelect = true;
          passEventToTarget(e, olViewport);
        });
      });
      ['pointermove', 'wheel', 'pointerdrag',
        'pointerup', 'mousemove', 'touchmove'].forEach(function(type){
        pinEl.addEventListener(type, function(e){
          if (type === 'pointermove' || type === 'wheel') willSelect = false;
          passEventToTarget(e, olViewport);
        });
      });
      pinEl.addEventListener('click', function(e){
        if (willSelect && !isSelected) {
          ui.naturalEvents.selectEvent(event.id,date);
        } else {
          passEventToTarget(e, olViewport);
        }
      });
      return marker;
    });
    map.renderSync(); // Marker position will be off until this is called
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

  var passEventToTarget = function(event, target) {
    try {
      var eventCopy = new event.constructor(event.type, event);
      target.dispatchEvent(eventCopy);
    } catch (err) {} // Nothing to do, the try/catch prevents IE from crashing
  };

  var createPin = function(id, category, isSelected){
    var overlayEl = document.createElement('div');
    var icon = document.createElement('i');
    overlayEl.className = 'marker';
    if (isSelected) overlayEl.classList.add('marker-selected');
    icon.className = 'event-icon event-icon-' + category.slug;
    icon.title = category.title;
    overlayEl.appendChild(icon);
    return new ol.Overlay({
      element: overlayEl,
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

  return self;
};
