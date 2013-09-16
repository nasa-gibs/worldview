SOTE.namespace("SOTE.widget.Selector"); 

SOTE.widget.Selector.prototype = new SOTE.widget.Component;

/**
  * A selection device classifying radio buttons/checkboxes into categories that are displayed in Accordion form.
  *     Radio buttons allow single selection accross categories.  Checkboxes allow multiple selections accross categories.
  *     Radio selections cannot span multiple categories.  
  * 
  * @module SOTE.widget
  * @class Selector
  * @constructor
  * @this {Selector}
  * @param {String} containerId is the container id of the div in which to render the object 
  * @param {Object} [config] is a hash allowing configuration of this component
  * @config {Object[]} [items] a JS Array of JS Objects: items.category[i..n].key, items.category[i..n].value 
  *     , items.category[i..n].action, items.type[i..n] representing the available options
  * @config {String} [selected] the key of the initially selected option(s)
  * @augments SOTE.widget.Component
  * 
*/
SOTE.widget.Selector = function(containerId, config){
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
	
	if(config.categories === undefined){
	    config.categories = ["Category 1","Category 2"]; 
	}

	if(config.state === undefined){
		config.state = "geographic";
	}

    this.state = config.state;

    this.selected = config.selected;
    //this.values = this.unserialize(this.selected[this.state]);
    
    this.meta = new Object;
    this.data = new Object;
    this.categories = config.categories;
    this.cats = new Object;
	this.initRenderComplete = false;
	this.dataSourceUrl = config.dataSourceUrl;
	this.config = config.config;
	this.statusStr = "";
	this.init();
	//this.updateComponent(this.id+"=baselayers.MODIS_Terra_CorrectedReflectance_TrueColor-overlays.fires48.AIRS_Dust_Score.OMI_Aerosol_Index")

};

/**
  * Displays all options in HTML in an Accordion format (see JQuery UI Accordion) with the selected states being indicated
  * by radio button and checkbox selection.  All callbacks should be set.  The component UI should be rendered 
  * with controllers to call the events.
  *
  *  
  * @this {Selector}
  * 
*/
SOTE.widget.Selector.prototype.init = function(){
	
	this.loadData();
	
    if(REGISTRY){
 		REGISTRY.register(this.id,this);
	}
	else{
		alert("No REGISTRY found!  Cannot register Selector!");
	}
	
	
};

SOTE.widget.Selector.prototype.loadData = function(){
    var data = this.config.ap_products[this.state];
    SOTE.widget.Selector.handleLoadSuccess(data, null, null, {
        self: this
    });
};

SOTE.widget.Selector.handleLoadSuccess = function(data,status,xhr,args){
	var self = args.self;
	var dupes = new Object;
	var count = 0;
	
	for(var i in data){
		self.cats[i] = 1;
		if(i != "palettes") {
			
			for(var j=0; j<data[i].length; j++){	
				if(!self.data[data[i][j].category]){
					self.data[data[i][j].category] = new Object;
					self.data[data[i][j].category].title = self.categories[count++];
					self.data[data[i][j].category].items = [];
				}					
				
				if(! (data[i][j].value in dupes) ){
					var categories = new Object;
					categories[i] = 1;
					self.data[data[i][j].category].items.push({label:data[i][j].label,sublabel:data[i][j].sublabel,value:data[i][j].value,categories:categories});
					dupes[data[i][j].value] = self.data[data[i][j].category].items.length - 1;	
				}
				else {
					var tmp = dupes[data[i][j].value];
					var items = self.data[data[i][j].category].items;
					items[tmp].categories[i]=1;
				}
			}
		}
	}
	
	self.render();

};

/**
  * Renders the UI accordion from this.items
  *
  *  
  * @this {Selector}
  * 
*/
SOTE.widget.Selector.prototype.render = function(){
   
	//this.container.innerHTML = "";
	$("#"+this.id).empty();
	var tabs_height = $(".ui-tabs-nav").outerHeight(true);
	$('#'+this.id).addClass('selector');
	$('#'+this.id).height($('#'+this.id).parent().outerHeight() - tabs_height);

	
	this.list = new SOTE.widget.List(this.id,{
		data: this.data,
		selected: this.selected[this.state],
		hide: false,
		checkbox: true,
		close: false,
		filter: false,
		search: true,
		defaultCategory: "All",
		categories: this.cats,
		onchange: SOTE.widget.Selector.handleFire,
		args: this
	});
	
	//$("#"+this.id).bind("listchange", {self:this}, SOTE.widget.Selector.handleFire);
	
	// Mark the component as ready in the registry if called via init() 
	if ((this.initRenderComplete === false) && REGISTRY) {
		this.initRenderComplete = true;
		REGISTRY.markComponentReady(this.id);
	}
	
	
	
};

SOTE.widget.Selector.handleFire = function(self){
	self.fire();
};

SOTE.widget.Selector.prototype.resize = function (){
	var tabs_height = $(".ui-tabs-nav").outerHeight(true);
	$('#'+this.id).height($('#'+this.id).parent().outerHeight() - tabs_height);
};

