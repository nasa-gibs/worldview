$(function() {// Initialize "static" vars

    var log = Logging.getLogger();
    
    var entryPoint = function() {  
        
        // Error handlers
        Worldview.Events.errorHandler = function(error) {
            Worldview.error("Internal error", error);
        };
        
        // Place any quirky browser related items in the function called 
        // below.
        Worldview.Support.quirks();
        
        // A message can be displayed to the user (for example, notification
        // of a pending outage) by adding a notice.txt file in the web root                     
        $.get("notice.txt", function(message) {
            var html = message.replace(/\n/g, "<br/>");
            Worldview.notify(html);
        });
        
        // Place any resources that should be completely loaded before 
        // starting up the UI
        Worldview.Preloader([
            { id: "config", src: "data/config", type:"json" },
            "images/logo.png",
            "images/permalink.png",
            "images/geographic.png",
            "images/arctic.png",
            "images/antarctic.png",
            "images/camera.png",
            "images/cameraon.png",
            "images/information.png",
            "images/expandIn.png",
            "images/expandOut.png",
            "images/visible.png",
            "images/invisible.png",
            "images/close-red-x.png",
            "images/collapseDown.png",
            "images/expandUp.png",
            "images/activity.gif"   
        ]).execute(onLoad);
    };

    var onLoad = function(queue) {
        try {
            var config = queue.getResult("config");
            init(config);
        } catch ( error ) {
            Worldview.error("Unable to start Worldview", error);
        }
    };
      
    var init = function(config) {  	
        // Convert all parameters found in the query string to an object, 
        // keyed by parameter name       
        config.parameters = Worldview.queryStringToObject(location.search);
        
        // Features that are important for debugging but are not necessary
        // for Worldview to opeerate properly
        debuggingFeatures(config);
        
        // Models
        var dataDownloadModel = Worldview.DataDownload.Model(config);

        // Create widgets 
        var map = Worldview.Widget.WorldviewMap("map", config);
	    var palettes = Worldview.Widget.Palette("palettes", config, {
	        alignTo: "#products"
        });	
        var projection = new SOTE.widget.Switch("switch", {
            dataSourceUrl:"a",
            selected:"geographic"
        });
        var products = new SOTE.widget.Products("productsHolder", {
            paletteWidget: palettes,
            config: config
        });
        var date = new SOTE.widget.DatePicker("time", {
            hasThumbnail: false
        });
        var rubberBand = new SOTE.widget.RubberBand("camera", {
            icon: "images/camera.png",
            onicon: "images/cameraon.png",
            cropee: "map",
            paletteWidget: palettes,
            mapWidget: map
        });
        var imageDownload = new SOTE.widget.ImageDownload("imagedownload", {
            baseLayer: "MODIS_Terra_CorrectedReflectance_TrueColor",
            alignTo: rubberBand, 
            m: map
        });		
        var apcn = new Worldview.Widget.ArcticProjectionChangeNotification(
            config, products.b
        );
        var opacity = new Worldview.Widget.Opacity(config);
        var epsg = new Worldview.Widget.EPSG(config);
		var events = new SOTE.widget.Events("eventsHolder", {
		    mapWidget: map, 
  		    paletteWidget: palettes,
            switchWidget: projection,
		    bankWidget: products,
		    dateWidget: date,
		    apcmWidget: apcn,
		    wvOpacity: opacity,
		    wvEPSG: epsg
	    });
        var dataDownload = Worldview.Widget.DataDownload({
            selector: ".dataDownload-modeButton",
            model: dataDownloadModel, 
            config: config,
            maps: map.maps
        });
                 
	    // Register event listeners
        REGISTRY.addEventListener("time", 
                "map", "imagedownload", apcn.containerId, epsg.containerId, 
                dataDownload.containerId);
        REGISTRY.addEventListener("switch", 
                "map", "products", "selectorbox", "imagedownload", "camera", 
                apcn.containerId, epsg.containerId, dataDownload.containerId);
        REGISTRY.addEventListener("products", 
                "map", "selectorbox", "imagedownload", "palettes", 
                apcn.containerId, dataDownload.containerId);
        REGISTRY.addEventListener("selectorbox","products");
        REGISTRY.addEventListener("camera","imagedownload");
        REGISTRY.addEventListener("palettes","map","camera","products");
        REGISTRY.addEventListener("opacity", "map");
        REGISTRY.addEventListener(epsg.containerId, "imagedownload");

        // These are only convienence handles to important objects used
        // for console debugging. Code should NOT reference these as they
        // are subject to change or removal.
        Worldview.config = config;                
        Worldview.opacity = opacity;
        Worldview.palettes = palettes; 
        Worldview.view = map;
        Worldview.ddm = dataDownloadModel;
        Worldview.maps = map.maps;
        
        // Initialize widgets
        var queryString = 
            Worldview.Permalink.decode(window.location.search.substring(1));
        
        var initOrder = [
            projection, 
            products.b, // bank
            date, 
            map, 
            palettes,
            apcn,
            opacity,
            epsg
        ];
        
        function testQS(){
            REGISTRY.isLoadingQuery = true;
            $.each(initOrder, function(index, component) {
                component.loadFromQuery(queryString);    
            });
            REGISTRY.isLoadingQuery = false;
        }
                
        if (queryString.length > 0) {
            REGISTRY.addAllReadyCallback(testQS);
        }
        
        // Console notifications
        var banner = Worldview.NAME + " - Version " + Worldview.VERSION;
        if ( !Worldview.isDevelopment() ) {
            banner += " - " + Worldview.BUILD_TIMESTAMP;
        } 	    
        log.info(banner);
        if ( Worldview.isDevelopment() ) {
            log.warn("Development version");
        }
        	  
        // Do not start the tour if coming in via permalink         
        if ( !queryString ) {         
            Worldview.Tour.start(false);  
        } 
    };
        
    var debuggingFeatures = function(config) {
        // Allow the current day to be overridden
        if ( config.parameters.now ) {
            try {
                var now = Date.parseISOString(config.parameters.now);
                Worldview.overrideNow(now);
                log.warn("Overriding now: " + now.toISOString());   
            } catch ( error ) {
                log.error("Invalid now: " + query.now, error);
            } 
        }
        
        // Install a black palette which can be used to find "holes" in 
        // LUT mappings.
        if ( Worldview.isDevelopment() ) {
            var debugPalette = Worldview.Palette.Palette({
                id: "__DEBUG",
                name: "Debug",
                stops: [{at: 0, r: 0, g: 0, b: 0, a: 0}]
            });
            config.palettes["__DEBUG"] = debugPalette;
            config.paletteOrder.unshift("__DEBUG");
        }        
    };
        
    try {
        entryPoint();	
    } catch ( cause ) {
        Worldview.error("Failed to start Worldview", cause);
    }  
    
});
