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
wv.palettes = wv.palettes || {};

wv.palettes.custom = wv.palettes.custom || function(config, models, layer) {

    var alignTo = "#products";
    var dialog;
    var $dropDown;
    var self = {};
    var canvas;
    var palettes;

    var init = function() {
        canvas = document.createElement("canvas");
        canvas.width = 100;
        canvas.height = 14;
        var promise = wv.palettes.loadCustom(config).done(loaded);
        wv.ui.indicator.delayed(promise);

        models.layers.events.on("remove", onLayerRemoved);
    };

    var loaded = function(custom) {
        var properties = {
            width: "245px",
            height: "265px",
            visible: false,
            autofillheight: "body",
            constraintoviewport: true ,
            zindex: 210
        };

        // FIXME: SUPER HACK
        if ( wv.dialogs && wv.dialogs.customPalette ) {
            wv.dialogs.customPalette.destroy();
            model.layers.events.off("remove", onLayerRemoved);
            wv.dialogs.customPalette = null;
        }

        var $element = $(alignTo);
        properties.x = Math.ceil($element.offset().left +
                $element.width() + 20);
        properties.y = Math.ceil($element.offset().top);

        dialog = new YAHOO.widget.Panel("palette-selector-dialog",
                properties);
        dialog.setHeader("Select palette");
        dialog.setBody([
            "<div class='product-name'>" + layer.title + "</div>",
            "<div class='product-description'>" +
                layer.subtitle +
            "</div>" +
            "<div id='palette-selector'></div>"
        ].join("\n"));
        dialog.hideEvent.subscribe(function(i) {
            models.layers.events.off("remove", onLayerRemoved);
            if ( wv.dialogs.customPalette === dialog ) {
                wv.dialogs.customPalette = null;
            }
            setTimeout(function() {
                dialog.destroy();
            }, 5);
        });
        dialog.render(document.body);

        palettes = [];
        palettes.push(defaultPalette());
        var recommended = layer.palette.recommended || [];
        _.each(recommended, function(id) {
            palettes.push(customPalette(id));
        });
        _.each(config.paletteOrder, function(id) {
            if ( _.indexOf(recommended, id) < 0 ) {
                palettes.push(customPalette(id));
            }
        });


        $dropDown = $("#palette-selector").msDropDown({
            byJson: {
                name: "Palettes",
                data: palettes,
                width: 225,
            },
            visibleRows: 5,
            rowHeight: 17
        }).data("dd");

        $dropDown.on("change", selectPalette);

        if ( models.palettes.active[layer.id] ) {
            var paletteId = models.palettes.active[layer.id];
            var index = _.findIndex(palettes, { id: paletteId });
            $dropDown.set("selectedIndex", index);
        }
        dialog.show();
        // FIXME: MAJOR HACK
        wv.dialogs = wv.dialogs || {};
        wv.dialogs.customPalette = dialog;
    };

    var defaultPalette = function() {
        var palette = config.palettes.rendered[layer.palette.id];
        wv.palettes.colorbar(canvas, palette);
        return {
            text: "Default",
            image: canvas.toDataURL("image/png")
        };
    };

    var customPalette = function(id) {
        var palette = config.palettes.custom[id];
        wv.palettes.colorbar(canvas, palette);
        return {
            text: palette.name,
            image: canvas.toDataURL("image/png"),
            id: palette.id
        };
    };

    var selectPalette = function() {
        var index = $dropDown.selectedIndex;
        if ( index > 0 ) {
            models.palettes.add(layer.id, palettes[index].id);
        } else {
            models.palettes.remove(layer.id);
        }
    };

    var onLayerRemoved = function(removedLayer) {
        if ( layer.id === removedLayer.id ) {
            dialog.hide();
        }
    };

    init();
    return self;

};

