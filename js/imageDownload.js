SOTE.namespace("SOTE.widget.ImageDownload");

/**
  * Instantiate the imageDownload object
  *
  * @class The ImageDownload object that provides a UI to users for image download.
  *        Provides a list of available resolutions, image formats, along with calculated image dimensions and size per users' area selection.
  * @constructor
  * @this {imageDownload}
  * @param {String} containerId is the container id of the div in which to render the object 
  * @param {Object} [config] is a hash allowing configuration of this component
  * @augments SOTE.widget.Component
  * 
*/
SOTE.widget.ImageDownload = function(containerId, config){
	this.container=document.getElementById(containerId);	
	this.coords = null;
	this.RESOLUTIONS_ON_SCREEN_GEO_ALL =  
		[0.5625, 0.28125, 0.140625,
		 0.0703125, 0.03515625, 0.017578125,
		 0.0087890625, 0.00439453125, 0.002197265625];
		 
	this.RESOLUTIONS_ON_SERVER_GEO_250m =  
		[0.5625, 0.28125, 0.140625,
		 0.0703125, 0.03515625, 0.017578125,
		 0.0087890625, 0.00439453125, 0.002197265625];
	
	
	if (this.container==null){
		this.setStatus("Error: element '"+containerId+"' not found!",true);
		return;
	}
	
	if(config===undefined) {
		 config={};
	}
	
	this.id = containerId;
	this.map = null;
	this.WMTSLayer = null;
	
    if (config.baselayer === undefined)
  	{
  		config.baselayer = null;
  	}
  	this.baseLayer = config.baselayer;	
	this.value = "";
	this.init();
};

SOTE.widget.ImageDownload.prototype = new SOTE.widget.Component;


/**
  * Initialize a map object in Lat/Long projection, and add a "fake" layer to compute the map math.
  * Display the HTML UI with UI options.   * 
  * @this {Download}
  * @requires SOTE.widget.Map
*/
SOTE.widget.ImageDownload.prototype.init = function(){
	this.container.setAttribute("class","imagedownload");
	
    if(REGISTRY){
 		REGISTRY.register(this.id,this);
 		REGISTRY.markComponentReady(this.id);
	}
	else{
		alert("No REGISTRY found!  Cannot register Download!");
	}

	this.projectionSwitch = "geographic";
    this.map = new OpenLayers.Map({
		        div: "dlMap",
		        theme: null,
		        controls: [],
		        maxExtent: new OpenLayers.Bounds(-180,-90,180,90),
		        projection:"EPSG:4326",
		        numZoomLevels:9, 
		        fractionalZoom: false,
		        resolutions: this.RESOLUTIONS_ON_SCREEN_GEO_ALL,
		        allOverlays: false,
		        zoom: 2
		    });
   
    
   
       this.WMTSLayer =  new OpenLayers.Layer.WMTS(
			    {
			        name: "dl",
			        url: "http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi",
			        layer: "Download",
			        matrixSet: "EPSG4326_250m",
			        projection: "EPSG:4326",
			        serverResolutions: this.RESOLUTIONS_ON_SERVER_GEO_250m,
			    	visibility: false,
					'tileSize': new OpenLayers.Size(512, 512),
					maxExtent: new OpenLayers.Bounds(-180,-90,180,90),
					style: "_null",
			        isBaseLayer: true
			    }
			    
			    );
			
			
			this.map.addLayer(this.WMTSLayer); 
			
		
	var htmlElements = "<center>Resolution:<select id='selImgResolution'><option value='1'>250m</option><option value='2'>500m</option><option value='4'>1km</option><option value='20'>5km</option><option value='40'>10km</option></select> | ";
    htmlElements +="Format: <select id='selImgFormat'><option value='JPEG'>JPEG</option><option value='PNG'>PNG</option><option value='Gtiff'>GeoTIFF</option></select>  | ";
    htmlElements += "<input type='button' id='btnImgDownload' value='Download'/>"; 
    htmlElements +="<br>Estimated Uncompressed Image Size: ~ <span id='imgFileSize'> </span> MB (<span id='imgWidth''></span> x <span id='imgHeight'></span> pixels) <br>(Max. allowed uncompressed image size: 250 MB) ";
	htmlElements +="<br><hr width='50%'/><font size='-1'>[Click on the camera icon to exit the download model.]</font></center>";
	
    $("#"+this.id).html(htmlElements); 	
    	
    
};



/**
  * Sets the passed HTML string as the component's value
  *
  * @this {Download}
  * @param {String} value is the URL for download image
  *
*/
SOTE.widget.ImageDownload.prototype.setValue = function(value){
	
	this.value=value;
	
};

/**
  * Gets the currently HTML value of the component.
  *
  * @this {Download}
  * @returns {String} a string representing the currently configured download URL
  *
*/
SOTE.widget.ImageDownload.prototype.getValue = function(){
	return this.id+"="+this.value;
};

