SOTE.namespace("SOTE.widget.AccordionPicker");

SOTE.widget.AccordionPicker.prototype = new SOTE.widget.Component;

/**
  * Instantiate the AccordionPicker  
  *
  * @class A selection device classifying radio buttons/checkboxes into categories that are displayed in Accordion form.
  *     Radio buttons allow single selection accross categories.  Checkboxes allow multiple selections accross categories.
  * 	Radio selections cannot span multiple categories.
  * @constructor
  * @this {AccordionPicker}
  * @param {String} containerId is the container id of the div in which to render the object 
  * @param {Object} [config] is a hash allowing configuration of this component
  * @config {Object[]} [items] a JS Array of JS Objects: items.category[i..n].key, items.category[i..n].value 
  *     , items.category[i..n].action, items.type[i..n] representing the available options
  * @config {String} [selected] the key of the initially selected option(s)
  * @augments SOTE.widget.Component
  * 
*/
SOTE.widget.AccordionPicker = function(containerId, config){
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

	if(config.dataSourceUrl === undefined){
	    config.dataSourceUrl = null;
	}

	if(config.items === undefined){
	    config.items = null; 
	}

 	if(config.selected === undefined){
	    config.selected = null;
	}	
       
    this.value = "";
	this.items = config.items;
	this.selected = config.selected;
	this.dataSourceUrl = config.dataSourceUrl;
	this.statusStr = "";
	this.init();
}

/**
  * Displays all options in HTML in an Accordion format (see JQuery UI Accordion) with the selected states being indicated
  * by radio button and checkbox selection.  All callbacks should be set.  The component UI should be rendered 
  * with controllers to call the events.
  *
  *  
  * @this {AccordionPicker}
  * 
*/
SOTE.widget.AccordionPicker.prototype.init = function(){
	
	var accordion = document.createElement("form");
	accordion.setAttribute("class","accordion");
	accordion.setAttribute("id",this.id+"accordion");
	for(var category in this.items){
		var catHeader = document.createElement("a");
		catHeader.setAttribute("href","#");
		catHeader.innerHTML = category;
		accordion.appendChild(catHeader);
		var catList = document.createElement("ul");
		for(var i=0; i < this.items[category].length; i++){
			var item = this.items[category][i];
			var catListItem = document.createElement("li");
			if(item.type !== "single" && item.type !== "multi"){
				alert("Invalid list item!");
			}
			else {
				var id = this.id + category + "Item" + i;
				var type = (item.type === "single")? "radio":"checkbox"; 
				catListItem.innerHTML = "<input value='"+item.value+"' name='"+this.id+item.type+"' id='"+id+"' type='"+type+"'"+"/>";
				catListItem.innerHTML += "<label for='"+id+"'>"+item.label+"</label>";
				catList.appendChild(catListItem);
			} 
		}
		accordion.appendChild(catList);
	}
	this.container.appendChild(accordion);
	
	$('.accordion').accordion();
	$('.accordion').accordion("option","collapsible",true);
	$('.accordion').accordion("option","active",false);
	
    if(REGISTRY){
 		REGISTRY.register(this.id,this);
	}
	else{
		alert("No REGISTRY found!  Cannot register AccordionPicker!");
	}
	
	
};

/**
  * Fires an event to the registry when the state of the component is changed
  *
  * @this {AccordionPicker}
  *
*/
SOTE.widget.AccordionPicker.prototype.fire = function(){

	if(REGISTRY){
		REGISTRY.fire(this);
	}
	else{
		alert("No REGISTRY found! Cannot fire to REGISTRY from AccordionPicker!");
	}

};

