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
    this.log = Logging.getLogger("Worldview.Widget.DateSpan");
	this.SLIDER_WIDTH = 1000;
    this.DAY_IN_MS = 24*60*60*1000;
    this.sliders = new Object();
	this.sliders["Year"] = [2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013];
	this.sliders["Month"] = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
	this.sliders["Day"] = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31];
 	this.months = [31,28,31,30,31,30,31,31,30,31,30,31];
 
    this.sliderContent = [];
	
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
	}
	else{
		config.endDate = new Date(config.endDate);
	}

	if(config.startDate === undefined){
		config.startDate = new Date();
		var timeString = "05/08/2012";
		config.startDate = new Date(timeString);
		config.startDate.setHours(12);
		config.startDate.setMinutes(00);
		config.startDate.setSeconds(00);
	}
	else{
		config.endDate = new Date(config.endDate);
	}

	if(config.range === undefined){
		config.range = 7*this.DAY_IN_MS;
	}
	
	if(config.selected === undefined){
		config.selected = new Date(config.endDate.getTime());
	}
	
	if(config.slideToSelect === undefined){
		config.slideToSelect = true;
	}
	
	if(config.isCollapsed === undefined){
		config.isCollapsed = false;//(config.thumbSource === null || config.hasThumbnail === false)? true: false;
	}
	
	if(config.hasThumbnail === undefined){
		config.hasThumbnail = true;
	}
       
    this.value = "";
    this.maps = [];
    this.startDate = config.startDate;
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
	
	$(window).bind("resize",{self:this},SOTE.widget.DateSpan.refreshSliders);
	
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
	
	// inherit styles into the user-specified div
	this.container.setAttribute("class","datespan");

	var dateHolder = document.createElement('div');
	dateHolder.setAttribute('id',this.id+'dateHolder');
	dateHolder.setAttribute('class','dateHolder');
	dateHolder.innerHTML = 'Friday September 21, 2012';
	this.container.appendChild(dateHolder);
	
	var ecbutton = document.createElement("a");
	ecbutton.setAttribute("class","ecbutton collapse");
	ecbutton.setAttribute("id",this.id+"ecbutton");
	this.container.appendChild(ecbutton);

	this.createSlider("Year");
	this.createSlider("Month");
	this.createSlider("Day");

	this.setVisualDate();

	this.setValue(SOTE.util.ISO8601StringFromDate(this.value));

	$('#'+this.id+'ecbutton').bind("click",{self:this},SOTE.widget.DateSpan.toggle);

    if(REGISTRY){
 		REGISTRY.register(this.id,this);
 		REGISTRY.markComponentReady(this.id);
	}
	else{
		alert("No REGISTRY found!  Cannot register AccordionPicker!");
	}

};


SOTE.widget.DateSpan.refreshSliders = function(e){
	var self = e.data.self;
	setTimeout(function() {
		self.refreshSlider("Year");
		self.refreshSlider("Month");
		self.refreshSlider("Day");		
	},100);
	
};

SOTE.widget.DateSpan.prototype.refreshSlider = function(type){
	var labels = this.sliders[type];
	var wwidth = $(window).width() - 10;
		
	if(labels != undefined){
		var width = 50/labels.length;
		width = width.toFixed(1);
		var pwidth = width/100;
		var pwwidth = Math.floor(pwidth*wwidth);
		var spacer = 50/labels.length;
		spacer = spacer.toFixed(1);
		var pspacer = spacer/100;
		var pwspacer = Math.floor(wwidth*pspacer/2);
		var finalwidth = (pwwidth+pwspacer+pwspacer);
		$('#'+this.id+'sliderLabel'+type).children().css('width',Math.floor(wwidth*pwidth) + "px");
		$('#'+this.id+'sliderLabel'+type).children().css('margin-left',Math.floor(wwidth*pspacer/2) + "px");
		$('#'+this.id+'sliderLabel'+type).children().css('margin-right',Math.floor(wwidth*pspacer/2) + "px");
		$('#'+this.id+'slider'+type).siblings('.ui-slider').css('width',eval(finalwidth*labels.length)+"px");	
	}	
		
};

