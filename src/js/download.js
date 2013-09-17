SOTE.namespace("SOTE.widget.Download"); 

SOTE.widget.Download.prototype = new SOTE.widget.Component;

/**
  * A selection device classifying radio buttons/checkboxes into categories that are displayed in Accordion form.
  *     Radio buttons allow single selection accross categories.  Checkboxes allow multiple selections accross categories.
  *     Radio selections cannot span multiple categories. 
  *
  * @module SOTE.widget
  * @class Download
  * @constructor
  * @this {Download}
  * @param {String} containerId is the container id of the div in which to render the object 
  * @param {Object} [config] is a hash allowing configuration of this component
  * @config {Object[]} [items] a JS Array of JS Objects: items.category[i..n].key, items.category[i..n].value 
  *     , items.category[i..n].action, items.type[i..n] representing the available options
  * @config {String} [selected] the key of the initially selected option(s)
  * @augments SOTE.widget.Component
  * 
*/
SOTE.widget.Download = function(containerId, config){
    this.log = Logging.getLogger("Worldview.Widget.Download");
    
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
	    config.title = "My Download";
	}

	if(config.categories === undefined){
	    config.categories = ["Category 1","Category 2"]; 
	}

	if(config.callback === undefined){
	    config.callback = null; 
	}

	if(config.state === undefined || config.state === ""){
		config.state = "geographic";
	}

       
    this.state = config.state;
	this.selected = config.selected;
	
    this.dataSourceUrl = config.dataSourceUrl;

    this.title = config.title;
    this.callback = config.callback;
    this.selector = config.selector;
    this.data = new Object;
    this.buildMetaDone = false;
    this.categories = config.categories;
	this.initRenderComplete = false;
	this.dataSourceUrl = config.dataSourceUrl;
	this.statusStr = "";
	this.config = config.config;
	this.paletteWidget = config.paletteWidget;
	this.queryString = "";
	this.noFireVal = null;
	this.init();

};

SOTE.widget.Download.prototype.buildMeta = function(cb,val){
    this.buildMetaDone = false;
    var data = this.config.ap_products[this.state];
    SOTE.widget.Download.handleMetaSuccess(data, null, null, {
        self: this,
        callback: cb, 
        val: val
    });

};

SOTE.widget.Download.handleMetaSuccess = function(data,status,xhr,args){
	var self = args.self;
	var dupes = new Object;
	var count = 0;
		
	for(var i in data){
		if(i != "palettes") {
			
			for(var j=0; j<data[i].length; j++){	
				data[i][j].product = "Product1";
				if(!self.data[data[i][j].product]){
					self.data[data[i][j].product] = new Object;
					self.data[data[i][j].product].title = data[i][j].product;//self.categories[count++];
					self.data[data[i][j].product].items = [];
				}					
				
				if(! (data[i][j].value in dupes) ){
					var categories = {"All":1};
					self.data[data[i][j].product].items.push({label:data[i][j].label,sublabel:data[i][j].sublabel,value:data[i][j].value,categories:categories});
					dupes[data[i][j].value] = 1;
				}
			}
		}
	}

    self.data = [];
	
	if(args.callback){
		args.callback({self:self,val:args.val});
	}
	else{
		self.render();
		self.fire();
	}
	self.buildMetaDone = true;
	console.log(self.data);
};

/**
  * Displays all options in HTML in an Accordion format (see JQuery UI Accordion) with the selected states being indicated
  * by radio button and checkbox selection.  All callbacks should be set.  The component UI should be rendered 
  * with controllers to call the events.
  *
  *  
  * @this {Download}
  * 
*/
SOTE.widget.Download.prototype.init = function(){
	
	this.buildMeta();
	
    if(REGISTRY){
 		REGISTRY.register(this.id,this);
	}
	else{
		alert("No REGISTRY found!  Cannot register Download!");
	}
	
	
};

/**
  * Renders the UI accordion from this.items
  *
  *  
  * @this {Download}
  * 
*/
SOTE.widget.Download.prototype.render = function(){

	$(this.container).empty();
	
	var tabs_height = $(".ui-tabs-nav").outerHeight(true);
	$('#'+this.id).addClass('bank');
	$('#'+this.id).height($('#'+this.id).parent().outerHeight() - tabs_height);	
	
	this.list = new SOTE.widget.List(this.id,{
		data: this.data,
		selected: this.selected[this.state],
		close: true,
		filter: true,
		search: false,
		action: {text: "Download (~0GB)", callback: SOTE.widget.Download.handleAction},
		selectableCategories: {callback: SOTE.widget.Download.handleCategoryChange, defaultText: "0 selected"},
		onchange: SOTE.widget.Download.handleFire,
		args: this
	});
	
	// this.list.setActionText("Download (~8.7GB)");
	// this.list.setCategoryText ("Product1", "3 selected");
	
	// Mark the component as ready in the registry if called via init() 
	if ((this.initRenderComplete === false) && REGISTRY) {
		this.initRenderComplete = true;
		REGISTRY.markComponentReady(this.id);
	}
	
};

SOTE.widget.Download.handleAction = function(self){
	// Result of action button being clicked
};

SOTE.widget.Download.handleCategoryChange = function(category, self){
	// Result of category change click here
};

SOTE.widget.Download.handleFire = function(self){
	self.fire();
};

