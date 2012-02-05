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
		config.endDate = new Date();
		var timeString = SOTE.util.zeroPad(eval(config.endDate.getUTCMonth()+1),2) + "/" + SOTE.util.zeroPad(config.endDate.getUTCDate(),2) + "/" +
			config.endDate.getUTCFullYear() ;
		config.endDate = new Date(timeString);
		config.endDate.setHours(12);
		config.endDate.setMinutes(00);
		config.endDate.setSeconds(00);
		var time = config.endDate.clone();
		timeString = time.getUTCFullYear() + "-" + SOTE.util.zeroPad(eval(time.getUTCMonth()+1),2) + "-" + 
			SOTE.util.zeroPad(time.getUTCDate(),2);
		timeString += "T" + SOTE.util.zeroPad(time.getUTCHours(),2) + ":" + 
			SOTE.util.zeroPad(time.getUTCMinutes(),2) + ":" + SOTE.util.zeroPad(time.getUTCSeconds(),2);
	}
	else{
		config.endDate = new Date(config.endDate);
	}

	if(config.range === undefined){
		config.range = 7*24*60*60*1000;
	}
	
	if(config.selected === undefined){
		config.selected = new Date(config.endDate.getTime());
	}
	
	if(config.slideToSelect === undefined){
		config.slideToSelect = true;
	}
	
	if(config.isCollapsed === undefined){
		config.isCollapsed = (config.thumbSource === null || config.hasThumbnail === false)? true: false;
	}
	
	if(config.hasThumbnail === undefined){
		config.hasThumbnail = true;
	}
       
    this.value = "";
    this.maps = [];
	this.endDate = config.endDate;
	this.range = config.range; //in milliseconds
	this.isCollapsed = config.isCollapsed;
	this.slideToSelect = config.slideToSelect;
	this.thumbSource = config.thumbSource;
	this.hasThumbnail = config.hasThumbnail;
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
	var expandCollapseButton = document.createElement('a');
	expandCollapseButton.setAttribute('class','ecbutton collapse');
	this.container.appendChild(expandCollapseButton);
	var spanContainer = document.createElement('div');
	spanContainer.setAttribute('class','spanContainer');
	spanContainer.setAttribute('id',this.id+'spanContainer');
	//bgStripe.appendChild(spanContainer);
	this.container.appendChild(spanContainer);
	/*var labelForSpanContainer = document.createElement('label');
	labelForSpanContainer.setAttribute('for',this.id+'spanContainer');
	labelForSpanContainer.setAttribute('class','spanContainerLabel');
	labelForSpanContainer.innerHTML = "<span class='.annotation'>* drag the slider to select a date</span><span id='"+this.id+
		"spanContainerLabelDate'class='spanContainerLabelDate'></span><span id='"+this.id+
		"spanContainerLabelDay' class='spanContainerLabelDay'></span>";
	this.container.appendChild(labelForSpanContainer); 
	*/
	var numOfDays = this.range/24/60/60/1000;
	var startDate = new Date(this.endDate.getTime() - this.range);
	for(var i=0; i < numOfDays; ++i){
		var mapDiv = document.createElement('div');
		mapDiv.setAttribute('id','mapdiv'+i);
		mapDiv.setAttribute('class','dateitem');
		spanContainer.appendChild(mapDiv);
		var time = new Date(startDate.getTime() + (i+1)*24*60*60*1000);
		//var time = new Date(this.endDate.getTime() - i*24*60*60*1000);
		//var timeString = time.getUTCFullYear() + "-" + eval(time.getUTCMonth()+1) + "-" + time.getUTCDate();
		//timeString += "T"+
		var timeString = time.getUTCFullYear() + "-" + SOTE.util.zeroPad(eval(time.getUTCMonth()+1),2) + "-" + 
			SOTE.util.zeroPad(time.getUTCDate(),2);
		timeString += "T" + SOTE.util.zeroPad(time.getUTCHours(),2) + ":" + 
			SOTE.util.zeroPad(time.getUTCMinutes(),2) + ":" + SOTE.util.zeroPad(time.getUTCSeconds(),2);
		this.maps.push(new SOTE.widget.Map('mapdiv'+i,{baseLayer:"Terra_MODIS",time:timeString,hasControls:false}));
	}

	
	var slider = document.createElement('div');
	slider.setAttribute('id',this.id+'sliderDiv');
	slider.innerHTML = '<input type="range" name="slider" id="'+this.id+'slider" class="dateSpanSlider" value="100" min="0" max="100" step="1" />';
	spanContainer.appendChild(slider);

	$('#'+this.id+'slider').slider(); 
	$('#'+this.id+'slider').bind("change",{self:this},SOTE.widget.DateSpan.handleSlide);
	
	$('.ecbutton').bind("click",{self:this},SOTE.widget.DateSpan.toggle);

	if(this.isCollapsed){
		this.isCollapsed = false;
		var e = new Object();
		e.data = new Object();
		e.data.self = this;
		SOTE.widget.DateSpan.toggle(e);	
	}

	this.spanDate = document.getElementById(this.id+"spanContainerLabelDate");
	this.spanDay = document.getElementById(this.id+"spanContainerLabelDay");

	this.setVisualDate();


    if(REGISTRY){
 		REGISTRY.register(this.id,this);
 		REGISTRY.markComponentReady(this.id);
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
	
/*	var numOfDays = self.range/24/60/60/1000;
	var increment = 100/numOfDays;
	var prev = 0;
	for(var i=increment; i<100; i+=increment){
		var avg = (prev+i)/2;
		if(value > prev && value < avg){
			value = prev;
			break;
		}
		if(value > avg && value < increment){
			value = increment;
			break;
		}
		prev = i;
	}
	$('#'+self.id+'slider').slider("value",value);*/
	var x = (self.range - (24*60*60*1000)) * (100-value)/100;
	var time = new Date(self.endDate.getTime() - x);
	self.setValue(time.toUTCString());
	self.setVisualDate();

};

