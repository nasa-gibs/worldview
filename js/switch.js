SOTE.namespace("SOTE.widget.Switch"); 

SOTE.widget.Switch.prototype = new SOTE.widget.Component;

/**
  * Instantiate the Switch  
  *
  * @class A selection device classifying radio buttons/checkboxes into categories that are displayed in Accordion form.
  *     Radio buttons allow single selection accross categories.  Checkboxes allow multiple selections accross categories.
  * 	Radio selections cannot span multiple categories.
  * @constructor
  * @this {Switch}
  * @param {String} containerId is the container id of the div in which to render the object 
  * @param {Object} [config] is a hash allowing configuration of this component
  * @config {Object[]} [items] a JS Array of JS Objects: items.category[i..n].key, items.category[i..n].value 
  *     , items.category[i..n].action, items.type[i..n] representing the available options
  * @config {String} [selected] the key of the initially selected option(s)
  * @augments SOTE.widget.Component
  * 
*/
SOTE.widget.Switch = function(containerId, config){
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
       
    this.value = config.selected;
    this.data = (config.values !== undefined)? config.values:null;
    this.initRenderComplete = false;
	this.dataSourceUrl = config.dataSourceUrl;
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
  * @this {Switch}
  * 
*/
SOTE.widget.Switch.prototype.init = function(){
	
	this.render();
	
    if(REGISTRY){
 		REGISTRY.register(this.id,this);
		REGISTRY.markComponentReady(this.id);

	}
	else{
		alert("No REGISTRY found!  Cannot register Switch!");
	}
	
	
}; 

/**
  * Renders the UI accordion from this.items
  *
  *  
  * @this {Switch}
  * 
*/
SOTE.widget.Switch.prototype.render = function(){

	this.container.innerHTML = "";
	$('#'+this.id).addClass('switch');
	//<ul><li><div><a></a><a></a><a></a></div></li></ul>
	this.container.innerHTML = "<ul><li><div class='sw_current' title='Choose a projection'></div><div class='hidden'><a id='arctic' class='sw_arctic' title='Arctic'></a><a id='geographic' class='sw_geographic' title='Geographic'></a><a id='antarctic' class='sw_antarctic' title='Antarctic'></a></div></li></ul>";
	$('#arctic').bind('click',{self:this,val:'arctic'},SOTE.widget.Switch.setVal);
	$('#geographic').bind('click',{self:this,val:'geographic'},SOTE.widget.Switch.setVal);
	$('#antarctic').bind('click',{self:this,val:'antarctic'},SOTE.widget.Switch.setVal);

	// Mark the component as ready in the registry if called via init() 
	if ((this.initRenderComplete === false) && REGISTRY) {
		this.initRenderComplete = true;
	} 
	
};

SOTE.widget.Switch.setVal = function(o){
	var self = o.data.self;
	var val = o.data.val;
	self.value = val;
	$('div.sw_current').css("background-image","url(images/"+self.value+".png)").hover(function() {
       $(this).css("background-image","url(images/"+self.value+"on.png)"); 
    }, 
    function() {
       $(this).css("background-image","url(images/"+self.value+".png)"); 
    });
	self.fire();
};

/**
  * Fires an event to the registry when the state of the component is changed
  *
  * @this {Switch}
  *
*/
SOTE.widget.Switch.prototype.fire = function(){

	if(REGISTRY){
		REGISTRY.fire(this);
	}
	else{
		alert("No REGISTRY found! Cannot fire to REGISTRY from Switch!");
	}

};

/**
  * Sets the selected option(s) in the Switch from the passed in value(s), if valid 
  *     [containerId]=[options] (options is a dot delimited string with the first item containing
  *     a single select item, and the remaining items containing the multi-select items).
  *
  * @this {Switch}
  * @param {String} value is a dot delimited string of the key(s) of the option(s) to be set as selected
  * @returns {boolean} true or false depending on if the new value(s) validates
  *
*/
SOTE.widget.Switch.prototype.setValue = function(valString){

	this.value = valString;
	$("#" + this.id+"current").attr("src","images/"+this.value+".png");
	this.validate();
	this.fire();
	
};

/**
  * Gets the currently selected option(s) [containerId]=[options]
  *
  * @this {Switch}
  * @returns {String} [container]=[options], options being a dot delimited string 
  *     representing the key(s) of the currently selected option(s)
  *
*/
SOTE.widget.Switch.prototype.getValue = function(){
		
	var returnVal = this.id + "=" + this.value;
	return returnVal;
};



/**
  * Change the component based on dependencies (i.e. Available Options, Selected)
  * 
  * @this {Switch}
  * @param {String} querystring contains all values of dependencies (from registry)
  * @returns {boolean} true or false depending on if the selected value still validats with criteria change
  * 
*/
SOTE.widget.Switch.prototype.updateComponent = function(querystring){

};

/**
  * Static function to handle a successful retrieval from the data accessor
  * 
  * @this {Switch}
  * @param {Object,String,Object,Object} data is the data passed back from the call, status is the response status, xhr is the applicable xmlhttprequest object, args are the custom arguments passed
  * 
*/
SOTE.widget.Switch.handleUpdateSuccess = function(self,qs){

};
 
/**
  * Static function to handle a failed retrieval from the data accessor
  * 
  * @this {Switch}
  * @param {Object,String,String,Object} xhr is the applicable xmlhttprequest object, status is the response status, error is the thrown error, args are the custom arguments passed
  * 
*/
SOTE.widget.Switch.handleUpdateFailure = function(xhr,status,error,args){
	alert("Failed to load data accessor: " + error);
};


/**
  * Sets the selected option(s) from the query string [containerId]=[options]
  * 
  * @this {Switch}
  * @param {String} qs contains the querystring
  * @returns {boolean} true or false depending on whether the new option validates
  *
*/
SOTE.widget.Switch.prototype.loadFromQuery = function(qs){
	return this.setValue(SOTE.util.extractFromQuery(this.id,qs));
};

/**
  * Validates that the selected option(s) is not null, only one radio button is selected cross category
  * and all options are within the scope of available options
  * 
  * @this {Switch}
  * @returns {boolean} true or false depending on whether the selected option(s) meet the validation criteria
*/
SOTE.widget.Switch.prototype.validate = function(){

	var isValid = true;
    return isValid;

};

/**
  * Sets the data accessor that provides state change instructions given dependencies
  *
  * @this {Switch}
  * @param {String} datasourceurl is the relative location of the data accessor 
  *
*/
SOTE.widget.Switch.prototype.setDataSourceUrl = function(dataSourceUrl){
	this.dataSourceUrl = dataSourceUrl;
};

/**
  * Gets the data accessor
  * 
  * @this {Switch}
  * @returns {String} the relative location of the accessor
  *
*/
SOTE.widget.Switch.prototype.getDataSourceUrl = function(){
	return this.dataSourceUrl;
};

/**
  * Sets the status of the component
  *
  * @this {Switch}
  * @param {String} s the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.Switch.prototype.setStatus = function(s){
	this.statusStr = s;
};

/**
  * Gets the status of the component
  *
  * @this {Switch}
  * @returns {String} the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.Switch.prototype.getStatus = function(){
	return this.statusStr;
};

