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
	o.setHeader('Warning');
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
	
	// Parse elements of date and time
	var year = yyyymmdd.split("-")[0];
	var month = eval(yyyymmdd.split("-")[1]-1);
	var day = yyyymmdd.split("-")[2];
	
	var hour = 0;
	var minute = 0;
	var second = 0;
	
    // Use default of midnight if time is not specified	
	if ( dateTimeArr.length > 1 ) {
        var hhmmss = dateTimeArr[1];
    	var hour = hhmmss.split(":")[0];
    	var minute = hhmmss.split(":")[1];
    	var second = hhmmss.split(":")[2];
	}
  	return new Date( year,month,day,hour,minute,second );
}

SOTE.util.getValuesFromISO8601String = function( dateAsString )
{
	var dateTimeArr = dateAsString.split(/T/);

	var yyyymmdd = dateTimeArr[0];
	
	// Parse elements of date and time
	var year = yyyymmdd.split("-")[0];
	var month = eval(yyyymmdd.split("-")[1]-1);
	var day = yyyymmdd.split("-")[2];

    var hour = 0;
    var minute = 0;
    var second = 0;
    
    // Use default of midnight if time is not specified
    if ( dateTimeArr.length > 1 ) {
        var hhmmss = dateTimeArr[1];
        hour = hhmmss.split(":")[0];
        minute = hhmmss.split(":")[1];
        second = hhmmss.split(":")[2];
	}
	
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

