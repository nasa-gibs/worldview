SOTE.namespace("SOTE.widget.Bank"); 

SOTE.widget.Bank.prototype = new SOTE.widget.Component;

/**
  * A selection device classifying radio buttons/checkboxes into categories that are displayed in Accordion form.
  *     Radio buttons allow single selection accross categories.  Checkboxes allow multiple selections accross categories.
  *     Radio selections cannot span multiple categories. 
  *
  * @module SOTE.widget
  * @class Bank
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
    this.log = Logging.getLogger("Worldview.Widget.Bank");
    this.VALID_PROJECTIONS = ["geographic", "arctic", "antarctic"];
    this.hidden = {};
    
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

SOTE.widget.Bank.prototype.buildMeta = function(cb,val){
    this.buildMetaDone = false;
    var data = this.config.ap_products[this.state];
    SOTE.widget.Bank.handleMetaSuccess(data, null, null, {
        self: this,
        callback: cb, 
        val: val
    });

};

SOTE.widget.Bank.handleMetaSuccess = function(data,status,xhr,args){
	var self = args.self;
	var dupes = new Object;
	var count = 0;
	
	for(var i in data){
		if(i != "palettes") {
			
			for(var j=0; j<data[i].length; j++){	
				if(!self.data[data[i][j].category]){
					self.data[data[i][j].category] = new Object;
					self.data[data[i][j].category].title = self.categories[count++];
					self.data[data[i][j].category].items = [];
				}					
				
				if(! (data[i][j].value in dupes) ){
					self.data[data[i][j].category].items.push({label:data[i][j].label,sublabel:data[i][j].sublabel,value:data[i][j].value});
					dupes[data[i][j].value] = 1;
				}
			}
		}
	}
	
	/*$.each(self.meta, function(name, meta) {
	   if ( name in self.config.layers ) {
	       var layer = self.config.layers[name];
	       if ( "rendered" in layer ) {
	           meta.units = layer.units;
	           meta.min = ( layer.min === undefined ) 
	                   ? "&nbsp;&nbsp;&nbsp;&nbsp" 
	                   : layer.min;
	           meta.max = ( layer.max === undefined ) 
	                   ? "&nbsp;&nbsp;&nbsp;" 
                       : layer.max;
	           meta.bins = layer.bins;
	           meta.stops = layer.stops;
	           meta.palette = self.config.palettes[layer.rendered];    
	       }    
	   }    
	});*/
	
	if(args.callback){
		args.callback({self:self,val:args.val});
	}
	else{
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

	$(this.container).empty();
	
	var tabs_height = $(".ui-tabs-nav").outerHeight(true);
	$('#'+this.id).addClass('bank');
	$('#'+this.id).height($('#'+this.id).parent().outerHeight() - tabs_height);	
	
	this.list = new SOTE.widget.List(this.id,{
		data: this.data,
		selected: this.selected[this.state]
	});
	
	$("#"+this.id).bind("listchange", {self:this}, SOTE.widget.Bank.handleFire);
	
	/*var m = this.meta[myVal];

	if(m && m.palette){
		var paletteString = "<div><span class='palette'><span class='p-min' style='margin-right:10px;'>"+m.min+"</span>" +
			 "<canvas class='colorBar' id='canvas"+this.values[formattedCategoryName.toLowerCase()][j].value+"' width=100px height=14px'></canvas>" +
			 "<span class='p-max' style='margin-left:10px;'>"+m.max+"</span>";
		if(m.units && m.units != ""){
			paletteString += "<span class='units' style='margin-left:3px;'>("+m.units+")</span></span></div>";
		}
		item.innerHTML += paletteString;
	}
				
	this.renderCanvases();*/

	
	// Mark the component as ready in the registry if called via init() 
	if ((this.initRenderComplete === false) && REGISTRY) {
		this.initRenderComplete = true;
		REGISTRY.markComponentReady(this.id);
	}
	
};

SOTE.widget.Bank.handleFire = function(e){
	var self = e.data.self;
	self.fire();
};

