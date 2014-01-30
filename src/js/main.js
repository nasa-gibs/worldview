$(function() {// Initialize "static" vars

    var main = function() {
        var configURI = "conf/wv.json?v=" + wv.brand.BUILD_NONCE;
        var promise = $.getJSON(configURI)
            .done(init)
            .error(wv.util.error);
        wv.ui.indicator.delayed(promise, 2000);
    };

    var storageEngine;

    // FIXME: Make this more elegant
    var init = function(config) {
        try {
            _init(config);
        } catch ( error ) {
            wv.util.error(error);
        }
    };

    var _init = function(config) {
        wv.config = config;

        // Convert all parameters found in the query string to an object,
        // keyed by parameter name
        config.parameters = wv.util.fromQueryString(location.search);

        wv.debug.map(config);

    	// set up storage and decide what to show
    	if ( wv.util.browser.localStorage ) {
            try {
                storageEngine = YAHOO.util.StorageManager.get(
                    YAHOO.util.StorageEngineHTML5.ENGINE_NAME,
                    YAHOO.util.StorageManager.LOCATION_LOCAL,
                    {
                        force: false,
                        order: [
                            YAHOO.util.StorageEngineHTML5
                        ]
                    });
            } catch(e) {
                alert("No supported storage mechanism present");
                storageEngine = false;
            }
        }

        var hideSplash, eventsCollapsed, lastVisit;
        if(storageEngine) {
            storageEngine.subscribe(storageEngine.CE_READY, function() {
                hideSplash = storageEngine.getItem('hideSplash');
                eventsCollapsed = storageEngine.getItem('eventsCollapsed');
                lastVisit = storageEngine.getItem('lastVisit');
            });

            if(!lastVisit) {
            	lastVisit = Date.now();
            }
            storageEngine.setItem('lastVisit', Date.now());
            // FIXME: Hacking in for now
            Worldview.storageEngine = storageEngine;
        }
        //var lastVisitObj = new Date(lastVisit);
        var lastVisitObj = new Date("2013-04-07T00:00:00-04:00"); // FIXME

        // Features that are important for debugging but are not necessary
        // for Worldview to opeerate properly
        debuggingFeatures(config);

        // Models
        var models = {};

        // If at the beginning of the day, wait on the previous day until GIBS
        // catches up (about three hours)
        var initialDate = wv.util.today();
        if ( initialDate.getUTCHours() < 3 ) {
            initialDate.setUTCDate(initialDate.getUTCDate() - 1);
        }
        models.proj = wv.proj.model(config);
        models.palettes = wv.palettes.model(models, config);
        models.layers = wv.layers.model(models, config);
        models.date = wv.date.model({ initial: initialDate });
        var dataDownloadModel = Worldview.DataDownload.Model(config, {
            layersModel: models.layers
        });
        models.dataDownload = dataDownloadModel;
        models.link = wv.link.model(config);
        wv.models = models;
        var updateDateRange = function() {
            models.date.range(models.layers.dateRange());
        };
        models.layers.events
                .on("add", updateDateRange)
                .on("remove", updateDateRange)
                .on("update", updateDateRange);
        updateDateRange();

        // Error handlers
        models.palettes.events.on("error", error);

        // These are only convienence handles to important objects used
        // for console debugging. Code should NOT reference these as they
        // are subject to change or removal.
        Worldview.config = config;
        Worldview.models = models;

        // Legacy REGISTRY based widgets
        var legacySwitch = wv.legacy.switch_(models.proj);
        var legacyBank = wv.legacy.bank(models.layers);
        var legacyDate = wv.legacy.date(models.date);
        var legacyPalettes = wv.legacy.palettes(models.palettes);
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
            var crs = new Worldview.Widget.CRS(config);

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
            var dataDownload = Worldview.Widget.DataDownload(config, {
                selector: "#DataDownload",
                model: dataDownloadModel,
                maps: map.maps,
            });
            dataDownload.render();

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
                .on("dataDownloadSelect", function() {
                    dataDownloadModel.activate();
                })
                .on("dataDownloadUnselect", function() {
                    dataDownloadModel.deactivate();
                });
            dataDownloadModel.events
                .on("activate", function() {
                    ui.sidebar.selectTab("download");
                });
            map.maps.events
                .on("moveEnd", function(map) {
                    dataDownload.onViewChange(map);
                })
                .on("zoomEnd", function(map) {
                    dataDownload.onViewChange(map);
                });
            dataDownloadModel.events
                .on("queryResults", function() {
                    dataDownload.onViewChange(map.maps.map);
                });

    	    // Register event listeners
    	    REGISTRY.addEventListener("map", "imagedownload");
            REGISTRY.addEventListener("time",
                    "map", "imagedownload", crs.containerId,
                    dataDownload.containerId);
            REGISTRY.addEventListener("switch",
                    "map", "products", "selectorbox", "imagedownload", "camera",
                    crs.containerId, dataDownload.containerId);
            REGISTRY.addEventListener("products",
                    "map", "selectorbox", "imagedownload", "palettes",
                    dataDownload.containerId);
            REGISTRY.addEventListener("selectorbox","products");
            REGISTRY.addEventListener("camera","imagedownload");
            REGISTRY.addEventListener("palettes","map","camera","products");
            REGISTRY.addEventListener(crs.containerId, "imagedownload");


            // Console notifications
            if ( wv.brand.release() ) {
                console.info(wv.brand.NAME + " - Version " + wv.brand.VERSION +
                    " - " + wv.brand.BUILD_TIMESTAMP);
            } else {
                console.warn("Development version");
            }

            // Do not start the tour if coming in via permalink or if local
            // storage is not available
            if ( !window.location.search && storageEngine ) {
                Worldview.Tour.start(storageEngine, hideSplash, false);
            }

            wv.debug.gibs(ui, models, config);

            window.onbeforeunload = function() {
                var events = events || {};
                if ( storageEngine && events ) {
       	            storageEngine.setItem('eventsCollapsed', events.isCollapsed);
       	        }
          	};
      	}).fail(wv.util.error);
    };

    var debuggingFeatures = function(config) {
        // Allow the current day to be overridden
        if ( config.parameters.now ) {
            try {
                var now = Date.parseTimestampUTC(config.parameters.now);
                Worldview.overrideNow(now);
                console.warn("Overriding now: " + now.toISOString());
            } catch ( error ) {
                console.error("Invalid now: " + query.now, error);
            }
        }

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

    var error = function() {
        wv.util.error.apply(null, arguments);
    };

    try {
        main();
    } catch ( cause ) {
        wv.util.error(cause);
    }

});

