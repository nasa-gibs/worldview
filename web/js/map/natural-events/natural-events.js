import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as olExtent from 'ol/extent';
import * as olProj from 'ol/proj';
import {
  getDefaultEventDate,
  validateGeometryCoords,
  toEventDateString,
} from '../../modules/natural-events/util';
import util from '../../util/util';
import { selectDate as selectDateAction } from '../../modules/date/actions';
import { selected as selectedAction } from '../../modules/natural-events/actions';
import {
  addLayer as addLayerAction,
  removeGroup as removeGroupAction,
  activateLayersForEventCategory as activateLayersForEventCategoryAction,
  toggleVisibility as toggleVisibilityAction,
  toggleGroupVisibility as toggleGroupVisibilityAction,
} from '../../modules/layers/actions';
import { getFilteredEvents } from '../../modules/natural-events/selectors';
import { CRS } from '../../modules/map/constants';

import EventTrack from './event-track';
import EventMarkers from './event-markers';

import { fly } from '../util';
import usePrevious from '../../util/customHooks';

const zoomLevelReference = {
  wildfires: 8,
  volcanoes: 6,
};

/* For Wildfires that didn't happen today, move the timeline forward a day
* to improve the chance that the fire is visible.
* NOTE: If the fire happened yesterday and the imagery isn't yet available
* for today, this may not help.
*/
const getUseDate = (event, date) => {
  const today = toEventDateString(util.now());
  const yesterday = toEventDateString(util.yesterday());
  const recentDate = date === today || date === yesterday;
  const isWildfireEvent = event.categories[0].id === 'wildfires';
  const parsedDate = util.parseDateUTC(date);
  return isWildfireEvent && !recentDate ? util.dateAdd(parsedDate, 'day', 1) : parsedDate;
};

function NaturalEvents() {
  const dispatch = useDispatch();
  const prevSelectedEventRef = useRef({});

  const map = useSelector((state) => state.map.ui.selected);
  const proj = useSelector((state) => state.proj);
  const eventsDataIsLoading = useSelector((state) => state.requestedEvents.isLoading);
  const eventsData = useSelector((state) => getFilteredEvents(state));
  const isKioskModeActive = useSelector((state) => state.ui.isKioskModeActive);
  const selectedEvent = useSelector((state) => state.events.selected);
  const eventLayers = useSelector((state) => state.layers.eventLayers);
  const layers = useSelector((state) => state.layers.active.layers);
  const defaultEventLayer = useSelector((state) => state.config.naturalEvents.defaultLayer);

  const prevEventsDataIsLoading = usePrevious(eventsDataIsLoading);
  const prevSelectedEvent = usePrevious(selectedEvent);

  const zoomToEvent = (event, date, isSameEventID) => {
    const { crs } = proj.selected;
    const category = event.categories[0].id;
    const zoom = isSameEventID ? map.getView().getZoom() : zoomLevelReference[category];
    const geometry = event.geometry.find((geom) => geom.date.split('T')[0] === date);
    if (!geometry) return Promise.resolve();

    let coordinates;
    const transformCoords = (coords) => olProj.transform(coords, CRS.GEOGRAPHIC, crs);

    if (geometry.type === 'Polygon') {
      const transformedCoords = geometry.coordinates[0].map(transformCoords);
      coordinates = olExtent.boundingExtent(transformedCoords);
    } else {
      coordinates = olProj.transform(geometry.coordinates, CRS.GEOGRAPHIC, crs);
    }
    return fly(map, proj, coordinates, isKioskModeActive, zoom, null);
  };

  const getZoomPromise = (event, date, isSameEventID, isInitialLoad) => (
    isInitialLoad
      ? new Promise((resolve) => { resolve(); })
      : zoomToEvent(event, date, isSameEventID)
  );

  const selectEvent = (id, date, isInitialLoad) => {
    const prevSelected = prevSelectedEventRef.current;

    const isIdChange = !prevSelected || prevSelected.id !== id;
    const prevId = prevSelected.id ? prevSelected.id : false;
    const prevEvent = prevId && eventsData.find((e) => e.id === prevId);
    const prevCategory = prevEvent ? prevEvent.categories[0].title : false;
    const event = eventsData.find((e) => e.id === id);
    const category = event && event.categories[0].title;
    const categoryChange = category !== prevCategory;
    if (!event) {
      return;
    }
    const eventDate = date || getDefaultEventDate(event);
    const useDate = getUseDate(event, date);

    prevSelectedEventRef.current = { id, date };

    dispatch(selectDateAction(useDate));
    getZoomPromise(event, eventDate, !isIdChange, isInitialLoad).then(() => {
      if (!isInitialLoad) {
        if (categoryChange) {
          dispatch(removeGroupAction(eventLayers));
        }
        dispatch(activateLayersForEventCategoryAction(event.categories[0].title));
      }
      dispatch(selectedAction());
    });
  };

  const deselectEvent = () => {
    // placeholder for deselection logic if needed
  };

  const zoomIfVisible = ({ id, date }) => {
    const event = eventsData.find((e) => e.id === id);
    if (!event) {
      return;
    }
    const visibleGeoms = event.geometry.filter((g) => validateGeometryCoords(g, proj.selected));
    if (visibleGeoms.length) {
      zoomToEvent(event, date);
    }
  };

  // Mount effect: layer initialization and cleanup
  useEffect(() => {
    const defaultLayerPresent = layers.some((layer) => layer.id === defaultEventLayer);
    if (!defaultLayerPresent) {
      dispatch(addLayerAction(defaultEventLayer));
    } else if (defaultLayerPresent && !selectedEvent.date) {
      dispatch(toggleVisibilityAction(defaultEventLayer, true));
    }

    if (!selectedEvent.date) {
      const layersToHide = [];
      layers.forEach((layer) => {
        if (layer.group === 'overlays' && layer.layergroup !== 'Reference') {
          layersToHide.push(layer.id);
        }
      });
      dispatch(toggleGroupVisibilityAction(layersToHide, false));
    }

    return () => {
      dispatch(toggleVisibilityAction(defaultEventLayer, false));
    };
  }, []);

  // Update effect: handle loading changes and event selection
  useEffect(() => {
    if (!map || eventsDataIsLoading) return;

    const loadingChange = eventsDataIsLoading !== prevEventsDataIsLoading;
    const selectedEventChange = prevSelectedEvent !== undefined &&
      selectedEvent !== prevSelectedEvent;

    if (selectedEvent && loadingChange && !eventsDataIsLoading) {
      zoomIfVisible(selectedEvent);
    }

    if (selectedEventChange) {
      if (selectedEvent) {
        const { id, date } = selectedEvent;
        selectEvent(id, date, loadingChange);
      } else {
        deselectEvent();
      }
    }
  }, [map, eventsDataIsLoading, selectedEvent]);

  return (
    <>
      <EventTrack />
      <EventMarkers />
    </>
  );
}

export default NaturalEvents;
