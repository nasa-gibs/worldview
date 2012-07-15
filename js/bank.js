SOTE.namespace("SOTE.widget.Bank"); 

SOTE.widget.Bank.prototype = new SOTE.widget.Component;

/**
  * Instantiate the Bank  
  *
  * @class A selection device classifying radio buttons/checkboxes into categories that are displayed in Accordion form.
  *     Radio buttons allow single selection accross categories.  Checkboxes allow multiple selections accross categories.
  * 	Radio selections cannot span multiple categories.
  * @constructor
  * @this {Bank}
  * @param {String} containerId is the container id of the div in which to render the object 
  * @param {Object} [config] is a hash allowing configuration of this component
  * @config {Object[]} [items] a JS Array of JS Objects: items.category[i..n].key, items.category[i..n].value 
  *     , items.category[i..n].action, items.type[i..n] representing the available options
  * @config {String} [selected] the key of the initially selected option(s)
  * @augments SOTE.widget.Component
  * 
*/
SOTE.widget.Bank = function(containerId, config){
	//Get the ID of the container element
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

	if(config.title === undefined){
	    config.title = "My Bank";
	}

	if(config.categories === undefined){
	    config.categories = ["Category 1","Category 2"]; 
	}

	if(config.callback === undefined){
	    config.callback = null; 
	}

	if(config.state === undefined){
		config.state = "geographic";
	}

       
    this.values = null;
    this.state = config.state;
	this.selected = config.selected;
    this.dataSourceUrl = config.dataSourceUrl;
    this.title = config.title;
    this.callback = config.callback;
    this.selector = config.selector;
    this.meta = new Object;
    this.buildMetaDone = false;
    /*this.meta["MODIS_Terra_CorrectedReflectance_TrueColor"] = {label:"Corrected Reflectance (True Color)",sublabel:"Terra / MODIS"};
    this.meta["fires48"] = {label:"Fires (Past 48 Hours)",sublabel:"MODIS Fire and Thermal Anomalies"};
    this.meta["AIRS_Dust_Score"] = {label:"Dust Score",sublabel:"Aqua / AIRS"};
    this.meta["OMI_Aerosol_Index"] = {label:"Aerosol Index",sublabel:"Aura / OMI"};*/
    this.categories = config.categories;
	this.initRenderComplete = false;
	this.dataSourceUrl = config.dataSourceUrl;
	this.statusStr = "";
	this.init();
	//this.updateComponent(this.id+"=baselayers.MODIS_Terra_CorrectedReflectance_TrueColor-overlays.fires48.AIRS_Dust_Score.OMI_Aerosol_Index")

}

SOTE.widget.Bank.prototype.buildMeta = function(cb,val){
	SOTE.util.getJSON(
		"data/" + this.state + "_" + this.dataSourceUrl,
		{self:this,callback:cb,val:val},
		SOTE.widget.Bank.handleMetaSuccess,
		SOTE.widget.Bank.handleUpdateFailure
	);
};

SOTE.widget.Bank.handleMetaSuccess = function(data,status,xhr,args){
	var self = args.self;
	for(var i in data){
		for(var j=0; j<data[i].length; j++){
			self.meta[data[i][j].value] = {label:data[i][j].label,sublabel:data[i][j].sublabel};
		}
	}

	if(args.callback){
		args.callback({self:self,val:args.val});
	}
	else{
		self.values = null;
		self.values = self.unserialize(self.selected[self.state]);
		self.render();
		self.fire();
	}
	self.buildMetaDone = true;
};

/**
  * Displays all options in HTML in an Accordion format (see JQuery UI Accordion) with the selected states being indicated
  * by radio button and checkbox selection.  All callbacks should be set.  The component UI should be rendered 
  * with controllers to call the events.
  *
  *  
  * @this {Bank}
  * 
*/
SOTE.widget.Bank.prototype.init = function(){
	
	this.buildMeta();
	
    if(REGISTRY){
 		REGISTRY.register(this.id,this);
	}
	else{
		alert("No REGISTRY found!  Cannot register Bank!");
	}
	
	
};

