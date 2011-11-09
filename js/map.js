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
	            new OpenLayers.Control.Attribution(),                
                new OpenLayers.Control.LayerSwitcher({'ascending':false}),
                new OpenLayers.Control.Permalink(),
                new OpenLayers.Control.ScaleLine(),
                new OpenLayers.Control.Permalink('permalink'),
                //new OpenLayers.Control.MousePosition(),
                new OpenLayers.Control.OverviewMap()
                
	        ],
	        layers: [
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
        	
        	// this.map.addControl(new OpenLayers.Control.PanZoomBar());
        }
        
        // Enables a zoom box by shift-clicking;  
        // TODO: note that it is apparently already enabled when the "Navigation" control is added
        if (this.isSelectable)
        {
        	this.map.addControl(new OpenLayers.Control.ZoomBox());
        }
        
        
        this.map.setCenter(
            new OpenLayers.LonLat(-71.147, 42.472).transform(
                new OpenLayers.Projection("EPSG:4326"),
                this.map.getProjectionObject()
            ), 12);
            
        
        // TODO: Parse bounding box string and apply to map
        // bbox is getting passed alright, extents are not being set properly;  
        // something is wrong with projection - annotated box draws fine on Bing maps, not on OSM
        // wait for real map data and configure proper extents, etc
        
        var extent = new OpenLayers.Bounds.fromString(this.bbox, false).transform(
                new OpenLayers.Projection("EPSG:4326"),
                this.map.getProjectionObject()); 
        this.map.zoomToExtent(extent, true);
        
        
        // !!! speaking a different language.  This shows up as a small box off the coast of africa
        // will probably have to reproject coordinates as done above for setting map center.
         //(-45,-45, 0, 45).transform(
         var bounds = new OpenLayers.Bounds(-180, -85, 180, 85).transform(
                new OpenLayers.Projection("EPSG:4326"),
                this.map.getProjectionObject()); 
         //this.map.zoomToExtent(bounds);
        var boxes = new OpenLayers.Layer.Boxes("boxes");
	    var box = new OpenLayers.Marker.Box(bounds);
    	boxes.addMarker(box);
    	this.map.addLayer(boxes);
    	
    	//this.map.zoomToExtent(bounds, true);
        
        

        
      
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
  // Content
};

/**
  * Gets the currently visible extent [containerId]=w,s,e,n
  *
  * @this {map}
  * @returns {String} [containerId]=w,s,e,n represents the current visible extent of the map
  *
*/
SOTE.widget.Map.prototype.getValue = function(){
  // Content
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
  // Content
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
  // Content
};

/**
  * Validates that the w,s,e,n coordinates are not null, both lat coordinates (n,s) are between -90,90, and both
  * lon coordinates (w,e) are between -180,180
  * 
  * @this {map}
  * @returns {boolean} true or false depending on whether the selected option(s) meet the validation criteria
*/
SOTE.widget.Map.prototype.validate = function(){
  // Content
};

/**
  * Sets the data accessor that provides state change instructions given dependencies
  *
  * @this {map}
  * @param {String} datasourceurl is the relative location of the data accessor 
  *
*/
SOTE.widget.Map.prototype.setDataSourceUrl = function(datasourceurl){
  // Content
};

/**
  * Gets the data accessor
  * 
  * @this {map}
  * @returns {String} the relative location of the accessor
  *
*/
SOTE.widget.Map.prototype.getDataSourceUrl = function(){
  // Content
};

/**
  * Sets the status of the component
  *
  * @this {map}
  * @param {String} s the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.Map.prototype.setStatus = function(s){
  // Content
};

/**
  * Gets the status of the component
  *
  * @this {map}
  * @returns {String} the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.Map.prototype.getStatus = function(){
  // Content
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
  // Content
};

