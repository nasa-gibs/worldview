SOTE.namespace("SOTE.widget.Events");

SOTE.widget.Events.prototype = new SOTE.widget.Component;

/**
 * Instantiate the Events widget. 
 */
SOTE.widget.Events = function(containerId, config){
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
	this.init();
}

SOTE.widget.Events.prototype.buildMeta = function() {
	//console.log("events: buildMeta");
	this.buildMetaDone = false;
	// TODO: get JSON
	SOTE.widget.Events.handleMetaSuccess(this);
};

SOTE.widget.Events.handleMetaSuccess = function(arg) {
	//console.log("events: handleMetaSuccess");
	var self = arg;
	
	// TODO: replace with actual JSON data
	// for now, hardcode 4 entries to play with
	var eTitle = "Tropical Cyclone Mahasen";
	var eLink = "http://earthobservatory.nasa.gov/NaturalHazards/view.php?id=81117&amp;src=nhrss";
	var eCategory = "Severe Storms";
	var eImage = "http://eoimages.gsfc.nasa.gov/images/imagerecords/81000/81117/mahasen_amo_2013133.jpg";
	var eDescription = "Mahasen formed as a tropical storm over the northern Indian Ocean on May 10, 2013.";
	var eTime = "2013-05-13";
	var ePoint = "44.355 60.463";
	var eGeoTiff = "http://eoimages.gsfc.nasa.gov/images/imagerecords/81000/81117/mahasen_amo_2013133_geo.tif";
	var eSatellite = "Terra";
	var eInstr = "MODIS";
	self.meta[0] = {title:eTitle,
					link:eLink,
					category:eCategory,
					image:eImage,
					description:eDescription,
					date:eTime,
					point:ePoint,
					geo:eGeoTiff,
					sat:eSatellite,
					instr:eInstr
					};
	
	eTitle = "Dust Plumes off Argentina";
	eLink = "http://earthobservatory.nasa.gov/NaturalHazards/view.php?id=81120&amp;src=nhrss";
	eCategory = "Dust, Smoke, and Haze";
	eImage = "http://eoimages.gsfc.nasa.gov/images/imagerecords/81000/81120/argentina_amo_2013132.jpg";
	eDescription = "Dust plumes blew out of southern Argentina and over the Atlantic Ocean in early May 2013.";
	eTime = "2013-05-12";
	ePoint = "55.418 -161.892";
	eGeoTiff = "http://eoimages.gsfc.nasa.gov/images/imagerecords/81000/81120/argentina_amo_2013132_geo.tif";
	eSatellite = "Aqua";
	eInstr = "MODIS";
	self.meta[1] = {title:eTitle,
					link:eLink,
					category:eCategory,
					image:eImage,
					description:eDescription,
					date:eTime,
					point:ePoint,
					geo:eGeoTiff,
					sat:eSatellite,
					instr:eInstr
					};
	
	eTitle = "Burning Fields near the Angara River";
	eLink = "http://earthobservatory.nasa.gov/NaturalHazards/view.php?id=81115&amp;src=nhrss";
	eCategory = "Fires";
	eImage = "http://eoimages.gsfc.nasa.gov/images/imagerecords/81000/81115/Russia_amo_2013130.0555.jpg";
	eDescription = "Numerous fires were burning when the Moderate Resolution Imaging Spectroradiometer (MODIS) instrument on NASA’s Aqua satellite passed over the Irkutsk region on May 10, 2013.";
	eTime = "2013-05-10";
	ePoint = "55.418 -161.892";
	eGeoTiff = "http://eoimages.gsfc.nasa.gov/images/imagerecords/81000/81115/russia_amo_2013130_fires_geo.tif";
	eSatellite = "Aqua";
	eInstr = "MODIS";
	self.meta[2] = {title:eTitle,
					link:eLink,
					category:eCategory,
					image:eImage,
					description:eDescription,
					date:eTime,
					point:ePoint,
					geo:eGeoTiff,
					sat:eSatellite,
					instr:eInstr
					};
	
	eTitle = "Dust Storm on the Arabian Peninsula";
	eLink = "http://earthobservatory.nasa.gov/NaturalHazards/view.php?id=81092&amp;src=nhrss";
	eCategory = "Dust, Smoke, and Haze";
	eImage = "http://eoimages.gsfc.nasa.gov/images/imagerecords/81000/81092/sarabia_tmo_2013128.jpg";
	eDescription = "A dust storm blew across the Arabian Peninsula in early May 2013. ";
	eTime = "2013-05-08";
	ePoint = "35.326 -97.482";
	eGeoTiff = "http://eoimages.gsfc.nasa.gov/images/imagerecords/81000/81092/sarabia_tmo_2013128_geo.tif";
	eSatellite = "Terra";
	eInstr = "MODIS";
	self.meta[3] = {title:eTitle,
					link:eLink,
					category:eCategory,
					image:eImage,
					description:eDescription,
					date:eTime,
					point:ePoint,
					geo:eGeoTiff,
					sat:eSatellite,
					instr:eInstr
					};
	
	eTitle = "Springs Fire, California";
	eLink = "http://earthobservatory.nasa.gov/NaturalHazards/view.php?id=81049&amp;src=nhrss";
	eCategory = "Fires";
	eImage = "http://eoimages.gsfc.nasa.gov/images/imagerecords/81000/81049/California_tmo_2013122.jpg";
	eDescription = "Fueled by hot, dry Santa Ana winds, several wildfires started in southern California in early May 2013.";
	eTime = "2013-05-02";
	ePoint = "35.326 -97.482";
	eGeoTiff = "http://eoimages.gsfc.nasa.gov/images/imagerecords/81000/81049/california_tmo_2013122_fires_geo.tif";
	eSatellite = "Terra";
	eInstr = "MODIS";
	self.meta[4] = {title:eTitle,
					link:eLink,
					category:eCategory,
					image:eImage,
					description:eDescription,
					date:eTime,
					point:ePoint,
					geo:eGeoTiff,
					sat:eSatellite,
					instr:eInstr
					};
					
	self.metaLength = 5;
	
	self.render();
	self.fire();
	this.buildMetaDone = true;
};

