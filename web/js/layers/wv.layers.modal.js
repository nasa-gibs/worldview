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
    var $addBtn = $("#layers-add");
    var self = {};
    var sizeMultiplier;

    var redo = function(){
        var h = $(window).height() - 200;
        var w = $(window).width() - ($(window).width()*0.15);
        var gridItemWidth = 160; //with of grid item + spacing
        sizeMultiplier = Math.floor(w / gridItemWidth);

        $( "#product-modal" ).dialog( "option", {
            height: h,
            width: gridItemWidth * sizeMultiplier + 10,
        });
        $( '.stamp' ).css("width", sizeMultiplier * gridItemWidth - 10 + "px");
    };
    var resize = function(){
        if( $("#product-modal").dialog( "isOpen" ) ) {
            redo();
        }
    };
    var drawCategories = function(){

    };

    var init = function(){
        var h = $(window).height() - 200;
        var w = $(window).width() - ($(window).width()*0.15);
        var gridItemWidth = 160; //with of grid item + spacing

        sizeMultiplier = Math.floor(w / gridItemWidth);

        $( '.stamp' ).css("width", sizeMultiplier * gridItemWidth - 10 + "px");
        
        $( '.grid, .grid2' ).isotope( {
            // options
            itemSelector: '.grid-item',
            stamp: '.stamp',
            sortBy: 'number',
            layoutMode: 'packery',
            packery: {
                gutter: 10,
                //isHorizontal: true
            },
            //transitionDuration: '0.2s'
        } );

        $addBtn.click(function(e){
            $( "#product-modal" ).dialog({
                resizable: false,
                height: h,
                width: gridItemWidth * sizeMultiplier + 10,
                modal: true,
                dialogClass: "layer-modal",
                draggable: false,
                title: "Search",
                show: {
                    effect: "puff",
                    duration: 400
                },
                hide: {
                    effect: "puff",

                    duration: 300
                },
                open: function( event, ui ) {
                    redo();
                    //$('.grid').show(50);
                    $('.grid').isotope();
                    
                    $(".ui-widget-overlay").click(function(e){
                        $( "#product-modal" ).dialog( "close" );
                    });
                },
                close: function( event, ui ) {
                    //$('.grid').hide(50);
                    $(".ui-widget-overlay").unbind("click");
                },
            });

        });

        //$( "#product-modal" ).dialog("close");

        $(window).resize(resize);
    };

    init();
    return self;
};
