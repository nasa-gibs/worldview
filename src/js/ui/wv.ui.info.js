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
 * @module wv.ui
 */
var wv = wv || {};
wv.ui = wv.ui || {};

wv.ui.info = wv.ui.info || (function(ui) {

    var selector = "#wv-info-button";
    var $button = $("<button></button>")
        .attr("title", "Information");
    var $icon = $("<i></i>")
        .addClass("fa")
        .addClass("fa-info-circle")
        .addClass("fa-2x");
    $button.append($icon);
    $(selector).append($button);

    $button.button({
        text: false
    }).tooltip({
        hide: {
            duration: 0
        }
    });

    var $menu = $("<div></div>").attr("id", "wv-info-menu");
    var $menuItems = $("<ul></ul>");

    var $feedback = $("<li><a><i class='ui-icon icon-large fa fa-envelope fa-fw'></i>Feedback</a></li>");
    var $tour = $("<li><a><i class='ui-icon fa fa-truck fa-fw'></i>Start Tour</a></li>");
    var $about = $("<li><a><i class='ui-icon fa fa-file fa-fw'></i>About</a></li>");

    $menuItems.append($feedback);
    $menuItems.append($tour);
    $menuItems.append($about);
    $menu.append($menuItems);
    $("body").append($menu);

    $menuItems.hide().menu({
        select: function() {
            $button.tooltip("enable");
        }
    });

    $about.click(function() {
        wv.ui.about.show();
    });

    $tour.click(function() {
        ui.tour.start();
    });

    $button.click(function() {
        $(".ui-menu").hide();
        $button.tooltip("close").tooltip("disable");
        $menuItems.show().position({
            my: "right top",
            at: "right bottom+5",
            of: $button
        });
        $(document).one("click", function() {
            $menuItems.hide();
            $button.tooltip("enable");
        });
        return false;
    });

});

