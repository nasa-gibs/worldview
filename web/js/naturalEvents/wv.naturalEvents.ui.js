
/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2014 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

var wv = wv || {};
wv.naturalEvents = wv.naturalEvents || {};

wv.naturalEvents.ui = wv.naturalEvents.ui || function(models, ui, config) {

    var self = {};
    var model = models.naturalEvents;
    var data;
    self.selector = "#wv-events";
    self.id = "wv-events";

    //Local storage may not be a good idea because they'll never see it again
    //wv.util.localStorage('notified') || false;
    var notified = false;
    var $notification;

    var init = function() {
        //model.events.on("select", onSelect);
        model.events.on( "queryResults", onQueryResults );
        ui.sidebar.events.on("select", function(tab) {
            if ( tab === "events" ) {
                resize();
            }
            else {

            }
        });

        render();

    };
    var onQueryResults = function(){
        //FIXME: this if check needs to be reworked
        if ( model.data && model.sources && model.types ) {
            data = model.data;
            self.refresh();
        }
    };
    var render = function() {
        var $panels = $(self.selector).empty()
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
            .click( function(e){
                showNotificationHelp();
                //showLargeNotification();
            });

        var $altMessage = $('<span></span>')
            .text("Why can’t I see an event?")
            .addClass('notify-message-alt').hide();

        var $longmessage = 'There are a variety of factors as to why you may not be seeing an event in Worldview at the moment.' +
            '<ul>' +
            '<li>Satellite overpass may have occurred before the event. Check out subsequent days or try a different satellite/sensor which has a different overpass time.</li>' +
            '<li>Cloud cover may obscure the event.</li>' +
            '<li>Some events don’t appear on the day that they are reported, you may have to wait a day or two for an event to become visible. Try and scroll through the days to see an event’s progression and/or change the satellite/sensor. NOTE: Wildfire events are currently set to automatically display the next day, as fire events often do not appear in the satellite imagery on the day they are reported.</li>' +
            '<li>The resolution of the imagery may be too coarse to see an event.</li>' +
            '<li>There are normal swath data gaps in some of the imagery layers due to way the satellite orbits the Earth, and an event may have occurred in the data gap.</li>' +
            '</ul>' +
            'This is currently an experimental feature and we are working closely with the provider of these events, the <a href="http://eonet.sci.gsfc.nasa.gov/" target="_blank">Earth Observatory Natural Event Tracker</a>, to refine this listing to only show events that are visible with our satellite imagery.';

        var $longWrapper = $('<div></div>')
            .addClass('notify-message-body')
            .hide();

        $messageWrapper
            .append($icon)
            .append($message)
            .append($altMessage);

        var $close = $('<i></i>')
            .addClass('fa fa-times fa-1x')
            .click(function(e){
                $notification.dialog( 'close' );
            });

        $notification = $('<div></div>')
            .append( $close )
            .append( $messageWrapper )
            .append( $longWrapper )
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
                close: function( event, ui ) {
                    //wv.util.localStorage( 'notified', !notified );
                    notified = true;
                }
            });
        //**************************************

        $(window).resize(resize);

        self.refresh();
    };
    var showLargeNotification = function(){
        $('.notify-message').hide();
        $('.notify-message-alt').show();

        $('.notify-message-long').show();
    };
    var showNotificationHelp = function(){
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

        $content = $(self.selector + "content").empty();
        _.each(data, function(event, index) {
            refreshEvent($content, event, index);
        });
        $(self.selector + "content li").click(function() {
            showEvent($(this).attr("data-index"));
            $(self.selector + "content li").removeClass('item-selected');
            $(this).addClass('item-selected');
            if (wv.util.browser.small){
                ui.sidebar.collapseNow();
            }
            notify();
        });
        $(self.selector + "content a.date").click(function(event) {
            showEvent($(this).attr("data-index"), $(this).attr("data-date-index"));
            event.stopPropagation();
        });
        resize();
    };

    var refreshEvent = function($content, event, index) {
        if ((event.category[0]['-domain'] === 'Floods') ||
            (event.category[0]['-domain'] === 'Earthquakes') ||
            (event.category[0]['-domain'] === 'Drought') ||
            (event.category[0]['-domain'] === 'Landslides')){
            return;
        }
        var geoms = toArray(event.geometry);
        eventDate = wv.util.parseDateUTC(geoms[0].date);

        dateString = wv.util.giveWeekDay(eventDate) + ", " +
            wv.util.giveMonth(eventDate) + " " +
            eventDate.getUTCDate();

        if (eventDate.getUTCFullYear() !== wv.util.today().getUTCFullYear())  {
            dateString += ", " + eventDate.getUTCFullYear();
        }


        var $item = $("<li></li>")
            .addClass("selectorItem")
            .addClass("item")
            .attr("data-index", index);
        var $title = $("<h4></h4>")
            .addClass("title")
            .html(event.title + "<br/>" + dateString);
        var $subtitle = $("<p></p>")
            .addClass("subtitle")
            .html(event.description)
            .hide();
        var $mapMarker = $("<i></i>")
            .addClass('fa fa-map-marker fa-2x');

        var $dates = $("<ul></ul>").addClass("dates").hide();
        if ( event.geometry.length > 1 ) {
            var lastDate;
            _.each(event.geometry, function(geometry, dateIndex) {
                date = geometry.date.split(/T/)[0];
                if (date === lastDate){
                    return;
                }
                $date = $("<a></a>")
                    .addClass("date")
                    .attr("data-date-index", dateIndex)
                    .attr("data-index", index)
                    .html(date);
                $dates.append($("<li class='dates'></li>").append($date));
                lastDate = date;
            });
        }

        $item.append($mapMarker).append($title).append($subtitle).append($dates);
        var references = toArray(event.reference);
        if ( references.length > 0 ) {
            items = [];
            _.each(references, function(reference) {
                var source = _.find(model.sources, { id: reference.id });
                if ( reference.url ) {
                    items.push("<a target='event' href='" + reference.url + "'>" +
                               "<i class='fa fa-external-link fa-1'></i>" +
                        source.title + "</a>");
                } else {
                    items.push(source.title);
                }
            });
            $subtitle.append(items.join(" "));
        }

        $content.append($item);
    };

    var eventList = function(events) {
        _.each(events, function(event) {
            $("#wv-events").append(createEvent(event));
        });
    };

    var showEvent = function(index, dateIndex) {

        $("#wv-eventscontent .subtitle").hide();
        $("#wv-eventscontent .dates").hide();
        $("#wv-eventscontent [data-index='" + index + "'] .subtitle").show();
        $("#wv-eventscontent [data-index='" + index + "'] .dates").show();
        resize();

        model.select(index, dateIndex);

    };
    var notify = function( text ) {

        var message = text || 'Events may not be visible at all times.  Read more...';

        var $message = $('.notify-message');

        $message.empty();
        $message.append( message );

        $notification.find('i:first-child')
            .attr('title', message);

        if ( !notified ){
            $notification.dialog( 'open' );
        }
    };

    //TODO: Move to wv.ui.sidebar
    var productsIsOverflow = false;
    var sizeEventsTab = function(){
        var winSize = $(window).outerHeight(true);
        var headSize = $("ul#productsHolder-tabs").outerHeight(true);//
        //var footSize = $("section#productsHolder footer").outerHeight(true);
        var head2Size = $('#wv-events-facets').outerHeight(true);
        var secSize = $("#productsHolder").innerHeight() - $("#productsHolder").height();
        var offset = $("#productsHolder").offset();
        var timeSize = $("#timeline").outerHeight(true); // + $("#timeline").offset()['top'];

        //FIXME: -10 here is the timeline's bottom position from page, fix
        // after timeline markup is corrected to be loaded first
        var maxHeight = winSize - headSize - head2Size -
            offset.top - secSize;
        if ( !wv.util.browser.small ){
            maxHeight = maxHeight - timeSize - 10 - 5;
        }
        $(self.selector).css("max-height", maxHeight);

        var childrenHeight =
            $('#wv-eventscontent').outerHeight(true);

        if((maxHeight <= childrenHeight)) {
            $("#wv-events").css('height', maxHeight)
                .css('padding-right', '10px');
            if(productsIsOverflow){
                $(self.selector).perfectScrollbar('update');
            }
            else{
                $(self.selector).perfectScrollbar();
                productsIsOverflow = true;
            }
        }
        else{
            $("#wv-events").css('height', '')
                .css('padding-right', '');
            if(productsIsOverflow){
                $(self.selector).perfectScrollbar('destroy');
                productsIsOverflow = false;
            }
        }
    };

    var resize = function() {
        //resizePane($(self.selector + "content"));
        sizeEventsTab();
    };

    var toArray = function(value) {
        if ( !value ) {
            return [];
        }
        if ( value.constructor !== Array ) {
            value = [value];
        }
        return value;
    };

    init();
    return self;

};
