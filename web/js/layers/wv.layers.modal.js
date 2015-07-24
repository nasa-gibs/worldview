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
    var selectMeasurement = function(category, selectedMeasurement, selectedIndex){
        console.log( category, selectedMeasurement );
        $selectedCategory.empty();

        var $categoryList = $( '<div></div>' )
            .attr( 'id', category.id + '-list' );

        //Begin Measurement Level
        _.each( category.measurements, function( measurement ) {
            var current = config.measurements[measurement];
            var $measurementHeader = $( '<h3></h3>' )
                .attr('id', 'accordion-' + category.id + '-' + current.id )
                .text(current.title);

            var $sourceTabs = $( '<ul></ul>' );

            var $measurementContent = $( '<div></div>' );

            $measurementContent.append( $sourceTabs );

            //Begin source level
            _.each( current.sources, function( source ) {
                var $sourceTab = $( '<li></li>' );

                var $sourceLink = $( '<a></a>' )
                    .text( source.title )
                    .attr( 'href', '#' + current.id + '-' + source.id );

                $sourceTab.append( $sourceLink );
                $sourceTabs.append( $sourceTab );

                var $sourceContent = $( '<div></div>' )
                    .attr( 'id', current.id + '-' + source.id );

                var $sourceMeta = $( '<p></p>' )
                    .text(source.description);

                if( source.settings.length !== 1 ) {
                    var $sourceSettings = $( '<div></div>' );

                    _.each( source.settings, function( setting ) {
                        var layer = config.layers[setting];
                        var $setting = $( '<input />' )
                            .attr( 'type', 'radio' )
                            .attr( 'id', 'setting-' + layer.id )
                            .attr( 'data-layer', encodeURIComponent( layer.id ) )

                        var $label = $( '<label></label>' )
                            .attr( 'for', 'setting-' + encodeURIComponent( layer.id ) )
                            .text( layer.title );

                        $sourceSettings.append( $setting )
                            .append( $label );

                        $sourceSettings.buttonset();
                        
                    });
                    $sourceContent.append( $sourceMeta );
                    $sourceContent.append( $sourceSettings );
                }
                else {
                    $sourceContent.append( $sourceMeta );
                }
                

                $measurementContent.append( $sourceContent );

            });
            //End source level
            $measurementContent.tabs();

            $categoryList.append( $measurementHeader );
            $categoryList.append( $measurementContent );
            
        });
        //End measurement level

        $categoryList.accordion({
            collapsible: true,
            heightStyle: "content",
            active: false
        });
        
        if( selectedMeasurement ) {
            //config.categories
            $categoryList.accordion( "option", "active", selectedIndex);
        }

        $selectedCategory.append( $categoryList );

        $categoriesGrid.hide();
        $selectedCategory.show();
        
    };

    var createNavBar = function(filter){
        
    };

    var drawCategories = function(){

        _.each(config.categories.scientific, function(category) {
            
            var $category = $('<div></div>')
                .addClass('layer-category layer-category-scientific')
                .attr('id', category.id )
                .append('<h3>' + category.title + '</h3>');

            var $measurements = $('<ul></ul>');

            _.each( category.measurements, function( measurement, index ) {
                var current = config.measurements[measurement];
                var $measurement = $( '<a></a>' )
                    .attr( 'data-category', category.id )
                    .attr( 'data-measurement', current.id )
                    .attr( 'title', category.title + ' - ' + current.title )
                    .text( current.title );

                $measurement.click( function( e ) {
                    console.log(index);
                    selectMeasurement( category, current.id, index );
                });

                var $measurementItem = $( '<li></li>' )
                    .addClass( 'layer-category-item' );

                $measurementItem.append( $measurement );

                $measurements.append( $measurementItem );
            });

            $category.append( $measurements );
            $categoriesGrid.append( $category );
            
        });
        //for legacy categories, combine with each above
        _.each(config.categories['hazards and disasters'], function(category) {

            var $category = $('<div></div>')
                .addClass('layer-category layer-category-legacy')
                .attr('id', category.id )
                .append('<h3>' + category.title + '</h3>');

            var $measurements = $('<ul></ul>');

            _.each( category.measurements, function( measurement, index ) {
                var current = config.measurements[measurement];
                var $measurement = $( '<a></a>' )
                    .attr( 'data-category', category.id )
                    .attr( 'data-measurement', current.id )
                    .attr( 'title', category.title + ' - ' + current.title )
                    .text( current.title );

                $measurement.click( function( e ) {
                    console.log(index);
                    selectMeasurement( category, current.id, index );
                });

                var $measurementItem = $( '<li></li>' )
                    .addClass( 'layer-category-item' );

                $measurementItem.append( $measurement );

                $measurements.append( $measurementItem );
            });

            $category.append( $measurements );
            $categoriesGrid.append( $category );
            
        });

        var $tiles = $( '#layer-categories' ).isotope( {
            itemSelector: '.layer-category',
            //stamp: '.stamp',
            //sortBy: 'number',
            layoutMode: 'packery',
            packery: {
                gutter: 10,
            },
            //transitionDuration: '0.2s'
        });

        _.each(config.categories, function( topCategory, name ) {
            console.log(topCategory, name);
            
            var $filterButton = $( '<input />' )
                .attr( 'type', 'radio')
                .text( name );

            var $label = $( '<label></label>' )
                .text(name);

            if(name === 'hazards and disasters'){
                name = 'legacy';
            };

            $filterButton
                .attr( 'id', 'button-filter-' + name )
                .attr( 'data-filter', name )
                .click( function( e ) {
                    $tiles.isotope({
                        filter: '.layer-category-' + name
                    });
                    //$(this).active();
                    console.log('showing ' + name);
                    
                });

            $label.attr('for', 'button-filter-' + name );

            $('#layer-modal nav').append( $filterButton );

            $('#layer-modal nav').append( $label );

            $('#layer-modal nav').buttonset();            
        });
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
