SOTE.namespace("SOTE.widget.Map");
SOTE.widget.Map.prototype = new SOTE.widget.Component;


/**
  * Instantiate the map  
  *
  * @class Instantiates a map projection layered with images retrieved from the specified client
  *     derived from the given bounding box, date, and data product
  * @constructor
  * @this {map}
  * @param {String} containerId is the container id of the div in which to render the object 
  * @param {Object} [config] is a hash allowing configuration of this component
  * @config {boolean} [hasControls] whether or not the produced map should have zoom and pan controls
  * @config {boolean} [isSelectable] whether or not a bounding box selection is allowed
  * @config {String} [bbox] the extent of the map as w,s,e,n
  * @augments SOTE.widget.Component
  * 
*/
SOTE.widget.Map = function(containerId, config){
	
	// Get the ID of the container element
	this.container=document.getElementById(containerId);
	if (this.container==null){
		this.setStatus("Error: element '"+containerId+"' not found!",true);
		return;
	}
	
	// Store the container's ID
	this.containerId=containerId;
	this.id = containerId;   

	//
	// Constants
	//
	this.DEFAULT_OVERLAY_OPACITY = 0.95;
	
	var currentDate = new Date();
	var gibsStartDate = new Date(2012, 5, 1, 0, 0, 0, 0);

	// Compute number of days by converting from ms
	var numDaysToGenerate = (currentDate.getTime() - gibsStartDate.getTime()) / (24 * 60 * 60 * 1000) + 1;

	// Number of "days" to generate for each layer 
	this.NUM_DAYS_TO_GENERATE = Math.round(numDaysToGenerate);

	
	// Resolutions / zoom levels supported by the current map
	this.RESOLUTIONS_ON_SCREEN_GEO_ALL =  
		[0.5625, 0.28125, 0.140625,
		 0.0703125, 0.03515625, 0.017578125,
		 0.0087890625, 0.00439453125, 0.002197265625];
		 
	this.RESOLUTIONS_ON_SCREEN_POLAR_ALL =  
		[8192.0, 4096.0, 2048.0,
		 1024.0, 512.0, 256.0];

	// Resolutions / zoom levels supported by the server 
	this.RESOLUTIONS_ON_SERVER_GEO_250m =  
		[0.5625, 0.28125, 0.140625,
		 0.0703125, 0.03515625, 0.017578125,
		 0.0087890625, 0.00439453125, 0.002197265625];
	
	this.RESOLUTIONS_ON_SERVER_POLAR_250m =
		[8192.0, 4096.0, 2048.0,
		 1024.0, 512.0, 256.0];
		 
	this.TILEMATRIXSET_GEO_250m = "EPSG4326_250m";
		 
		 
	this.RESOLUTIONS_ON_SERVER_GEO_500m =  
		[0.5625, 0.28125, 0.140625,
		 0.0703125, 0.03515625, 0.017578125,
		 0.0087890625, 0.00439453125];
		 
	this.RESOLUTIONS_ON_SERVER_POLAR_500m =
		[8192.0, 4096.0, 2048.0,
		 1024.0, 512.0];
		 
	this.TILEMATRIXSET_GEO_500m = "EPSG4326_500m";


	this.RESOLUTIONS_ON_SERVER_GEO_1km =  
		[0.5625, 0.28125, 0.140625,
		 0.0703125, 0.03515625, 0.017578125,
		 0.0087890625];
		 
	this.RESOLUTIONS_ON_SERVER_POLAR_1km =
		[8192.0, 4096.0, 2048.0,
		 1024.0];	
		 
	this.TILEMATRIXSET_GEO_1km = "EPSG4326_1km";
	
		 
	this.RESOLUTIONS_ON_SERVER_GEO_2km =  
		[0.5625, 0.28125, 0.140625,
		 0.0703125, 0.03515625, 0.017578125];
		 
	this.RESOLUTIONS_ON_SERVER_POLAR_2km =
		[8192.0, 4096.0, 2048.0];
		
	this.TILEMATRIXSET_GEO_2km = "EPSG4326_2km";
		 	

	// Define an object for holding configuration 
	if (config===undefined){
		config={};
	}

	if(config.hasControls === undefined){
	    config.hasControls = true;
	}

	if(config.isSelectable === undefined){
	    config.isSelectable = false; 
	}

 	if(config.bbox === undefined)
 	{
 		// Set default extent according to time of day:  
 		//   at 00:00 UTC, start at far eastern edge of map: "20.6015625,-46.546875,179.9296875,53.015625"
 		//   at 23:00 UTC, start at far western edge of map: "-179.9296875,-46.546875,-20.6015625,53.015625"
	 	var curHour = new Date().getUTCHours();

		// For earlier hours when data is still being filled in, force a far eastern perspective
		if (curHour < 9)
			curHour = 0;

		// Compute east/west bounds
		var minLon = 20.6015625 + curHour * (-200.53125/23.0);
		var maxLon = minLon + 159.328125;
 		 
	    config.bbox = minLon.toString() + ",-46.546875,"+maxLon.toString()+",53.015625"; //"-148.359375,-47.25,4.78125,60.1875"; //"-175, -85, 175, 85";
	}	
	
	
	if(config.dataSourceUrl === undefined){
	    config.dataSourceUrl = null;
	}

	if(config.maxWidth === undefined){
	    config.maxWidth = null; 
	}

 	if(config.maxHeight === undefined){
	    config.maxHeight = null;
	}
	
	if (config.layers === undefined){
		config.layers = null;	
	}
  
  	if (config.time === undefined)
  	{
  		config.time = new Date();
  		config.time = config.time.getUTCFullYear() + "-" + SOTE.util.zeroPad(eval(config.time.getUTCMonth()+1),2) + "-" + 
		SOTE.util.zeroPad(config.time.getUTCDate(),2) + "T" + SOTE.util.zeroPad(config.time.getUTCHours(),2) + ":" + 
		SOTE.util.zeroPad(config.time.getUTCMinutes(),2) + ":" + SOTE.util.zeroPad(config.time.getUTCSeconds(),2);
  	}
  	
  	if (config.baselayer === undefined)
  	{
  		config.baselayer = null;
  	}
  
  	// this.selectionEvent = new YAHOO.util.CustomEvent("SelectionEvent",this);
       
    this.hasControls = config.hasControls;
    this.isSelectable = config.isSelectable;
    this.bbox = config.bbox;
    //this.date = config.date;
    this.value = "";
	this.register = config.register;
	this.maxWidth = config.maxWidth;
	this.maxHeight = config.maxHeight;
	this.dataSourceUrl = config.dataSourceUrl;
	this.statusStr = "";
	this.disabled = false;
	this.time = config.time;
	this.baseLayer = config.baseLayer;
	this.graticule = null;
	this.projection = "EPSG:4326";
  
	// Initialize the map
	this.init();
	
    if(REGISTRY){
 		REGISTRY.register(this.id,this);
	}
	else{
		alert("No REGISTRY found!  Cannot register Map!");
	}
	

  	// // Load layers into memory
  	this.isSoteMapDataCached = false;
  	this.updateComponent("");
   	
  	// Set active layer if params set
  	if ((this.time != null) && (this.baseLayer != null))
  	{
  		this.activateRelevantLayersDisableTheRest([this.baseLayer],this.time);
  	}	
 
 
  	// Set extent
  	this.setExtent(this.bbox);
 
	// Set up callback for when pan/zoom ends to auto-call the "fire" function
	//this.map.events.register("moveend", this, this.handleMapMoveEnd); 

	if(REGISTRY){
 		REGISTRY.markComponentReady(this.id);
	}
};


