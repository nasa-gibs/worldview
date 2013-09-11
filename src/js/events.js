SOTE.namespace("SOTE.widget.Events");

SOTE.widget.Events.prototype = new SOTE.widget.Component;

/**
 * Instantiate the Events widget. 
 */
SOTE.widget.Events = function(containerId, config) {
	//console.log("instantiating events");
	
	this.container = document.getElementById(containerId);
	if(this.container == null){
		this.setStatus("Error: element '" + containerId + "' not found!", true);
		//console.log("Error: element '" + containerId + "' not found!");
		return;
	}
	
	// store the container's ID
	this.id = containerId;
	this.containerId = containerId;
	
	// define an object for holding configuration
	if (config === undefined){
		config = {};
	}
	
	if (config.title === undefined){
		config.title = "Events";
	}
	
	this.title = config.title;
	this.mapWidget = config.mapWidget;
	this.paletteWidget = config.paletteWidget;
	this.switchWidget = config.switchWidget;
	this.bankWidget = config.bankWidget;
	this.dateWidget = config.dateWidget;
	this.apcmWidget = config.apcmWidget;
	this.wvOpacity = config.wvOpacity;
	this.wvEPSG = config.wvEPSG;
	this.meta = new Object;
	this.buildMetaDone = false;
	this.initRenderComplete = false;
	this.statusStr = "";
	this.config = config.config;
	this.isCollapsed = false;
	this.initCollapsed = config.shouldCollapse;
	this.lastVisit = config.lastVisit;
	this.init();
	
	
	//console.log("render complete = " + this.initRenderComplete);
	//if(config.shouldCollapse){
	//	this.collapse();
	//}
};

/**
 * Get the JSON events data 
 */
SOTE.widget.Events.prototype.buildMeta = function() {
	this.buildMetaDone = false;
	var metaData;
	self = this;

    var endpoint = "var/events_data.json";
    if ( this.config.parameters.mockEvents ) {
        endpoint = "mock/events_data.json";
        if ( this.config.parameters.mockEvents !== "true" ) {
            endpoint = endpoint + "-" + this.config.parameters.mockEvents;
        }
    }
	$.getJSON(endpoint, function(data) {
		metaData = data;
	}).success(function(){
		SOTE.widget.Events.handleMetaSuccess(self, metaData);
	});
};

/**
 * Parse the JSON data 
 */
SOTE.widget.Events.handleMetaSuccess = function(arg, data) {
	var self = arg;
	var lastVisit = self.lastVisit;
	self.metaLength = data.length;
	self.numNew = 0;
	for(var i = 0; i < self.metaLength; i++) {
		var item = data[i];
		
		// if the last visit came before the event, mark the event as new
		var dateStr = item.date + "T00:00:00-04:00";
		var dateObj = new Date(dateStr);
		var isNew = false;
		
		if(lastVisit < dateObj) {
			isNew = true;
			self.numNew++;
		}
		
		self.meta[i] = {title:item.title,
					    link:item.link,
					    category:item.category,
					    image:item.thumbnail,
					    description:item.description,
					    date:item.date,
					    sat:item.satellite,
					    instr:item.instrument,
					    north:item.north,
					    south:item.south,
					    east:item.east,
					    west:item.west,
					    keyword:item.keyword,
					    isNew:isNew
					   };
	}
	console.log("orig num new = " + self.numNew);
	self.render();
	self.fire();
	self.buildMetaDone = true;
};

/**
 * Initialize the Events widget 
 */
SOTE.widget.Events.prototype.init = function() {
	this.buildMeta();
	
	if(REGISTRY) {
		REGISTRY.register(this.id, this);
	}
	else {
		alert("No REGISTRY found!  Cannot register Events!");
	}
};

/**
 * Render the Events widget 
 */
