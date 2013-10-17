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

Worldview.namespace("Widget");

Worldview.Widget.ActiveLayers = function(config, model, projectionModel) {

    var log = Logging.getLogger("Widget.ActiveLayers");
    var aoi = config.aoi;
    var types = Worldview.LAYER_TYPES;
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
            .on("visibility", onLayerVisibility);
        projectionModel.events
            .on("change", render);
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

        $.each(types, function(index, type) {
            renderType($container, type);
        });

        //this.renderCanvases();

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
        $("." + self.id + "category").bind('sortstop', reorder);

        setTimeout(resize, 1);
    };

    var renderType = function($parent, type) {
        var $container = $("<div></div>")
            .attr("id", self.id + type.camel)
            .addClass("categoryContainer");

        var $header = $("<h3></h3>")
            .addClass("head")
            .html(type.description);

        var $layers = $("<ul></ul>")
            .attr("id", type.id)
            .addClass(self.id + "category")
            .addClass("category");

        $.each(model.forProjection()[type.id], function(index, layer) {
            renderLayer($layers, type, layer);
        });

        $container.append($header);
        $container.append($layers);

        $parent.append($container);
    };

    var renderLayer = function($parent, type, layer) {
        var $layer = $("<li></li>")
            .attr("id", type.id + "-" + Worldview.id(layer.id))
            .addClass(self.id + "item")
            .addClass("item");

        var $removeButton = $("<a></a>");
        var $removeImage = $("<img></img>")
            .attr("id", "close" + type.id + Worldview.id(layer.id))
            .addClass("close")
            .addClass("bank-item-img")
            .attr("data-layer", layer.id)
            .attr("data-layer-type", type.id)
            .attr("title", "Remove Layer")
            .attr("src", "images/close-red-x.png");
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

        $layer.append($("<h4></h4>").html(layer.name));
        $layer.append($("<p></p>").html(layer.description));

        if ( layer.rendered ) {
            renderLegend($layer, type, layer);
        }
        $parent.append($layer);
    };

    var renderLegend = function($parent, type, layer) {
        var $container = $("<div></div>");

        $container.append($("<span>X</span>").addClass("palette"));

            /*
            // Has a rendered palette?
            if ( layer.rendered ) {
                html.push(
                    "<div>" +
                    "<span class='palette'>" +
                    "<span class='p-min' style='margin-right:10px;'>" +
                        layer.min + "</span>" +
                    "<canvas class='colorBar' id='canvas" + id(layer.id) +
                        "' width=100px height=14px'></canvas>" +
                     "<span class='p-max' style='margin-left:10px;'>" +
                        layer.max + "</span>"
                );

                if ( layer.units ) {
                    html.push(
                        "<span class='p-units' style='margin-left:3px;'>" +
                            m.units + "</span>"
                    );
                }
                html.push("</span></div>");
            }
            html.push("</li>");
        });
        */
    };

    var adjustCategoryHeights = function() {
        var heights = [];
        var container_height = $(self.selector).outerHeight(true);
        var labelHeight = 0;
        $(self.selector + ' .head').each(function(){
            labelHeight += $(this).outerHeight(true);
        });
        container_height -= labelHeight;
        var types = ["baselayers", "overlays"];
        $.each(types, function(i, type) {
            var actual_height = 0;
            var count = 0;
            $('#' + type + ' li').each(function() {
                actual_height += $(this).outerHeight(true);
                count++;
            });

            heights.push({
                name: type,
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
        adjustCategoryHeights();
    };

    var removeLayer = function(event) {
        var $target = $(event.target);
        model.remove($target.attr("data-layer-type"),
                     $target.attr("data-layer"));
    };

    var onLayerRemoved = function(layer, type) {
        var layerSelector = "#" + type + "-" + Worldview.id(layer.id);
        $(layerSelector).remove();
        adjustCategoryHeights();
    };

    var onLayerAdded = function(layer, type) {
        var $container = $("#" + type);
        var api = $container.data("jsp");
        if ( api ) {
            $container = api.getContentPane();
        }
        renderLayer($container, types[type], layer);
        adjustCategoryHeights();
    };

    var toggleVisibility = function(event) {
        var $target = $(event.target);
        var action = $target.attr("data-action");
        var layer = $element.attr("data-layer");
        if ( $target.attr("data-action") === "show" ) {
            model.setVisibility($target.attr("data-layer"), true);
        } else {
            model.setVisibility($target.attr("data-layer"), false);
        }
    };

    var reorder = function(a, b, c) {
        console.log("reorder", a, b, c);
        console.log($(this).index());
        /*
        self.values = {};
        for(var i=0; i<self.categories.length; i++){
            var formatted = self.categories[i].replace(/\s/g, "");
            formatted = formatted.toLowerCase();
            self.values[formatted] = new Array();
            jQuery('li[id|="'+formatted+'"]').each(function() {
                var item = jQuery( this );
                var id = item.attr("id");
                var vals = id.split("-");
                var val = vals.splice(0,1);
                val = vals.join("-");
                self.values[formatted].push({value:val});
            });
        }
        self.fire();
        */
    };

    var onLayerVisibility = function(layer, visible) {
        var $element = $(".hideReg[data-layer='" + layer.id + "']");
        if ( visible ) {
            $element.attr("data-action", "hide");
            $element.attr("src", "images/visible.png");
        } else {
            $element.attr("data-action", "show");
            $element.attr("src", "images/invisible.png");
        }
    };

    init();
    return self;
};

