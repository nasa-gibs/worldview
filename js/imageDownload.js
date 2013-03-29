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
	
	this.alignTo = config.alignTo;
	this.id = containerId;
	this.m = config.m;
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
	
	var self = this;
	
	SOTE.widget.ImageDownload.setPosition(this);
	$(window).resize(function() {
		SOTE.widget.ImageDownload.setPosition(self);
	});
	
    if(REGISTRY){ 
 		REGISTRY.register(this.id,this);
 		REGISTRY.markComponentReady(this.id);
	}
	else{
		alert("No REGISTRY found!  Cannot register Download!");
	}

	this.projectionSwitch = "geographic";
		
	var htmlElements = "<div>Resolution:<select id='selImgResolution'><option value='1'>250m</option><option value='2'>500m</option><option value='4'>1km</option><option value='20'>5km</option><option value='40'>10km</option></select>";
    htmlElements +="<br />Format: <select id='selImgFormat'><option value='image/jpeg'>JPEG</option><option value='image/png'>PNG</option><option value='image/geotiff'>GeoTIFF</option></select>";
    htmlElements +="<br />Raw Image Size: ~ <span id='imgFileSize'> </span> MB <br />(<span id='imgWidth''></span> x <span id='imgHeight'></span> pixels)";
    htmlElements += "<br /><span style='font-size:10px; color:#aaa; font-style:italic;'>(Max Size: 250 MB)</span> ";//(<span id='imgWidth''></span> x <span id='imgHeight'></span> pixels) 
    htmlElements += "<br /><input type='button' id='btnImgDownload' value='Download'/>"; 
	htmlElements +="</div>";
	
    $("#"+this.id).html(htmlElements); 	
    	
    
};

SOTE.widget.ImageDownload.setPosition = function(self){
	var offset = $("#"+self.alignTo.id).offset();
	var left = offset.left + parseInt($("#"+self.alignTo.id).css("width")) - parseInt($("#"+self.id).css("width"));
	$("#"+self.id).css("left",left+"px");
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
		
	try {
    	var bbox = SOTE.util.extractFromQuery('map',qs);
    	var time = SOTE.util.extractFromQuery('time',qs);
    	var pixels = SOTE.util.extractFromQuery('camera', qs);
      	var s = SOTE.util.extractFromQuery('switch',qs);
      	var products = SOTE.util.extractFromQuery('products',qs);
              	
      	var px = pixels.split(",");
    	var x1 = px[0]; var y1= px[1]; var x2 = px[2]; var y2=px[3];
    
       	var lonlat1 = this.m.productMap.map.getLonLatFromViewPortPx(new OpenLayers.Pixel(x1, y2));
       	var lonlat2 = this.m.productMap.map.getLonLatFromViewPortPx(new OpenLayers.Pixel(x2, y1));
     
        var dlURL  = "http://map2.vis.earthdata.nasa.gov/imagegen/?"; 
         
         
      	 //var dTime = new Date((time.split(/T/))[0]+"T00:00:00");
      	 var dTime = Date.parseISOString(time).clearUTCTime();
      	 
      	 //Julian date, padded with two zeros (to ensure the julian date is always in DDD format).
      	 var jDate = "00" + (1+Math.ceil((dTime - new Date(dTime.getUTCFullYear(),0,1)) / 86400000));
      	 dlURL += "TIME="+dTime.getUTCFullYear()+(jDate).substr((jDate.length)-3);
      	 
      	
      	 dlURL += "&extent="+lonlat1.lon+","+lonlat1.lat+","+lonlat2.lon+","+lonlat2.lat;
      	
      	 dlURL +="&layers=";
      	//Reverse the order of overlays to get the correct layer ordering.
    	if (products != ""){
    		var a = products.split("~");
    		var base = a[0].split(/[\.,]/);
    		
    		var overlays = a[1].split(/[\.,]/);
    		overlays.reverse(); overlays.pop();
    		for(var i=1; i<base.length; ++i){
    			dlURL += base[i]+",";
    		}
    		for(var i=0; i<overlays.length; i++){
    			dlURL+= overlays[i]+",";
    		}
    		
    	//remove the extra ","
    	dlURL = dlURL.slice(0,-1);
    	
    	}
    	
      	 var imgWidth=0; var imgHeight=0;
    	    
    	 $("select#selImgResolution").change(function () {
             	    imgRes =  $("#selImgResolution option:selected").val(); 
                    imgWidth =  Math.round((Math.abs(lonlat2.lon - lonlat1.lon) / 0.002197) / Number(imgRes));
    				imgHeight = Math.round((Math.abs(lonlat2.lat - lonlat1.lat) / 0.002197) / Number(imgRes)); 
    	 		    imgFilesize =  ((imgWidth * imgHeight * 24) / 8388608).toFixed(2);
    
        	$("#imgWidth").text((imgWidth));
        	$("#imgHeight").text((imgHeight));
    		$("#imgFileSize").text(imgFilesize);
    		if(imgFilesize>250)	{ $("#imgFileSize").css("color", "#D99694");  $("#btnImgDownload").attr("disabled", "disabled"); }
    		else { $("#imgFileSize").css("color", "white"); $("#btnImgDownload").removeAttr("disabled"); }
    		})
         .change();
         
         
          $("#btnImgDownload").unbind('click').click(function(){
          	 window.open(dlURL+"&format="+$("#selImgFormat option:selected").val()+"&width="+$("#imgWidth").text()+"&height="+$("#imgHeight").text(),"_blank");
             //console.log(dlURL+"&format="+$("#selImgFormat option:selected").val()+"&size="+$("#imgWidth").text()+"+"+$("#imgHeight").text());
          });
         
         this.setValue(dlURL);
    } catch ( cause ) { 
        Worldview.error("Unable to update download box", cause);
    }
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