SOTE.widget.Events.prototype.render = function() {
	
	this.container.innerHTML = "";

	var container = document.createElement("div");
	container.setAttribute("id", "events");
	container.setAttribute("class", "events categoryContainer");
	
	var titleContainer = document.createElement("div");
	var title = document.createElement("h2");
	title.innerHTML = "Recent Events";
	titleContainer.setAttribute("class", "header");
	titleContainer.appendChild(title);
	container.appendChild(titleContainer);
	
	var entryList = document.createElement("ul");
	entryList.setAttribute("id", "eventList");
	entryList.setAttribute("class",this.id+"category entry category");
	
	// assign a basic and detail description to each element
	for(var i = 0; i < this.metaLength; i++) {
		var item = document.createElement("li");
		item.setAttribute("id", "ev" + i);
		item.setAttribute("class", "item");
		
		if(this.meta[i].isNew) {
			item.setAttribute("class", "item newevent");
		}
		
		item.innerHTML = "<table>" + 
		                       "<tr>" + 
		                           "<td rowspan='2'> <img class='thumb' width='32px' height='32px' src='" + this.meta[i].image +"'/></td>"+
		                           "<td style='padding-left:5px'><h4>" + this.meta[i].title +"</h4></td>"+
		                       "</tr>"+
		                       "<tr>" +
		                           "<td style='padding-left:5px'><p>" + this.meta[i].date +"</p></td>"+
		                       "</tr>"+
		                   "</table>";
		item.basicHTML = item.innerHTML;
		
		item.detailHTML = "<table>" + 
		                       "<tr>" + 
		                           "<td rowspan='2'> <img class='thumb' width='45px' height='45px' src='" + this.meta[i].image +"'/></td>"+
		                           "<td><h4>" + this.meta[i].title +"</h4></td>"+
		                       "</tr>"+
		                       "<tr>" +
		                           "<td><p>" + this.meta[i].date +"</p></td>"+
		                       "</tr>"+
		                       "<tr>" +
		                           "<td colspan='2' style='padding-left:5px'></br><p>" + this.meta[i].description +"</p></td>"+
		                       "</tr>"+
		                       "<tr>" +
		                           "<td colspan='2' style='padding-left:5px; text-align'center'></br><a href=\"" + this.meta[i].link + "\" target=\"_blank\">See Full Story on Earth Observatory</a></td>"+
		                       "</tr>"+
		                   "</table>";

		entryList.appendChild(item);
	}

	container.appendChild(entryList);
	this.container.appendChild(container);
	
	var meta = this.meta;
	var m = this.mapWidget;
	var palettes = this.paletteWidget;
	var ss = this.switchWidget;
	var p = this.bankWidget;
	var map = this.dateWidget;
	var apcn = this.apcmWidget;
	var opacity = this.wvOpacity;
	var epsg = this.wvEPSG;
	
	$('#eventList').delegate('li', 'click', {self:this}, SOTE.widget.Events.toggleDescription);
	
	// set up toggler
	var accordionToggler = document.createElement("a");
	accordionToggler.setAttribute("class","evaccordionToggler evcollapse");
	accordionToggler.setAttribute("title","Hide Events");

	this.isCollapsed = false;
	this.container.appendChild(accordionToggler);
	$('.evaccordionToggler').bind('click',{self:this},SOTE.widget.Events.toggle);
	console.log(this.top);
	// set up scroll bar
    if($(window).width() > 720)
	{
		if(this.jsp){
			var api = this.jsp.data('jsp');
			if(api) api.destroy();
		}	
		this.jsp = $( "." + this.id + "category" ).jScrollPane({autoReinitialise: false, verticalGutter:0});
	}
	
	if(this.initCollapsed) {
		this.toggle(this.numNew);
	}
	
	// mark the component as ready in the registry if called via init()
	if((this.initRenderComplete === false) && REGISTRY) {
		this.initRenderComplete = true;
		REGISTRY.markComponentReady(this.id);
	}

};

/**
  * Fires an event to the registry when the state of the component is changed
  *
  * @this {Events}
  *
*/
SOTE.widget.Events.prototype.fire = function(){
	setTimeout(SOTE.widget.Events.reinitializeScrollbars,1,{self:this});
	$("#"+this.id).trigger("fire");

	if(REGISTRY){
		REGISTRY.fire(this,this.noFireVal);
		this.noFireVal = null;
	}
	else{
		alert("No REGISTRY found! Cannot fire to REGISTRY from Bank!");
	} 
};

/**
 * Adjusts the scrollbar when an entry is expanded or collapsed
 */
SOTE.widget.Events.reinitializeScrollbars = function(o) {
	var pane = $("." + o.self.id + "category").each(function(){
    	var api = $(this).data('jsp');
    	if(api) api.reinitialise();
	});  
};

SOTE.widget.Events.repositionScrollbars = function(o, target) {
	var pane = $("." + o.id + "category").each(function(){
    	var api = $(this).data('jsp');
    	if(api) {
			var p = document.getElementById(target.id);
			api.reinitialise();
    		api.scrollToY(p.offsetTop, false);
    	}
	}); 
};

