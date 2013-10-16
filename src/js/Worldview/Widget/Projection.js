/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */
Worldview.namespace("Widget.Projection");

Worldview.Widget.Projection = function(model) {

    var log = Logging.getLogger("Worldview.Widget.Projection");
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

    var self = {};

    self.selector = "#projection";
    self.id = "projection";

    var init = function() {
        render();
        model.events.on("change", onProjectionChanged);
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
                    "data-view='arctic'></a>" +
                "<a id='geographic' class='sw_geographic' " +
                    "title='Geographic' data-view='geographic'></a>" +
                "<a id='antarctic' class='sw_antarctic' " +
                    "title='Antarctic' data-view='antarctic'></a>" +
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
        model.set($element.attr("data-view"));
    };

    var onProjectionChanged = function(projection) {
        $(self.selector + " .sw_current")
            .css("background-image", "url(" + icons[projection].normal + ")")
            .hover(function() { hoverOver($(this), projection); },
                   function() { hoverOut($(this), projection); });
    };

    var hoverOver = function($element, projection) {
        $element.css("background-image",
                "url(" + icons[projection].highlighted + ")");
    };

    var hoverOut = function($element, projection) {
        $element.css("background-image",
                "url(" + icons[projection].normal + ")");
    };

    init();
    return self;

};
