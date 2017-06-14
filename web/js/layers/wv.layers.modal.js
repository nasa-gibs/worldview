/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013-2017 United States Government as represented by the
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

    self.selector = '#layer-modal';
    self.id = 'layer-modal';

    var $addBtn = $('#layers-add');
    var $header = $( self.selector + ' header' );
    var $categories = $(' #layer-categories ');
    //var $categoriesNav = $(' #categories-nav ');

    var $selectedCategory = $(self.selector + " #selected-category");
    var $allLayers = $(self.selector + " #layers-all");
    var gridItemWidth = 320; //with of grid item + spacing
    var modalHeight;
    var sizeMultiplier;
    var searchBool;

    //Visible Layers
    var visible = {};

    var init = function() {
        _.each(config.layers, function(layer) {
            visible[layer.id] = true;
        });
        model.events
        //FIXME: on "add" needs to be present without trying to add a product
        // multiple times
            //.on("add", onLayerAdded)
            .on("remove", onLayerRemoved);
        models.proj.events.on("select", drawDefaultPage );

        //Create tiles
        render();

        $addBtn.click(function(e){
            $( self.selector ).dialog("open");
        });

        $(window).resize(resize);
    };

    //Create container for 'by interest' filters buttons
    var $nav = $('<nav></nav>')
        .attr( 'id', 'categories-nav' );
    
    //Create container for breadcrumb
    var $breadcrumb = $('<nav></nav>')
        .attr( 'id', 'category-breadcrumb' );

    var setModalSize = function(){
        var availableWidth = $( window ).width() - ( $( window ).width() * 0.15 );
        sizeMultiplier = Math.floor( availableWidth / gridItemWidth );
        if(sizeMultiplier < 1) sizeMultiplier = 1;
        if(sizeMultiplier > 3) sizeMultiplier = 3;
        modalHeight = $( window ).height() - 100;
    };

    $.fn.hasScrollBar = function() {
        return this.get(0).scrollHeight > this.height();
    };

    //Update modal size
    var redo = function(){
        setModalSize();

        $( self.selector ).dialog( "option", {
            height: modalHeight,
            width: gridItemWidth * sizeMultiplier + 10,
        });
        
        $( '#layer-modal-main' ).css( 'height', modalHeight - 40 )
            .perfectScrollbar('update');

        //$( '.stamp' ).css("width", sizeMultiplier * gridItemWidth - 10 + "px");
    };

    var redoScrollbar = function(){
        $( '#layer-modal-main' ).perfectScrollbar('update');
    };

    var filterProjection = function(layer) {
        return config.layers[layer].projections[models.proj.selected.id];
    };
    //This draws the default page, depending on projection
    // and hides the breadcrumb, and sets the search back to normal
    // and updates the scrollbar.
    var removeSearch = function(){
        $selectedCategory.hide();
        $breadcrumb.hide();
        searchBool = false;
        $( '#layers-search-input' ).val('');
        $( '#layer-search label.search-icon' ).removeClass('search-on').off('click');
    };
    //Render default view
    var drawDefaultPage = function( e ) {
        var projection = models.proj.selected.id;

        removeSearch();

        //Check to see if the config has categories?
        if( projection === 'geographic' && config.categories ) {
            $allLayers.hide();
            drawCategories();
        }
        else {
            //Draw products, not categories/measurements
            drawAllLayers();
            //Show all products (because nothing is in search)
            filter();
        }

        redoScrollbar();

    };
    //Return to default view
    var showDefaultPage = function( e ){
        var projection = models.proj.selected.id;

        removeSearch();

        if( projection === 'geographic' ) {

            $allLayers.hide();
            //show already rendered categories/measurements
            //and update isotope
            $categories.show().isotope();
            $nav.show();
            
        }
        else {
            //Show all products (because nothing is in search)
            filter();
        }

        redoScrollbar();
    };
    var resize = function(){
        if( $( self.selector ).dialog( "isOpen" ) ) {
            redo();
        }
    };
    var drawMeasurements = function(category, selectedMeasurement, selectedIndex){

        $selectedCategory.empty();
        $breadcrumb.empty();

        var $categoryList = $( '<div></div>' )
            .attr( 'id', category.id + '-list' );

        //Begin Measurement Level
        _.each( category.measurements, function( measurement, measurementName ) {

            var current = config.measurements[measurement];

            var $measurementHeader = $( '<div></div>' )
                .attr('id', 'accordion-' + category.id + '-' + current.id );

            var $measurementTitle = $( '<h3></h3>' )
                .text( current.title );

            var $measurementSubtitle = $('<h5></h5>')
                .text( current.subtitle );

            var $sourceTabs = $( '<ul></ul>' );

            var $measurementContent = $( '<div></div>' );

            $measurementContent.append( $sourceTabs );

            //Begin source level
            _.each( current.sources, function( source, souceName ) {

                var $sourceTab = $( '<li></li>' );

                var $sourceLink = $( '<a></a>' )
                    .text( source.title )
                    .attr( 'href', '#' + current.id + '-' + source.id );

                $sourceTab.append( $sourceLink );
                $sourceTabs.append( $sourceTab );

                var $sourceContent = $( '<div></div>' )
                    .attr( 'id', current.id + '-' + source.id );

                //Metadata

                var $sourceMeta = $( '<div></div>' )
                    .addClass('source-metadata');

                var $showMore = $('<div></div>')
                    .addClass('metadata-more');

                var $moreElps = $('<span></span>')
                    .addClass('ellipsis')
                    .text('...');

                $showMore.append( $moreElps );

                $showMore.toggle( function(e){
                    $sourceMeta.removeClass('overflow');
                    $moreElps.text('^').addClass('up');
                    redoScrollbar();
                }, function(e){
                    $sourceMeta.addClass('overflow');
                    $moreElps.text('...').removeClass('up');
                    redoScrollbar();
                });

                //Simple test to see if theres a link to some metadata
                if( source.description ) {
                    $.get('config/metadata/' + source.description + '.html')
                        .success(function(data) {
                            $sourceMeta.html(data);
                            $sourceContent.append( $sourceMeta );

                            $sourceMeta.find('a')
                                .attr('target','_blank');
                            //More than a thousand chars add show more widget
                            if ( $sourceMeta.text().length > 1000 ) {
                                $sourceMeta.addClass('overflow')
                                    .after($showMore);
                            }
                        });
                }

                var $sourceSettings = $( '<ul></ul>' )
                    .addClass('source-settings');

                var $sourceOrbits = $( '<ul></ul>' )
                    .addClass('source-orbit-tracks')
                    .attr('id', source.id + '-orbit-tracks');

                _.each( source.settings, function( setting ) {

                    var layer = config.layers[setting];

                    var $wrapper = $('<li></li>')
                        .attr('data-layer', encodeURIComponent(layer.id) )
                        .attr( 'value', encodeURIComponent( layer.id ) )
                        .addClass('measurement-settings-item');
                        
                    var $setting = $( '<input></input>' )
                        .attr( 'type', 'checkbox' )
                        .addClass( 'settings-check')
                        .attr( 'id', 'setting-' + layer.id )
                        .attr( 'value', encodeURIComponent( layer.id ) )
                        //maybe dont need value and data-layer both
                        .attr( 'data-layer', encodeURIComponent( layer.id ) )
                        .on('ifChecked', addLayer)
                        .on('ifUnchecked', removeLayer);

                    if ( _.find(model.active, {id: layer.id}) ) {
                        $setting.attr("checked", "checked");
                    }

                    var $label = $( '<label></label>' )
                        .attr( 'for', 'setting-' + encodeURIComponent( layer.id ) )
                        .text( layer.title );

                    $wrapper.append( $setting )
                        .append( $label );

                    //If this is an orbit track.... put it in the orbit track list
                    if(layer.title.indexOf("Orbital Track") !== -1){
                        var orbitTitle;
                        // The following complex if statement is a placeholder
                        // for truncating the layer names, until the rest of
                        // the interface is implemented

                        if( layer.title.indexOf('(') !== -1 ) {
                            var regExp = /\(([^)]+)\)/;
                            var matches = regExp.exec(layer.title);
                            orbitTitle = matches[1];
                        }
                        $label.empty().text(orbitTitle);
                        $sourceOrbits.append( $wrapper );
                    }
                    else{
                        $sourceSettings.append( $wrapper );
                    }
                    $wrapper.click( function( e ){
                        e.stopPropagation();
                        var $checkbox = $( this )
                            .find( 'input#setting-' + layer.id );

                        $checkbox.iCheck('toggle');
                    });

                });

                $sourceContent.append( $sourceSettings );

                if($sourceOrbits.children().length > 0){
                    var $orbitsTitle = $('<h3></h3>')
                        .addClass('source-orbits-title')
                        .text('Orbital Tracks:');

                    $sourceContent.append( $orbitsTitle );
                    $sourceContent.append( $sourceOrbits );
                }

                //$sourceContent.append( $addButton, $removeButton );
                $measurementContent.append( $sourceContent );
                

            });
            //End source level
            $measurementContent.tabs();

            $measurementHeader.append( $measurementTitle );
            $measurementHeader.append( $measurementSubtitle );

            $categoryList.append( $measurementHeader );
            $categoryList.append( $measurementContent );
            
        });
        //End measurement level
        

        $categoryList.accordion({
            collapsible: true,
            heightStyle: "content",
            animate: false,
            active: false,
            activate: function( event, ui ) {
                redoScrollbar();
            }
        });
        if( selectedMeasurement ) {
            $categoryList.accordion( "option", "active", selectedIndex);
        }

        $selectedCategory.append( $categoryList );

        //Create breadcrumb crumbs
        var $homeCrumb = $( '<a></a>' )
            .text('Categories')
            .attr( 'alt', 'categories' )
            .attr( 'title', 'Back to Layer Categories')
            .click( showDefaultPage );

        $breadcrumb.append( $homeCrumb )
            .append('<b> / ' + category.title + '</b>' );
        $selectedCategory.prepend( $breadcrumb );
        $('#layers-search-input').show();

        //Switch navs
        $categories.hide();
        $nav.hide();
        $allLayers.hide();

        $selectedCategory.show();
        redoScrollbar();
        $selectedCategory.iCheck({checkboxClass: 'icheckbox_square-red'});
        $breadcrumb.show();
        
    };

    var drawAllLayers = function() {

        $allLayers.empty();
        if( $categories.data('isotope') && models.proj.selected.id !== 'geographic' ) {
            $categories.isotope('destroy');
            $categories.empty();
        }

        var $fullLayerList = $( '<ul></ul>' )
            .attr( 'id', 'flat-layer-list' );

        _.each( config.layerOrder, function( layerId ) {

            var current = config.layers[layerId];
            if ( !current ) {
                console.warn("In layer order but not defined", layerId);
            }
            else {
                var $layerItem = $( '<li></li>' )
                    .attr('id', 'layer-flat-' + current.id )
                    .attr("data-layer", encodeURIComponent(current.id))
                    .addClass('layers-all-layer')
                    .click( function( e ){
                        $( this ).find('input#' + encodeURIComponent(current.id))
                            .iCheck('toggle');
                    });

                var $layerTitle = $( '<h3></h3>' )
                    .text( current.title );

                var $layerSubtitle = $('<h5></h5>')
                    .append( current.subtitle );

                var $checkbox = $("<input></input>")
                    .attr("id", encodeURIComponent(current.id))
                    .attr("value", current.id)
                    .attr("type", "checkbox")
                    .attr("data-layer", current.id)
                    .on('ifChecked', addLayer)
                    .on('ifUnchecked', removeLayer);

                if ( _.find(model.active, {id: current.id}) ) {
                    $checkbox.attr("checked", "checked");
                }

                $layerItem.append( $checkbox );
                $layerItem.append( $layerTitle );
                $layerItem.append( $layerSubtitle );

                $fullLayerList.append( $layerItem );
            }

        });


        $allLayers.append( $fullLayerList );

        $selectedCategory.hide();
        $categories.hide();
        $nav.hide();
        $allLayers.show();

        $allLayers.iCheck( { checkboxClass: 'icheckbox_square-red' } );

        //Create breadcrumb crumbs
        $breadcrumb.empty();


        //If this is not the geographic projection, All layers are always drawn
        // and filtered, so thats the default page. Dont show breadcrumb

        if( searchBool ) {

            var crumbText;
            if( models.proj.selected.id !== 'geographic' ){
                crumbText = 'Layers';
            }
            else {
                crumbText = 'Categories';
            }
            var $homeCrumb = $( '<a></a>' )
                .text( crumbText )
                .attr( 'alt', crumbText )
                .attr( 'title', 'Back to ' + crumbText )
                .click( showDefaultPage );

            $breadcrumb.append( $homeCrumb )
                .append('<b> / Search Results</b>' );

            $allLayers.prepend( $breadcrumb );
            $( '#layers-search-input' ).show();

            $( 'label.search-icon' ).addClass( 'search-on' );
            $( 'label.search-on' ).click( showDefaultPage );

            $breadcrumb.show();

        }
    };

    var cssName = function(name){
        if ( name === 'hazards and disasters' ) {
            return 'legacy';
        }
        else return name;
    };

    var replaceIfScientific = function(name){
        if(name === 'scientific'){
            return 'science disciplines';
        }
        else return name;
    };
    var setCategoryOverflow = function(category, $measurements){
        var $dotContinueItem = $('<li></li>')
            .addClass('layer-category-item');

        var $dotContinueLink = $('<a></a>')
            .attr('data-category', category.id)
            .text('...');

        $dotContinueLink.click( function( e ) {
            drawMeasurements( category );
        });

        $dotContinueItem.append( $dotContinueLink );
        $measurements.append( $dotContinueItem );
    };
    var drawCategories = function(){

        $categories.empty();
        if( $categories.data('isotope') ) {
            $categories.isotope('destroy');
        }

        $nav.empty();

        _.each( config.categories, function( metaCategory, metaCategoryName ) {

            _.each(config.categories[metaCategoryName], function( category, name ) {
                var sortNumber;

                if(category.placement){
                    if (category.placement === 'first'){
                        sortNumber = 1;
                    }
                    else if(category.placement === 'last'){
                        sortNumber = 3;
                    }
                }
                else sortNumber = 2;
                var $category = $( '<div></div>' )
                    .attr('data-sort', sortNumber)
                    .addClass( 'layer-category layer-category-' + cssName(metaCategoryName) )
                    .attr( 'id', category.id );
                if(category.image){
                    $category
                        .css('background-image','url("images/wv.layers/categories/' + category.image + '")');
                }

                var $categoryOpaque = $('<div></div>')
                    .addClass('category-background-cover');

                $category.append( $categoryOpaque );

                var $categoryTitle = $( '<h3></h3>' );

                var $categoryLink = $( '<a></a>' )
                    .text( category.title )
                    .attr( 'alt', category.title )
                    .addClass('layer-category-name')
                    .click( function( e ) {
                        drawMeasurements( category );
                    });
                
                $categoryTitle.append( $categoryLink );
                $categoryOpaque.append( $categoryTitle );

                var $measurements = $('<ul></ul>');

                _.each( category.measurements, function( measurement, index ) {
                    if(index > 5){
                        setCategoryOverflow(category, $measurements);
                    }

                if (config.measurements[measurement] === undefined){
                    throw new Error("Error: Measurement '" + measurement +
                                        "' stated in category '" +
                                        category.title + "' does not exist " +
                                        "in measurement list!");
                }
                    var current = config.measurements[measurement];
                    var $measurement = $( '<a></a>' )
                        .attr( 'data-category', category.id )
                        .attr( 'data-measurement', current.id )
                        .attr( 'title', category.title + ' - ' + current.title )
                        .text( current.title );

                    $measurement.click( function( e ) {
                        drawMeasurements( category, current.id, index );
                    });

                    var $measurementItem = $( '<li></li>' )
                        .addClass( 'layer-category-item' );

                    $measurementItem.append( $measurement );

                    $measurements.append( $measurementItem );
                });

                $categoryOpaque.append( $measurements );
                
                $categories.append( $category );

            });

            $categories.show();

            var $filterButton = $( '<input />' )
                .attr( 'type', 'radio')
                .text( replaceIfScientific( metaCategoryName ) );

            var $label = $( '<label></label>' )
                .text( replaceIfScientific( metaCategoryName ) );

            $filterButton
                .attr( 'id', 'button-filter-' + cssName( metaCategoryName ) )
                .attr( 'data-filter', cssName( metaCategoryName ) )
                .click( function( e ) {
                    $categories.isotope({
                        filter: '.layer-category-' + cssName( metaCategoryName )
                    });
                    $nav.find('.ui-button').removeClass( 'nav-selected' );
                    $("label[for=" + $(this).attr("id") + "]")
                        .addClass('nav-selected');
                });

            $label.attr('for', 'button-filter-' + cssName( metaCategoryName ) );

            $nav.append( $filterButton );
            $nav.append( $label );
            //Create radiobuttons with filter buttons
            $nav.buttonset();
            $nav.show();
        });
        
        $categories.isotope( {
            itemSelector: '.layer-category',
            //stamp: '.stamp',
            getSortData: {
                name: '.layer-category-name', // text from querySelector
                order: '[data-sort]'
            },
            sortBy: [ 'order', 'name' ],
            filter: '.layer-category-legacy',
            masonry: {
                gutter: 10
            }

        } );

        $('#layer-modal-main').prepend( $nav );

        $('label[for=button-filter-legacy]').addClass('nav-selected');
        
    };
    var addLayer = function(event) {
        event.stopPropagation();
        model.add( decodeURIComponent( $( this ).val() ) );

    };

    var removeLayer = function(event) {
        event.stopPropagation();
        model.remove( decodeURIComponent( $( this ).val() ) );
    };
    var onLayerAdded = function(layer) {
        var $element = $( self.selector + " [data-layer='" +
                          wv.util.jqueryEscape(layer.id) + "']");
        $element.iCheck("check");
    };
    
    var onLayerRemoved = function(layer) {
        var $element = $( self.selector + " [data-layer='" +
                          wv.util.jqueryEscape(layer.id) + "']");
        $element.iCheck("uncheck");
    };
    //Blur input if on mobile
    var unfocusInput = function(){
        if(!wv.util.browser.small){
            $('#layers-search-input').focus();
        }
        else {
            $('#layers-search-input').blur();
            $('#layer-modal-main').focus();
        }
    };
    //Initial render
    var render = function(){

        setModalSize();

        $( '#layer-modal-main' )
            .css( 'height', modalHeight - 40 )
            .perfectScrollbar();

        var $search = $( "<div></div>" )
            .attr( "id", "layer-search" );

        var $searchInput = $( "<input></input>" )
            .attr( "id", "layers-search-input" )
            .attr( 'placeholder', 'Search');

        var $searchBtn = $("<label></label>")
            .addClass( "search-icon" )
            .click( function( e ) {
                var that = this;
                //TODO: Click for search icon
            } )
            .append( "<i></i>" );

        $search.append( $searchBtn )
            .append( $searchInput );

        $header.append( $search );

        var $closeButton = $('<div></div>')
            .attr('id', 'layers-modal-close')
            .click( function( e ) {
                $( self.selector ).dialog( "close" );
            })
            .append('<i></i>');
        
        $header.append ( $closeButton );

        //Create dialog/modal
        //TODO: move to general dialog creator (wv.ui)
        $( self.selector ).dialog({
            autoOpen: false,
            resizable: false,
            height: modalHeight,
            width: gridItemWidth * sizeMultiplier + 10,
            modal: true,
            dialogClass: "layer-modal no-titlebar",
            draggable: false,
            title: "Layer Picker",
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

                //Check for isotope
                if( $categories.data('isotope') ) {
                    //Update isotope
                    $categories.isotope()
                        .on('layoutComplete',
                            function( event, laidOutItems ) {
                                //Update scrollbar sizing
                                redoScrollbar();
                            });
                }
                //Bind click outside modal as close
                $( ".ui-widget-overlay" ).click( function( e ) {
                    $( self.selector ).dialog( "close" );
                } );

                //FIXME: Mobile keyboard needs to disappear,
                //fade in time for show is 400 above, so after that
                setTimeout(unfocusInput, 410);

            },
            close: function( event, ui ) {
                $( ".ui-widget-overlay" ).unbind( "click" );
            }
        });

        //$(self.selector + "select").on('change', filter);
        $searchInput.keyup( filter );

        drawDefaultPage();
    };

    var searchTerms = function() {
        var search = $("#layers-search-input").val().toLowerCase();
        var terms = search.split(/ +/);
        return terms;
    };




    init();
    return self;
};