/**
 * OpenLayers callback that's called as soon as user stops moving the map and releases
 * the mouse/touch;  currently used to notify all listeners that the map extent
 * has changed.
 */
SOTE.widget.Map.prototype.handleMapMoveEnd = function(evt)
{
	var latLon = evt.object.getExtent().transform(
			evt.object.getProjectionObject(),
            new OpenLayers.Projection(this.projection)).toString();
    
    this.setValue(latLon);
    this.fire(); 
};


/**
 * Activates/enables the specified products at the specified time step;  useful to
 * ensure that only the currently-enabled products at the specified time are currently
 * being displayed.
 * 
 * @param 	an array of strings containing the currently-active product names
 * @param 	string of desired UTC time  
 */
SOTE.widget.Map.prototype.activateRelevantLayersDisableTheRest = function(activeProductNames, time)
{
	// Enable layers of selected Date, disable the rest
	var allLayers = this.getAllLayers();
	var nLayers = allLayers.length;
	var myDate = SOTE.util.UTCDateFromISO8601String(time);
	time = myDate.getUTCFullYear() + "-" + SOTE.util.zeroPad(eval(myDate.getUTCMonth()+1),2) + "-" + SOTE.util.zeroPad(myDate.getUTCDate(),2);
	// Loop through all loaded OpenLayers layers
	for (var i=0; i<nLayers; i++)
	{	
		// Enable this layer if in list of active layers
		var isLayerFound = false;
		for (var j=0; j<activeProductNames.length; j++)
		{
			if ((allLayers[i].name == new String(activeProductNames[j] + "__" + time)) ||
				(allLayers[i].name == new String(activeProductNames[j])))
			{
				// Assume base layer is first element of product list and force it to have the lowest z-index
				// (a z-index of 0 is lowest, higher numbers are drawn on top)
				// Also: Set opacity to 1.0 for base layer, a fraction of it for overlays (until controls can be made)
				allLayers[i].setVisibility(true);
				isLayerFound = true;
				
					if (j==0)
					{
						this.map.setLayerZIndex(allLayers[i], 0);
						allLayers[i].setOpacity(1.0);
					}
					else
					{
						// Set Z-layering
						/*if (this.checkWmsParam(allLayers[i].metadata.bringToFront) && allLayers[i].metadata.bringToFront)
							this.map.setLayerZIndex(allLayers[i], nLayers-1);						
						*/
						// Set opacity
						if (this.checkWmsParam(allLayers[i].metadata.preferredOpacity))
							allLayers[i].setOpacity(allLayers[i].metadata.preferredOpacity);
						else
							allLayers[i].setOpacity(this.DEFAULT_OVERLAY_OPACITY);
						if(activeProductNames.length > 2){
							this.map.setLayerZIndex(allLayers[i],nLayers-j);
						}
						
					}
			}			
			
		}

		// Disable the layer if it wasn't found		
		if (!isLayerFound)
		{
			allLayers[i].setVisibility(false);	
		}	

		
	}

};


/**
  * Displays the map with a base layer and pan and zoom controls (if hasControls is true)
  * All callbacks should be set.  The component UI should be rendered 
  * with controllers to call the events.
  *
  *  
  * @this {map}
  * 
*/
SOTE.widget.Map.prototype.init = function(){
		this.container.innerHTML = "";
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
		
		var map = document.createElement("div");
		map.setAttribute("id",this.id+"map");
		this.container.appendChild(map);
		
	
		if(this.projection == "EPSG:4326"){
			// Init map
	        this.map = new OpenLayers.Map({
		        div: this.containerId,
		        theme: null,
		        controls: [],
		        maxExtent: new OpenLayers.Bounds(-180,-1350,180,90),
		        projection:this.projection,
		        numZoomLevels:9, 
		        fractionalZoom: false,
		        //maxResolution:0.5625,
		        resolutions: this.RESOLUTIONS_ON_SCREEN_GEO_ALL,
		        allOverlays: true,
		        zoom: 2
		    });
		    
		}
		else {
			this.map = new OpenLayers.Map({
		        div: this.containerId,
		        theme: null,
		        controls: [],
		        maxExtent: new OpenLayers.Bounds(-4194304,-4194304,4194304,4194304), 
		        projection:this.projection,
		        //maxResolution:8192.0,
		        resolutions: this.RESOLUTIONS_ON_SCREEN_POLAR_ALL,
		        allOverlays: true,
		        zoom: 2,
				units: "m", 
			    numZoomLevels: 6,
		    });

		}

	    
	          

        // Add user controls, if necessary
        if (this.hasControls)
        {	
        	// Create zoom in/out controls	        	        
	        var zoomInControl = new OpenLayers.Control.ZoomIn();
	        zoomInControl.title = 'zoom in';
	        zoomInControl.displayClass = 'olControlZoomInCustom';
	        zoomInControl.id = 'zoomInCustomId';
			
			var zoomOutControl = new OpenLayers.Control.ZoomOut();
	        zoomOutControl.title = 'zoom out';
	        zoomOutControl.displayClass = 'olControlZoomOutCustom';
	        zoomOutControl.id = 'zoomOutCustomId';

	        // Create panel to hold zoom controls and add to map
	        var zoomPanel = new OpenLayers.Control.Panel();
            zoomPanel.displayClass = 'olControlZoomPanelCustom';
		    zoomPanel.addControls(zoomInControl);
		    zoomPanel.addControls(zoomOutControl);
		    this.map.addControl(zoomPanel);
		    
	        // Add navigation controls
        	//this.map.addControl(new OpenLayers.Control.KeyboardDefaults());
        	this.map.addControl(new OpenLayers.Control.Navigation({
        			dragPanOptions: {
	                    enableKinetic: true
	                }
        		
        	}));
        	//this.map.addControl(new OpenLayers.Control.LayerSwitcher({displayClass: 'olControlLayerSwitcher', 'ascending':false}));
            //this.map.addControl(new OpenLayers.Control.OverviewMap());
        	
        	// While these aren't controls, per se, they are extra decorations
			this.map.addControl(new OpenLayers.Control.Attribution());
			this.map.addControl(new OpenLayers.Control.ScaleLine({displayClass: 'olControlScaleLineCustom'}));
			
			// Add graticule
			var graticuleLineStyle = new OpenLayers.Symbolizer.Line(
				{
					strokeColor: '#AAAAAA',
					strokeOpacity: 0.65,
					strokeWidth: 1.35,
					strokeLinecap: 'square',
					strokeDashstyle: 'dot'
				}
			);
			var graticuleLabelStyle = new OpenLayers.Symbolizer.Text(
				{
					fontFamily: 'Gill Sans',
					fontSize: '16',
					fontWeight: '550',
					fontColor: '#e10000',
					fontOpacity: 1.0
				}
			);			
			this.graticule = new OpenLayers.Control.Graticule({
				layerName: 'ol_graticule',
                numPoints: 2, 
                labelled: true,
                lineSymbolizer: graticuleLineStyle,
                labelSymbolizer: graticuleLabelStyle
            });
             
			this.map.addControl(this.graticule);
			
			// Set mousewheel sensitivity
			var navControl = this.map.getControlsByClass("OpenLayers.Control.Navigation")[0];
			navControl.handlers.wheel.interval = 60;
			navControl.handlers.wheel.cumulative = false;
			
        	// this.map.addControl(new OpenLayers.Control.PanZoomBar());
        }
        
        // Enables a zoom box by shift-clicking;  
        // TODO: note that it is apparently already enabled when the "Navigation" control is added
        if (this.isSelectable)
        {
        	this.map.addControl(new OpenLayers.Control.ZoomBox());
        }
        
        
        // Restrict valid extent to ~(-180, -90, 180, 90) since Tiled WMS uses (-180, -1350, 180, 90)
		if (this.projection == "EPSG:4326")
        {
	        var restrictedExtent = new OpenLayers.Bounds.fromString("-180, -100, 180, 100", false).transform(
	                new OpenLayers.Projection(this.projection),
	                this.map.getProjectionObject()); 
	                
	        this.map.restrictedExtent = restrictedExtent;
        }
        else
        {
        	this.map.restrictedExtent = new OpenLayers.Bounds.fromString("-5000000,-3500000,5000000,3500000");
        }
        
	  
		// Formerly / also in constructor 	  	
	  	// Set active layer if params set
	  	if (this.isSoteMapDataCached && (this.time != null) && (this.baseLayer != null) && (this.map.layers.length > 0))
	  	{
	  		this.activateRelevantLayersDisableTheRest([this.baseLayer],this.time);
	  	}		
	
	  	// Set extent
	  	if (this.isSoteMapDataCached)
	  	{
		  	if (this.projection == "EPSG:4326")
		  	{
		  		this.setExtent("-146.390625,-93.921875,146.390625,93.953125",true);
		  		this.fire(); 
		  	}
		  	else
		  	{
		  		this.setExtent("-4194304,-4194304,4194304,4194304",true);
		  		this.fire(); 
		  	}
					  		
	  	}
	  	
		// Set up callback for when pan/zoom ends to auto-call the "fire" function
		this.map.events.register("moveend", this, this.handleMapMoveEnd); 
      
};