/**
  * Renders the UI accordion from this.items
  *
  *  
  * @this {Bank}
  * 
*/
SOTE.widget.Bank.prototype.render = function(){

	this.container.innerHTML = "";

	//$('#'+this.id).addClass('bank');
	var container = document.createElement("div");
	container.setAttribute("class","bank");
	
	var titleContainer = document.createElement("div");
	var title = document.createElement("h2");
	title.innerHTML = this.title;
	var ext = document.createElement("a");
	ext.setAttribute("id","callSelectorLink");
	ext.setAttribute("class","callSelectorLink")
	
	titleContainer.appendChild(title);
	titleContainer.appendChild(ext);
	
	container.appendChild(titleContainer);
	
	$('#'+this.id).delegate('.callSelectorLink','click',{selector:this.selector},this.callback);

	
	for(var i=0; i<this.categories.length; i++){
		var formattedCategoryName = this.categories[i].replace(/\s/g, "");
		var category = document.createElement("ul");
		category.setAttribute("id",formattedCategoryName.toLowerCase());
		category.setAttribute("class",this.id+"category category");
		var categoryTitleEl = document.createElement("li");
		var categoryTitle = document.createElement("h3");
		categoryTitle.setAttribute("class","head");
		categoryTitle.innerHTML = this.categories[i];
		categoryTitleEl.appendChild(categoryTitle);
		category.appendChild(categoryTitleEl);
		
		if(this.values !== null && this.values[formattedCategoryName.toLowerCase()]){
			for(var j=0; j<this.values[formattedCategoryName.toLowerCase()].length; j++){
				var item = document.createElement("li");
				item.setAttribute("id",formattedCategoryName.toLowerCase()+"-"+this.values[formattedCategoryName.toLowerCase()][j].value);
				item.setAttribute("class",this.id+"item item");
				item.innerHTML = "<a><img class='close' id='"+this.values[formattedCategoryName.toLowerCase()][j].value.replace(/:/g,"colon")+"' src='images/close.png' /></a>";
				if(this.meta !== null && this.meta[this.values[formattedCategoryName.toLowerCase()][j].value]){
					item.innerHTML += "<h4>"+this.meta[this.values[formattedCategoryName.toLowerCase()][j].value].label+"</h4>";
					item.innerHTML += "<p>"+this.meta[this.values[formattedCategoryName.toLowerCase()][j].value].sublabel+"</p>";
				}
				else{
					item.innerHTML += "<h4>"+this.values[formattedCategoryName.toLowerCase()][j].value+"</h4>";
				}
				category.appendChild(item);
			}
		}
		
		container.appendChild(category);
	}
	this.container.appendChild(container);
	var accordionToggler = document.createElement("a");
	accordionToggler.setAttribute("class","accordionToggler atcollapse");
	this.isCollapsed = false;
	this.container.appendChild(accordionToggler);
	$('.accordionToggler').bind('click',{self:this},SOTE.widget.Bank.toggle);
	$("#"+this.id).delegate(".close" ,'click',{self:this},SOTE.widget.Bank.removeValue);
	$( "." + this.id + "category" ).sortable({items: "li:not(.head)"});	
	$( "." + this.id + "category li" ).disableSelection();	
	$( "." + this.id + "category" ).bind('sortstop',{self:this},SOTE.widget.Bank.handleSort);
	// Mark the component as ready in the registry if called via init() 
	if ((this.initRenderComplete === false) && REGISTRY) {
		this.initRenderComplete = true;
		REGISTRY.markComponentReady(this.id);
	}
	
};

SOTE.widget.Bank.toggle = function(e,ui){
	var self = e.data.self;
	if(self.isCollapsed){
		$('.accordionToggler').removeClass('atexpand').addClass('atcollapse');
		$('.accordionToggler').attr("title","Hide Products");
		$('.bank').css('display','block');
		self.isCollapsed = false;
	}
	else{
		$('.accordionToggler').removeClass('atcollapse').addClass('atexpand');
		$('.accordionToggler').attr("title","Show Products");
		$('.bank').css('display','none');
		self.isCollapsed = true;
	} 	
};

