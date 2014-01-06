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

/**
 * @module wv.layers
 */
var wv = wv || {};
wv.layers = wv.layers || {};

/**
 * @class wv.layers.add
 */
wv.layers.add = wv.layers.add || function(models, config) {

    var jsp = null;

    var model = models.layers;
    var self = {};

    self.selector = "#selectorbox";
    self.id = "selectorbox";

    var init = function() {
        render();
        $(window).resize(resize);

        model.events
            .on("add", onLayerAdded)
            .on("remove", onLayerRemoved);
        models.proj.events.on("select", onProjectionChange);
    };

    var render = function() {
        $(self.selector).empty();
        var tabs_height = $(".ui-tabs-nav").outerHeight(true);
        $(self.selector).addClass('selector');
        $(self.selector).height(
            $(self.selector).parent().outerHeight() - tabs_height
        );

        var $form = $("<div></div>")
            .attr("id", self.id + "facetedSearch")
            .addClass("facetedSearch");

        var $select = $("<select></select>")
            .attr("id", self.id + "select")
            .addClass("select");

        $form.append($select);

        var $search = $("<input>")
            .attr("id", self.id + "search")
            .addClass("search")
            .attr("type", "text")
            .attr("name", "search")
            .attr("placeholder", "ex. modis. terra, fire")
            .attr("autocomplete", "off");

        $form.append($search);
        $(self.selector).append($form);

        var $content = $("<div></div>")
            .attr("id", self.id + "content");

        renderType($content, "baselayers", "Base Layers", "BaseLayers");
        renderType($content, "overlays", "Overlays", "Overlays");
        $(self.selector).append($content);
        $(self.selector + " .selectorItem, " + self.selector + " .selectorItem input").on('click', toggleLayer);
        $(self.selector + "select").on('change', filter);
        $(self.selector + "search").on('keyup', filter);
        $(self.selector + "search").focus();

        updateAreasOfInterest();
        setTimeout(resize, 1);
    };

    var renderType = function($parent, type, header, camelCase) {
        var $container = $("<div></div>")
            .attr("id", self.id + camelCase)
            .addClass("categoryContainer");

        var $header = $("<h3></h3>")
            .addClass("head")
            .html(header);

        var $element = $("<ul></ul>")
            .attr("id", self.id + type)
            .addClass(self.id + "category")
            .addClass("category")
            .addClass("scroll-pane");

        $.each(config.layerOrder[type], function(index, layerId) {
            renderLayer($element, type, layerId);
        });

        $container.append($header);
        $container.append($element);
        $parent.append($container);
    };

    var renderLayer = function($parent, type, layerId) {
        var layer = config.layers[layerId];
        var $element = $("<li></li>")
            .addClass("selectorItem")
            .addClass("item");

        var $name = $("<h4></h4>")
            .html(layer.name);
        if ( config.parameters.markPalettes ) {
            if ( layer.rendered ) {
                $name.addClass("mark");
            }
        }
        if ( config.parameters.markDownloads ) {
            if ( layer.product ) {
                $name.addClass("mark");
            }
        }
        var $description = $("<p></p>")
            .html(layer.description);

        var $checkbox = $("<input></input>")
            .attr("id", Worldview.id(layer.id))
            .attr("value", layer.id)
            .attr("type", "checkbox")
            .attr("data-layer", layer.id)
            .attr("data-layer-type", type);
        if ( type === "baselayers" ) {
            $checkbox.attr("name", type);
        }
        if ( model.isActive(type, layer.id) ) {
            $checkbox.attr("checked", "checked");
        }

        $element.append($checkbox);
        $element.append($name);
        $element.append($description);

        $parent.append($element);
    };

    var adjustCategoryHeights = function() {
        var heights = [];
        var facets_height =
                $(self.selector + "facetedSearch").outerHeight(true);
        var container_height =
                $(self.selector).outerHeight(true) - facets_height;
        $(self.selector + "content").height(container_height);
        var labelHeight = 0;
        $(self.selector + 'content .head').each(function() {
            labelHeight += $(this).outerHeight(true);
        });
        container_height -= labelHeight;

        $.each(["baselayers", "overlays"], function(i, type) {
            var actual_height = 0;
            var count = 0;
            $(self.selector + type + ' li').each(function() {
                if ( $(this).is(":visible") ) {
                    actual_height += $(this).outerHeight(true);
                    count++;
                }
            });

            heights.push({
                name: self.id + type,
                height: actual_height,
                count: count
            });
        });

        if ( heights[0].height + heights[1].height > container_height ) {
            if( heights[0].height > container_height / 2 ) {
                heights[0].height = container_height / 2;
            }
            heights[1].height = container_height - heights[0].height;
        }
        $("#" + heights[0].name).css("height", heights[0].height + "px");
        $("#" + heights[1].name).css("height", heights[1].height + "px");

        reinitializeScrollbars();
    };

    var reinitializeScrollbars = function() {
        var pane = $("." + self.id + "category").each(function() {
            var api = $(this).data('jsp');
            if ( api ) {
                api.reinitialise();
            }
        });
    };

    var resize = function() {
        var tabs_height = $(".ui-tabs-nav").outerHeight(true);
        $(self.selector)
            .height($(self.selector).parent().outerHeight() - tabs_height);

        if ( $(window).width() > Worldview.TRANSITION_WIDTH ) {
            if ( jsp ) {
                var api = jsp.data('jsp');
                if ( api ) {
                    api.destroy();
                }
            }
            jsp = $("." + self.id + "category").jScrollPane({
                verticalDragMinHeight: 20,
                autoReinitialise: false,
                verticalGutter: 0
            });
        }
        //setTimeout(adjustCategoryHeights, 1);
        adjustCategoryHeights();
    };

    var toggleLayer = function(event) {
        var $target;
        if ( $(this).is(':checkbox') ) {
            $target = $(this);
        } else {
            $target = $(this).find('input:checkbox');
        }
        if ( $target.is(':checked') ) {

            $target.attr('checked', false);
            model.remove($target.attr("data-layer-type"),
                         $target.attr("data-layer"));
        } else {
            $target.attr('checked', true);
            model.add($target.attr("data-layer-type"),
                      $target.attr("data-layer"));
            }
    };

    var onLayerAdded = function(layer) {
        var $element = $("#" + Worldview.id(layer.id));
        $element.attr("checked", "checked");
    };

    var onLayerRemoved = function(layer) {
        var $element = $("#" + Worldview.id(layer.id));
        $element.removeAttr("checked");
    };

    var onProjectionChange = function() {
        updateAreasOfInterest();
        filter();
    };

    var updateAreasOfInterest = function() {
        $select = $("#" + self.id + "select");
        var previous = $(self.selector + "select").val();

        $select.empty();
        var $option = $("<option></option>")
            .attr("value", "All")
            .html("All");
        $select.append($option);

        var aois = [];
        $.each(config.aoi, function(name, info) {
             if ( $.inArray(models.proj.selected.id,
                    info.projections ) >= 0 ) {
                if ( info.index === 0 || info.index ) {
                    aois.splice(info.index, 0, name);
                } else {
                    aois.push(name);
                }
            }
        });

        $.each(aois, function(index, name) {
            var $option = $("<option></option>")
                .attr("value", name)
                .html(name);
            if ( previous === name ) {
                $option.attr("selected", "selected");
            }
            $select.append($option);
        });
        filter();
    };

    var searchTerms = function() {
        var search = $(self.selector + "search").val().toLowerCase();
        var terms = search.split(/ +/);
        return terms;
    };

    var filterAreaOfInterest = function(layerId) {
        var aoi = $(self.selector + "select").val();
        if ( aoi === "All" ) {
            return false;
        }
        return $.inArray(layerId, config.aoi[aoi].baselayers) < 0 &&
               $.inArray(layerId, config.aoi[aoi].overlays) < 0;
    };

    var filterProjection = function(layer) {
        return !layer.projections[models.proj.selected.id];
    };

    var filterSearch = function(layer, terms) {
        var search = $(self.selector + "search").val();
        if ( search === "" ) {
            return false;
        }
        var tags = ( layer.tags ) ? layer.tags : "";
        var filtered = false;
        $.each(terms, function(index, term) {
            filtered = !layer.name.toLowerCase().contains(term) &&
                       !layer.description.toLowerCase().contains(term) &&
                       !tags.toLowerCase().contains(term);
            if ( filtered ) {
                return false;
            }
        });

        return filtered;
    };

    var filter = function() {
        var search = searchTerms();
        $.each(config.layers, function(layerId, layer) {
            var filtered =
                filterAreaOfInterest(layerId) ||
                filterProjection(layer) ||
                filterSearch(layer, search);
            var display = filtered ? "none": "block";
            $("#" + Worldview.id(layerId)).parent().css("display", display);
        });
        adjustCategoryHeights();
    };

    init();
    return self;
};