/**
  * Modify the component based on dependencies. Speficially, update the image dimensions and image size based on the size of rubberband box the user draws.  * 
  * @this {Download}
  * @param {String} querystring contains all values of dependencies (from registry)
  *  
*/


SOTE.widget.ImageDownload.prototype.updateComponent = function(qs){
	
	var bbox = SOTE.util.extractFromQuery('map',qs);
	var time = SOTE.util.extractFromQuery('time',qs);
	var pixels = SOTE.util.extractFromQuery('rubberband', qs);
  	var s = SOTE.util.extractFromQuery('switch',qs);
  	var products = SOTE.util.extractFromQuery('products',qs);
  	
  	
  	var px = pixels.split(",");
	var x1 = px[0]; var y1= px[1]; var x2 = px[2]; var y2=px[3];
	this.map.zoomToExtent(new OpenLayers.Bounds.fromString(bbox));
	
  	var currExtent = this.map.getExtent();
   	var lonlat1 = this.map.getLonLatFromViewPortPx(new OpenLayers.Pixel(x1, y2));
   	var lonlat2 = this.map.getLonLatFromViewPortPx(new OpenLayers.Pixel(x2, y1));
 
     
     var dlURL  = "http://map2.vis.earthdata.nasa.gov/data/download.php?"; 
     
  	 
  	 var dTime = new Date((time.split("T"))[0]+"T00:00:00");
  	 
  	 //Julian date, padded with two zeros (to ensure the julian date is always in DDD format).
  	 var jDate = "00" + (1+Math.ceil((dTime - new Date(dTime.getFullYear(),0,1)) / 86400000));
  	 dlURL += "TIME="+dTime.getFullYear()+(jDate).substr((jDate.length)-3);
  	 
  	
  	 dlURL += "&extent="+lonlat1.lon+"+"+lonlat1.lat+"+"+lonlat2.lon+"+"+lonlat2.lat;	
  	 dlURL += "&LAYERS="+ (((((products).replace("baselayers.","")).replace("overlays.","")).replace(/~/g,"+")).replace(/\./g,"+"));
  	 
  	
  	
  	 //$("#"+this.id).html($("#"+this.id).html());
	 
     var imgWidth=0; var imgHeight=0;
	    
	 $("select#selImgResolution").change(function () {
         	    imgRes =  $("#selImgResolution option:selected").val(); 
                imgWidth =  Math.round((Math.abs(lonlat2.lon - lonlat1.lon) / 0.002197) / Number(imgRes));
				imgHeight = Math.round((Math.abs(lonlat2.lat - lonlat1.lat) / 0.002197) / Number(imgRes)); 
	 		    imgFilesize =  ((imgWidth * imgHeight * 24) / 8388608).toFixed(2);

    	$("#imgWidth").text((imgWidth));
    	$("#imgHeight").text((imgHeight));
		$("#imgFileSize").text(imgFilesize);
		if(imgFilesize>250)	{ $("#imgFileSize").css("color", "red");  $("#btnImgDownload").attr("disabled", "disabled"); }
		else { $("#imgFileSize").css("color", "black"); $("#btnImgDownload").removeAttr("disabled"); }
		})
     .change();
     
      $("#btnImgDownload").unbind('click').click(function(){
      	 window.open(dlURL+"&format="+$("#selImgFormat option:selected").val()+"&size="+$("#imgWidth").text()+"+"+$("#imgHeight").text(),"_blank");
         //alert(dlURL+"&format="+$("#selImgFormat option:selected").val()+"&size="+$("#imgWidth").text()+"+"+$("#imgHeight").text());
      });
     
     this.setValue(dlURL);
 	
};



/**
  * Sets the URL from the querystring
  * 
  * @this {Download}
  * @param {String} qs contains the querystring (must contain [containerId]=[selectedDate] in the string)
  * @returns {boolean} true or false depending on if the extracted date validates
  *
*/
SOTE.widget.ImageDownload.prototype.loadFromQuery = function(qs){
	return this.setValue(SOTE.util.extractFromQuery(this.id,qs));
};

/**
  * Validates that the selected URL is valid 
  * @this {Download}
  * @returns {boolean} true or false depending on whether the date is not null and within bounds
*/
SOTE.widget.ImageDownload.prototype.validate = function(){
  // Content
};

/**
  * Sets the  accessor that provides state change instructions given dependencies
  *
  * @this {Download}
  * @param {String} sourceurl is the relative location of the  accessor 
  *
*/
SOTE.widget.ImageDownload.prototype.setSourceUrl = function(sourceurl){
  // Content
};

/**
  * Gets the  accessor
  * 
  * @this {Download}
  * @returns {String} the relative location of the accessor
  *
*/
SOTE.widget.ImageDownload.prototype.getSourceUrl = function(){
  // Content
};

/**
  * Sets the status of the component
  *
  * @this {Download}
  * @param {String} s the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.ImageDownload.prototype.setStatus = function(s){
	// Content
};

/**
  * Gets the status of the component
  *
  * @this {Download}
  * @returns {String} the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.ImageDownload.prototype.getStatus = function(){
  // Content
};



