
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

wv.events = wv.events || function(models, ui) {

    var dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ];
    var monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];

    var layerLists = {
        Wildfires: [
            ["MODIS_Terra_CorrectedReflectance_TrueColor", true],
            ["MODIS_Aqua_CorrectedReflectance_TrueColor", false],
            ["VIIRS_SNPP_CorrectedReflectance_TrueColor", false],
            ["MODIS_Fires_Terra", true],
            ["MODIS_Fires_Aqua", false],
            ["VIIRS_SNPP_Fires_375m_Day", false],
            ["VIIRS_SNPP_Fires_375m_Night", false]
        ],
        "Temperature Extremes": [
            ["MODIS_Aqua_CorrectedReflectance_TrueColor", false],
            ["MODIS_Terra_CorrectedReflectance_TrueColor", true],
            ["VIIRS_SNPP_CorrectedReflectance_TrueColor", false],
            ["MODIS_Aqua_Land_Surface_Temp_Day", false],
            ["MODIS_Terra_Land_Surface_Temp_Day", true]
        ],
        Floods: [
            ["MODIS_Aqua_SurfaceReflectance_Bands121", false],
            ["MODIS_Terra_SurfaceReflectance_Bands121", true]
        ],
        Volcanoes: [
            ["MODIS_Terra_CorrectedReflectance_TrueColor", true],
            ["MODIS_Aqua_CorrectedReflectance_TrueColor", false],
            ["VIIRS_SNPP_CorrectedReflectance_TrueColor", false],
            ["MODIS_Fires_Terra", true],
            ["MODIS_Fires_Aqua", false],
            ["VIIRS_SNPP_Fires_375m_Day", false],
            ["VIIRS_SNPP_Fires_375m_Night", false]
        ],
        Default: [
            ["MODIS_Terra_CorrectedReflectance_TrueColor", true],
            ["MODIS_Aqua_CorrectedReflectance_TrueColor", false],
            ["VIIRS_SNPP_CorrectedReflectance_TrueColor", false]
        ]
    };

    var self = {};
    self.selector = "#wv-events";
    self.id = "wv-events";
    self.data = {};
    var lastIndex = -1;
    var lastDateIndex = -1;
    //Local storage may not be a good idea because they'll never see it again
    var notified = false;//wv.util.localStorage('notified') || false;
    var $notification;

    var init = function() {
        self.query();

        ui.sidebar.events.on("select", function(tab) {
            if ( tab === "events" ) {
                resize();
            }
        });
    };

    self.render = function() {
        var $panels = $(self.selector).empty()
            .addClass(self.id + "list")
            .addClass("bank");

        var $list = $("<ul></ul>")
            .attr("id", self.id + "content")
            .addClass("content")
            .addClass("bank")
            .addClass("map-item-list");

        $panels.append($list);

        var $detailContainer = $("<div></div>")
            .attr("id", "wv-events-detail")
            .hide();

        $panels.append($detailContainer);

        var $message = $('<span></span>')
            .addClass('notify-message');

        var $icon = $('<i></i>')
            .addClass('fa fa-warning fa-1x');

        var $close = $('<i></i>')
            .addClass('fa fa-times-circle-o fa-1x')
            .click(function(e){
                $notification.dialog( 'close' );
            });

        $notification = $('<div></div>')
            .append( $icon)
            .append( $message )
            .append( $close )
            .dialog({
                autoOpen: false,
                resizable: false,
                height: 40,
                width: 370,
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

        $(window).resize(resize);

        self.refresh();
    };

    self.refresh = function() {
        var $content = $(self.selector + "content");

        $content = $(self.selector + "content").empty();
        _.each(self.data, function(event, index) {
            refreshEvent($content, event, index);
        });
        $(self.selector + "content li").click(function() {
            showEvent($(this).attr("data-index"));
            $(self.selector + "content li").removeClass('item-selected');
            $(this).addClass('item-selected');
            notify();
        });
        $(self.selector + "content a.date").click(function(event) {
            showEvent($(this).attr("data-index"), $(this).attr("data-date-index"));
            event.stopPropagation();
        });
        resize();
    };

    var refreshEvent = function($content, event, index) {

        var geoms = toArray(event.geometry);
        eventDate = wv.util.parseDateUTC(geoms[0].date);
        dateString = dayNames[eventDate.getUTCDay()] + ", " +
                monthNames[eventDate.getUTCMonth()] + " " +
                eventDate.getUTCDate();
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
            _.each(event.geometry, function(geometry, dateIndex) {
                date = geometry.date.split(/T/)[0];
                $date = $("<a></a>")
                    .addClass("date")
                    .attr("data-date-index", dateIndex)
                    .attr("data-index", index)
                    .html("&bull; " + date);
                $dates.append($("<li class='dates'></li>").append($date));
            });
        }

        $item.append($mapMarker).append($title).append($subtitle).append($dates);
        var references = toArray(event.reference);
        if ( references.length > 0 ) {
            items = [];
            _.each(references, function(reference) {
                var source = _.find(self.sources, { id: reference.id });
                if ( reference.url ) {
                    items.push("<a target='event' href='" + reference.url + "'>" +
                        source.title + "</a>");
                } else {
                    items.push(source.title);
                }
            });
            $subtitle.append("<br/>" + items.join(", "));
        }

        $content.append($item);
    };

    var eventList = function(events) {
        _.each(events, function(event) {
            $("#wv-events").append(createEvent(event));
        });
    };

    var showEvent = function(index, dateIndex) {
        if ( index === lastIndex && lastDateIndex === dateIndex ) {
            return;
        }

        var method = "fly";
        if ( index == lastIndex && dateIndex != lastDateIndex ) {
            method = "pan";
        }
        lastIndex = index;
        lastDateIndex = lastDateIndex;

        $("#wv-eventscontent .subtitle").hide();
        $("#wv-eventscontent .dates").hide();
        $("#wv-eventscontent [data-index='" + index + "'] .subtitle").show();
        $("#wv-eventscontent [data-index='" + index + "'] .dates").show();
        resize();

        event = self.data[index];
        console.log("event", event);
        eventItem = null;
        if ( event.geometry.length > 1 ) {
            eventItem = event.geometry[dateIndex || 0];
        } else {
            eventItem = event.geometry[0];
        }
        eventDate = wv.util.parseTimestampUTC(eventItem.date);
        models.date.select(eventDate);

        category = "Default";
        categories = event.category;
        if ( categories.constructor !== Array ) {
            categories = [categories];
        }
        _.each(categories, function(c) {
            if ( layerLists[c["#text"]] ) {
                category = c["#text"];
                return;
            }
        });

        layers = layerLists[category];
        if ( !layers ) {
            layers = layerLists.Default;
        }

        // Turn off all layers in list first
        _.each(models.layers.active, function(layer){
            models.layers.setVisibility( layer.id, false );
        });

        // Turn on or add new layers
        _.each(layers, function(layer) {
            var id = layer[0];
            var visible = layer[1];
            if( models.layers.exists( id ) ) {
                models.layers.setVisibility( id, visible );
            }
            else{
                models.layers.add(id, { visible: visible });
            }
        });

        console.log("COORDS", eventItem.coordinates);
        if ( eventItem.type === "Point" ) {
            goTo(method, eventItem.coordinates);
        } else if ( eventItem.type === "Polygon" && eventItem.coordinates.length == 5 ) {
            c = eventItem.coordinates;
            var extent = [c[0][0], c[0][1], c[2][0], c[2][1]];
            console.log("extent", extent);
            goTo(method, extent);
        }
    };
    var notify = function( text ) {

        var message = text || 'Events may not be visible ' +
            'until the next day.';

        var $message = $('.notify-message');

        $message.empty();
        $message.append( message );

        $notification.find('i:first-child')
            .attr('title', message);

        if ( !notified ){
            $notification.dialog( 'open' );
        }
    };
    var goTo = function(method, location) {
        //TODO: Seems to be starting zoom, make it current zoom
        var zoom = 3;
        var map = ui.map.selected;
        var duration = ( method == "fly" ) ? 5000 : 1000;
        var wait = ( method == "fly" ) ? 1000 : 1;
        var start = +new Date();
        var pan = ol.animation.pan({
            duration: duration,
            source: map.getView().getCenter(),
            start: start
        });
        var bounce = ol.animation.bounce({
            duration: duration,
            resolution: models.proj.selected.resolutions[zoom],
            start: start
        });

        setTimeout(function() {
            if ( method === "fly" ) {
                map.beforeRender(pan, bounce);
            } else {
                map.beforeRender(pan);
            }
            if ( location.length == 2 ) {
                map.getView().setCenter(location);
                map.getView().setZoom(6);
            } else {
                //map.getView().fitExtent(location, map.getSize());
                map.getView().setCenter(location);
                map.getView().setZoom(8);
            }
        }, wait);
    };

    var productsIsOverflow = false;
    var sizeEventsTab = function(){
        var winSize = $(window).outerHeight(true);
        var headSize = $("ul#productsHolder-tabs").outerHeight(true);//
        var footSize = $("section#productsHolder footer").outerHeight(true);
        var head2Size = $('#wv-events-facets').outerHeight(true);
        var secSize = $("#productsHolder").innerHeight() - $("#productsHolder").height();
        var offset = $("#productsHolder").offset();
        var timeSize = $("#timeline").outerHeight(true); // + $("#timeline").offset()['top'];

        //FIXME: -10 here is the timeline's bottom position from page, fix
        // after timeline markup is corrected to be loaded first
        var maxHeight = winSize - headSize - head2Size - footSize -
            offset.top - timeSize - secSize - 10 - 5;
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

    var queryEvents = function() {
        var url = "http://eonet.sci.gsfc.nasa.gov/api/v1/events";
        console.log("sending query", url);
        $.getJSON(url, function(data) {
            self.data = data.item;
            console.log("events received", self.data);
            checkRender();
        });
    };

    var queryTypes = function() {
        var url = "http://eonet.sci.gsfc.nasa.gov/api/v1/types";
        console.log("sending query", url);
        $.getJSON(url, function(data) {
            self.types = data.item;
            console.log("types received", self.types);
            checkRender();
        });
    };

    var querySources = function() {
        var url = "http://eonet.sci.gsfc.nasa.gov/api/v1/sources";
        console.log("sending query", url);
        $.getJSON(url, function(data) {
            self.sources = data.item;
            console.log("sources received", self.sources);
            checkRender();
        });

    };

    self.query = function() {
        queryTypes();
        queryEvents();
        querySources();
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

    var checkRender = function() {
        if ( self.data && self.sources && self.types ) {
            self.render();
            self.refresh();
        }
    };

    init();
    return self;

};