/**
  * Fires an event to the registry when the state of the component is changed
  *
  * @this {Download}
  *
*/
SOTE.widget.Download.prototype.fire = function(){
	$("#"+this.id).trigger("fire");

	if(REGISTRY){
		REGISTRY.fire(this,this.noFireVal);
		this.noFireVal = null;
	}
	else{
		alert("No REGISTRY found! Cannot fire to REGISTRY from Download!");
	}

};

/**
  * Sets the selected option(s) in the Download from the passed in value(s), if valid 
  *     [containerId]=[options] (options is a dot delimited string with the first item containing
  *     a single select item, and the remaining items containing the multi-select items).
  *
  * @this {Download}
  * @param {String} value is a dot delimited string of the key(s) of the option(s) to be set as selected
  * @returns {boolean} true or false depending on if the new value(s) validates
  *
*/
SOTE.widget.Download.prototype.setValue = function(valString, selector){
	this.list.setValue(valString, selector);
};

SOTE.widget.Download.prototype.currCount = function(){
	return this.list.count;
};

/**
  * Gets the currently selected option(s) [containerId]=[options]
  *
  * @this {Download}
  * @returns {String} [container]=[options], options being a dot delimited string 
  *     representing the key(s) of the currently selected option(s)
  *
*/
SOTE.widget.Download.prototype.getValue = function(){
		
	return this.id + "=" + this.list.getValue();
};

SOTE.widget.Download.prototype.value = function(){
		
	return this.list.getValue();
};

/**
  * Change the component based on dependencies (i.e. Available Options, Selected)
  * 
  * @this {Download}
  * @param {String} querystring contains all values of dependencies (from registry)
  * @returns {boolean} true or false depending on if the selected value still validats with criteria change
  * 
*/
SOTE.widget.Download.prototype.updateComponent = function(querystring){
	var qs = (querystring === undefined)? "":querystring;
	SOTE.widget.Download.handleUpdateSuccess(this,qs);
};

/**
  * Static function to handle a successful retrieval from the data accessor
  * 
  * @this {Download}
  * @param {Object,String,Object,Object} data is the data passed back from the call, status is the response status, xhr is the applicable xmlhttprequest object, args are the custom arguments passed
  * 
*/
SOTE.widget.Download.handleUpdateSuccess = function(self,qs){

};
 
/**
  * Static function to handle a failed retrieval from the data accessor
  * 
  * @this {Download}
  * @param {Object,String,String,Object} xhr is the applicable xmlhttprequest object, status is the response status, error is the thrown error, args are the custom arguments passed
  * 
*/
SOTE.widget.Download.handleUpdateFailure = function(xhr,status,error,args){
	alert("Failed to load data accessor: " + error);
};


/**
  * Sets the selected option(s) from the query string [containerId]=[options]
  * 
  * @this {Download}
  * @param {String} qs contains the querystring
  * @returns {boolean} true or false depending on whether the new option validates
  *
*/
SOTE.widget.Download.prototype.loadFromQuery = function(qs){
	var newState = SOTE.util.extractFromQuery("switch",qs);
	
	if (newState === "" ) {
	    newState = "geographic";
	}
	if(this.state != newState){
		this.state = newState;
		this.updateComponent(qs);
	}
	else {
	   SOTE.widget.Download.loadValue({
	       self: this, 
	       val: SOTE.util.extractFromQuery(this.id, qs)
       });
	}
};

SOTE.widget.Download.prototype.sleep = function(v){
	setTimeout(SOTE.widget.Download.loadValue,100,{self:this,val:v});
};

SOTE.widget.Download.loadValue = function(args){
	if(args.self.buildMetaDone == true) {
	    // If products are not specified, use the defaults
        if ( args.val.length === 0 ) {
            args.self.setValue(args.self.selected[args.self.state]);
        } else {
		  args.self.setValue(args.val);
	  }
	}
	else {
		args.self.sleep(args.val);
	}
};

/**
  * Validates that the selected option(s) is not null, only one radio button is selected cross category
  * and all options are within the scope of available options
  * 
  * @this {Download}
  * @returns {boolean} true or false depending on whether the selected option(s) meet the validation criteria
*/
SOTE.widget.Download.prototype.validate = function(){

	var isValid = true;
    return isValid;

};

SOTE.widget.Download.prototype.setHeight = function(height){
	$("#"+this.id).css("height",height+"px");
	SOTE.widget.Download.adjustCategoryHeights({self:this});
};

/**
  * Sets the data accessor that provides state change instructions given dependencies
  *
  * @this {Download}
  * @param {String} datasourceurl is the relative location of the data accessor 
  *
*/
SOTE.widget.Download.prototype.setDataSourceUrl = function(dataSourceUrl){
	this.dataSourceUrl = dataSourceUrl;
};

/**
  * Gets the data accessor
  * 
  * @this {Download}
  * @returns {String} the relative location of the accessor
  *
*/
SOTE.widget.Download.prototype.getDataSourceUrl = function(){
	return this.dataSourceUrl;
};

/**
  * Sets the status of the component
  *
  * @this {Download}
  * @param {String} s the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.Download.prototype.setStatus = function(s){
	this.statusStr = s;
};

/**
  * Gets the status of the component
  *
  * @this {Download}
  * @returns {String} the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.Download.prototype.getStatus = function(){
	return this.statusStr;
};

