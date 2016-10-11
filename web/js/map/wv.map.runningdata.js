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

wv.map = wv.map || {};
/*
 * @Class
 */
wv.map.runningdata = wv.map.runningdata || function(models) {
    var self = this;
    self.layers = [];
    self.prePixelData = [];
    self.pixel  = null;
    self.oldLayers = [];

    /*
     * Retrieves the label, length and index of
     * of the label from the palette scale object  
     *
     * @method getDataLabel
     *
     * @param {object} scale - pallete scale object
     *  contains 3 arrays:
     *    scale.colors
     *    scale.labels
     *    scale.values
     *
     * @param {String} hex - color value
     *
     * @return {object}
     */
    self.getDataLabel = function(legend, hex) {
        var units = legend.units || '';
        // for(var i = 0, len = legend.colors.length; i < len; i++)  {
        //     if(legend.colors[i] === hex) {
        //         return {
        //             label: legend.tooltips[i] + ' ' + units,
        //             len: len,
        //             index:i
        //         };
        //     }
        // }

        for(var i = 0, len = legend.colors.length; i < len; i++)  {
              if(wv.util.hexColorDelta(legend.colors[i], hex) < 5) { // If the two colors are close
                return {
                    label: legend.tooltips[i] + ' ' + units,
                    len: len,
                    index:i
                };
            }
        }
        return undefined;
    };

    /*
     * Gets the point in which to place the running
     * data value label  
     *
     * @method getLabelMarginLeft
     *
     * @param {Number} labelWidth - width of label
     *
     * @param {Number} caseWidth - width of palette case
     *
     * @param {Number} location - location of point on palette
     *
     * @return {number} margin-left value of label
     *
     */
    self.getLabelMarginLeft = function(labelWidth, caseWidth, location) {
        if(location + (labelWidth / 2) > caseWidth) {
            return (caseWidth - labelWidth);
        } else if (location - (labelWidth / 2) < 0) {
            return 0;
        } else {
            return (location - (labelWidth / 2));
        }
    };

    /*
     * Gets the point in which to place the running
     * data value label  
     *
     * @method getLabelMarginLeft
     *
     * @param {String} id - Palette id
     *
     * @return {Object} Jquery palette dom object
     *
     */
    self.getPalette = function(id) {
        return $('#' + id);
    };

    /*
     * Get location in which to put pin on palette
     *
     * @method getPercent
     *
     * @param {Number} len - length of palette palette.scale.colors array
     *
     * @param {Number} Index - Index of color value in
     *  palette.scale.colors array
     *
     * @return {number} Percent of color index in 
     *  palette.scale.colors array
     *
     */
    self.getPercent = function(len, index, caseWidth) {
        var segmentWidth;
        var location;
        if(len < 250) {
            segmentWidth = (caseWidth / (len));
            location = ((segmentWidth * index) + (0.5 * segmentWidth));
            return (location / caseWidth);
        } else {
            return (index / len);
        }
    };

    /*
     * Compare old and new arrays to determine which Layers need to be
     * removed
     *
     * @method LayersToRemove
     *
     * @param {Array} oldArray - Array of layers at last pixel point
     *
     * @param {Array} newArray - Array of layers at new pixel point
     *  palette.scale.colors array
     *
     * @return {Array} Array of layers to remove
     *
     */
    self.LayersToRemove = function(oldArray, newArray) {
        return _.difference(oldArray, newArray);
    };

    /*
     * Compare old and new arrays to determine which Layers need to be
     * removed
     *
     * @method LayersToRemove
     *
     * @param {Array} coords - Array of coordinate values
     *
     * @param {Object} map - OpenLayers Map Object
     *
     * @return {Void}
     *
     */
    self.newPoint = function(coords, map) {
        self.activeLayers = [];
        map.forEachLayerAtPixel(coords, function(layer, data){
            var hex;
            var palette;
            var paletteInfo;
            var legend;
            if(layer.wv.def.palette){
                legends = models.palettes.getLegends(layer.wv.id);
                _.each(legends, function(legend){
                    if(legend) {
                        hex = wv.util.rgbaToHex(data[0], data[1], data[2], data[3]);
                        if(legend.type === 'continuous') {
                            paletteInfo = self.getDataLabel(legend, hex);
                            if(paletteInfo) {
                                self.setLayerValue(legend.id, paletteInfo);
                                self.activeLayers.push(legend.id);
                            }
                        } else if(legend.type === 'classification') {
                            paletteInfo = self.getDataLabel(legend, hex);
                            if(paletteInfo) {
                                self.setCategoryValue(legend.id, paletteInfo);
                                self.activeLayers.push(legend.id);
                            }
                        }
                        
                    }
                });
            }
        });
        if(self.oldLayers.length) {
            self.updateRunners(self.LayersToRemove(self.oldLayers, self.activeLayers));
        }
        self.oldLayers = self.activeLayers;
    };

    /*
     * Remove wv-running class from palette case
     *  element
     *
     * @method remove
     *
     * @param {String} id - Pallete id
     *
     * @return {Void}
     *
     */
    self.remove = function(id) {
        var $palette = $('#' + id);
        var $paletteCase = $palette.parent();
        $paletteCase.removeClass('wv-running');
        $palette.removeClass('wv-running');
    };
    self.clearAll = function() {
        $('.wv-running').removeClass('wv-running');
    };
    /*
     * Add running-data component to palette for
     * category layers
     *
     * @method setCategoryValue
     *
     * @param {String} id - Pallete id
     *
     * @param {Object} data - Object that contains
     *  the index, length and label of running data 
     *  value
     *
     * @return {Void}
     *
     */
    self.setCategoryValue = function(id, data) {
        var $categoryPaletteCase;
        var $caseWidth;
        var $labelWidth;
        var $colorSquare;
        var $paletteLabel;
        var location;
        var marginLeft;
        var squareWidth;

        marginLeft = 3;
        squareWidth = 15;

        $categoryPaletteCase = $('#' + id);
        $colorSquare = $categoryPaletteCase.find("[data-class-index='" + data.index + "']");
        $paletteLabel = $categoryPaletteCase.find('.wv-running-category-label');

        $caseWidth = $categoryPaletteCase.width();

        $paletteLabel.text(data.label);
        $labelWidth = $paletteLabel.width();
        location = ((marginLeft + squareWidth) * data.index);
        labelMargin = self.getLabelMarginLeft($labelWidth, $caseWidth, location);

        $paletteLabel.attr('style', 'left:' + Math.round(location) + 'px;'); 
        $categoryPaletteCase.addClass('wv-running');
        $categoryPaletteCase.find('.wv-active').removeClass('wv-active');
        $colorSquare.addClass('wv-active');
    };

    /*
     * Add running-data component to palette for
     * non-category layers
     *
     * @method setLayerValue
     *
     * @param {String} id - Pallete id
     *
     * @param {Object} data - Object that contains
     *  the index, length and label of running data 
     *  value
     *
     * @return {Void}
     *
     */
    self.setLayerValue = function(id, data) {
        var $palette;
        var $paletteCase;
        var $paletteWidth;
        var labelWidth;
        var percent;
        var labelMargin;
        var location;
        var margin;
        
        $palette = self.getPalette(id);
        $paletteCase = $palette.parent();
        $paletteWidth = $palette.width();
        $paletteCaseWidth = $paletteCase.outerWidth();
        $paletteLabel = $paletteCase.find('.wv-running-label');
        $paletteBar = $paletteCase.find('.wv-running-bar');

        percent = self.getPercent(data.len, data.index, $paletteWidth);
        margin = (($paletteCaseWidth - $paletteWidth) / 2);
        location = ($paletteWidth * percent + margin);


        $paletteLabel.text(data.label);
        labelWidth = $paletteLabel.width();

        labelMargin = self.getLabelMarginLeft(labelWidth, $paletteWidth, location);

        $paletteLabel.attr('style', 'left:' + Math.round(labelMargin) + 'px;');
        $paletteBar.attr('style', 'left:' + Math.round(location) + 'px;');
        $paletteCase.addClass('wv-running');
    };

    /*
     * Loops through and removes running data values from layers
     *
     * @method updateRunners
     *
     * @param {Object} layers - list of layers to remove
     *
     * @return {Void}
     *
     */
    self.updateRunners = function(layers) {
        if(layers.length) {
            for(var i = 0, len = layers.length; i < len; i++)  {
                self.remove(layers[i]);
            }
        }
    };
};