SOTE.namespace("SOTE.widget.MapSote");

var isSoteMapDataCached;
var soteMapData = null;

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
	SOTE.widget.Map.call(this, containerId, config);
	
	// Load SOTE-specific data into MapSote
	isSoteMapDataCached = false;
	this.updateComponent("");
	
	// test
	this.updateComponent("?products=Aqua_MODIS&time=2011-11-10T12:00:00&transition=standard");
};


SOTE.widget.MapSote.prototype = new SOTE.widget.Map;

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
SOTE.widget.Map.prototype.updateComponent = function(querystring)
{	
	// Load SOTE-specific map data if not already cached
	if (!isSoteMapDataCached)
	{
		soteMapData =
			[
				{displayName: "Terra_MODIS_latest", wmsProductName: "TERRA_MODIS", time:"", format: "image/jpeg", urls:["http://map1.vis.earthdata.nasa.gov/data/wms.cgi"], tileSize:[512,512], projection:"EPSG:4326", numZoomLevels:9, maxExtent:[-180,-1350,180,90], maxResolution:0.5625 },
				{displayName: "Aqua_MODIS_latest", wmsProductName: "AQUA_MODIS", time:"", format: "image/jpeg", urls:["http://map1.vis.earthdata.nasa.gov/data/wms.cgi"], tileSize:[512,512], projection:"EPSG:4326", numZoomLevels:9, maxExtent:[-180,-1350,180,90], maxResolution:0.5625 },
				{displayName: "Aqua_MODIS_2011-11-12", wmsProductName: "AQUA_MODIS", time:"2011-11-12", format: "image/jpeg", urls:["http://map1.vis.earthdata.nasa.gov/data/wms.cgi"], tileSize:[512,512], projection:"EPSG:4326", numZoomLevels:9, maxExtent:[-180,-1350,180,90], maxResolution:0.5625 },
				{displayName: "Aqua_MODIS_2011-11-11", wmsProductName: "AQUA_MODIS", time:"2011-11-11", format: "image/jpeg", urls:["http://map1.vis.earthdata.nasa.gov/data/wms.cgi"], tileSize:[512,512], projection:"EPSG:4326", numZoomLevels:9, maxExtent:[-180,-1350,180,90], maxResolution:0.5625 },
				{displayName: "Aqua_MODIS_2011-11-10", wmsProductName: "AQUA_MODIS", time:"2011-11-10", format: "image/jpeg", urls:["http://map1.vis.earthdata.nasa.gov/data/wms.cgi"], tileSize:[512,512], projection:"EPSG:4326", numZoomLevels:9, maxExtent:[-180,-1350,180,90], maxResolution:0.5625 },
				{displayName: "Aqua_MODIS_2011-11-09", wmsProductName: "AQUA_MODIS", time:"2011-11-09", format: "image/jpeg", urls:["http://map1.vis.earthdata.nasa.gov/data/wms.cgi"], tileSize:[512,512], projection:"EPSG:4326", numZoomLevels:9, maxExtent:[-180,-1350,180,90], maxResolution:0.5625 },
				{displayName: "Aqua_MODIS_2011-11-08", wmsProductName: "AQUA_MODIS", time:"2011-11-08", format: "image/jpeg", urls:["http://map1.vis.earthdata.nasa.gov/data/wms.cgi"], tileSize:[512,512], projection:"EPSG:4326", numZoomLevels:9, maxExtent:[-180,-1350,180,90], maxResolution:0.5625 }
			];
			
		// Load into map
		this.addLayers(soteMapData);
		
		// Update flag upon successful load
		isSoteMapDataCached = true;
	}
	

	// Parse querystring 
	var qs = (querystring === undefined)? "":querystring;
	
	// Return now if querystring is empty
	if (qs == "")
		return;
	
	var activeLayers = SOTE.util.extractFromQuery("products", qs);
	var activeTransition = SOTE.util.extractFromQuery("transition", qs);
	var activeTime = SOTE.util.extractFromQuery("time", qs);

	
	
	// Apply querystring request to map
	
	// Extract the baselayer and overlays
	var layerArray = null;
	if (activeLayers != "")
		layerArray = activeLayers.split(".");
	if ((layerArray == null) || (layerArray.length < 1))
	{
		alert("No products provided in querystring to soteMap class");
		return;
	}

	// Determine appropriate layer opacities based on currently-selected time
	
	// Parse and validate qs
	var timeArray = null;
	if (activeTime != "")
		timeArray = activeTime.split("T");
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

	// Assume base layer is first element
	// TODO: force base layer to be base

	
	
	// Determine transition type and manipulate layers appropriately
	if (activeTransition == "standard")
	{
		// Don't do any fancy opacity adjustments, just show the date that's closest to time slider position
		var selectedDate = null;
		if (fracTimeOfDay < 0.50)
			selectedDate = new String(t0);
		else
			selectedDate = new String(t1);
			
		// Enable layers of selected Date, disable the rest
		var allLayers = this.getAllLayers();
		var nLayers = allLayers.length;
		
		// Outer loop through all OpenLayers layers
		for (var i=0; i<nLayers; i++)
		{
			var layerModified = false;
			
			// Inner loop through all selected layers
			for (var j=0; j<layerArray.length; j++)
			{
				// Enable this layer if string matches
				if (allLayers[i].name == new String(layerArray[j] + "_" + selectedDate))
				{
					allLayers[i].setVisibility(true);
					allLayers[i].setOpacity(1.0);
					layerModified = true;
				}
			}
			
			// Disable the layer if it hasn't been selected
			if (!layerModified)
			{
				allLayers[i].setVisibility(false);
				allLayers[i].setOpacity(0.0);			 				
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


