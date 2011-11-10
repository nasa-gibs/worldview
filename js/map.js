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
	
	// TODO: are these necessary?
	if(config.register === undefined){
	    config.register = true;
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
       
    this.value = "";
	this.register = config.register;
	this.maxWidth = config.maxWidth;
	this.maxHeight = config.maxHeight;
	this.dataSourceUrl = config.dataSourceUrl;
	this.statusStr = "";
	this.disabled = false;
	// this.render();
  
  
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
	        controls: [
                
	        ],
	        layers: [
	        	new OpenLayers.Layer.WMS(
	            	"Tiled WMS - Aqua/MODIS", 
	            	"http://map1.vis.earthdata.nasa.gov/data/wms.cgi", 
	            	{ layers: "AQUA_MODIS", Format: 'image/jpeg' }, 
	            	{'tileSize': new OpenLayers.Size(512,512), buffer: 0,
	            	transitionEffect: 'resize',
	            	projection: "EPSG:4326", numZoomLevels: 9,  maxExtent: new OpenLayers.Bounds(-180,-1350,180,90), 
	            	maxResolution: 1.125}),

	        	new OpenLayers.Layer.WMS(
	            	"Tiled WMS - Terra/MODIS", 
	            	"http://map1.vis.earthdata.nasa.gov/data/wms.cgi", 
	            	{ layers: "TERRA_MODIS", Format: 'image/jpeg' }, 
	            	{'tileSize': new OpenLayers.Size(512,512), buffer: 0,
	            	transitionEffect: 'resize',
	            	projection: "EPSG:4326", numZoomLevels: 9,  maxExtent: new OpenLayers.Bounds(-180,-1350,180,90), 
	            	maxResolution: 1.125}),
	        
	        
	            new OpenLayers.Layer.OSM("OpenStreetMap", null, {
	                transitionEffect: 'resize',
	                sphericalMercator: true
	            }),
	            
	             
	            
	            // new OpenLayers.Layer.WMS("NASA WMS Service",
						// "http://onearth.jpl.nasa.gov/wms.cgi?",
 						// {
							// layers: 'global_mosaic'
							// , styles: 'visual'
 						// },
						// {
							// tileSize: new OpenLayers.Size(512,512)
 						// }
				// ),
		         new OpenLayers.Layer.VirtualEarth("Shaded", {
                	 type: VEMapStyle.Shaded,
                	 transitionEffect: 'resize',
                	 sphericalMercator: true
            	 })//,
            	// new OpenLayers.Layer.VirtualEarth("Hybrid", {
                	// type: VEMapStyle.Hybrid,
                	// transitionEffect: 'resize'
            	// }),
            	// new OpenLayers.Layer.VirtualEarth("Aerial", {
                	// type: VEMapStyle.Aerial,
                	// transitionEffect: 'resize'
            	// })

	        ],
	        //center: new OpenLayers.LonLat(742000, 5861000),
	        zoom: 3
	    });
	    
	    
	    //var aquaLayerOpts = { projection: "EPSG:4326", numZoomLevels: 9,  maxExtent: new OpenLayers.Bounds(-180,-90,180,90) };
	       
	    //aquaLayer.setIsBaseLayer(true);
	    //aquaLayer.addOptions(aquaLayerOpts);
	
	    //this.map.addLayer(aquaLayer);
        

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
        	this.map.addControl(new OpenLayers.Control.LayerSwitcher({'ascending':false}));
        	this.map.addControl(new OpenLayers.Control.Permalink('permalink'));
            this.map.addControl(new OpenLayers.Control.OverviewMap());
        	
        	// While these aren't controls, per se, they are extra decorations
			this.map.addControl(new OpenLayers.Control.Attribution());
			this.map.addControl(new OpenLayers.Control.ScaleLine());
			

        	
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
        this.map.zoomToExtent(extent, true);
        
        
        // Test code to show a "box" overlay at a given set of coords
         // var bounds = new OpenLayers.Bounds(-180, -85, 180, 85).transform(
                // new OpenLayers.Projection("EPSG:4326"),
                // this.map.getProjectionObject()); 
        // var boxes = new OpenLayers.Layer.Boxes("boxes");
	    // var box = new OpenLayers.Marker.Box(bounds);
    	// boxes.addMarker(box);
    	// this.map.addLayer(boxes);
        
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
  * Change the base layers based on dependencies (i.e. extent, date, data product)
  * 
  * @this {map}
  * @param {String} querystring contains all values of dependencies (from registry)
  * @returns {boolean} true or false depending on if the component still validates with the new criteria
  * 
*/
SOTE.widget.Map.prototype.updateComponent = function(querystring){
  // TODO: Content
};

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
		return false;
	
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
		return false;
		
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
    this.map.zoomToExtent(extent, true);
    
    // TODO: validate extent?
    return true;
};

