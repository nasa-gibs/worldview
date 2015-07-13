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
 * @class wv.layers.modal
 */
wv.layers.modal = wv.layers.modal || function(models, ui, config) {

    var model = models.layers;
    var self = {};

    self.selector = "#layer-modal";
    self.id = "layer-modal";

    var $addBtn = $("#layers-add");
    var $categoriesGrid = $(self.selector + " #layer-categories");
    var gridItemWidth = 320; //with of grid item + spacing
    var modalHeight;
    var sizeMultiplier;

    var setModalSize = function(){
        var availableWidth = $( window ).width() - ( $( window ).width() * 0.15 );
        sizeMultiplier = Math.floor( availableWidth / gridItemWidth );
        modalHeight = $( window ).height() - 200;
    };
    var redo = function(){
        setModalSize();

        $( self.selector ).dialog( "option", {
            height: modalHeight,
            width: gridItemWidth * sizeMultiplier + 10,
        });
        //$( '.stamp' ).css("width", sizeMultiplier * gridItemWidth - 10 + "px");
    };
    var resize = function(){
        if( $( self.selector ).dialog( "isOpen" ) ) {
            redo();
        }
    };

    var drawCategories = function(){

        $( '#layer-categories' ).isotope( {
            itemSelector: '.layer-category',
            //stamp: '.stamp',
            //sortBy: 'number',
            layoutMode: 'packery',
            packery: {
                gutter: 10,
            },
            //transitionDuration: '0.2s'
        } );
    };
    var addLayer = function(event) {
        model.add(decodeURIComponent($(this).attr("data-layer")));
        console.log('add');

    };

    var removeLayer = function(event) {
        model.remove(decodeURIComponent($(this).attr("data-layer")));
        console.log('remove');
    };

    var onLayerAdded = function(layer) {
        var $element = $( self.selector + " [data-layer='" +
                wv.util.jqueryEscape(layer.id) + "']");
        $element.iCheck("check");
        console.log('added');
    };

    var onLayerRemoved = function(layer) {
        var $element = $( self.selector + " [data-layer='" +
                wv.util.jqueryEscape(layer.id) + "']");
        $element.iCheck("uncheck");
        console.log('removed');
    };

    var drawAll = function(){
        var group = "overlays";
        _.each(config.layerOrder, function(layerId) {
            var layer = config.layers[layerId];
            if ( layer.group === group ) {
                renderLayer(group, layerId);
                //renderLayer("baselayers", layerId);
            }
        });
        group = "baselayers";
        _.each(config.layerOrder, function(layerId) {
            var layer = config.layers[layerId];
            if ( layer.group === group ) {
                renderLayer(group, layerId);
                //renderLayer("baselayers", layerId);
            }
        });

        $(self.selector + " .selectorItem, " + self.selector + " .selectorItem input").on('ifChecked', addLayer);
        $(self.selector + " .selectorItem, " + self.selector + " .selectorItem input").on('ifUnchecked', removeLayer);

        $("#all-layers").iCheck({checkboxClass: 'icheckbox_square-grey'});
    };

    var renderLayer = function(group, layerId) {
        var layer = config.layers[layerId];
        if ( !layer ) {
            console.warn("Skipping unknown layer", layerId);
            return;
        }
        var $label = $("<li></li>")
            .attr("data-layer", encodeURIComponent(layer.id));
        var $element = $("<li></li>")
            .addClass("selectorItem")
            .attr("data-layer", encodeURIComponent(layer.id))
            .addClass("item");

        var names = models.layers.getTitles(layer.id);
        var $name = $("<h4></h4>")
            .addClass("title")
            .html(names.title);
        if ( config.parameters.markPalettes ) {
            if ( layer.palette ) {
                $name.addClass("mark");
            }
        }
        if ( config.parameters.markDownloads ) {
            if ( layer.product ) {
                $name.addClass("mark");
            }
        }
        var $description = $("<p></p>")
            .addClass("subtitle")
            .html(names.subtitle);

        var $checkbox = $("<input></input>")
            .attr("id", encodeURIComponent(layer.id))
            .attr("value", layer.id)
            .attr("type", "checkbox")
            .attr("data-layer", layer.id);
        if ( group === "baselayers" ) {
            $checkbox.attr("name", group);
        }
        if ( _.find(model.active, {id: layer.id}) ) {
            $checkbox.attr("checked", "checked");
        }

        $element.append($checkbox);
        $element.append($name);
        $element.append($description);

        $("#all-layers ul").append($element);
    };

    var render = function(){

        setModalSize();

        $( self.selector ).dialog({
            autoOpen: false,
            resizable: false,
            height: modalHeight,
            width: gridItemWidth * sizeMultiplier + 10,
            modal: true,
            dialogClass: "layer-modal no-titlebar",
            draggable: false,
            title: "Layer Catalog",
            show: {
                effect: "fade",
                duration: 400
            },
            hide: {
                effect: "fade",
                duration: 200
            },
            open: function( event, ui ) {
                redo();

                $( "#layer-categories" ).isotope();
 
                $( ".ui-widget-overlay" ).click( function(e) {
                    $( self.selector ).dialog( "close" );
                } );
            },
            close: function( event, ui ) {
                $( ".ui-widget-overlay" ).unbind( "click" );
            }
        });

        var $header = $( self.selector + " header" );

        var $search = $( "<div></div>" )
            .attr( "id", "layer-search" );

        var $searchInput = $( "<input></input>" )
            .attr( "id", "layers-search-input" )
            .hide()
            ;

        var $searchBtn = $("<label></label>")
            .addClass( "search-icon" )
            .toggle( function( e ) {
                var that = this;
                console.log('click on');
                $searchInput.show( "fast", function(e){
                    console.log('visible');
                    console.log(this);
                    /*$(this).focus().blur(function(e){
                        console.log('blurring');
                        $(that).toggle();
                    });
                    */
                });
                //console.log(e);
            }, function ( e ) {
                console.log('click off');
                $searchInput.hide(function(e){
                    console.log('unblurring');
                    //$(this).off("blur");
                });
                console.log(e);
            } )
            .append( "<i></i>" );

        //$searchInput
        
        
        $search.append( $searchBtn )
            .append( $searchInput );

        $header.append( $search );

        //drawCategories();
        drawAll();
    };

    var init = function(){
        
        model.events
            .on("add", onLayerAdded)
            .on("remove", onLayerRemoved);

        //Create tiles
        render();

        $addBtn.click(function(e){
            $( self.selector ).dialog("open");
        });

        $(window).resize(resize);
    };

    init();
    return self;
};
