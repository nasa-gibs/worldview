SOTE.namespace("SOTE.widget.ImageDownload");

/**
  * The ImageDownload object that provides a UI to users for image download.
  *        Provides a list of available resolutions, image formats, along with calculated image dimensions and size per users' area selection.
  *
  * @module SOTE.widget
  * @class ImageDownload
  * @constructor
  * @this {imageDownload}
  * @param {String} containerId is the container id of the div in which to render the object
  * @param {Object} [config] is a hash allowing configuration of this component
  * @augments SOTE.widget.Component
  *
*/
SOTE.widget.ImageDownload = function(containerId, config){
    this.BASE_URL = "http://map2.vis.earthdata.nasa.gov/imagegen/index";
    this.log = Logging.getLogger("Worldview.ImageDownload");

	this.container=document.getElementById(containerId);

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


    if (config.baselayer === undefined)
  	{
  		config.baselayer = null;
  	}
  	this.baseLayer = config.baselayer;
  	this.config = config.config;
	this.value = "";

	if ( this.config.parameters.imagegen ) {
	    this.log.warn("Redirecting image download to: " + this.BASE_URL +
	           "-" + this.config.parameters.imagegen + ".php");
	}
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

	var htmlElements = "<div>Resolution (per pixel): <select id='selImgResolution'><option value='1'>250m</option><option value='2'>500m</option><option value='4'>1km</option><option value='20'>5km</option><option value='40'>10km</option></select>";
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
	    var query = wv.util.fromQueryString(qs);
	    var bbox = query.map || "";
	    var time = query.time || "";
	    var pixels = query.camera || "";
	    var s = query["switch"] || "";
	    var products = query.products || "";
	    var epsg = query.epsg || "";

      	//console.log("EPSG: " + epsg);

     	var px = pixels.split(",");
    	var x1 = px[0]; var y1= px[1]; var x2 = px[2]; var y2=px[3];
      	var lonlat1 = this.m.maps.map.getLonLatFromViewPortPx(new OpenLayers.Pixel(Math.floor(x1), Math.floor(y2)));
       	var lonlat2 = this.m.maps.map.getLonLatFromViewPortPx(new OpenLayers.Pixel(Math.floor(x2), Math.floor(y1)));

        var dlURL = null;
        var imagegen = this.config.parameters.imagegen;
        if ( imagegen ) {
            dlURL = this.BASE_URL + "-" + imagegen + ".php?";
        } else {
            dlURL= this.BASE_URL + ".php?";
        }

        var conversionFactor = 256;
        if (s=="geographic") {
        	if( !(0 != $('#selImgFormat option[value=KMZ]').length)) {
        		$('#selImgFormat').append( $('<option></option>').val("KMZ").text("KMZ"));
        	}
        	conversionFactor = 0.002197;
        }
        else { //polar
       	 if( 0 != $('#selImgFormat option[value=KMZ]').length) {
        		$('#selImgFormat option[value=KMZ]').remove();
        	}
        }
      	 var dTime = Date.parseISOString(time).clearUTCTime();
      	 //Julian date, padded with two zeros (to ensure the julian date is always in DDD format).
      	 var jStart = Date.parseISOString(dTime.getUTCFullYear() + "-01-01");
      	 var jDate = "00" + (1+Math.ceil((dTime.getTime() - jStart) / 86400000));
      	 dlURL += "TIME="+dTime.getUTCFullYear()+(jDate).substr((jDate.length)-3);



      	dlURL += "&extent="+lonlat1.lon+","+lonlat1.lat+","+lonlat2.lon+","+lonlat2.lat;

      	//dlURL += "&switch="+s;
      	dlURL += "&epsg="+epsg;
      	dlURL +="&layers=";
      	if (products != ""){
    		var a = products.split("~");

    		//Add the first (top most) visible baselayer.
    		var base = a[0].split(",");
    		//base.reverse(); base.pop();
            for(var i=1; i<base.length; i++){
            	if(base[i].charAt(0)!="!") {
            		dlURL += base[i]+",";
            		break;
    			}
    		}

    		var overlays = a[1].split(/[\.,]/);
  		    overlays.reverse(); overlays.pop();

    		for(var i=0; i<overlays.length; i++){
    			if(overlays[i].charAt(0)!="!") {
    				dlURL+= overlays[i]+",";
    			}
    		}

    	//remove the extra ","
    	dlURL = dlURL.slice(0,-1);

    	}


      	 var imgWidth=0; var imgHeight=0;


    	$("select#selImgResolution").change(function () {
             	    imgRes =  $("#selImgResolution option:selected").val();
                    imgWidth =  Math.round((Math.abs(lonlat2.lon - lonlat1.lon) / conversionFactor) / Number(imgRes));
    				imgHeight = Math.round((Math.abs(lonlat2.lat - lonlat1.lat) / conversionFactor) / Number(imgRes));
    	 		    imgFilesize =  ((   imgWidth * imgHeight * 24) / 8388608).toFixed(2);

        	$("#imgWidth").text((imgWidth));
        	$("#imgHeight").text((imgHeight));
    		$("#imgFileSize").text(imgFilesize);
    		if(imgFilesize>250)	{ $("#imgFileSize").css("color", "#D99694");  $("#btnImgDownload").attr("disabled", "disabled"); }
    		else { $("#imgFileSize").css("color", "white"); $("#btnImgDownload").removeAttr("disabled"); }
    		})
         .change();


          $("#btnImgDownload").unbind('click').click(function(){
           	 ntptEventTag('lc='+encodeURIComponent(dlURL+"&format="+$("#selImgFormat option:selected").val()+"&width="+$("#imgWidth").text()+"&height="+$("#imgHeight").text() ) );
			 window.open(dlURL+"&format="+$("#selImgFormat option:selected").val()+"&width="+$("#imgWidth").text()+"&height="+$("#imgHeight").text(),"_blank");
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



