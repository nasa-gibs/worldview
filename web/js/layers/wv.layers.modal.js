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
    var $selectedCategory = $(self.selector + " #selected-category");
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
    var selectMeasurement = function(category, measurement){
        console.log( category, measurement );
        $selectedCategory.empty();

        var $categoryList = $( '<div></div>' )
            .attr( 'id', category.id + '-list' );

        _.each( category.measurements, function( measurement ) {
            var current = config.measurements[measurement];
            var $measurementHeader = $( '<h3></h3>' )
                .attr('id', 'accordion-' + category.id + '-' + current.id )
                .text(current.title);

            var $measurementContent = $( '<div></div>' );

            var $measurementSources = $( '<ul></ul>' );

            _.each( current.sources, function(source) {
                console.log(source);
            });
        });

        //$categoriesGrid.hide();
        //$selectedCategory.show();
        
    };
    var drawCategories = function(){

        _.each(config.categories.scientific, function(category) {

            var $category = $('<div></div>')
                .addClass('layer-category layer-category-scientific')
                .attr('id', category.id )
                .append('<h3>' + category.title + '</h3>');

            var $measurements = $('<ul></ul>');

            _.each(category.measurements,function(measurement){
                var current = config.measurements[measurement];
                var $measurement = $( '<a></a>' )
                    .attr( 'data-category', category.id )
                    .attr( 'data-measurement', current.id )
                    .attr( 'title', category.title + ' - ' + current.title )
                    .text(current.title);

                $measurement.click(function(e){
                    selectMeasurement(category, current.id);
                });

                var $measurementItem = $( '<li></li>' )
                    .addClass('layer-category-item');

                $measurementItem.append( $measurement );

                $measurements.append( $measurementItem );
            });

            $category.append( $measurements );
            $categoriesGrid.append( $category );
            
        });

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

    };

    var removeLayer = function(event) {
        model.remove(decodeURIComponent($(this).attr("data-layer")));
    };

    var onLayerAdded = function(layer) {
        var $element = $( self.selector + " [data-layer='" +
                wv.util.jqueryEscape(layer.id) + "']");
    };

    var onLayerRemoved = function(layer) {
        var $element = $( self.selector + " [data-layer='" +
                wv.util.jqueryEscape(layer.id) + "']");
    };

    var drawCategary = function(category){
        $selectedCategory.empty().show();
        $categoryGrid.hide();
        
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

        $('#layer-modal-main').css('height', modalHeight - 40);
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

        var $nav = $('<nav></nav>');

        $header.append( $nav );

        $selectedCategory.hide();
        drawCategories();
        //drawAll();
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
