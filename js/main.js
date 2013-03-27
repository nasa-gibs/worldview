$(function() {// Initialize "static" vars

    var log = Logging.getLogger();
    var selector;
    
    var entryPoint = function() {      
        $.get("notice.txt", function(message) {
            var html = message.replace(/\n/g, "<br/>");
            Worldview.notify(html);
        });
        	            	
        $.getJSON("data/config", onConfigLoad)
                .error(Worldview.ajaxError(onConfigLoadError));
    }
  
    var init = function(config) {  	
        
        Worldview.Map.tileScheduler = Worldview.Scheduler({
            script: "js/Worldview/Map/TileWorker.js", 
            max: 4
        });
                    	            	    	            	    	            	    	    	    	            	    	    
        selector = new YAHOO.widget.Panel("selector", { zIndex:1019, visible:false } );
        selector.setBody("<div id='selectorbox'></div>");
        selector.render(document.body);
        var sel_id = selector.id;
        selector.beforeHideEvent.subscribe(function(e){ $("#"+sel_id).css("display","none");})
        selector.beforeShowEvent.subscribe(function(e){$("#"+sel_id).css("display","block");})
        
        // Create map 
        var m = Worldview.Widget.WorldviewMap("map", config);
        var palettes = Worldview.Widget.Palette("palettes", config, {alignTo: "#products"});
        var ss = new SOTE.widget.Switch("switch",{dataSourceUrl:"a",selected:"geographic"});
        var a = new SOTE.widget.Bank("products",{paletteWidget: palettes, dataSourceUrl:"ap_products.php",title:"My Layers",selected:{antarctic:"baselayers,MODIS_Terra_CorrectedReflectance_TrueColor~overlays,antarctic_coastlines", arctic:"baselayers,MODIS_Terra_CorrectedReflectance_TrueColor~overlays,arctic_coastlines",geographic:"baselayers,MODIS_Terra_CorrectedReflectance_TrueColor~overlays,sedac_bound"},categories:["Base Layers","Overlays"],callback:showSelector,selector:selector,config:config});
        var s = new SOTE.widget.Selector("selectorbox",{dataSourceUrl:"ap_products.php",categories:["Base Layers","Overlays"]});
        //var h = new SOTE.widget.MenuPicker("hazard",{dataSourceUrl:"data/mp_hazard.php"});
        //var tr = new SOTE.widget.MenuPicker("transition",{dataSourceUrl:"data/mp_transition.php"});
        var map = new SOTE.widget.DateSpan("time",{hasThumbnail:false});
        //Image download variables
        rb = new SOTE.widget.RubberBand("camera",{icon:"images/camera.png",onicon:"images/cameraon.png",cropee:"map",paletteWidget:palettes,mapWidget:m});
        var id = new SOTE.widget.ImageDownload("imagedownload",{baseLayer:"MODIS_Terra_CorrectedReflectance_TrueColor",alignTo: rb, m:m});		
        
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
        	    
        REGISTRY.addEventListener("map","time","imagedownload");
        REGISTRY.addEventListener("time","map","imagedownload");
        REGISTRY.addEventListener("switch","map","products","selectorbox","time", "imagedownload", "camera");
        REGISTRY.addEventListener("products","map","time","selectorbox","imagedownload","palettes");
        REGISTRY.addEventListener("selectorbox","products");
        REGISTRY.addEventListener("camera","imagedownload");
        REGISTRY.addEventListener("palettes","map","camera","products");
        
        /*REGISTRY.addEventListener("map","time");
        REGISTRY.addEventListener("time","map");
        REGISTRY.addEventListener("switch","map","products","selectorbox","time");
        REGISTRY.addEventListener("products","map","time","selectorbox");
        REGISTRY.addEventListener("selectorbox","products");
        //REGISTRY.addEventListener("hazard","products");*/
        
        var queryString = Worldview.Permalink.decode(window.location.search.substring(1));

        function testQS(){
              var comps = REGISTRY.getComponents();
              for (var i=0; i < comps.length; i++) {
                if(typeof comps[i].obj.loadFromQuery == 'function'){
                    comps[i].obj.loadFromQuery(queryString);
                }
              }
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
        
        startTour();   
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
            Worldview.config = Object.freeze(config);
            init(Worldview.config);
        } catch ( error ) {
            Worldview.error("Unable to start Worldview", error);
        }
    };
    
    var onConfigLoadError = function(message) {
        Worldview.error("Unable to load configuration from server", message);
    };
    

        
    try {
        Worldview.Support.quirks();
        entryPoint();	
    } catch ( cause ) {
        Worldview.error("Failed to start Worldview", cause);
    }  
		
});