SOTE.widget.Events.prototype.init = function() {
	//console.log("events: init");
	this.buildMeta();
	
	if(REGISTRY) {
		REGISTRY.register(this.id, this);
	}
	else {
		alert("No REGISTRY found!  Cannot register Events!");
	}
	
};

SOTE.widget.Events.prototype.render = function() {
	this.container.innerHTML = "";
	
	//var holder = document.createElement("div");
	//holder.setAttribute("id", "eventsHolder");
	
	var container = document.createElement("div");
	container.setAttribute("id", "events");
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
	//holder.appendChild(container);
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
	
	$('#eventList').delegate('li', 'click', function (e) {
		
    	if($('#'+this.id).hasClass('sel')) {
    		// unselect the item if something other than the link was clicked
    		if(e.target.tagName != "A") {
    			$('#'+this.id).removeClass('sel');
    			this.innerHTML = this.basicHTML;
    		}
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
    		var link = "";
    		if(meta[ind].sat === "Terra") {
    			link = "products=baselayers,MODIS_Terra_CorrectedReflectance_TrueColor";
    		}
    		else if(meta[ind].sat === "Aqua") {
    			link = "products=baselayers,MODIS_Aqua_CorrectedReflectance_TrueColor";
    		}
    		link += "&time="+meta[ind].date;
   
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
	
	// set up toggler
	var accordionToggler = document.createElement("a");
	accordionToggler.setAttribute("class","evaccordionToggler evcollapse");
	accordionToggler.setAttribute("title","Hide Events");
	this.isCollapsed = false;
	this.container.appendChild(accordionToggler);
	$('.evaccordionToggler').bind('click',{self:this},SOTE.widget.Events.toggle);
	
	// set up scroll bar
	$("#eventList").mCustomScrollbar({horizontalScroll:false, advanced:{
        updateOnContentResize: true
    }});
	
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
	//console.log("events: fire");
	if(REGISTRY){
		REGISTRY.fire(this, null);
	}
	else{
		alert("No REGISTRY found! Cannot fire to REGISTRY from Bank!");
	}

};

/**
 * Collapses and expands the events feature 
 */
SOTE.widget.Events.toggle = function(e,ui){
	var self = e.data.self;
	if(self.isCollapsed){
		$('.evaccordionToggler').removeClass('evexpand').addClass('evcollapse');
		$('.evaccordionToggler').attr("title","Hide Events");
		$('.events').css('display','block');
		self.isCollapsed = false;
	}
	else{
		$('.evaccordionToggler').removeClass('evcollapse').addClass('evexpand');
		$('.evaccordionToggler').attr("title","Show Events");
		$('.events').css('display','none');
		self.isCollapsed = true;
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
	//console.log("events: setStatus");
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
	//console.log("events: getStatus");
	return this.statusStr;
};