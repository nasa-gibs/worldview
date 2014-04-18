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
    });

    var $menu = $("<div></div>").attr("id", "wv-info-menu");
    var $menuItems = $("<ul></ul>");

    var $feedback = $("<li><a href='mailto:@MAIL@?subject=Feedback for @LONG_NAME@ tool' target='_blank'><i class='ui-icon fa fa-envelope fa-fw'></i>Feedback</a></li>");
    var $tour = $("<li><a><i class='ui-icon fa fa-truck fa-fw'></i>Start Tour</a></li>");
    var $new = $("<li><a><i class='ui-icon fa fa-flag fa-fw'></i>What's New</a></li>");
    var $about = $("<li><a><i class='ui-icon fa fa-file fa-fw'></i>About</a></li>");

    $menuItems.append($feedback);
    $menuItems.append($tour);
    $menuItems.append($new);
    $menuItems.append($about);
    $menu.append($menuItems);
    $("body").append($menu);
    $menuItems.hide().menu();

    $about.click(function() {
        if ( wv.util.browser.small ) {
            window.open("pages/brand/about.html?v=@BUILD_NONCE@", "_blank");
        } else {
            wv.ui.getDialog().dialog({
                title: "About",
                width: 625,
                height: 525,
                show: { effect: "fade" },
                hide: { effect: "fade" }
            }).load("pages/brand/about.html?v=@BUILD_NONCE@ #page");
        }
    });

    $new.click(function() {
        if ( wv.util.browser.small ) {
            window.open("pages/brand/new.html?v=@BUILD_NONCE@", "_blank");
        } else {
            wv.ui.getDialog().dialog({
                title: "What's New",
                width: 625,
                height: 525,
                show: { effect: "fade" },
                hide: { effect: "fade" }
            }).load("pages/brand/new.html?v=@BUILD_NONCE@ #page");
        }
    });

    $tour.click(function() {
        ui.tour.start();
    });

    $button.click(function() {
        $(".ui-menu").hide();
        $menuItems.show().position({
            my: "right top",
            at: "right bottom+5",
            of: $button
        });
        $(document).one("click", function() {
            $menuItems.hide();
        });
        return false;
    });

});

