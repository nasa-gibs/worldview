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
 * @class wv.layers.search
 */
wv.layers.search = wv.layers.search || function(models, ui, config) {

    var init = function(){
        
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
                !names.tags.toLowerCase().contains(term) &&
                !config.layers[layer.id].id.toLowerCase().contains(term);
            
            if ( filtered ) {
                return false;
            }
        });
        return filtered;
    };

    var runSearch = _.throttle( function() {
        var search = searchTerms();

        $.each(config.layers, function(layerId, layer) {           

            var fproj = filterProjections(layer);
            var fterms = filterSearch(layer, search);

            var filtered = fproj || fterms;

            visible[layer.id] = !filtered;

            var display = filtered ? "none": "block";
            var selector = "#flat-layer-list li[data-layer='" +
                wv.util.jqueryEscape(layerId) + "']";
            $(selector).css("display", display);
        });

        redoScrollbar();
    }, 250, { trailing: true });

    var filter = function( e ) {

        if( $( '#layers-search-input' ).val().length !== 0 ) {
            searchBool = true;
        }
        else{
            searchBool = false;

            if (models.proj.selected.id === 'geographic' && config.categories){
                $allLayers.hide();
                $categories.show().isotope();
                $nav.show();
            }
            else{
                drawAllLayers();
            }
            removeSearch();
        }
        // Ran on every keystroke in search
        if( searchBool ) {
            if( ( $allLayers.css('display') === 'none' ) ||
                ( $breadcrumb.css('display') === 'none') ) {
                drawAllLayers();
            }
            runSearch();
        }
        //Opening state for non-geographic projections
        else if( ( searchBool === false ) &&
                 ( models.proj.selected.id !== 'geographic' ) ) {
            runSearch();
        }
    };
    

    init();
    return self;
};
