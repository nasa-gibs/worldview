import lodashFind from 'lodash/find';
import lodashEach from 'lodash/each';
import * as olExtent from 'ol/extent';
import * as olProj from 'ol/proj';

import markers from './markers';
import track from './track';
import wvui from '../ui/ui';
import util from '../util/util';
import { naturalEventsUtilGetEventById } from './util';
import googleTagManager from 'googleTagManager';

const zoomLevelReference = {
  Wildfires: 8,
  Volcanoes: 6
};

export default function naturalEventsUI(models, ui, config, request) {
  var self = {};
  var eventVisibilityAlert;
  var map;
  var view;
  var model = models.naturalEvents;
  model.active = false;
  self.markers = [];
  self.selected = {};
  self.selecting = false;
  var naturalEventMarkers = markers(models, ui, config);
  var naturalEventsTrack = track(models, ui, config);

  var init = function() {
    map = ui.map.selected;
    // Display loading information for user feedback on slow network

    view = map.getView();

    request.events.on('queryResults', function() {
      if (!(model.data.events || model.data.sources)) return;

      if (model.active) {
        // Remove previously stored markers
        naturalEventMarkers.remove(self.markers);
        // Store markers so the can be referenced later
        self.markers = naturalEventMarkers.draw();
      }

      var isZoomed = Math.floor(view.getZoom()) >= 3;
      if (isZoomed || models.proj.selected.id !== 'geographic') {
        self.filterEventList();
      }

      map.on('moveend', function(e) {
        var isZoomed = Math.floor(view.getZoom()) >= 3;
        if (isZoomed || models.proj.selected.id !== 'geographic') {
          self.filterEventList();
        } else {
          model.events.trigger('list-change', { all: true }, false);
        }
      });

      // Reselect previously selected event
      if (self.selected.id) {
        self.selectEvent(self.selected.id, self.selected.date || null);
      }
    });
    ui.sidebar.events.on('selectTab', function(tab) {
      if (tab === 'events') {
        model.active = true;
        googleTagManager.pushEvent({
          'event': 'natural_events_tab'
        });

        // Remove previously stored markers
        naturalEventMarkers.remove(self.markers);
        // Store markers so the can be referenced later
        self.markers = naturalEventMarkers.draw();

        var isZoomed = Math.floor(view.getZoom()) >= 3;
        if (isZoomed || models.proj.selected.id !== 'geographic') {
          self.filterEventList();
        }
        // check if selected event is in changed projection
        if (self.selected.id) {
          let findSelectedInProjection = lodashFind(self.markers, function(
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
        model.active = false;
        naturalEventMarkers.remove(self.markers);
        if (eventVisibilityAlert) {
          eventVisibilityAlert.dialog('close');
          eventVisibilityAlert = null;
        }
      }
      model.events.trigger('change');
    });

    // get events for projection change
    models.proj.events.on('select', function(e) {
      map = ui.map.selected;
      view = map.getView();
      naturalEventMarkers = markers(models, ui, config);
      naturalEventsTrack = track(models, ui, config);

      if (!(model.data.events || model.data.sources)) return;

      // filter events within projection view extent
      self.filterEventList();

      // handle list filter on map move
      ui.map.selected.on('moveend', function(e) {
        self.filterEventList();
      });

      if (model.active) {
        // Remove previously stored markers
        naturalEventMarkers.remove(self.markers);
        // Store markers so the can be referenced later
        self.markers = naturalEventMarkers.draw();
        self.filterEventList();
        // check if selected event is in changed projection
        if (self.selected.id) {
          let findSelectedInProjection = lodashFind(self.markers, function(
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
          } else {
            let event = naturalEventsUtilGetEventById(
              model.data.events,
              self.selected.id
            );
            naturalEventsTrack.update(
              event,
              ui.map.selected,
              self.selected.date,
              self.selectEvent
            );
          }
        }
      }
    });
  };

  self.selectEvent = function(id, date) {
    var isIdChange = !self.selected || self.selected.id !== id;
    var prevId = self.selected.id ? self.selected.id : false;
    var prevEvent = prevId
      ? naturalEventsUtilGetEventById(model.data.events, prevId)
      : false;
    var prevCategory = prevEvent ? prevEvent.categories[0].title : false;

    // Store selected id and date in model
    self.selected = { id: id };
    var event = naturalEventsUtilGetEventById(model.data.events, id);

    if (!event) {
      wvui.notify('The event with an id of ' + id + ' is no longer active.');
      return;
    }

    var category = event.categories[0].title;
    var isSameCategory = category === prevCategory;

    date = date || self.getDefaultEventDate(event);
    self.selected.date = date;

    // highlightEventInList(id, date);
    // Remove previously stored markers
    naturalEventMarkers.remove(self.markers);
    // Store markers so the can be referenced later
    self.markers = naturalEventMarkers.draw();
    zoomToEvent(event, date, !isIdChange).then(function() {
      self.selecting = true;
      if (isIdChange && !isSameCategory) {
        activateLayersForCategory(event.categories[0].title);
      }
      models.date.select(util.parseDateUTC(date));
      /* For Wildfires that didn't happen today, move the timeline forward a day
       * to improve the chance that the fire is visible.
       * NOTE: If the fire happened yesterday and the imagery isn't yet available
       * for today, this may not help.
       */
      if (event.categories[0].title === 'Wildfires') {
        var now = new Date();
        var today = now.toISOString().split('T')[0];
        var yesterday = new Date(now.setDate(now.getDate() - 1))
          .toISOString()
          .split('T')[0];
        if (date !== today || date !== yesterday) {
          models.date.select(util.dateAdd(util.parseDateUTC(date), 'day', 1));
        }
      }

      // Show event visiblity alert
      if (!eventVisibilityAlert) {
        eventVisibilityAlert = wvui.alert(
          eventVisibilityAlertBody,
          'Events may not be visible at all times.',
          800,
          'warning',
          function() {
            if (util.browser.localStorage) {
              localStorage.setItem('dismissedEventVisibilityAlert', true);
            }
            eventVisibilityAlert.dialog('close');
          }
        );
      }
      if (
        util.browser.localStorage &&
        !localStorage.getItem('dismissedEventVisibilityAlert')
      ) {
        eventVisibilityAlert.dialog('open');
      }
      naturalEventsTrack.update(event, ui.map.selected, date, self.selectEvent);
      self.selecting = false;
    });
    model.events.trigger('selected-event', self.selected);
  };

  self.deselectEvent = function() {
    self.selected = {};
    naturalEventMarkers.remove(self.markers);
    self.markers = naturalEventMarkers.draw();
    naturalEventsTrack.update(null, ui.map.selected);
    model.events.trigger('selected-event', self.selected);
    model.events.trigger('change');
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
  self.filterEventList = function(showAll) {
    if (!model.data.events || !model.active) return;
    var hiddenEventsCounter = self.markers.length;
    var extent = view.calculateExtent();
    var maxExtent = models.proj.selected.maxExtent;
    var visibleListEvents = {};
    var showListAllButton = false;

    model.data.events.forEach(function(naturalEvent) {
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

      if (models.proj.selected.id !== 'geographic') {
        // check for polygon geometries for targeted projection coordinate transform
        if (geometry.type === 'Polygon') {
          let coordinatesTransform = coordinates[0].map(coordinate => {
            return olProj.transform(
              coordinate,
              'EPSG:4326',
              models.proj.selected.crs
            );
          });
          let geomExtent = olExtent.boundingExtent(coordinatesTransform);
          coordinates = olExtent.getCenter(geomExtent);
        } else {
          // if normal geometries, transform given lon/lat array
          coordinates = olProj.transform(
            coordinates,
            'EPSG:4326',
            models.proj.selected.crs
          );
        }
      } else {
        if (geometry.type === 'Polygon') {
          let geomExtent = olExtent.boundingExtent(geometry.coordinates[0]);
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
    if (hiddenEventsCounter > model.data.events.length) {
      showListAllButton = true;
    } else {
      showListAllButton = false;
    }
    model.events.trigger('list-change', visibleListEvents, showListAllButton);
  };

  var activateLayersForCategory = function(category) {
    category = category || 'Default';
    let currentProjection = models.proj.selected.id;
    var layerString = models.layers.activeLayers;
    // Turn on the relevant layers for the event type based on projection and category
    var layers = model.layers[currentProjection][category];
    if (!layers) layers = model.layers[currentProjection]['Default'];
    // Turn off all layers in list first
    lodashEach(models.layers[layerString], function(layer) {
      models.layers.setVisibility(layer.id, false, layerString);
    });
    // Turn on or add new layers
    lodashEach(layers, function(layer) {
      var id = layer[0];
      var visible = layer[1];
      if (models.layers.exists(id, models.layers[layerString])) {
        models.layers.setVisibility(id, visible, layerString);
      } else {
        models.layers.add(
          id,
          {
            visible: visible
          },
          layerString,
          'natural-event'
        );
      }
    });
  };

  var zoomToEvent = function(event, date, isSameEventID) {
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
            models.proj.selected.crs
          )
        )
        : olProj.transform(
          geometry.coordinates,
          'EPSG:4326',
          models.proj.selected.crs
        );

    // handle extent transform for polar
    if (
      geometry.type === 'Polygon' &&
      models.proj.selected.id !== 'geographic'
    ) {
      coordinates = olProj.transformExtent(
        coordinates,
        'EPSG:4326',
        models.proj.selected.crs
      );
    }

    return ui.map.animate.fly(coordinates, zoom);
  };

  init();
  return self;
}

var eventVisibilityAlertBody =
  '<h3 class="wv-data-unavailable-header">Why can’t I see an event?</h3><p>There are a variety of factors as to why you may not be seeing an event in Worldview at the moment.</p>' +
  '<ul>' +
  '<li>Satellite overpass may have occurred before the event. Check out subsequent days or try a different satellite/sensor which has a different overpass time.</li>' +
  '<li>Cloud cover may obscure the event.</li>' +
  '<li>Some events don’t appear on the day that they are reported, you may have to wait a day or two for an event to become visible. Try and scroll through the days to see an event’s progression and/or change the satellite/sensor. NOTE: Wildfire events are currently set to automatically display the next day, as fire events often do not appear in the satellite imagery on the day they are reported.</li>' +
  '<li>The resolution of the imagery may be too coarse to see an event.</li>' +
  '<li>There are normal swath data gaps in some of the imagery layers due to way the satellite orbits the Earth, and an event may have occurred in the data gap.</li>' +
  '</ul>' +
  '<p>This is currently an experimental feature and we are working closely with the provider of these events, the <a href="https://eonet.sci.gsfc.nasa.gov/" target="_blank">Earth Observatory Natural Event Tracker</a>, to refine this listing to only show events that are visible with our satellite imagery.</p>';
