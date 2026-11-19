import React, { useLayoutEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { useSelector, useDispatch } from 'react-redux';
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
import EventIcon from '../../components/sidebar/event-icon';
import {
  selectEvent as selectEventAction,
  highlightEvent as highlightEventAction,
  unHighlightEvent as unHighlightEventAction,
} from '../../modules/natural-events/actions';
import { getDefaultEventDate } from '../../modules/natural-events/util';
import { getFilteredEvents } from '../../modules/natural-events/selectors';
import { CRS } from '../../modules/map/constants';
import usePrevious from '../../util/customHooks';

const icons = [
  'dustHaze',
  'manmade',
  'floods',
  'seaLakeIce',
  'severeStorms',
  'snow',
  'volcanoes',
  'waterColor',
  'wildfires',
];

const createPin = function(id, category, isSelected, title, hideTooltip) {
  const overlayEl = document.createElement('div');
  const root = createRoot(overlayEl);
  root.render(
    React.createElement(EventIcon, {
      category: category.id,
      title,
      id,
      hideTooltip,
      withPin: true,
    }),
  );
  const overlay = new OlOverlay({
    element: overlayEl,
    positioning: 'bottom-center',
    stopEvent: false,
    className: isSelected ? 'marker selected' : 'marker',
    id,
  });
  return overlay;
};

const createBoundingBox = function(coordinates, title, proj = CRS.GEOGRAPHIC) {
  const lightStroke = new OlStyleStyle({
    stroke: new OlStyleStroke({
      color: [255, 255, 255, 0.6],
      width: 2,
      lineDash: [8, 12],
      lineDashOffset: 6,
    }),
  });
  const darkStroke = new OlStyleStyle({
    stroke: new OlStyleStroke({
      color: [0, 0, 0, 0.6],
      width: 2,
      lineDash: [8, 12],
    }),
  });
  const boxPolygon = new OlGeomPolygon(coordinates).transform(CRS.GEOGRAPHIC, proj);
  const boxFeature = new OlFeature({
    geometry: boxPolygon,
    name: title,
  });
  const vectorSource = new OlSourceVector({
    features: [boxFeature],
    wrapX: false,
  });

  return new OlLayerVector({
    source: vectorSource,
    style: [lightStroke, darkStroke],
  });
};

function EventMarkers() {
  const dispatch = useDispatch();
  const markersRef = useRef([]);

  const map = useSelector((state) => state.map.ui.selected);
  const mapUi = useSelector((state) => state.map.ui);
  const proj = useSelector((state) => state.proj);
  const selectedEvent = useSelector((state) => state.events.selected);
  const isMobile = useSelector((state) => state.screenSize.isMobileDevice);
  const isAnimatingToEvent = useSelector((state) => state.events.isAnimatingToEvent);
  const eventsData = useSelector((state) => getFilteredEvents(state));
  const eventsDataIsLoading = useSelector((state) => state.requestedEvents.isLoading);

  const prevProj = usePrevious(proj);
  const prevEventsDataIsLoading = usePrevious(eventsDataIsLoading);
  const prevIsAnimatingToEvent = usePrevious(isAnimatingToEvent);
  const prevSelectedEvent = usePrevious(selectedEvent);

  const addInteractions = (marker, event, date, isSelected) => {
    const category = event.categories[0];
    let willSelect = true;
    let moveCount = 0;
    const pinEl = marker.pin.element;
    const options = mapUi.supportsPassive ? { passive: true } : false;
    const onMouseDownTouchStart = (e) => {
      willSelect = true;
      moveCount = 0;
    };
    const onMouseMove = (e) => {
      moveCount += 1;
      if (moveCount > 2) {
        willSelect = false;
      }
    };
    const onClickTouchEnd = (e) => {
      if (willSelect && !isSelected) {
        e.stopPropagation();
        dispatch(selectEventAction(event.id, date));
        googleTagManager.pushEvent({
          event: 'natural_event_selected',
          natural_events: {
            category: category.id,
          },
        });
      }
    };
    const onMouseEnter = () => {
      dispatch(highlightEventAction(event.id, date));
    };
    const onMouseLeave = () => {
      dispatch(unHighlightEventAction());
    };

    ['pointerdown', 'mousedown', 'touchstart'].forEach((type) => {
      pinEl.addEventListener(type, onMouseDownTouchStart, options);
    });
    ['touchend', 'click'].forEach((type) => {
      pinEl.addEventListener(type, onClickTouchEnd, options);
    });
    ['pointermove', 'mousemove'].forEach((type) => {
      pinEl.addEventListener(type, onMouseMove, options);
    });
    pinEl.addEventListener('mouseenter', onMouseEnter, options);
    pinEl.addEventListener('mouseleave', onMouseLeave, options);
  };

  const remove = () => {
    const markers = markersRef.current;
    if (markers.length < 1) return;
    markers.forEach((marker) => {
      if (marker.boundingBox) {
        marker.boundingBox.setMap(null);
        map.removeLayer(marker.boundingBox);
      }
      if (marker.pin) {
        marker.pin.setMap(null);
        map.removeOverlay(marker.pin);
      }
    });
    const markerTooltips = document.getElementsByClassName('event-icon-tooltip');
    Object.values(markerTooltips).forEach((tooltip) => {
      tooltip.remove();
    });
    markersRef.current = [];
  };

  const draw = () => {
    if (!eventsData || eventsData.length < 1) return;

    const markers = eventsData.reduce((collection, event) => {
      const marker = {};
      const isSelected = event.id === selectedEvent.id;
      const { crs } = proj.selected;
      let date = getDefaultEventDate(event);
      if (isSelected && selectedEvent.date) {
        date = selectedEvent.date;
      }
      const geometry = event.geometry.find((geom) => geom.date.split('T')[0] === date) || event.geometry[0];
      if (!geometry) return collection;

      let { coordinates } = geometry;

      const transformCoords = (coords) => olProj.transform(coords, CRS.GEOGRAPHIC, crs);

      if (proj.selected.id !== 'geographic') {
        if (geometry.type === 'Polygon') {
          const coordinatesTransform = coordinates[0].map(transformCoords);
          const extent = olExtent.boundingExtent(coordinatesTransform);

          if (isSelected) {
            marker.boundingBox = createBoundingBox(coordinates, event.title, crs);
            map.addLayer(marker.boundingBox);
          }
          coordinates = olExtent.getCenter(extent);
        } else {
          coordinates = transformCoords(coordinates);
        }
      } else if (geometry.type === 'Polygon') {
        const extent = olExtent.boundingExtent(geometry.coordinates[0]);
        coordinates = olExtent.getCenter(extent);
        if (isSelected) {
          marker.boundingBox = createBoundingBox(geometry.coordinates, event.title);
          map.addLayer(marker.boundingBox);
        }
      }

      const hideTooltips = isMobile || isAnimatingToEvent;
      let category = event.categories[0];
      category = icons.includes(category.id)
        ? category
        : { title: 'Default', slug: 'default', id: 'default' };

      marker.pin = createPin(event.id, category, isSelected, event.title, hideTooltips);
      marker.pin.setPosition(coordinates);
      map.addOverlay(marker.pin);
      addInteractions(marker, event, date, isSelected);

      if (lodashIsEmpty(marker) !== true) {
        collection.push(marker);
      }
      return collection;
    }, []);

    markersRef.current = markers;
    map.getView().changed();
    map.renderSync();
  };

  useLayoutEffect(() => {
    const projChange = prevProj !== undefined && proj !== prevProj;
    const finishedLoading = !eventsDataIsLoading &&
      prevEventsDataIsLoading !== undefined &&
      eventsDataIsLoading !== prevEventsDataIsLoading;
    const animationFinished = !isAnimatingToEvent &&
      prevIsAnimatingToEvent !== undefined &&
      isAnimatingToEvent !== prevIsAnimatingToEvent;
    const selectedEventChanged = selectedEvent &&
      prevSelectedEvent !== undefined &&
      selectedEvent !== prevSelectedEvent;
    const isInitialMount = prevEventsDataIsLoading === undefined;

    if (isInitialMount) {
      if (!eventsDataIsLoading) {
        draw();
      }
    } else if (finishedLoading || projChange || animationFinished || selectedEventChanged) {
      remove();
      draw();
    }

    return () => {
      remove();
    };
  }, [proj, eventsDataIsLoading, isAnimatingToEvent, selectedEvent]);

  return null;
}

export default EventMarkers;
