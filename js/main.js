$(function() {// Initialize "static" vars

    var log = Logging.getLogger();
    var selector;
    var mobileSafari = false;
    
    var hideURLbar = function() {
		window.scrollTo(0, 1);
	};

	var checkMobile = function() {
		if (navigator.userAgent.indexOf('iPhone') != -1 || navigator.userAgent.indexOf('Android') != -1) {
			// In Safari, the true version is after "Safari" 
			if (navigator.userAgent.indexOf('Safari')!=-1) {
		  		// Set a variable to use later
		  		mobileSafari = true;
			}
		    addEventListener("load", function() {
		            setTimeout(hideURLbar, 0);
		    }, false);
		    addEventListener("orientationchange", function() {
		            setTimeout(hideURLbar, 0);
		    }, false);
		}
		
	    // Set the div height
	    function setHeight($body) {
	        var new_height = $(window).height();
	        // if mobileSafari add +60px
	        if (mobileSafari){ new_height += 60; };
	        $body.css('min-height', 0 );
	        $body.css('height', new_height );
	    }
	 
	    setHeight( $('#mappage') );
	    $(window).resize(function() {
	        setHeight($('#mappage'));
	    });
	};
    
    var entryPoint = function() {  
    	//console.log("entryPoint");
        Worldview.Support.quirks();
        
        var query = Worldview.queryStringToObject(location.search);
        if ( query.now ) {
            try {
                var now = Date.parseISOString(query.now);
                Worldview.overrideNow(now);
                log.warn("Overriding now: " + now.toISOString());   
            } catch ( error ) {
                log.error("Invalid now: " + query.now, error);
            } 
        }
                    
        $.get("notice.txt", function(message) {
            var html = message.replace(/\n/g, "<br/>");
            Worldview.notify(html);
        });
        	            	
        $.getJSON("data/config", onConfigLoad)
                .error(Worldview.ajaxError(onConfigLoadError));
    };
  
    var init = function(config) {  	
        
        checkMobile();
        //console.log("init");
        Worldview.Map.tileScheduler = Worldview.Scheduler({
            script: "js/Worldview/Map/TileWorker.js?v=" + 
                    Worldview.BUILD_TIMESTAMP, 
            max: 4
        });
        
        //$('#products').tabs();
             	            	    	            	    	            	    	    	    	            	    	    
        /*selector = new YAHOO.widget.Panel("selector", { zIndex:1019, visible:false } );
        selector.setBody("<div id='selectorbox'></div>");
        selector.render(document.body);
        var sel_id = selector.id;
        selector.beforeHideEvent.subscribe(function(e){ $("#"+sel_id).css("display","none");})
        //selector.beforeHideEvent.subscribe(closeSelector);
        selector.beforeShowEvent.subscribe(function(e){$("#"+sel_id).css("display","block");})
        //this.selector.subscribe("beforeHide", closeSelector);*/
        // Create map 
        var m = Worldview.Widget.WorldviewMap("map", config);
        window.config = config;
	    window.palettes = Worldview.Widget.Palette("palettes", config, {alignTo: "#products"});	
        var ss = new SOTE.widget.Switch("switch",{dataSourceUrl:"a",selected:"geographic"});
        var p = new SOTE.widget.Products("productsHolder");
        window.p = p;
        //var a = new SOTE.widget.Bank("products",{paletteWidget: palettes, dataSourceUrl:"ap_products.php",title:"My Layers",selected:{antarctic:"baselayers,MODIS_Terra_CorrectedReflectance_TrueColor~overlays,antarctic_coastlines", arctic:"baselayers,MODIS_Terra_CorrectedReflectance_TrueColor~overlays,arctic_coastlines",geographic:"baselayers,MODIS_Terra_CorrectedReflectance_TrueColor~overlays,sedac_bound"},categories:["Base Layers","Overlays"],callback:showSelector,selector:selector,config:config});
        //var s = new SOTE.widget.Selector("selectorbox",{dataSourceUrl:"ap_products.php",categories:["Base Layers","Overlays"]});

        //var h = new SOTE.widget.MenuPicker("hazard",{dataSourceUrl:"data/mp_hazard.php"});
        //var tr = new SOTE.widget.MenuPicker("transition",{dataSourceUrl:"data/mp_transition.php"});
        var map = new SOTE.widget.DatePicker("time",{hasThumbnail:false});

        //Image download variables
        rb = new SOTE.widget.RubberBand("camera",{icon:"images/camera.png",onicon:"images/cameraon.png",cropee:"map",paletteWidget:palettes,mapWidget:m});
        var id = new SOTE.widget.ImageDownload("imagedownload",{baseLayer:"MODIS_Terra_CorrectedReflectance_TrueColor",alignTo: rb, m:m});		
        var apcn = new Worldview.Widget.ArcticProjectionChangeNotification(config, p.b);
        var opacity = new Worldview.Widget.Opacity(config);
        var epsg = new Worldview.Widget.EPSG(config);

        // Get rid of address bar on iphone/ipod
        var fixSize = function() {
            window.scrollTo(0,0);
            document.body.style.height = '100%';
            if (!(/(iphone|ipod)/.test(navigator.userAgent.toLowerCase()))) {
                if (document.body.parentNode) {
                    document.body.parentNode.style.height = '100%';
                }
            }
        };
        setTimeout(fixSize, 700);
        setTimeout(fixSize, 1500);
        	    
        //REGISTRY.addEventListener("map","time","imagedownload");
        REGISTRY.addEventListener("time","map","imagedownload", apcn.containerId, epsg.containerId);
        REGISTRY.addEventListener("switch","map","products","selectorbox", "imagedownload", "camera", apcn.containerId, epsg.containerId);
        REGISTRY.addEventListener("products","map","selectorbox","imagedownload","palettes", apcn.containerId);
        REGISTRY.addEventListener("selectorbox","products");
        REGISTRY.addEventListener("camera","imagedownload");
        REGISTRY.addEventListener("palettes","map","camera","products");
        REGISTRY.addEventListener("opacity", "map");
        REGISTRY.addEventListener(epsg.containerId, "imagedownload");
        
        /*REGISTRY.addEventListener("map","time");
        REGISTRY.addEventListener("time","map");
        REGISTRY.addEventListener("switch","map","products","selectorbox","time");
        REGISTRY.addEventListener("products","map","time","selectorbox");
        REGISTRY.addEventListener("selectorbox","products");
        //REGISTRY.addEventListener("hazard","products");*/
        
        Worldview.opacity = opacity; 
        Worldview.view = m;
        
        var queryString = 
            Worldview.Permalink.decode(window.location.search.substring(1));
        
        var initOrder = [
            ss, // projection
            p.b, // products
            map, // time
            m, // map
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
        
    var onConfigLoad = function(config) {
        try {
            if ( Worldview.isDevelopment() ) {
                var debugPalette = Worldview.Palette.Palette({
                    id: "__DEBUG",
                    name: "Debug",
                    stops: [{at: 0, r: 0, g: 0, b: 0, a: 0}]
                });
                config.palettes["__DEBUG"] = debugPalette;
                config.paletteOrder.unshift("__DEBUG");
            }
            Worldview.config = config;
            init(Worldview.config);
        } catch ( error ) {
            Worldview.error("Unable to start Worldview", error);
        }
    };
    
    var onConfigLoadError = function(message) {
        Worldview.error("Unable to load configuration from server", message);
    };
    

        
    try {
        entryPoint();	
    } catch ( cause ) {
        Worldview.error("Failed to start Worldview", cause);
    }  
		
});
