var Worldview = Worldview || {};
Worldview.Widget = Worldview.Widget || {};


/**
  * A date selection object for a configurable period of days, containing thumnails of a sample data
  *     product image for each day
  *
  * @module SOTE.widget
  * @class MobileDateSpan
  * @constructor
  * @this {dateSpan}
  * @param {String} containerId is the container id of the div in which to render the object
  * @param {Object} [config] is a hash allowing configuration of this component
  * @config {String} [minDate] an ISO8601 formatted date string containing the minimum bound for the dateSpan
  * @config {String} [maxDate] an ISO8601 formatted date string containing the maximum bound for the dateSpan
  * @config {boolean} [hasThumbnail] whether the dateSpan has a thumbnail
  * @config {String} [thumbSource] the address of a script producing thumbnails
  * @config {String} [extent] the extent of the current map (bbox=w,s,e,n)
  * @config {String} [product] the base product for the thumbnails
  * @config {String} [startDate] an ISO8601 formatted date string containing the start date of the dateSpan
  * @config {String} [selectedDate] an ISO8601 formatted date string containing the initially selected date
  * @config {Number} [range] the total number of days displayed to the user
  * @config {String} [anchorId] an HTML Element Id of the object to anchor the dateSpan with
  * @config {boolean} [slideToSelect] whether the selection slider is visible or not
  * @config {boolean} [isExpanded] whether the dateSpan thumbnails should be visible or not
  * @augments SOTE.widget.Component
  *
*/
Worldview.Widget.DateWheels = function(models, config){
    this.log = Logging.getLogger("Worldview.Widget.DateWheels");
    var containerId = "timemds";
	this.container=document.getElementById(containerId);
	if (this.container==null){
		this.setStatus("Error: element '"+containerId+"' not found!",true);
		return;
	}
	this.id = containerId;
	//Store the container's ID
	this.containerId=containerId;
	this.MSEC_TO_MIN = 1000*60;

	//Define an object for holding configuration
	if (config===undefined){
		config={};
	}

	if(config.dataSourceUrl === undefined){
	    config.dataSourceUrl = null;
	}

	if(config.endDate === undefined){
		config.endDate = Worldview.today();
	}
	else{
		config.endDate = new Date(config.endDate);
	}

	if(config.startDate === undefined){
		config.startDate = new Date(Date.UTC(2012, 4, 8, 0, 0, 0));
	}
	else{
		config.startDate = new Date(config.startDate);
	}

	if(config.selected === undefined){
	    config.selected = this.getToday();
	}

	if(config.isCollapsed === undefined){
		config.isCollapsed = false;//(config.thumbSource === null || config.hasThumbnail === false)? true: false;
	}


    this.model = models.date;
    this.startDate = config.startDate;
	this.endDate = config.endDate;
	this.isCollapsed = config.isCollapsed;
	this.value = config.selected;
	this.dataSourceUrl = config.dataSourceUrl;
	this.statusStr = "";
	this.init();

    var self = this;
	this.model.events.on("select", function() {
	    self.value = self.model.selected;
        $("#linkmode").mobiscroll('setDate',self.UTCToLocal(self.model.selected),true);
	});

    $(window).on("resize", function() {
        if ( $(window).width() < Worldview.TRANSITION_WIDTH ) {
            $("#" + self.containerId).show();
        } else {
            $("#" + self.containerId).hide();
        }
    });
};

Worldview.Widget.DateWheels.prototype = new SOTE.widget.Component;

/**
  * Displays the selectable dateSpan in HTML containing a thumbnail for each day in the span.  If the date range contains
  * more days than the visible day span, create horizontal scrolling capability.  All callbacks should be set.  The
  * component UI should be rendered with controllers to call the events.
  *
  * @this {dateSpan}
  * @requires SOTE.widget.Map
*/
Worldview.Widget.DateWheels.prototype.init = function(){

	// inherit styles into the user-specified div
	this.container.setAttribute("class","datespan");
	this.container.innerHTML = '<input name="linkmode" id="linkmode" />';
	var self = this;

	$("#linkmode").mobiscroll().date({display:"bottom",
									  onChange: function(valueText){
									  		var d = Date.parseISOString(valueText);
											self.setValue(d.toISOStringDate(),true);
											self.fire();
									  },
									  onShow: function(){
									  		$("#linkmode").css("display","none");
									  },
									  onClose: function(){
									  		$("#linkmode").css("display","block");
									  },
									  dateFormat: 'yyyy-mm-dd',
									  minDate: self.UTCToLocal(self.startDate),
									  maxDate: self.UTCToLocal(self.endDate),
									  setText: 'OK'

	});
	$("#linkmode").mobiscroll('setDate',this.UTCToLocal(this.value),true);

	$("#linkmode").bind("onselect",function(){
		alert("fire");
		self.fire();
	});

    if(REGISTRY){
 		REGISTRY.register(this.id,this);
 		REGISTRY.markComponentReady(this.id);
	}
	else{
		alert("No REGISTRY found!  Cannot register MobileDateSpan!");
	}

};

/* This function is adjusts the UTC time to local for interaction with the mobiscroll widget
 * The mobiscroll widget shows the mobile slider and only supports local time
 */
Worldview.Widget.DateWheels.prototype.UTCToLocal = function(d){
	var timezoneOffset = d.getTimezoneOffset()*this.MSEC_TO_MIN;

	return new Date(d.getTime() + timezoneOffset);
};