/**
 * Checks if the given parameter is defined, not null, and not empty.
 * 
 * @param 	the parameter in question
 * @returns	true if the parameter is defined, not null, and not empty;  returns false otherwise 
 */
SOTE.widget.Map.prototype.checkWmsParam = function(param)
{
	if ((param === undefined) ||
		(param == null) ||
		(param == ""))
		return false;		
	
	// else
	return true;
		
};

/**
 * Adds the given layer(s) to this.map.
 * 
 * @param 	an array where each entry contains a set of parameters needed for a WMS or Tiled WMS layer;
 * 		for each WMS layer: {displayName: "", wmsProductName: "", urls:[], layers:"", transparent:boolean, projection:"", preferredOpacity:float}
 * 		for each Tiled WMS layer: {displayName: "", wmsProductName: "", time:"", format: "", urls:[], tileSize:[], projection:"", numZoomLevels:int, maxExtent:[], maxResolution:float, preferredOpacity:float } 
 * 
 * 
 * See SOTE.widget.MapSote.prototype.updateComponent for concrete examples 
 * and SOTE.util.generateProductLayersForDateRange for more detail on each parameter
 * 
 */
SOTE.widget.Map.prototype.addLayers = function(layers)
{
    for (var i=0; i<layers.length; i++)
    {
    	// Fill optional parameters, as necessary
		if (!this.checkWmsParam(layers[i].displayName))
			layers[i].displayName = "unnamed";
			
		if (!this.checkWmsParam(layers[i].time))
			layers[i].time = "";	
		
		if (!this.checkWmsParam(layers[i].format))
			layers[i].format = "image/jpeg";  // default to jpeg
		
		if (!this.checkWmsParam(layers[i].transparent))
			layers[i].transparent = true;
			
		if (!this.checkWmsParam(layers[i].projection))
			layers[i].projection = this.projection;
		
		if (!this.checkWmsParam(layers[i].numZoomLevels))
			layers[i].numZoomLevels = (this.projection == "EPSG:4326")? 9:6;
			
		if (!this.checkWmsParam(layers[i].maxExtent))
			layers[i].maxExtent = (this.projection == "EPSG:4326")? [-180, -1350, 180, 90]:[-4194304,-4194304,4194304,4194304];
			
		if (!this.checkWmsParam(layers[i].maxResolution))
			layers[i].maxResolution = (this.projection == "EPSG:4326")? 0.5625: 8192.0;
			
		if (!this.checkWmsParam(layers[i].preferredOpacity))
			layers[i].preferredOpacity = this.DEFAULT_OVERLAY_OPACITY;
		
		if (!this.checkWmsParam(layers[i].bringToFront))
			layers[i].bringToFront = false;
			
		if (!this.checkWmsParam(layers[i].transitionEffect))
			layers[i].transitionEffect = "resize";
			
		if (!this.checkWmsParam(layers[i].resolutions))
		{
			if (layers[i].projection == "EPSG:4326")
				layers[i].resolutions = this.RESOLUTIONS_ON_SCREEN_GEO_ALL;
			else
				layers[i].resolutions = this.RESOLUTIONS_ON_SCREEN_POLAR_ALL;
		}
		
		if (!this.checkWmsParam(layers[i].serverResolutions))
		{
			if (layers[i].projection == "EPSG:4326")
				layers[i].serverResolutions = this.RESOLUTIONS_ON_SERVER_GEO_250m;
			else
				layers[i].serverResolutions = this.RESOLUTIONS_ON_SERVER_POLAR_250m;
		}
		
		if (!this.checkWmsParam(layers[i].tileMatrixSet))
		{
			if (layers[i].projection == "EPSG:4326")
				layers[i].tileMatrixSet = this.TILEMATRIXSET_GEO_250m;
			else
				layers[i].tileMatrixSet = this.TILEMATRIXSET_POLAR_250m;
		}
				
		// Check required params
		if (!this.checkWmsParam(layers[i].urls))
		{
			alert("invalid / no URL passed in for layer "+layers[i].displayName);
			continue;
		}
		
		if (!this.checkWmsParam(layers[i].wmsProductName))
		{
			alert("invalid / unspecified WMS 'layer' parameter");
			continue;
		}



		// Handle tiled layers differently than standard WMS layers;  include "transparent:true" in first section
    	if (!this.checkWmsParam(layers[i].tileSize))
    	{
    		// If 'tileSize' isn't set, consider this layer a "standard" WMS layer    zzz
    		// Note: other params like maxExtent, numZoomLevels, maxResolution are ignored for standard WMS layers
			wmsLayer =	new OpenLayers.Layer.WMS(
				layers[i].displayName, 
        		layers[i].urls, 
        		{
        			layers: layers[i].wmsProductName,
        			format: layers[i].format,
        			transparent: layers[i].transparent,
        		},  
        		{
        			isBaseLayer: false, 
        			visibility: false, 
        			transitioneffect: layers[i].transitionEffect, 
        			projection: layers[i].projection,
        			'tileSize': new OpenLayers.Size(512, 512),
        			metadata: { 
        				preferredOpacity: layers[i].preferredOpacity,
        				bringToFront: layers[i].bringToFront
        				}	            			
        		 });

        		 
       		// Add "time" parameter only if it's set so that servers serving static layers aren't confused
       		// by an empty value for time  
       		if (this.checkWmsParam(layers[i].time))
       			wmsLayer.mergeNewParams({time:layers[i].time});    		

    		
			this.map.addLayer(wmsLayer);
    	}
    	else
    	{
    		// If 'tileSize' is set, this should be a tiled layer
    		// Note: "transparent" flag is not being used for tiled layers since image format is already being specified   
    		if(this.projection != "EPSG:4326"){
	    	this.map.addLayer(
	    		new OpenLayers.Layer.WMS(
	    			layers[i].displayName, 
	    			layers[i].urls,
	    			{ 
	    				time: layers[i].time, 
	    			  	layers: layers[i].wmsProductName, 
	    			  	Format: layers[i].format
	    			},
	    			{ 
						'tileSize': new OpenLayers.Size(layers[i].tileSize[0], layers[i].tileSize[1]),
					  buffer: 0, 
						transitionEffect: layers[i].transitionEffect, 
						projection: layers[i].projection, 
						numZoomLevels: layers[i].numZoomLevels, 
						maxExtent: new OpenLayers.Bounds(layers[i].maxExtent[0], layers[i].maxExtent[1], layers[i].maxExtent[2], layers[i].maxExtent[3]),
						maxResolution: layers[i].maxResolution,
						resolutions: layers[i].resolutions,
						serverResolutions: layers[i].serverResolutions,
						visibility: false,
            			metadata: { 
            				preferredOpacity: layers[i].preferredOpacity,
            				bringToFront: layers[i].bringToFront
            				}	            			
	    			}
	    		));
	    	}
	    	else{
	    	
	    	var wmtsLayer = 
			    new OpenLayers.Layer.WMTS(
			    {
			        name: layers[i].displayName,
			        url: layers[i].urls,
			        layer: layers[i].wmsProductName,
			        matrixSet: layers[i].tileMatrixSet,  //layers[i].projection,
			        //matrixIds: matrixIds,
			        format: layers[i].format,
			        buffer: 0,
			        //time: layers[i].timeStr, 
			        style: "",
			        opacity: layers[i].preferredOpacity,
			        transitionEffect: layers[i].transitionEffect,
			        projection: layers[i].projection,
			        numZoomLevels: layers[i].numZoomLevels, // unclear if this is necessary
			        maxResolution: layers[i].maxResolution, // unclear if this is necessary
			        resolutions: layers[i].resolutions, // unclear if this is necessary
			        serverResolutions: layers[i].serverResolutions,
			    	visibility: false,
					metadata: { 
						preferredOpacity: layers[i].preferredOpacity,
						bringToFront: layers[i].bringToFront
					},
					'tileSize': new OpenLayers.Size(layers[i].tileSize[0], layers[i].tileSize[1]),
					maxExtent: new OpenLayers.Bounds(layers[i].maxExtent[0], layers[i].maxExtent[1], layers[i].maxExtent[2], layers[i].maxExtent[3]),
			        isBaseLayer: false
			    }
			    
			    );
			
			
			// Time parameter is not being included in request to server in the current version of OL (2.12RC7);
			// need to use this hack to force inclusion of the time parameter.  
			wmtsLayer.mergeNewParams({time:layers[i].time});
			
			this.map.addLayer(wmtsLayer);	
	    	}
	    		    		
    	}
    }
    
    // Force graticule layer to be on top of all other layers
    if (this.graticule != null)
    	this.map.setLayerZIndex(this.graticule.gratLayer, this.getAllLayers().length-1);
}