SOTE.widget.Bank.handleSort = function(e,ui){
	var self = e.data.self;
	self.values = new Object;
	for(var i=0; i<self.categories.length; i++){
		var formatted = self.categories[i].replace(/\s/g, "");
		formatted = formatted.toLowerCase();
		self.values[formatted] = new Array();
		jQuery('li[id|="'+formatted+'"]').each(function() {
        	var item = jQuery( this );
        	var id = item.attr("id");
        	var vals = id.split("-");
        	var val = vals.splice(0,1);
        	val = vals.join("-");
        	self.values[formatted].push({value:val});
    	});
	}
	self.fire();
	
};

SOTE.widget.Bank.removeValue = function(e){
	var self = e.data.self;
	var val = e.target.id.replace(/colon/g,":");
	for(var i=0; i<self.categories.length; i++){
		var formatted = self.categories[i].replace(/\s/g, "");
		formatted = formatted.toLowerCase();
		for(var j=0; j<self.values[formatted].length; j++){
			if(self.values[formatted][j].value == val){
				self.values[formatted].splice(j,1);
			}	
		}
	}
	var formattedVal = val.replace(/:/g,"colon");
	//self.render();
	$("#"+self.id+" #"+formattedVal).parent().parent().remove();
	self.fire();
};

/**
  * Fires an event to the registry when the state of the component is changed
  *
  * @this {Bank}
  *
*/
SOTE.widget.Bank.prototype.fire = function(){

	if(REGISTRY){
		REGISTRY.fire(this);
	}
	else{
		alert("No REGISTRY found! Cannot fire to REGISTRY from Bank!");
	}

};

/**
  * Sets the selected option(s) in the Bank from the passed in value(s), if valid 
  *     [containerId]=[options] (options is a dot delimited string with the first item containing
  *     a single select item, and the remaining items containing the multi-select items).
  *
  * @this {Bank}
  * @param {String} value is a dot delimited string of the key(s) of the option(s) to be set as selected
  * @returns {boolean} true or false depending on if the new value(s) validates
  *
*/
SOTE.widget.Bank.prototype.setValue = function(valString){

	this.values = this.unserialize(valString);
	this.render();
	this.fire();
	
};

/**
  * Gets the currently selected option(s) [containerId]=[options]
  *
  * @this {Bank}
  * @returns {String} [container]=[options], options being a dot delimited string 
  *     representing the key(s) of the currently selected option(s)
  *
*/
SOTE.widget.Bank.prototype.getValue = function(){
		
	var value = this.serialize(this.values);
	return this.id + "=" + value;
};

SOTE.widget.Bank.prototype.serialize = function(values){
	var serialized = "";
	for(var i=0; i<this.categories.length; i++){
		if(i > 0){
			serialized += "~";
		}
		var formatted = this.categories[i].replace(/\s/g, "");
		formatted = formatted.toLowerCase();

		serialized += formatted;
		if(values[formatted]){
			for(var j=0; j<values[formatted].length; j++){
				serialized += "." + values[formatted][j].value;
			}
		}
	}
	return serialized;
};

SOTE.widget.Bank.prototype.unserialize = function(string){
	var unserialized = new Object;
	var categories = string.split("~");
	for(var i=0; i<categories.length; i++){
		var items = categories[i].split(".");
		unserialized[items[0]] = new Array;
		for(var j=1; j<items.length; j++){
			unserialized[items[0]].push({"value":items[j]});
		}
		
	}
	return unserialized;
};

/**
  * Change the component based on dependencies (i.e. Available Options, Selected)
  * 
  * @this {Bank}
  * @param {String} querystring contains all values of dependencies (from registry)
  * @returns {boolean} true or false depending on if the selected value still validats with criteria change
  * 
*/
SOTE.widget.Bank.prototype.updateComponent = function(querystring){
	var qs = (querystring === undefined)? "":querystring;
	/*SOTE.util.getJSON(
		this.dataSourceUrl+"?"+querystring,
		{self:this,qs:querystring},
		SOTE.widget.Bank.handleUpdateSuccess,
		SOTE.widget.Bank.handleUpdateFailure
	);*/
	SOTE.widget.Bank.handleUpdateSuccess(this,qs);
};

