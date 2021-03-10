import * as olExtent from 'ol/extent';
import * as olProj from 'ol/proj';
import { forOwn as lodashForOwn, find as lodashFind } from 'lodash';
import markers from './markers';
import track from './track';
import util from '../../util/util';
import { CHANGE_TAB as CHANGE_SIDEBAR_TAB } from '../../modules/sidebar/constants';
import * as EVENT_CONSTANTS from '../../modules/natural-events/constants';
import { activateLayersForEventCategory } from '../../modules/layers/actions';
import { selected as selectedAction } from '../../modules/natural-events/actions';
import { getDefaultEventDate } from './util';
import { selectDate } from '../../modules/date/actions';
import { UPDATE_MAP_UI } from '../../modules/map/constants';
import { LOCATION_POP_ACTION } from '../../redux-location-state-customs';

const { events } = util;

const zoomLevelReference = {
  Wildfires: 8,
  Volcanoes: 6,
};

// ui.map = state.map.ui

export default function naturalEventsUI(ui, config, store) {
  const self = {};
  let map;
  let view;
  let isLoading = true;
  self.eventsData = [];
  self.layers = config.naturalEvents.layers;
  self.markers = [];
  self.selected = {};
  self.selecting = false;
  let naturalEventMarkers = markers(ui, store);
  const naturalEventsTracks = {};
  let naturalEventsTrack;

  /**
   * Suscribe to redux store and listen for
   * specific action types
   */
  const subscribeToStore = function(action) {
    const state = store.getState();
    const { events } = state;
    const {
      requestedEvents,
      requestedEventSources,
    } = state;
    switch (action.type) {
      case LOCATION_POP_ACTION: {
        const newState = util.fromQueryString(action.payload.search);
        if ((self.active && !newState.e) || (!self.active && newState.e)) {
          return onSidebarChange(newState.e);
        }
        return;
      }
      case CHANGE_SIDEBAR_TAB:
        return onSidebarChange(action.activeTab);
      case EVENT_CONSTANTS.SELECT_EVENT:
        return selectEvent(action.id, action.date);
      case EVENT_CONSTANTS.DESELECT_EVENT:
        return deselectEvent();
      case UPDATE_MAP_UI:
        if (map.proj !== action.ui.selected.proj) {
          onProjChange(action.ui.selected.proj);
        }
        return;
      case EVENT_CONSTANTS.REQUEST_EVENTS_SUCCESS:
      case EVENT_CONSTANTS.REQUEST_SOURCES_SUCCESS:
        if (!isLoading) return;
        isLoading = requestedEvents.isLoading
          || requestedEventSources.isLoading;
        if (!isLoading) {
          self.eventsData = requestedEvents.response;
        }
        if (!isLoading && state.sidebar.activeTab === 'events') {
          onQueryResults();

          const { selected } = events;

          if (selected.id) {
            return selectEvent(selected.id, selected.date, null, true);
          }
        }
        break;
      default:
        break;
    }
  };

  /**
   * Handle when switching to/from the 'Events' tab in the sidebar
   * @param {*} tab
   */
  const onSidebarChange = function(tab) {
    const { proj } = store.getState();
    if (tab === 'events') {
      self.active = true;
      // Remove previously stored markers
      naturalEventMarkers.remove(self.markers);
      // Store markers so the can be referenced later
      self.markers = naturalEventMarkers.draw();

      const isZoomed = Math.floor(view.getZoom()) >= 3;
      if (isZoomed || proj.selected.id !== 'geographic') {
        filterEventList();
      }
      // check if selected event is in changed projection
      if (self.selected.id) {
        const findSelectedInProjection = lodashFind(
          self.markers,
          (marker) => marker.pin && marker.pin.id === self.selected.id,
        );
        // remove selected event if not in changed projection
        if (!findSelectedInProjection) {
          deselectEvent();
          filterEventList();
        }
      }
    } else {
      naturalEventMarkers.remove(self.markers);
      self.active = false;
    }
    naturalEventsTrack.onSidebarChange(tab);
  };

  /**
   * Handle when the projection changes
   * @param {*} id
   */
  const onProjChange = function(id) {
    const state = store.getState();
    map = ui.map.selected;
    view = map.getView();
    naturalEventMarkers = markers(ui, store, map);
    if (naturalEventsTrack.trackDetails.id) naturalEventsTrack.update(null);
    naturalEventsTrack = naturalEventsTracks[id];
    // filter events within projection view extent
    filterEventList();

    // handle list filter on map move
    map.on('moveend', (e) => {
      filterEventList();
    });

    if (state.sidebar.activeTab === 'events') {
      // Remove previously stored markers
      naturalEventMarkers.remove(self.markers);
      // Store markers so the can be referenced later
      self.markers = naturalEventMarkers.draw();
      filterEventList();
      // check if selected event is in changed projection
      if (self.selected.id) {
        const findSelectedInProjection = lodashFind(
          self.markers,
          (marker) => marker.pin && marker.pin.id === self.selected.id,
        );
        // remove selected event if not in changed projection
        if (!findSelectedInProjection) {
          deselectEvent();
          filterEventList();
        }
        if (self.selected.date) {
          const event = self.eventsData.find((e) => e.id === self.selected.id);
          setTimeout(() => {
            naturalEventsTrack.update(event, self.selected.date);
            zoomToEvent(event, self.selected.date, null, false);
          });
        }
      }
    }
  };

  const onQueryResults = function() {
    const state = store.getState();

    if (state.sidebar.activeTab === 'events') {
      // Remove previously stored markers
      naturalEventMarkers.remove(self.markers);
      // Store markers so the can be referenced later
      self.markers = naturalEventMarkers.draw();
    }

    const isZoomed = Math.floor(view.getZoom()) >= 3;
    if (isZoomed || state.proj.selected.id !== 'geographic') {
      filterEventList();
    }

    map.on('moveend', (e) => {
      const isZoomed = Math.floor(view.getZoom()) >= 3;
      if (isZoomed || state.proj.selected.id !== 'geographic') {
        filterEventList();
      }
    });

    // Reselect previously selected event
    if (self.selected.id) {
      selectEvent(
        self.selected.id,
        self.selected.date || null,
        null,
        true,
      );
    }
  };

  const init = function() {
    map = ui.map.selected;
    lodashForOwn(ui.map.proj, (projMap, key) => {
      naturalEventsTracks[key] = track(ui, store, projMap);
    });
    naturalEventsTrack = naturalEventsTracks[store.getState().proj.id];
    // Display loading information for user feedback on slow network
    view = map.getView();
    events.on('redux:action-dispatched', subscribeToStore);
  };

  const getZoomPromise = function(
    event,
    date,
    rotation,
    isIdChange,
    isInitialLoad,
  ) {
    return isInitialLoad
      ? new Promise((resolve, reject) => {
        resolve();
      })
      : zoomToEvent(event, date, rotation, isIdChange);
  };

  /**
   * Select an event
   * @param {*} id
   * @param {*} date
   * @param {*} rotation
   * @param {*} isInitialLoad
   */
  const selectEvent = function(id, date, rotation, isInitialLoad) {
    const isIdChange = !self.selected || self.selected.id !== id;
    const prevId = self.selected.id ? self.selected.id : false;
    const prevEvent = prevId && self.eventsData.find((e) => e.id === prevId);
    const prevCategory = prevEvent ? prevEvent.categories[0].title : false;
    const event = self.eventsData.find((e) => e.id === id);
    const category = event && event.categories[0].title;
    const isSameCategory = category === prevCategory;
    if (!event) {
      return;
    }
    date = date || getDefaultEventDate(event);
    self.selected = {
      id,
      date,
    };

    const zoomPromise = getZoomPromise(
      event,
      date,
      rotation,
      !isIdChange,
      isInitialLoad,
    );

    // Remove previously stored markers
    naturalEventMarkers.remove(self.markers);
    // Store markers so the can be referenced later
    self.markers = naturalEventMarkers.draw();
    zoomPromise.then(() => {
      self.selecting = true;

      /* For Wildfires that didn't happen today, move the timeline forward a day
       * to improve the chance that the fire is visible.
       * NOTE: If the fire happened yesterday and the imagery isn't yet available
       * for today, this may not help.
       */
      if (event.categories[0].title === 'Wildfires' && !isInitialLoad) {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const yesterday = new Date(now.setDate(now.getDate() - 1))
          .toISOString()
          .split('T')[0];
        if (date !== today || date !== yesterday) {
          store.dispatch(
            selectDate(util.dateAdd(util.parseDateUTC(date), 'day', 1)),
          );
        }
      } else if (!isInitialLoad) {
        store.dispatch(selectDate(util.parseDateUTC(date)));
      }
      self.selecting = false;
      if (isIdChange && !isSameCategory && !isInitialLoad) {
        activateLayersForCategory(event.categories[0].title);
      }
      // hack to update layers
      if (isIdChange) {
        ui.map.reloadLayers();
      } else {
        ui.map.updateDate();
      }
      naturalEventsTrack.update(event, date, selectEvent);
      store.dispatch(selectedAction());
    });
  };

  const deselectEvent = function() {
    self.selected = {};
    naturalEventMarkers.remove(self.markers);
    const state = store.getState();
    if (state.events.active) {
      self.markers = naturalEventMarkers.draw();
      naturalEventsTrack.update(null);
    }
  };

  /**
   * Filter event list in sidebar based on projection/view extents
   *
   * @param  {Boolean} showAll - show all available points in projection
   */
  const filterEventList = function() {
    const state = store.getState();
    const { proj } = state;
    const { showAll } = state.events;
    if (isLoading || !state.sidebar.activeTab === 'events') return;
    const extent = view.calculateExtent();
    const { maxExtent } = proj.selected;
    const visibleListEvents = {};

    self.eventsData.forEach((naturalEvent) => {
      const isSelectedEvent = self.selected.id === naturalEvent.id;
      let date = getDefaultEventDate(naturalEvent);
      if (self.selected && self.selected.date) {
        date = self.selected.date;
      }
      const geometry = lodashFind(naturalEvent.geometry, (geometry) => geometry.date.split('T')[0] === date) || naturalEvent.geometry[0];

      let { coordinates } = geometry;

      if (proj.selected.id !== 'geographic') {
        // check for polygon geometries for targeted projection coordinate transform
        if (geometry.type === 'Polygon') {
          const coordinatesTransform = coordinates[0].map((coordinate) => olProj.transform(coordinate, 'EPSG:4326', proj.selected.crs));
          const geomExtent = olExtent.boundingExtent(coordinatesTransform);
          coordinates = olExtent.getCenter(geomExtent);
        } else {
          // if normal geometries, transform given lon/lat array
          coordinates = olProj.transform(
            coordinates,
            'EPSG:4326',
            proj.selected.crs,
          );
        }
      } else if (geometry.type === 'Polygon') {
        const geomExtent = olExtent.boundingExtent(geometry.coordinates[0]);
        coordinates = olExtent.getCenter(geomExtent);
      }

      // limit to maxExtent while allowing zoom and filter 'out of extent' events
      let isVisible = olExtent.containsCoordinate(extent, coordinates)
        && olExtent.containsCoordinate(maxExtent, coordinates);
      // boolean showAll events limited to maxExtent of current projection
      if (showAll) {
        isVisible = olExtent.containsCoordinate(maxExtent, coordinates);
      }
      if (isVisible || isSelectedEvent) {
        visibleListEvents[naturalEvent.id] = true;
      }
    });
  };

  /**
   *
   * @param {*} category
   */
  const activateLayersForCategory = function(category) {
    const state = store.getState();
    const { proj } = state;
    category = category || 'Default';
    const currentProjection = proj.selected.id;
    // Turn on the relevant layers for the event type based on projection and category
    let activeLayers = self.layers[currentProjection][category];
    if (!activeLayers) activeLayers = self.layers[currentProjection].Default;
    store.dispatch(activateLayersForEventCategory(activeLayers));
  };

  /**
   *
   * @param {*} event
   * @param {*} date
   * @param {*} rotation
   * @param {*} isSameEventID
   */
  const zoomToEvent = function(event, date, rotation, isSameEventID) {
    const { proj } = store.getState();
    const category = event.categories[0].title;
    const zoom = isSameEventID
      ? ui.map.selected.getView().getZoom()
      : zoomLevelReference[category];
    const geometry = lodashFind(event.geometry, (geom) => geom.date.split('T')[0] === date);

    // check for polygon geometries and/or perform projection coordinate transform
    let coordinates = geometry.type === 'Polygon'
      ? olExtent.boundingExtent(
        olProj.transform(
          geometry.coordinates[0],
          'EPSG:4326',
          proj.selected.crs,
        ),
      )
      : olProj.transform(
        geometry.coordinates,
        'EPSG:4326',
        proj.selected.crs,
      );

    // handle extent transform for polar
    if (geometry.type === 'Polygon' && proj.selected.id !== 'geographic') {
      coordinates = olProj.transformExtent(
        coordinates,
        'EPSG:4326',
        proj.selected.crs,
      );
    }
    return ui.map.animate.fly(coordinates, zoom, rotation);
  };

  init();
  return self;
}
