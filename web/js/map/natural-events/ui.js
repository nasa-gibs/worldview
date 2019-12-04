import * as olExtent from 'ol/extent';
import * as olProj from 'ol/proj';
import { forOwn as lodashForOwn, find as lodashFind } from 'lodash';
import markers from './markers';
import track from './track';
import wvui from '../../ui/ui';
import util from '../../util/util';
import { naturalEventsUtilGetEventById } from './util';
import { CHANGE_TAB as CHANGE_SIDEBAR_TAB } from '../../modules/sidebar/constants';
import * as EVENT_CONSTANTS from '../../modules/natural-events/constants';
import { activateLayersForEventCategory } from '../../modules/layers/actions';
import { deselectEvent as deselectEventAction, selected as selectedAction } from '../../modules/natural-events/actions';
import { selectDate } from '../../modules/date/actions';
import { CHANGE_PROJECTION } from '../../modules/projection/constants';

const zoomLevelReference = {
  Wildfires: 8,
  Volcanoes: 6
};

export default function naturalEventsUI(ui, config, store, models) {
  var self = {};
  var map;
  var view;
  var isLoading = true;
  self.eventsData = [];
  self.layers = config.naturalEvents.layers;
  self.events = util.events();
  self.markers = [];
  self.selected = {};
  self.selecting = false;
  var naturalEventMarkers = markers(ui, store);
  var naturalEventsTracks = {};
  var naturalEventsTrack;
  /**
   * Suscribe to redux store and listen for
   * specific action types
   */
  const subscribeToStore = function(action) {
    const state = store.getState();
    const events = state.events;
    const {
      requestedEvents,
      requestedEventSources,
      requestedEventCategories
    } = state;
    switch (action.type) {
      case CHANGE_SIDEBAR_TAB:
        return onSidebarChange(action.activeTab);
      case EVENT_CONSTANTS.SELECT_EVENT:
        return self.selectEvent(action.id, action.date);
      case EVENT_CONSTANTS.DESELECT_EVENT:
        return self.deselectEvent();
      case EVENT_CONSTANTS.REQUEST_EVENTS_SUCCESS:
      case EVENT_CONSTANTS.REQUEST_SOURCES_SUCCESS:
      case EVENT_CONSTANTS.REQUEST_CATEGORIES_SUCCESS:
        if (!isLoading) return;
        isLoading =
          requestedEvents.isLoading ||
          requestedEventSources.isLoading ||
          requestedEventCategories.isLoading;
        if (!isLoading) {
          self.eventsData = requestedEvents.response;
        }
        if (!isLoading && state.sidebar.activeTab === 'events') {
          onQueryResults();

          const selected = events.selected;

          if (selected.id) {
            return self.selectEvent(selected.id, selected.date, null, true);
          }
        }
        return;
      case CHANGE_PROJECTION:
        return !isLoading ? onProjChange(action.id) : '';
    }
  };

  /**
   * Handle when switching to/from the 'Events' tab in the sidebar
   * @param {*} tab
   */
  const onSidebarChange = function(tab) {
    const proj = store.getState().proj;
    if (tab === 'events') {
      // Remove previously stored markers
      naturalEventMarkers.remove(self.markers);
      // Store markers so the can be referenced later
      self.markers = naturalEventMarkers.draw();

      var isZoomed = Math.floor(view.getZoom()) >= 3;
      if (isZoomed || proj.selected.id !== 'geographic') {
        self.filterEventList();
      }
      // check if selected event is in changed projection
      if (self.selected.id) {
        const findSelectedInProjection = lodashFind(self.markers, function(
          marker
        ) {
          if (marker.pin) {
            if (marker.pin.id === self.selected.id) {
              // keep event highlighted when available in changed projection
              // highlightEventInList(self.selected.id, self.selected.date);
              return true;
            } else {
              return false;
            }
          } else {
            // highlightEventInList();
            return false;
          }
        });
        // remove selected event if not in changed projection
        if (!findSelectedInProjection) {
          self.deselectEvent();
          self.filterEventList();
        }
      }
    } else {
      naturalEventMarkers.remove(self.markers);
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
    self.filterEventList();

    // handle list filter on map move
    map.on('moveend', function(e) {
      self.filterEventList();
    });

    if (state.sidebar.activeTab === 'events') {
      // Remove previously stored markers
      naturalEventMarkers.remove(self.markers);
      // Store markers so the can be referenced later
      self.markers = naturalEventMarkers.draw();
      self.filterEventList();
      // check if selected event is in changed projection
      if (self.selected.id) {
        const findSelectedInProjection = lodashFind(self.markers, function(
          marker
        ) {
          if (marker.pin) {
            if (marker.pin.id === self.selected.id) {
              // keep event highlighted when available in changed projection
              // highlightEventInList(self.selected.id, self.selected.date);
              return true;
            } else {
              return false;
            }
          } else {
            // highlightEventInList();
            return false;
          }
        });
        // remove selected event if not in changed projection
        if (!findSelectedInProjection) {
          self.deselectEvent();
          self.filterEventList();
        }
        if (self.selected.date) {
          var event = naturalEventsUtilGetEventById(self.eventsData, self.selected.id);
          naturalEventsTrack.update(event, self.selected.date, self.selectEvent);
        };
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

    var isZoomed = Math.floor(view.getZoom()) >= 3;
    if (isZoomed || state.proj.selected.id !== 'geographic') {
      self.filterEventList();
    }

    map.on('moveend', function(e) {
      var isZoomed = Math.floor(view.getZoom()) >= 3;
      if (isZoomed || state.proj.selected.id !== 'geographic') {
        self.filterEventList();
      }
    });

    // Reselect previously selected event
    if (self.selected.id) {
      self.selectEvent(
        self.selected.id,
        self.selected.date || null,
        null,
        true
      );
    }
  };
  var init = function() {
    map = ui.map.selected;
    lodashForOwn(ui.map.proj, (projMap, key) => {
      naturalEventsTracks[key] = track(ui, store, projMap);
    });
    naturalEventsTrack = naturalEventsTracks[store.getState().proj.id];
    // Display loading information for user feedback on slow network
    view = map.getView();
    ui.events.on('last-action', subscribeToStore);
  };
  var getZoomPromise = function(
    event,
    date,
    rotation,
    isIdChange,
    isInitialLoad
  ) {
    return isInitialLoad
      ? new Promise(function(resolve, reject) {
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
  self.selectEvent = function(id, date, rotation, isInitialLoad) {
    var isIdChange = !self.selected || self.selected.id !== id;
    var prevId = self.selected.id ? self.selected.id : false;
    var prevEvent = prevId && naturalEventsUtilGetEventById(self.eventsData, prevId);
    var prevCategory = prevEvent ? prevEvent.categories[0].title : false;
    var event = naturalEventsUtilGetEventById(self.eventsData, id);
    var category = event && event.categories[0].title;
    var isSameCategory = category === prevCategory;
    if (!event) {
      wvui.notify('The event with an id of ' + id + ' is no longer active.');
      return;
    }
    date = date || self.getDefaultEventDate(event);
    self.selected = {
      id,
      date: date
    };

    const zoomPromise = getZoomPromise(
      event,
      date,
      rotation,
      !isIdChange,
      isInitialLoad
    );
    // highlightEventInList(id, date);
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
        var now = new Date();
        var today = now.toISOString().split('T')[0];
        var yesterday = new Date(now.setDate(now.getDate() - 1))
          .toISOString()
          .split('T')[0];
        if (date !== today || date !== yesterday) {
          store.dispatch(
            selectDate(util.dateAdd(util.parseDateUTC(date), 'day', 1))
          );
        }
      } else if (!isInitialLoad) store.dispatch(selectDate(util.parseDateUTC(date)));
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
      naturalEventsTrack.update(event, date, self.selectEvent);
      store.dispatch(selectedAction());
    });
  };

  self.deselectEvent = function() {
    self.selected = {};
    naturalEventMarkers.remove(self.markers);
    const state = store.getState();
    if (state.events.active) {
      self.markers = naturalEventMarkers.draw();
      naturalEventsTrack.update(null);
    }
    store.dispatch(deselectEventAction);
    self.events.trigger('change');
  };

  self.getDefaultEventDate = function(event) {
    var date = new Date(event.geometries[0].date).toISOString().split('T')[0];
    if (event.geometries.length < 2) return date;
    var category = event.categories.title || event.categories[0].title;
    var today = new Date().toISOString().split('T')[0];
    // For storms that happened today, get previous date
    if (date === today && category === 'Severe Storms') {
      date = new Date(event.geometries[1].date).toISOString().split('T')[0];
    }
    return date;
  };

  /**
   * Filter event list in sidebar based on projection/view extents
   *
   * @param  {Boolean} showAll - show all available points in projection
   */
  self.filterEventList = function() {
    const state = store.getState();
    const proj = state.proj;
    const showAll = state.events.showAll;
    if (isLoading || !state.sidebar.activeTab === 'events') return;
    var hiddenEventsCounter = self.markers.length;
    var extent = view.calculateExtent();
    var maxExtent = proj.selected.maxExtent;
    var visibleListEvents = {};
    var showListAllButton = false;

    self.eventsData.forEach(function(naturalEvent) {
      var isSelectedEvent = self.selected.id === naturalEvent.id;
      var date = self.getDefaultEventDate(naturalEvent);
      if (self.selected && self.selected.date) {
        date = self.selected.date;
      }
      var geometry =
        lodashFind(naturalEvent.geometries, function(geometry) {
          return geometry.date.split('T')[0] === date;
        }) || naturalEvent.geometries[0];

      var coordinates = geometry.coordinates;

      if (proj.selected.id !== 'geographic') {
        // check for polygon geometries for targeted projection coordinate transform
        if (geometry.type === 'Polygon') {
          const coordinatesTransform = coordinates[0].map(coordinate => {
            return olProj.transform(coordinate, 'EPSG:4326', proj.selected.crs);
          });
          const geomExtent = olExtent.boundingExtent(coordinatesTransform);
          coordinates = olExtent.getCenter(geomExtent);
        } else {
          // if normal geometries, transform given lon/lat array
          coordinates = olProj.transform(
            coordinates,
            'EPSG:4326',
            proj.selected.crs
          );
        }
      } else {
        if (geometry.type === 'Polygon') {
          const geomExtent = olExtent.boundingExtent(geometry.coordinates[0]);
          coordinates = olExtent.getCenter(geomExtent);
        }
      }

      // limit to maxExtent while allowing zoom and filter 'out of extent' events
      var isVisible =
        olExtent.containsCoordinate(extent, coordinates) &&
        olExtent.containsCoordinate(maxExtent, coordinates);
      // boolean showAll events limited to maxExtent of current projection
      if (showAll) {
        isVisible = olExtent.containsCoordinate(maxExtent, coordinates);
      }
      if (isVisible || isSelectedEvent) {
        visibleListEvents[naturalEvent.id] = true;
      } else {
        hiddenEventsCounter++;
      }
    });

    // hide footer 'List All' button/message if all events are visible
    if (hiddenEventsCounter > self.eventsData.length) {
      showListAllButton = true;
    } else {
      showListAllButton = false;
    }
    self.events.trigger('list-change', visibleListEvents, showListAllButton);
  };

  var activateLayersForCategory = function(category) {
    const state = store.getState();
    const { proj } = state;
    category = category || 'Default';
    const currentProjection = proj.selected.id;
    // Turn on the relevant layers for the event type based on projection and category
    var activeLayers = self.layers[currentProjection][category];
    if (!activeLayers) activeLayers = self.layers[currentProjection].Default;
    store.dispatch(activateLayersForEventCategory(activeLayers));
  };

  var zoomToEvent = function(event, date, rotation, isSameEventID) {
    const proj = store.getState().proj;
    var category = event.categories[0].title;
    var zoom = isSameEventID
      ? ui.map.selected.getView().getZoom()
      : zoomLevelReference[category];
    var geometry = lodashFind(event.geometries, function(geom) {
      return geom.date.split('T')[0] === date;
    });

    // check for polygon geometries and/or perform projection coordinate transform
    var coordinates =
      geometry.type === 'Polygon'
        ? olExtent.boundingExtent(
          olProj.transform(
            geometry.coordinates[0],
            'EPSG:4326',
            proj.selected.crs
          )
        )
        : olProj.transform(
          geometry.coordinates,
          'EPSG:4326',
          proj.selected.crs
        );

    // handle extent transform for polar
    if (geometry.type === 'Polygon' && proj.selected.id !== 'geographic') {
      coordinates = olProj.transformExtent(
        coordinates,
        'EPSG:4326',
        proj.selected.crs
      );
    }
    return ui.map.animate.fly(coordinates, zoom, rotation);
  };

  init();
  return self;
}
