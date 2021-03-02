import lodashFind from 'lodash/find';
import lodashIsEmpty from 'lodash/isEmpty';
import * as olExtent from 'ol/extent';
import OlOverlay from 'ol/Overlay';
import OlFeature from 'ol/Feature';
import OlStyleStyle from 'ol/style/Style';
import OlStyleStroke from 'ol/style/Stroke';
import OlLayerVector from 'ol/layer/Vector';
import OlSourceVector from 'ol/source/Vector';
import OlGeomPolygon from 'ol/geom/Polygon';
import * as olProj from 'ol/proj';
import googleTagManager from 'googleTagManager';
import { selectEvent as selectEventAction } from '../../modules/natural-events/actions';
import { getDefaultEventDate } from './util';

export default function markers(ui, store) {
  const self = {};
  const map = ui.map.selected;

  self.draw = function() {
    const { proj } = store.getState();
    const events = ui.naturalEvents.eventsData;
    if (!events || events.length < 1) return null;
    const markers = events.reduce((collection, event) => {
      const marker = {};
      const { selected } = ui.naturalEvents;
      const isSelected = event.id === selected.id;
      let date = getDefaultEventDate(event);

      if (isSelected && selected.date) {
        date = selected.date;
      }

      const geometry = lodashFind(event.geometry, (geom) => geom.date.split('T')[0] === date) || event.geometry[0];
      if (!geometry) return marker;

      let { coordinates } = geometry;

      // polar projections require transform of coordinates to crs
      if (proj.selected.id !== 'geographic') {
        // check for polygon geometries
        if (geometry.type === 'Polygon') {
          const coordinatesTransform = coordinates[0].map((coordinate) => olProj.transform(coordinate, 'EPSG:4326', proj.selected.crs));
          const extent = olExtent.boundingExtent(coordinatesTransform);
          coordinates = olExtent.getCenter(extent);
          if (isSelected) {
            marker.boundingBox = createBoundingBox(coordinatesTransform);
            map.addLayer(marker.boundingBox);
          }
        } else {
          // if normal geometries, transform given lon/lat array
          coordinates = olProj.transform(
            coordinates,
            'EPSG:4326',
            proj.selected.crs,
          );
        }
      } else if (geometry.type === 'Polygon') {
        const extent = olExtent.boundingExtent(geometry.coordinates[0]);
        coordinates = olExtent.getCenter(extent);
        if (isSelected) {
          marker.boundingBox = createBoundingBox(geometry.coordinates);
          map.addLayer(marker.boundingBox);
        }
      }

      let category = event.categories[0];
      // Assign a default category if we don't have an icon
      const icons = [
        'Dust and Haze',
        'Icebergs',
        'Manmade',
        'Sea and Lake Ice',
        'Severe Storms',
        'Snow',
        'Temperature Extremes',
        'Volcanoes',
        'Water Color',
        'Wildfires',
      ];
      category = icons.includes(category.title)
        ? category
        : { title: 'Default', slug: 'default' };

      // get maxExtent of current projection and check if marker is within range
      const { maxExtent } = proj.selected;
      const maxExtentCheck = olExtent.containsCoordinate(maxExtent, coordinates);
      // only create marker if within projection extent range
      if (maxExtentCheck) {
        marker.pin = createPin(event.id, category, isSelected, event.title);
        marker.pin.setPosition(coordinates);
        map.addOverlay(marker.pin);

        // Add event listeners
        let willSelect = true;
        let moveCount = 0;
        // The pin element used to be on `element_` but now it looks like it
        // moved to `element`. Maybe this was a change to OpenLayers.
        const pinEl = marker.pin.element_ || marker.pin.element;

        // Use passiveSupport detect in ui. passive applied if supported, capture will be false either way.
        ['pointerdown', 'mousedown', 'touchstart'].forEach((type) => {
          pinEl.addEventListener(
            type,
            (e) => {
              willSelect = true;
              moveCount = 0;
            },
            ui.supportsPassive ? { passive: true } : false,
          );
        });
        ['pointermove', 'mousemove'].forEach((type) => {
          pinEl.addEventListener(
            type,
            (e) => {
              moveCount += 1;
              if (moveCount > 2) {
                willSelect = false;
              }
            },
            ui.supportsPassive ? { passive: true } : false,
          );
        });
        ['touchend', 'click'].forEach((type) => {
          pinEl.addEventListener(
            type,
            (e) => {
              if (willSelect && !isSelected) {
                e.stopPropagation();
                store.dispatch(selectEventAction(event.id, date));
                googleTagManager.pushEvent({
                  event: 'natural_event_selected',
                  natural_events: {
                    category: category.title,
                  },
                });
              }
            },
            ui.supportsPassive ? { passive: true } : false,
          );
        });
      }
      // empty objects (i.e., markers not within projection range) are not pushed to collection
      if (lodashIsEmpty(marker) !== true) {
        collection.push(marker);
      }
      return collection;
    }, []);

    map.renderSync(); // Marker position will be off until this is called
    return markers;
  };

  self.remove = function(markers) {
    markers = markers || [];
    if (markers.length < 1) return;
    markers.forEach((marker) => {
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

  const createPin = function(id, category, isSelected, title) {
    const overlayEl = document.createElement('div');
    const icon = document.createElement('i');
    overlayEl.className = 'marker';
    if (isSelected) overlayEl.classList.add('marker-selected');
    icon.className = `event-icon event-icon-${category.slug}`;
    icon.title = title || category.title;
    overlayEl.appendChild(icon);
    return new OlOverlay({
      element: overlayEl,
      positioning: 'bottom-center',
      stopEvent: false,
      id,
    });
  };

  const createBoundingBox = function(coordinates) {
    const lightStroke = new OlStyleStyle({
      stroke: new OlStyleStroke({
        color: [255, 255, 255, 0.6],
        width: 2,
        lineDash: [4, 8],
        lineDashOffset: 6,
      }),
    });
    const darkStroke = new OlStyleStyle({
      stroke: new OlStyleStroke({
        color: [0, 0, 0, 0.6],
        width: 2,
        lineDash: [4, 8],
      }),
    });
    return new OlLayerVector({
      source: new OlSourceVector({
        features: [
          new OlFeature({
            geometry: new OlGeomPolygon(coordinates),
            name: 'NaturalEvent',
          }),
        ],
        wrapX: false,
      }),
      style: [lightStroke, darkStroke],
    });
  };

  return self;
}