SOTE.widget.DateSpan.toggle = function(e,ui){
	var self = e.data.self;
	if(self.isCollapsed){
		$('.ecbutton').removeClass('expand').addClass('collapse');
		$('.ecbutton').attr("title","Hide Date Thumbnails");
		$('a.ui-slider-handle').css('top','-142px');
		self.isCollapsed = false;
		self.showMaps();
		self.updateComponent(self.cachedQs);
	}
	else{
		$('.ecbutton').removeClass('collapse').addClass('expand');
		$('.ecbutton').attr("title","Show Date Thumbnails");
		$('a.ui-slider-handle').css('top','-25px');
		self.isCollapsed = true;
		self.hideMaps();

	} 
};

SOTE.widget.DateSpan.prototype.hideMaps = function(){
	for(var i=0; i<this.maps.length; ++i){
		$("#"+this.maps[i].id).css('display','none');
	}
}

SOTE.widget.DateSpan.prototype.showMaps = function(){
	for(var i=0; i<this.maps.length; ++i){
		$("#"+this.maps[i].id).css('display','block');
	}
}

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

SOTE.widget.DateSpan.prototype.setVisualDate = function(){
	/*this.spanDate.innerHTML = this.value.getUTCFullYear() + "-" + SOTE.util.zeroPad(eval(this.value.getUTCMonth()+1),2) + "-" + 
		SOTE.util.zeroPad(this.value.getUTCDate(),2);
	//this.spanDay.innerHTML = SOTE.util.zeroPad(this.value.getUTCHours(),2) + ":" + 
	//		SOTE.util.zeroPad(this.value.getUTCMinutes(),2) + ":" + SOTE.util.zeroPad(this.value.getUTCSeconds(),2);
	this.spanDay.innerHTML = SOTE.util.DayNameFromUTCDayInt(this.value.getUTCDay());
	*/
	
	var dateString = this.value.getUTCFullYear() + "-" + SOTE.util.zeroPad(eval(this.value.getUTCMonth()+1),2) + "-" + 
		SOTE.util.zeroPad(this.value.getUTCDate(),2);
	
	$("a.ui-slider-handle").html("<span class='sliderText'>"+dateString+"</span>");
};

/**
  * Gets the currently selected date in ISO8601 format
  *
  * @this {dateSpan}
  * @returns {String} a string representing the currently selected date in ISO8601 format ([containerId]=[selectedDate])
  *
*/
SOTE.widget.DateSpan.prototype.getValue = function(){
	var timeString = this.value.getUTCFullYear() + "-" + SOTE.util.zeroPad(eval(this.value.getUTCMonth()+1),2) + "-" + 
		SOTE.util.zeroPad(this.value.getUTCDate(),2) + "T" + SOTE.util.zeroPad(this.value.getUTCHours(),2) + ":" + 
		SOTE.util.zeroPad(this.value.getUTCMinutes(),2) + ":" + SOTE.util.zeroPad(this.value.getUTCSeconds(),2);
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
	var products = SOTE.util.extractFromQuery('products',qs);
	var activeProducts = products.split(".");
	if(this.isCollapsed === false){
		var numOfDays = this.range/24/60/60/1000;
		var startDate = new Date(this.endDate.getTime() - this.range);
		for(var i=0; i<numOfDays; i++){
			var time = new Date(startDate.getTime() + (i+1)*24*60*60*1000);
			var timeString = time.getUTCFullYear() + "-" + SOTE.util.zeroPad(eval(time.getUTCMonth()+1),2) + "-" + 
				SOTE.util.zeroPad(time.getUTCDate(),2);
			timeString += "T" + SOTE.util.zeroPad(time.getUTCHours(),2) + ":" + 
				SOTE.util.zeroPad(time.getUTCMinutes(),2) + ":" + SOTE.util.zeroPad(time.getUTCSeconds(),2);
			this.maps[i].activateRelevantLayersDisableTheRest(activeProducts,timeString);
			this.maps[i].setValue(bbox);
		}
	}
	else {
		this.cachedQs = qs;
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









