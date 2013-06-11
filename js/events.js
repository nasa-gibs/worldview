SOTE.namespace("SOTE.widget.Events");

SOTE.widget.Events.prototype = new SOTE.widget.Component;

/**
 * Instantiate the Events widget. 
 */
SOTE.widget.Events = function(containerId, config){
	console.log("instantiating events");
	
	this.container = document.getElementById(containerId);
	if(this.container == null){
		this.setStatus("Error: element '" + containerId + "' not found!", true);
		console.log("Error: element '" + containerId + "' not found!");
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
	this.init();
}

SOTE.widget.Events.prototype.buildMeta = function() {
	console.log("events: buildMeta");
	this.buildMetaDone = false;
	// TODO: get JSON
	SOTE.widget.Events.handleMetaSuccess(this);
};

SOTE.widget.Events.handleMetaSuccess = function(arg) {
	console.log("events: handleMetaSuccess");
	var self = arg;
	
	// TODO: replace with actual JSON data
	// for now, hardcode 3 entries to play with
	var eTitle = "New Landsat Finds Clouds Hiding in Plain Sight";
	var eLink = "http://earthobservatory.nasa.gov/NaturalHazards/view.php?id=81210&amp;src=nhrss";
	var eCategory = "Crops and Drought/Unique Imagery";
	var eImage = "http://eoimages.gsfc.nasa.gov/images/imagerecords/81000/81210/arasea_oli_2013083_tn.jpg";
	var eDescription = "One of LDCM&rsquo's sensors can detect faint cirrus clouds that can slightly alter a scene.";
	var eTime = "2013-03-24";
	var ePoint = "44.355 60.463";
	self.meta[0] = {title:eTitle,
					link:eLink,
					category:eCategory,
					image:eImage,
					description:eDescription,
					date:eTime,
					point:ePoint};
	
	eTitle = "Pavlof Volcano, Alaska Peninsula";
	eLink = "http://earthobservatory.nasa.gov/NaturalHazards/view.php?id=81205&amp;src=nhrss";
	eCategory = "Volcanoes and Earthquakes";
	eImage = "http://eoimages.gsfc.nasa.gov/images/imagerecords/81000/81205/ISS036-E-002105_tn.jpg";
	eDescription = "Three striking photographs of Pavlof Volcano reveal the three-dimensional structure of the eruption plume.";
	eTime = "2013-05-18";
	ePoint = "55.418 -161.892";
	self.meta[1] = {title:eTitle,
					link:eLink,
					category:eCategory,
					image:eImage,
					description:eDescription,
					date:eTime,
					point:ePoint};
	
	eTitle = "Thunderstorms Spawn Tornado in Oklahoma";
	eLink = "http://earthobservatory.nasa.gov/NaturalHazards/view.php?id=81200&amp;src=nhrss";
	eCategory = "Severe Storms";
	eImage = "http://eoimages.gsfc.nasa.gov/images/imagerecords/81000/81200/moore_goe_2013140_tn.jpg";
	eDescription = "Evolution of deadly storms over Oklahoma, viewed by GOES-East.";
	eTime = "2013-05-20";
	ePoint = "35.326 -97.482";
	self.meta[2] = {title:eTitle,
					link:eLink,
					category:eCategory,
					image:eImage,
					description:eDescription,
					date:eTime,
					point:ePoint};
					
	self.metaLength = 3;
	
	self.render();
	self.fire();
	this.buildMetaDone = true;
};

SOTE.widget.Events.prototype.init = function() {
	console.log("events: init");
	this.buildMeta();
	
	if(REGISTRY) {
		REGISTRY.register(this.id, this);
	}
	else {
		alert("No REGISTRY found!  Cannot register Events!");
	}
	
};

SOTE.widget.Events.prototype.render = function() {
	console.log("events: render");
	console.log("meta[0].title = " + this.meta[0].title);
	console.log("metaLength = " + this.metaLength);
	this.container.innerHTML = "";
	
	var container = document.createElement("div");
	container.setAttribute("class", "events");
	
	var titleContainer = document.createElement("div");
	var title = document.createElement("h2");
	title.innerHTML = "Recent Events";
	titleContainer.setAttribute("class", "header");
	titleContainer.appendChild(title);
	container.appendChild(titleContainer);
	
	var entryList = document.createElement("ul");
	entryList.setAttribute("id", "eventList");
	entryList.setAttribute("class", "entry");
	
	for(var i = 0; i < this.metaLength; i++) {
		var item = document.createElement("li");
		item.setAttribute("id", "ev" + i);
		item.setAttribute("class", "productsitem item");
		item.setAttribute("class", "item");
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
		                           "<td rowspan='2'> <img class='thumb' width='32px' height='32px' src='" + this.meta[i].image +"'/></td>"+
		                           "<td style='padding-left:5px'><h4>" + this.meta[i].title +"</h4></td>"+
		                       "</tr>"+
		                       "<tr>" +
		                           "<td style='padding-left:5px'><p>" + this.meta[i].date +"</p></td>"+
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
	
	$('#eventList').delegate('li', 'click', function () {
		
    	if($('#'+this.id).hasClass('sel')) {
    		// unselect the item
    		$('#'+this.id).removeClass('sel');
    		this.innerHTML = this.basicHTML;
    	}
    	else {
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
    	
    		// generate permalink
    		//TODO: var link = "map="+map+"&products="+products+"&time="+time+"&switch="+s;
    		var link = "time="+meta[ind].date;
   
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
        
            REGISTRY.isLoadingQuery = true;
            $.each(initOrder, function(index, component) {
                component.loadFromQuery(link);    
            });
            REGISTRY.isLoadingQuery = false;
    	}
	});
	
	
	// mark the component as ready in the registry if called via init()
	if((this.initRenderComplete === false) && REGISTRY) {
		this.initRenderComplete = true;
		REGISTRY.markComponentReady(this.id);
	}
}


/**
  * Fires an event to the registry when the state of the component is changed
  *
  * @this {Events}
  *
*/
SOTE.widget.Events.prototype.fire = function(){
	console.log("events: fire");
	if(REGISTRY){
		REGISTRY.fire(this, null);
	}
	else{
		alert("No REGISTRY found! Cannot fire to REGISTRY from Bank!");
	}

};

/**
  * Sets the status of the component
  *
  * @this {Events}
  * @param {String} s the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.Events.prototype.setStatus = function(s){
	console.log("events: setStatus");
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
	console.log("events: getStatus");
	return this.statusStr;
};