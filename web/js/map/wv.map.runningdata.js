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
    self.models

    self.newPoint = function(coords, map) {
        map.forEachLayerAtPixel(coords, function(layer, data){
            var palette = models.palettes.get(layer.wv.id);
            if(palette && palette.scale) {
                var hex = wv.util.rgbaToHex(data[0], data[1], data[2]);
                var paletteInfo = self.getDataLabel(palette.scale, hex);
            };
        });
    };

    self.getDataLabel = function(scale, hex) {
        for(var i = 0, len = scale.colors.length; i < len; i++)  {
            if(scale.colors[i] == hex) {
                return {label:scale.labels[i], percent:Number(i/len)};
            };
        };
    };
};