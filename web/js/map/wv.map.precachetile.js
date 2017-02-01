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
wv.map.precachetile = wv.map.precachetile || function(models, config, cache, parent) {/*
     * Loaded the layers that are needed for any one date.
     * Checks the cache to see if a layer has already 
     * been added to cache.
     *
     * @method promiseDay
     * @static
     *
     * @param {object} date - Date of data to be displayed
     * on the map.
     *
     * @returns {object} Promise.all
     */
    self.promiseDay = function(date) {
        var viewState;
        var currentZ;
        var frameState;
        var extent;
        var pixelRatio;
        var layers;
        var map;
        var promiseArray;
        var projExtent;


        layers = getActiveLayersWithData(date);
        map = parent.selected;
        frameState = parent.selected.frameState_;
        pixelRatio = frameState.pixelRatio;
        viewState = frameState.viewState;
        // extent = getExtent(
        //     projExtent, //max
        //     map.getView().calculateExtent(map.getSize()) //window view
        // );
        promiseArray = layers.map(function(def) {
            var key;
            var layer;
            var renderer;
            var i = 0;

            i = 0;
            key = parent.layerKey(def, {date: date});
            layer = cache.getItem(key);
            if(layer) {
                cache.removeItem(key);
            }
            layer = parent.createLayer(def, {date: date});
            return new Promise(function(resolve, reject){
                var layers, layerPromiseArray;
                layers = layer.values_.layers;
                if(layer.values_.layers) {
                    layers = layer.getLayers().getArray();
                    layerPromiseArray = layers.map(function(layer) {
                        extent = calculateExtent(layer.getExtent(), map.getView().calculateExtent(map.getSize()));
                        return new Promise( function(resolve, reject) {
                            promiseTileLayer(layer, resolve, reject, extent, viewState, pixelRatio);
                        });
                    });
                    Promise.all(layerPromiseArray).then(function() {
                        resolve(date);
                    });

                } else {
                    promiseTileLayer(layer, resolve, reject, extent, viewState, pixelRatio);
                }

            });

        });
        return new Promise( function(resolve) {
            Promise.all(promiseArray).then(function() {
                resolve(date);
            });
        });
    };
    var getActiveLayersWithData = function(date) {
        var layers;
        var arra = [];
        layers = models.layers.get();
        _.each(layers, function(layer) {
            if(layer.visible && new Date(layer.startDate > date)) {
                arra.push(layer);
            }
        });
        return arra;
    };
    var calculateExtent = function(extent, viewportExtent) {

        
        if(extent[1] < -180) {
            // extent = getExtent(extent, viewportExtent);
            // console.log(extent)
            extent[1] = extent[1] + 360;
            extent[3] = extent[3] + 360;
            
        } else if(extent[1] > 180) {
            //extent = getExtent(extent, viewportExtent);
            extent[1] = extent[1] - 360;
            extent[3] = extent[3] - 360;
            
        } else {
            extent = getExtent(extent, viewportExtent);

        }
        //console.log(viewportExtent, extent)
        return extent;
    };
    var getsmallestExtent = function(extent, viewportExtent) {
        if(viewportExtent[0] > extent[0]) {
            extent[0] = viewportExtent[0];
        }
        if(viewportExtent[1] > extent[1]) {
            extent[1] = viewportExtent[0];
        }
        if(viewportExtent[2] > extent[2]) {
            extent[2] = viewportExtent[2];
        }
        if(viewportExtent[3] > extent[3]) {
            extent[3] = viewportExtent[3];
        }
        return extent;
    };
    var getExtent = function(extent1, extent2) {
        return ol.extent.getIntersection(extent1, extent2);
    };
    var promiseTileLayer = function(layer, resolve, reject, extent, viewState, pixelRatio) {
        var renderer, tileSource, currentZ, i, tileGrid, projection;
        projection = viewState.projection
        i = 0;
        renderer = new ol.renderer.canvas.TileLayer(layer);
        tileSource = layer.getSource();
        tileGrid = tileSource.getTileGridForProjection(projection);
        currentZ = tileGrid.getZForResolution(viewState.resolution, renderer.zDirection);
        tileGrid.forEachTileCoord(extent, currentZ, function(tileCoord) {
            var tile;
            tile = tileSource.getTile(tileCoord[0], tileCoord[1], tileCoord[2], pixelRatio, projection);
            tile.load();
            var loader = function(e) {
                if(e.type === 'tileloadend') {
                    --i;
                    if(i === 0) {
                        resolve();
                    }
                } else {
                     reject(new Error('No response at this URL'));
                    //resolve();// some gibs data is not accurate and rejecting this will break the animation if tile doesn't exist
                }
                this.un('tileloadend',loader); // remove event listeners from memory
                this.un('tileloaderror', loader);
            };
            tileSource.on('tileloadend',loader);
            tileSource.on('tileloaderror', loader);
            ++i;
        });
    };
    return self;
};