Worldview.Widget.DateWheels.prototype.getToday = function() {
    // If at the beginning of the day, wait on the previous day until GIBS
    // catches up.
    var today = Worldview.today();
    var now = Worldview.now();
    if ( now.getUTCHours() < Worldview.GIBS_HOUR_DELAY ) {
        today.setUTCDate(today.getUTCDate() - 1);
        return today;
    } else {
        return today;
    }
};

/**
  * Fires an event to the registry when the state of the component is changed
  *
  * @this {MobileDateSpan}
  *
*/
Worldview.Widget.DateWheels.prototype.fire = function(){

	$("#"+this.id).trigger("fire",this.value);

	if(REGISTRY){
		REGISTRY.fire(this);
	}
	else{
		alert("No REGISTRY found! Cannot fire to REGISTRY from AccordionPicker!");
	}

};

/**
  * Sets the selected date in the dateSpan from the passed in date string (ISO8601 format), if valid
  *
  * @this {dateSpan}
  * @param {String} value is the date to be set (i.e. [containerId]=[date])
  * @returns {boolean} true or false depending on if the passed in date validates
  *
*/
Worldview.Widget.DateWheels.prototype.setValue = function(value, noRender){
    var d;
    try {
        var d = value ? Date.parseISOString(value)
                      : this.getToday();
        var changed = false;
		if ( this.value.compareTo(d) !== 0 )
    		changed = true;
    } catch ( error ) {
        this.log.warn("Invalid time: " + value + ", reason: " + error +
                       "; using today");
        d = Worldview.today();
    }
    this.model.select(d);
    //this.value = d;
    /*
    if(!noRender && changed){
		$("#linkmode").mobiscroll('setDate',this.UTCToLocal(this.value),true);
	}
	*/

};

/**
  * Gets the currently selected date in ISO8601 format
  *
  * @this {dateSpan}
  * @returns {String} a string representing the currently selected date in ISO8601 format ([containerId]=[selectedDate])
  *
*/
Worldview.Widget.DateWheels.prototype.getValue = function(){
    var datestring = this.value.toISOStringDate();
	return ""+this.id +"="+datestring;
};

Worldview.Widget.DateWheels.prototype.get = function(){
    var datestring = this.value.toISOStringDate();
	return datestring;
};

/**
  * Modify the component based on dependencies (i.e. total number of dates in span, start date of span, selected date, thumbnails)
  *
  * @this {dateSpan}
  * @param {String} querystring contains all values of dependencies (from registry)
  * @returns {boolean} true or false depending on if the selected date validates against the updated criteria
  *
*/
Worldview.Widget.DateWheels.prototype.updateComponent = function(qs){

};

/**
  * Sets the selected date from the querystring, [containerId]=[selectedDate]
  *
  * @this {dateSpan}
  * @param {String} qs contains the querystring (must contain [containerId]=[selectedDate] in the string)
  * @returns {boolean} true or false depending on if the extracted date validates
  *
*/
Worldview.Widget.DateWheels.prototype.loadFromQuery = function(qs){
	return this.setValue(SOTE.util.extractFromQuery(this.id,qs));
};

/**
  * Validates that the selected date is not null and within bounds
  *
  * @this {dateSpan}
  * @returns {boolean} true or false depending on whether the date is not null and within bounds
*/
Worldview.Widget.DateWheels.prototype.validate = function(){

};

/**
  * Sets the data accessor that provides state change instructions given dependencies
  *
  * @this {dateSpan}
  * @param {String} datasourceurl is the relative location of the data accessor
  *
*/
Worldview.Widget.DateWheels.prototype.setDataSourceUrl = function(datasourceurl){
  // Content
};

/**
  * Gets the data accessor
  *
  * @this {dateSpan}
  * @returns {String} the relative location of the accessor
  *
*/
Worldview.Widget.DateWheels.prototype.getDataSourceUrl = function(){
  // Content
};

/**
  * Sets the status of the component
  *
  * @this {dateSpan}
  * @param {String} s the current status of the component (user prompts, error messages)
  *
*/
Worldview.Widget.DateWheels.prototype.setStatus = function(s){
  // Content
};

/**
  * Gets the status of the component
  *
  * @this {dateSpan}
  * @returns {String} the current status of the component (user prompts, error messages)
  *
*/
Worldview.Widget.DateWheels.prototype.getStatus = function(){
  // Content
};

/**
  * Makes the component UI invisible
  *
  * @this {dateSpan}
  *
*/
Worldview.Widget.DateWheels.prototype.hide = function(){
	$("#"+this.id).css("display","none");
	$("#linkmode").mobiscroll('hide',true);
};

/**
  * Makes the component UI visible
  *
  * @this {dateSpan}
  *
*/
Worldview.Widget.DateWheels.prototype.show = function(){
	$("#"+this.id).css("display","block");
};

/**
  * Expand the UI to show thumbnails
  *
  * @this {dateSpan}
  *
*/
Worldview.Widget.DateWheels.prototype.expand = function(){
  // Content
};

/**
  * Collapse the UI (no thumbnails)
  *
  * @this {dateSpan}
  *
*/
Worldview.Widget.DateWheels.prototype.collapse = function(){
  // Content
};

// Additional Functions
// setBounds, getAvailableDates, setStart, changeBaseProduct, setExtent









