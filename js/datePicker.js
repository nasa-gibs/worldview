SOTE.namespace("SOTE.widget.MobileDatePicker");


/**
  * Instantiate the dateSpan  
  *
  * @class A date selection object for a configurable period of days, containing thumnails of a sample data 
  *     product image for each day
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
SOTE.widget.DatePicker = function(containerId, config){
    this.log = Logging.getLogger("Worldview.Widget.DatePicker");
 
	this.container=document.getElementById(containerId);
	if (this.container==null){
		this.setStatus("Error: element '"+containerId+"' not found!",true);
		return;
	}
	this.id = containerId;
	//Store the container's ID
	this.containerId=containerId;	

	this.config = config;
	this.current = null;
	
	this.init();
	
	$(window).bind("resize",{self:this},SOTE.widget.DatePicker.resize);
		
};

SOTE.widget.DatePicker.prototype = new SOTE.widget.Component;

/**
  * Displays the selectable dateSpan in HTML containing a thumbnail for each day in the span.  If the date range contains 
  * more days than the visible day span, create horizontal scrolling capability.  All callbacks should be set.  The 
  * component UI should be rendered with controllers to call the events.
  * 
  * @this {dateSpan}
  * @requires SOTE.widget.Map
*/
SOTE.widget.DatePicker.prototype.init = function(){
	
	this.ds_id = this.id+"ds";
	this.mds_id = this.id+"mds";
	var ds = document.createElement('div');
	ds.setAttribute("id",this.ds_id);
	var mds = document.createElement('div');
	mds.setAttribute("id",this.mds_id);	
	
	this.container.appendChild(ds);
	this.container.appendChild(mds);
	
	this.ds = new SOTE.widget.DateSpan(this.ds_id, this.config);
	this.mds = new SOTE.widget.MobileDateSpan(this.mds_id, this.config);
	
	$("#"+this.ds_id).bind("fire", {self:this}, SOTE.widget.DatePicker.handleFire);
	$("#"+this.mds_id).bind("fire", {self:this}, SOTE.widget.DatePicker.handleFire)
	
	SOTE.widget.DatePicker.resize({data: {self:this}});
	
    if(REGISTRY){
 		REGISTRY.register(this.id,this);
 		REGISTRY.markComponentReady(this.id);
	}
	else{
		alert("No REGISTRY found!  Cannot register DatePicker!");
	}

};

SOTE.widget.DatePicker.handleFire = function(e,value){
	var self = e.data.self;
	if(self.current.id = self.ds_id) self.mds.set(value); else self.ds.set(value);
	self.fire(); 
};

SOTE.widget.DatePicker.resize = function(e){
	var self = e.data.self;
	
	if($(window).width() > 720){
		self.current = self.ds;
		self.ds.show();
		self.mds.hide();
	}
	else {
		self.current = self.mds;
		self.ds.hide();
		self.mds.show();
	} 
};

/**
  * Fires an event to the registry when the state of the component is changed
  *
  * @this {DatePicker}
  *
*/
SOTE.widget.DatePicker.prototype.fire = function(){

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
SOTE.widget.DatePicker.prototype.setValue = function(value){
	this.ds.setValue(value);
	this.mds.setValue(value);
};

/**
  * Gets the currently selected date in ISO8601 format
  *
  * @this {dateSpan}
  * @returns {String} a string representing the currently selected date in ISO8601 format ([containerId]=[selectedDate])
  *
*/
SOTE.widget.DatePicker.prototype.getValue = function(){
	return this.id + "=" + this.current.get();
};

/**
  * Modify the component based on dependencies (i.e. total number of dates in span, start date of span, selected date, thumbnails)
  * 
  * @this {dateSpan}
  * @param {String} querystring contains all values of dependencies (from registry)
  * @returns {boolean} true or false depending on if the selected date validates against the updated criteria
  * 
*/
SOTE.widget.DatePicker.prototype.updateComponent = function(qs){
	this.ds.updateComponent(qs);
	this.mds.updateComponent(qs);
};

/**
  * Sets the selected date from the querystring, [containerId]=[selectedDate]
  * 
  * @this {dateSpan}
  * @param {String} qs contains the querystring (must contain [containerId]=[selectedDate] in the string)
  * @returns {boolean} true or false depending on if the extracted date validates
  *
*/
SOTE.widget.DatePicker.prototype.loadFromQuery = function(qs){
	this.ds.loadFromQuery(qs);
	this.mds.loadFromQuery(qs);
};

/**
  * Validates that the selected date is not null and within bounds
  * 
  * @this {dateSpan}
  * @returns {boolean} true or false depending on whether the date is not null and within bounds
*/
SOTE.widget.DatePicker.prototype.validate = function(){
  
};

/**
  * Sets the data accessor that provides state change instructions given dependencies
  *
  * @this {dateSpan}
  * @param {String} datasourceurl is the relative location of the data accessor 
  *
*/
SOTE.widget.DatePicker.prototype.setDataSourceUrl = function(datasourceurl){
  // Content
};

/**
  * Gets the data accessor
  * 
  * @this {dateSpan}
  * @returns {String} the relative location of the accessor
  *
*/
SOTE.widget.DatePicker.prototype.getDataSourceUrl = function(){
  // Content
};

/**
  * Sets the status of the component
  *
  * @this {dateSpan}
  * @param {String} s the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.DatePicker.prototype.setStatus = function(s){
  // Content
};

/**
  * Gets the status of the component
  *
  * @this {dateSpan}
  * @returns {String} the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.DatePicker.prototype.getStatus = function(){
  // Content
};

/**
  * Makes the component UI invisible
  *
  * @this {dateSpan}
  *
*/
SOTE.widget.DatePicker.prototype.hide = function(){
  // Content
};

/**
  * Makes the component UI visible
  *
  * @this {dateSpan}
  *
*/
SOTE.widget.DatePicker.prototype.show = function(){
  // Content
};

/**
  * Expand the UI to show thumbnails
  *
  * @this {dateSpan}
  *
*/
SOTE.widget.DatePicker.prototype.expand = function(){
  // Content
};

/**
  * Collapse the UI (no thumbnails)
  *
  * @this {dateSpan}
  *
*/
SOTE.widget.DatePicker.prototype.collapse = function(){
  // Content
};

// Additional Functions
// setBounds, getAvailableDates, setStart, changeBaseProduct, setExtent









