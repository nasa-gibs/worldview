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

/**
 * @module wv.proj
 */
var wv = wv || {};
wv.proj = wv.proj || {};

/**
 * Undocumented.
 *
 * @class wv.proj.ui
 */
wv.proj.ui = wv.proj.ui || function(models) {

    var icons = {
        geographic: {
            highlighted: "images/geographicon.png",
            normal:      "images/geographic.png"
        },
        arctic: {
            highlighted: "images/arcticon.png",
            normal:      "images/arctic.png"
        },
        antarctic: {
            highlighted: "images/antarcticon.png",
            normal:      "images/antarctic.png"
        }
    };
    var model = models.proj;

    var self = {};

    self.selector = "#projection";
    self.id = "projection";

    var init = function() {
        render();
        model.events.on("select", onProjectionChanged);
        onProjectionChanged(model.selected);
    };

    var render = function() {
        var $container = $(self.selector);
        $container.empty().addClass("switch");
        $container.html(
            "<ul>" +
            "<li>" +
            "<div class='sw_current' title='Choose a projection'>" +
            "</div>" +
            "<div class='hidden'>" +
                "<a id='arctic' class='sw_arctic' title='Arctic' " +
                    "data-id='arctic'></a>" +
                "<a id='geographic' class='sw_geographic' " +
                    "title='Geographic' data-id='geographic'></a>" +
                "<a id='antarctic' class='sw_antarctic' " +
                    "title='Antarctic' data-id='antarctic'></a>" +
            "</div>" +
            "</li>" +
            "</ul>"
        );

        $("#arctic").bind("click", changeProjection);
        $("#geographic").bind("click", changeProjection);
        $("#antarctic").bind("click", changeProjection);
    };

    var changeProjection = function(event) {
        var $element = $("#" + event.target.id);
        model.select($element.attr("data-id"));
    };

    var onProjectionChanged = function(proj) {
        $(self.selector + " .sw_current")
            .css("background-image", "url(" + icons[proj.id].normal + ")")
            .hover(function() { hoverOver($(this), proj.id); },
                   function() { hoverOut($(this), proj.id); });
    };

    var hoverOver = function($element, id) {
        $element.css("background-image",
                "url(" + icons[id].highlighted + ")");
    };

    var hoverOut = function($element, id) {
        $element.css("background-image",
                "url(" + icons[id].normal + ")");
    };

    init();
    return self;

};