/**
  * Sets the visible extent in the map from the passed in value, if valid.  formatted as [containerId]=w,s,e,n
  *
  * @this {map}
  * @param {String} value is [containerId]=w,s,e,n
  * @returns {boolean} true or false depending on if the new extent validates
  *
*/
SOTE.widget.Map.prototype.setValue = function(value){
  
	return this.setExtent(value);
};


/**
  * Gets the currently visible extent [containerId]=w,s,e,n
  *
  * @this {map}
  * @returns {String} [containerId]=w,s,e,n represents the current visible extent of the map
  *
*/
SOTE.widget.Map.prototype.getValue = function(){

/*	// Retrieve current extent
	var extent = this.map.getExtent();
	
	// Check for invalid response, return 0s if necessary
	if (extent == null)
		return "0, 0, 0, 0";  
	
	// Otherwise object is valid, convert to lat/lon and return as string
	return extent.transform(
			this.map.getProjectionObject(),
            new OpenLayers.Projection(this.projection)).toString();*/
	return this.id + "=" + this.value;
};


/**
 * Returns raw list of this.map's current layers
 */
SOTE.widget.Map.prototype.getAllLayers = function()
{
	return this.map.layers;
}


/**
  * Sets the selected option(s) from the query string [containerId]=w,s,e,n
  * 
  * @this {map}
  * @param {String} qs contains the querystring ([containerId]=w,s,e,n)
  * @returns {boolean} true or false depending on whether the new extent validates
  *
*/
SOTE.widget.Map.prototype.loadFromQuery = function(qs){
	return this.setValue(SOTE.util.extractFromQuery(this.id,qs));
};


/**
  * Validates that the w,s,e,n coordinates are not null, both lat coordinates (n,s) are between -90,90, and both
  * lon coordinates (w,e) are between -180,180
  * 
  * @this {map}
  * @returns {boolean} true or false depending on whether the selected option(s) meet the validation criteria
*/
SOTE.widget.Map.prototype.validate = function(){
  
	// Retrieve current extent
	var extent = this.map.getExtent();
	
	// Check for invalid response, return false if necessary
	if (extent == null)
	{
		this.setStatus("Could not retrieve current extent");
		return false;
	}
	
	// Otherwise object is valid, convert to lat/lon
	var latLonExtent = 
		extent.transform(
			this.map.getProjectionObject(),
            new OpenLayers.Projection(this.projection)).toString();
	
	// Validate bounds
	if ((latLonExtent.left < -180) ||
		(latLonExtent.right > 180) ||
		(latLonExtent.top > 90) ||
		(latLonExtent.bottom < -90))
	{
		this.setStatus("Current extent is out of bounds");
		return false;
	}
		
		
	// else
	return true;
};

/**
  * Sets the data accessor that provides state change instructions given dependencies
  *
  * @this {map}
  * @param {String} datasourceurl is the relative location of the data accessor 
  *
*/
SOTE.widget.Map.prototype.setDataSourceUrl = function(datasourceurl){
  // TODO: Content
};

/**
  * Gets the data accessor
  * 
  * @this {map}
  * @returns {String} the relative location of the accessor
  *
*/
SOTE.widget.Map.prototype.getDataSourceUrl = function(){
  // TODO: Content
};

