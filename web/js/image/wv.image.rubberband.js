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

    var GRATICLE_WARNING =
        "The graticule layer cannot be used to take a snapshot. Would you " +
        "like to hide this layer?";

    var containerId = "wv-image-button";
    var container;
    var selector = "#" + containerId;
    var coords = null, animCoords = null;
    var previousCoords = null;
    var icon = "images/camera.png";
    var onicon = "images/cameraon.png";
    var $cropee = $("#wv-map"); //TODO: Test on non-canvas
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

        //Enables UI to select an area on the map while darkening the view
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

        var disablePalettes = function() {
            var map = ui.map.selected;
            // Save the previous state to be restored later
            previousPalettes = models.palettes.active;
            models.palettes.clear();
            toggle();
        };

        var disableGraticle = function() {
            models.layers.setVisibility("Graticule", false);
            toggle();
        };

        if(state == "off") {
            var layers = models.layers.get({renderable: true});
            var geographic = models.proj.selected.id === "geographic";
            var on = true;
            if ( _.find(layers, {id: "Graticule"}) && geographic ) {
                wv.ui.ask({
                    header: "Notice",
                    message: GRATICLE_WARNING,
                    onOk: disableGraticle,
                    onCancel: function() {
                        $button.prop("checked", false).button("refresh");
                    }
                });
                return;
            }

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
                return;
            }

            //Don't toggle area select UI for downloading image if image rotated
            if(ui.map.selected.getView().getRotation() === 0.0)
                toggleOn();
            else
                wv.ui.notify("Image may not be downloaded when rotated. Would you like to reset rotation?");
        }
        else {
            state = "off";
            $button.prop("checked", false).button("refresh");
            $cropee
                .insertAfter('#productsHolder');
            jcropAPI.destroy();
            if (previousPalettes) {
                models.palettes.restore(previousPalettes);
                previousPalettes = null;
            }
            toolbarButtons("enable");
            wv.ui.closeDialog();
            $(".wv-image-coords").hide();
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

        $cropee.Jcrop({
                bgColor:     'black',
                bgOpacity:   0.3,
                onSelect:  function(c){previousCoords=coords;handleChange(c);},
                onChange: function(c){handleChange(c);},
                onRelease: function(c){ coords=previousCoords; toggle(); },
                fullScreen: true
                });

        jcropAPI = $cropee.data('Jcrop');

        if(coords)
            jcropAPI.setSelect([coords.x, coords.y,coords.x2,coords.y2]);
        else
            jcropAPI.setSelect([($(window).width()/2)-100,($(window).height()/2)-100,($(window).width()/2)+100,($(window).height()/2)+100]);
    };

    var formImageURL = function() {
        //Gather all data to get the image
        var proj = models.proj.selected.id,
            products = models.layers.get({
                reverse: true,
                renderable: true
            }),
            epsg = ( models.proj.change ) ? models.proj.change.epsg : models.proj.selected.epsg,
            opacities = [], layers = [];

        var lonlat1 = ui.map.selected.getCoordinateFromPixel([Math.floor(animCoords.x), Math.floor(animCoords.y2)]);
        var lonlat2 = ui.map.selected.getCoordinateFromPixel([Math.floor(animCoords.x2), Math.floor(animCoords.y)]);

        var conversionFactor = proj === "geographic" ? 0.002197 : 256,
            res = $("#wv-gif-resolution").find("option:checked").val();

        var imgWidth = Math.round((Math.abs(lonlat2[0] - lonlat1[0]) / conversionFactor) / Number(res)),
            imgHeight = Math.round((Math.abs(lonlat2[1] - lonlat1[1]) / conversionFactor) / Number(res));

        _(products).each( function(product){
            opacities.push( ( _.isUndefined(product.opacity) ) ? 1: product.opacity );
        });

        _.each(products, function(layer) {
            if ( layer.projections[proj].layer ) {
                layers.push(layer.projections[proj].layer);
            } else {
                layers.push(layer.id);
            }
        });

        return wv.util.format("http://map2.vis.earthdata.nasa.gov/imagegen/index.php?{1}&extent={2}&epsg={3}&layers={4}&opacities={5}&worldfile=false&format=image/jpeg&width={6}&height={7}", "TIME={1}", lonlat1[0]+","+lonlat1[1]+","+lonlat2[0]+","+lonlat2[1], epsg, layers.join(","), opacities.join(","), imgWidth, imgHeight);
        //return 'http://map2.vis.earthdata.nasa.gov/image-download?TIME={1}&extent=-2498560,-1380352,983040,2101248&epsg=3413&layers=MODIS_Terra_CorrectedReflectance_TrueColor,Coastlines&opacities=1,1&worldfile=false&format=image/jpeg&width=680&height=680';
    };

    //Setup a dialog to enable gif generation and turn on image cropping
    self.animToggle = function(from, to, delta) {
        if(!animCoords) //Set default coordinates
            animCoords = [($(window).width()/2)-100,($(window).height()/2)-100,($(window).width()/2)+100,($(window).height()/2)+100];

        var htmlElements = "<div id='gifDialog'>" +
                                "<label>Width: </label>" + "<span id='wv-gif-width'>0</span>" + "<br />" +
                                "<label>Height: </label>" + "<span id='wv-gif-height'>0</span>" + "<br />" +
                                "<button id='wv-gif-button'>Generate</button>" + "<br />" +
                                "<select id='wv-gif-resolution'>" +
                                    "<option value='1' >250m</option>" +
                                    "<option value='2' >500m</option>" +
                                    "<option value='4' >1km</option>" +
                                    "<option value='20'>5km</option>" +
                                    "<option value='40'>10km</option>" +
                                "</select>Resolution (per pixel)" +
                           "</div>";
        var $dialog = wv.ui.getDialog().html(htmlElements); //place it above image crop
        $dialog.dialog({
            dialogClass: "wv-panel",
            title: "Generate GIF",
            show: { effect: "slide", direction: "down" },
            position: {
                my: "left bottom",
                at: "left top",
                of: $("#timeline-footer")
            }
        });

        //Wire the button to generate the URL and GIF
        $("#wv-gif-button").button().click(function() {
            $dialog.dialog("close"); //FIXME: jCrop won't properly init next time
            $("#wv-map").insertAfter('#productsHolder'); //retain map element before disabling jcrop
            jcropAPI.destroy();
            var url = formImageURL(), a = [];
            for(var i = parseInt(from); i <= parseInt(to); i += delta) { //Convert to integer first
                a.push(wv.util.format(url, i));
                //if the interval is in two years, take it to account
                if(i.toString().indexOf("365") !== -1) //TODO:Better method to do roll over
                    i = parseInt(self.toDate.getUTCFullYear()+ "000");
            }

            gifshot.createGIF({
                gifWidth: animCoords.w,
                gifHeight: animCoords.h,
                images: a
            }, function (obj) {
                if (!obj.error) {
                    var animatedImage = document.createElement('img');
                    animatedImage.src = obj.image;
                    animatedImage.setAttribute("style", "padding: 10px 0px");

                    //Create download link and apply button CSS
                    var $download = $("<a><span class=ui-button-text>Download</span></a>")
                        .attr("type", "button")
                        .attr("role", "button")
                        .attr("download", "animation.gif")
                        .attr("href", obj.image)
                        .attr("class", "ui-button ui-widget ui-state-default ui-button-text-only")
                        .hover(function() {$(this).addClass("ui-state-hover")}, function() {$(this).removeClass("ui-state-hover")});

                    //Create a dialog over the view and place the image there
                    var $imgDialog = wv.ui.getDialog().append(animatedImage).append($download);
                    $imgDialog.dialog({
                        dialogClass: "wv-panel",
                        title: "View Animation",
                        width: animatedImage.width + 32,
                        close: function() {
                            $imgDialog.find("img").remove();
                        }
                    });
                }
            });
        });

        //Start the image cropping. Show the dialog
        $("#wv-map").Jcrop({
            bgColor:     'black',
            bgOpacity:   0.3,
            fullScreen:  true,
            setSelect: animCoords,
            onSelect: function(c) {
                animCoords = c;
                $("#wv-gif-width").html((c.w));
                $("#wv-gif-height").html((c.h));
            },
            onChange: function(c) {
                animCoords = c;
                $("#wv-gif-width").html((c.w));
                $("#wv-gif-height").html((c.h));

                //disable GIF generation if GIF would be too large
                if(c.w > 640 || c.h > 640)
                    $("#wv-gif-button").button("disable");
                else
                    $("#wv-gif-button").button("enable");
            },
            onRelease: function(c) {
                $("#wv-map").insertAfter('#productsHolder'); //retain map element before disabling jcrop
                jcropAPI.destroy();
                animCoords = null;
                $dialog.dialog("close");
            }
        }, function() {
            jcropAPI = this;
        });
    };

    var handleChange = function(c){
        setCoords(c);
    };

    init();
    return self;
};
