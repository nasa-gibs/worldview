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
    var types = [
        {id: "baselayers", camel: "BaseLayers", description: "Base Layers"},
        {id: "overlays",   camel: "Overlays",   description: "Overlays"}
    ];
    var jsp;

    var self = {};
    self.id = "products";
    self.selector = "#products";

    var init = function() {
        render();
        model.events
            .on("remove", onLayerRemoved)
            .on("visibility", onLayerVisibility);
        projectionModel.events
            .on("change", render);
    };

    var render = function() {
        var $container = $(self.selector);
        $container.empty();

        var tabs_height = $(".ui-tabs-nav").outerHeight(true);
        $(self.selector).addClass('bank');
        $(self.selector).height(
            $(self.selector).parent().outerHeight() - tabs_height
        );

        var html = [];
        $.each(types, function(index, type) {
            html.push(renderType(type));
        });
        $(self.selector).html(html.join("\n"));

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

        $("." + self.id + "category li").disableSelection();
        //$("." + this.id + "category").bind('sortstop',{self:this},SOTE.widget.Bank.handleSort);

        //setTimeout(SOTE.widget.Bank.adjustCategoryHeights,1,{self:this});

        /* MCG
        // Mark the component as ready in the registry if called via init()
        if ((this.initRenderComplete === false) && REGISTRY) {
            this.initRenderComplete = true;
            REGISTRY.markComponentReady(this.id);
        }
        END MCG */
    };

    var renderType = function(type) {
        var html = [];
        html.push(
            "<div id='" + self.id + type.camel + "' class='categoryContainer'>" +
            "<h3 class='head'>" + type.description + "</h3>" +
            "<ul id='" + type.id + "' class='" + self.id +
                "category category'>");

        $.each(model.forProjection()[type.id], function(index, layer) {
            html.push(
                "<li id='" + type.id + "-" + id(layer.id) + "' class='" +
                    self.id + "item item'>" +
                "<a>" +
                    "<img class='close bank-item-img' id='close|" +
                        type.id + "|" + id(layer.id) +
                        "' title='Remove Layer' " +
                        "src='images/close-red-x.png'/>" +
                "</a>"
            );
            if ( !model.visible[layer.id] ) {
                html.push("<a class='hdanchor'>" +
                    "<img class='hide hideReg bank-item-img' " +
                    "title='Show Layer' id='hide" + id(layer.id) + "'" +
                    "data-action='show' data-layer='" + layer.id + "'" +
                    "src='images/invisible.png' /></a>");
            } else {
                html.push("<a class='hdanchor'>" +
                    "<img class='hide hideReg bank-item-img' " +
                    "title='Hide Layer' id='hide" + id(layer.id) + "'" +
                    "data-action='hide' data-layer='" + layer.id + "'" +
                    "src='images/visible.png' /></a>");

            }
            html.push("<h4>" + layer.name + "</h4>");
            html.push("<p>" + layer.description + "</p>");

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
        html.push("</ul>");
        html.push("</div>");
        return html.join("\n");
    };

    var removeLayer = function(event) {
        var items = event.target.id.split("|");
        var type = items[1];
        var id = unescapeId(items[2].replace(/close/, ""));
        model.remove(type, id);
    };

    var onLayerRemoved = function(layer, type) {
        var layerSelector = "#" + type + "-" + id(layer.id);
        $(layerSelector).remove();
    };

    var toggleVisibility = function(event) {
        var $element = $("#" + event.target.id);
        var action = $element.attr("data-action");
        var layer = $element.attr("data-layer");
        if ( action === "show" ) {
            model.setVisibility(layer, true);
        } else {
            model.setVisibility(layer, false);
        }
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

    var id = function(value) {
        return value.replace(/:/g, "colon");
    };

    var unescapeId = function(value) {
        return value.replace("colon", /:/g);
    };

    init();
    return self;
};

