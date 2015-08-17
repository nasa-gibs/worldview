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
        "layer(s)?",

        GRATICULE_WARNING =
        "The graticule layer cannot be used to take a snapshot. Would you " +
        "like to hide this layer?",

        ROTATE_WARNING = "Image may not be downloaded when rotated. Would you like to reset rotation?";

    var containerId = "wv-image-button";
    var container;
    var selector = "#" + containerId;
    var coords = null, animCoords = null;
    var previousCoords = null;
    var $cropee = $("#wv-map"); //TODO: Test on non-canvas
    var id = containerId;
    var state = "off";
    var jcropAPI = null;
    var previousPalettes = null;
    var $button;
    var $progress;
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
        $button = $("<input />")
            .attr("type", "checkbox")
            .attr("id", "wv-image-button-check")
            .val("");
        var $label = $("<label></label>")
            .attr("for", "wv-image-button-check")
            .attr("title", "Take a snapshot");
        var $icon = $("<i></i>")
            .addClass("fa fa-camera fa-2x");
        $label.append($icon);
        $(selector).append($label);
        $(selector).append($button);
        $button.button({
            text: false
        });
        $button.on('click', toggle);
    };

    var toolbarButtons = function(action) {
        $("#wv-info-button").find("input").button(action);
        $("#wv-proj-button").find("input").button(action);
        $("#wv-link-button").find("input").button(action);
    };

    var toggle = function(){
        var checked = $("#wv-image-button-check").prop("checked");

        //Enables UI to select an area on the map while darkening the view
        var toggleOn = function() {
            if($("#dialog").dialog("isOpen"))
                $("#dialog").dialog("close");
            ui.anim.stop(); //close animation dialog, end current animation first

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
                    message: GRATICULE_WARNING,
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
                wv.ui.ask({
                    header: "Reset rotation?",
                    message: ROTATE_WARNING,
                    onOk: function() {
                        resetRotation();
                        setTimeout(toggle, 500); //Let rotation finish before image download can occur
                    }
                });
        }
        else {
            state = "off";
            $button.prop("checked", false).button("refresh");
            $cropee
                .insertAfter('#productsHolder');
            jcropAPI.destroy();
            restorePalettes();
            toolbarButtons("enable");
            wv.ui.closeDialog();
            $(".wv-image-coords").hide();
        }
    };

    /**
      * Sets the values for the rubberband (x1, y1, x2, y2, width, height) from the passed "coordinates" object of JCrop  *
      * @this {RBand}
      * @param {String} c object of JCrop
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

        var conversionFactor = proj === "geographic" ? 0.002197 : 256, res = calcRes(0);

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

        return wv.util.format("http://map2.vis.earthdata.nasa.gov/image-download?{1}&extent={2}&epsg={3}&layers={4}&opacities={5}&worldfile=false&format=image/jpeg&width={6}&height={7}", "TIME={1}", lonlat1[0]+","+lonlat1[1]+","+lonlat2[0]+","+lonlat2[1], epsg, layers.join(","), opacities.join(","), imgWidth, imgHeight);
    };

    //Setup a dialog to enable gif generation and turn on image cropping
    self.animToggle = function(from, to, delta, interval) {

        //check for rotation, changed palettes, and graticule layers and ask for reset if so
        var layers = models.layers.get({renderable: true});
        if (models.palettes.inUse()) {
            wv.ui.ask({
                header: "Notice",
                message: PALETTE_WARNING,
                onOk: function() {
                    previousPalettes = models.palettes.active;
                    models.palettes.clear();
                    self.animToggle(from, to, delta, interval);
                }
            });
            return;
        }
        if ( _.find(layers, {id: "Graticule"}) && models.proj.selected.id === "geographic" ) {
            wv.ui.ask({
                header: "Notice",
                message: GRATICULE_WARNING,
                onOk: function() {
                    models.layers.setVisibility("Graticule", false);
                    self.animToggle(from, to, delta, interval);
                }
            });
            return;
        }
        if(ui.map.selected.getView().getRotation() !== 0.0) {
            wv.ui.ask({
                header: "Reset rotation?",
                message: ROTATE_WARNING,
                onOk: function() {
                    resetRotation();
                    //Let rotation finish before image download can occur
                    self.animToggle(from, to, delta, interval);
                }
            });
            return;
        }
        if(parseInt(from) >= parseInt(to)) {
            wv.ui.ask({
                header: "Reverse date range?",
                message: "The start date (" + ui.timeline.input.fromDate.toDateString() + ") is after the end date (" + ui.timeline.input.toDate.toDateString() +
                         "). Would you like to reverse the dates?",
                onOk: function() {
                    self.animToggle(to, from, delta, interval);
                }
            });
            return;
        }

        var htmlElements = "<div id='gifDialog'>" +
                            "<div id='wv-gif-speedSlider'></div>" +
                            "<span class='ui-helper-hidden-accessible'><input type='text' readonly/></span>" +
                                "<table class='wv-image-download' style='padding-bottom: 7px'>" +
                                    "<tr>" + "<th>GIF Speed:</th>" + "<td id='wv-gif-speed' class='wv-image-size'>" + (1/interval).toFixed() + " Frames Per Second</td></tr>" +
                                    "<tr>" + "<th>GIF Size:</th>" + "<td><span id='wv-gif-width'>0</span> x <span id='wv-gif-height'>0</span></td></tr>" +
                                    "<tr>" + "<th>Image Resolution</th>" + "<td>" + calcRes(1) + "</td></tr>" +
                                    "<tr>" + "<th>Image Size:</th>" + "<td id='wv-gif-size' class='wv-image-size'>0 MB</td></tr>" +
                                "</table>" +
                                "<button id='wv-gif-button'>Generate</button>" +
                                "<button id='wv-gif-goback'>Go Back</button>" +
                           "</div>";

        var $dialog = wv.ui.getDialog().html(htmlElements); //place it above image crop

        $("#wv-gif-speedSlider").noUiSlider({
            start: parseInt((1/interval).toFixed()),
            step: 1,
            range: {
                min: 1,
                max: 30
            }
        }).on("slide", function() {
            interval = parseFloat(1 / $(this).val());
            $('#wv-gif-speed').text((1/interval).toFixed() + " Frames Per Second");
        }).on("set", function() {
            interval = parseFloat(1 / $(this).val());
            $('#wv-gif-speed').text((1/interval).toFixed() + " Frames Per Second");
        });

        $dialog.dialog({
            dialogClass: "wv-panel wv-image",
            title: "Generate GIF",
            height: 160,
            show: { effect: "slide", direction: "down" },
            position: {
                my: "left bottom",
                at: "left top",
                of: $("#timeline-footer")
            },
            close: function(event) {
                $("#wv-map").insertAfter('#productsHolder'); //retain map element before disabling jcrop
                jcropAPI.destroy();
                restorePalettes();
            }
        });

        $("#wv-gif-goback").button().click(function() {
            $dialog.dialog("close");
            $("#dialog").dialog("open");
        });

        //Wire the button to form the URLs and GIF
        $("#wv-gif-button").button().click(function() {
            $dialog.dialog("close");
            var url = formImageURL(), a = [];
            for(var i = parseInt(from); i <= parseInt(to); ) { //Convert to integer first. change i manually
                a.push(wv.util.format(url, i));
                //if the interval is in two years, take it to account
                if(delta > 1) { //30 or 365
                    var test = Number(i.toString().substring(4));
                    if(test + delta > 365) { //correct set number of day for the next year
                        test = delta - (365 - test);
                        var zeros = test < 10 ? "00" : ((test < 100) ? "0" : "");
                        i = parseInt( (Number((i.toString().substring(0, 4))) + 1) + zeros + test.toString());
                    } else
                        i += delta;
                } else if(i.toString().indexOf("365") !== -1)
                    i = parseInt( (Number((i.toString().substring(0, 4))) + 1) + "001");
                else
                    i += delta;
            }

            $progress = $("<progress />") //display progress for GIF creation
                .attr("id", "wv-gif-progress");

            wv.ui.getDialog().append($progress).dialog({ //dialog for progress
                title: "Creating GIF...",
                width: 300,
                height: 100
            });

            gifshot.createGIF({
                gifWidth: animCoords.w,
                gifHeight: animCoords.h,
                images: a,
                interval: interval,
                progressCallback: function(captureProgress) {
                    $progress.attr("value", captureProgress); //before value set, it is in indeterminate state
                }
            }, function (obj) { //callback function for when image is finished
                if (!obj.error) {
                    $progress.remove();
                    var animatedImage = document.createElement('img');
                    animatedImage.setAttribute("style", "padding: 10px 0px");

                    //Create a blob out of the image's base64 encoding because Chrome can't handle large data URIs, taken from:
                    //http://stackoverflow.com/questions/16761927/aw-snap-when-data-uri-is-too-large
                    var byteCharacters = atob(obj.image.substring(22)), byteArrays = []; //remove "data:image/gif;base64,"
                    for (var offset = 0; offset < byteCharacters.length; offset += 512) {
                        var slice = byteCharacters.slice(offset, offset + 512);

                        var byteNumbers = new Array(slice.length);
                        for (var i = 0; i < slice.length; i++)
                            byteNumbers[i] = slice.charCodeAt(i);

                        var byteArray = new Uint8Array(byteNumbers);
                        byteArrays.push(byteArray);
                    }

                    var blob = new Blob(byteArrays, {type: "image/gif"});
                    var blobURL = URL.createObjectURL(blob); //supported in Chrome and FF
                    animatedImage.src = blobURL;

                    //Create download link and apply button CSS
                    var $download = $("<a><span class=ui-button-text>Download</span></a>")
                        .attr("type", "button")
                        .attr("role", "button")
                        .attr("download", "animation.gif")
                        .attr("href", blobURL)
                        .attr("class", "ui-button ui-widget ui-state-default ui-button-text-only")
                        .hover(function() {$(this).addClass("ui-state-hover");}, function() {$(this).removeClass("ui-state-hover");});

                    var $imgSize = $("<label></label>")
                        .html("<span> Estimated Size: " + (blob.size / 1024).toFixed() + " KB</span>");

                    //calculate the offset of the dialog position based on image size to display it properly
                    //only height needs to be adjusted to center the dialog
                    var pos_width = animCoords.w * 1 / window.innerWidth, pos_height = animCoords.h * 50 / window.innerHeight;
                    var at_string = "center-" + pos_width.toFixed() + "% center-" + pos_height.toFixed() + "%";

                    //Create a dialog over the view and place the image there
                    var $imgDialog = wv.ui.getDialog().append(animatedImage).append($download).append($imgSize);
                    $imgDialog.dialog({
                        dialogClass: "wv-panel",
                        title: "View Animation",
                        width: animCoords.w + 32,
                        close: function() {
                            animCoords = undefined;
                            $imgDialog.find("img").remove();
                        },
                        position: { //based on image size
                            my: "center center",
                            at: at_string,
                            of: window
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
            setSelect: [($(window).width()/2)-100,($(window).height()/2)-100,($(window).width()/2)+100,($(window).height()/2)+100],
            onSelect: function(c) {
                animCoords = c;
                $("#wv-gif-width").html((c.w));
                $("#wv-gif-height").html((c.h));
            },
            onChange: function(c) { //Update gif size and image size in MB
                animCoords = c;
                var dataSize = calcSize(c);

                //Update the gif selection dialog
                $("#wv-gif-width").html((c.w)); $("#wv-gif-height").html((c.h)); $("#wv-gif-size").html(dataSize + " MB");

                if(dataSize > 250) //disable GIF generation if GIF would be too large
                    $("#wv-gif-button").button("disable");
                else
                    $("#wv-gif-button").button("enable");
            },
            onRelease: function() {
                removeCrop();
                $dialog.dialog("close");
            }
        }, function() {
            jcropAPI = this;
        });
    };

    var removeCrop = function() {
        $("#wv-map").insertAfter('#productsHolder'); //retain map element before disabling jcrop
        animCoords = undefined;
        jcropAPI.destroy();
        restorePalettes();
    },

    calcSize = function(c) {
        var lonlat1 = ui.map.selected.getCoordinateFromPixel([Math.floor(c.x), Math.floor(c.y2)]),
            lonlat2 = ui.map.selected.getCoordinateFromPixel([Math.floor(c.x2), Math.floor(c.y)]);

        var conversionFactor = models.proj.selected.id === "geographic" ? 0.002197 : 256, res = calcRes(0);

        var imgWidth = Math.round((Math.abs(lonlat2[0] - lonlat1[0]) / conversionFactor) / Number(res)),
            imgHeight = Math.round((Math.abs(lonlat2[1] - lonlat1[1]) / conversionFactor) / Number(res));

        return ((imgWidth * imgHeight * 24) / 8388608).toFixed(2);
    },

    handleChange = function(c){
        setCoords(c);
    },

    restorePalettes = function() {
        if (previousPalettes) {
            models.palettes.restore(previousPalettes);
            previousPalettes = null;
        }
    },

    resetRotation = function() {
        ui.map.selected.beforeRender(ol.animation.rotate({
            duration: 400,
            rotation: ui.map.selected.getView().getRotation()
        }));
        ui.map.selected.getView().rotate(0);
        ui.map.updateRotation();
    },

    calcRes = function(mode) { //return either multipler or string resolution
        var zoom_res = [40, 20, 4, 2, 1], str, res;
        res = zoom_res[Math.floor((ui.map.selected.getView().getZoom()/2))];

        if(mode === 0)
            return res;
        else {
            switch(res){
                case 1:
                    str = "250m";
                    break;
                case 2:
                    str = "500m";
                    break;
                case 4:
                    str = "1km";
                    break;
                case 20:
                    str = "5km";
                    break;
                default:
                    str = "10km";
            }
            return str;
        }
    };

    init();
    return self;
};