/**
 * Collapses and expands the events feature.
 */
SOTE.widget.Events.toggle = function(e,ui){
	console.log("object toggle");
	var self = e.data.self;
	self.toggle(self.numNew);
};

SOTE.widget.Events.prototype.toggle = function(numNew) {
	console.log("prototype toggle - starting " + this.isCollapsed);
	if(this.isCollapsed){
		$('.evaccordionToggler').removeClass('evexpand').addClass('evcollapse');
		$('.evaccordionToggler').attr("title","Hide Events");
		$('.evaccordionToggler').html("");
		$('#eventsHolder').animate({right:'0'}, 300);
		this.isCollapsed = false;
		$('.evaccordionToggler').appendTo("#eventsHolder");
	}
	else{
		$('.evaccordionToggler').removeClass('evcollapse').addClass('evexpand');
		$('.evaccordionToggler').attr("title","Show Events");
		$('.evaccordionToggler').html("New("+ numNew +")");
		$('#eventsHolder').animate({right:'-210px'}, 300);
		this.isCollapsed = true;
		$("#eventsHolder").after($('.evaccordionToggler'));
	} 	

};

/**
 * Toggles the detail description of a story 
 */
SOTE.widget.Events.toggleDescription = function(e) {
	var self = e.data.self;
	if($('#'+this.id).hasClass('sel')) {
    	// unselect the item if something other than the link was clicked
    	if(e.target.tagName != "A") {
    		$('#'+this.id).removeClass('sel');
    		this.innerHTML = this.basicHTML;
    	}
    }
    else {
    	var meta = self.meta;
		var m = self.mapWidget;
		var palettes = self.paletteWidget;
		var ss = self.switchWidget;
		var p = self.bankWidget;
		var map = self.dateWidget;
		var apcn = self.apcmWidget;
		var opacity = self.wvOpacity;
		var epsg = self.wvEPSG;
	
    	// select the event
    	var oldEl = $('.events .sel');
    	if(oldEl[0] != null) {
    		console.log(oldEl[0]);
    		oldEl[0].innerHTML = oldEl[0].basicHTML;
    		$('.events .sel').removeClass('sel');
    	}
    	$('#'+this.id).addClass('sel');
    	this.innerHTML = this.detailHTML;
    		
    	// get event index
    	var all = $('#eventList li');
    	var ind = all.index(this);
    	
    	// if event was new, make it not new anymore
    	if(meta[ind].isNew) {
    		meta[ind].isNew = false;
    		$('#' + this.id).removeClass('newevent');
    		self.numNew--;
    	}
    	

    	// generate permalink
    	var extent = meta[ind].west + "," + meta[ind].south + "," + meta[ind].east + "," + meta[ind].north;
    	var prods = "";
    	if(meta[ind].category === "floods") {
    		// if specified, use natural color
    		if(meta[ind].keyword === "natural-color") {
    			if(meta[ind].sat === "Terra") {
    				prods += "baselayers,MODIS_Terra_CorrectedReflectance_TrueColor";
    			}
    			else if(meta[ind].sat === "Aqua") {
    				prods += "baselayers,MODIS_Aqua_CorrectedReflectance_TrueColor";
    			}
    		}
    		// otherwise, default to false color
    		else {
				if(meta[ind].sat === "Terra") {
    				prods += "baselayers,MODIS_Terra_CorrectedReflectance_Bands721";
    			}
    			else if(meta[ind].sat === "Aqua") {
    				prods += "&baselayers,MODIS_Aqua_CorrectedReflectance_Bands721";
    			}
    		}
    	}
    	else {
    		if(meta[ind].sat === "Terra") {
    			prods += "baselayers,MODIS_Terra_CorrectedReflectance_TrueColor";
    		}
    		else if(meta[ind].sat === "Aqua") {
    			prods += "baselayers,MODIS_Aqua_CorrectedReflectance_TrueColor";
    		}
    	}
    	prods += "~overlays";
    	if(meta[ind].keyword === "outlines") {
    		if(meta[ind].sat === "Terra") {
    			prods += ",MODIS_Fires_Terra";
    		}
    		else if(meta[ind].sat === "Aqua") {
    			prods += ",MODIS_Fires_Aqua";
    		}
    	}
    	prods += ",!sedac_bound";
   
    	var initOrder = [
           	ss, // projection
           	p.b, // products
           	map, // time
           	m, // map
           	palettes,
           	apcn,
           	opacity,
           	epsg
        ];
        
      
    var centerlon = parseInt(meta[ind].west) + ((parseInt(meta[ind].east) - parseInt(meta[ind].west)) / 2);
    var centerlat = parseInt(meta[ind].south) + ((parseInt(meta[ind].north) - parseInt(meta[ind].south)) / 2);
    var lonlat = OpenLayers.LonLat.fromArray([centerlon, centerlat]);

	var currentMap = m.maps.map;
    var rawextent = OpenLayers.Bounds.fromString(extent);
 	var targetZoom = currentMap.getZoomForExtent(rawextent, true);
 	 
 	var zoomToEventExtent = function() {
 		console.log("zooming to extent");
      	currentMap.events.unregister("maploadend", currentMap, zoomToEventExtent);
      	
		//if(targetZoom != currentMap.getZoom()) {
		//while(targetZoom != currentMap.getZoom()) {
			//currentMap.zoomIn();
			//currentMap.events.register("maploadend", currentMap, zoomToEventExtent);
			currentMap.zoomToExtent(rawextent, true);
			//currentMap.panTo(lonlat);
		//}
		//if(targetZoom != currentMap.getZoom()) {
		//	currentMap.zoomIn();
		//	currentMap.panTo(lonlat);
		//	setTimeout(zoomToEventExtent, 500);
		//}
 	};
 	
 	var panToEventCenter = function() {
 		console.log("panning to event center");
 		currentMap.events.unregister("maploadend", currentMap, panToEventCenter);
 		
 		//if something needs to be loaded, wait for it.  else, move on.
 		console.log("lonlat = " + lonlat);
 		console.log("center = " + currentMap.center);
      	if(lonlat !== currentMap.center) {
      		console.log("need to wait");
      		//currentMap.events.register("maploadend", currentMap, zoomToEventExtent);
      		currentMap.panTo(lonlat);
      		setTimeout(zoomToEventExtent, 1500);
      	}
      	else {
      		console.log("not waiting");
      		zoomToEventExtent();
      	}
 	};
 	 	
 	var setEventProducts = function() {
		console.log("setting event products");
      	currentMap.events.unregister("maploadend", currentMap, setEventProducts);
      	var currentProds = p.b.getValue().replace("baselayers,", "").replace("~overlays", "").replace("products=", "").replace("!","").split(",");
      	var newProds = prods.replace("baselayers,", "").replace("!","").replace("~overlays", "").split(",");
		console.log("currentProds = " + currentProds);
		console.log("newProds = " + newProds);
		// determine whether anything new will need to load
      	var matches = 0;
      	for(var i = 0; i < newProds.length; i++) {
      		if(currentProds.indexOf(newProds[i]) !== -1) {
      			matches++;
      		}
      	}
		
		//if something needs to be loaded, wait for it.  else, move on.
      	if(matches != newProds.length) {
      		currentMap.events.register("maploadend", currentMap, panToEventCenter);
      		p.b.setValue(prods);
      	}
      	else {
      		p.b.setValue(prods);
      		panToEventCenter();
      	}
    };

 	var setEventDate = function() {
 		console.log("setting event date");
      	currentMap.events.unregister("maploadend", currentMap, setEventDate);
      	var curDate = map.getValue();
      	
      	// if something needs to be loaded, wait for it.  else, move on.
      	if(curDate.indexOf(meta[ind].date, curDate.length - meta[ind].date.length) === -1) {
      		currentMap.events.register("maploadend", currentMap, setEventProducts);
      		map.setValue(meta[ind].date);
      	}
		else {
			setEventProducts();
		}
 	};

 	if(currentMap.getZoom() != 1) {
 		currentMap.events.register("maploadend", currentMap, setEventDate);
  		currentMap.zoomTo(1);
    }
	else {
		setEventDate();
	}
    }
    self.fire();
    SOTE.widget.Events.repositionScrollbars(self, this);
};

/**
  * Sets the status of the component
  *
  * @this {Events}
  * @param {String} s the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.Events.prototype.setStatus = function(s){
	this.statusStr = s;
}; 

/**
  * Gets the status of the component
  *
  * @this {Events}
  * @returns {String} the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.Events.prototype.getStatus = function(){
	return this.statusStr;
};

SOTE.widget.Events.prototype.getValue = function() {};


