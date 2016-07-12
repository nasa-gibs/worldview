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
    self.newLayers = [];
    self.oldLayers = [];

    self.newPoint = function(coords, map) {
        self.activeLayers = [];
        map.forEachLayerAtPixel(coords, function(layer, data){
            if(layer.wv.def.palette){
                var palette = models.palettes.get(layer.wv.id);
                if(palette.scale) {
                    var hex = wv.util.rgbaToHex(data[0], data[1], data[2]);
                    var paletteInfo = self.getDataLabel(palette.scale, hex);
                    if(paletteInfo) {
                        self.setLayerValue(palette.id, paletteInfo);
                    }

                    self.activeLayers.push(palette.id +'_palette');
                };
              };
        });
        if(self.oldLayers.length) {
            self.updateRunners(self.LayersToRemove(self.oldLayers, self.activeLayers));
        }
    };
    self.setLayerValue = function(id, data) {
        var $paletteCase;
        var $paletteWidth;
        var labelWidth;
        var percent;
        var labelMargin;
        var location;

        percent = data.percent;
        $paletteCase = self.getPalette(id).parent();
        $paletteWidth = $paletteCase.width();
        $paletteLabel = $paletteCase.find('.wv-running-label');
        $paletteBar = $paletteCase.find('.wv-running-bar');
        location = $paletteWidth * percent;

        $paletteLabel.text(data.label);
        labelWidth = $paletteLabel.width();

        labelMargin = self.getLabelMarginLeft(labelWidth, $paletteWidth, location);

        $paletteLabel.attr('style', 'left:' + Math.round(labelMargin) + 'px;');
        $paletteBar.attr('style', 'left:' + Math.round(location) + 'px;');
        $paletteCase.addClass('wv-running');
    }
    self.getLabelMarginLeft = function(labelWidth, caseWidth, location) {

      if(location + (labelWidth / 2) > caseWidth) {
          return (caseWidth - labelWidth);
      } else if (location - (labelWidth / 2) < 0) {
          return 0;
      } else {
          return (location - (labelWidth / 2));
      }

    }
    self.getPalette = function(id) {
        return $('#' + id + '_palette');
    }
    self.LayersToRemove = function(oldArray, newArray) {
        return _.difference(old, newArray);
    }
    self.updateRunners = function(layers) {
        for(var i = 0, len = layers.length; i < len; i++)  {
            self.remove(layers[id]);
        }
    }
    self.remove = function(id) {
        var $paletteCase = $('#' + id).parent();
        $paletteCase.removeClass('wv-running');
    }
    self.getDataLabel = function(scale, hex) {
        for(var i = 0, len = scale.colors.length; i < len; i++)  {
            if(scale.colors[i] === hex) {
                return {label:scale.labels[i], percent: Number(i/len)};
            }
        };
        return undefined;
    };
};