SOTE.widget.DateSpan.prototype.createSlider = function(type){
	var slider = document.createElement('div');
	slider.setAttribute('id',this.id+'sliderDiv'+type);
	slider.setAttribute('class','sliderDiv'+type+' slider');
	slider.innerHTML = '<input type="range" name="slider" id="'+this.id+'slider'+type+'" class="dateSpanSlider" value="'+this.SLIDER_WIDTH+'" min="0" max="'+this.SLIDER_WIDTH+'" step="1" />';
	this.container.appendChild(slider);
	
	var width = 0;
	var wwidth = $(window).width() - 10;
	var labels = this.sliders[type];
	
	if(labels != undefined){
		width = 50/labels.length;
		width = width.toFixed(1);
		var pwidth = width/100;
		var pwwidth = Math.floor(pwidth*wwidth);
		var spacer = 50/labels.length;
		spacer = spacer.toFixed(1);
		var pspacer = spacer/100;
		var pwspacer = Math.floor(wwidth*pspacer/2);
		var finalwidth = (pwwidth+pwspacer+pwspacer);
		//if(type=='Month'){ width=60/labels.length; spacer=40/labels.length;}
		var label = document.createElement('ul');
		label.setAttribute('class','sliderLabel');
		label.setAttribute('id',this.id+'sliderLabel'+type);
		for(var i=0; i<labels.length; ++i){
			var item = document.createElement('li');
			item.setAttribute('id',this.id+type+'sliderItem'+i);
			item.innerHTML = labels[i];
			item.style.width = Math.floor(wwidth*pwidth) + "px";
			item.style.marginLeft = Math.floor(wwidth*pspacer/2) + "px";
			item.style.marginRight = Math.floor(wwidth*pspacer/2) + "px"; 
			label.appendChild(item);
		}	
		this.container.appendChild(label);
	}
	
	var labelslength = labels.length;
	
	$('#'+this.id+'slider'+type).slider(); 
	$('#'+this.id+'slider'+type).bind("change",{self:this,type:type},SOTE.widget.DateSpan.handleSlide);
	$('#'+this.id+'slider'+type).siblings('.ui-slider').css('width',eval(finalwidth*labels.length)+"px");	
	$('#'+this.id+'slider'+type).siblings('.ui-slider').bind("vmouseup",{self:this,type:type},SOTE.widget.DateSpan.snap);	    
	if(width!=0){$('.sliderDiv'+type+' a.ui-slider-handle').css('width',eval(width*1.1).toFixed(1)+"%");}
	//this.widths[type] = width;
	    
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
	var type = e.data.type;
	var self = e.data.self;

	var numitems = self.sliders[type].length;

	var displacement = Math.floor(value*(numitems/self.SLIDER_WIDTH));
	
	if(self.sliders[type][displacement]){
		var newDate = self.value.clone();
		if(type == "Year"){
			newDate.setYear(self.sliders[type][displacement]);
		}
		else if (type == "Month"){
			if(self.value.getDate() > self.months[displacement]){
				newDate.setDate(self.months[displacement]);
				newDate.setMonth(displacement);
				self.setValue(SOTE.util.ISO8601StringFromDate(newDate));
			}
			else{
				newDate.setMonth(displacement);
			}
		}
		else if (type == "Day"){
			if(self.sliders[type][displacement] <= self.months[self.value.getMonth()]){
				newDate.setDate(self.sliders[type][displacement]);	
			}
			else {
				newDate.setDate(self.months[self.value.getMonth()]);
				self.setValue(SOTE.util.ISO8601StringFromDate(newDate));
			}
		}
		
		if(newDate.getTime() < self.startDate.getTime()){
			self.setValue(SOTE.util.ISO8601StringFromDate(self.startDate));			
		}
		else if(newDate.getTime() > self.endDate.getTime()){
			self.setValue(SOTE.util.ISO8601StringFromDate(self.endDate));						
		}
		else {
			self.value = newDate.clone();
		}
		
	}
	else {
		if(displacement >= self.sliders[type].length){
			self.setValue(SOTE.util.ISO8601StringFromDate(self.value));
		}
		else if(displacement < 0){
			self.setValue(SOTE.util.ISO8601StringFromDate(self.value));
		}
	}
	self.validate();	
	self.setVisualDate();	
	self.fire()

/*
	var x = (self.range - self.DAY_IN_MS) * (self.SLIDER_WIDTH-value)/self.SLIDER_WIDTH;
	
	var time = new Date(self.endDate.getTime() - x);
	if(self.value.getTime() !== time.getTime()){
		self.value = time.clone();
		self.setVisualDate();
		self.fire();
	}*/
	

};

SOTE.widget.DateSpan.toggle = function(e,ui){
	var self = e.data.self;
	if(self.isCollapsed){
		$('.ecbutton').removeClass('expand').addClass('collapse');
		$('.ecbutton').attr("title","Hide Date Slider");
		//$('a.ui-slider-handle').css('top','-142px');
		self.isCollapsed = false;
		self.showSliders();
	}
	else{
		$('.ecbutton').removeClass('collapse').addClass('expand');
		$('.ecbutton').attr("title","Show Date Slider");
		//$('a.ui-slider-handle').css('top','-25px');
		self.isCollapsed = true;
		self.hideSliders();
	} 
};

