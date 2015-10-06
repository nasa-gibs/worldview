/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2014 United States Government as represe`nted by the
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
wv.layers.active = wv.layers.active || function(models, ui, config) {

    var aoi = config.aoi;
    var model = models.layers;
    var groups = wv.util.LAYER_GROUPS;
    var jsp;
    var legends = {};

//    var ICON_VISIBLE = "images/wv.layers/show-hide.png";
//    var ICON_HIDDEN = "images/wv.layers/show-hide.png";

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
            .on("set-custom", onPaletteUpdate)
            .on("clear-custom", onPaletteUpdate)
            .on("range", onPaletteUpdate)
            .on("update", onPaletteUpdateAll);
        models.wv.events.on("sidebar-expand", resize);
        $(window).resize(resize);
        ui.sidebar.events.on("select", function(tab) {
            if ( tab === "active" ) {
                resize();
            }
        });
        
        ui.map.selected.getView().on("change:resolution", onZoomChange);
    };

    var render = function() {
        legends = {};
        var $container = $(self.selector);
        var $addBtn = $("#layers-add");
        $container.empty();
        
        $addBtn.button();
        sizeProducts();

        $container.addClass('bank');

        _.eachRight(groups, function(group) {
            renderGroup($container, group);
        });

        $(self.selector).undelegate(".close" ,'click');
        $(self.selector).undelegate(".hideReg" ,'click');

        $(self.selector).delegate(".close" ,'click', removeLayer);
        $(self.selector).delegate(".hideReg" ,'click', toggleVisibility);

        $("#" + self.id + " ul.category").sortable({
            items: "li:not(.head)",
            axis: "y",
            containment: "parent",
            tolerance: "pointer",
            placeholder: "state-saver"
        });

        $("." + self.id + "category li").disableSelection();
        $("." + self.id + "category").bind('sortstop', moveLayer);

        _.each(model.get({ group: "overlays" }), function(layer) {
            if ( layer.palette ) {
                renderLegendCanvas(layer);
            }
        });

        setTimeout(resize, 1);

    };

    var renderGroup = function($parent, group) {
        var $container = $("<ul></ul>")
            .attr("id", group.id)
            .addClass("category");

        _.each(model.get({ group: group.id }), function(layer) {
            renderLayer($container, group, layer);
        });

        //$container.append($header);
        //$contain.append($layers);

        $parent.append($container);

    };

    var renderLayer = function($parent, group, layer, top) {
        var $layer = $("<li></li>")
            .attr("id", group.id + "-" + encodeURIComponent(layer.id))
            .addClass(self.id + "item")
            .addClass("item")
            .attr("data-layer", layer.id);

        var $removeButton = $("<a></a>")
            .attr("id", "close" + group.id + encodeURIComponent(layer.id))
            .addClass("button close bank-item-img")
            .attr("data-layer", layer.id)
            .attr("title", "Remove Layer");
        var $removeImage = $("<i></i>");

        $removeButton.append($removeImage);
        $layer.append($removeButton);

        var $visibleButton = $("<a></a>")
            .addClass("hdanchor hide hideReg bank-item-img")
            .attr("id", "hide" + encodeURIComponent(layer.id))
            .attr("data-layer", layer.id);

        var $visibleImage = $("<i></i>")
            .on('click', function(){
                $visibleButton.trigger('click');
            });

        $visibleButton.append($visibleImage);
        $layer.append($visibleButton);

        $layer.append($("<div></div>")
                      .addClass('zot')
                      .append('<b>!</b>'));
        
        if ( !layer.visible ) {
            $visibleButton
                .attr("title", "Show Layer")
                .attr("data-action", "show")
                .parent()
                .addClass("layer-hidden");
        } else {
            $visibleButton
                .attr("title", "Hide Layer")
                .attr("data-action", "hide")
                .parent()
                .addClass("layer-visible");
        }

        checkZots($layer, layer);

        if ( config.parameters.metadata && layer.metadata ) {
            var $metadataButton = $("<i></i>")
                .addClass("fa")
                .addClass("fa-info-circle")
                .addClass("fa-1x")
                .addClass("wv-layers-metadata-button")
                .click(function() {
                    wv.layers.metadata(layer);
                });
            $layer.append($metadataButton);
        }

        var names = models.layers.getTitles(layer.id);

        var $editButton = $("<a></a>")
            .attr("data-layer", layer.id)
            .attr("title", "Layer options for " + names.title)
            .addClass("wv-layers-options");
        wv.ui.mouse.click($editButton, toggleOptionsPanel);
        if ( wv.util.browser.small ) {
            $editButton.hide();
        }

        var $gearIcon = $("<i></i>")
            .addClass("wv-layers-options-icon");

        $editButton.append($gearIcon);

        $layer.append($editButton);

        var $mainLayerDiv = $('<div></div>')
            .addClass('layer-main')
            .attr("data-layer", layer.id)
            .append($('<h4></h4>').html(names.title).attr('title',names.title))
            .append($('<p></p>').html(names.subtitle));

        $layer.hover(function(){
            d3.select('#timeline-footer svg g.plot rect[data-layer="'+ layer.id +'"]')
                .classed('data-bar-hovered',true);

        },function(){
            d3.select('#timeline-footer svg g.plot rect[data-layer="'+ layer.id +'"]')
                .classed('data-bar-hovered',false);
        });

        $layer.append($mainLayerDiv);

        if ( layer.palette ) {
            renderLegend($layer.find('.layer-main'), group, layer);
        }
        if ( top ) {
            $parent.prepend($layer);
        } else {
            $parent.append($layer);
        }
    };

    var toggleOptionsPanel = function() {
        var $d = $("#wv-layers-options-dialog");
        var thisLayerId = $(this).attr("data-layer");
        var thisLayer = config.layers[thisLayerId];
        if ( $d.length === 0 ) {
            wv.layers.options(config, models, thisLayer);
        } else if ( $d.attr("data-layer") !== thisLayerId ) {
            wv.ui.closeDialog();
            wv.layers.options(config, models, thisLayer);
        } else {
            wv.ui.closeDialog();
        }
    };

    var renderLegend = function($parent, group, layer) {
        var $container = $("<div></div>")
            .addClass("wv-palette")
            .attr("data-layer", encodeURIComponent(layer.id));
        $parent.append($container);
    };

    var renderLegendCanvas = function(layer) {
        var selector = ".wv-palette[data-layer='" +
                wv.util.jqueryEscape(layer.id) + "']";
		legends[layer.id] = wv.palettes.legend({
            selector: selector,
            config: config,
            models: models,
            layer: layer,
            //onLoad: //adjustCategoryHeights
        });
    };

    var sizeProducts = function(){
        var winSize = $(window).outerHeight(true);
        var headSize = $("ul#productsHolder-tabs").outerHeight(true);//
        var footSize = $("section#productsHolder footer").outerHeight(true);
        var secSize = $("#productsHolder").innerHeight() - $("#productsHolder").height();
        var offset = $("#productsHolder").offset();
        var timeSize = $("#timeline").outerHeight(true); // + $("#timeline").offset()['top'];

        //FIXME: -10 here is the timeline's bottom position from page, fix
        // after timeline markup is corrected to be loaded first
        $("section#productsHolder #products").css("max-height", winSize -
                                                  headSize - footSize -
                                                  offset.top - timeSize -
                                                  secSize - 10 - 5);
    };

    var resize = function() {
        // If on a mobile device, use the native scroll bars
        if ( !wv.util.browser.small ) {
            if ( jsp ) {
                var api = jsp.data('jsp');
                if ( api ) {
                    api.destroy();
                }
            }
            if (wv.util.browser.ie){
                this.jsp = $("." + self.id + "category")
                    .jScrollPane({autoReinitialise: false, verticalGutter:0, mouseWheelSpeed: 60});
            }
            else {
                this.jsp = $("." + self.id + "category")
                    .jScrollPane({autoReinitialise: false, verticalGutter:0});
            }
            $(".wv-layers-options").show();
        } else {
            $(".wv-layers-options").hide();
        }

        sizeProducts();
        
    };

    var removeLayer = function(event) {
        var layerId = $(event.target).attr("data-layer");
        model.remove(layerId);
    };

    var onLayerRemoved = function(layer) {
        var layerSelector = "#" + layer.group + "-" +
                wv.util.jqueryEscape(layer.id);
        $(layerSelector).remove();
        if ( legends[layer.id] ) {
            delete legends[layer.id];
        }
        //adjustCategoryHeights();
    };

    var onLayerAdded = function(layer) {
        var $container = $("#" + layer.group);
        var api = $container.data("jsp");
        if ( api ) {
            $container = api.getContentPane();
        }
        renderLayer($container, groups[layer.group], layer, "top");
        if ( layer.palette ) {
            renderLegendCanvas(layer);
        }
        //adjustCategoryHeights();
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
                .attr("title", 'Hide Layer')
                .parent()
                .removeClass('layer-hidden')
                .addClass('layer-visible');
        } else {
            $element.attr("data-action", "show")
                .attr("title", "Show Layer")
                .parent()
                .removeClass('layer-visible')
                .addClass('layer-hidden');
        }
        onZoomChange();
    };

    var onPaletteUpdate = function(layerId) {
        if ( legends[layerId] ) {
            legends[layerId].update();
        }
    };

    var onPaletteUpdateAll = function() {
        _.each(legends, function(legend) {
            legend.update();
        });
    };

    var onProjectionChanged = function() {
        // Timeout prevents redraw artifacts
        ui.map.selected.getView().on("change:resolution", onZoomChange);
        setTimeout(render, 1);
    };

    var checkZots = function($layer, layer) {
        var map = ui.map;
        var zoom = map.selected.getView().getZoom();

        var sources = config.sources;
        var proj = models.proj.selected.id;
        
        var matrixSet = layer.projections[proj].matrixSet;
        if(matrixSet !== undefined){
            var source = layer.projections[proj].source;
            var zoomLimit = sources[source]
                .matrixSets[matrixSet]
                .resolutions.length - 1;

            var $zot = $layer.find('div.zot');
            if(zoom > zoomLimit) {
                $zot.attr('title', 'Layer is overzoomed by ' +
                          (zoom - zoomLimit) * 100 + '%' );

                if( !( $layer.hasClass('layer-hidden') ) &&
                    !( $layer.hasClass('zotted') ) ) {
                    $layer.addClass('zotted');
                }
                else if( ( $layer.hasClass('layer-hidden') ) &&
                         ( $layer.hasClass('zotted') ) ) {
                    $layer.removeClass('zotted');
                }
            }
            else {
                $zot.attr('title', 'Layer is zoomed by ' +
                          (zoom - zoomLimit) * 100 + '%' );
                if ( $layer.hasClass('zotted')  ) {
                    $layer.removeClass('zotted');
                }
            }
        }
    };

    var onZoomChange = function(layers) {
        
        _.each(groups, function(group) {
            _.each(model.get({ group: group.id }), function(layer) {
                var $layer = $('#products li.productsitem[data-layer="' +
                               layer.id + '"]');
                checkZots( $layer, layer );
            });
        });
    };

    init();
    return self;
};
