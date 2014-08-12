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

wv.map = (function(self) {

    self.CRS_WGS_84 = "EPSG:4326";

    self.CRS_WGS_84_QUERY_EXTENT = new OpenLayers.Bounds(-180, -60, 180, 60);

    self.CRS_WGS_84_QUERY_MASK =
        new OpenLayers.Geometry.MultiPolygon([
            new OpenLayers.Bounds(-180, -90, 180, -60).toGeometry(),
            new OpenLayers.Bounds(-180, 60, 180, 90).toGeometry()
        ]);

    self.parse = function(state, errors) {
        // 1.1 support
        if ( state.map ) {
            state.v = state.map;
            delete state.map;
        }
        if ( state.v ) {
            var extent = _.map(state.v.split(","), function(str) {
                return parseFloat(str);
            });
            var valid = wv.map.isExtentValid(extent);
            if ( !valid ) {
                errors.push({message: "Invalid extent: " + state.v});
                delete state.v;
            } else {
                state.v = extent;
            }
        }
    };

    /**
     * Determines if an exent object contains valid values.
     *
     * @method isExtentValid
     * @static
     *
     * @param extent {OpenLayers.Bound} The extent to check.
     *
     * @return {boolean} False if any of the values is NaN, otherwise returns
     * true.
     */
    self.isExtentValid = function(extent) {
        if ( _.isUndefined(extent) ) {
            return false;
        }
        var valid = true;
        if ( extent.toArray ) {
            extent = extent.toArray();
        }
        _.each(extent, function(value) {
            if ( isNaN(value) ) {
                valid = false;
                return false;
            }
        });
        return valid;
    };

    /**
     * Scheduler used to render canvas tiles.
     *
     * @attribute TILE_SCHEDULER {Scheduler}
     * @static
     * @readOnly
     */
    self.tileScheduler = _.once(function() {
        if ( wv.util.browser.webWorkers ) {
            return wv.map.palette.scheduler({
                script: "js/map/wv.map.tileworker.js?v=" + wv.brand.BUILD_NONCE,
                max: 4
            });
        }
    });

    /**
     * Sets the opacity of a layer. Since the backbuffer can interfere with
     * tile layers that have transparency, the transition effect is set to
     * none if the opacity is not equal to one.
     *
     * @method setOpacity
     * @static
     *
     * @param layer {OpenLayers.Layer} The layer to set the opacity
     * @param opacity {float} A value from 0 (transparent) to 1 (opaque).
     */
    self.setOpacity = function(layer, opacity) {
        layer.setOpacity(opacity);
        if ( opacity === 1 ) {
            var effect = layer.originalTransitionEffect || "resize";
            layer.transitionEffect = effect;
        } else {
            layer.originalTransitionEffect = layer.transitionEffect;
            layer.transitionEffect = "none";
        }
    };

    /**
     * Sets the visiblity of a layer. If the layer is supposed to be not
     * visible, this actually sets the opacity to zero. This allows the
     * quick transition effects between days.
     *
     * @method setVisibility
     * @static
     *
     * @param layer {OpenLayers.Layer} The layer to set the visiblity.
     *
     * @param visible {boolean} True if the layer should be visible, otherwise
     * false.
     *
     * @param opacity {float} The opacity that this layer should be if it
     * is visible. A value from 0 (transparent) to 1 (opaque).
     */
    self.setVisibility = function(layer, visible, opacity) {
        if ( layer.isControl ) {
            layer.setVisibility(visible);
        } else {
            var actualOpacity = ( visible ) ? opacity : 0;
            layer.div.style.opacity = actualOpacity;
            if ( visible && opacity > 0 && !layer.getVisibility() ) {
                layer.setVisibility(true);
            }
        }
    };

    self.getLayerByName = function(map, name) {
        var layers = map.getLayersByName(name);
        if ( layers && layers.length > 1 ) {
            throw new Error("Multiple layers found for: " + name);
        }
        if ( layers ) {
            return layers[0];
        }
    };

    self.isPolygonValid = function(polygon, maxDistance) {
        var outerRing = polygon.components[0];
        for ( var i = 0; i < outerRing.components.length - 1; i++ ) {
            var p1 = outerRing.components[i];
            var p2 = outerRing.components[i + 1];
            if ( Math.abs(p2.x - p1.x) > maxDistance ) {
                return false;
            }
        }
        return true;
    };

    self.adjustAntiMeridian = function(polygon, adjustSign) {
        var outerRing = polygon.components[0];
        var points = outerRing.components.slice();

        for ( var i = 0 ; i < points.length; i++ ) {
            if ( adjustSign > 0 && points[i].x < 0 ) {
                points[i] = new OpenLayers.Geometry.Point(
                    points[i].x + 360, points[i].y);
            }
            if ( adjustSign < 0 && points[i].x > 0 ) {
                points[i] = new OpenLayers.Geometry.Point(
                    points[i].x - 360, points[i].y);
            }
        }
        return new OpenLayers.Geometry.Polygon(
            [new OpenLayers.Geometry.LinearRing(points)]
        );
    };

    self.distance2D = function(p1, p2) {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) +
                        (Math.pow(p1.y - p2.y, 2)));
    };

    self.distanceX = function(p1, p2) {
        return Math.abs(p2.x - p1.x);
    };

    self.interpolate2D = function(p1, p2, amount) {
        var distX = p2.x - p1.x;
        var distY = p2.y - p1.y;

        var interpX = p1.x + (distX * amount);
        var interpY = p1.y + (distY * amount);

        return new OpenLayers.Geometry.Point(interpX, interpY);
    };

    // If multipolygon, return a list of the polygons. If polygon, return
    // the single item in a list
    self.toPolys = function(geom) {
        var polys = [];
        if ( geom.CLASS_NAME === "OpenLayers.Geometry.MultiPolygon" ) {
            polys = geom.components;
        } else {
            polys = [geom];
        }
        return polys;
    };

    return self;

})(wv.map || {});

