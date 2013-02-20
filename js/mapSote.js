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
	this.terribleProductListSaver = "";
	this.state = "geographic";
	
	this.setExtent(this.bbox);
	
	// Register MapSote-specific callbacks etc
	this.initMapSote();	
};


SOTE.widget.MapSote.prototype = new SOTE.widget.Map;


SOTE.widget.MapSote.prototype.initMapSote = function()
{
	this.isLayerCachingEnabled = false;
	this.terribleQsSaver = "";
	this.terribleQsSaverJustSet = false;
	this.terribleProductListSaver = "";

	
	// Register callbacks for when movement begins and zoom ends
	this.map.events.register("movestart", this, this.handleMapMoveStart);
	this.map.events.register("zoomend", this, this.handleMapZoomEnd);  
	
	// Force "zoom end" for widget init
	this.handleMapZoomEnd(null);	


	// Recenter map	
	if (this.projection == "EPSG:4326")
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
 		 
	    var bbox = minLon.toString() + ",-46.546875,"+maxLon.toString()+",53.015625";
  		
  	  	//this.setExtent("-146.390625,-93.921875,146.390625,93.953125",true);
  		this.setExtent(bbox,true);
  		this.fire(); 
  	}
  	else
  	{
  		this.setExtent("-4194304,-4194304,4194304,4194304",true);
  		this.fire(); 
  	}
}


/**
 * Sets whether the existing time steps (ie layers) are allowed to remain enabled/active even if that
 * particular time step isn't selected - the layer's opacity is simply reduced to 0;  this
 * is necessary to enable instantaneous switching between time steps instead of needing to
 * reload the data on every time change.  It becomes a burden when panning/zooming, though, so
 * this function should be used carefully.
 * 
 * @param {boolean}		true to enable caching
 */
SOTE.widget.MapSote.prototype.setLayerCaching = function(enable)
{
	this.isLayerCachingEnabled = enable;
}


/**
 * OpenLayers callback that's called as soon as user begins moving the map;  currently used to 
 * disable layer caching
 */
SOTE.widget.MapSote.prototype.handleMapMoveStart = function(evt)
{
	// Disable map caching after pan/zoom
	this.setLayerCaching(false);
	
	// TODO: Set only active time step(s) to be enabled 
	// Currently:  this terrible hack
	if (this.terribleQsSaver != "")
	{
		this.terribleQsSaverJustSet = true;
		this.updateComponent(this.terribleQsSaver);
	}
	
}

/**
 * OpenLayers callback that's called whenever a zoom action ends;  currently used to 
 * update zoom button opacity if at limits of zoom levels
 */
SOTE.widget.MapSote.prototype.handleMapZoomEnd = function(evt)
{
	// "Disable" zoom in icon if zoomed to highest level
	// TODO: fix "color" updates since they don't currently have an effect
	if (this.map.zoom == this.map.numZoomLevels-1)
	{
		$('.olControlZoomInCustomItemInactive').css("background-color", "rgba(38,38,38,0.3)");
		$('.olControlZoomInCustomItemInactive').css("color", "#555555");
	}
	else
	{
		$('.olControlZoomInCustomItemInactive').css("background-color", "rgba(45,50,55,0.70)");
		$('.olControlZoomInCustomItemInactive').css("color", "#FFFFFF");
	}

	// "Disable" zoom out icon if zoomed to lowest level
	if (this.map.zoom == 0)
	{
		$('.olControlZoomOutCustomItemInactive').css("background-color", "rgba(38,38,38,0.3)");
		$('.olControlZoomOutCustomItemInactive').css("color", "#555555");
	}
	else
	{
		$('.olControlZoomOutCustomItemInactive').css("background-color", "rgba(45,50,55,0.70)");
		$('.olControlZoomOutCustomItemInactive').css("color", "#FFFFFF");
	}	
	
}

/**
 * Adds product to map object by creating a separate layer for that product for each accessible date
 * 
 * @param product		the product name
 * @param state			the current projection state
 */