/**
  * Sets the selected option(s) in the AccordionPicker from the passed in value(s), if valid 
  *     [containerId]=[options] (options is a dot delimited string with the first item containing
  *     a single select item, and the remaining items containing the multi-select items).
  *
  * @this {AccordionPicker}
  * @param {String} value is a dot delimited string of the key(s) of the option(s) to be set as selected
  * @returns {boolean} true or false depending on if the new value(s) validates
  *
*/
SOTE.widget.AccordionPicker.prototype.setValue = function(values){
	var selectedItems = values.split(".");
	var base = selectedItems[0];
	var radioButtons = document.getElementsByName(this.id+"single");
	
	for(var i=0; i < radioButtons.length; ++i){
		if(radioButtons[i].value === base){
			radioButtons[i].checked = true;
		}
		else {
			radioButtons[i].checked = false;
		}
	}
	
	var checkboxes = document.getElementsByName(this.id+"multi");
	
	for(var i=0; i < checkboxes.length; ++i){
		for(var j=1; j < selectedItems.length; ++j){
			if(checkboxes[i].value === selectedItems[j]){
				checkboxes[i].checked = true;
			}
		}
	}
	
	return; //this.validate();
	
};

/**
  * Gets the currently selected option(s) [containerId]=[options]
  *
  * @this {AccordionPicker}
  * @returns {String} [container]=[options], options being a dot delimited string 
  *     representing the key(s) of the currently selected option(s)
  *
*/
SOTE.widget.AccordionPicker.prototype.getValue = function(){
	var selected = new Array();
	var radioButtons = document.getElementsByName(this.id+"single");
	
	for(var i=0; i < radioButtons.length; ++i){
		if(radioButtons[i].checked === true){
			selected.push(radioButtons[i].value);
			break;
		}
	}
	
	var checkboxes = document.getElementsByName(this.id+"multi");
	
	for(var i=0; i < checkboxes.length; ++i){
		if(checkboxes[i].checked === true){
			selected.push(checkboxes[i].value);
		}
	}
	
	var value = selected.join(".");
	return value;
};

/**
  * Change the component based on dependencies (i.e. Available Options, Selected)
  * 
  * @this {AccordionPicker}
  * @param {String} querystring contains all values of dependencies (from registry)
  * @returns {boolean} true or false depending on if the selected value still validats with criteria change
  * 
*/
SOTE.widget.AccordionPicker.prototype.updateComponent = function(querystring){
  // Content
};

/**
  * Sets the selected option(s) from the query string [containerId]=[options]
  * 
  * @this {AccordionPicker}
  * @param {String} qs contains the querystring
  * @returns {boolean} true or false depending on whether the new option validates
  *
*/
SOTE.widget.AccordionPicker.prototype.loadFromQuery = function(qs){
	return this.setValue(extractFromQuery("categoryPicker",qs));
};

/**
  * Validates that the selected option(s) is not null, only one radio button is selected cross category
  * and all options are within the scope of available options
  * 
  * @this {AccordionPicker}
  * @returns {boolean} true or false depending on whether the selected option(s) meet the validation criteria
*/
SOTE.widget.AccordionPicker.prototype.validate = function(){
	var isValid = true;
	var radioCount = 0;
	var radioButtons = document.getElementsByName(this.id+"single");
	
	for(var i=0; i < radioButtons.length; ++i){
		if(radioButtons[i].checked === true){
			++radioCount;
		}
	}
	
	if(radioCount > 1){
		isValid = false;
		this.setStatus("Multiple single-select items selected!");
	}
	
    return isValid;

};

/**
  * Sets the data accessor that provides state change instructions given dependencies
  *
  * @this {AccordionPicker}
  * @param {String} datasourceurl is the relative location of the data accessor 
  *
*/
SOTE.widget.AccordionPicker.prototype.setDataSourceUrl = function(dataSourceUrl){
	this.dataSourceUrl = dataSourceUrl;
};

/**
  * Gets the data accessor
  * 
  * @this {AccordionPicker}
  * @returns {String} the relative location of the accessor
  *
*/
SOTE.widget.AccordionPicker.prototype.getDataSourceUrl = function(){
	return this.dataSourceUrl;
};

/**
  * Sets the status of the component
  *
  * @this {AccordionPicker}
  * @param {String} s the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.AccordionPicker.prototype.setStatus = function(s){
	this.statusStr = s;
};

/**
  * Gets the status of the component
  *
  * @this {AccordionPicker}
  * @returns {String} the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.AccordionPicker.prototype.getStatus = function(){
	return this.statusStr;
};


// Additional Functions
// removeOptions, addOptions
