SOTE.namespace("SOTE.util");

/**
 * Namespace: SOTE.util
 * 
 * Utility functions.
 */

/**
 * Function: extractFromQuery
 * 
 * Extracts the value of the given key from the querystring.
 * 
 * Parameters:
 * key - Item to be extracted
 * qa  - Query string to extract from
 * 
 * Returns:
 * The value associated with the given key in the querystring
 */
SOTE.util.extractFromQuery = function(key,qs){
	//if (default_==null) default_="";
	//key = key.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regex = new RegExp("[\\?&#]*"+key+"=([^&#]*)");
	var val = regex.exec(qs);
	if(val == null)
    	return "";
	else
		return val[1];
};

SOTE.util.throwError = function(errorTextHTML){
	o = new YAHOO.widget.Panel("WVerror", {width:"300px", zIndex:1020, visible:false } );
	o.setHeader('&nbsp;&nbsp;&nbsp;&nbsp;Warning');
	o.setBody(errorTextHTML);
	o.render(document.body);
	o.show();
	o.center();
	o.hideEvent.subscribe(function(i) {
    	setTimeout(function() {o.destroy();}, 25);
	});

};

/**
  * Generates a request to the server and forwards the response to the success/failure callback
  * Usage: SOTE.util.getJSON(<url>,<args to pass through>,<success callback>,<failure callback>);
  * 
  * @param {String,Object,Function,Function} url is the url to send the request, args are the arguments to pass to callback, success is the callback on a successful request, failure is the callback on a failed request
  * 
*/
SOTE.util.getJSON = function(url, args, success, failure){
	var successHandler = function(data,status,xhr) { return success(data,status,xhr,args); };
	var failureHandler = function(xhr,status,error) { return failure(xhr,status,error,args); };
	
	$.ajax({
	    url: url,
	    dataType: 'json',
	    success: successHandler,
	    error: failureHandler
	});
}


/**
 * Function to add leading zeros to a number, if necessary
 * 
 * @param num 		number to pad
 * @param places	number of 0s to add
 * 
 * @returns formatted number as a string
 */
SOTE.util.zeroPad = function(num, places) {
  var zero = places - num.toString().length + 1;
  return Array(+(zero > 0 && zero)).join("0") + num;
}


/**
 * Returns a JS Date Object given an ISO8601 formatted UTC datetime string
 * 
 * @param {String} dateAsString is the UTC datetime string in ISO8601 format
 * 
 * @returns {Date} New date instantiated from string
 */
SOTE.util.UTCDateFromISO8601String = function( dateAsString )
{
	var dateTimeArr = dateAsString.split(/T/);

	var yyyymmdd = dateTimeArr[0];
	var hhmmss = dateTimeArr[1];
	
	// Parse elements of date and time
	var year = yyyymmdd.split("-")[0];
	var month = eval(yyyymmdd.split("-")[1]-1);
	var day = yyyymmdd.split("-")[2];
	var hour = hhmmss.split(":")[0];
	var minute = hhmmss.split(":")[1];
	var second = hhmmss.split(":")[2];
	
  	return new Date( year,month,day,hour,minute,second );
}

SOTE.util.getValuesFromISO8601String = function( dateAsString )
{
	var dateTimeArr = dateAsString.split(/T/);

	var yyyymmdd = dateTimeArr[0];
	var hhmmss = dateTimeArr[1];
	
	// Parse elements of date and time
	var year = yyyymmdd.split("-")[0];
	var month = eval(yyyymmdd.split("-")[1]-1);
	var day = yyyymmdd.split("-")[2];
	var hour = hhmmss.split(":")[0];
	var minute = hhmmss.split(":")[1];
	var second = hhmmss.split(":")[2];
	
  	return [year,month,day,hour,minute,second];
}

SOTE.util.ISO8601StringFromDate = function( d )
{
	var timeString = d.getFullYear() + "-" + SOTE.util.zeroPad(eval(d.getMonth()+1),2) + "-" + 
		SOTE.util.zeroPad(d.getDate(),2) + "T" + SOTE.util.zeroPad(d.getHours(),2) + ":" + 
		SOTE.util.zeroPad(d.getMinutes(),2) + ":" + SOTE.util.zeroPad(d.getSeconds(),2);
	return timeString;
}

/**
 * Returns the name of the integer day of week specified
 * 
 * @param	an integer value from 0-6;  0=Sunday, 1=Monday, etc
 * @returns	the name of the specified day of week 
 */
