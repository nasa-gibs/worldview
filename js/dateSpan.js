SOTE.namespace("SOTE.widget.DateSpan");


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
SOTE.widget.DateSpan = function(containerId, config){
	this.container=document.getElementById(containerId);
	if (this.container==null){
		this.setStatus("Error: element '"+containerId+"' not found!",true);
		return;
	}
	this.id = containerId;
	//Store the container's ID
	this.containerId=containerId;	

	//Define an object for holding configuration 
	if (config===undefined){
		config={}; 
	}
 
	if(config.dataSourceUrl === undefined){
	    config.dataSourceUrl = null;
	}

	if(config.thumbSource === undefined){
	    config.thumbSource = null; 
	}

 	if(config.extent === undefined){
	    config.extent = null;
	}	
	
	if(config.product === undefined){
		config.product = null;
	}

	if(config.endDate === undefined){
		config.endDate = new Date("11/30/2011");
	}

	if(config.range === undefined){
		config.range = 5*24*60*60*1000;
	}
	
	if(config.selected === undefined){
		config.selected = new Date(config.endDate.getTime());
	}
	
	if(config.slideToSelect === undefined){
		config.slideToSelect = true;
	}
	
	if(config.isCollapsed === undefined){
		config.isCollapsed = (config.thumbSource === null)? true: false;
	}
       
    this.value = "";
    this.maps = [];
	this.endDate = config.endDate;
	this.range = config.range; //in milliseconds
	this.isCollapsed = config.isCollapsed;
	this.slideToSelect = config.slideToSelect;
	this.thumbSource = config.thumbSource;
	this.extent = config.extent;
	this.product = config.product;
	this.value = config.selected;
	this.dataSourceUrl = config.dataSourceUrl;
	this.statusStr = "";
	this.init();
};

SOTE.widget.DateSpan.prototype = new SOTE.widget.Component;


/**
  * Displays the selectable dateSpan in HTML containing a thumbnail for each day in the span.  If the date range contains 
  * more days than the visible day span, create horizontal scrolling capability.  All callbacks should be set.  The 
  * component UI should be rendered with controllers to call the events.
  * 
  * @this {dateSpan}
  * @requires SOTE.widget.Map
*/
SOTE.widget.DateSpan.prototype.init = function(){
	
	this.container.setAttribute("class","datespan");
	//var bgStripe = document.createElement('div');
	//bgStripe.setAttribute('class','horizontalContainer');
	var spanContainer = document.createElement('div');
	spanContainer.setAttribute('class','spanContainer');
	//bgStripe.appendChild(spanContainer);
	this.container.appendChild(spanContainer);
	
	var numOfDays = this.range/24/60/60/1000;
	
	for(var i=0; i < numOfDays; ++i){
		var mapDiv = document.createElement('div');
		mapDiv.setAttribute('id','mapdiv'+i);
		mapDiv.setAttribute('class','dateitem');
		spanContainer.appendChild(mapDiv);
		
		var time = new Date(this.endDate.getTime() - i*24*60*60*1000);
		var timeString = time.getFullYear() + "-" + eval(time.getMonth()+1) + "-" + time.getDate();
		this.maps.push(new SOTE.widget.Map('mapdiv'+i,{baseLayer:"Terra_MODIS",time:timeString,hasControls:false}));
	}
	
	var slider = document.createElement('div');
	slider.setAttribute('id',this.id+'sliderDiv');
	slider.innerHTML = '<input type="range" name="slider" id="'+this.id+'slider" class="dateSpanSlider" value="0" min="0" max="100" step="1" />';
	spanContainer.appendChild(slider);

	$('#'+this.id+'slider').slider(); 
	$('#'+this.id+'slider').bind("change",{self:this},SOTE.widget.DateSpan.handleSlide);

    if(REGISTRY){
 		REGISTRY.register(this.id,this);
	}
	else{
		alert("No REGISTRY found!  Cannot register AccordionPicker!");
	}

};

/**
  * Fires an event to the registry when the state of the component is changed
  *
  * @this {DateSpan}
  *
*/
SOTE.widget.DateSpan.prototype.fire = function(){

	if(REGISTRY){
		REGISTRY.fire(this);
	}
	else{
		alert("No REGISTRY found! Cannot fire to REGISTRY from AccordionPicker!");
	}

};


