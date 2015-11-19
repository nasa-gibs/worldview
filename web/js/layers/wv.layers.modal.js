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
    var $header = $( self.selector + " header" );
    var $categories = $(self.selector + " #layer-categories, " +
                        self.selector + " #categories-nav");

    var $selectedCategory = $(self.selector + " #selected-category");
    var $allLayers = $(self.selector + " #layers-all");
    var gridItemWidth = 320; //with of grid item + spacing
    var modalHeight;
    var sizeMultiplier;

    //Visible Layers
    var visible = {};

    var init = function(){
        _.each(config.layers, function(layer) {
            visible[layer.id] = true;
        });

        model.events
            .on("add", onLayerAdded)
            .on("remove", onLayerRemoved);

        models.proj.events.on("select", onProjectionChange);

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
        modalHeight = $( window ).height() - 100;
    };

    $.fn.hasScrollBar = function() {
        return this.get(0).scrollHeight > this.height();
    };

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

    var filterProjection = function(layer) {
        return config.layers[layer].projections[models.proj.selected.id];
    };

    var drawPage = function() {
        var projection = models.proj.selected.id;
        //console.log(projection);
        if(projection==='geographic') {
            _.each( config.categories['hazards and disasters'].All.measurements,
                    function( measurement ) {
                        _.each( config.measurements[measurement].sources,
                                function( source, sourceIndex ) {
                                    
                                    _.each( source.settings, function( setting ) {
                                        
                                        var fproj = filterProjection(setting);
                                        var layer = config.layers[ setting ];
                                        
                                        if( fproj ) {
                                            var mm = measurement;
                                            return mm;
                                        }
                                        
                                        /*_.each( config.layers[ setting ].projections,
                                          function( proj, projId ) {
                                          
                                          }
                                          );
                                        */
                                    });
                                    
                                }
                              );
                        //console.log(mm);
                    }
                  );
            
            $selectedCategory.hide();
            $allLayers.hide();
            drawCategories();
        }
        else {
            drawAllLayers();
        }
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
                var $sourceMeta = $( '<p></p>' )
                    .text(source.description);

                //$sourceContent.append( $sourceMeta );

                var $sourceSettings = $( '<ul></ul>' );

                _.each( source.settings, function( setting ) {
                    var layer = config.layers[setting];
                    var title;
                    var $wrapper = $('<li></li>')
                        .attr('data-layer', encodeURIComponent(layer.id) )
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
                    $sourceSettings.append( $wrapper );
                    $sourceContent.append( $sourceSettings );

                });

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
            active: false
        });
        
        if( selectedMeasurement ) {
            //config.categories
            $categoryList.accordion( "option", "active", selectedIndex);
        }

        $selectedCategory.append( $categoryList );

        //Create breadcrumb crumbs
        var $homeCrumb = $( '<a></a>' )
            .text('Categories')
            .attr( 'alt', 'categories' )
            .attr( 'title', 'Back to Layer Categories')
            .click( categoriesCrumb );

        $breadcrumb.append( $homeCrumb )
            .append('<b> / ' + category.title + '</b>' );
        $selectedCategory.prepend( $breadcrumb );
        $('#layers-search-input').show();
        searchClickState = 1;

        //Switch navs
        $('#layer-categories, #categories-nav').hide();
        $allLayers.hide();

        $selectedCategory.show();
        $('#layer-modal-main').perfectScrollbar('update');
        $selectedCategory.iCheck({checkboxClass: 'icheckbox_square-red'});
        $breadcrumb.show();
        
    };

    var drawAllLayers = function() {

        $allLayers.empty();

        var $fullLayerList = $( '<ul></ul>' )
            .attr( 'id', 'flat-layer-list' );

        _.each( config.layerOrder, function( layerId ) {

            var current = config.layers[layerId];

            var $layerItem = $( '<li></li>' )
                .attr('id', 'layer-flat-' + current.id )
                .attr("data-layer", encodeURIComponent(current.id))
                .addClass('layers-all-layer');

            var $layerTitle = $( '<h3></h3>' )
                .text( current.title );

            var $layerSubtitle = $('<h5></h5>')
                .text( current.subtitle );

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

        });
        /*
        $(self.selector + " .selectorItem, " + self.selector +
          " .selectorItem input").on('ifChecked', addLayer);
        $(self.selector + " .selectorItem, " + self.selector +
          " .selectorItem input").on('ifUnchecked', removeLayer);
        */
        

        $allLayers.append( $fullLayerList );

        $selectedCategory.hide();
        $('#layer-categories, #categories-nav').hide();
        $allLayers.show();

        $allLayers.iCheck({checkboxClass: 'icheckbox_square-grey'});

        //Create breadcrumb crumbs
        $breadcrumb.empty();

        var $homeCrumb = $( '<a></a>' )
            .text('Categories')
            .attr( 'alt', 'categories' )
            .attr( 'title', 'Back to Layer Categories')
            .click( categoriesCrumb );

        $breadcrumb.append( $homeCrumb )
            .append('<b> / Search Results</b>' );

        $allLayers.prepend( $breadcrumb );
        $('#layers-search-input').show();
        searchClickState = 1;

        $breadcrumb.show();
    };

    var categoriesCrumb = function( e ) {
        searchOpen = 0;
        $selectedCategory.hide();
        $allLayers.hide();
        $breadcrumb.hide();
        $( '#layers-search-input' ).val('');
        $( '#layer-search label.search-icon' ).removeClass('search-on');
        searchClickState = 0;
        $( '#layer-categories, #categories-nav' ).show();
        $( "#layer-categories" ).isotope();
        
    };

    var cssName = function(name){
        if ( name === 'hazards and disasters' ) {
            return 'legacy';
        }
        else return name;
    };

    var replaceIfScientific = function(name){
        if(name === 'scientific'){
            return 'science discipline';
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
                    console.log(measurement, index);
                    if(index > 5){
                        setCategoryOverflow(category, $measurements);
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

            var $filterButton = $( '<input />' )
                .attr( 'type', 'radio')
                .text( replaceIfScientific(metaCategoryName) );

            var $label = $( '<label></label>' )
                .text( replaceIfScientific(metaCategoryName) );

            $filterButton
                .attr( 'id', 'button-filter-' + cssName(metaCategoryName) )
                .attr( 'data-filter', cssName(metaCategoryName) )
                .click( function( e ) {
                    $tiles.isotope({
                        filter: '.layer-category-' + cssName(metaCategoryName)
                    });
                    $('#categories-nav .ui-button').removeClass('nav-selected');
                    $("label[for=" + $(this).attr("id") + "]")
                        .addClass('nav-selected');
                });

            $label.attr('for', 'button-filter-' + cssName(metaCategoryName) );

            $nav.append( $filterButton );
            $nav.append( $label );
            //Create radiobuttons with filter buttons
            $nav.buttonset();

            console.log($('#layer-modal-main').hasScrollBar());
        });
        
        var $tiles = $( '#layer-categories' ).isotope( {
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

        });

        $('#layer-modal-main').prepend( $nav );

        $('label[for=button-filter-legacy]').addClass('nav-selected');

        _.each(config.categories, function( topCategory, name ) {
     
        });
    };
    var addLayer = function(event) {
        model.add( decodeURIComponent( $( this ).val() ) );

    };

    var removeLayer = function(event) {
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
    var onProjectionChange = function() {
        var proj = models.proj.selected.id;
        console.log(proj);
        if(proj === 'geographic'){
            categoriesCrumb();
        }
        else{
            filter();
        }
        
    };
    var render = function(){

        setModalSize();

        $( '#layer-modal-main' ).css( 'height', modalHeight - 40 )
            .perfectScrollbar();

        var $search = $( "<div></div>" )
            .attr( "id", "layer-search" );

        var $searchInput = $( "<input></input>" )
            .attr( "id", "layers-search-input" )
            .attr( 'placeholder', 'Search');

        var searchClickState = 0;

        var $searchBtn = $("<label></label>")
            .addClass( "search-icon" )
            .click( function( e ) {
                var that = this;
                if ( searchClickState === 0 ) {
                    searchClickState = 1;
                    console.log('click on');
                    $('#layers-search-input').focus();
                    //$(this).addClass('search-on');
                    //$nav.hide();
                    //drawAllLayers();
                }
                else if ( searchClickState === 1 ) {
                    searchClickState = 0;
                    console.log('click off');
                    $searchInput.val('');
                    //$searchInput.hide();
                    $(this).removeClass('search-on');
                    //$nav.show();
                }
            } )
            .append( "<i></i>" );

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
                
                $( "#layer-categories" ).isotope();
 
                $( ".ui-widget-overlay" ).click( function( e ) {
                    $( self.selector ).dialog( "close" );
                } );
                /*var current = $searchInput.val();
                $( window ).keypress( function ( e ) {
                    if ( e.which !== 0 &&
                        !e.ctrlKey && !e.metaKey && !e.altKey
                       ) {
                        if( searchClickState === 0){
                            $searchBtn.click();
                        }
                    }
                });*/
            },
            close: function( event, ui ) {
                $( ".ui-widget-overlay" ).unbind( "click" );
            }
        });
        
        
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

        //$(self.selector + "select").on('change', filter);
        $searchInput.on('keyup', filter);

        drawPage();
    };

    var searchTerms = function() {
        var search = $("#layers-search-input").val().toLowerCase();
        var terms = search.split(/ +/);
        return terms;
    };

    var filterAreaOfInterest = function(layerId) {
        if ( !config.aoi ) {
            return false;
        }
        var aoi = $(self.selector + "select").val();
        if ( aoi === "All" ) {
            return false;
        }
        return $.inArray(layerId, config.aoi[aoi].baselayers) < 0 &&
               $.inArray(layerId, config.aoi[aoi].overlays) < 0;
    };
    //Similar name to another var above
    var filterProjections = function(layer) {
        return !layer.projections[models.proj.selected.id];
    };

    var filterSearch = function(layer, terms) {
        var search = $(self.selector + "search").val();
        if ( search === "" ) {
            return false;
        }
        var filtered = false;
        var names = models.layers.getTitles(layer.id);
        $.each(terms, function(index, term) {
            filtered = !names.title.toLowerCase().contains(term) &&
                       !names.subtitle.toLowerCase().contains(term) &&
                       !names.tags.toLowerCase().contains(term);
            if ( filtered ) {
                return false;
            }
        });
        return filtered;
    };
    var searchOpen = 0;
    var filter = _.throttle(function() {
        var search = searchTerms();
        $.each(config.layers, function(layerId, layer) {            
            //var faoi = filterAreaOfInterest(layerId);
            var fproj = filterProjections(layer);
            var fterms = filterSearch(layer, search);
            /*
            if ( layerId.startsWith("carto") ) {
                console.log(layerId, "faoi", faoi, "fproj", fproj, "fterms", fterms);
                console.log(wv.util.jqueryEscape(layerId));
            }
            */
            var filtered = fproj || fterms;
            visible[layer.id] = !filtered;
            if(searchOpen) {
                var display = filtered ? "none": "block";
                var selector = "#flat-layer-list li[data-layer='" +
                    wv.util.jqueryEscape(layerId) + "']";
                $(selector).css("display", display);
            }
            else {
                drawAllLayers();
                searchOpen = 1;
                searchClickState = 1;
                $('label.search-icon').addClass('search-on');
                $('label.search-on').click(categoriesCrumb);
            }
        });
        //adjustCategoryHeights();
    }, 250, { trailing: true });

    init();
    return self;
};