SOTE.util.DayNameFromUTCDayInt = function(dayOfWeekInt)
{
	switch (dayOfWeekInt)
	{
		case 0:
			return "Sunday";
		case 1:
			return "Monday";
		case 2:
			return "Tuesday";
		case 3:
			return "Wednesday";
		case 4:
			return "Thursday";
		case 5:
			return "Friday";
		case 6:
			return "Saturday";
		default:
			return "Invalid";
	}
	
}

/**
 * Function: clamp
 * 
 * Ensures a value is between an minimum and a maximum.
 * 
 * Parameters:
 * min - Lower bound of the clamp range
 * max - Upper bound of the clamp range
 * 
 * Returns:
 * min if the value is below min, max if the value is above max,             
 * othewise returns value
 * 
 * Throws:      
 * If min is greater than max
 */
SOTE.util.clamp = function(min, max, value) {
    if ( min > max ) {
        throw "Invalid clamp range (" + min + " - " + max + ")";
    }
    if ( value < min ) { return min; }
    if ( value > max ) { return max; }
    return value;
}

/**
 * Function: clampIndex
 * 
 * Clamps a value to a valid array index.
 * 
 * Parameters:
 * array - Clamp the index to this array
 * index - Index value
 * 
 * Returns:
 * Zero if the index is below zero, array.length - 1 if the index is greater 
 * than the maximum array index, otherwise returns index.
 */
SOTE.util.clampIndex = function(array, index) {
    return SOTE.util.clamp(0, array.length - 1, index);
}

/**
 * Function: rgb2hsv
 * 
 * Converts an RGB color value to HSV. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and v in the set [0, 1].
 *
 * See Also:
 * http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
 * 
 * Parameters:
 * r - The red color value
 * g - The green color value
 * b - The blue color value
 * 
 * Returns:
 * The HSV representation as an object with h, s, and v attributes.
 *
 * Example:
 * 
 * (begin code)
 * >>> SOTE.util.rgbToHsv(20, 40, 60);
 * Object { h=0.5833333333333334, s=0.6666666666666666, v=0.23529411764705882}
 * (end code)
 */
