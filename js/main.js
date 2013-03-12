$(function() {// Initialize "static" vars

    var log = Logging.Logger();
    var selector;
    
    var entryPoint = function() {      
        $.get("notice.txt", function(message) {
            var html = message.replace(/\n/g, "<br/>");
            Worldview.notify(html);
        });
        	            	
        $.getJSON("data/config", onConfigLoad)
                .error(Worldview.ajaxError(onConfigLoadError));
    }
  
    var onConfigLoad = function(config) {  	    	            	    	            	    	            	    	    	    	            	    	    
        selector = new YAHOO.widget.Panel("selector", { zIndex:1019, visible:false } );
        selector.setBody("<div id='selectorbox'></div>");
        selector.render(document.body);
        var sel_id = selector.id;
        selector.beforeHideEvent.subscribe(function(e){ $("#"+sel_id).css("display","none");})
        selector.beforeShowEvent.subscribe(function(e){$("#"+sel_id).css("display","block");})
        
        // Create map 
        var m = Worldview.Widget.WorldviewMap("map", config);
        var palettes = Worldview.Widget.PaletteManager("palettes", config);
        var ss = new SOTE.widget.Switch("switch",{dataSourceUrl:"a",selected:"geographic"});
        var a = new SOTE.widget.Bank("products",{paletteManager: palettes, dataSourceUrl:"ap_products.php",title:"My Layers",selected:{antarctic:"baselayers,MODIS_Terra_CorrectedReflectance_TrueColor~overlays,antarctic_coastlines", arctic:"baselayers,MODIS_Terra_CorrectedReflectance_TrueColor~overlays,arctic_coastlines",geographic:"baselayers,MODIS_Terra_CorrectedReflectance_TrueColor~overlays,sedac_bound"},categories:["Base Layers","Overlays"],callback:showSelector,selector:selector});
        var s = new SOTE.widget.Selector("selectorbox",{dataSourceUrl:"ap_products.php",categories:["Base Layers","Overlays"]});
        //var h = new SOTE.widget.MenuPicker("hazard",{dataSourceUrl:"data/mp_hazard.php"});
        //var tr = new SOTE.widget.MenuPicker("transition",{dataSourceUrl:"data/mp_transition.php"});
        var map = new SOTE.widget.DateSpan("time",{hasThumbnail:false});
        //Image download variables
        rb = new SOTE.widget.RubberBand("camera",{icon:"images/camera.png",onicon:"images/cameraon.png",cropee:"map"});
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
        REGISTRY.addEventListener("products","map","time","selectorbox","imagedownload");
        REGISTRY.addEventListener("selectorbox","products");
        REGISTRY.addEventListener("camera","imagedownload");
        REGISTRY.addEventListener("palettes", "map");
        
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
                	    
        log.info(Worldview.NAME + ", Version " + Worldview.VERSION);	    
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