SOTE.widget.DateSpan.snap = function(e,ui){
	var self = e.data.self;
	var type = e.data.type;
	var numitems = self.sliders[type].length;
	var value = $("#"+self.id+"slider"+type).val();
	//alert("value: " + value + "; numitems: " + numitems);
	var displacement = Math.floor(value*(numitems/self.SLIDER_WIDTH));
	var width = self.SLIDER_WIDTH/numitems;
	var move = displacement*width + width/4 - width*.05;
	move = move.toFixed(1);
	//move = move * $(window).width(); 
	$("#"+self.id+"slider"+type).val((move)).slider("refresh");
	//alert(self.sliders[type][displacement]);
	if(self.sliders[type][displacement]){
		var newDate = self.value.clone();
		if(type == "Year"){
			newDate.setYear(self.sliders[type][displacement]);
		}
		else if (type == "Month"){
			if(self.value.getDate() > self.months[displacement]){
				newDate.setDate(self.months[displacement]);
				newDate.setMonth(displacement);
				self.setValue(SOTE.util.ISO8601StringFromDate(newDate));
			}
			else{
				newDate.setMonth(displacement);
			} 
		}
		else if (type == "Day"){
			if(self.sliders[type][displacement] <= self.months[self.value.getMonth()]){
				newDate.setDate(self.sliders[type][displacement]);	
			}
			else {
				newDate.setDate(self.months[self.value.getMonth()]);
				self.setValue(SOTE.util.ISO8601StringFromDate(newDate));
			}
		}
		
		
		if(newDate.getTime() < self.startDate.getTime()){
			self.setValue(SOTE.util.ISO8601StringFromDate(self.startDate));			
		}
		else if(newDate.getTime() > self.endDate.getTime()){
			self.setValue(SOTE.util.ISO8601StringFromDate(self.endDate));						
		}
		else {
			self.value = newDate.clone();
		}
		
		//self.setValue(SOTE.util.ISO8601StringFromDate(self.value));

	}
	else {
		if(displacement >= self.sliders[type].length){
			self.setValue(SOTE.util.ISO8601StringFromDate(self.value));
		}
		else if(displacement < 0) {
			self.setValue(SOTE.util.ISO8601StringFromDate(self.value));
		}
	}
	self.validate();
	self.setVisualDate(); 
	/*var x = (self.range - (24*60*60*1000)) * (100-value)/100;
	var time = new Date(self.endDate.getTime() - x);
	time.setHours(12);
	time.setMinutes(0);
	time.setSeconds(0);

	self.setValue(SOTE.util.ISO8601StringFromDate(time));*/
};

SOTE.widget.DateSpan.snapToTime = function(e,ui){
	var self = e.data.self;
	var time = e.data.time;
	//time = new Date(time.getTime() - time.getTimezoneOffset()*60000);
	
	//self.setValue(SOTE.util.ISO8601StringFromDate(time));
};

SOTE.widget.DateSpan.prototype.hideSliders = function(){
	for(var i in this.sliders){
		$("#"+this.id+"sliderDiv"+i).css('display','none');
	}
}

