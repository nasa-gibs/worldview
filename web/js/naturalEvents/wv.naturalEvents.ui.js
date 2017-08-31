var wv = wv || {};
wv.naturalEvents = wv.naturalEvents || {};

wv.naturalEvents.ui = wv.naturalEvents.ui || function(models, ui, config, request) {

  var self = {}, eventAlert;
  var model = models.naturalEvents;
  self.markers = [];
  self.selected = {};
  var naturalEventMarkers = wv.naturalEvents.markers(models, ui, config);

  var init = function() {

    request.events.on('queryResults', function() {
      if (!(model.data.events || model.data.sources)) return;

      createEventList();
      addClickListeners();

      // Reselect previously selected event
      if (self.selected.id) {
        self.selectEvent(self.selected.id, self.selected.date||null);
      }

      ui.sidebar.sizeEventsTab();
      $(window).resize(ui.sidebar.sizeEventsTab);
    });

    ui.sidebar.events.on('selectTab', function(tab) {
      if (tab === 'events') {
        model.active = true;

        // Set the correct map projection
        if (models.proj.selected.id !== 'geographic') {
          models.proj.select('geographic');
        }

        // Show message about events not being visible
        eventAlert = wv.ui.alert(eventAlertBody, 'Events may not be visible at all times', 800, 'warning');

        // Draw active markers
        if (self.selected.id) {
          var event = getEventById(self.selected.id);
          drawMarkers(event, self.selected.date || getDefaultEventDate(event));
        } else {
          drawMarkers(model.data.events);
        }

        ui.sidebar.sizeEventsTab();
      } else {
        model.active = false;
        naturalEventMarkers.remove(self.markers);
        eventAlert.dialog('close');
      }
      model.events.trigger('change');
    });
  };

  self.selectEvent = function(id, date) {

    // Store selected id and date in model
    self.selected = {id: id};
    if (date) self.selected.date = date;

    var event = getEventById(id);
    if (!event) {
      wv.ui.notify('Metadata for event ' + id + ' is not available.');
      return;
    }

    date = date || getDefaultEventDate(event);

    highlightEventInList(id, date);
    drawMarkers(event, date);
    zoomToEvent(event, date).then(function(){
      activateLayersForCategory(event.categories[0].title);
      models.date.select(wv.util.parseDateUTC(date));
      /* For Wildfires that didn't happen today, move the timeline forward a day
       * to improve the chance that the fire is visible.
       * NOTE: If the fire happened yesterday and the imagery isn't yet available
       * for today, this may not help.
       */
      if (event.categories[0].title === 'Wildfires') {
        var now = new Date();
        var today = now.toISOString().split('T')[0];
        var yesterday = new Date(now.setDate(now.getDate()-1)).toISOString().split('T')[0];
        if (date !== today || date !== yesterday) {
          models.date.select(wv.util.dateAdd(wv.util.parseDateUTC(date), 'day', 1));
        }
      }
    });

  };

  var getEventById = function(id) {
    return _.find(model.data.events, function(e){
      return e.id === id;
    });
  };

  var getDefaultEventDate = function(event) {
    date = new Date(event.geometries[0].date).toISOString().split('T')[0];
    if (event.geometries.length < 2) return date;
    var category = event.categories.title || event.categories[0].title;
    var today = new Date().toISOString().split('T')[0];
    // For storms that happened today, get previous date
    if (date === today && category === 'Severe Storms') {
      date = new Date(event.geometries[1].date).toISOString().split('T')[0];
    }
    return date;
  };

  var createEventList = function() {
    var $panels = $('#wv-events').empty().addClass('wv-eventslist').addClass('bank');
    var $list = $('<ul></ul>').attr('id', 'wv-eventscontent').addClass('content').addClass('map-item-list');
    var $detailContainer = $('<div></div>').attr('id', 'wv-events-detail').hide();
    $panels.append($list);
    $panels.append($detailContainer);
    var $content = $('#wv-eventscontent').empty();
    _.each(model.data.events, function(event) {
      createEventElement($content, event);
    });
  };

  var createEventElement = function($content, event) {
    var eventCategoryID = event.categories[0].id || null;
    eventDate = wv.util.parseDateUTC(event.geometries[0].date);
    dateString = wv.util.giveWeekDay(eventDate) + ', ' +
      wv.util.giveMonth(eventDate) + ' ' +
      eventDate.getUTCDate();

    if (eventDate.getUTCFullYear() !== wv.util.today().getUTCFullYear()) {
      dateString += ', ' + eventDate.getUTCFullYear();
    }

    var $item = $('<li></li>').addClass('selectorItem').addClass('item').addClass(event.categories[0].slug).attr('data-id', event.id);
    var $title = $('<h4></h4>').addClass('title').html(event.title + '<br/>' + dateString);
    var $subtitle = $('<p></p>').addClass('subtitle').html(event.description).hide();
    var $mapMarker = $('<i></i>').addClass('map-marker').attr('title', event.categories[0].title);

    var $dates = $('<ul></ul>').addClass('dates').hide();

    if (event.geometries.length > 1) {
      var eventIndex = 0;
      _.each(event.geometries, function(geometry) {
        eventIndex++;
        date = geometry.date.split('T')[0];
        var todayDateISOString = wv.util.toISOStringDate(wv.util.today());

        $date = $('<a></a>').addClass('date').attr('data-date', date).attr('data-id', event.id).html(date);

        $dates.append($('<li class="dates"></li>').append($date));
      });
    }

    $item.append($mapMarker).append($title).append($subtitle).append($dates);
    var references = Array.isArray(event.sources)?event.sources:[event.sources];
    if (references.length > 0) {
      items = [];
      _.each(references, function(reference) {
        var source = _.find(model.data.sources, {
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

    $content.append($item);
    $('.natural-event-link').click(function(e) {
      e.stopPropagation();
    });
  };

  var addClickListeners = function() {
    $('#wv-eventscontent li').click(function() {
      var dataId = $(this).attr('data-id');
      self.selectEvent(dataId);
    });
    $('#wv-eventscontent ul li.dates a').click(function(e) {
      e.stopPropagation();
      var id = $(this).attr('data-id');
      var date = $(this).attr('data-date');
      self.selectEvent(id, date);
    });
  };

  var highlightEventInList = function(id, date) {
    // Undo previous highlights
    $('#wv-eventscontent .subtitle').hide();
    $('#wv-eventscontent .dates').hide();
    $('#wv-eventscontent li').removeClass('item-selected');
    $('#wv-eventscontent ul li.dates a').removeClass('active');

    // Highlight current event
    $('#wv-eventscontent [data-id="' + id + '"]').addClass('item-selected');
    if (date) {
      $('#wv-eventscontent [data-date="' + date + '"]').addClass('active');
    }
    $('#wv-eventscontent [data-id="' + id + '"] .subtitle').show();
    $('#wv-eventscontent [data-id="' + id + '"] .dates').show();

    // Adjust tab layout to fit
    if (wv.util.browser.small) ui.sidebar.collapseNow();
    ui.sidebar.sizeEventsTab();
  };

  var drawMarkers = function(events, date){
    if (!events) return;
    events = Array.isArray(events)?events:[events];
    // Remove old markers
    naturalEventMarkers.remove(self.markers);

    // Draw markers for all events in the model
    self.markers = naturalEventMarkers.draw(events, date);
    if (self.markers && Array.isArray(self.markers)) {
      self.markers.forEach(function(marker){
        marker.pin.element_.onclick = function(){
          self.selectEvent(marker.pin.id_);
        };
      });
    }
  };

  var activateLayersForCategory = function(category){

    category = category || 'Default';

    // Turn on the relevant layers for the event type
    layers = model.layers[category];
    if (!layers) layers = model.layers.Default;
    // Turn off all layers in list first
    _.each(models.layers.active, function(layer) {
      models.layers.setVisibility(layer.id, false);
    });
    // Turn on or add new layers
    _.each(layers, function(layer) {
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

  var zoomToEvent = function(event, date) {
    var category = event.categories[0].title;
    var geometry = _.find(event.geometries, function(geom){
      return geom.date.split('T')[0] === date;
    });
    var coordinates = (geometry.type === 'Polygon') ? ol.extent.boundingExtent(geometry.coordinates[0]) : geometry.coordinates;

    return ui.map.animate.fly(coordinates, ({
      'Wildfires': 8,
      'Volcanoes': 6
    })[category]);
  };

  init();
  return self;
};

var eventAlertBody = '<h3 class="wv-data-unavailable-header">Why can’t I see an event?</h3><p>There are a variety of factors as to why you may not be seeing an event in Worldview at the moment.</p>' +
'<ul>' +
'<li>Satellite overpass may have occurred before the event. Check out subsequent days or try a different satellite/sensor which has a different overpass time.</li>' +
'<li>Cloud cover may obscure the event.</li>' +
'<li>Some events don’t appear on the day that they are reported, you may have to wait a day or two for an event to become visible. Try and scroll through the days to see an event’s progression and/or change the satellite/sensor. NOTE: Wildfire events are currently set to automatically display the next day, as fire events often do not appear in the satellite imagery on the day they are reported.</li>' +
'<li>The resolution of the imagery may be too coarse to see an event.</li>' +
'<li>There are normal swath data gaps in some of the imagery layers due to way the satellite orbits the Earth, and an event may have occurred in the data gap.</li>' +
'</ul>' +
'<p>This is currently an experimental feature and we are working closely with the provider of these events, the <a href="http://eonet.sci.gsfc.nasa.gov/" target="_blank">Earth Observatory Natural Event Tracker</a>, to refine this listing to only show events that are visible with our satellite imagery.</p>';
