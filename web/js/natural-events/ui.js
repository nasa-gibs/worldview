import $ from 'jquery';
import lodashFind from 'lodash/find';
import lodashEach from 'lodash/each';
import olExtent from 'ol/extent';
import olProj from 'ol/proj';

import markers from './markers';
import track from './track';

import wvui from '../ui/ui';
import util from '../util/util';
import { naturalEventsUtilGetEventById } from './util';

const zoomLevelReference = {
  'Wildfires': 8,
  'Volcanoes': 6
};

export default function naturalEventsUI (models, ui, config, request) {
  var self = {};
  var eventVisibilityAlert;
  var $footer;
  var map;
  var view;
  var model = models.naturalEvents;
  model.active = false;
  self.markers = [];
  self.selected = {};
  var naturalEventMarkers = markers(models, ui, config);
  var naturalEventsTrack = track(models, ui, config);

  var init = function () {
    map = ui.map.selected;
    // Display loading information for user feedback on slow network
    $('#wv-events').text('Loading...');

    view = map.getView();

    request.events.on('queryResults', function () {
      if (!(model.data.events || model.data.sources)) return;

      if (model.active) {
        // Remove previously stored markers
        naturalEventMarkers.remove(self.markers);
        // Store markers so the can be referenced later
        self.markers = naturalEventMarkers.draw();
      }

      createEventList();
      var isZoomed = Math.floor(view.getZoom()) >= 3;
      if (isZoomed || models.proj.selected.id !== 'geographic') {
        self.filterEventList();
      }

      map.on('moveend', function (e) {
        var isZoomed = Math.floor(view.getZoom()) >= 3;
        if (isZoomed || models.proj.selected.id !== 'geographic') {
          self.filterEventList();
        } else {
          $('.map-item-list .item').show();
          $footer.hide();
          ui.sidebar.sizeEventsTab();
        }
      });

      // Reselect previously selected event
      if (self.selected.id) {
        self.selectEvent(self.selected.id, self.selected.date || null);
      }

      ui.sidebar.sizeEventsTab();
      $(window).resize(ui.sidebar.sizeEventsTab);
    });

    ui.sidebar.events.on('selectTab', function (tab) {
      if (tab === 'events') {
        model.active = true;

        // Remove previously stored markers
        naturalEventMarkers.remove(self.markers);
        // Store markers so the can be referenced later
        self.markers = naturalEventMarkers.draw();
        ui.sidebar.sizeEventsTab();

        // check if selected event is in changed projection
        if (self.selected.id) {
          let findSelectedInProjection = lodashFind(self.markers, function(marker) {
            if (marker.pin) {
              if (marker.pin.id === self.selected.id) {
                // keep event highlighted when available in changed projection
                highlightEventInList(self.selected.id, self.selected.date);
                return true;
              } else {
                return false;
              }
            } else {
              highlightEventInList();
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
      ui.map.selected.on('moveend', function (e) {
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
          let findSelectedInProjection = lodashFind(self.markers, function(marker) {
            if (marker.pin) {
              if (marker.pin.id === self.selected.id) {
                // keep event highlighted when available in changed projection
                highlightEventInList(self.selected.id, self.selected.date);
                return true;
              } else {
                return false;
              }
            } else {
              highlightEventInList();
              return false;
            }
          });
          // remove selected event if not in changed projection
          if (!findSelectedInProjection) {
            self.deselectEvent();
            self.filterEventList();
          }
        }
      }
      models.proj.events.trigger('change');
    });
  };

  self.selectEvent = function (id, date) {
    var isIdChange = (!self.selected || self.selected.id !== id);
    var prevId = self.selected.id ? self.selected.id : false;
    var prevEvent = prevId ? naturalEventsUtilGetEventById(model.data.events, prevId) : false;
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

    highlightEventInList(id, date);
    // Remove previously stored markers
    naturalEventMarkers.remove(self.markers);
    // Store markers so the can be referenced later
    self.markers = naturalEventMarkers.draw();
    zoomToEvent(event, date, !isIdChange).then(function () {
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
        var yesterday = new Date(now.setDate(now.getDate() - 1)).toISOString().split('T')[0];
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
          function () {
            if (util.browser.localStorage) localStorage.setItem('dismissedEventVisibilityAlert', true);
            eventVisibilityAlert.dialog('close');
          }
        );
      }
      if (util.browser.localStorage && !localStorage.getItem('dismissedEventVisibilityAlert')) {
        eventVisibilityAlert.dialog('open');
      }
      naturalEventsTrack.update(event, ui.map.selected, date, self.selectEvent);
    });
  };

  self.deselectEvent = function () {
    self.selected = {};
    naturalEventMarkers.remove(self.markers);
    self.markers = naturalEventMarkers.draw();
    highlightEventInList();
    naturalEventsTrack.update(null, ui.map.selected);
    model.events.trigger('change');
  };

  self.getDefaultEventDate = function (event) {
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
  self.filterEventList = function (showAll) {
    if (!model.data.events) return;
    var hiddenEventsCounter = self.markers.length;
    var extent = view.calculateExtent();
    var maxExtent = models.proj.selected.maxExtent;
    model.data.events.forEach(function (naturalEvent) {
      var isSelectedEvent = (self.selected.id === naturalEvent.id);
      var date = self.getDefaultEventDate(naturalEvent);
      if (self.selected && self.selected.date) {
        date = self.selected.date;
      }
      var geometry = lodashFind(naturalEvent.geometries, function (geometry) {
        return geometry.date.split('T')[0] === date;
      }) || naturalEvent.geometries[0];

      var coordinates = geometry.coordinates;

      if (models.proj.selected.id !== 'geographic') {
        // check for polygon geometries for targeted projection coordinate transform
        if (geometry.type === 'Polygon') {
          let coordinatesTransform = coordinates[0].map((coordinate) => {
            return olProj.transform(coordinate, 'EPSG:4326', models.proj.selected.crs);
          });
          let geomExtent = olExtent.boundingExtent(coordinatesTransform);
          coordinates = olExtent.getCenter(geomExtent);
        } else {
          // if normal geometries, transform given lon/lat array
          coordinates = olProj.transform(coordinates, 'EPSG:4326', models.proj.selected.crs);
        }
      } else {
        if (geometry.type === 'Polygon') {
          let geomExtent = olExtent.boundingExtent(geometry.coordinates[0]);
          coordinates = olExtent.getCenter(geomExtent);
        }
      }

      // limit to maxExtent while allowing zoom and filter 'out of extent' events
      var isVisible = olExtent.containsCoordinate(extent, coordinates) &&
                      olExtent.containsCoordinate(maxExtent, coordinates);
      // boolean showAll events limited to maxExtent of current projection
      if (showAll) {
        isVisible = olExtent.containsCoordinate(maxExtent, coordinates);
      }
      var $thisItem = $('.map-item-list .item[data-id=' + naturalEvent.id + ']');
      if (isVisible || isSelectedEvent) {
        $thisItem.show();
      } else {
        hiddenEventsCounter++;
        $thisItem.hide();
      }
    });

    // hide footer 'List All' button/message if all events are visible
    if (hiddenEventsCounter > model.data.events.length) {
      $footer.show();
    } else {
      $footer.hide();
    }
    ui.sidebar.sizeEventsTab();
  };

  var createEventList = function () {
    var $panels = $('<div />', { class: 'wv-eventslist sidebar-panel' });
    $('#wv-events').empty().append($panels);
    var $list = $('<ul></ul>').attr('id', 'wv-eventscontent').addClass('content').addClass('map-item-list');
    var $detailContainer = $('<div></div>').attr('id', 'wv-events-detail').hide();
    $panels.append($list);
    $panels.append($detailContainer);
    var $content = $('#wv-eventscontent').empty();
    lodashEach(model.data.events, function (event) {
      $content.append(createEventElement($content, event));
    });

    $footer = $('<footer />');
    var $footerNote = $('<p />', {
      text: 'Only selected events and events in current map view are listed'
    });
    var $showAllBtn = $('<button />', {
      class: 'action',
      id: 'show-all-events',
      text: 'List All',
      click: function () {
        $('.map-item-list .item ').show();
        self.filterEventList(true);
        $footer.hide();
        ui.sidebar.sizeEventsTab();
      }
    });
    $showAllBtn.button();
    $footer.append($footerNote);
    $footer.append($showAllBtn);
    $('#wv-events').append($footer);
    $footer.hide();
  };

  var createEventElement = function ($content, event) {
    var eventDate = util.parseDateUTC(event.geometries[0].date);
    var dateString = util.giveWeekDay(eventDate) + ', ' +
      util.giveMonth(eventDate) + ' ' +
      eventDate.getUTCDate();

    if (eventDate.getUTCFullYear() !== util.today().getUTCFullYear()) {
      dateString += ', ' + eventDate.getUTCFullYear();
    }

    var $item = $('<li/>', { class: 'selectorItem item', 'data-id': event.id });
    var $title = $('<h4/>', {
      class: 'title',
      html: event.title + '<br/>' + dateString
    });
    var $subtitle = $('<p/>', {
      class: 'subtitle',
      html: event.description
    }).hide();
    var $eventIcon = $('<i />', {
      class: 'event-icon event-icon-' + event.categories[0].slug,
      title: event.categories[0].title
    });
    var $dates = $('<ul/>', { class: 'dates' }).hide();

    if (event.geometries.length > 1) {
      let eventIndex = 0;
      lodashEach(event.geometries, function (geometry) {
        eventIndex = eventIndex + 1;
        var date = geometry.date.split('T')[0];

        var $date = $('<a/>', {
          class: 'date',
          'data-id': event.id,
          'data-date': date,
          html: date,
          click: function (e) {
            e.stopPropagation();
            self.selectEvent(event.id, date);
          }
        });
        $dates.append($('<li class="dates"></li>').append($date));
      });
    }

    $item.append($eventIcon).append($title).append($subtitle).append($dates);
    var references = Array.isArray(event.sources) ? event.sources : [event.sources];
    if (references.length > 0) {
      var items = [];
      lodashEach(references, function (reference) {
        var source = lodashFind(model.data.sources, {
          id: reference.id
        });
        if (reference.url) {
          items.push('<a target="event" class="natural-event-link" href="' + reference.url + '">' +
            '<i class="fa fa-external-link fa-1"></i>' +
            source.title + '</a>');
        } else {
          items.push(source.title);
        }
      });
      $subtitle.append(items.join(' '));
    }
    $('.natural-event-link').click(function (e) {
      e.stopPropagation();
    });

    $item.on('click', function () {
      var isSelected = self.selected && self.selected.id && (self.selected.id === event.id);
      if (isSelected) {
        self.deselectEvent();
      } else {
        self.selectEvent(event.id);
      }
    });

    return $item;
  };

  var highlightEventInList = function (id, date) {
    // Undo previous highlights
    $('#wv-eventscontent .subtitle').hide();
    $('#wv-eventscontent .dates').hide();
    $('#wv-eventscontent li').removeClass('item-selected');
    $('#wv-eventscontent ul li.dates a').removeClass('active');
    if (!id) return;

    // Highlight current event
    $('#wv-eventscontent [data-id="' + id + '"]').addClass('item-selected');
    if (date) $('#wv-eventscontent [data-date="' + date + '"]').addClass('active');
    $('#wv-eventscontent [data-id="' + id + '"] .subtitle').show();
    $('#wv-eventscontent [data-id="' + id + '"] .dates').show();

    // Adjust tab layout to fit
    if (util.browser.small) ui.sidebar.collapseNow();
    ui.sidebar.sizeEventsTab();
  };

  var activateLayersForCategory = function (category) {
    category = category || 'Default';
    // remove current layers
    models.layers.reset();
    let currentProjection = models.proj.selected.id;
    // Turn on the relevant layers for the event type based on projection and category
    var layers = model.layers[currentProjection][category];
    if (!layers) layers = model.layers[currentProjection]['Default'];
    // Turn off all layers in list first
    lodashEach(models.layers.active, function (layer) {
      models.layers.setVisibility(layer.id, false);
    });
    // Turn on or add new layers
    lodashEach(layers, function (layer) {
      var id = layer[0];
      var visible = layer[1];
      if (models.layers.exists(id)) {
        models.layers.setVisibility(id, visible);
      } else {
        models.layers.add(id, {
          visible: visible
        });
      }
    });
  };

  var zoomToEvent = function (event, date, isSameEventID) {
    var category = event.categories[0].title;
    var zoom = (isSameEventID) ? ui.map.selected.getView().getZoom() : (zoomLevelReference[category]);
    var geometry = lodashFind(event.geometries, function (geom) {
      return geom.date.split('T')[0] === date;
    });

    // check for polygon geometries and/or perform projection coordinate transform
    var coordinates = (geometry.type === 'Polygon')
      ? olExtent.boundingExtent(olProj.transform(geometry.coordinates[0], 'EPSG:4326', models.proj.selected.crs))
      : olProj.transform(geometry.coordinates, 'EPSG:4326', models.proj.selected.crs);

    return ui.map.animate.fly(coordinates, zoom);
  };

  init();
  return self;
};

var eventVisibilityAlertBody = '<h3 class="wv-data-unavailable-header">Why can’t I see an event?</h3><p>There are a variety of factors as to why you may not be seeing an event in Worldview at the moment.</p>' +
'<ul>' +
'<li>Satellite overpass may have occurred before the event. Check out subsequent days or try a different satellite/sensor which has a different overpass time.</li>' +
'<li>Cloud cover may obscure the event.</li>' +
'<li>Some events don’t appear on the day that they are reported, you may have to wait a day or two for an event to become visible. Try and scroll through the days to see an event’s progression and/or change the satellite/sensor. NOTE: Wildfire events are currently set to automatically display the next day, as fire events often do not appear in the satellite imagery on the day they are reported.</li>' +
'<li>The resolution of the imagery may be too coarse to see an event.</li>' +
'<li>There are normal swath data gaps in some of the imagery layers due to way the satellite orbits the Earth, and an event may have occurred in the data gap.</li>' +
'</ul>' +
'<p>This is currently an experimental feature and we are working closely with the provider of these events, the <a href="https://eonet.sci.gsfc.nasa.gov/" target="_blank">Earth Observatory Natural Event Tracker</a>, to refine this listing to only show events that are visible with our satellite imagery.</p>';