SOTE.widget.MapSote.prototype.addProductToMap = function(product, state)
{
	var layersToAdd = []; 
		
	if(this.state == "geographic")
	{
		layersToAdd = [
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Terra_CorrectedReflectance_TrueColor", "MODIS_Terra_CorrectedReflectance_TrueColor", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_250m, this.TILEMATRIXSET_GEO_250m),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Terra_SurfaceReflectance_Bands143", "MODIS_Terra_SurfaceReflectance_Bands143", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_500m, this.TILEMATRIXSET_GEO_500m),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Aqua_CorrectedReflectance_TrueColor", "MODIS_Aqua_CorrectedReflectance_TrueColor", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_250m, this.TILEMATRIXSET_GEO_250m),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Aqua_SurfaceReflectance_Bands143", "MODIS_Aqua_SurfaceReflectance_Bands143", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_500m, this.TILEMATRIXSET_GEO_500m),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Terra_CorrectedReflectance_Bands721", "MODIS_Terra_CorrectedReflectance_Bands721", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_250m, this.TILEMATRIXSET_GEO_250m),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Aqua_CorrectedReflectance_Bands721", "MODIS_Aqua_CorrectedReflectance_Bands721", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_250m, this.TILEMATRIXSET_GEO_250m),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Terra_SurfaceReflectance_Bands721", "MODIS_Terra_SurfaceReflectance_Bands721", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_500m, this.TILEMATRIXSET_GEO_500m),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Aqua_SurfaceReflectance_Bands721", "MODIS_Aqua_SurfaceReflectance_Bands721", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_500m, this.TILEMATRIXSET_GEO_500m),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Terra_CorrectedReflectance_Bands367", "MODIS_Terra_CorrectedReflectance_Bands367", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_250m, this.TILEMATRIXSET_GEO_250m),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Terra_SurfaceReflectance_Bands121", "MODIS_Terra_SurfaceReflectance_Bands121", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_500m, this.TILEMATRIXSET_GEO_250m),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Aqua_SurfaceReflectance_Bands121", "MODIS_Aqua_SurfaceReflectance_Bands121", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_500m, this.TILEMATRIXSET_GEO_250m),
			
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Terra_Data_No_Data", "MODIS_Terra_Data_No_Data", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_250m, this.TILEMATRIXSET_GEO_250m),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Aqua_Data_No_Data", "MODIS_Aqua_Data_No_Data", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_250m, this.TILEMATRIXSET_GEO_250m),

			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Terra_Snow_Cover", "MODIS_Terra_Snow_Cover", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_500m, this.TILEMATRIXSET_GEO_500m),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Aqua_Snow_Cover", "MODIS_Aqua_Snow_Cover", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_500m, this.TILEMATRIXSET_GEO_500m),	
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Terra_Sea_Ice", "MODIS_Terra_Sea_Ice", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_1km, this.TILEMATRIXSET_GEO_1km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Aqua_Sea_Ice", "MODIS_Aqua_Sea_Ice", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_1km, this.TILEMATRIXSET_GEO_1km),			
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Terra_Land_Surface_Temp_Day", "MODIS_Terra_Land_Surface_Temp_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_1km, this.TILEMATRIXSET_GEO_1km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Aqua_Land_Surface_Temp_Day", "MODIS_Aqua_Land_Surface_Temp_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_1km, this.TILEMATRIXSET_GEO_1km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Terra_Land_Surface_Temp_Night", "MODIS_Terra_Land_Surface_Temp_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_1km, this.TILEMATRIXSET_GEO_1km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Aqua_Land_Surface_Temp_Night", "MODIS_Aqua_Land_Surface_Temp_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_1km, this.TILEMATRIXSET_GEO_1km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Terra_Brightness_Temp_Band31_Day", "MODIS_Terra_Brightness_Temp_Band31_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_1km, this.TILEMATRIXSET_GEO_1km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Aqua_Brightness_Temp_Band31_Day", "MODIS_Aqua_Brightness_Temp_Band31_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_1km, this.TILEMATRIXSET_GEO_1km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Terra_Brightness_Temp_Band31_Night", "MODIS_Terra_Brightness_Temp_Band31_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_1km, this.TILEMATRIXSET_GEO_1km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Aqua_Brightness_Temp_Band31_Night", "MODIS_Aqua_Brightness_Temp_Band31_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_1km, this.TILEMATRIXSET_GEO_1km),									
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Terra_Aerosol", "MODIS_Terra_Aerosol", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Aqua_Aerosol", "MODIS_Aqua_Aerosol", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Combined_Value_Added_AOD", "MODIS_Combined_Value_Added_AOD", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Terra_Water_Vapor_5km_Day", "MODIS_Terra_Water_Vapor_5km_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Aqua_Water_Vapor_5km_Day", "MODIS_Aqua_Water_Vapor_5km_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Terra_Water_Vapor_5km_Night", "MODIS_Terra_Water_Vapor_5km_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Aqua_Water_Vapor_5km_Night", "MODIS_Aqua_Water_Vapor_5km_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Terra_Cloud_Top_Pressure_Day", "MODIS_Terra_Cloud_Top_Pressure_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Aqua_Cloud_Top_Pressure_Day", "MODIS_Aqua_Cloud_Top_Pressure_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Terra_Cloud_Top_Pressure_Night", "MODIS_Terra_Cloud_Top_Pressure_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Aqua_Cloud_Top_Pressure_Night", "MODIS_Aqua_Cloud_Top_Pressure_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Terra_Cloud_Top_Temp_Day", "MODIS_Terra_Cloud_Top_Temp_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Aqua_Cloud_Top_Temp_Day", "MODIS_Aqua_Cloud_Top_Temp_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Terra_Cloud_Top_Temp_Night", "MODIS_Terra_Cloud_Top_Temp_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Aqua_Cloud_Top_Temp_Night", "MODIS_Aqua_Cloud_Top_Temp_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),

			SOTE.util.generateProductLayersForDateRangeTMS(product, "AIRS_Dust_Score", "AIRS_Dust_Score", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "AIRS_CO_Total_Column_Day", "AIRS_CO_Total_Column_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "AIRS_CO_Total_Column_Night", "AIRS_CO_Total_Column_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "AIRS_Prata_SO2_Index_Day", "AIRS_Prata_SO2_Index_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "AIRS_Prata_SO2_Index_Night", "AIRS_Prata_SO2_Index_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "AIRS_Precipitation_Day", "AIRS_Precipitation_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "AIRS_Precipitation_Night", "AIRS_Precipitation_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
			
			SOTE.util.generateProductLayersForDateRangeTMS(product, "OMI_Cloud_Pressure", "OMI_Cloud_Pressure", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "OMI_Aerosol_Index", "OMI_Aerosol_Index", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "OMI_Aerosol_Optical_Depth", "OMI_Aerosol_Optical_Depth", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "OMI_Absorbing_Aerosol_Optical_Depth", "OMI_Absorbing_Aerosol_Optical_Depth", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "OMI_SO2_Lower_Troposphere", "OMI_SO2_Lower_Troposphere", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "OMI_SO2_Middle_Troposphere", "OMI_SO2_Middle_Troposphere", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "OMI_SO2_Upper_Troposphere_and_Stratosphere", "OMI_SO2_Upper_Troposphere_and_Stratosphere", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "OMI_SO2_Planetary_Boundary_Layer", "OMI_SO2_Planetary_Boundary_Layer", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_2km, this.TILEMATRIXSET_GEO_2km),
			
			SOTE.util.generateProductLayersForDateRangeTMS(product, "OBPG_MODIS_Aqua_Chlorophyll_A", "OBPG_MODIS_Aqua_Chlorophyll_A", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_1km, this.TILEMATRIXSET_GEO_1km),
			SOTE.util.generateProductLayersForDateRangeTMS(product, "OBPG_SeaSurfaceTemperature_11_Day", "OBPG_SeaSurfaceTemperature_11_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_GEO_ALL, this.RESOLUTIONS_ON_SERVER_GEO_1km, this.TILEMATRIXSET_GEO_1km),

			SOTE.util.generateWmsProductLayersForDateRange(product, "MODIS_Fires_All", "MODIS_Fires_All", "image/png", ["http://map2a.vis.earthdata.nasa.gov/wms/wms.php", "http://map2b.vis.earthdata.nasa.gov/wms/wms.php", "http://map2c.vis.earthdata.nasa.gov/wms/wms.php"], "EPSG:4326", 1.0, true, this.NUM_DAYS_TO_GENERATE),
			SOTE.util.generateWmsProductLayersForDateRange(product, "MODIS_Fires_Terra", "MODIS_Fires_Terra", "image/png", ["http://map2a.vis.earthdata.nasa.gov/wms/wms.php", "http://map2b.vis.earthdata.nasa.gov/wms/wms.php", "http://map2c.vis.earthdata.nasa.gov/wms/wms.php"], "EPSG:4326", 1.0, true, this.NUM_DAYS_TO_GENERATE),
			SOTE.util.generateWmsProductLayersForDateRange(product, "MODIS_Fires_Aqua", "MODIS_Fires_Aqua", "image/png", ["http://map2a.vis.earthdata.nasa.gov/wms/wms.php", "http://map2b.vis.earthdata.nasa.gov/wms/wms.php", "http://map2c.vis.earthdata.nasa.gov/wms/wms.php"], "EPSG:4326", 1.0, true, this.NUM_DAYS_TO_GENERATE),
			SOTE.util.generateWmsProductLayersForDateRange(product, "Terra_Orbit_Asc", "Terra_Orbit_Asc", "image/png", ["http://map2a.vis.earthdata.nasa.gov/wms/wms.php", "http://map2b.vis.earthdata.nasa.gov/wms/wms.php", "http://map2c.vis.earthdata.nasa.gov/wms/wms.php"], "EPSG:4326", 1.0, true, this.NUM_DAYS_TO_GENERATE),
			SOTE.util.generateWmsProductLayersForDateRange(product, "Terra_Orbit_Dsc", "Terra_Orbit_Dsc", "image/png", ["http://map2a.vis.earthdata.nasa.gov/wms/wms.php", "http://map2b.vis.earthdata.nasa.gov/wms/wms.php", "http://map2c.vis.earthdata.nasa.gov/wms/wms.php"], "EPSG:4326", 1.0, true, this.NUM_DAYS_TO_GENERATE),
			SOTE.util.generateWmsProductLayersForDateRange(product, "Aqua_Orbit_Asc", "Aqua_Orbit_Asc", "image/png", ["http://map2a.vis.earthdata.nasa.gov/wms/wms.php", "http://map2b.vis.earthdata.nasa.gov/wms/wms.php", "http://map2c.vis.earthdata.nasa.gov/wms/wms.php"], "EPSG:4326", 1.0, true, this.NUM_DAYS_TO_GENERATE),
			SOTE.util.generateWmsProductLayersForDateRange(product, "Aqua_Orbit_Dsc", "Aqua_Orbit_Dsc", "image/png", ["http://map2a.vis.earthdata.nasa.gov/wms/wms.php", "http://map2b.vis.earthdata.nasa.gov/wms/wms.php", "http://map2c.vis.earthdata.nasa.gov/wms/wms.php"], "EPSG:4326", 1.0, true, this.NUM_DAYS_TO_GENERATE),
			SOTE.util.generateWmsProductLayersForDateRange(product, "Aura_Orbit_Asc", "Aura_Orbit_Asc", "image/png", ["http://map2a.vis.earthdata.nasa.gov/wms/wms.php", "http://map2b.vis.earthdata.nasa.gov/wms/wms.php", "http://map2c.vis.earthdata.nasa.gov/wms/wms.php"], "EPSG:4326", 1.0, true, this.NUM_DAYS_TO_GENERATE),
			SOTE.util.generateWmsProductLayersForDateRange(product, "Aura_Orbit_Dsc", "Aura_Orbit_Dsc", "image/png", ["http://map2a.vis.earthdata.nasa.gov/wms/wms.php", "http://map2b.vis.earthdata.nasa.gov/wms/wms.php", "http://map2c.vis.earthdata.nasa.gov/wms/wms.php"], "EPSG:4326", 1.0, true, this.NUM_DAYS_TO_GENERATE),
			
			(product == "sedac_bound") ? [{displayName: "sedac_bound", wmsProductName: "sedac_bound", time:"", format: "image/png", urls:["http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], tileSize:[512,512], projection:"EPSG:4326", numZoomLevels:9, maxExtent:[-180,-1350,180,90], maxResolution:0.5625, preferredOpacity: 0.90, bringToFront: true, transitionEffect:"none" }] : [],
			(product == "MODIS_Land_Water_Mask") ? [{displayName: "MODIS_Land_Water_Mask", wmsProductName: "MODIS_Land_Water_Mask", time:"", format: "image/png", urls:["http://map1.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], tileSize:[512,512], projection:"EPSG:4326", numZoomLevels:9, maxExtent:[-180,-1350,180,90], maxResolution:0.5625, preferredOpacity: 0.75, bringToFront:true }] : [],
			(product == "VIIRS_CityLights_2012") ? [{displayName: "VIIRS_CityLights_2012", wmsProductName: "VIIRS_CityLights_2012", time:"", format: "image/jpeg", urls:["http://map1.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"], tileSize:[512,512], projection:"EPSG:4326", numZoomLevels:9, maxExtent:[-180,-1350,180,90], maxResolution:0.5625, resolutions: this.RESOLUTIONS_ON_SCREEN_GEO_ALL, serverResolutions: this.RESOLUTIONS_ON_SERVER_GEO_500m, tileMatrixSet: this.TILEMATRIXSET_GEO_500m, preferredOpacity: 1.0, bringToFront:true }] : [],
			(product == "grump-v1-population-count_2000") ? [{displayName: "grump-v1-population-count_2000", wmsProductName: "grump-v1-population-count_2000", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.55 }] : [],
			(product == "ndh-cyclone-hazard-frequency-distribution") ? [{displayName: "ndh-cyclone-hazard-frequency-distribution", wmsProductName: "ndh-cyclone-hazard-frequency-distribution", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 }] : [],
			(product == "ndh-cyclone-proportional-economic-loss-risk-deciles") ? [{displayName: "ndh-cyclone-proportional-economic-loss-risk-deciles", wmsProductName: "ndh-cyclone-proportional-economic-loss-risk-deciles", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 }] : [],
			(product == "ndh-cyclone-mortality-risks-distribution") ? [{displayName: "ndh-cyclone-mortality-risks-distribution", wmsProductName: "ndh-cyclone-mortality-risks-distribution", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 }] : [],
			(product == "ndh-flood-hazard-frequency-distribution") ? [{displayName: "ndh-flood-hazard-frequency-distribution", wmsProductName: "ndh-flood-hazard-frequency-distribution", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 }] : [],
			(product == "ndh-flood-proportional-economic-loss-risk-deciles") ? [{displayName: "ndh-flood-proportional-economic-loss-risk-deciles", wmsProductName: "ndh-flood-proportional-economic-loss-risk-deciles", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 }] : [],
			(product == "ndh-flood-mortality-risks-distribution") ? [{displayName: "ndh-flood-mortality-risks-distribution", wmsProductName: "ndh-flood-mortality-risks-distribution", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 }] : [],
			(product == "ndh-drought-hazard-frequency-distribution") ? [{displayName: "ndh-drought-hazard-frequency-distribution", wmsProductName: "ndh-drought-hazard-frequency-distribution", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 }] : [],
			(product == "ndh-drought-proportional-economic-loss-risk-deciles") ? [{displayName: "ndh-drought-proportional-economic-loss-risk-deciles", wmsProductName: "ndh-drought-proportional-economic-loss-risk-deciles", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 }] : [],
			(product == "ndh-drought-mortality-risks-distribution") ? [{displayName: "ndh-drought-mortality-risks-distribution", wmsProductName: "ndh-drought-mortality-risks-distribution", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 }] : [],
			(product == "ndh-volcano-hazard-frequency-distribution") ? [{displayName: "ndh-volcano-hazard-frequency-distribution", wmsProductName: "ndh-volcano-hazard-frequency-distribution", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 }] : [],
			(product == "ndh-volcano-proportional-economic-loss-risk-deciles") ? [{displayName: "ndh-volcano-proportional-economic-loss-risk-deciles", wmsProductName: "ndh-volcano-proportional-economic-loss-risk-deciles", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 }] : [],
			(product == "ndh-volcano-mortality-risks-distribution") ? [{displayName: "ndh-volcano-mortality-risks-distribution", wmsProductName: "ndh-volcano-mortality-risks-distribution", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 }] : [],
			(product == "cartographic:esri-administrative-boundaries_level-1") ? [{displayName: "cartographic:esri-administrative-boundaries_level-1", wmsProductName: "cartographic:esri-administrative-boundaries_level-1", time:"", urls:["http://sedac.ciesin.columbia.edu/geoserver/wms?"], layers:"cartographic:esri-administrative-boundaries_level-1", transparent:true, projection:"EPSG:4326", preferredOpacity: 0.55, bringToFront: true }] : [],
			(product == "gpw-v3-coastlines") ? [{displayName: "gpw-v3-coastlines", wmsProductName: "gpw-v3-coastlines", time:"", urls:["http://sedac.ciesin.columbia.edu/geoserver/wms?"], layers:"gpw-v3-coastlines", transparent:true, projection:"EPSG:4326", preferredOpacity: 0.85, bringToFront: true}] : [],
			(product == "cartographic:00-global-labels") ? [{displayName: "cartographic:00-global-labels", wmsProductName: "cartographic:00-global-labels", time:"", urls:["http://sedac.ciesin.columbia.edu/geoserver/wms?"], layers:"cartographic:00-global-labels", transparent:true, projection:"EPSG:4326", preferredOpacity: 0.95, bringToFront: true }] : []				
		];
		
		
	}
	else if (this.state == "arctic")
	{
		layersToAdd = [
			SOTE.util.generateProductLayersForDateRange(product, "MODIS_Terra_CorrectedReflectance_TrueColor", "MODIS_Terra_CorrectedReflectance_TrueColor", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/arctic/wms.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_250m),
			SOTE.util.generateProductLayersForDateRange(product, "MODIS_Aqua_CorrectedReflectance_TrueColor", "MODIS_Aqua_CorrectedReflectance_TrueColor", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/arctic/wms.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_250m),
			SOTE.util.generateProductLayersForDateRange(product, "MODIS_Terra_CorrectedReflectance_Bands367", "MODIS_Terra_CorrectedReflectance_Bands367", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/arctic/wms.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_250m),

			SOTE.util.generateProductLayersForDateRange(product, "MODIS_Terra_Brightness_Temp_Band31_Day", "MODIS_Terra_Brightness_Temp_Band31_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/arctic/wms.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km),
			SOTE.util.generateProductLayersForDateRange(product, "MODIS_Terra_Brightness_Temp_Band31_Night", "MODIS_Terra_Brightness_Temp_Band31_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/arctic/wms.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km),
			SOTE.util.generateProductLayersForDateRange(product, "MODIS_Aqua_Brightness_Temp_Band31_Day", "MODIS_Aqua_Brightness_Temp_Band31_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/arctic/wms.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km),
			SOTE.util.generateProductLayersForDateRange(product, "MODIS_Aqua_Brightness_Temp_Band31_Night", "MODIS_Aqua_Brightness_Temp_Band31_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/arctic/wms.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km),
			SOTE.util.generateProductLayersForDateRange(product, "MODIS_Terra_Snow_Cover", "MODIS_Terra_Snow_Cover", "image/png", ["http://map1a.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/arctic/wms.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_500m),
			SOTE.util.generateProductLayersForDateRange(product, "MODIS_Aqua_Snow_Cover", "MODIS_Aqua_Snow_Cover", "image/png", ["http://map1a.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/arctic/wms.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_500m),
			SOTE.util.generateProductLayersForDateRange(product, "MODIS_Terra_Sea_Ice", "MODIS_Terra_Sea_Ice", "image/png", ["http://map1a.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/arctic/wms.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km),
			SOTE.util.generateProductLayersForDateRange(product, "MODIS_Aqua_Sea_Ice", "MODIS_Aqua_Sea_Ice", "image/png", ["http://map1a.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/arctic/wms.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km),		

			// Commented out until polar WMTSes are ready
			// SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Terra_CorrectedReflectance_TrueColor", "MODIS_Terra_CorrectedReflectance_TrueColor", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_250m, this.TILEMATRIXSET_ARCTIC_250m),
			// SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Aqua_CorrectedReflectance_TrueColor", "MODIS_Aqua_CorrectedReflectance_TrueColor", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_250m, this.TILEMATRIXSET_ARCTIC_250m),
			// SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Terra_CorrectedReflectance_Bands367", "MODIS_Terra_CorrectedReflectance_Bands367", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_250m, this.TILEMATRIXSET_ARCTIC_250m),
// 
			// SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Terra_Brightness_Temp_Band31_Day", "MODIS_Terra_Brightness_Temp_Band31_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km, this.TILEMATRIXSET_ARCTIC_1km),
			// SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Terra_Brightness_Temp_Band31_Night", "MODIS_Terra_Brightness_Temp_Band31_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km, this.TILEMATRIXSET_ARCTIC_1km),
			// SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Aqua_Brightness_Temp_Band31_Day", "MODIS_Aqua_Brightness_Temp_Band31_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km, this.TILEMATRIXSET_ARCTIC_1km),
			// SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Aqua_Brightness_Temp_Band31_Night", "MODIS_Aqua_Brightness_Temp_Band31_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km, this.TILEMATRIXSET_ARCTIC_1km),
// 
			// SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Terra_Snow_Cover", "MODIS_Terra_Snow_Cover", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km, this.TILEMATRIXSET_ARCTIC_500m),
			// SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Aqua_Snow_Cover", "MODIS_Aqua_Snow_Cover", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km, this.TILEMATRIXSET_ARCTIC_500m),
// 
			// SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Terra_Sea_Ice", "MODIS_Terra_Sea_Ice", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km, this.TILEMATRIXSET_ARCTIC_1km),
			// SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Aqua_Sea_Ice", "MODIS_Aqua_Sea_Ice", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi"], [512,512], "EPSG:3995", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km, this.TILEMATRIXSET_ARCTIC_1km),
			// (product == "arctic_coastlines") ? [{displayName: "arctic_coastlines", wmsProductName: "arctic_coastlines", time:"", format: "image/png", urls:["http://map1a.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi"], tileSize:[512,512], projection:"EPSG:3995", numZoomLevels:6, maxExtent:[-4194304,-4194304,4194304,4194304], maxResolution:8192.0, tileMatrixSet: this.TILEMATRIXSET_ARCTIC_250m, resolutions: RESOLUTIONS_ON_SCREEN_POLAR_ALL, serverResolutions: RESOLUTIONS_ON_SERVER_POLAR_250m, preferredOpacity: 1.0, bringToFront: true, transitionEffect:"none" }] : [],

			(product == "arctic_coastlines") ? [{displayName: "arctic_coastlines", wmsProductName: "arctic_coastlines", time:"", format: "image/png", urls:["http://map1a.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/arctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/arctic/wms.cgi"], tileSize:[512,512], projection:"EPSG:3995", numZoomLevels:6, maxExtent:[-4194304,-4194304,4194304,4194304], maxResolution:8192.0, resolutions: this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, serverResolutions: this.RESOLUTIONS_ON_SERVER_POLAR_250m, preferredOpacity: 1.0, bringToFront: true, transitionEffect:"none" }] : [],
			(product == "grump-v1-population-count_2000") ? [{displayName: "grump-v1-population-count_2000", wmsProductName: "grump-v1-population-count_2000", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/wms?"], projection:"EPSG:3995", preferredOpacity: 0.75, bringToFront: true }] : [],
			(product == "polarview:graticuleN") ? [{displayName: "polarview:graticuleN", wmsProductName: "polarview:graticuleN", time:"", urls:["http://geos.polarview.aq/geoserver/wms?"], layers:"polarview:graticuleN", transparent:true, projection:"EPSG:3995", preferredOpacity: 0.75, bringToFront: true }] : [],
			(product == "cartographic:national-boundaries") ? [{displayName: "cartographic:national-boundaries", wmsProductName: "cartographic:national-boundaries", time:"", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], layers:"cartographic:national-boundaries", transparent:true, projection:"EPSG:3995", preferredOpacity: 0.55, bringToFront: true }] : [],
				//{displayName: "coastlines", wmsProductName: "coastlines", time:"", urls:[" http://nsidc.org/cgi-bin/atlas_north?"], layers:"coastlines", transparent:true, projection:"EPSG:32661", preferredOpacity: 0.85, bringToFront: true },
			(product == "cartographic:00-global-labels") ? [{displayName: "cartographic:00-global-labels", wmsProductName: "cartographic:00-global-labels", time:"", urls:["http://sedac.ciesin.columbia.edu/geoserver/wms?"], layers:"cartographic:00-global-labels", transparent:true, projection:"EPSG:3995", preferredOpacity: 0.95, bringToFront: true }] : []
		];
		
	}
	else if (this.state == "antarctic")
	{
		layersToAdd = [
			SOTE.util.generateProductLayersForDateRange(product, "MODIS_Terra_CorrectedReflectance_TrueColor", "MODIS_Terra_CorrectedReflectance_TrueColor", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/antarctic/wms.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_250m),
			SOTE.util.generateProductLayersForDateRange(product, "MODIS_Aqua_CorrectedReflectance_TrueColor", "MODIS_Aqua_CorrectedReflectance_TrueColor", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/antarctic/wms.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_250m),
			SOTE.util.generateProductLayersForDateRange(product, "MODIS_Terra_CorrectedReflectance_Bands367", "MODIS_Terra_CorrectedReflectance_Bands367", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/antarctic/wms.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_250m),

			SOTE.util.generateProductLayersForDateRange(product, "MODIS_Terra_Brightness_Temp_Band31_Day", "MODIS_Terra_Brightness_Temp_Band31_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/antarctic/wms.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km),
			SOTE.util.generateProductLayersForDateRange(product, "MODIS_Terra_Brightness_Temp_Band31_Night", "MODIS_Terra_Brightness_Temp_Band31_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/antarctic/wms.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km),
			SOTE.util.generateProductLayersForDateRange(product, "MODIS_Aqua_Brightness_Temp_Band31_Day", "MODIS_Aqua_Brightness_Temp_Band31_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/antarctic/wms.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km),
			SOTE.util.generateProductLayersForDateRange(product, "MODIS_Aqua_Brightness_Temp_Band31_Night", "MODIS_Aqua_Brightness_Temp_Band31_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/antarctic/wms.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km),
			SOTE.util.generateProductLayersForDateRange(product, "MODIS_Terra_Snow_Cover", "MODIS_Terra_Snow_Cover", "image/png", ["http://map1a.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/antarctic/wms.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_500m),
			SOTE.util.generateProductLayersForDateRange(product, "MODIS_Aqua_Snow_Cover", "MODIS_Aqua_Snow_Cover", "image/png", ["http://map1a.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/antarctic/wms.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_500m),
			SOTE.util.generateProductLayersForDateRange(product, "MODIS_Terra_Sea_Ice", "MODIS_Terra_Sea_Ice", "image/png", ["http://map1a.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/antarctic/wms.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km),
			SOTE.util.generateProductLayersForDateRange(product, "MODIS_Aqua_Sea_Ice", "MODIS_Aqua_Sea_Ice", "image/png", ["http://map1a.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/antarctic/wms.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km),
			SOTE.util.generateProductLayersForDateRange(product, "NSIDC_Sea_Ice_Concentration", "NSIDC_Sea_Ice_Concentration", "image/png", ["http://map1a.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/antarctic/wms.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km),

			// Commented out until polar WMTSes are ready
			// SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Terra_CorrectedReflectance_TrueColor", "MODIS_Terra_CorrectedReflectance_TrueColor", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_250m, this.TILEMATRIXSET_ANTARCTIC_250m),
			// SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Aqua_CorrectedReflectance_TrueColor", "MODIS_Aqua_CorrectedReflectance_TrueColor", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_250m, this.TILEMATRIXSET_ANTARCTIC_250m),
			// SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Terra_CorrectedReflectance_Bands367", "MODIS_Terra_CorrectedReflectance_Bands367", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_250m, this.TILEMATRIXSET_ANTARCTIC_250m),
// 
			// SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Terra_Brightness_Temp_Band31_Day", "MODIS_Terra_Brightness_Temp_Band31_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km, this.TILEMATRIXSET_ANTARCTIC_1km),
			// SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Terra_Brightness_Temp_Band31_Night", "MODIS_Terra_Brightness_Temp_Band31_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km, this.TILEMATRIXSET_ANTARCTIC_1km),
			// SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Aqua_Brightness_Temp_Band31_Day", "MODIS_Aqua_Brightness_Temp_Band31_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km, this.TILEMATRIXSET_ANTARCTIC_1km),
			// SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Aqua_Brightness_Temp_Band31_Night", "MODIS_Aqua_Brightness_Temp_Band31_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km, this.TILEMATRIXSET_ANTARCTIC_1km),
// 
			// SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Terra_Snow_Cover", "MODIS_Terra_Snow_Cover", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km, this.TILEMATRIXSET_ANTARCTIC_500m),
			// SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Aqua_Snow_Cover", "MODIS_Aqua_Snow_Cover", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km, this.TILEMATRIXSET_ANTARCTIC_500m),
// 
			// SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Terra_Sea_Ice", "MODIS_Terra_Sea_Ice", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km, this.TILEMATRIXSET_ANTARCTIC_1km),
			// SOTE.util.generateProductLayersForDateRangeTMS(product, "MODIS_Aqua_Sea_Ice", "MODIS_Aqua_Sea_Ice", "image/png", ["http://map1a.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi", "http://map1b.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi", "http://map1c.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km, this.TILEMATRIXSET_ANTARCTIC_1km),

			// (product == "antarctic_coastlines") ? [{displayName: "antarctic_coastlines", wmsProductName: "antarctic_coastlines", time:"", format: "image/png", urls:["http://map2a.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi", "http://map2b.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi", "http://map2c.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi"], tileSize:[512,512], projection:"EPSG:3031", numZoomLevels:6, maxExtent:[-4194304,-4194304,4194304,4194304], maxResolution:8192.0, tileMatrixSet: this.TILEMATRIXSET_ANTARCTIC_250m, resolutions: RESOLUTIONS_ON_SCREEN_POLAR_ALL, serverResolutions: RESOLUTIONS_ON_SERVER_POLAR_250m, preferredOpacity: 1.0, bringToFront: true, transitionEffect:"none" }] : [],

			// SOTE.util.generateProductLayersForDateRange(product, "NSIDC_Sea_Ice_Concentration", "NSIDC_Sea_Ice_Concentration", "image/png", ["http://map1a.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/antarctic/wms.cgi"], [512,512], "EPSG:3031", 6, [-4194304,-4194304,4194304,4194304], 8192.0, 1.0, this.NUM_DAYS_TO_GENERATE, this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, this.RESOLUTIONS_ON_SERVER_POLAR_1km),

			(product == "antarctic_coastlines") ? [{displayName: "antarctic_coastlines", wmsProductName: "antarctic_coastlines", time:"", format: "image/png", urls:["http://map1a.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/antarctic/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/antarctic/wms.cgi"], tileSize:[512,512], projection:"EPSG:3031", numZoomLevels:6, maxExtent:[-4194304,-4194304,4194304,4194304], maxResolution:8192.0, resolutions: this.RESOLUTIONS_ON_SCREEN_POLAR_ALL, serverResolutions: this.RESOLUTIONS_ON_SERVER_POLAR_250m, preferredOpacity: 1.0, bringToFront: true, transitionEffect:"none" }] : [],
			(product == "grump-v1-population-count_2000") ? [{displayName: "grump-v1-population-count_2000", wmsProductName: "grump-v1-population-count_2000", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/wms?"], projection:"EPSG:3031", preferredOpacity: 0.75, bringToFront: true }] : [],
			(product == "polarview:graticule3031_10x30") ? [{displayName: "polarview:graticule3031_10x30", wmsProductName: "polarview:graticule3031_10x30", time:"", urls:["http://geos.polarview.aq/geoserver/wms?"], layers:"polarview:graticule3031_10x30", transparent:true, projection:"EPSG:3031", preferredOpacity: 0.75, bringToFront: true }] : [],
			(product == "cartographic:national-boundaries") ? [{displayName: "cartographic:national-boundaries", wmsProductName: "cartographic:national-boundaries", time:"", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], layers:"cartographic:national-boundaries", transparent:true, projection:"EPSG:3031", preferredOpacity: 0.55, bringToFront: true }] : [],
			(product == "lat_long_grid") ? [{displayName: "lat_long_grid", wmsProductName: "lat_long_grid", time:"", urls:["http://nsidc.org/cgi-bin/atlas_south?"], layers:"lat_long_grid", transparent:true, projection:"EPSG:3031", preferredOpacity: 0.85, bringToFront: true }] : [],
			(product == "coastlines") ? [{displayName: "coastlines", wmsProductName: "coastlines", time:"", urls:["http://nsidc.org/cgi-bin/atlas_south?"], layers:"coastlines", transparent:true, projection:"EPSG:3031", preferredOpacity: 0.95, bringToFront: true }] : []		
		];
	}
	

	// Load product layer(s) into map
	for (var i=0; i<layersToAdd.length; i++)
	{
		if (layersToAdd[i].length > 0)
		{
			this.addLayers(layersToAdd[i]);
		}	
	}
	
}


/**
 * Function to manage which layers are currently loaded into the map object.
 * This is needed since it causes browser slowdowns to preload all layers into mmeory.
 * 
 * @param querystring		querystring from updateComponent
 */
SOTE.widget.MapSote.prototype.manageLoadedLayers = function(querystring)
{
	// Check for projection state change
	var state = (SOTE.util.extractFromQuery("switch",querystring))? SOTE.util.extractFromQuery("switch",querystring): "geographic";
	if (state != this.state)
	{
		this.state = state;
		if(this.state == "geographic")
			this.projection = "EPSG:4326";
		else if(this.state == "antarctic")
			this.projection = "EPSG:3031";
		else if (this.state == "arctic")
			this.projection = "EPSG:3995";

		// Reinitialize map (and thereby remove all existing layers from memory)
		this.init();
		this.initMapSote();
	}
	
	
	// Retrieve and compare "updated" products to "old" products 
	var isProductListDifferent = false;
	var updatedProductListQs = (SOTE.util.extractFromQuery("products",querystring));
	if (updatedProductListQs != this.terribleProductListSaver)
    {
		// Products have been updated and map needs to reflect this
		isProductListDifferent = true;
		this.terribleProductListSaver = updatedProductListQs;
    }
    

    if (isProductListDifferent)
    {
  		// Parse "updated" products
		var allActiveLayers = [];
		var productsAndBaselayersQs = updatedProductListQs.split("~");
		var updatedBaselayerQs =  productsAndBaselayersQs[0];
		var updatedOverlaysQs = productsAndBaselayersQs[1];
		if (updatedBaselayerQs.split(".").length > 1)
	    {
			allActiveLayers.push((updatedBaselayerQs.split("."))[1]);
	    }

		var numOverlays = updatedOverlaysQs ? updatedOverlaysQs.split(".").length - 1 : 0;
		if (numOverlays > 0) 
	    {
			for (var i=0; i<numOverlays; i++)
			{
				allActiveLayers.push((updatedOverlaysQs.split("."))[i+1]);
			}  
		}
		
		// Define "startsWith" string operator if it doesn't exist
		if (typeof String.prototype.startsWith != 'function') 
		{
  			String.prototype.startsWith = function (str)
  			{
    			return this.slice(0, str.length) == str;
  			};
		}
		
		// Check if updated products are currently cached
		var productsToAdd = [];
		for (var i=0; i<allActiveLayers.length; i++)
		{
			var isProductAlreadyLoaded = false;
			
			for (var j=0;  j<this.map.layers.length;  j++)
			{
				if (this.map.layers[j].name.startsWith(allActiveLayers[i]))
				{
					isProductAlreadyLoaded = true;
					break;
				}
			}
			
			if (!isProductAlreadyLoaded)
				productsToAdd.push(allActiveLayers[i]);
		}
		
		// Add only the layers that are necessary
		for (var i=0; i<productsToAdd.length; i++)
		{
			this.addProductToMap(productsToAdd[i], state);
		}
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
 
	var state = (SOTE.util.extractFromQuery("switch",querystring))? SOTE.util.extractFromQuery("switch",querystring): "geographic";


	// Manage the currently-loaded layers by adding/removing, as necessary
	this.manageLoadedLayers(querystring);


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
	var activeLayerNames = new Array();
	if (activeLayers != ""){
		var a = activeLayers.split("~");
		var base = a[0].split(".");
		var overlays = a[1].split(".");
		for(var i=1; i<base.length; ++i){
			activeLayerNames.push(base[i]);
		}
		for(var i=1; i<overlays.length; ++i){
			activeLayerNames.push(overlays[i]);
		}
		
	}
	if ((activeLayerNames == null) || (activeLayerNames.length < 1))
	{
		//alert("No products provided in querystring to soteMap class");
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
						this.map.setLayerZIndex(allLayers[i], 0);
						allLayers[i].setOpacity(1.0);
					}
					else
					{
						// Set Z-layering
						if (this.checkWmsParam(allLayers[i].metadata.bringToFront) && allLayers[i].metadata.bringToFront)
							this.map.setLayerZIndex(allLayers[i], nLayers-1);						
						
						// Set opacity
						if (this.checkWmsParam(allLayers[i].metadata.preferredOpacity))
							allLayers[i].setOpacity(allLayers[i].metadata.preferredOpacity);
						else
							allLayers[i].setOpacity(this.DEFAULT_OVERLAY_OPACITY);
						if(activeLayerNames.length > 2){
							this.map.setLayerZIndex(allLayers[i],nLayers-j);
						}
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
				
				// Reset z-index?  (assume it is an overlay)
				//this.map.setLayerZIndex(allLayers[i], 1); 	
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


