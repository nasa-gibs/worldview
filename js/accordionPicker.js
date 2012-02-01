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
	//this.items = config.items;
	this.selected = config.selected;
	this.dataSourceUrl = config.dataSourceUrl;
	this.statusStr = "";
	this.init();
	this.updateComponent("");

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
	
	this.render();
	
    if(REGISTRY){
 		REGISTRY.register(this.id,this);
 		REGISTRY.markComponentReady(this.id);
	}
	else{
		alert("No REGISTRY found!  Cannot register AccordionPicker!");
	}
	
	
};

/**
  * Renders the UI accordion from this.items
  *
  *  
  * @this {AccordionPicker}
  * 
*/
SOTE.widget.AccordionPicker.prototype.render = function(){
	if(this.items === undefined){return false;}
	this.container.innerHTML = "";
	var htmlExpanded;
	var selected;
	var defaultSelection = null; 

	var accordion = document.createElement("form");
	accordion.setAttribute("class","accordion");
	accordion.setAttribute("id",this.id+"accordion");
	for(var category in this.items){
		if(category === "expanded"){
			if(this.items[category] !== undefined && this.items[category] !== ""){
				htmlExpanded = this.items[category].replace(" ","");
			}
			continue;
		}
		if(category === "selected"){
			selected = this.items[category];
			continue;
		}
		var htmlCategory = category.replace(" ","");
		var catHeader = document.createElement("a");
		catHeader.setAttribute("href","#");
		catHeader.setAttribute("id",this.id+htmlCategory );
		catHeader.innerHTML = "<span>"+category+"</span>";
		accordion.appendChild(catHeader);
		var catList = document.createElement("ul");
		for(var i=0; i < this.items[category].length; i++){
			var item = this.items[category][i];
			if(defaultSelection === null){
				defaultSelection = item.value;
			}
			var catListItem = document.createElement("li");
			if(item.type !== "single" && item.type !== "multi"){
				alert("Invalid list item!");
			}
			else {
				var id = this.id + htmlCategory + "Item" + item.value;
				var disabled = (item.disabled !== undefined && item.disabled === true)? "disabled":""; 
				var type = (item.type === "single")? "radio":"checkbox"; 
				catListItem.innerHTML = "<input value='"+item.value+"' class='accordionFormItem' name='"+this.id+item.type+"' id='"+id+"' type='"+type+"'"+" "+disabled+"/>";
				catListItem.innerHTML += "<label for='"+id+"'><span class='accordionLabel'>"+item.label+"</span><span class='accordionSub'>"+item.sublabel+"</span></label>";
				catList.appendChild(catListItem);
				
				// If "selected" value is true in json, add current item to list of default selection(s)
				if ((item.selected !== undefined) && (item.selected=="true"))
				{
					defaultSelection = defaultSelection + "." + item.value;
				}
			} 
		}
		accordion.appendChild(catList);
	}
	this.container.appendChild(accordion);
	
	$('.accordion').accordion();
	//$('.accordion').accordion("option","collapsible",true);
	$('.accordionFormItem').bind('click',{self:this},SOTE.widget.AccordionPicker.handleSelection);

	if(htmlExpanded !== undefined){
		$('.accordion').accordion("activate","#"+this.id+htmlExpanded);
	}
	if(selected !== undefined && selected !== ""){
		this.setValue(selected);
	}
	else {
		this.setValue(defaultSelection);
	}

	
	
	
	
};

SOTE.widget.AccordionPicker.handleSelection = function(e){
	var self = e.data.self;
    self.value = SOTE.util.extractFromQuery(self.id,self.getValue());
	self.fire();
	
	
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
		if(radioButtons[i].value === base && radioButtons[i].disabled === false){
			radioButtons[i].checked = true;
		}
		else {
			radioButtons[i].checked = false;
		}
	}
	
	var checkboxes = document.getElementsByName(this.id+"multi");
	
	for(var i=0; i < checkboxes.length; ++i){
		for(var j=1; j < selectedItems.length; ++j){
			if(checkboxes[i].value === selectedItems[j] && checkboxes[i].disabled === false){
				checkboxes[i].checked = true;
			}
		}
	}
	
	this.value = values;
	this.fire();
	
	return this.validate();
	
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
	
	if(selected.length === 0){ selected.push(""); };
	
	var checkboxes = document.getElementsByName(this.id+"multi");
	
	for(var i=0; i < checkboxes.length; ++i){
		if(checkboxes[i].checked === true){
			selected.push(checkboxes[i].value);
		}
	}
	
	var value = selected.join(".");
	return this.id + "=" + value;
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
	var qs = (querystring === undefined)? "":querystring;
	SOTE.util.getJSON(
		this.dataSourceUrl+"?"+querystring,
		{self:this,qs:querystring},
		SOTE.widget.AccordionPicker.handleUpdateSuccess,
		SOTE.widget.AccordionPicker.handleUpdateFailure
	);
};

/**
  * Static function to handle a successful retrieval from the data accessor
  * 
  * @this {AccordionPicker}
  * @param {Object,String,Object,Object} data is the data passed back from the call, status is the response status, xhr is the applicable xmlhttprequest object, args are the custom arguments passed
  * 
*/
SOTE.widget.AccordionPicker.handleUpdateSuccess = function(data,status,xhr,args){
	var expanded = SOTE.util.extractFromQuery("hazard",args.qs);
	data.expanded = (expanded !== undefined && expanded !== "" && expanded !== null)? expanded:data.expanded;
	data.selected = (data.selected === undefined || data.selected === "")? SOTE.util.extractFromQuery(args.self.id,args.self.getValue()):data.selected;
	args.self.items = data;
	args.self.render();
};
 
/**
  * Static function to handle a failed retrieval from the data accessor
  * 
  * @this {AccordionPicker}
  * @param {Object,String,String,Object} xhr is the applicable xmlhttprequest object, status is the response status, error is the thrown error, args are the custom arguments passed
  * 
*/
SOTE.widget.AccordionPicker.handleUpdateFailure = function(xhr,status,error,args){
	alert("Failed to load data accessor: " + error);
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
	return this.setValue(SOTE.util.extractFromQuery(this.id,qs));
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
		if(radioButtons[i].disabled === true && radioButtons[i].checked === true){
			this.setStatus("Disabled items cannot be selected!");
			isValid = false;
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