/**
  * Sets the status of the component
  *
  * @this {map}
  * @param {String} s the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.Map.prototype.setStatus = function(s){
  
  this.statusStr = s;
};

/**
  * Gets the status of the component
  *
  * @this {map}
  * @returns {String} the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.Map.prototype.getStatus = function(){
  
	return this.statusStr;
};


/**
  * Sets the visible extent of the map
  *
  * @this {map}
  * @param {String} extent is formatted as [containerId]=w,s,e,n
  * @returns {boolean} true or false depending on if the component validates with the new extent
  *
*/
SOTE.widget.Map.prototype.setExtent = function(extent,force){

    // Parse bounding box string and apply to map
    // Need to convert from lat/lon to map's native coord system
    var OLExtent = new OpenLayers.Bounds.fromString(extent, false).transform(
            new OpenLayers.Projection(this.projection),
            this.map.getProjectionObject());

	if (OLExtent == null)
	{
		this.setStatus("Could not set extent");
		return false;
	}           
	
	// else
	// prevent unnecessary updates
	if (extent == this.value && !force)
	{
		return;
	}
	
	// Update member variable
	this.value = extent;

	// Zoom to specified extent, finally
    this.map.zoomToExtent(OLExtent, true);
    return true;
};


/**
 * Fires an event in the registry when the component value is changed
 * 
 * @author T. Joshi 
 */
SOTE.widget.Map.prototype.fire = function(){
 
	if(REGISTRY){
		REGISTRY.fire(this);
	}
	else{
		alert("No REGISTRY found! Cannot fire to REGISTRY from Map!");
	}

};