SOTE.widget.DateSpan.handleSlide = function(e,ui){
	var value = e.target.value;
	var self = e.data.self;
	
	var x = self.range * (value)/100;
	var time = new Date(self.endDate.getTime() - x);
	
	self.setValue(time.toUTCString());
};

/**
  * Sets the selected date in the dateSpan from the passed in date string (ISO8601 format), if valid
  *
  * @this {dateSpan}
  * @param {String} value is the date to be set (i.e. [containerId]=[date])
  * @returns {boolean} true or false depending on if the passed in date validates
  *
*/
SOTE.widget.DateSpan.prototype.setValue = function(value){
	this.value = new Date(value);
	this.fire();
};

/**
  * Gets the currently selected date in ISO8601 format
  *
  * @this {dateSpan}
  * @returns {String} a string representing the currently selected date in ISO8601 format ([containerId]=[selectedDate])
  *
*/
SOTE.widget.DateSpan.prototype.getValue = function(){
	var timeString = this.value.getFullYear() + "-" + SOTE.util.zeroPad(eval(this.value.getMonth()+1),2) + "-" + 
		SOTE.util.zeroPad(this.value.getDate(),2) + "T" + SOTE.util.zeroPad(this.value.getHours(),2) + ":" + 
		SOTE.util.zeroPad(this.value.getMinutes(),2) + ":" + SOTE.util.zeroPad(this.value.getSeconds(),2);
	return ""+this.id +"="+timeString+"&transition=standard";
};

/**
  * Modify the component based on dependencies (i.e. total number of dates in span, start date of span, selected date, thumbnails)
  * 
  * @this {dateSpan}
  * @param {String} querystring contains all values of dependencies (from registry)
  * @returns {boolean} true or false depending on if the selected date validates against the updated criteria
  * 
*/
SOTE.widget.DateSpan.prototype.updateComponent = function(qs){
	var bbox = SOTE.util.extractFromQuery('map',qs);
	for(var i=0; i<this.maps.length; i++){
		this.maps[i].setValue(bbox);
	}
};

/**
  * Sets the selected date from the querystring, [containerId]=[selectedDate]
  * 
  * @this {dateSpan}
  * @param {String} qs contains the querystring (must contain [containerId]=[selectedDate] in the string)
  * @returns {boolean} true or false depending on if the extracted date validates
  *
*/
SOTE.widget.DateSpan.prototype.loadFromQuery = function(qs){
  // Content
};

/**
  * Validates that the selected date is not null and within bounds
  * 
  * @this {dateSpan}
  * @returns {boolean} true or false depending on whether the date is not null and within bounds
*/
SOTE.widget.DateSpan.prototype.validate = function(){
  // Content
};

/**
  * Sets the data accessor that provides state change instructions given dependencies
  *
  * @this {dateSpan}
  * @param {String} datasourceurl is the relative location of the data accessor 
  *
*/
SOTE.widget.DateSpan.prototype.setDataSourceUrl = function(datasourceurl){
  // Content
};

/**
  * Gets the data accessor
  * 
  * @this {dateSpan}
  * @returns {String} the relative location of the accessor
  *
*/
SOTE.widget.DateSpan.prototype.getDataSourceUrl = function(){
  // Content
};

/**
  * Sets the status of the component
  *
  * @this {dateSpan}
  * @param {String} s the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.DateSpan.prototype.setStatus = function(s){
  // Content
};

/**
  * Gets the status of the component
  *
  * @this {dateSpan}
  * @returns {String} the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.DateSpan.prototype.getStatus = function(){
  // Content
};

/**
  * Makes the component UI invisible
  *
  * @this {dateSpan}
  *
*/
SOTE.widget.DateSpan.prototype.hide = function(){
  // Content
};

/**
  * Makes the component UI visible
  *
  * @this {dateSpan}
  *
*/
SOTE.widget.DateSpan.prototype.show = function(){
  // Content
};

/**
  * Expand the UI to show thumbnails
  *
  * @this {dateSpan}
  *
*/
SOTE.widget.DateSpan.prototype.expand = function(){
  // Content
};

/**
  * Collapse the UI (no thumbnails)
  *
  * @this {dateSpan}
  *
*/
SOTE.widget.DateSpan.prototype.collapse = function(){
  // Content
};

// Additional Functions
// setBounds, getAvailableDates, setStart, changeBaseProduct, setExtent









