SOTE.namespace("SOTE.widget.MapSote");


/**
  * Instantiate the map;  subclass of SOTE.widget.Map that is SOTE-specific
  *   
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

SOTE.widget.MapSote = function(containerId, config)
{		
	// ie,  super(containerId, config);
	SOTE.widget.Map.call(this,containerId, config);
	
	// Load SOTE-specific data into MapSote
	//this.isSoteMapDataCached = false;
	//this.updateComponent("");
	
	// Init
	this.isLayerCachingEnabled = false;
	this.terribleQsSaver = "";
	this.terribleQsSaverJustSet = false;
	
	this.setExtent(this.bbox);
	
	// Register callback for when movement begins
	this.map.events.register("movestart", this, this.handleMapMoveStart); 
	
	// test
	//this.updateComponent("?products=Terra_MODIS.SEDAC_PopulationDensity.SEDAC_AdminBoundaries&time=2011-11-30T00:00:00&transition=standard");
};


SOTE.widget.MapSote.prototype = new SOTE.widget.Map;

/**
 * Gets number of time steps currently loaded.
 * 
 * Function is currently a hack.
 */
SOTE.widget.MapSote.prototype.getNumTimeStepsAvailable = function()
{
	if (!this.isSoteMapDataCached)
		return -1;

	// TODO: compute based on date values in soteMapData, not the length		
	return this.soteMapData.length;
};

SOTE.widget.MapSote.prototype.setLayerCaching = function(enable)
{
	this.isLayerCachingEnabled = enable;
}


/**
 * 
 */
SOTE.widget.MapSote.prototype.handleMapMoveStart = function(evt)
{
	// Disable map caching after pan/zoom
	this.setLayerCaching(false);
	
	// TODO: Set only active time step(s) to be enabled  zzz
	// Currently:  this terrible hack
	if (this.terribleQsSaver != "")
	{
		this.terribleQsSaverJustSet = true;
		this.updateComponent(this.terribleQsSaver);
	}
	
}