/**
  * Change the base layers based on dependencies (i.e. extent, date, data product)
  * 
  * @this {map}
  * @param {String} querystring contains all values of dependencies (from registry)
  * @returns {boolean} true or false depending on if the component still validates with the new criteria
  * 
*/
SOTE.widget.Map.prototype.updateComponent = function(querystring){

	// Hack to load SOTE-specific map data
	
	var state = (SOTE.util.extractFromQuery("switch",querystring))? SOTE.util.extractFromQuery("switch",querystring): "geographic";
	// Load SOTE-specific map data if not already cached
	if (!this.isSoteMapDataCached || state != this.state)
	{
		this.isSoteMapDataCached = false;
		this.state = state;
		if(this.state == "geographic")
			this.projection = "EPSG:4326";
		else if(this.state == "antarctic")
			this.projection = "EPSG:3031";
		else if (this.state == "arctic")
			this.projection = "EPSG:3995";
		
		// Define static layers
		if(this.state == "geographic"){
			var staticProductLayers = 
				[			
					//{displayName: "population", wmsProductName: "population", time:"", format: "image/png", urls:["http://map1.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], tileSize:[512,512], projection:"EPSG:4326", numZoomLevels:9, maxExtent:[-180,-1350,180,90], maxResolution:0.5625, preferredOpacity: 0.55 },
					{displayName: "MODIS_Land_Water_Mask", wmsProductName: "MODIS_Land_Water_Mask", time:"", format: "image/png", urls:["http://map1.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], tileSize:[512,512], projection:"EPSG:4326", numZoomLevels:9, maxExtent:[-180,-1350,180,90], maxResolution:0.5625, preferredOpacity: 0.75, bringToFront:true },
					{displayName: "grump-v1-population-count_2000", wmsProductName: "grump-v1-population-count_2000", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.55 },				
					{displayName: "ndh-cyclone-hazard-frequency-distribution", wmsProductName: "ndh-cyclone-hazard-frequency-distribution", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 },
					{displayName: "ndh-cyclone-proportional-economic-loss-risk-deciles", wmsProductName: "ndh-cyclone-proportional-economic-loss-risk-deciles", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 },
					{displayName: "ndh-cyclone-mortality-risks-distribution", wmsProductName: "ndh-cyclone-mortality-risks-distribution", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 },
					{displayName: "ndh-flood-hazard-frequency-distribution", wmsProductName: "ndh-flood-hazard-frequency-distribution", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 },
					{displayName: "ndh-flood-proportional-economic-loss-risk-deciles", wmsProductName: "ndh-flood-proportional-economic-loss-risk-deciles", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 },
					{displayName: "ndh-flood-mortality-risks-distribution", wmsProductName: "ndh-flood-mortality-risks-distribution", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 },
					{displayName: "ndh-drought-hazard-frequency-distribution", wmsProductName: "ndh-drought-hazard-frequency-distribution", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 },
					{displayName: "ndh-drought-proportional-economic-loss-risk-deciles", wmsProductName: "ndh-drought-proportional-economic-loss-risk-deciles", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 },
					{displayName: "ndh-drought-mortality-risks-distribution", wmsProductName: "ndh-drought-mortality-risks-distribution", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 },
					{displayName: "ndh-volcano-hazard-frequency-distribution", wmsProductName: "ndh-volcano-hazard-frequency-distribution", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 },
					{displayName: "ndh-volcano-proportional-economic-loss-risk-deciles", wmsProductName: "ndh-volcano-proportional-economic-loss-risk-deciles", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 },
					{displayName: "ndh-volcano-mortality-risks-distribution", wmsProductName: "ndh-volcano-mortality-risks-distribution", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 },
					//{displayName: "fires24", wmsProductName: "fires24", time:"", urls:["http://firms.modaps.eosdis.nasa.gov/wms/?"], layers:"fires24", transparent:true, projection:"EPSG:4326", preferredOpacity: 1.0},
					//{displayName: "fires48", wmsProductName: "fires48", time:"", urls:["http://firms.modaps.eosdis.nasa.gov/wms/?"], layers:"fires48", transparent:true, projection:"EPSG:4326", preferredOpacity: 1.0},
					{displayName: "cartographic:esri-administrative-boundaries_level-1", wmsProductName: "cartographic:esri-administrative-boundaries_level-1", time:"", urls:["http://sedac.ciesin.columbia.edu/geoserver/wms?"], layers:"cartographic:esri-administrative-boundaries_level-1", transparent:true, projection:"EPSG:4326", preferredOpacity: 0.55, bringToFront: true },
					//{displayName: "cartographic:national-boundaries", wmsProductName: "cartographic:national-boundaries", time:"", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], layers:"cartographic:national-boundaries", transparent:true, projection:"EPSG:4326", preferredOpacity: 0.55, bringToFront: true },
					{displayName: "sedac_bound", wmsProductName: "sedac_bound", time:"", format: "image/png", urls:["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], tileSize:[512,512], projection:"EPSG:4326", numZoomLevels:9, maxExtent:[-180,-1350,180,90], maxResolution:0.5625, preferredOpacity: 0.90, bringToFront: true, transitionEffect:"none" },
					{displayName: "gpw-v3-coastlines", wmsProductName: "gpw-v3-coastlines", time:"", urls:["http://sedac.ciesin.columbia.edu/geoserver/wms?"], layers:"gpw-v3-coastlines", transparent:true, projection:"EPSG:4326", preferredOpacity: 0.85, bringToFront: true},
					{displayName: "cartographic:00-global-labels", wmsProductName: "cartographic:00-global-labels", time:"", urls:["http://sedac.ciesin.columbia.edu/geoserver/wms?"], layers:"cartographic:00-global-labels", transparent:true, projection:"EPSG:4326", preferredOpacity: 0.95, bringToFront: true }
				];
				

		
			this.soteMapData = staticProductLayers.concat(
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Terra_CorrectedReflectance_TrueColor", "MODIS_Terra_CorrectedReflectance_TrueColor", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_250m, this.TILEMATRIXSET_GEO_250m),
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Terra_SurfaceReflectance_Bands143", "MODIS_Terra_SurfaceReflectance_Bands143", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_500m, this.TILEMATRIXSET_GEO_500m),
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Aqua_CorrectedReflectance_TrueColor", "MODIS_Aqua_CorrectedReflectance_TrueColor", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_250m, this.TILEMATRIXSET_GEO_250m),
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Aqua_SurfaceReflectance_Bands143", "MODIS_Aqua_SurfaceReflectance_Bands143", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_500m, this.TILEMATRIXSET_GEO_500m),
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Terra_CorrectedReflectance_Bands721", "MODIS_Terra_CorrectedReflectance_Bands721", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_250m, this.TILEMATRIXSET_GEO_250m),
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Aqua_CorrectedReflectance_Bands721", "MODIS_Aqua_CorrectedReflectance_Bands721", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_250m, this.TILEMATRIXSET_GEO_250m),
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Terra_SurfaceReflectance_Bands721", "MODIS_Terra_SurfaceReflectance_Bands721", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_500m, this.TILEMATRIXSET_GEO_500m),
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Aqua_SurfaceReflectance_Bands721", "MODIS_Aqua_SurfaceReflectance_Bands721", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_500m, this.TILEMATRIXSET_GEO_500m),
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Terra_CorrectedReflectance_Bands367", "MODIS_Terra_CorrectedReflectance_Bands367", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_250m, this.TILEMATRIXSET_GEO_250m),
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Terra_SurfaceReflectance_Bands121", "MODIS_Terra_SurfaceReflectance_Bands121", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_500m, this.TILEMATRIXSET_GEO_250m),
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Aqua_SurfaceReflectance_Bands121", "MODIS_Aqua_SurfaceReflectance_Bands121", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_500m, this.TILEMATRIXSET_GEO_250m),
				
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Terra_Data_No_Data", "MODIS_Terra_Data_No_Data", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_250m, this.TILEMATRIXSET_GEO_250m),
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Aqua_Data_No_Data", "MODIS_Aqua_Data_No_Data", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_250m, this.TILEMATRIXSET_GEO_250m),
					
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Terra_Snow_Cover", "MODIS_Terra_Snow_Cover", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_500m, this.TILEMATRIXSET_GEO_500m),
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Aqua_Snow_Cover", "MODIS_Aqua_Snow_Cover", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_500m, this.TILEMATRIXSET_GEO_500m),	
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Terra_Sea_Ice", "MODIS_Terra_Sea_Ice", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_1km, this.TILEMATRIXSET_GEO_1km),
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Aqua_Sea_Ice", "MODIS_Aqua_Sea_Ice", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_1km, this.TILEMATRIXSET_GEO_1km),			
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Terra_Land_Surface_Temp_Day", "MODIS_Terra_Land_Surface_Temp_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_1km, this.TILEMATRIXSET_GEO_1km),
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Aqua_Land_Surface_Temp_Day", "MODIS_Aqua_Land_Surface_Temp_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_1km, this.TILEMATRIXSET_GEO_1km),
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Terra_Land_Surface_Temp_Night", "MODIS_Terra_Land_Surface_Temp_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_1km, this.TILEMATRIXSET_GEO_1km),
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Aqua_Land_Surface_Temp_Night", "MODIS_Aqua_Land_Surface_Temp_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_1km, this.TILEMATRIXSET_GEO_1km),
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Terra_Brightness_Temp_Band31_Day", "MODIS_Terra_Brightness_Temp_Band31_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_1km, this.TILEMATRIXSET_GEO_1km),
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Aqua_Brightness_Temp_Band31_Day", "MODIS_Aqua_Brightness_Temp_Band31_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_1km, this.TILEMATRIXSET_GEO_1km),
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Terra_Brightness_Temp_Band31_Night", "MODIS_Terra_Brightness_Temp_Band31_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_1km, this.TILEMATRIXSET_GEO_1km),
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Aqua_Brightness_Temp_Band31_Night", "MODIS_Aqua_Brightness_Temp_Band31_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_1km, this.TILEMATRIXSET_GEO_1km),									
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Terra_Aerosol", "MODIS_Terra_Aerosol", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Aqua_Aerosol", "MODIS_Aqua_Aerosol", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Terra_Water_Vapor_5km_Day", "MODIS_Terra_Water_Vapor_5km_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Aqua_Water_Vapor_5km_Day", "MODIS_Aqua_Water_Vapor_5km_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Terra_Water_Vapor_5km_Night", "MODIS_Terra_Water_Vapor_5km_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Aqua_Water_Vapor_5km_Night", "MODIS_Aqua_Water_Vapor_5km_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Terra_Cloud_Top_Pressure_Day", "MODIS_Terra_Cloud_Top_Pressure_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Aqua_Cloud_Top_Pressure_Day", "MODIS_Aqua_Cloud_Top_Pressure_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Terra_Cloud_Top_Pressure_Night", "MODIS_Terra_Cloud_Top_Pressure_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Aqua_Cloud_Top_Pressure_Night", "MODIS_Aqua_Cloud_Top_Pressure_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Terra_Cloud_Top_Temp_Day", "MODIS_Terra_Cloud_Top_Temp_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Aqua_Cloud_Top_Temp_Day", "MODIS_Aqua_Cloud_Top_Temp_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Terra_Cloud_Top_Temp_Night", "MODIS_Terra_Cloud_Top_Temp_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
				SOTE.util.generateProductLayersForDateRangeTMS("MODIS_Aqua_Cloud_Top_Temp_Night", "MODIS_Aqua_Cloud_Top_Temp_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),

				SOTE.util.generateProductLayersForDateRangeTMS("AIRS_Dust_Score", "AIRS_Dust_Score", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
				SOTE.util.generateProductLayersForDateRangeTMS("AIRS_CO_Total_Column_Day", "AIRS_CO_Total_Column_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
				SOTE.util.generateProductLayersForDateRangeTMS("AIRS_CO_Total_Column_Night", "AIRS_CO_Total_Column_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
				SOTE.util.generateProductLayersForDateRangeTMS("AIRS_Prata_SO2_Index_Day", "AIRS_Prata_SO2_Index_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
				SOTE.util.generateProductLayersForDateRangeTMS("AIRS_Prata_SO2_Index_Night", "AIRS_Prata_SO2_Index_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
				SOTE.util.generateProductLayersForDateRangeTMS("AIRS_Precipitation_Day", "AIRS_Precipitation_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
				SOTE.util.generateProductLayersForDateRangeTMS("AIRS_Precipitation_Night", "AIRS_Precipitation_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
				
				SOTE.util.generateProductLayersForDateRangeTMS("OMI_Cloud_Pressure", "OMI_Cloud_Pressure", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
				SOTE.util.generateProductLayersForDateRangeTMS("OMI_Aerosol_Index", "OMI_Aerosol_Index", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
				SOTE.util.generateProductLayersForDateRangeTMS("OMI_Aerosol_Optical_Depth", "OMI_Aerosol_Optical_Depth", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
				SOTE.util.generateProductLayersForDateRangeTMS("OMI_Absorbing_Aerosol_Optical_Depth", "OMI_Absorbing_Aerosol_Optical_Depth", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
				SOTE.util.generateProductLayersForDateRangeTMS("OMI_SO2_Lower_Troposphere", "OMI_SO2_Lower_Troposphere", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
				SOTE.util.generateProductLayersForDateRangeTMS("OMI_SO2_Middle_Troposphere", "OMI_SO2_Middle_Troposphere", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
				SOTE.util.generateProductLayersForDateRangeTMS("OMI_SO2_Upper_Troposphere_and_Stratosphere", "OMI_SO2_Upper_Troposphere_and_Stratosphere", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
				SOTE.util.generateProductLayersForDateRangeTMS("OMI_SO2_Planetary_Boundary_Layer", "OMI_SO2_Planetary_Boundary_Layer", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
				
				SOTE.util.generateProductLayersForDateRangeTMS("OBPG_MODIS_Aqua_Chlorophyll_A", "OBPG_MODIS_Aqua_Chlorophyll_A", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_1km, this.TILEMATRIXSET_GEO_1km),
				SOTE.util.generateProductLayersForDateRangeTMS("OBPG_SeaSurfaceTemperature_11_Day", "OBPG_SeaSurfaceTemperature_11_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_1km, this.TILEMATRIXSET_GEO_1km),

			
				SOTE.util.generateWmsProductLayersForDateRange("MODIS_Fires_All", "MODIS_Fires_All", "image/png", ["http://map2a.vis.earthdata.nasa.gov/wms/wms.php", "http://map2b.vis.earthdata.nasa.gov/wms/wms.php", "http://map2c.vis.earthdata.nasa.gov/wms/wms.php"], "EPSG:4326", 1.0, true, this.NUM_DAYS_TO_GENERATE),
				SOTE.util.generateWmsProductLayersForDateRange("MODIS_Fires_Terra", "MODIS_Fires_Terra", "image/png", ["http://map2a.vis.earthdata.nasa.gov/wms/wms.php", "http://map2b.vis.earthdata.nasa.gov/wms/wms.php", "http://map2c.vis.earthdata.nasa.gov/wms/wms.php"], "EPSG:4326", 1.0, true, this.NUM_DAYS_TO_GENERATE),
				SOTE.util.generateWmsProductLayersForDateRange("MODIS_Fires_Aqua", "MODIS_Fires_Aqua", "image/png", ["http://map2a.vis.earthdata.nasa.gov/wms/wms.php", "http://map2b.vis.earthdata.nasa.gov/wms/wms.php", "http://map2c.vis.earthdata.nasa.gov/wms/wms.php"], "EPSG:4326", 1.0, true, this.NUM_DAYS_TO_GENERATE),
				SOTE.util.generateWmsProductLayersForDateRange("Terra_Orbit_Asc", "Terra_Orbit_Asc", "image/png", ["http://map2a.vis.earthdata.nasa.gov/wms/wms.php", "http://map2b.vis.earthdata.nasa.gov/wms/wms.php", "http://map2c.vis.earthdata.nasa.gov/wms/wms.php"], "EPSG:4326", 1.0, true, this.NUM_DAYS_TO_GENERATE),
				SOTE.util.generateWmsProductLayersForDateRange("Terra_Orbit_Dsc", "Terra_Orbit_Dsc", "image/png", ["http://map2a.vis.earthdata.nasa.gov/wms/wms.php", "http://map2b.vis.earthdata.nasa.gov/wms/wms.php", "http://map2c.vis.earthdata.nasa.gov/wms/wms.php"], "EPSG:4326", 1.0, true, this.NUM_DAYS_TO_GENERATE),
				SOTE.util.generateWmsProductLayersForDateRange("Aqua_Orbit_Asc", "Aqua_Orbit_Asc", "image/png", ["http://map2a.vis.earthdata.nasa.gov/wms/wms.php", "http://map2b.vis.earthdata.nasa.gov/wms/wms.php", "http://map2c.vis.earthdata.nasa.gov/wms/wms.php"], "EPSG:4326", 1.0, true, this.NUM_DAYS_TO_GENERATE),
				SOTE.util.generateWmsProductLayersForDateRange("Aqua_Orbit_Dsc", "Aqua_Orbit_Dsc", "image/png", ["http://map2a.vis.earthdata.nasa.gov/wms/wms.php", "http://map2b.vis.earthdata.nasa.gov/wms/wms.php", "http://map2c.vis.earthdata.nasa.gov/wms/wms.php"], "EPSG:4326", 1.0, true, this.NUM_DAYS_TO_GENERATE),
				SOTE.util.generateWmsProductLayersForDateRange("Aura_Orbit_Asc", "Aura_Orbit_Asc", "image/png", ["http://map2a.vis.earthdata.nasa.gov/wms/wms.php", "http://map2b.vis.earthdata.nasa.gov/wms/wms.php", "http://map2c.vis.earthdata.nasa.gov/wms/wms.php"], "EPSG:4326", 1.0, true, this.NUM_DAYS_TO_GENERATE),
				SOTE.util.generateWmsProductLayersForDateRange("Aura_Orbit_Dsc", "Aura_Orbit_Dsc", "image/png", ["http://map2a.vis.earthdata.nasa.gov/wms/wms.php", "http://map2b.vis.earthdata.nasa.gov/wms/wms.php", "http://map2c.vis.earthdata.nasa.gov/wms/wms.php"], "EPSG:4326", 1.0, true, this.NUM_DAYS_TO_GENERATE)
				);
		}
		else if (this.state == "antarctic"){
			var staticProductLayers = 
			[			
				{displayName: "grump-v1-population-count_2000", wmsProductName: "grump-v1-population-count_2000", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/wms?"], projection:"EPSG:3031", preferredOpacity: 0.75, bringToFront: true },
				{displayName: "polarview:graticule3031_10x30", wmsProductName: "polarview:graticule3031_10x30", time:"", urls:["http://geos.polarview.aq/geoserver/wms?"], layers:"polarview:graticule3031_10x30", transparent:true, projection:"EPSG:3031", preferredOpacity: 0.75, bringToFront: true },
				{displayName: "cartographic:national-boundaries", wmsProductName: "cartographic:national-boundaries", time:"", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], layers:"cartographic:national-boundaries", transparent:true, projection:"EPSG:3031", preferredOpacity: 0.55, bringToFront: true },
				{displayName: "polarview:coastS10", wmsProductName: "polarview:coastS10", time:"", urls:["http://geos.polarview.aq/geoserver/wms?"], layers:"polarview:coastS10", transparent:true, projection:"EPSG:3031", preferredOpacity: 0.85, bringToFront: true },
				{displayName: "lat_long_grid", wmsProductName: "lat_long_grid", time:"", urls:["http://nsidc.org/cgi-bin/atlas_south?"], layers:"lat_long_grid", transparent:true, projection:"EPSG:3031", preferredOpacity: 0.85, bringToFront: true },
				{displayName: "coastlines", wmsProductName: "coastlines", time:"", urls:["http://nsidc.org/cgi-bin/atlas_south?"], layers:"coastlines", transparent:true, projection:"EPSG:3031", preferredOpacity: 0.85, bringToFront: true }

				// {displayName: "cartographic:00-global-labels", wmsProductName: "cartographic:00-global-labels", time:"", urls:["http://sedac.ciesin.columbia.edu/geoserver/wms?"], layers:"cartographic:00-global-labels", transparent:true, projection:"EPSG:3031", preferredOpacity: 0.95, bringToFront: true }
			];

		// Generate a layer for each product for each day, then concatenate with static layer array
		this.soteMapData = staticProductLayers.concat(
			SOTE.util.generateProductLayersForDateRange("MODIS_Terra_CorrectedReflectance_TrueColor", "MODIS_Terra_CorrectedReflectance_TrueColor", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/antarctic/wms.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_250m),
			SOTE.util.generateProductLayersForDateRange("MODIS_Aqua_CorrectedReflectance_TrueColor", "MODIS_Aqua_CorrectedReflectance_TrueColor", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/antarctic/wms.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_250m),
			SOTE.util.generateProductLayersForDateRange("MODIS_Terra_CorrectedReflectance_Bands367", "MODIS_Terra_CorrectedReflectance_Bands367", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/antarctic/wms.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_250m),

			SOTE.util.generateProductLayersForDateRange("MODIS_Terra_Brightness_Temp_Band31_Day", "MODIS_Terra_Brightness_Temp_Band31_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/antarctic/wms.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km),
			SOTE.util.generateProductLayersForDateRange("MODIS_Terra_Brightness_Temp_Band31_Night", "MODIS_Terra_Brightness_Temp_Band31_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/antarctic/wms.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km),
			SOTE.util.generateProductLayersForDateRange("MODIS_Aqua_Brightness_Temp_Band31_Day", "MODIS_Aqua_Brightness_Temp_Band31_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/antarctic/wms.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km),
			SOTE.util.generateProductLayersForDateRange("MODIS_Aqua_Brightness_Temp_Band31_Night", "MODIS_Aqua_Brightness_Temp_Band31_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/antarctic/wms.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km),
			SOTE.util.generateProductLayersForDateRange("MODIS_Terra_Snow_Cover", "MODIS_Terra_Snow_Cover", "image/png", ["http://map1a.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/antarctic/wms.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_500m),
			SOTE.util.generateProductLayersForDateRange("MODIS_Aqua_Snow_Cover", "MODIS_Aqua_Snow_Cover", "image/png", ["http://map1a.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/antarctic/wms.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_500m),
			SOTE.util.generateProductLayersForDateRange("MODIS_Terra_Sea_Ice", "MODIS_Terra_Sea_Ice", "image/png", ["http://map1a.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/antarctic/wms.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km),
			SOTE.util.generateProductLayersForDateRange("MODIS_Aqua_Sea_Ice", "MODIS_Aqua_Sea_Ice", "image/png", ["http://map1a.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/antarctic/wms.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km),
			SOTE.util.generateProductLayersForDateRange("NSIDC_Sea_Ice_Concentration", "NSIDC_Sea_Ice_Concentration", "image/png", ["http://map1a.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/antarctic/wms.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km)
			);

		}
		else if (this.state == "arctic"){
			var staticProductLayers = 
			[			
				{displayName: "grump-v1-population-count_2000", wmsProductName: "grump-v1-population-count_2000", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/wms?"], projection:"EPSG:3995", preferredOpacity: 0.75, bringToFront: true },				
				{displayName: "polarview:graticuleN", wmsProductName: "polarview:graticuleN", time:"", urls:["http://geos.polarview.aq/geoserver/wms?"], layers:"polarview:graticuleN", transparent:true, projection:"EPSG:3995", preferredOpacity: 0.75, bringToFront: true },
				{displayName: "cartographic:national-boundaries", wmsProductName: "cartographic:national-boundaries", time:"", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], layers:"cartographic:national-boundaries", transparent:true, projection:"EPSG:3995", preferredOpacity: 0.55, bringToFront: true },
				{displayName: "polarview:coastArctic10", wmsProductName: "polarview:coastArctic10", time:"", urls:["http://geos.polarview.aq/geoserver/wms?"], layers:"polarview:coastArctic10", transparent:true, projection:"EPSG:3995", preferredOpacity: 0.85, bringToFront: true },
				{displayName: "cartographic:00-global-labels", wmsProductName: "cartographic:00-global-labels", time:"", urls:["http://sedac.ciesin.columbia.edu/geoserver/wms?"], layers:"cartographic:00-global-labels", transparent:true, projection:"EPSG:3995", preferredOpacity: 0.95, bringToFront: true }
			];

		// Generate a layer for each product for each day, then concatenate with static layer array
		this.soteMapData = staticProductLayers.concat(
			SOTE.util.generateProductLayersForDateRange("MODIS_Terra_CorrectedReflectance_TrueColor", "MODIS_Terra_CorrectedReflectance_TrueColor", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/arctic/wms.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_250m),
			SOTE.util.generateProductLayersForDateRange("MODIS_Aqua_CorrectedReflectance_TrueColor", "MODIS_Aqua_CorrectedReflectance_TrueColor", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/arctic/wms.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_250m),
			SOTE.util.generateProductLayersForDateRange("MODIS_Terra_CorrectedReflectance_Bands367", "MODIS_Terra_CorrectedReflectance_Bands367", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/arctic/wms.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_250m),

			SOTE.util.generateProductLayersForDateRange("MODIS_Terra_Brightness_Temp_Band31_Day", "MODIS_Terra_Brightness_Temp_Band31_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/arctic/wms.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km),
			SOTE.util.generateProductLayersForDateRange("MODIS_Terra_Brightness_Temp_Band31_Night", "MODIS_Terra_Brightness_Temp_Band31_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/arctic/wms.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km),
			SOTE.util.generateProductLayersForDateRange("MODIS_Aqua_Brightness_Temp_Band31_Day", "MODIS_Aqua_Brightness_Temp_Band31_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/arctic/wms.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km),
			SOTE.util.generateProductLayersForDateRange("MODIS_Aqua_Brightness_Temp_Band31_Night", "MODIS_Aqua_Brightness_Temp_Band31_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/arctic/wms.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km),
			SOTE.util.generateProductLayersForDateRange("MODIS_Terra_Snow_Cover", "MODIS_Terra_Snow_Cover", "image/png", ["http://map1a.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/arctic/wms.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_500m),
			SOTE.util.generateProductLayersForDateRange("MODIS_Aqua_Snow_Cover", "MODIS_Aqua_Snow_Cover", "image/png", ["http://map1a.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/arctic/wms.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_500m),
			SOTE.util.generateProductLayersForDateRange("MODIS_Terra_Sea_Ice", "MODIS_Terra_Sea_Ice", "image/png", ["http://map1a.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/arctic/wms.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km),
			SOTE.util.generateProductLayersForDateRange("MODIS_Aqua_Sea_Ice", "MODIS_Aqua_Sea_Ice", "image/png", ["http://map1a.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/arctic/wms.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km),			
			SOTE.util.generateProductLayersForDateRange("NSIDC_Sea_Ice_Concentration", "NSIDC_Sea_Ice_Concentration", "image/png", ["http://map1a.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/arctic/wms.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km),
			SOTE.util.generateProductLayersForDateRange("OBPG_MODIS_Aqua_Chlorophyll_A", "OBPG_MODIS_Aqua_Chlorophyll_A", "image/png", ["http://map1a.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/arctic/wms.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km),
			SOTE.util.generateProductLayersForDateRange("OBPG_SeaSurfaceTemperature_11_Day", "OBPG_SeaSurfaceTemperature_11_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/arctic/wms.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km)
			);

		}

		this.init();

		// Load full and tiled WMS layers into secondary map(s)
		this.addLayers(this.soteMapData);
		
		// Update flag upon successful load
		this.isSoteMapDataCached = true;

	}
	
	

};