/**
  * Static function to handle a successful retrieval from the data accessor
  * 
  * @this {Bank}
  * @param {Object,String,Object,Object} data is the data passed back from the call, status is the response status, xhr is the applicable xmlhttprequest object, args are the custom arguments passed
  * 
*/
SOTE.widget.Bank.handleUpdateSuccess = function(self,qs){
	/*var expanded = SOTE.util.extractFromQuery("hazard",args.qs);
	data.expanded = (expanded !== undefined && expanded !== "" && expanded !== null)? expanded:data.expanded;
	data.selected = (data.selected === undefined || data.selected === "")? SOTE.util.extractFromQuery(args.self.id,args.self.getValue()):data.selected;*/
	if(SOTE.util.extractFromQuery("switch",qs) == self.state){
		var vals = SOTE.util.extractFromQuery("selectorbox",qs)
		self.values = self.unserialize(vals);
		self.render();
		self.fire();
	}
	else {
		self.state = SOTE.util.extractFromQuery("switch",qs);
		self.buildMeta();
	}
};
 
/**
  * Static function to handle a failed retrieval from the data accessor
  * 
  * @this {Bank}
  * @param {Object,String,String,Object} xhr is the applicable xmlhttprequest object, status is the response status, error is the thrown error, args are the custom arguments passed
  * 
*/
SOTE.widget.Bank.handleUpdateFailure = function(xhr,status,error,args){
	alert("Failed to load data accessor: " + error);
};


/**
  * Sets the selected option(s) from the query string [containerId]=[options]
  * 
  * @this {Bank}
  * @param {String} qs contains the querystring
  * @returns {boolean} true or false depending on whether the new option validates
  *
*/
SOTE.widget.Bank.prototype.loadFromQuery = function(qs){
	var newState = SOTE.util.extractFromQuery("switch",qs);
	if(this.state != newState){
		this.state = newState;
		this.buildMeta(SOTE.widget.Bank.loadValue,SOTE.util.extractFromQuery(this.id,qs));
	}
	else {
		this.sleep(SOTE.util.extractFromQuery(this.id,qs));
	}
};

SOTE.widget.Bank.prototype.sleep = function(v){
	setTimeout(SOTE.widget.Bank.loadValue,100,{self:this,val:v});
}

SOTE.widget.Bank.loadValue = function(args){
	if(args.self.buildMetaDone == true){
		args.self.setValue(args.val);
	}
	else {
		args.self.sleep(args.val);
	}
};

/**
  * Validates that the selected option(s) is not null, only one radio button is selected cross category
  * and all options are within the scope of available options
  * 
  * @this {Bank}
  * @returns {boolean} true or false depending on whether the selected option(s) meet the validation criteria
*/
SOTE.widget.Bank.prototype.validate = function(){

	var isValid = true;
    return isValid;

};

/**
  * Sets the data accessor that provides state change instructions given dependencies
  *
  * @this {Bank}
  * @param {String} datasourceurl is the relative location of the data accessor 
  *
*/
SOTE.widget.Bank.prototype.setDataSourceUrl = function(dataSourceUrl){
	this.dataSourceUrl = dataSourceUrl;
};

/**
  * Gets the data accessor
  * 
  * @this {Bank}
  * @returns {String} the relative location of the accessor
  *
*/
SOTE.widget.Bank.prototype.getDataSourceUrl = function(){
	return this.dataSourceUrl;
};

/**
  * Sets the status of the component
  *
  * @this {Bank}
  * @param {String} s the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.Bank.prototype.setStatus = function(s){
	this.statusStr = s;
};

/**
  * Gets the status of the component
  *
  * @this {Bank}
  * @returns {String} the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.Bank.prototype.getStatus = function(){
	return this.statusStr;
};

