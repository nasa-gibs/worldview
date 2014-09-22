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

wv.image.rubberband = wv.image.rubberband || function(models, ui, config) {

    var self = {};

    var PALETTE_WARNING =
        "One or more layers on the map have been modified (changed palette, " +
        "thresholds, etc.). These modifications cannot be used to take a " +
        "snapshot. Would you like to temporarily revert to the original " +
        "layer(s)?";

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
    var previousPalettes = null;
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
        $("#wv-info-button input").button(action);
        $("#wv-proj-button input").button(action);
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
            var map = ui.map.selected;
            var handler = function() {
                map.events.unregister("maploadend", map, handler);
                toggleOn();
            };
            map.events.register("maploadend", map, handler);

            // Save the previous state to be restored later
            previousPalettes = models.palettes.active;
            models.palettes.clear();
            if ( !ui.map.isLoading() ) {
                handler();
            }
        };

        if(state == "off") {
            // Confirm with the user they want to continue, and if so, disable
            // the palettes before bringing up the crop box.
            if ( models.palettes.inUse() ) {
                wv.ui.ask({
                    header: "Notice",
                    message: PALETTE_WARNING,
                    onOk: disablePalettes,
                    onCancel: function() {
                        $button.prop("checked", false).button("refresh");
                    }
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
                models.palettes.restore(previousPalettes);
                previousPalettes = null;
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
