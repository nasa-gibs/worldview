var wv = wv || {};

wv.map = wv.map || {};
/*
 * @Class
 */
wv.map.runningdata = wv.map.runningdata || function(activeLayers) {
    var self = this;
    self.layers = [];
    self.prePixelData = [];
    self.pixel  = null;
    self.activeLayers = activeLayers;

    self.resetActiveLayers = function(activeLayers) {
      self.activeLayers = activeLayers;
    }
    self.preRender = function(evt) {
        var context, x, y, data, pixelRatio, blank;
        if(self.pixel) {
            context = evt.context
            pixelRatio = evt.frameState.pixelRatio;
            self.x = self.pixel[0];
            self.y = self.pixel[1];
            x = self.x * pixelRatio;
            y = self.y * pixelRatio;
            self.prePixelData = evt.context.getImageData(x, y, 1, 1).data;
            blank = context.createImageData(1,1)
            context.putImageData(blank, x, y);
        }
    }
    self.postRender = function(evt) {
        var layer, pixelRatio, context, data, x, y, d;
        if(self.pixel) {
            d = self.prePixelData;
            layer = evt.target;
            pixelRatio = evt.frameState.pixelRatio;
            context = evt.context;

            x = self.x * pixelRatio;
            y = self.y * pixelRatio;
            data = context.getImageData(x, y, 1, 1).data;
            context.fillStyle = "rgba("+d[0]+","+d[1]+","+d[2]+","+d[3]+")";
        }
    }
    self.addLayerToSideBar = function() {

    }

    self.arraysAreEqual = function(arr1, arr2) {
        if(arr1.length !== arr2.length)
            return false;
        for(var i = arr1.length; i--;) {
            if(arr1[i] !== arr2[i])
                return false;
        }
        return true;
    }


    self.updateLayers = function(layers) {

        // this.layers= [];
        // for(var i = 0, len = layers.length; i < len; i++ ) {
        //   // var def = layers[i].wv.def;
        //   // if(def.visible && def.pallete) {
        //   //   this.layers.push
        //   // }
        //     console.log('layer-obj' + layers[i].wv.def.visible + 'group' +layers[i].wv.def.palette);

        // }
    }

    self.newPoint = function(pixel) {
        self.pixel = pixel;
    }

    self.retrieveValues = function() {

    }
}