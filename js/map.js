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

	// Constants
	this.OVERLAY_OPACITY = 0.55;

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
  
	// Initialize the map
	this.init();
    if(REGISTRY){
 		REGISTRY.register(this.id,this);
	}
	else{
		alert("No REGISTRY found!  Cannot register AccordionPicker!");
	}
	

  	// Load layers into memory
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
	this.map.events.register("moveend", this, this.handleMapMoveEnd); 
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
            new OpenLayers.Projection("EPSG:4326")).toString();
    
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
	time = myDate.getUTCFullYear() + "-" + eval(myDate.getUTCMonth()+1) + "-" + myDate.getUTCDate();
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
					allLayers[i].setZIndex(0);
					allLayers[i].setOpacity(1.0);
				}
				else
				{
					allLayers[i].setZIndex(1);
					allLayers[i].setOpacity(this.OVERLAY_OPACITY);
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
		
		
		// Init map
        this.map = new OpenLayers.Map({
	        div: this.containerId,
	        theme: null,
	        controls: [],
	        maxExtent: new OpenLayers.Bounds(-180,-1350,180,90),
	        projection:"EPSG:4326",
	        numZoomLevels:9, 
	        maxResolution:0.5625,
	        allOverlays: true,
	        zoom: 2
	    });
	    
	          

        // Add user controls, if necessary
        if (this.hasControls)
        {	
        	this.map.addControl(new OpenLayers.Control.TouchNavigation({
	                dragPanOptions: {
	                    enableKinetic: true
	                }
	            }));
	        this.map.addControl(new OpenLayers.Control.ZoomPanel());
        	this.map.addControl(new OpenLayers.Control.KeyboardDefaults());
        	this.map.addControl(new OpenLayers.Control.Navigation());
        	//this.map.addControl(new OpenLayers.Control.LayerSwitcher({displayClass: 'olControlLayerSwitcher', 'ascending':false}));
            //this.map.addControl(new OpenLayers.Control.OverviewMap());
        	
        	// While these aren't controls, per se, they are extra decorations
			this.map.addControl(new OpenLayers.Control.Attribution());
			//this.map.addControl(new OpenLayers.Control.ScaleLine({displayClass: 'olControlScaleLine'}));
			
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
        
        
        // Restrict valid extent to (-180, -90, 180, 90) since Tiled WMS uses (-180, -1350, 180, 90)
        var restrictedExtent = new OpenLayers.Bounds.fromString("-180, -90, 180, 90", false).transform(
                new OpenLayers.Projection("EPSG:4326"),
                this.map.getProjectionObject()); 
        this.map.restrictedExtent = restrictedExtent;
        
        
		// TODO: set extent?        
      
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
		
}

/**
 * Adds the given layer(s) to this.map.
 * 
 * @param 	an array where each entry contains a set of parameters needed for a WMS or Tiled WMS layer;
 * 		for each WMS layer: {displayName: "", wmsProductName: "", urls:[], layers:"", transparent:boolean, projection:""}
 * 		for each Tiled WMS layer: {displayName: "", wmsProductName: "", time:"", format: "", urls:[], tileSize:[], projection:"", numZoomLevels:int, maxExtent:[], maxResolution:float } 
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
			layers[i].projection = "EPSG:4326";
		
		if (!this.checkWmsParam(layers[i].numZoomLevels))
			layers[i].numZoomLevels = 9;
			
		if (!this.checkWmsParam(layers[i].maxExtent))
			layers[i].maxExtent = [-180, -1350, 180, 90];
			
		if (!this.checkWmsParam(layers[i].maxResolution))
			layers[i].maxResolution = 0.5625;
		
				
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



		// Handle Tiled WMS layers differently than standard WMS layers;  include "transparent:true" in first section
    	if (!this.checkWmsParam(layers[i].tileSize))
    	{
    		// If 'tileSize' isn't set, consider this layer a "standard" WMS layer    		
    		// Note: other params like maxExtent, numZoomLevels, maxResolution are ignored for standard WMS layers
    		if (layers[i].time != "")
    			alert("\"Time\" parameter is untested/unimplemented for standard WMS layers");
    		
			this.map.addLayer(
				new OpenLayers.Layer.WMS(
						layers[i].displayName, 
	            		layers[i].urls, 
	            		{
	            			layers: layers[i].wmsProductName,
	            			transparent: layers[i].transparent
	            		},  
	            		{
	            			isBaseLayer: false, 
	            			visibility: false, 
	            			transitioneffect: 'resize', 
	            			projection: layers[i].projection	            			
	            		 }));    		
    	}
    	else
    	{
    		// If 'tileSize' is set, this should be a Tiled WMS layer
    		// Note: "transparent" flag is not being used for tiled layers since image format is already being specified   
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
						transitionEffect: 'resize', 
						projection: layers[i].projection, 
						numZoomLevels: layers[i].numZoomLevels, 
						maxExtent: new OpenLayers.Bounds(layers[i].maxExtent[0], layers[i].maxExtent[1], layers[i].maxExtent[2], layers[i].maxExtent[3]),
						maxResolution: layers[i].maxResolution,
						visibility: false
	    			}
	    		));    		
    	}
    }
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
            new OpenLayers.Projection("EPSG:4326")).toString();*/
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
  // TODO: Content
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
            new OpenLayers.Projection("EPSG:4326")).toString();
	
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
SOTE.widget.Map.prototype.setExtent = function(extent){

    // Parse bounding box string and apply to map
    // Need to convert from lat/lon to map's native coord system
    var OLExtent = new OpenLayers.Bounds.fromString(extent, false).transform(
            new OpenLayers.Projection("EPSG:4326"),
            this.map.getProjectionObject());

	if (OLExtent == null)
	{
		this.setStatus("Could not set extent");
		return false;
	}           
	
	// else
	// prevent unnecessary updates
	if (extent == this.value)
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
SOTE.widget.Map.prototype.updateComponent = function(qs){

	// Hack to load SOTE-specific map data
	
	// Load SOTE-specific map data if not already cached
	if (!this.isSoteMapDataCached)
	{
		// Define static layers
		var staticProductLayers = 
			[			
				{displayName: "population", wmsProductName: "population", time:"", format: "image/png", urls:["http://map1.vis.earthdata.nasa.gov/data/wms.cgi"], tileSize:[512,512], projection:"EPSG:4326", numZoomLevels:9, maxExtent:[-180,-1350,180,90], maxResolution:0.5625 },
				{displayName: "cartographic:esri-administrative-boundaries_level-1", wmsProductName: "cartographic:esri-administrative-boundaries_level-1", time:"", urls:["http://sedac.ciesin.columbia.edu/geoserver/wms?"], layers:"cartographic:esri-administrative-boundaries_level-1", transparent:true, projection:"EPSG:4326"},
				{displayName: "cartographic:00-gpw-v3-national-admin-boundaries", wmsProductName: "cartographic:00-gpw-v3-national-admin-boundaries", time:"", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], layers:"cartographic:00-gpw-v3-national-admin-boundaries", transparent:true, projection:"EPSG:4326"},
				{displayName: "gpw-v3-coastlines", wmsProductName: "gpw-v3-coastlines", time:"", urls:["http://sedac.ciesin.columbia.edu/geoserver/wms?"], layers:"gpw-v3-coastlines", transparent:true, projection:"EPSG:4326"},
				{displayName: "cartographic:00-global-labels", wmsProductName: "cartographic:00-global-labels", time:"", urls:["http://sedac.ciesin.columbia.edu/geoserver/wms?"], layers:"cartographic:00-global-labels", transparent:true, projection:"EPSG:4326"}
			];

		// Generate a layer for each product for each day, then concatenate with static layer array
		var NUM_DAYS_TO_GENERATE = 6;
		this.soteMapData = staticProductLayers.concat(
			SOTE.util.generateProductLayersForDateRange("Aqua_MODIS", "AQUA_MODIS", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("Terra_MODIS", "TERRA_MODIS", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("AIRS_Dust", "AIRS_Dust", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, NUM_DAYS_TO_GENERATE)
			);
			
		// Load into map
		this.addLayers(this.soteMapData);
		
		// Update flag upon successful load
		this.isSoteMapDataCached = true;
	}
	
	

};
