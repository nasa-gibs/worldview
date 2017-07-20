/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2017 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */
/*eslint no-unused-vars: "error"*/
var wv = wv || {};
wv.image = wv.image || {};

wv.image.selection = wv.image.selection || function(models, ui, config) {

	var init = function() {

	}

    /*
     * Retieves coordinates from pixel
     *
     * @method getCoords
     * @private
     *
     * @returns {array} array of coords
     *
     */
    var getCoords = function() {
        return  [ui.map.selected.getCoordinateFromPixel([Math.floor(animCoords.x), Math.floor(animCoords.y2)]),
            ui.map.selected.getCoordinateFromPixel([Math.floor(animCoords.x2), Math.floor(animCoords.y)])];
    };
    /*
     * Dimenions from zoom & projection
     *
     * @method getDimensions
     * @private
     *
     * @returns {array} array with dimensions
     *
     */
    var getDimensions = function(lonlat, proj) {

        var conversionFactor = proj === "geographic" ? 0.002197 : 256;
        var res = calcRes(0);
        return [
            Math.round((Math.abs(lonlat[1][0] - lonlat[0][0]) / conversionFactor) / Number(res)),// width
            Math.round((Math.abs(lonlat[1][1] - lonlat[0][1]) / conversionFactor) / Number(res))// height
        ];
    };
        /*
     * Initializes and sets callbacks for
     *  Jcrop selector
     * 
     * @method setImageCoords
     * @private
     *
     * @returns {void}
     *
     */
    var setImageCoords = function() {
        var starterWidth;
        var $dlButton;
        var $dialog;
        //Set JCrop selection
        if(previousCoords === null || previousCoords === undefined)
            previousCoords = [($(window).width()/2)-100,($(window).height()/2)-100,($(window).width()/2)+100,($(window).height()/2)+100];
        else
            previousCoords = [previousCoords.x, previousCoords.y, previousCoords.x2, previousCoords.y2];

        if(models.proj.selected.id === "geographic")
            ui.map.events.trigger('selecting');
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
                            "<i class='fa fa-download'>" +
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
}