SOTE.util.rgb2hsv= function(r, g, b){
    r = r/255, g = g/255, b = b/255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, v = max;

    var d = max - min;
    s = max == 0 ? 0 : d / max;

    if(max == min){
        h = 0; // achromatic
    }else{
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return {h: h, s: s, v: v};
}

/**
 * Function: hsv2rgb
 * 
 * Converts an HSV color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes h, s, and v are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * See Also:
 * http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
 * 
 * Parameters:
 * h - The hue
 * s - The saturation
 * v - The value
 * 
 * Returns:
 * The RGB representation as an object with r, g, and b attributes.
 * 
 * Example:
 * 
 * (begin code)
 * >>> SOTE.util.hsvToRgb(0.5833333333333334, 0.6666666666666666, 0.23529411764705882)
 * Object { r=20, g=40, b=60}
 * (end code)
 */
SOTE.util.hsv2rgb = function(h, s, v){
    var r, g, b;

    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    switch(i % 6){
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }

    return { 
        r: Math.round(r * 255), 
        g: Math.round(g * 255), 
        b: Math.round(b * 255)
    };
}



/**
 * Generates an array of OpenLayers layers for the specified product: one for each
 * day starting from the current day, working backwards for a total of numDays.
 * If the passed-in "product" doesn't match the "displayNameStr", the function
 * returns an empty array.
 * 
 * 
 * @param product				the product as specified from the querystring
 * @param displayNameStr		name shown in OL layer list;  mostly for debugging at this point
 * @param wmsProductNameStr		the product name recognized by the WMS server
 * @param formatStr				the type of image format expected in return, e.g., "image/jpeg"
 * @param urlsArr				an array containing a set of URLs to the WMS;  multiple array entries can be provided to allow more parallel access to WMS server
 * @param tileSizeArr			a 2-entry integer array containing the tile dimensions in pixels
 * @param projectionStr			string containing the projection, e.g., "EPSG:4326"
 * @param numZoomLevelsInt		number of zoom levels contained in the data
 * @param maxExtentArr			a 4-entry array containing the max extent of the layer
 * @param maxResolutionFloat	max resolution of the data (degrees/pixel)
 * @param preferredOpacity		preferred opacity for this layer [0.0, 1.0]
 * @param numDays				number of days to generate;  i.e., a value of 3 would generate today, yesterday, and two days ago
 * @param screenResolutionsArr	an array of screen resolutions that this layer should support
 * @param serverResolutionsArr	an array of resolutions that are available for this layer on the server
 * 
 * @returns		if querystring product matches displayNameStr, returns an array whose elements contain a single day of the specified product
 * 
 */
SOTE.util.generateProductLayersForDateRange = function(product, displayNameStr, wmsProductNameStr, formatStr, urlsArr, tileSizeArr, projectionStr, numZoomLevelsInt, maxExtentArr, maxResolutionFloat, preferredOpacityFloat, numDays, screenResolutionsArr, serverResolutionsArr)
{
	// Check if these layers should be generated
	if (product != displayNameStr)
		return [];

	// Get current date
	var curDate = new Date();
	
	// Generate layer for each day
	var returnArr = new Array(numDays);
	for (var i=0; i<numDays; i++)
	{		
		// Generate YYYY-MM-DD string
	  	var dateStr = curDate.getUTCFullYear() + "-" + SOTE.util.zeroPad(eval(curDate.getUTCMonth()+1),2) + "-" + 
			SOTE.util.zeroPad(curDate.getUTCDate(),2);
		
		// Generate layer entry
		returnArr[i] = {displayName: (displayNameStr + "__" + dateStr), wmsProductName: wmsProductNameStr, 
			time: dateStr, format: formatStr, urls: urlsArr, tileSize: tileSizeArr, projection: projectionStr, 
			numZoomLevels: numZoomLevelsInt, maxExtent: maxExtentArr, maxResolution: maxResolutionFloat, 
			resolutions: screenResolutionsArr, serverResolutions: serverResolutionsArr,
			preferredOpacity: preferredOpacityFloat }; 
	
		// Compute next date value by subtracting one day (in ms) from currently stored value
		curDate = new Date(curDate - (1000*60*60*24));	
	}
	

	return returnArr;
};


/**
 * Adds WMTS TileMatrixSet to returned array 
 */
SOTE.util.generateProductLayersForDateRangeTMS = function(product, displayNameStr, wmsProductNameStr, formatStr, urlsArr, tileSizeArr, projectionStr, numZoomLevelsInt, maxExtentArr, maxResolutionFloat, preferredOpacityFloat, numDays, screenResolutionsArr, serverResolutionsArr, tileMatrixSetStr)
{
	// Check if these layers should be generated
	if (product != displayNameStr)
		return [];

	// Get current date
	var curDate = new Date();
	
	// Generate layer for each day
	var returnArr = new Array(numDays);
	for (var i=0; i<numDays; i++)
	{		
		// Generate YYYY-MM-DD string
	  	var dateStr = curDate.getUTCFullYear() + "-" + SOTE.util.zeroPad(eval(curDate.getUTCMonth()+1),2) + "-" + 
			SOTE.util.zeroPad(curDate.getUTCDate(),2);
		
		// Generate layer entry
		returnArr[i] = {displayName: (displayNameStr + "__" + dateStr), wmsProductName: wmsProductNameStr, 
			time: dateStr, format: formatStr, urls: urlsArr, tileSize: tileSizeArr, projection: projectionStr, 
			numZoomLevels: numZoomLevelsInt, maxExtent: maxExtentArr, maxResolution: maxResolutionFloat, 
			resolutions: screenResolutionsArr, serverResolutions: serverResolutionsArr, 
			tileMatrixSet: tileMatrixSetStr, preferredOpacity: preferredOpacityFloat }; 
	
		// Compute next date value by subtracting one day (in ms) from currently stored value
		curDate = new Date(curDate - (1000*60*60*24));	
	}
	

	return returnArr;
};



/**
 * Generates an array of OpenLayers layers for the specified product: one for each
 * day starting from the current day, working backwards for a total of numDays.
 * 
 * "NoOversample" means that if the server doesn't contain imagery for the
 * requested zoom level, no imagery will be displayed
 * 
 * 
 * @param displayNameStr		name shown in OL layer list;  mostly for debugging at this point
 * @param wmsProductNameStr		the product name recognized by the WMS server
 * @param formatStr				the type of image format expected in return, e.g., "image/jpeg"
 * @param urlsArr				an array containing a set of URLs to the WMS;  multiple array entries can be provided to allow more parallel access to WMS server
 * @param tileSizeArr			a 2-entry integer array containing the tile dimensions in pixels
 * @param projectionStr			string containing the projection, e.g., "EPSG:4326"
 * @param numZoomLevelsInt		number of zoom levels contained in the data
 * @param maxExtentArr			a 4-entry array containing the max extent of the layer
 * @param maxResolutionFloat	max resolution of the data (degrees/pixel)
 * @param preferredOpacity		preferred opacity for this layer [0.0, 1.0]
 * @param numDays				number of days to generate;  i.e., a value of 3 would generate today, yesterday, and two days ago
 * 
 * @returns		an array whose elements contain a single day of the specified product
 * 
 */
SOTE.util.generateProductLayersForDateRangeNoOversample = function(displayNameStr, wmsProductNameStr, formatStr, urlsArr, tileSizeArr, projectionStr, numZoomLevelsInt, maxExtentArr, maxResolutionFloat, preferredOpacityFloat, numDays)
{

	// Get current date
	var curDate = new Date();
	
	// Generate layer for each day
	var returnArr = new Array(numDays);
	for (var i=0; i<numDays; i++)
	{		
		// Generate YYYY-MM-DD string
	  	var dateStr = curDate.getUTCFullYear() + "-" + SOTE.util.zeroPad(eval(curDate.getUTCMonth()+1),2) + "-" + 
			SOTE.util.zeroPad(curDate.getUTCDate(),2);
		
		// Generate layer entry
		returnArr[i] = {displayName: (displayNameStr + "__" + dateStr), wmsProductName: wmsProductNameStr, 
			time: dateStr, format: formatStr, urls: urlsArr, tileSize: tileSizeArr, projection: projectionStr, 
			numZoomLevels: numZoomLevelsInt, maxExtent: maxExtentArr, maxResolution: maxResolutionFloat, 
			preferredOpacity: preferredOpacityFloat }; 
	
		// Compute next date value by subtracting one day (in ms) from currently stored value
		curDate = new Date(curDate - (1000*60*60*24));	
	}
	

	return returnArr;
}


/**
 * Generates an array of OpenLayers layers for the specified product: one for each
 * day starting from the current day, working backwards for a total of numDays.
 * If the passed-in "product" doesn't match the "displayNameStr", the function
 * returns an empty array.
 * 
 * This version of the function is for full (i.e., non-tiled) WMS layers 
 * 
 * @param product				the product as specified from the querystring
 * @param displayNameStr		name shown in OL layer list;  mostly for debugging at this point
 * @param wmsProductNameStr		the product name recognized by the WMS server
 * @param formatStr				the type of image format expected in return, e.g., "image/jpeg"
 * @param urlsArr				an array containing a set of URLs to the WMS;  multiple array entries can be provided to allow more parallel access to WMS server
 * @param projectionStr			string containing the projection, e.g., "EPSG:4326"
 * @param preferredOpacity		preferred opacity for this layer [0.0, 1.0]
 * @param singleTile			boolean if WMS single tile flag should be set
 * @param numDays				number of days to generate;  i.e., a value of 3 would generate today, yesterday, and two days ago 
 * 
 * @returns		an array whose elements contain a single day of the specified product
 * 
 */
SOTE.util.generateWmsProductLayersForDateRange = function(product, displayNameStr, wmsProductNameStr, formatStr, urlsArr, projectionStr, preferredOpacityFloat, isSingleTile, numDays)
{
	// Check if these layers should be generated
	if (product != displayNameStr)
		return [];


	// Get current date
	var curDate = new Date();
	
	// Generate layer for each day
	var returnArr = new Array(numDays);
	for (var i=0; i<numDays; i++)
	{		
		// Generate YYYY-MM-DD string
	  	var dateStr = curDate.getUTCFullYear() + "-" + SOTE.util.zeroPad(eval(curDate.getUTCMonth()+1),2) + "-" + 
			SOTE.util.zeroPad(curDate.getUTCDate(),2);
		
		// Generate layer entry
		returnArr[i] = {displayName: (displayNameStr + "__" + dateStr), wmsProductName: wmsProductNameStr, 
			time: dateStr, format: formatStr, urls: urlsArr, projection: projectionStr,
			preferredOpacity: preferredOpacityFloat, singleTile: isSingleTile }; 
	
		// Compute next date value by subtracting one day (in ms) from currently stored value
		curDate = new Date(curDate - (1000*60*60*24));	
	}
	

	return returnArr;
}
