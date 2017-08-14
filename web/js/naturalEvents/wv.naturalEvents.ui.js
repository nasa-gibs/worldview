/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2017 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

var wv = wv || {};
wv.naturalEvents = wv.naturalEvents || {};

wv.naturalEvents.ui = wv.naturalEvents.ui || function(models, ui, config, request) {

  var self = {};
  var model = models.naturalEvents;
  var data;
  self.selector = "#wv-events";
  self.id = "wv-events";
  var maps = ui.map;
  var map = ui.map.selected;
  var naturalEventMarkers = wv.naturalEvents.markers(models, maps, config);

  //Local storage may not be a good idea because they'll never see it again
  //wv.util.localStorage('notified') || false;
  var notified = false;
  var lastIndex = -1;
  var lastDateIndex = -1;

  var $notification;

  var init = function() {
    request.events.on("queryResults", onQueryResults);
    ui.sidebar.events.on("select", function(tab) {
      if (tab === "events") {
        model.active = true;
        resize();
        if (naturalEventMarkers.activeMarker) {
          naturalEventMarkers.draw(naturalEventMarkers.activeMarker);
        }
      } else {
        model.active = false;
        naturalEventMarkers.remove();
        $notification.dialog('close');
      }
      model.events.trigger('change');
    });
    $(window)
      .resize(resize);
    render();

  };
  var onQueryResults = function() {
    //FIXME: this if check needs to be reworked
    if (model.data.sources) {
      data = model.data.events;
      self.refresh();
    }
  };
  var render = function() {
    var $panels = $(self.selector)
      .empty()
      .addClass(self.id + "list")
      .addClass("bank");

    var $list = $("<ul></ul>")
      .attr("id", self.id + "content")
      .addClass("content")
      .addClass("map-item-list");

    $panels.append($list);

    var $detailContainer = $("<div></div>")
      .attr("id", "wv-events-detail")
      .hide();

    $panels.append($detailContainer);

    //******************************************
    //TODO: This should be moved to wv.ui.notify
    var $message = $('<span></span>')
      .addClass('notify-message');

    var $icon = $('<i></i>')
      .addClass('fa fa-warning fa-1x');

    var $messageWrapper = $('<div></div>')
      .click(function(e) {
        showNotificationHelp();
      });

    $messageWrapper
      .append($icon)
      .append($message);

    var $close = $('<i></i>')
      .addClass('fa fa-times fa-1x')
      .click(function(e) {
        $notification.dialog('close');
      });

    $notification = $('<div></div>')
      .append($close)
      .append($messageWrapper)
      .dialog({
        autoOpen: false,
        resizable: false,
        height: 40,
        width: 420,
        draggable: false,
        show: {
          effect: "fade",
          duration: 400
        },
        hide: {
          effect: "fade",
          duration: 200
        },
        dialogClass: 'no-titlebar notify-alert',
        close: function(event, ui) {
          //wv.util.localStorage( 'notified', !notified );
          notified = true;
        }
      });
    //**************************************

  };
  var showNotificationHelp = function() {
    var headerMsg = "<h3 class='wv-data-unavailable-header'>Why can’t I see an event?</h3>";
    var bodyMsg = 'There are a variety of factors as to why you may not be seeing an event in Worldview at the moment.' +
      '<ul>' +
      '<li>Satellite overpass may have occurred before the event. Check out subsequent days or try a different satellite/sensor which has a different overpass time.</li>' +
      '<li>Cloud cover may obscure the event.</li>' +
      '<li>Some events don’t appear on the day that they are reported, you may have to wait a day or two for an event to become visible. Try and scroll through the days to see an event’s progression and/or change the satellite/sensor. NOTE: Wildfire events are currently set to automatically display the next day, as fire events often do not appear in the satellite imagery on the day they are reported.</li>' +
      '<li>The resolution of the imagery may be too coarse to see an event.</li>' +
      '<li>There are normal swath data gaps in some of the imagery layers due to way the satellite orbits the Earth, and an event may have occurred in the data gap.</li>' +
      '</ul>' +
      'This is currently an experimental feature and we are working closely with the provider of these events, the <a href="http://eonet.sci.gsfc.nasa.gov/" target="_blank">Earth Observatory Natural Event Tracker</a>, to refine this listing to only show events that are visible with our satellite imagery.';

    wv.ui.notify(headerMsg + bodyMsg, "Notice", 800);
  };

  self.refresh = function() {
    var $content = $(self.selector + "content");

    $content = $(self.selector + "content")
      .empty();
    // iterate through events
    _.each(data, function(event, index) {
      refreshEvent($content, event, index);
    });

    // Bind click event to each event
    var $current;
    $(self.selector + "content li")
      .toggle(function() {
        if ($current) {
          $current.click();
        }
        var dataIndex = $(this)
          .attr("data-index");
        if ($(this)
          .find("ul li.dates a")
          .first()
          .hasClass("date-today")) {
          var nextID = $(self.selector + "content ul li.dates")
            .next()
            .children("a")
            .attr("data-date-index");
          showEvent(dataIndex, nextID);
        } else {
          showEvent(dataIndex);
        }
        $(self.selector + "content li")
          .removeClass('item-selected');
        $(self.selector + "content ul li.dates a")
          .removeClass('active');
        $(this)
          .addClass('item-selected');
        if (wv.util.browser.small) {
          ui.sidebar.collapseNow();
        }
        notify();
        $current = $(this);
      }, function() {
        $(self.selector + "content li")
          .removeClass('item-selected');
        $(self.selector + "content ul li.dates a")
          .removeClass('active');
        hideEvent();
        naturalEventMarkers.remove();
        naturalEventMarkers.activeMarker = null;
        $current = null;
      });

    $(self.selector + "content li")
      .click(function() {
        $(this)
          .find("ul li.dates a.date")
          .first()
          .addClass('active');
      });

    //Bind click event to each date contained in events with dates
    $(self.selector + "content ul li.dates a")
      .click(function(event) {
        event.stopPropagation();
        var dataIndex = $(this)
          .attr("data-index");
        showEvent(dataIndex, $(this)
          .attr("data-date-index"));
        $(self.selector + "content ul li.dates a")
          .not(this)
          .removeClass('active');
        $(this)
          .addClass('active');
      });

    resize();
  };

  self.select = function(index, dateIndex) {
    var event, method, zoomLevel;
    var hasSameIndex = index === lastIndex;
    var hasSameDate = lastDateIndex === dateIndex;
    if (hasSameIndex && hasSameDate) return;
    var method = (hasSameIndex && !hasSameDate)?'pan':'fly';

    lastIndex = index;
    lastDateIndex = lastDateIndex;

    if (models.proj.selected.id !== 'geographic') {
      models.proj.select('geographic');
    }
    self.selected = index;
    event = model.data.events[index];

    eventItem = null;
    if (event.geometries.length > 1) {
      eventItem = event.geometries[dateIndex] || event.geometries[0];
    } else {
      eventItem = event.geometries[0];
    }

    category = "Default";
    categories = event.categories;
    if (!Array.isArray(categories)) categories = [categories];

    _.each(categories, function(c) {
      if (model.layers[c.title]) {
        category = c.title;
        return;
      }
    });

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

    // If an event is a Wildfire and the event date isn't "today", select
    // the following day to greatly improve the chance of the satellite
    // seeing the event
    //
    // NOTE: there is a risk that if the fire happened "yesterday" and
    // the satellite imagery is not yet available for "today", this
    // functionality may do more harm than good
    eventDate = wv.util.parseTimestampUTC(eventItem.date);

    var eventISO = wv.util.toISOStringDate(eventDate);
    var todayISO = wv.util.toISOStringDate(wv.util.today());
    var isToday = eventISO === todayISO;
    var eventCategory = event.categories[0].title || null;
    var isWildfire = eventCategory === 'Wildfires';
    var isVolcano = eventCategory === 'Volcanoes';

    if (isWildfire && !isToday) {
      var eventDatePlusOne =
        wv.util.dateAdd(wv.util.parseDateUTC(eventItem.date), "day", 1);
      models.date.select(eventDatePlusOne);
    } else {
      models.date.select(eventDate);
    }

    // If an event is a Wildfire or Volcano, zoom in more
    zoomLevel = isWildfire?8:isVolcano?6:zoomLevel;

    var callback = function() {
      naturalEventMarkers.draw(eventItem.coordinates);
    };
    if (eventItem.type === "Point") {
      ui.map.animate.move(method, eventItem.coordinates, zoomLevel, callback);
    } else if (eventItem.type === "Polygon" && eventItem.coordinates[0].length == 5) {
      c = eventItem.coordinates[0];
      var extent = [c[0][0], c[0][1], c[2][0], c[2][1]];
      ui.map.animate.move(method, extent, zoomLevel, callback);
    }
  };

  var refreshEvent = function($content, event, index) {
    var eventCategoryID = event.categories[0].id || null;
    // Sort by latest dates first
    var geoms = toArray(event.geometries)
      .reverse();

    eventDate = wv.util.parseDateUTC(geoms[0].date);

    dateString = wv.util.giveWeekDay(eventDate) + ", " +
      wv.util.giveMonth(eventDate) + " " +
      eventDate.getUTCDate();

    if (eventDate.getUTCFullYear() !== wv.util.today()
      .getUTCFullYear()) {
      dateString += ", " + eventDate.getUTCFullYear();
    }

    var $item = $("<li></li>")
      .addClass("selectorItem")
      .addClass("item")
      .addClass(event.categories[0].css)
      .attr("data-index", index);
    var $title = $("<h4></h4>")
      .addClass("title")
      .html(event.title + "<br/>" + dateString);
    var $subtitle = $("<p></p>")
      .addClass("subtitle")
      .html(event.description)
      .hide();
    var $mapMarker = $("<i></i>")
      .addClass('map-marker')
      .attr('title', event.categories[0].title);

    var $dates = $("<ul></ul>")
      .addClass("dates")
      .hide();

    if (event.geometries.length > 1) {
      var lastDate;
      var eventIndex = 0;
      _.each(event.geometries, function(geometry, dateIndex) {
        eventIndex++;
        date = geometry.date.split(/T/)[0];
        var todayDateISOString = wv.util.toISOStringDate(wv.util.today());

        if (date === lastDate) {
          return;
        }

        $date = $("<a></a>")
          .addClass("date")
          .attr("data-date-index", dateIndex)
          .attr("data-index", index)
          .html(date);

        // Check first multi-day event
        if (eventIndex == 1) {
          // If it's date is today and it is a Severe Storm, mark it
          // and don't make it active.
          if ((date === todayDateISOString) && (eventCategoryID == 10)) {
            $date.removeClass("date")
              .addClass("date-today");
          } else {
            $date.addClass("active");
          }
        }
        $dates.append($("<li class='dates'></li>")
          .append($date));
        lastDate = date;
      });
    }

    $item.append($mapMarker)
      .append($title)
      .append($subtitle)
      .append($dates);
    var references = toArray(event.sources);
    if (references.length > 0) {
      items = [];
      _.each(references, function(reference) {
        var source = _.find(model.data.sources, {
          id: reference.id
        });
        if (reference.url) {
          items.push("<a target='event' class='natural-event-link' href='" + reference.url + "'>" +
            "<i class='fa fa-external-link fa-1'></i>" +
            source.title + "</a>");
        } else {
          items.push(source.title);
        }
      });
      $subtitle.append(items.join(" "));
    }

    $content.append($item);
    $('.natural-event-link')
      .click(function(e) {
        e.stopPropagation();
      });
  };

  var eventList = function(events) {
    _.each(events, function(event) {
      $("#wv-events")
        .append(createEvent(event));
    });
  };

  var showEvent = function(index, dateIndex) {

    self.select(index, dateIndex);
    $("#wv-eventscontent .subtitle")
      .hide();
    $("#wv-eventscontent .dates")
      .hide();
    $("#wv-eventscontent [data-index='" + index + "'] .subtitle")
      .show();
    $("#wv-eventscontent [data-index='" + index + "'] .dates")
      .show();
    resize();

  };
  var hideEvent = function() {
    $("#wv-eventscontent .subtitle")
      .hide();
    $("#wv-eventscontent .dates")
      .hide();
    resize();
  };
  var notify = function(text) {

    var message = text || 'Events may not be visible at all times.  Read more...';

    var $message = $('.notify-message');

    $message.empty();
    $message.append(message);

    $notification.find('i:first-child')
      .attr('title', message);

    if (!notified) {
      $notification.dialog('open');
    }
  };

  //TODO: Move to wv.ui.sidebar
  var productsIsOverflow = false;
  var sizeEventsTab = function() {
    var winSize = $(window)
      .outerHeight(true);
    var headSize = $("ul#productsHolder-tabs")
      .outerHeight(true); //
    //var footSize = $("section#productsHolder footer").outerHeight(true);
    var head2Size = $('#wv-events-facets')
      .outerHeight(true);
    var secSize = $("#productsHolder")
      .innerHeight() - $("#productsHolder")
        .height();
    var offset = $("#productsHolder")
      .offset();
    var timeSize = $("#timeline")
      .outerHeight(true); // + $("#timeline").offset()['top'];

    //FIXME: -10 here is the timeline's bottom position from page, fix
    // after timeline markup is corrected to be loaded first
    var maxHeight = winSize - headSize - head2Size -
      offset.top - secSize;
    if (!wv.util.browser.small) {
      maxHeight = maxHeight - timeSize - 10 - 5;
    }
    $(self.selector)
      .css("max-height", maxHeight);

    var childrenHeight =
      $('#wv-eventscontent')
        .outerHeight(true);

    if ((maxHeight <= childrenHeight)) {
      $("#wv-events")
        .css('height', maxHeight)
        .css('padding-right', '10px');
      if (productsIsOverflow) {
        $(self.selector)
          .perfectScrollbar('update');
      } else {
        $(self.selector)
          .perfectScrollbar();
        productsIsOverflow = true;
      }
    } else {
      $("#wv-events")
        .css('height', '')
        .css('padding-right', '');
      if (productsIsOverflow) {
        $(self.selector)
          .perfectScrollbar('destroy');
        productsIsOverflow = false;
      }
    }
  };

  var resize = function() {
    //resizePane($(self.selector + "content"));
    sizeEventsTab();
  };

  var toArray = function(value) {
    if (!value) {
      return [];
    }
    if (value.constructor !== Array) {
      value = [value];
    }
    return value;
  };

  init();
  return self;

};
