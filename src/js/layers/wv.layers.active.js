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
 * @module wv.layers
 */
var wv = wv || {};
wv.layers = wv.layers || {};

/**
 * @class wv.layers.active
 */
wv.layers.active = wv.layers.active || function(models, config, spec) {

    var aoi = config.aoi;
    var model = models.layers;
    var paletteWidget = spec.paletteWidget;
    var groups = wv.util.LAYER_GROUPS;
    var jsp;

    var ICON_VISIBLE = "images/visible.png";
    var ICON_HIDDEN = "images/invisible.png";

    var self = {};
    self.id = "products";
    self.selector = "#products";

    var init = function() {
        render();
        model.events
            .on("add", onLayerAdded)
            .on("remove", onLayerRemoved)
            .on("update", onLayerUpdate)
            .on("visibility", onLayerVisibility);
        models.proj.events
            .on("select", onProjectionChanged);
        models.palettes.events
            .on("palette", onPaletteChanged);
        $(window).resize(resize);
    };

    var render = function() {
        var $container = $(self.selector);
        $container.empty();

        var tabs_height = $(".ui-tabs-nav").outerHeight(true);
        $container.addClass('bank');
        $container.height(
            $(self.selector).parent().outerHeight() - tabs_height
        );

        _.each(groups, function(group) {
            renderType($container, group);
        });

        $(self.selector).undelegate(".close" ,'click');
        $(self.selector).undelegate(".hideReg" ,'click');

        $(self.selector).delegate(".close" ,'click', removeLayer);
        $(self.selector).delegate(".hideReg" ,'click', toggleVisibility);

        $("." + self.id + "category").sortable({
            items: "li:not(.head)",
            axis: "y",
            containment: "parent",
            tolerance: "pointer"
        });

        $("." + self.id + "category li").disableSelection();
        $("." + self.id + "category").bind('sortstop', moveLayer);

        $.each(model.forProjection().overlays, function(index, layer) {
            if ( layer.rendered ) {
                renderLegendCanvas(layer);
            }
        });

        setTimeout(resize, 1);
    };

    var renderType = function($parent, group) {
        var $container = $("<div></div>")
            .attr("id", self.id + group.camel)
            .addClass("categoryContainer");

        var $header = $("<h3></h3>")
            .addClass("head")
            .html(group.description);

        var $layers = $("<ul></ul>")
            .attr("id", group.id)
            .addClass(self.id + "category")
            .addClass("category");

        $.each(model.forProjection()[group.id], function(index, layer) {
            renderLayer($layers, group, layer);
        });

        $container.append($header);
        $container.append($layers);

        $parent.append($container);
    };

    var renderLayer = function($parent, group, layer, top) {
        var $layer = $("<li></li>")
            .attr("id", group.id + "-" + Worldview.id(layer.id))
            .addClass(self.id + "item")
            .addClass("item")
            .attr("data-layer", layer.id);

        var $removeButton = $("<a></a>");
        var $removeImage = $("<img></img>")
            .attr("id", "close" + group.id + Worldview.id(layer.id))
            .addClass("close")
            .addClass("bank-item-img")
            .attr("data-layer", layer.id)
            .attr("title", "Remove Layer")
            .attr("src", "images/close-x.png");
        $removeButton.append($removeImage);
        $layer.append($removeButton);

        var $visibleButton = $("<a></a>")
            .addClass("hdanchor");
        var $visibleImage = $("<img></img>")
            .attr("id", "hide" + Worldview.id(layer.id))
            .attr("data-layer", layer.id)
            .addClass("hide")
            .addClass("hideReg")
            .addClass("bank-item-img");
        if ( !model.visible[layer.id] ) {
            $visibleImage
                .attr("title", "Show Layer")
                .attr("data-action", "show")
                .attr("src", ICON_HIDDEN);
        } else {
            $visibleImage
                .attr("title", "Hide Layer")
                .attr("data-action", "hide")
                .attr("src", ICON_VISIBLE);
        }
        $visibleButton.append($visibleImage);
        $layer.append($visibleButton);

        $layer.append($("<h4></h4>").html(layer.title));
        $layer.append($("<p></p>").html(layer.subtitle));

        if ( layer.rendered ) {
            renderLegend($layer, group, layer);
        }
        if ( top ) {
            $parent.prepend($layer);
        } else {
            $parent.append($layer);
        }
    };

    var renderLegend = function($parent, group, layer) {
        var $div = $("<div></div>");
        var $container = $("<span></span>")
            .addClass("palette");

        var $min = $("<span></span>")
            .addClass("p-min")
            .html(layer.min);
        $container.append($min);

        var $canvas = $("<canvas></canvas>")
            .attr("id", "canvas" + Worldview.id(layer.id))
            .addClass("colorBar")
            .attr("data-layer", layer.id);
        var palette = paletteWidget.getPalette(layer.id);
        if ( palette.stops.length > 1 ) {
            $canvas.click(openPaletteSelector)
                .css("cursor", "pointer");
        }
        $container.append($canvas);

        var $max = $("<span></span>")
            .addClass("p-max")
            .html(layer.max);
        $container.append($max);

        if ( layer.units ) {
            var $units = $("<span></span>")
                .addClass("p-units")
                .html(layer.units);
            $container.append($units);
        }

        $div.append($container);
        $parent.append($div);
    };

    var renderLegendCanvas = function(layer) {
        var palette = paletteWidget.getPalette(Worldview.id(layer.id));
        Worldview.Palette.ColorBar({
            selector: "#canvas" + Worldview.id(layer.id),
            bins: layer.bins,
            stops: layer.stops,
            palette: palette
        });
    };

    var adjustCategoryHeights = function() {
        var heights = [];
        var container_height = $(self.selector).outerHeight(true);
        var labelHeight = 0;
        $(self.selector + ' .head').each(function(){
            labelHeight += $(this).outerHeight(true);
        });
        container_height -= labelHeight;
        $.each(["baselayers", "overlays"], function(i, group) {
            var actual_height = 0;
            var count = 0;
            $('#' + group + ' li').each(function() {
                actual_height += $(this).outerHeight(true);
                count++;
            });

            heights.push({
                name: group,
                height: actual_height,
                count: count
            });
        });

        if ( heights[0].height + heights[1].height > container_height ) {
            if ( heights[0].height > container_height / 2 ) {
                heights[0].height = container_height / 2;
            }
            heights[1].height = container_height - heights[0].height;
        }

        $("#" + heights[0].name).css("height",heights[0].height+"px");
        $("#" + heights[1].name).css("height",heights[1].height+"px");

        reinitializeScrollbars();
    };

    var reinitializeScrollbars = function() {
        $("." + self.id + "category").each(function() {
            var api = $(this).data('jsp');
            if ( api ) {
                api.reinitialise();
            }
        });
    };

    var resize = function() {
        // If on a mobile device, use the native scroll bars
        if ( $(window).width() > Worldview.TRANSITION_WIDTH ) {
            if ( jsp ) {
                var api = jsp.data('jsp');
                if ( api ) {
                    api.destroy();
                }
            }
            this.jsp = $("." + self.id + "category")
                .jScrollPane({autoReinitialise: false, verticalGutter:0});
        }

        var tabs_height = $(".ui-tabs-nav").outerHeight(true);
        $(self.selector).height(
            $(self.selector).parent().outerHeight() - tabs_height
        );
        adjustCategoryHeights();
    };

    var removeLayer = function(event) {
        var $target = $(event.target);
        model.remove($target.attr("data-layer"));
    };

    var onLayerRemoved = function(layer) {
        var layerSelector = "#" + layer.group + "-" + Worldview.id(layer.id);
        $(layerSelector).remove();
        adjustCategoryHeights();
    };

    var onLayerAdded = function(layer) {
        var $container = $("#" + layer.group);
        var api = $container.data("jsp");
        if ( api ) {
            $container = api.getContentPane();
        }
        renderLayer($container, groups[layer.group], layer, "top");
        if ( layer.rendered ) {
            renderLegendCanvas(layer);
        }
        adjustCategoryHeights();
    };

    var toggleVisibility = function(event) {
        var $target = $(event.target);
        if ( $target.attr("data-action") === "show" ) {
            model.setVisibility($target.attr("data-layer"), true);
        } else {
            model.setVisibility($target.attr("data-layer"), false);
        }
    };

    var moveLayer = function(event, ui) {
        var $target = ui.item;
        var $next = $target.next();
        if ( $next.length ) {
            model.moveBefore($target.attr("data-layer"),
                    $next.attr("data-layer"));
        } else {
            model.pushToBottom($target.attr("data-layer"));
        }
    };

    var onLayerUpdate = function(group, layer, newIndex) {
        // Scroll pane can be kind of glitchy, so just show what the
        // current state is.
        // Timeout prevents redraw artifacts
        setTimeout(render, 1);
    };

    var onLayerVisibility = function(layer, visible) {
        var $element = $(".hideReg[data-layer='" + layer.id + "']");
        if ( visible ) {
            $element.attr("data-action", "hide")
                .attr("src", "images/visible.png")
                .attr("title", 'Hide Layer');
        } else {
            $element.attr("data-action", "show")
                .attr("src", "images/invisible.png")
                .attr("title", "Show Layer");
        }
    };

    var onProjectionChanged = function() {
        // Timeout prevents redraw artifacts
        setTimeout(render, 1);
    };

    var openPaletteSelector = function(event) {
        var $target = $(event.target);
        if ( !wv.palette.supported ) {
            wv.ui.unsupported();
        } else {
            paletteWidget.displaySelector($target.attr("data-layer"));
        }
    };

    var onPaletteChanged = function(palette, layerId) {
        var layer = config.layers[layerId];
        if ( layer && layer.rendered && $("#canvas" + Worldview.id(layer.id)).length > 0 ) {
            Worldview.Palette.ColorBar({
                selector: "#canvas" + Worldview.id(layer.id),
                bins: layer.bins,
                stops: layer.stops,
                palette: palette
            });
        }
    };

    init();
    return self;
};
