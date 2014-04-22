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
wv.image = wv.image || {};

wv.image.rubberband = wv.image.rubberband || function(models, config) {

    var self = {};

    var PALETTE_WARNING =
        "Image download does not yet support the custom palette(s) that you " +
        "have applied. Would you like to continue with the default color palette(s)?";

    var containerId = "wv-image-button";
    var container;
    var selector = "#" + containerId;
    var coords = null;
    var previousCoords = null;
    var icon = "images/camera.png";
    var onicon = "images/cameraon.png";
    var cropee = "map";
    var id = containerId;
    var state = "off";
    var jcropAPI = null;
    var previousPalettes = "";
    var currentPalettes = "";
    var $button;
    self.events = wv.util.events();

    /**
      * Initializes the RubberBand component.
      *
      * @this {RubberBand}
    */
    var init = function(){
        container=document.getElementById(containerId);
        if (container===null){
            throw new Error("Error: element '"+containerId+"' not found!");
        }
        $button = $("<input></input>")
            .attr("type", "checkbox")
            .attr("id", "wv-image-button-check")
            .val("");
        var $label = $("<label></label>")
            .attr("for", "wv-image-button-check")
            .attr("title", "Take a snapshot");
        var $icon = $("<i></i>")
            .addClass("fa")
            .addClass("fa-camera")
            .addClass("fa-2x");
        $label.append($icon);
        $(selector).append($label);
        $(selector).append($button);
        $button.button({
            text: false
        });
        $button.on('click', toggle);
    };

    var toolbarButtons = function(action) {
        $("#wv-info-button .ui-button").button(action);
        $("#wv-proj-button .ui-button").button(action);
        $("#wv-link-button input").button(action);
    };

    var toggle = function(){
        var checked = $("#wv-image-button-check").prop("checked");

        var toggleOn = function() {
            state = "on";
            toolbarButtons("disable");
            self.events.trigger("show");
            $(".ui-dialog").on("dialogclose", function() {
                if ( state === "on" ) {
                    toggle();
                }
            });
            draw();
        };

        // When disabling the palettes, we need to wait for the map to reload all
        // the tiles before enabling the crop box. The crop box copies all
        // elements in the map to do its background effect and if the map isn't
        // ready yet, it will copy blank images.
        var disablePalettes = function() {
            var map = models.map.maps.map;
            var handler = function() {
                map.events.unregister("maploadend", map, handler);
                toggleOn();
            };
            map.events.register("maploadend", map, handler);

            // Save the previous state to be restored later
            previousPalettes = models.palettes.active;
            // FIXME: What is this for?
            // self.paletteWidget.noRestore = true;
            models.palettes.clear();
        };

        if(state == "off") {
            // Confirm with the user they want to continue, and if so, disable
            // the palettes before bringing up the crop box.
            if ( models.palettes.inUse() ) {
                wv.ui.ask({
                    header: "Notice",
                    message: PALETTE_WARNING,
                    onOk: disablePalettes
                });
            } else {
                toggleOn();
            }
        }
        else {
            state = "off";
            $button.prop("checked", false).button("refresh");
            jcropAPI.destroy();
            if (previousPalettes) {
                // FIXME: What is this for?
                //self.paletteWidget.noResture = false;
                _.each(previousPalettes, function(paletteId, layerId) {
                    models.palettes.add(layerId, paletteId);
                });
            }
            toolbarButtons("enable");
            wv.ui.closeDialog();
        }
    };

    /**
      * Sets the values for the rubberband (x1, y1, x2, y2, width, height) from the passed "coordinates" object of JCrop  *
      * @this {RBand}
      * @param {String} coordinates object of JCrop
      *
    */
    var setCoords = function(c) {
        previousCoords = coords;
        coords = c;
        self.events.trigger("update", coords);
    };

    /**
      * Activates the drawing on the map.
      *
      * @this {RBand}
      *
      *
    */
    var draw =  function() {

        $("#"+cropee).Jcrop({
                bgColor:     'black',
                bgOpacity:   0.3,
                onSelect:  function(c){previousCoords=coords;handleChange(c);},
                onChange: function(c){handleChange(c);},
                onRelease: function(c){ coords=previousCoords; toggle(); },
                fullScreen: true
                });

        jcropAPI = $('#'+cropee).data('Jcrop');

        if(coords) {
            jcropAPI.setSelect([coords.x, coords.y,coords.x2,coords.y2]);
        }
        else {
            jcropAPI.setSelect([($(window).width()/2)-100,($(window).height()/2)-100,($(window).width()/2)+100,($(window).height()/2)+100]);
        }

    };


    var handleChange = function(c){

        setCoords(c);

    };

    init();
    return self;
};

