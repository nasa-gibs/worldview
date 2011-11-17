/** SOTE.widget.Map.prototype = new SOTE.widget.Component; */
SOTE.namespace("SOTE.widget.Map");


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

 	if(config.bbox === undefined){
	    config.bbox = "-180, -90, 180, 90";
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
  
  
  	// this.selectionEvent = new YAHOO.util.CustomEvent("SelectionEvent",this);
       
    this.hasControls = config.hasControls;
    this.isSelectable = config.isSelectable;
    this.bbox = config.bbox;
    this.date = config.date;
       
    this.value = "";
	this.register = config.register;
	this.maxWidth = config.maxWidth;
	this.maxHeight = config.maxHeight;
	this.dataSourceUrl = config.dataSourceUrl;
	this.statusStr = "";
	this.disabled = false;
  
  
	// Initialize the map
	this.init();
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
		
		// Init map, include support for mobile devices
        this.map = new OpenLayers.Map({
	        div: this.containerId,
	        theme: null,
	        allOverlays: true,
	        controls: [
                
	        ],
	        layers: [
	        
	        	new OpenLayers.Layer.WMS(
	            	"Terra/MODIS - latest", 
	            	"http://map1.vis.earthdata.nasa.gov/data/wms.cgi", 
	            	{ layers: "TERRA_MODIS", Format: 'image/jpeg' }, 
	            	{'tileSize': new OpenLayers.Size(512,512), buffer: 0,
	            	transitionEffect: 'resize',
	            	projection: "EPSG:4326", numZoomLevels: 9,  maxExtent: new OpenLayers.Bounds(-180,-1350,180,90), 
	            	maxResolution: 0.5625, visibility: false}),
	        
	        	new OpenLayers.Layer.WMS(
	            	"Aqua/MODIS - latest", 
	            	"http://map1.vis.earthdata.nasa.gov/data/wms.cgi", 
	            	{ layers: "AQUA_MODIS", Format: 'image/jpeg' }, 
	            	{'tileSize': new OpenLayers.Size(512,512), buffer: 0,
	            	transitionEffect: 'resize',
	            	projection: "EPSG:4326", numZoomLevels: 9,  maxExtent: new OpenLayers.Bounds(-180,-1350,180,90), 
	            	maxResolution: 0.5625, visibility: true}),	            	
 
	            	
	           	new OpenLayers.Layer.WMS(
	            	"11/12/2011", 
	            	"http://map1.vis.earthdata.nasa.gov/data/wms.cgi", 
	            	{ time: "2011-11-12", layers: "TERRA_MODIS", Format: 'image/jpeg' }, 
	            	{'tileSize': new OpenLayers.Size(512,512), buffer: 0,
	            	transitionEffect: 'resize',
	            	projection: "EPSG:4326", numZoomLevels: 9,  maxExtent: new OpenLayers.Bounds(-180,-1350,180,90), 
	            	maxResolution: 0.5625, visibility: false}),
	            	
	           	new OpenLayers.Layer.WMS(
	            	"11/11/2011", 
	            	"http://map1.vis.earthdata.nasa.gov/data/wms.cgi", 
	            	{ time: "2011-11-11", layers: "TERRA_MODIS", Format: 'image/jpeg' }, 
	            	{'tileSize': new OpenLayers.Size(512,512), buffer: 0,
	            	transitionEffect: 'resize',
	            	projection: "EPSG:4326", numZoomLevels: 9,  maxExtent: new OpenLayers.Bounds(-180,-1350,180,90), 
	            	maxResolution: 0.5625, visibility: false}),

	           	new OpenLayers.Layer.WMS(
	            	"11/10/2011", 
	            	"http://map1.vis.earthdata.nasa.gov/data/wms.cgi", 
	            	{ time: "2011-11-10", layers: "TERRA_MODIS", Format: 'image/jpeg' }, 
	            	{'tileSize': new OpenLayers.Size(512,512), buffer: 0,
	            	transitionEffect: 'resize',
	            	projection: "EPSG:4326", numZoomLevels: 9,  maxExtent: new OpenLayers.Bounds(-180,-1350,180,90), 
	            	maxResolution: 0.5625, visibility: false}),

	           	new OpenLayers.Layer.WMS(
	            	"11/09/2011", 
	            	"http://map1.vis.earthdata.nasa.gov/data/wms.cgi", 
	            	{ time: "2011-11-09", layers: "TERRA_MODIS", Format: 'image/jpeg' }, 
	            	{'tileSize': new OpenLayers.Size(512,512), buffer: 0,
	            	transitionEffect: 'resize',
	            	projection: "EPSG:4326", numZoomLevels: 9,  maxExtent: new OpenLayers.Bounds(-180,-1350,180,90), 
	            	maxResolution: 0.5625, visibility: false}),
	            	
	           	new OpenLayers.Layer.WMS(
	            	"11/08/2011", 
	            	"http://map1.vis.earthdata.nasa.gov/data/wms.cgi", 
	            	{ time: "2011-11-08", layers: "TERRA_MODIS", Format: 'image/jpeg' }, 
	            	{'tileSize': new OpenLayers.Size(512,512), buffer: 0,
	            	transitionEffect: 'resize',
	            	projection: "EPSG:4326", numZoomLevels: 9,  maxExtent: new OpenLayers.Bounds(-180,-1350,180,90), 
	            	maxResolution: 0.5625, visibility: false})            	


	        
	        
	            // new OpenLayers.Layer.OSM("OpenStreetMap", null, {
	                // transitionEffect: 'resize',
	                // sphericalMercator: true,
	                // visibility: false
	            // })
	            
	           
 
	        ],
	        //center: new OpenLayers.LonLat(742000, 5861000),
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
        	this.map.addControl(new OpenLayers.Control.LayerSwitcher({displayClass: 'olControlLayerSwitcher', 'ascending':false}));
        	this.map.addControl(new OpenLayers.Control.Permalink({displayClass: 'olControlPermalink'}));
            //this.map.addControl(new OpenLayers.Control.OverviewMap());
        	
        	// While these aren't controls, per se, they are extra decorations
			this.map.addControl(new OpenLayers.Control.Attribution());
			this.map.addControl(new OpenLayers.Control.ScaleLine({displayClass: 'olControlScaleLine'}));
			
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
        
        
        // Parse bounding box string and apply to map
        // Need to convert from lat/lon to map's native coord system
        var extent = new OpenLayers.Bounds.fromString(this.bbox, false).transform(
                new OpenLayers.Projection("EPSG:4326"),
                this.map.getProjectionObject()); 
                
                
        if (extent == null)
        {
        	alert("passed-in bounds invalid for some reason")
        	
        }
        // else
        	// this.map.zoomToExtent(extent, true);
        
        
        
        // Set selected date to be active - do this by deselecting everything else
        // if (this.map.layers.length > 0)
        // {
        	// // Iterate through all layers
        	// for (var i=0; i<this.map.layers.length; i++)
        	// {
        		// // Check if current layer is of selected date
        		// if (this.map.layers[i].name == this.date)
				// {        		
        			// this.map.layers[i].setVisibility(true);
        			// alert("found name match: "+this.map.layers[i].name);
        		// }
        		// else
        			// this.map.layers[i].setVisibility(false);
//         		
        	// }
        // }
        
		var selectedLayer = this.map.getLayersByName(this.date);
		if ((selectedLayer != null) && (selectedLayer.length > 0))
		{
			// this.map.setBaseLayer(selectedLayer[0]);
			selectedLayer[0].setVisibility(true);
		}
};



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

	// Retrieve current extent
	var extent = this.map.getExtent();
	
	// Check for invalid response, return 0s if necessary
	if (extent == null)
		return "0, 0, 0, 0";  
	
	// Otherwise object is valid, convert to lat/lon and return as string
	return extent.transform(
			this.map.getProjectionObject(),
            new OpenLayers.Projection("EPSG:4326")).toString();
};

/**
 * Gets number of time steps currently stored by map
 * 
 * @returns {int} number of time steps
 */
SOTE.widget.Map.prototype.getNumTimeSteps = function(){
	
	// TODO: fix this hack by actually computing number of time steps
	return this.map.layers.length;
}

/**
 * Sets a given layer to be visible or hidden
 * 
 * @param {int} layer number to modify
 * @param {boolean} true to set visible, false to hide
 */
SOTE.widget.Map.prototype.setLayerVisibility = function(layerNum, visible)
{
	if ((layerNum > this.map.layers.length) ||
		(layerNum < 0))
		return;
		
	this.map.layers[layerNum].setVisibility(visible);
}

/**
 * Sets fractional opacity for a given layer
 * 
 * @param {int} layer number to modify
 * @param {float} opacity value between 0 and 1
 */
SOTE.widget.Map.prototype.setLayerOpacity = function(layerNum, opacity)
{
	if ((layerNum > this.map.layers.length) ||
		(layerNum < 0))
		return;
		
	this.map.layers[layerNum].setOpacity(opacity);
}

/**
 * Registers a user-specified function to be called back after a user is done panning or zooming
 * 
 * @param {function} function to be registered
 * @param {context} context of function
 */
SOTE.widget.Map.prototype.addPanZoomEndCallback = function(func, context)
{
	// Set up callbacks for pan/zoom end
	// TODO: register this to an internal function and call a "fire" event to 
	this.map.events.register("moveend", context, func);
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
    var extent = new OpenLayers.Bounds.fromString(extent, false).transform(
            new OpenLayers.Projection("EPSG:4326"),
            this.map.getProjectionObject());

	if (extent == null)
	{
		this.setStatus("Could not set extent");
		return false;
	}           
  
 	// else
    this.map.zoomToExtent(extent, true);
    return true;
};


/**
 * Fires an event in the registry when the component value is changed
 * 
 * @author T. Joshi 
 */
SOTE.widget.Map.prototype.fire = function(){
 
    this.selectionEvent.fire();
    if(this.register === true){
        if(REGISTRY){
		    REGISTRY.fire(this);
        }
        else{
		    alert("no REGISTRY so no event REGISTRY event to fire");
        }
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
Map.prototype.updateComponent = function(qs){
    if(this.dataSourceUrl === null){
	alert("There is no external data source url specified.  Cannot update component!");
        return false;
    }
    var dataSourceUrl = this.dataSourceUrl + "?" + qs;
    this.setStatus("Updating data map based on data changes ... ",true);
    // YAHOO.util.Connect.asyncRequest('GET', dataSourceUrl,
    // { 
	// success:SANDBOX.widget.BoundingBoxPicker.fetchDataSuccessHandler,
	// failure:SANDBOX.widget.BoundingBoxPicker.fetchDataFailureHandler,
	// argument: {self:this,format:"xml"}
    // } );

 
};
