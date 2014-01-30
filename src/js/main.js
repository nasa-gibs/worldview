$(function() {// Initialize "static" vars

    var main = function() {
        var configURI = "conf/wv.json?v=" + wv.brand.BUILD_NONCE;
        var promise = $.getJSON(configURI)
            .done(wv.util.wrap(init))
            .error(wv.util.error);
        wv.ui.indicator.delayed(promise, 2000);
    };

    var storageEngine;

    var init = function(config) {
        // Export for debugging
        wv.config = config;

        // Convert all parameters found in the query string to an object,
        // keyed by parameter name
        config.parameters = wv.util.fromQueryString(location.search);

        // Switch to map2 for debugging if specified
        wv.debug.map(config);

        // If at the beginning of the day, wait on the previous day until GIBS
        // catches up (about three hours)
        var initialDate = wv.util.now();
        if ( initialDate.getUTCHours() < 3 ) {
            initialDate.setUTCDate(initialDate.getUTCDate() - 1);
        }

        // Models
        var models = {};

        models.proj     = wv.proj.model(config);
        models.palettes = wv.palettes.model(models, config);
        models.layers   = wv.layers.model(models, config);
        models.date     = wv.date.model({ initial: initialDate });
        models.data     = wv.data.model(models, config);
        models.link     = wv.link.model(config);

        // Export for debugging
        wv.models = models;


        var updateDateRange = function() {
            models.date.range(models.layers.dateRange());
        };
        models.layers.events
                .on("add", updateDateRange)
                .on("remove", updateDateRange)
                .on("update", updateDateRange);
        updateDateRange();

        // Legacy REGISTRY based widgets
        var legacySwitch    = wv.legacy.switch_(models.proj);
        var legacyBank      = wv.legacy.bank(models.layers);
        var legacyDate      = wv.legacy.date(models.date);
        var legacyPalettes  = wv.legacy.palettes(models.palettes);
        var map = Worldview.Widget.WorldviewMap("map", config);

        var mapBridge = {
            fromPermalink: function(queryString) {
                map.loadFromQuery(queryString);
            },
            toPermalink: function() {
                return map.getValue();
            }
        };
        models.link
            .register(models.proj)
            .register(models.layers)
            .register(models.date)
            .register(mapBridge)
            .register(models.palettes);
            // CRS?
            //.register(dataDownloadBridge);

        models.link.load();
        models.proj.change = wv.proj.change(models);

        // FIXME: This is a hack for now. Will be cleaned up in 0.7
        wv.palettes.startup(models, config).done(function() {

            // FIXME: Hack to get the map to read palette info
            map.updateComponent(models.link.toQueryString());

            // Create widgets
            var ui = {};
            ui.proj = wv.proj.ui(models);

            ui.sidebar = wv.layers.sidebar(models);
            ui.activeLayers = wv.layers.active(models, config);
            ui.addLayers = wv.layers.add(models, config);
            ui.dateSliders = wv.date.sliders(models, config);
            ui.dateLabel = wv.date.label(models);
            ui.dateWheels = wv.date.wheels(models, config);
            var rubberBand = new SOTE.widget.RubberBand("camera", {
                icon: "images/camera.png",
                onicon: "images/cameraon.png",
                cropee: "map",
                mapWidget: map
            });
            var imageDownload = new SOTE.widget.ImageDownload("imagedownload", {
                baseLayer: "MODIS_Terra_CorrectedReflectance_TrueColor",
                alignTo: rubberBand,
                m: map,
                config: config
            });

            // collapse events if worldview is being loaded via permalink
            if(window.location.search) {
            	eventsCollapsed = true;
            }
            /*
        	var events = new SOTE.widget.Events("eventsHolder", {
        		config: config,
        		models: models,
        		maps: map.maps,
        		shouldCollapse: eventsCollapsed,
        		lastVisit: lastVisitObj
         	});
            */
            ui.data = wv.data.ui(models, config, map.maps);
            ui.data.render();

            ui.link = wv.link.ui(models);

            $(window).resize(function() {
              if ($(window).width() < 720) {
                $('#productsHoldertabs li.first a').trigger('click');
              }
            });

            document.activeElement.blur();
            $("input").blur();
            $("#eventsHolder").hide();

            // Wirings
            ui.sidebar.events
                .on("dataDownloadSelect", models.data.activate)
                .on("dataDownloadUnselect", models.data.deactivate);

            models.data.events
                .on("activate", function() {
                    ui.sidebar.selectTab("download");
                })
                .on("queryResults", function() {
                    ui.data.onViewChange(map.maps.map);
                });
            map.maps.events
                .on("moveEnd", function(map) {
                    ui.data.onViewChange(map);
                })
                .on("zoomEnd", function(map) {
                    ui.data.onViewChange(map);
                });

    	    // Register event listeners
    	    REGISTRY.addEventListener("map", "imagedownload");
            REGISTRY.addEventListener("time",
                    "map", "imagedownload",
                    ui.data.containerId);
            REGISTRY.addEventListener("switch",
                    "map", "products", "selectorbox", "imagedownload", "camera",
                    ui.data.containerId);
            REGISTRY.addEventListener("products",
                    "map", "selectorbox", "imagedownload", "palettes",
                    ui.data.containerId);
            REGISTRY.addEventListener("selectorbox","products");
            REGISTRY.addEventListener("camera","imagedownload");
            REGISTRY.addEventListener("palettes","map","camera","products");

            // Console notifications
            if ( wv.brand.release() ) {
                console.info(wv.brand.NAME + " - Version " + wv.brand.VERSION +
                    " - " + wv.brand.BUILD_TIMESTAMP);
            } else {
                console.warn("Development version");
            }
            wv.debug.gibs(ui, models, config);
            wv.tour.introduction();
      	}).fail(wv.util.error);
    };

    /*
    var debuggingFeatures = function(config) {
        // Install a black palette which can be used to find "holes" in
        // LUT mappings.
        if ( config.parameters.debugPalette ) {
            var debugPalette = Worldview.Palette.Palette({
                id: "__DEBUG",
                name: "Debug",
                stops: [{at: 0, r: 0, g: 0, b: 0, a: 0}]
            });
            config.palettes["__DEBUG"] = debugPalette;
            config.paletteOrder.unshift("__DEBUG");
        }

        // Test error dialog
        if ( config.parameters.showError ) {
            Worldview.error("No error -- this is a test");
        }
    };
    */

    wv.util.wrap(main)();

});

