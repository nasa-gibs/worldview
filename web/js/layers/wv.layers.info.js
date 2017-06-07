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

    var $dialog;
    var self = {};
    var canvas;
    var description;
    var $d = $("#wv-layers-options-dialog");
    var $layerMeta = $( '<div></div>' )
        .addClass('layer-metadata source-metadata');

    var $layerMetaTitle = $( '<a>Layer Description</a>' )
        .addClass('layer-metadata-title')
        .on('click', function() {
            $(this).next('.layer-metadata').toggleClass('overflow');
        });

    var $showMore = $('<div></div>')
        .addClass('metadata-more');

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
            height: 300,
            position: {
                my: "left top",
                at: "right+5 top",
                of: $("#products")
            },
            // Wait for the dialog box to load, then force scroll to top
            open : function () {
                $(this).parent().promise().done(function () {
                    $('.ui-dialog-content').scrollTop('0');
                });
            },
            close: dispose
        });
    };

    var dispose = function() {
        wv.ui.closeDialog();
    };

    // Check if this layer.id is in measurements.[name].sources.settings,
    // if it is, set the description for this layer.
    _.each(config.measurements, function( measurement, measurementKey ) {
        _.each(measurement.sources, function( source, sourceKey ) {
            _.each(source.settings, function( setting, settingKey ) {
                if(layer.id == setting) {
                    description = source.description;
                }
            });
        });
    });

    var renderDescription = function($dialog) {
        if( description ) {
            $.get('config/metadata/' + description + '.html')
                .success(function(data) {
                    $layerMeta.html(data);
                    $dialog.append( $layerMeta );
                }
            );
        }
    };

    var onLayerRemoved = function(removedLayer) {
        if ( layer.id === removedLayer.id && $dialog ) {
            $dialog.dialog("close");
        }
    };

    init();
    return self;

};