SOTE.widget.Bank.prototype.renderCanvases = function(){
    
    var openPaletteSelector = function(name) {
        return function() {
            if ( !Worldview.Support.allowCustomPalettes() ) {
                Worldview.Support.showUnsupportedMessage();
            } else {
               self.paletteWidget.displaySelector(name);
            }            
        };
    };

    var self = this;
    
	for(var i=0; i<this.categories.length; i++){
		var formattedCategoryName = this.categories[i].replace(/\s/g, "");
		if(this.values !== null && this.values[formattedCategoryName.toLowerCase()]){
			for(var j=0; j<this.values[formattedCategoryName.toLowerCase()].length; j++){
				var val = this.values[formattedCategoryName.toLowerCase()][j].value;
				var m = this.meta[this.values[formattedCategoryName.toLowerCase()][j].value];
				if(m && m.palette){
					var width = 100/m.palette.length;
					var canvas = document.getElementById("canvas"+val);
					if ( m.palette.stops.length > 1 ) {
					   canvas.onclick = openPaletteSelector(val);
					   canvas.style.cursor = "pointer";
				    }
					var context = canvas.getContext('2d');
					var palette = this.paletteWidget.getPalette(this.values[formattedCategoryName.toLowerCase()][j].value);

                    var spec = {
                        selector: "#canvas" + val,
                        bins: m.bins,
                        stops: m.stops,
                        palette: palette
                    };
                    Worldview.Palette.ColorBar(spec);
				}
			}
		}
	}
};

/**
  * Fires an event to the registry when the state of the component is changed
  *
  * @this {Bank}
  *
*/
SOTE.widget.Bank.prototype.fire = function(){
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
  * Sets the selected option(s) in the Bank from the passed in value(s), if valid 
  *     [containerId]=[options] (options is a dot delimited string with the first item containing
  *     a single select item, and the remaining items containing the multi-select items).
  *
  * @this {Bank}
  * @param {String} value is a dot delimited string of the key(s) of the option(s) to be set as selected
  * @returns {boolean} true or false depending on if the new value(s) validates
  *
*/
SOTE.widget.Bank.prototype.setValue = function(valString, selector){
	this.list.setValue(valString, selector);
};

SOTE.widget.Bank.prototype.currCount = function(){
	return this.list.count;
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
		
	return this.id + "=" + this.list.getValue();
};

SOTE.widget.Bank.prototype.value = function(){
		
	return this.list.getValue();
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
	var projection = SOTE.util.extractFromQuery("switch", qs);
	self.noFireVal = (SOTE.util.extractFromQuery("norecurse",qs) === "")? null: SOTE.util.extractFromQuery("norecurse",qs);
	if (projection === "") {
	    projection = self.VALID_PROJECTIONS[0];
	} else if ($.inArray(projection, self.VALID_PROJECTIONS) < 0) {
	    self.log.warn("Invalid projection: " + projection + ", using: " + 
	           self.VALID_PROJECTIONS[0]);
        projection = self.VALID_PROJECTIONS[0];
	}
	if(projection == self.state){
		var vals = SOTE.util.extractFromQuery("selectorbox",qs);
		self.setValue(vals, "selector");
	}
	else {
		self.state = projection;
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
	
	if (newState === "" ) {
	    newState = "geographic";
	}
	if(this.state != newState){
		this.state = newState;
		this.updateComponent(qs);
	}
	else {
	   SOTE.widget.Bank.loadValue({
	       self: this, 
	       val: SOTE.util.extractFromQuery(this.id, qs)
       });
	}
};

SOTE.widget.Bank.prototype.sleep = function(v){
	setTimeout(SOTE.widget.Bank.loadValue,100,{self:this,val:v});
};

SOTE.widget.Bank.loadValue = function(args){
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
  * @this {Bank}
  * @returns {boolean} true or false depending on whether the selected option(s) meet the validation criteria
*/
SOTE.widget.Bank.prototype.validate = function(){

	var isValid = true;
    return isValid;

};

SOTE.widget.Bank.prototype.setHeight = function(height){
	$("#"+this.id).css("height",height+"px");
	SOTE.widget.Bank.adjustCategoryHeights({self:this});
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

