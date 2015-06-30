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

    var resize = function(){
        var h = $(window).height() - 200;
        var w = $(window).width() - 200;
        $( "#product-modal" ).dialog({
            height: h,
            width: w,
        });
    };

    var init = function(){
        var h = $(window).height() - 200;
        var w = $(window).width() - 200;
        $addBtn.click(function(e){
            $( "#product-modal" ).dialog({
                resizable: false,
                height:h,
                width:w,
                modal: true,
                dialogClass:"layer-modal",
                draggable: false,
                title: "Search"
            });
            $('.grid').isotope({
                // options
                itemSelector: '.grid-item',
                layoutMode: 'packery',
                packery: {
                    gutter: 10
                },
                
            });
        });

        
        $(window).resize(resize);
    };

    init();
    return self;
};
