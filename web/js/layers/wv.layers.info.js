/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2014 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

var wv = wv || {};
wv.layers = wv.layers || {};

wv.layers.info = wv.layers.info || function(config, models, layer) {

    //TODO: Add this information into the DialogBox
    var $d = $("#wv-layers-options-dialog");
    var $layerMeta = $( '<div></div>' )
        .addClass('layer-metadata');

    var $layerMetaTitle = $( '<a>Layer Description</a>' )
        .addClass('layer-metadata-title')
        .on('click', function() {
            $(this).next('.layer-metadata').toggleClass('overflow');
        });

    var $showMore = $('<div></div>')
        .addClass('metadata-more');

    var $dialog;
    var self = {};
    var canvas;

    var init = function() {
        loaded();
    };

    var loaded = function(custom) {
        $dialog = wv.ui.getDialog();
        $dialog
            .attr("id", "wv-layers-info-dialog")
            .attr("data-layer", layer.id);
        renderDescription($dialog);


        var names = models.layers.getTitles(layer.id);
        $dialog.dialog({
            dialogClass: "wv-panel",
            title: names.title,
            show: { effect: "slide", direction: "left" },
            width: 300,
            height: "auto",
            position: {
                my: "left top",
                at: "right+5 top",
                of: $("#products")
            },
            close: dispose
        });
    };

    var dispose = function() {
        wv.ui.closeDialog();
    };

    var renderDescription = function($dialog) {
        // if( layer.description ) {
        // TODO: Pass the description parameter where modis/Aersol is
            $.get('config/metadata/' + 'modis/Aerosol' + '.html')
                .success(function(data) {
                    $layerMeta.html(data);
                    $dialog.append( $layerMeta );
                    //
                    // $layerMeta.find('a')
                    //     .attr('target','_blank');
                    // //More than a thousand chars add show more widget
                    // if ( $layerMeta.text().length > 1000 ) {
                    //     $layerMeta.addClass('overflow')
                    //         .after($showMore);
                    // }
                });
        // }
    };

    var onLayerRemoved = function(removedLayer) {
        if ( layer.id === removedLayer.id && $dialog ) {
            $dialog.dialog("close");
        }
    };

    init();
    return self;

};
