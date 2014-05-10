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
wv.proj.ui = wv.proj.ui || function(models, config) {

    var model = models.proj;

    var self = {};

    self.selector = "#wv-proj-button";
    self.id = "wv-proj-button";

    var init = function() {
        if ( config.ui && config.ui.projections ) {
            render();
        }
    };

    var render = function() {
        var $button = $("<button></button>")
            .attr("title", "Switch projection");
        var $icon = $("<i></i>")
            .addClass("fa")
            .addClass("fa-globe")
            .addClass("fa-2x");
        $button.append($icon);
        $(self.selector).append($button);
        $button.button({
            text: false
        });

        var $menu = $("<div></div>").attr("id", "wv-proj-menu");
        var $menuItems = $("<ul></ul>");

        _.each(config.ui.projections, function(ui) {
            var $item = $(
                "<li><a><i class='ui-icon icon-large " + ui.style + "'>" +
                "</i>" + ui.name + "</a></li>");
            $menuItems.append($item);
            $item.click(function() { models.proj.select(ui.id); });
        });

        $menu.append($menuItems);
        $("body").append($menu);

        $menuItems.hide().menu();

        $button.click(function() {
            $(".ui-menu").hide();
            wv.ui.closeDialog();
            $menuItems.show().position({
                my: "left top",
                at: "left bottom+5",
                of: $button
            });
            $(document).one("click", function() {
                $menuItems.hide();
            });
            return false;
        });
    };

    init();
    return self;

};