SOTE.widget.DateSpan.prototype.showSliders = function(){
	for(var i in this.sliders){
		$("#"+this.id+"sliderDiv"+i).css('display','block');
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
    if ( value === "" ) {
        value = SOTE.util.ISO8601StringFromDate(new Date());
    }
	var vals = SOTE.util.getValuesFromISO8601String(value);
	// Check to see if the date is valid, if not default to today
	var valid = true;
	$.each(vals, function(index, value) {
	   if ( isNaN(value) ) {
	       value = SOTE.util.ISO8601StringFromDate(new Date());
	       vals = SOTE.util.getValuesFromISO8601String(value);
	       valid = false;
	   }    
	});
	if ( ! valid ) {
	   this.log.warn("Invalid time: " + value + ", using today");    
	}
	if(vals[2] > this.months[vals[1]]){
		vals[2] = this.months[vals[1]];
	}	
	
	var d = new Date(vals[0], vals[1], vals[2], 0, 0, 0);
	
	var startDate = this.endDate.getTime() - (this.range - 24*60*60*1000);
	var monthNames = [ "January", "February", "March", "April", "May", "June",
    	"July", "August", "September", "October", "November", "December" ];
	
	if(d.getTime() < this.startDate.getTime()) {
	    d = this.startDate;
	}
	if(d.getTime() <= this.endDate.getTime() && d.getTime() >= this.startDate.getTime())
	{
		this.value = d;
		var values = new Object();
		values["Year"] = this.sliders["Year"].indexOf(this.value.getFullYear());
		values["Month"] = this.value.getMonth();
		values["Day"] = this.sliders["Day"].indexOf(this.value.getDate());
		
		for(var type in values){
			var numitems = this.sliders[type].length;
			var displacement = values[type];
			var width = this.SLIDER_WIDTH/numitems;
			var move =  displacement*width + (width/4) - (width*.05);
			move = move.toFixed(1);
			$("#"+this.id+"slider"+type).val(move).slider("refresh");			
		}

		this.validate();
		this.setVisualDate();
		this.fire();
	}
	else {
	    var thisDay = SOTE.util.ISO8601StringFromDate(d).split("T")[0];
	    var startDay = SOTE.util.ISO8601StringFromDate(this.startDate).split("T")[0];
	    var today = SOTE.util.ISO8601StringFromDate(this.endDate).split("T")[0];
	    
	    if ( d.getTime() < this.startDate.getTime() ) {
	        /*
	        SOTE.util.throwError("Data is not available for " + thisDay +
	           ". The day of " + startDay + " is the earliest available " + 
	           "data at this time. The date has been adjusted to today.");
	           */
	    } else if ( d.getTime() >= this.endDate.getTime() ) {
	        
	        SOTE.util.throwError("Data is not available for " + thisDay + 
	           " yet. Try again later. The date has been adjusted to today.")
	    } 
	}
};

SOTE.widget.DateSpan.prototype.setVisualDate = function(){
	var dateString = this.value.getFullYear() + "-" + SOTE.util.zeroPad(eval(this.value.getMonth()+1),2) + "-" + 
		SOTE.util.zeroPad(this.value.getDate(),2);
	$('#'+this.id+'dateHolder').html(dateString);
	//$("a.ui-slider-handle").html("<span class='sliderText'>"+dateString+"</span>");
};

/**
  * Gets the currently selected date in ISO8601 format
  *
  * @this {dateSpan}
  * @returns {String} a string representing the currently selected date in ISO8601 format ([containerId]=[selectedDate])
  *
*/
SOTE.widget.DateSpan.prototype.getValue = function(){
    var datestring = SOTE.util.ISO8601StringFromDate(this.value);
    // Strip off the time, only use the date
    var datestring = datestring.split("T")[0];
	return ""+this.id +"="+datestring;
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
/*	var bbox = SOTE.util.extractFromQuery('map',qs);
	var products = SOTE.util.extractFromQuery('products',qs);
	var a = products.split("~");
	var activeProducts = new Array();

	var base = a[0].split(".");
	var overlays = a[1].split(".");
	for(var i=1; i<base.length; ++i){
		activeProducts.push(base[i]);
	}
	for(var i=1; i<overlays.length; ++i){
		activeProducts.push(overlays[i]);
	}

	if(this.isCollapsed == false){
		var numOfDays = this.range/24/60/60/1000;
		var startDate = new Date(this.endDate.getTime() - this.range);
		for(var i=0; i<numOfDays; i++){
			var time = new Date(startDate.getTime() + (i+1)*24*60*60*1000);
			var timeString = SOTE.util.ISO8601StringFromDate(time);
			this.maps[i].updateComponent(qs);
			this.maps[i].activateRelevantLayersDisableTheRest(activeProducts,timeString);
			this.maps[i].setValue(bbox);
		}
	}
	else {
		this.cachedQs = qs;
	}*/
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
	return this.setValue(SOTE.util.extractFromQuery(this.id,qs));
};

/**
  * Validates that the selected date is not null and within bounds
  * 
  * @this {dateSpan}
  * @returns {boolean} true or false depending on whether the date is not null and within bounds
*/
SOTE.widget.DateSpan.prototype.validate = function(){
	var curr = this.value.clone();
	var startYear = this.startDate.getFullYear();
	var startMonth = this.startDate.getMonth();
	var startDay = this.startDate.getDate();
	var endYear = this.endDate.getFullYear();
	var endMonth = this.endDate.getMonth();
	var endDay = this.endDate.getDate();
	for(var type in this.sliders){
		for(var i=0; i<this.sliders[type].length; ++i){
			var descriptor = this.id+type+"sliderItem"+i;
			if(type == "Year"){
				if(this.sliders[type][i] < startYear || this.sliders[type][i] > endYear){
					$("#"+descriptor).addClass("disabledItem");
				}
				else {
					$("#"+descriptor).removeClass("disabledItem");					
				}
			}
			if(type == "Month"){
				if( (curr.getFullYear() == startYear && i < startMonth ) || (curr.getFullYear() == endYear && i > endMonth) ){
					$("#"+descriptor).addClass("disabledItem");
				}
				else {
					$("#"+descriptor).removeClass("disabledItem");										
				}
			}
			if(type == "Day"){
				if( (this.sliders[type][i] > this.months[curr.getMonth()]) || (curr.getFullYear() == startYear && curr.getMonth() == startMonth && this.sliders[type][i] < startDay) ||  (curr.getFullYear() == endYear && curr.getMonth() == endMonth && this.sliders[type][i] > endDay) ){
					$("#"+descriptor).addClass("disabledItem");
				}
				else {
					$("#"+descriptor).removeClass("disabledItem");										
				}
			}
		}
	}
  
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









