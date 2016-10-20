/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2016 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 *
 * Licensed under the NASA Open Source Agreement, Version 1.3
 * http://opensource.gsfc.nasa.gov/nosa.php
 */
var wv = wv || {};

wv.anim = wv.anim || {};

wv.anim.gif = wv.anim.gif || function(models, config, ui) {
    var self = {};
    var $cropee = $("#wv-map");
    var jcropAPI = null;
    var coords = null;
    var animCoords = null;
    var previousCoords = null;
    var animModel = models.anim;
    var $progress;
    var GRATICLE_WARNING =
        "The graticule layer cannot be used to take a snapshot. Would you " +
        "like to hide this layer?";

    var ROTATE_WARNING = "Image may not be downloaded when rotated. Would you like to reset rotation?";
    
    self.init = function() {
        models.anim.events.on('gif-click', setImageCoords);
    };

    self.createGIF = function() {
        var stateObj = animModel.rangeState;
        var interval = stateObj.speed;
        var startDate = stateObj.startDate;
        var endDate = stateObj.endDate;
        var shootGIFafterImageLoad;
        var imageArra;
        $progress = $("<progress />") //display progress for GIF creation
            .attr("class", "wv-gif-progress");

        wv.ui.getDialog().append($progress).dialog({ //dialog for progress
            title: "Collecting Images...",
            width: 300,
            height: 100
        });
        $progress.attr("value", 0);
        imageArra = getImageArray(startDate, endDate, $progress);
        if(!imageArra) {
            return;
        }
        gifshot.createGIF({
            'gifWidth': animCoords.w,
            'gifHeight': animCoords.h,
            'images': imageArra,
            'interval': 1 / interval,
            'progressCallback': function(captureProgress) {
                $progress.parent().dialog("option", "title", "Creating GIF..."); //set dialog title
                $progress.attr("value", captureProgress); //before value set, it is in indeterminate state
            }
        }, onGifComplete);
    };
    var calcRes = function(mode) { //return either multiplier or string resolution
        //geographic has 10 zoom levels from 0 to 9, polar projections have 8 from 0 to 7
        var isGeographic = models.proj.selected.id === "geographic";

        //Map the zoom level from 0-9 / 0-7 to an index from 0-4
        var zoom_res = [40, 20, 4, 2, 1], str, res;
        if(isGeographic)
            res = zoom_res[Math.floor((ui.map.selected.getView().getZoom()/2))];
        else
            res = zoom_res[Math.floor(((ui.map.selected.getView().getZoom() + 2) / 2))];

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
    self.getGif = function() {
        var layers;
        //check for rotation, changed palettes, and graticule layers and ask for reset if so
        
        //ui.anim.stop(); Add this
        layers = models.layers.get({renderable: true});
        if (models.palettes.inUse()) {
            wv.ui.ask({
                header: "Notice",
                message: PALETTE_WARNING,
                onOk: function() {
                    previousPalettes = models.palettes.active;
                    models.palettes.clear();
                    self.getGif();
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
                    self.getGif(startDate, endDate, delta, interval);
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
                    self.getGif();
                }
            });
            return;
        }
        self.createGIF();
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

        return wv.util.format("http://gibs.earthdata.nasa.gov/image-download?{1}&extent={2}&epsg={3}&layers={4}&opacities={5}&worldfile=false&format=image/jpeg&width={6}&height={7}", "TIME={1}", lonlat1[0]+","+lonlat1[1]+","+lonlat2[0]+","+lonlat2[1], epsg, layers.join(","), opacities.join(","), imgWidth, imgHeight);
    };

    var getImageArray = function (startDate, endDate) {
        var url = formImageURL();
        var a = [];
        var fromDate = new Date(startDate);
        var toDate = new Date(endDate);
        var current = fromDate;
        var j = 0;

        while(current <= toDate) {
            j++;
            var src = wv.util.format(url, wv.util.toISOStringDate(current));
            a.push(src);
            current = wv.util.dateAdd(current, ui.anim.ui.getInterval(), 1);
            if(j > 40) { // too many frame
                showUnavailableReason();
                return false;
            }

        }
        for(var i = 0,
            len = animModel.rangeState.speed / 2, // get a half seconds worth of frames
            lastSrc = a.length - 1;
            i < len; i++) {
            a.push(a[lastSrc]);
        }
        return a;
    };

    var showUnavailableReason = function() {
        var headerMsg = "<h3 class='wv-data-unavailable-header'>GIF Not Available</h3>";
        var bodyMsg = 'Too many frames were selected. Please request less than 40 frames if you would like to generate a GIF';

        wv.ui.notify(headerMsg + bodyMsg, "Notice", 600);
    };
    var resetRotation = function() {
        ui.map.selected.beforeRender(ol.animation.rotate({
            duration: 400,
            rotation: ui.map.selected.getView().getRotation()
        }));
        ui.map.selected.getView().rotate(0);
        ui.map.updateRotation();
    };
    var onGifComplete = function (obj) { //callback function for when image is finished
        if (obj.error === false) {
            $progress.remove();
            var animatedImage = document.createElement('img');

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
            var dlURL = wv.util.format("nasa-worldview-{1}-to-{2}.gif", animModel.rangeState.startDate, animModel.rangeState.startDate);

            //Create download link and apply button CSS
            var $download = $("<a><span class=ui-button-text>Download</span></a>")
                .attr("type", "button")
                .attr("role", "button")
                .attr("download", dlURL)
                .attr("href", blobURL)
                .attr("class", "ui-button ui-widget ui-state-default ui-button-text-only")
                .hover(function() {$(this).addClass("ui-state-hover");}, function() {$(this).removeClass("ui-state-hover");});

            var $catalog =         
                "<div class='gif-results-dialog' style='height: " + animCoords.h + "px; min-height: 210px;' >" + 
                    "<div>" +
                        "<div><b>" +
                            "Size: " + 
                        "</b></div>" +
                        "<div>" +
                            (blob.size / 1024).toFixed() + " KB" +
                        "</div>" +
                    "</div>" +
                    "<div>" +
                        "<div><b>" +
                            "Speed: " + 
                        "</b></div>" +
                        "<div>" +
                            animModel.rangeState.speed + " fps" +
                        "</div>" +

                    "</div>" +
                    "<div>" +
                        "<div><b>" +
                            "Date Range: " + 
                        "</b></div>" +
                        "<div>" +
                            animModel.rangeState.startDate +
                        "</div>" +
                        "<div>" +
                            " - " +
                        "</div>" +
                        "<div>" +
                            animModel.rangeState.endDate +
                        "</div>" +
                    "</div>" +
                    "<div>" +
                        "<div><b>" +
                            "Increments: " + 
                        "</b></div>" +
                        "<div>" +
                            ui.anim.widget.getIncrements() +
                        "</div>" +

                    "</div>" +
                "</div>";
            var $dialogBodyCase = $("<div></div>");
            $dialogBodyCase.addClass('gif-results-dialog-case');
            $dialogBodyCase.css('padding', '10px 0');
            $dialogBodyCase.append(animatedImage);
            $dialogBodyCase.append($catalog);
            //calculate the offset of the dialog position based on image size to display it properly
            //only height needs to be adjusted to center the dialog
            var pos_width = animCoords.w * 1 / window.innerWidth, pos_height = animCoords.h * 50 / window.innerHeight;
            var at_string = "center-" + pos_width.toFixed() + "% center-" + pos_height.toFixed() + "%";

            //Create a dialog over the view and place the image there
            var $imgDialog = wv.ui.getDialog().append($dialogBodyCase).append($download);
            $imgDialog.dialog({
                dialogClass: "wv-panel",
                title: "Your Gif",
                width: animCoords.w + 198,
                close: function() {
                    animCoords = null;
                    $imgDialog.find("img").remove();
                    $('#timeline-footer').toggleClass('wv-anim-active');
                },
                position: { //based on image size
                    my: "center center",
                    at: at_string,
                    of: window
                }
            });
        }
    };
    var calcSize = function(c) {
        var lonlat1 = ui.map.selected.getCoordinateFromPixel([Math.floor(c.x), Math.floor(c.y2)]),
            lonlat2 = ui.map.selected.getCoordinateFromPixel([Math.floor(c.x2), Math.floor(c.y)]);

        var conversionFactor = models.proj.selected.id === "geographic" ? 0.002197 : 256, res = calcRes(0);

        var imgWidth = Math.round((Math.abs(lonlat2[0] - lonlat1[0]) / conversionFactor) / Number(res)),
            imgHeight = Math.round((Math.abs(lonlat2[1] - lonlat1[1]) / conversionFactor) / Number(res));

        return ((imgWidth * imgHeight * 24) / 8388608).toFixed(2);
    };
    var removeCrop = function() {
        $("#wv-map").insertAfter('#productsHolder'); //retain map element before disabling jcrop
        animCoords = undefined;
        jcropAPI.destroy();
    };
    self.getSelectorDialog = function(width) {
        var $dialogBox;
        var $createButton;
        var $dialog =$("<div class='gif-dialog'></div>");
        var dialog =
                "<div class='content'>"  +
                    "create an animation from " +
                    "<b>" +
                        animModel.rangeState.startDate +
                    "</b>" +
                    " to " +
                    "<b>" +
                        animModel.rangeState.endDate +
                    "</b>" +
                    " at a rate of " +
                        animModel.rangeState.speed +
                    " frames per second" +
                "</div>";
        $createButton = $("<a><span class=ui-button-text>Create Gif</span></a>")
            .attr("type", "button")
            .attr("role", "button")
            .attr("class", "ui-button ui-widget ui-state-default ui-button-text-only")
            .hover(function() {$(this).addClass("ui-state-hover");}, function() {$(this).removeClass("ui-state-hover");});
        $dialog.html(dialog).append($createButton);
        $createButton.on('click', self.getGif);
        $dialogBox = wv.ui.getDialog();
        $dialogBox.html($dialog);
        $dialogBox.css({paddingBottom: '10px'});
        $dialogBox.dialog({
            dialogClass: "wv-panel wv-image",
            title: "Generate GIF",
            height: 'auto',
            width: width,
            minHeight: 40,
            resizable: false,
            show: { effect: "slide", direction: "down" },
            position: {
                my: "left top",
                at: "left bottom+10",
                of: $(".jcrop-tracker")
            },

            close: function(event) {
                $("#wv-map").insertAfter('#productsHolder'); //retain map element before disabling jcrop
                jcropAPI.destroy();
            }
        });
        return $dialogBox;
    };
    var setDialogWidth = function($dialog, width) {
        var $parent;
        if($dialog) {
            $parent = $dialog.parent();
            $parent.width(width);
            $parent.position({
                my: "left top",
                at: "left bottom+10",
                of: $(".jcrop-tracker")
            });
        }
    };
    var setIconFontSize = function($el, width) {
        var fs = Math.abs(width / 4);
        if(!$el)
            return;
        if(fs <= 30) {
            fs = 30;
        }
        $el.css('font-size', fs);
    };
    var setImageCoords = function() {
        var starterWidth;
        var $dlButton;
        var $dialog;
        //Set JCrop selection
        if(previousCoords === null || previousCoords === undefined)
            previousCoords = [($(window).width()/2)-100,($(window).height()/2)-100,($(window).width()/2)+100,($(window).height()/2)+100];
        else
            previousCoords = [previousCoords.x, previousCoords.y, previousCoords.x2, previousCoords.y2];

        
        
        starterWidth = previousCoords[0] - previousCoords[2];
        //Start the image cropping. Show the dialog
        $("#wv-map").Jcrop({
            bgColor:     'black',
            bgOpacity:   0.3,
            fullScreen:  true,
            setSelect: previousCoords,
            onSelect: function(c) {
                animCoords = c;
                $("#wv-gif-width").html((c.w));
                $("#wv-gif-height").html((c.h));
            },
            onChange: function(c) { //Update gif size and image size in MB
                var modalLeftMargin;
                animCoords = c;

                if(c.h !== 0 && c.w !== 0) //don't save coordinates if empty selection
                    previousCoords = c;
                var dataSize = calcSize(c);
                //Update the gif selection dialog
                $("#wv-gif-width").html((c.w));
                $("#wv-gif-height").html((c.h));
                $("#wv-gif-size").html(dataSize + " MB");

                if(dataSize > 250) {//disable GIF generation if GIF would be too large
                    $("#wv-gif-button").button("disable");
                } else {
                    $("#wv-gif-button").button("enable");
                }
                setDialogWidth($dialog, c.w);
                setIconFontSize($dlButton, c.w);
            },
            onRelease: function(c) {
                removeCrop();
                $('#timeline-footer').toggleClass('wv-anim-active');
                if($dialog) {
                    wv.ui.close();
                }
            }
        }, function() {
            var $tracker;
            $dlButton =
                        "<div class='wv-dl-gif-bt-case'>" +
                            "<i class='fa fa-arrow-circle-o-down'>" +
                        "</div>";
            jcropAPI = this;
            $('#timeline-footer').toggleClass('wv-anim-active');
            $dialog = self.getSelectorDialog();
            $tracker = this.ui.selection.find('.jcrop-tracker');
            $tracker.append($dlButton);
            $dlButton = $('.wv-dl-gif-bt-case i');
            setIconFontSize($dlButton, starterWidth);
            $dlButton.on('click', self.getGif);


        });
    };
    self.init();
    return self;
};
