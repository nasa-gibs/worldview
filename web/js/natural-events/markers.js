import lodashFind from 'lodash/find';
import lodashIsEmpty from 'lodash/isEmpty';
import olExtent from 'ol/extent';
import OlOverlay from 'ol/overlay';
import OlFeature from 'ol/feature';
import OlStyleStyle from 'ol/style/style';
import OlStyleStroke from 'ol/style/stroke';
import OlLayerVector from 'ol/layer/vector';
import OlSourceVector from 'ol/source/vector';
import OlGeomPolygon from 'ol/geom/polygon';
import olProj from 'ol/proj';

export default function markers (models, ui) {
  var self = {};
  var map = ui.map.selected;
  var olViewport = map.getViewport();

  self.draw = function () {
    if (!(models.naturalEvents && models.naturalEvents.data)) return null;
    var events = models.naturalEvents.data.events;
    if (!events) return null;
    var markers = events.map(function (event) {
      var marker = {};
      var selected = ui.naturalEvents.selected;
      var isSelected = event.id === selected.id;
      var date = ui.naturalEvents.getDefaultEventDate(event);

      if (isSelected && selected.date) {
        date = selected.date;
      }

      var geometry = lodashFind(event.geometries, function (geom) {
        return geom.date.split('T')[0] === date;
      }) || event.geometries[0];
      if (!geometry) return marker;

      var coordinates = geometry.coordinates;

      // polar projections require transform of coordinates to crs
      if (models.proj.selected.id !== 'geographic') {
        // check for polygon geometries
        if (geometry.type === 'Polygon') {
          let coordinatesTransform = coordinates[0].map((coordinate) => {
            return olProj.transform(coordinate, 'EPSG:4326', models.proj.selected.crs);
          });
          let extent = olExtent.boundingExtent(coordinatesTransform);
          coordinates = olExtent.getCenter(extent);
          if (isSelected) {
            marker.boundingBox = createBoundingBox(coordinatesTransform);
            map.addLayer(marker.boundingBox);
          }
        } else {
          // if normal geometries, transform given lon/lat array
          coordinates = olProj.transform(coordinates, 'EPSG:4326', models.proj.selected.crs);
        }
      } else {
        if (geometry.type === 'Polygon') {
          let extent = olExtent.boundingExtent(geometry.coordinates[0]);
          coordinates = olExtent.getCenter(extent);
          if (isSelected) {
            marker.boundingBox = createBoundingBox(geometry.coordinates);
            map.addLayer(marker.boundingBox);
          }
        }
      }

      var category = event.categories[0];
      // Assign a default category if we don't have an icon
      var icons = [
        'Dust and Haze',
        'Icebergs',
        'Manmade',
        'Sea and Lake Ice',
        'Severe Storms',
        'Snow',
        'Temperature Extremes',
        'Volcanoes',
        'Water Color',
        'Wildfires'
      ];
      category = icons.includes(category.title)
        ? category
        : { title: 'Default', slug: 'default' };

      // get maxExtent of current projection and check if marker is within range
      let maxExtent = models.proj.selected.maxExtent;
      let maxExtentCheck = coordinates[0] >= maxExtent[0] &&
                           coordinates[0] <= maxExtent[2] &&
                           coordinates[1] >= maxExtent[1] &&
                           coordinates[1] <= maxExtent[3];

      // only create marker if within projection extent range
      if (maxExtentCheck) {
        marker.pin = createPin(event.id, category, isSelected);
        marker.pin.setPosition(coordinates);
        map.addOverlay(marker.pin);

        // Add event listeners
        var willSelect = true;
        var moveCount = 0;
        // The pin element used to be on `element_` but now it looks like it
        // moved to `element`. Maybe this was a change to OpenLayers.
        var pinEl = marker.pin.element_ || marker.pin.element;

        ['pointerdown', 'mousedown', 'touchstart'].forEach(function (type) {
          pinEl.addEventListener(type, function (e) {
            willSelect = true;
            moveCount = 0;
            passEventToTarget(e, olViewport);
          });
        });

        [
          'pointermove',
          'wheel',
          'pointerdrag',
          'pointerup',
          'mousemove',
          'touchmove'
        ].forEach(function (type) {
          pinEl.addEventListener(type, function (e) {
            passEventToTarget(e, olViewport);
          });
        });

        ['pointermove', 'mousemove'].forEach(function (type) {
          pinEl.addEventListener(type, function (e) {
            moveCount++;
            if (moveCount > 2) {
              willSelect = false;
            }
          });
        });

        pinEl.addEventListener('click', function (e) {
          if (willSelect && !isSelected) {
            ui.naturalEvents.selectEvent(event.id, date);
          } else {
            passEventToTarget(e, olViewport);
          }
        });
      }

      return marker;
    // empty objects (i.e., markers not within projection range) are filtered out
    }).filter((marker) => !lodashIsEmpty(marker));
    map.renderSync(); // Marker position will be off until this is called
    return markers;
  };

  self.remove = function (markers) {
    markers = markers || [];
    if (markers.length < 1) return;
    markers.forEach(function(marker) {
      if (marker.boundingBox) {
        // added setMap to null for marker to remove - may be scope related issue
        marker.boundingBox.setMap(null);
        map.removeLayer(marker.boundingBox);
      }
      if (marker.pin) {
        // added setMap to null for marker to remove - may be scope related issue
        marker.pin.setMap(null);
        map.removeOverlay(marker.pin);
      }
    });
  };

  var passEventToTarget = function (event, target) {
    try {
      var eventCopy = new event.constructor(event.type, event);
      target.dispatchEvent(eventCopy);
    } catch (err) {
      console.log(err);
    }
  };

  var createPin = function (id, category, isSelected) {
    var overlayEl = document.createElement('div');
    var icon = document.createElement('i');
    overlayEl.className = 'marker';
    if (isSelected) overlayEl.classList.add('marker-selected');
    icon.className = 'event-icon event-icon-' + category.slug;
    icon.title = category.title;
    overlayEl.appendChild(icon);
    return new OlOverlay({
      element: overlayEl,
      positioning: 'bottom-center',
      id: id
    });
  };

  var createBoundingBox = function (coordinates) {
    var lightStroke = new OlStyleStyle({
      stroke: new OlStyleStroke({
        color: [255, 255, 255, 0.6],
        width: 2,
        lineDash: [4, 8],
        lineDashOffset: 6
      })
    });
    var darkStroke = new OlStyleStyle({
      stroke: new OlStyleStroke({
        color: [0, 0, 0, 0.6],
        width: 2,
        lineDash: [4, 8]
      })
    });
    return new OlLayerVector({
      source: new OlSourceVector({
        features: [new OlFeature({
          geometry: new OlGeomPolygon(coordinates),
          name: 'NaturalEvent'
        })],
        wrapX: false
      }),
      style: [lightStroke, darkStroke]
    });
  };

  return self;
};