wv.map.HoverControl = OpenLayers.Class(OpenLayers.Control, {

    layer: null,

    defaultHandlerOptions: {
        delay: 2000,
        pixelTolerance: 1,
        stopMove: false
    },

    featureHandler: null,

    initialize: function(layer, options) {
        this.layer = layer;
        this.handlerOptions = OpenLayers.Util.extend({},
                this.defaultHandlerOptions);
        OpenLayers.Control.prototype.initialize.apply(this, arguments);

        this.featureHandler = new OpenLayers.Handler.Feature(this, this.layer, {
            over: this.over,
            out: this.out
        }, {});
        this.handlers = {
             feature: this.featureHandler
         };
    },

    draw: function() {
        return false;
    },

    activate: function() {
        this.handlers.feature.activate();
    },

    deactivate: function() {
        this.handlers.feature.deactivate();
    },

    over: function(feature) {
        this.events.triggerEvent("hoverover", {feature: feature});
    },

    out: function(feature) {
        this.events.triggerEvent("hoverout", {feature: feature});
    }
});

wv.map.mock = function() {

    return {
        setDay: function() {},
        setOpacity: function() {},
        setVisibility: function() {},
        setZIndex: function() {},
        dispose: function() {},
        setLookup: function() {},
        clearLookup: function() {}
    };

};


wv.map.graticule = OpenLayers.Class(OpenLayers.Layer, {

    graticuleLineStyle: null,
    graticuleLabelStyle: null,
    graticule: null,
    isControl: true,

    initialize: function(name, options) {
        OpenLayers.Layer.prototype.initialize.apply(this, arguments);

        this.graticuleLineStyle = new OpenLayers.Symbolizer.Line({
            strokeColor: '#AAAAAA',
            strokeOpacity: 1.0,
            strokeWidth: 1.35,
            strokeLinecap: 'square',
            strokeDashstyle: 'dot'
        });

        this.graticuleLabelStyle = new OpenLayers.Symbolizer.Text({
            fontFamily: 'Courier New',
            fontSize: '12',
            fontWeight: '550',
            fontColor: '#EEE',
            fontOpacity: 1.0,
            labelOutlineColor: '#222',
            labelOutlineWidth: 3,
            labelOutlineOpacity: 1
        });
    },

    /*
     * Add the control when the layer is added to the map
     */
    setMap: function(map) {
        OpenLayers.Layer.prototype.setMap.apply(this, arguments);

        this.graticule = new OpenLayers.Control.Graticule({
            layerName: 'ol_graticule_control',
            numPoints: 2,
            labelled: true,
            lineSymbolizer: this.graticuleLineStyle,
            labelSymbolizer: this.graticuleLabelStyle
        });

        map.addControl(this.graticule);
    },

    /*
     * Remove the control when the layer is removed from the map
     */
    removeMap: function(map) {
        OpenLayers.Layer.prototype.removeMap.apply(this, arguments);
        map.removeControl(this.graticule);
        this.graticule.destroy();
        this.graticule = null;
    },

    setVisibility: function(value) {
        if ( !this.wvid || !this.graticule ) {
            return;
        }
        if ( value ) {
            this.graticule.activate();
        } else {
            this.graticule.deactivate();
        }
    },

    /*
     * Name of this class per OpenLayers convention.
     */
    CLASS_NAME: "wv.map.layers.graticule"
});
