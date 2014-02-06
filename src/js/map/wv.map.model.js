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

wv.map.model = wv.map.model || function(models, config) {

    var containerId = "map";
    var self = {};

    /**
     * Property: maps
     * The <maps> that contains the map objects, one for
     * each projection.
     */
    self.maps = null;

    self.selected = null;

    /**
     * Property: config
     * The map config object retrieved from the server that
     * defines the available projections and data products.
     */
    self.config = config;

    var init = function() {
        self.config = validateConfig(self.config);
        self.maps = wv.map.set(containerId, self.config, self);

        $.each(self.config.layers, function(name, config) {
            if ( config.defaultLayer === "true" ) {
                self.maps.append(name);
            }
        });
        setExtentToLeading();

        models.proj.events.on("select", onProjectionSelect);
        models.layers.events.on("change", onLayersChange);
        models.date.events.on("select", onDateSelect);
        models.palettes.events.on("change", onPalettesChange);

        onDateSelect();
        onProjectionSelect();
        onLayersChange();
        onPalettesChange();
    };

    self.load = function(state, errors) {
        if ( state.map ) {
            var map = self.maps.map;
            // Verify that the viewport extent overlaps the valid extent, if
            // invalid, just zoom out the max extent
            var extent = state.map;
            var intersects = extent.intersectsBounds(map.getExtent());
            if ( !intersects ) {
                errors.push({message: "Extent outside of range"});
                extent = map.getExtent();
            }
            self.maps.map.zoomToExtent(extent, true);
        }
    };

    self.save = function(state) {
        state.map = self.maps.map.getExtent().toBBOX();
    };

    var setExtentToLeading = function() {
        // Polar projections don't need to be positioned
        if ( self.maps.projection !== "geographic" ) {
            return;
        }

        var map = self.maps.map;

        // Set default extent according to time of day:
        //   at 00:00 UTC, start at far eastern edge of map: "20.6015625,-46.546875,179.9296875,53.015625"
        //   at 23:00 UTC, start at far western edge of map: "-179.9296875,-46.546875,-20.6015625,53.015625"
        var curHour = wv.util.now().getUTCHours();

        // For earlier hours when data is still being filled in, force a far eastern perspective
        if (curHour < 3) {
            curHour = 23;
        }
        else if (curHour < 9) {
            curHour = 0;
        }

        // Compute east/west bounds
        var minLon = 20.6015625 + curHour * (-200.53125/23.0);
        var maxLon = minLon + 159.328125;

        var minLat = -46.546875;
        var maxLat = 53.015625;

        var lat = minLat + (Math.abs(maxLat - minLat) / 2.0);
        var lon = minLon + (Math.abs(maxLon - minLon) / 2.0);
        var zoomLevel = 2;

        map.setCenter(new OpenLayers.LonLat(lon, lat), zoomLevel);
    };

    var onProjectionSelect = function() {
        self.maps.setProjection(models.proj.selected.id);
        self.selected = self.maps.map;
        onLayersChange();
    };

    var onLayersChange = function() {
        var active = models.layers.forProjection();
        var layers =
            _.pluck(active.baselayers, "id")
            .concat(_.pluck(active.overlays, "id"));
        var visible = models.layers.visible;
        self.maps.set(layers, visible);
    };

    var onDateSelect = function() {
        self.maps.setDay(models.date.selected);
    };

    var onPalettesChange = function() {
        self.maps.setPalettes(models.palettes.active);
    };

    /*
     * Make sure that all the required parameters exist in the map
     * configuration.
     */
    var validateConfig = function(config) {
        var root = ["defaults", "projections", "layers"];
        $.each(root, function(index, key) {
            if ( !config.hasOwnProperty(key) ) {
                throw key + " is required in the map configuration";
            }
        });
        var _config = ["projection"];
        $.each(_config, function(index, key) {
            if ( !(key in config.defaults ) ) {
                throw new Error("defaults." + key + " is required for the " +
                        "map configuraiton");
            }
        });
        return config;
    };
    init();
    return self;
};

