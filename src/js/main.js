$(function() {// Initialize "static" vars

    var log = Logging.getLogger();
    var selector;
    var mobileSafari = false;
    
    var hideURLbar = function() {
	  	/*if(document.documentElement.scrollHeight<window.outerHeight/window.devicePixelRatio)
	    	document.documentElement.style.height=(window.outerHeight/window.devicePixelRatio)+'px';
	  	setTimeout(window.scrollTo(1,1),0);*/
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
	    	if (navigator.userAgent.indexOf('iPhone') != -1 && navigator.userAgent.indexOf('Safari')!=-1) {
		        var new_height = $(window).height();
		        // if mobileSafari add +60px
	        	new_height += 60; 
	        	$body.css('min-height', 0 );
	        	$body.css('height', new_height );
	        
		    }
	        
	    }
	 
	    setHeight( $('#mappage') );
	    $(window).resize(function() {
	        setHeight($('#mappage'));
	    });
	};
    
    var entryPoint = function() {  
        Worldview.Events.errorHandler = function(error) {
            Worldview.error("Internal error", error);
        };
        
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
  
    var init = function(config) {  	
        
        checkMobile();
        //console.log("init");
        
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
        
		var ev = new SOTE.widget.Events("eventsHolder", {mapWidget:m, 
        										   paletteWidget:palettes,
        										   switchWidget:ss,
        										   bankWidget:p,
        										   dateWidget:map,
        										   apcmWidget:apcn,
        										   wvOpacity:opacity,
        										   wvEPSG:epsg});

        var dataDownloadModel = Worldview.DataDownload.Model(config);
        var dataDownloadWidget = Worldview.Widget.DataDownload({
            selector: ".dataDownload-modeButton",
            model: dataDownloadModel, 
            config: config,
            maps: m.maps
        });
                 
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
        	    
        REGISTRY.addEventListener("time", "map", "imagedownload", 
                apcn.containerId, epsg.containerId, 
                dataDownloadWidget.containerId);
        REGISTRY.addEventListener("switch", "map", "products", "selectorbox", 
                "imagedownload", "camera", apcn.containerId, epsg.containerId,
                dataDownloadWidget.containerId);
        REGISTRY.addEventListener("products", "map", "selectorbox", 
                "imagedownload", "palettes", apcn.containerId,
                dataDownloadWidget.containerId);
        REGISTRY.addEventListener("selectorbox","products");
        REGISTRY.addEventListener("camera","imagedownload");
        REGISTRY.addEventListener("palettes","map","camera","products");
        REGISTRY.addEventListener("opacity", "map");
        REGISTRY.addEventListener(epsg.containerId, "imagedownload");
                
        Worldview.opacity = opacity; 
        Worldview.view = m;
        Worldview.ddm = dataDownloadModel;
        Worldview.maps = m.maps;
        
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
        
    var onLoad = function(queue) {
        try {
            var config = queue.getResult("config");
            if ( Worldview.isDevelopment() ) {
                var debugPalette = Worldview.Palette.Palette({
                    id: "__DEBUG",
                    name: "Debug",
                    stops: [{at: 0, r: 0, g: 0, b: 0, a: 0}]
                });
                config.palettes["__DEBUG"] = debugPalette;
                config.paletteOrder.unshift("__DEBUG");
            }
            config.parameters = Worldview.queryStringToObject(location.search);
            Worldview.config = config;
            init(Worldview.config);
        } catch ( error ) {
            Worldview.error("Unable to start Worldview", error);
        }
    };
        
    try {
        entryPoint();	
    } catch ( cause ) {
        Worldview.error("Failed to start Worldview", cause);
    }  
		
});