/**
  * Fires an event to the registry when the state of the component is changed
  *
  * @this {Selector}
  *
*/
SOTE.widget.Selector.prototype.fire = function(){
	if(REGISTRY){
		REGISTRY.fire(this);
	}
	else{
		alert("No REGISTRY found! Cannot fire to REGISTRY from Selector!");
	}

};

/**
  * Sets the selected option(s) in the Selector from the passed in value(s), if valid 
  *     [containerId]=[options] (options is a dot delimited string with the first item containing
  *     a single select item, and the remaining items containing the multi-select items).
  *
  * @this {Selector}
  * @param {String} value is a dot delimited string of the key(s) of the option(s) to be set as selected
  * @returns {boolean} true or false depending on if the new value(s) validates
  *
*/
SOTE.widget.Selector.prototype.setValue = function(valString){
	this.list.setValue(valString);
};

/**
  * Gets the currently selected option(s) [containerId]=[options]
  *
  * @this {Selector}
  * @returns {String} [container]=[options], options being a dot delimited string 
  *     representing the key(s) of the currently selected option(s)
  *
*/
SOTE.widget.Selector.prototype.getValue = function(){	
	return this.id + "=" + this.list.getValue();
};


/**
  * Change the component based on dependencies (i.e. Available Options, Selected)
  * 
  * @this {Selector}
  * @param {String} querystring contains all values of dependencies (from registry)
  * @returns {boolean} true or false depending on if the selected value still validats with criteria change
  * 
*/
SOTE.widget.Selector.prototype.updateComponent = function(querystring){
	var qs = (querystring === undefined)? "":querystring;
	/*SOTE.util.getJSON(
		this.dataSourceUrl+"?"+querystring,
		{self:this,qs:querystring},
		SOTE.widget.Selector.handleUpdateSuccess,
		SOTE.widget.Selector.handleUpdateFailure
	);*/
	SOTE.widget.Selector.handleUpdateSuccess(this,qs);
};

/**
  * Static function to handle a successful retrieval from the data accessor
  * 
  * @this {Selector}
  * @param {Object,String,Object,Object} data is the data passed back from the call, status is the response status, xhr is the applicable xmlhttprequest object, args are the custom arguments passed
  * 
*/
SOTE.widget.Selector.handleUpdateSuccess = function(self,qs){
	/*var expanded = SOTE.util.extractFromQuery("hazard",args.qs);
	data.expanded = (expanded !== undefined && expanded !== "" && expanded !== null)? expanded:data.expanded;
	data.selected = (data.selected === undefined || data.selected === "")? SOTE.util.extractFromQuery(args.self.id,args.self.getValue()):data.selected;*/
	if(SOTE.util.extractFromQuery("switch",qs) == self.state){	
		var vals = SOTE.util.extractFromQuery("products",qs);
		self.values = self.setValue(vals);
	}
	else {
		self.state = SOTE.util.extractFromQuery("switch",qs);
		self.loadData();
	}
};
 
/**
  * Static function to handle a failed retrieval from the data accessor
  * 
  * @this {Selector}
  * @param {Object,String,String,Object} xhr is the applicable xmlhttprequest object, status is the response status, error is the thrown error, args are the custom arguments passed
  * 
*/
SOTE.widget.Selector.handleUpdateFailure = function(xhr,status,error,args){
	alert("Failed to load data accessor: " + error);
};


/**
  * Sets the selected option(s) from the query string [containerId]=[options]
  * 
  * @this {Selector}
  * @param {String} qs contains the querystring
  * @returns {boolean} true or false depending on whether the new option validates
  *
*/
SOTE.widget.Selector.prototype.loadFromQuery = function(qs){
	//return this.setValue(SOTE.util.extractFromQuery(this.id,qs));
};

/**
  * Validates that the selected option(s) is not null, only one radio button is selected cross category
  * and all options are within the scope of available options
  * 
  * @this {Selector}
  * @returns {boolean} true or false depending on whether the selected option(s) meet the validation criteria
*/
SOTE.widget.Selector.prototype.validate = function(){

	var isValid = true;
    return isValid;

};

SOTE.widget.Selector.prototype.setHeight = function(height){
	$("#"+this.id).css("height",height+"px");
	SOTE.widget.Selector.adjustCategoryHeights({self:this});
};

/**
  * Sets the data accessor that provides state change instructions given dependencies
  *
  * @this {Selector}
  * @param {String} datasourceurl is the relative location of the data accessor 
  *
*/
SOTE.widget.Selector.prototype.setDataSourceUrl = function(dataSourceUrl){
	this.dataSourceUrl = dataSourceUrl;
};

/**
  * Gets the data accessor
  * 
  * @this {Selector}
  * @returns {String} the relative location of the accessor
  *
*/
SOTE.widget.Selector.prototype.getDataSourceUrl = function(){
	return this.dataSourceUrl;
};

/**
  * Sets the status of the component
  *
  * @this {Selector}
  * @param {String} s the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.Selector.prototype.setStatus = function(s){
	this.statusStr = s;
};

/**
  * Gets the status of the component
  *
  * @this {Selector}
  * @returns {String} the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.Selector.prototype.getStatus = function(){
	return this.statusStr;
};

