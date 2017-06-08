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
        $dialog = null;
        wv.ui.closeDialog();
    };

    var renderDescription = function($dialog) {
        var $layerMeta = $('<div></div>')
            .addClass('layer-metadata source-metadata');
        var $layerMetaTitle = $('<a>Layer Description</a>')
            .addClass('layer-metadata-title');

        if( layer.description ) {
            $.get('config/metadata/' + layer.description + '.html')
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