/**
  * Change the base layers based on dependencies (i.e. extent, date, data product)
  * 
  * Update component with QS.  
  * 
  * @this {map}
  * @param {String} querystring contains all values of dependencies (from registry)
  * @returns {boolean} true or false depending on if the component still validates with the new criteria
  * 
*/
SOTE.widget.MapSote.prototype.updateComponent = function(querystring)
{	
	// Load SOTE-specific map data if not already cached
	if (!this.isSoteMapDataCached)
	{
		// Define static layers
		var staticProductLayers = 
			[			
				{displayName: "population", wmsProductName: "population", time:"", format: "image/png", urls:["http://map1.vis.earthdata.nasa.gov/data/wms.cgi"], tileSize:[512,512], projection:"EPSG:4326", numZoomLevels:9, maxExtent:[-180,-1350,180,90], maxResolution:0.5625 },
				{displayName: "cartographic:esri-administrative-boundaries_level-1", wmsProductName: "cartographic:esri-administrative-boundaries_level-1", time:"", urls:["http://sedac.ciesin.columbia.edu/geoserver/wms?"], layers:"cartographic:esri-administrative-boundaries_level-1", transparent:true, projection:"EPSG:4326", numZoomLevels:9, maxExtent:[-180,-1350,180,90], maxResolution:0.5625 },
				{displayName: "cartographic:00-global-labels", wmsProductName: "cartographic:00-global-labels", time:"", urls:["http://sedac.ciesin.columbia.edu/geoserver/wms?"], layers:"cartographic:00-global-labels", transparent:true, projection:"EPSG:4326", numZoomLevels:9, maxExtent:[-180,-1350,180,90], maxResolution:0.5625 }
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
	

	// Parse querystring 
	var qs = (querystring === undefined)? "":querystring;
	
	// Return now if querystring is empty
	if (qs == "")
		return;
		
		
	// Enable layer caching since time has presumably been updated
	// TODO: fix this terrible hack
	if (!this.terribleQsSaverJustSet)
	{
		this.setLayerCaching(true);
	}
	else
	{
		this.terribleQsSaverJustSet = false;
	} 
		
	
	var activeLayers = SOTE.util.extractFromQuery("products", qs);
	var activeTransition = SOTE.util.extractFromQuery("transition", qs);
	var activeTime = SOTE.util.extractFromQuery("time", qs);
	
	
	// Apply querystring request to map
	
	// Extract the baselayer and overlays
	var activeLayerNames = null;
	if (activeLayers != ""){
		activeLayerNames = activeLayers.split(".");
	}
	if ((activeLayerNames == null) || (activeLayerNames.length < 1))
	{
		alert("No products provided in querystring to soteMap class");
		return;
	}

	// Determine appropriate layer opacities based on currently-selected time
	
	// Parse and validate time qs
	var timeArray = null;
	if (activeTime != "")
		timeArray = activeTime.split(/T/);
	if ((timeArray == null) || (timeArray.length != 2))
	{
		alert("Invalid or no time provided in querystring to soteMap class;  needs to be of the format YYYY-MM-DDTHH:MM:SS");
		return;
	}
	
	// Parse date and time from qs
	var yyyymmdd = timeArray[0];
	var hhmmss = timeArray[1];
	
	// Parse elements of date and time
	var year = yyyymmdd.split("-")[0];
	var month = yyyymmdd.split("-")[1];
	var day = yyyymmdd.split("-")[2];
	var hour = hhmmss.split(":")[0];
	var minute = hhmmss.split(":")[1];
	var second = hhmmss.split(":")[2];
	
	// Compute most relevant two time steps
	var t0 = new String(yyyymmdd);
	var t1Date = Date.parse(t0).add(1).days();
	var t1 = new String(t1Date.getFullYear() + "-" + SOTE.util.zeroPad(t1Date.getMonth()+1,2) + "-" + SOTE.util.zeroPad(t1Date.getDate(), 2));
	
	// Compute the fractional time of day
	var fracTimeOfDay = hour/24.0 + minute/1440.0 + second/86400.0;
	
	// TODO: fix this
	// Hack to store current querystring
	this.terribleQsSaver = qs;

	
	// Determine transition type and manipulate layers appropriately
	if (activeTransition == "standard")
	{
		// Don't do any fancy opacity adjustments, just show the date that's closest to time slider position
		var selectedDate = null;
//		if (fracTimeOfDay < 0.50)
			selectedDate = new String(t0);
//		else
//			selectedDate = new String(t1);
			
		// Enable layers of selected Date, disable the rest
		var allLayers = this.getAllLayers();
		var nLayers = allLayers.length;
		
		// Outer loop through all OpenLayers layers
		for (var i=0; i<nLayers; i++)
		{
			var layerModified = false;
			
			// Inner loop through all selected layers
			for (var j=0; j<activeLayerNames.length; j++)
			{
				// Enable this layer if string matches zzz
				//if (allLayers[i].name == new String(activeLayerNames[j] + "_" + selectedDate))
				if ((allLayers[i].name == new String(activeLayerNames[j] + "__" + selectedDate)) ||
				    (allLayers[i].name == new String(activeLayerNames[j])))
				{
					// Enable the layer
					allLayers[i].setVisibility(true);
					
						
					// Assume base layer is first element of product list and force it to have the lowest z-index
					// (a z-index of 0 is lowest, higher numbers are drawn on top)
					// Also: Set opacity to 1.0 for base layer, a fraction of it for overlays (until controls can be made)
					if (j==0)
					{
						allLayers[i].setZIndex(0);
						allLayers[i].setOpacity(1.0);
					}
					else
					{
						allLayers[i].setZIndex(1);
						allLayers[i].setOpacity(0.5);
					}
					
					layerModified = true;
				}
			}
			
			// Disable the layer if it hasn't been selected
			if (!layerModified)
			{
				if (!this.isLayerCachingEnabled)
					allLayers[i].setVisibility(false);
				allLayers[i].setOpacity(0.0);
				
				// Reset z-index (assume it is an overlay)
				allLayers[i].setZIndex(1); 	
			}
		}
		
	}
	else if (activeTransition == "crossfade")
	{
		// Adjust layer opacities relative to how close the selected time is to the layer dates 
		alert("crossfade transition not yet supported");
		return;
	}
	 

	
	
	
};


