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
        "Saturday"
    ];
    var monthNames = [
        "January",
        "Febuaray",
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
            ["MODIS_Aqua_CorrectedReflectance_TrueColor", false],
            ["MODIS_Terra_CorrectedReflectance_TrueColor", true],
            ["MODIS_Fires_All", true]
        ],
        "Temperature Extremes": [
            ["MODIS_Aqua_CorrectedReflectance_TrueColor", false],
            ["MODIS_Terra_CorrectedReflectance_TrueColor", true],
            ["MODIS_Aqua_Land_Surface_Temp_Day", false],
            ["MODIS_Terra_Land_Surface_Temp_Day", true]
        ],
        Floods: [
            ["MODIS_Aqua_SurfaceReflectance_Bands121", false],
            ["MODIS_Terra_SurfaceReflectance_Bands121", true]
        ],
        Volcanoes: [
            ["MODIS_Aqua_CorrectedReflectance_Bands721", false],
            ["MODIS_Terra_CorrectedReflectance_Bands721", true]
        ],
        Default: [
            ["MODIS_Aqua_CorrectedReflectance_TrueColor", false],
            ["MODIS_Terra_CorrectedReflectance_TrueColor", true]
        ]
    };

    var self = {};
    self.selector = "#wv-data";
    self.event_selector = $("#wv-events-list");
    self.id = "wv-data";
    self.data = {};
    var lastIndex = -1;
    var lastDateIndex = -1;

    var init = function() {
        self.query();
    };

    self.render = function() {
        var $panels = $(self.selector).empty();

        var $searchContainer = $("<div></div>")
            .attr("id", "wv-events-facets")
            ;//.addClass("facetedSearch");

        var $typeFacet = $("<select></select>")
            .attr("id", "wv-events-types")
            .addClass("wv-events-facet");
        var $sourceFacet = $("<select></select>")
            .attr("id", "wv-events-sources")
            .addClass("wv-events-facet");

        $searchContainer.append($typeFacet).append($sourceFacet);
        $panels.append($searchContainer);

        var $listContainer = $("<div></div>")
            .attr("id", "wv-events-list")
            .addClass(self.id + "list")
            .addClass("bank")
            .addClass("selector");

        var $list = $("<div></div>")
            .attr("id", self.id + "content")
            .addClass("content");

        $listContainer.append($list);
        $panels.append($listContainer);

        var $detailContainer = $("<div></div>")
            .attr("id", "wv-events-detail")
            .hide();
        $panels.append($detailContainer);

        renderTypes();
        renderSources();
        self.refresh();
    };

    self.refresh = function() {
        var $content = $(self.selector + "content");
        var api = $content.data("jsp");
        if ( api ) {
            api.destroy();
        }
        $content = $(self.selector + "content").empty();
        _.each(self.data, function(event, index) {
            refreshEvent($content, event, index);
        });
        $(self.selector + "content li").click(function() {
            showEvent($(this).attr("data-index"));
        });
        $(self.selector + "content a.date").click(function(event) {
            showEvent($(this).attr("data-index"), $(this).attr("data-date-index"));
            event.stopPropagation();
        });
        resize();
    };

    var refreshEvent = function($content, event, index) {

        var geoms = toArray(event.geometry);
        var eventDate = wv.util.parseDateUTC(geoms[0].date);
        var dateString = dayNames[eventDate.getUTCDay()] + ", " +
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

        var $dates = $("<ul></ul>").addClass("dates").hide();
        if ( event.geometry.length > 1 ) {
            _.each(event.geometry, function(geometry, dateIndex) {
                var date = geometry.date.split(/T/)[0];
                var $date = $("<a></a>")
                    .addClass("date")
                    .attr("data-date-index", dateIndex)
                    .attr("data-index", index)
                    .html("&bull; " + date);
                $dates.append($("<li class='dates'></li>").append($date));
            });
        }

        $item.append($title).append($subtitle).append($dates);
        var references = toArray(event.reference);
        if ( references.length > 0 ) {
            var items = [];
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
            $("#wv-data").append(createEvent(event));
        });
        $("#wv-data").jScrollPane();
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

        self.event_selector.find(".subtitle").hide();
        self.event_selector.find(".dates").hide();
        $("#wv-events-list [data-index='" + index + "'] .subtitle").show();
        $("#wv-events-list [data-index='" + index + "'] .dates").show();
        resize();

        var event = self.data[index], eventItem = null;
        console.log("event", event);

        if ( event.geometry.length > 1 ) {
            eventItem = event.geometry[dateIndex || 0];
        } else {
            eventItem = event.geometry[0];
        }
        models.date.select(wv.util.parseTimestampUTC(eventItem.date));

        var category = "Default", categories = event.category;
        if ( categories.constructor !== Array ) {
            categories = [categories];
        }
        _.each(categories, function(c) {
            if ( layerLists[c["#text"]] ) {
                category = c["#text"];
                return;
            }
        });

        var layers = layerLists[category];
        if ( !layers ) {
            layers = layerLists.Default;
        }
        models.layers.clear();
        _.each(layers, function(layer) {
            var id = layer[0];
            var visible = layer[1];
            models.layers.add(id, { visible: visible });
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

    var goTo = function(method, location) {
        var zoom = 4;
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
                map.getView().setZoom(5);
            } else {
                map.getView().fitExtent(location, map.getSize());
            }
        }, wait);
    };

    var resize = function() {
        resizePane($(self.selector + "content"));
    };

    var resizePane = function($pane) {
        //var tabs_height = $(".ui-tabs-nav").outerHeight(true);
        //var button_height = $(self.selector + "_Button").outerHeight(true);
        $(self.selector).height(
            $(self.selector).parent().outerHeight()// - tabs_height// - button_height
        );
        var api = $pane.data("jsp");
        if ( !wv.util.browser.small ) {
            if ( api ) {
                api.reinitialise();
            } else {
                $pane.jScrollPane({verticalGutter:0, contentWidth:238, autoReinitialise:false});
            }
        } else {
            if ( api ) {
                api.destroy();
            }
        }
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

    var renderTypes = function() {
        var $facet = $("#wv-events-types");
        $facet.append($("<option></option>")
            .val("none")
            .html("Type..."));
        _.each(self.types, function(type) {
            var $type = $("<option></option>")
                .val(type.title)
                .html(type.title);
            $facet.append($type);
        });
        $facet.change(updateFacets);
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

    var renderSources = function() {
        var $facet = $("#wv-events-sources");
        $facet.append($("<option></option>")
            .val("none")
            .html("Source..."));
        _.each(self.sources, function(source) {
            var maxLen = 35;
            if ( source.title.length > maxLen ) {
                source.abbr = source.title.substring(0, maxLen) + "...";
            }
            var $source = $("<option></option>")
                .val(source.id)
                .html(source.abbr || source.title);
            $facet.append($source);
        });
        $facet.change(updateFacets);
    };

    var updateFacets = function() {
        self.event_selector.find(".selectorItem").hide();
        var source = $("#wv-events-sources").val();
        var type = $("#wv-events-types").val();

        console.log("source", source, "type", type);
        self.event_selector.find(".selectorItem").each(function() {
            var index = $(this).attr("data-index");
            var passType = true;
            var passSource = true;
            var event = self.data[index];
            if ( source !== "none" ) {
                var references = toArray(event.reference);
                if ( !_.find(references, { "id": source }) ) {
                    passSource = false;
                }
            }
            if ( type !== "none" ) {
                var categories = toArray(event.category);
                console.log(type, categories);
                if ( !_.find(categories, { "#text": type }) ) {
                    passType = false;
                }
            }
            if ( passType && passSource ) {
                $(this).show();
            }
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
            updateFacets();
        }
    };

    init();
    return self;

};

