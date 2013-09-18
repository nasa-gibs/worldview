SOTE.namespace("SOTE.widget.List"); 

SOTE.widget.List.prototype = new SOTE.widget.Component;

/**
  * A selection device classifying radio buttons/checkboxes into categories that are displayed in Accordion form.
  *     Radio buttons allow single selection accross categories.  Checkboxes allow multiple selections accross categories.
  *     Radio selections cannot span multiple categories. 
  *
  * @module SOTE.widget
  * @class List
  * @constructor
  * @this {List}
  * @param {String} containerId is the container id of the div in which to render the object 
  * @param {Object} [config] is a hash allowing configuration of this component
  * @config {Object[]} [items] a JS Array of JS Objects: items.category[i..n].key, items.category[i..n].value 
  *     , items.category[i..n].action, items.type[i..n] representing the available options
  * @config {String} [selected] the key of the initially selected option(s)
  * @augments SOTE.widget.Component
  * 
*/
SOTE.widget.List = function(containerId, config){
    this.log = Logging.getLogger("Worldview.Widget.List");
    
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
	    config.title = "My List";
	}

	if(config.data === undefined){
	    SOTE.util.throwError("List data is not defined.");
	}
	
	if(config.search == undefined){
		config.search = false;
		config.selectedCategory = 'All';
	}
	
	if(config.search && config.category == undefined){
		config.selectedCategory = 'All';
	}
	
	if(config.filter == undefined){
		config.filter = false;
	}
	
	if(config.customClasses == undefined){
		config.customClasses = '';
	}
	
	if(config.sortable == undefined){
		config.sortable = false;
	}
	

	this.customClasses = config.customClasses;
    this.hidden = new Object;
    this.values = new Object;
    this.keyword = '';
    this.search = config.search;
    this.filter = config.filter;
    this.hide = config.hide;
    this.close = config.close;
    this.checkbox = config.checkbox;
    this.selectedCategory = config.defaultCategory;
    this.selectableCategories = config.selectableCategories;
    this.action = config.action;
    this.categories = config.categories;
    this.sortable = config.sortable;
    this.callback = config.onchange;
    this.args = config.args;
       
       
    this.data = config.data;
    
   	this.selected = this.unserialize(config.selected);
   	this.selected = this.selected[1];

	this.init();

};

/**
  * Displays all options in HTML in an Accordion format (see JQuery UI Accordion) with the selected states being indicated
  * by radio button and checkbox selection.  All callbacks should be set.  The component UI should be rendered 
  * with controllers to call the events.
  *
  *  
  * @this {List}
  * 
*/
SOTE.widget.List.prototype.init = function(){
	
	this.render();
	this.trigger();	
};

SOTE.widget.List.prototype.trigger = function(){
	//$("#"+this.id).trigger("listchange");
	this.callback(this.args);	
};

/**
  * Renders the UI accordion from this.items
  *
  *  
  * @this {List}
  * 
*/
SOTE.widget.List.prototype.render = function(){

	// options: category (id: txt, title:txt, notification:txt, checkbox:bool), 
	//			item (id: txt, label:txt, value: txt, hide:bool, remove:bool, checkbox:bool)
	
	// setNotification: id,txt



	// Clear div

	$(this.container).empty().addClass(this.id+'list');
	
	// If action is enabled, render an action button
	
	if(this.action){
		var $actionButton = $("<input type='button' class='action' value='"+this.action.text+"' id='"+this.id+"action' />");
		$(this.container).append($actionButton);
		$("#"+this.id+"action").on('click',{self:this},SOTE.widget.List.act);
	}

	// If search is enabled, render the search box and category box

	if(this.search){
		var $facetedSearch = $("<div class='facetedSearch' id='"+this.id+"facetedSearch'></div>");
		var $select = $("<select class='select' id='"+this.id+"select'></select");
	
		for (var c in this.categories){
			if(c != 'palettes'){
				$select.append($("<option value='"+c+"'>"+c+"</option>"));
			}
		}
		
		$facetedSearch.append($select);	
		$facetedSearch.append($("<input type='text' name='search' class='search' autocomplete='off' placeholder='ex. modis, terra, fire' id='"+this.id+"search'/>"));
		
		$(this.container).append($facetedSearch);
		
		// Set events to capture data from search and category fields
		
		$("#"+this.id+"select").on('change',{self:this,select:true},SOTE.widget.List.setCategory);
		$('#'+this.id+"select").val("All");
	    $("#"+this.id+"search").on('keyup',{self:this,select:false},SOTE.widget.List.search);
	}
	
	// Creating main content block
	
	$(this.container).append($("<div id='"+this.id+"content' class='content "+this.customClasses+"'></div>"));
	this.update();
	
	
};

SOTE.widget.List.prototype.update = function(){

	$content = $("#" + this.id + "content").empty();

	// If search is enabled and a keyword exists, break keyword down into words array

	keywords = [];
	if(this.search){
		this.keyword = this.keyword.replace(/[\(\)\"\'!\$\%\&\?\+\*\\\@\=]/g,"");
		var keywords = this.keyword.split(/\s/);
	}
	
	// Traverse data by category (i.e. baselayers, overlays)
	
	for(var key in this.data){
		
		// Category header (i.e. "Base Layers")
		
		var title = this.data[key].title;
		var $header = $("<h3 class='head'></h3>").html(title);
		
		if(this.selectableCategories && !this.data[key].notSelectable){
			$header.append($("<nobr><div id='"+key+"dynamictext' class='dynamic'>"+this.selectableCategories.defaultText+"</div></nobr>"));
			$header.append($("<input type='radio' name='cats' class='cats "+this.id+"cats' value='"+key+"' />"));	
			$("#"+this.id).undelegate("."+this.id+"cats" ,'click');	
			$("#"+this.id).delegate("."+this.id+"cats" ,'click',{self:this},SOTE.widget.List.handleCategorySelection);
		}

		$content.append($header);

		$category = $("<ul id='"+this.id+key+"'></ul>").addClass(this.id+'category');

		this.values[key] = new Object;		
		
		// For all items in category (i.e. for all items in baselayers)
		
		for(var i=0; i<this.data[key].items.length; ++i){
			
			var item = this.data[key].items[i];
			var label = item.label;
			var fLabel = item.label.replace(" ","-").toLowerCase();
			
			if(item.value in this.selected){
				this.values[key][item.value] = 1;
			}
			// If only showing a subset of items (i.e. only show items that are in selected)
			
			if(!this.filter || item.value in this.selected) {
								
				// Do keyword search if the keyword is not empty				
								
				if(this.search && !this.keyword.match(/^\s*$/)){
					var count = 0;
					for(var j=0; j<keywords.length; ++j){
						var myVal = new RegExp(keywords[j]);
						if(item.label.toUpperCase().match(myVal) || item.sublabel.toUpperCase().match(myVal) || item.tags && item.tags.toUpperCase().match(myVal)) {
								count++;	
						}
					}
				}
				else {
					count = keywords.length;
				}

				// If the the item is not in the selected category, regardless of a keyword match, don't show it

				if(item.categories && !(this.selectedCategory in item.categories)){
					count = -1;
				}
				
				// If search is selected, see if the item matched all words in the keywords list, if so, display
				// If search is not selected, display all items
				
				if(!this.search || (keywords && count == keywords.length)){
					
					$item = $("<li id='"+key+"-"+item.value+"' class='item'></li>");
					
					if(this.close){
						$item.append("<a><img class='close bank-item-img' id='close"+key+"-"+item.value.replace(/:/g,"colon")+"' title='Remove Layer' src='images/close-red-x.png' /></a>");
					}
					
					if(this.hide){
						if (item.value in this.hidden){
							$item.append("<a class='hdanchor'><img class='hide bank-item-img' title='Show Layer' id='hide"+key+"-"+item.value.replace(/:/g,"colon")+"' src='images/invisible.png' /></a>");
						}
						else {
							$item.append("<a class='hdanchor'><img class='hide bank-item-img' title='Hide Layer' id='hide"+key+"-"+item.value.replace(/:/g,"colon")+"' src='images/visible.png' /></a>");
						}
					}
					
					if(this.checkbox){
						var checked = (item.value in this.selected)? "checked":"";
						$item.append("<input type='checkbox' class='check' id='"+item.value.replace(/:/g,"colon")+"' value='"+item.value+"' "+checked+"/>");
					}
					$item.append("<h4>"+label+"</h4>");
					$item.append("<p>"+item.sublabel+"</p>");
					
					$category.append($item);		
				}
			}	
		}
		
		// Append the category (heading + items) to the content div
		
		$content.append($category);
	}
	
	// Append show/hide/checkbox events if this.hide = true / this.close = true / this.checkbox = true

	$("#"+this.id).undelegate(".close" ,'click');
	$("#"+this.id).undelegate(".hide" ,'click');	
	$("#"+this.id).undelegate(".check" ,'click');	
	$("#"+this.id).delegate(".close" ,'click',{self:this},SOTE.widget.List.removeItem);
	$("#"+this.id).delegate(".hide" ,'click',{self:this},SOTE.widget.List.hideItem);	
	$("#"+this.id).delegate(".check" ,'click',{self:this},SOTE.widget.List.toggleValue);
		
	
	if($(window).width() > 720)
	{
		if(this.jsp){
			var api = this.jsp.data('jsp');
			if(api) api.destroy();
		}	
		this.jsp = $( "."+this.id+"category" ).jScrollPane({autoReinitialise: false, verticalGutter:0});
	}
	
	if(this.sortable){
		$( "."+this.id+"category" ).sortable({items: "li:not(.head)"});
		$( "."+this.id+"category" ).bind('sortstart',{self:this},SOTE.widget.List.initiateSort);
		$( "."+this.id+"category" ).bind('sortstop',{self:this},SOTE.widget.List.handleSort);
	}

	setTimeout(SOTE.widget.List.adjustCategoryHeights,1,{self:this});	
};

SOTE.widget.List.prototype.setButtonEnabled = function(enabled) {
    if ( enabled ) {
        $("#" + this.id + "action").removeAttr("disabled");        
    } else {
        $("#" + this.id + "action").attr("disabled", "disabled");
    }
};

SOTE.widget.List.prototype.setActionButtonText = function(text) {
    $("#" + this.id + "action").attr("value", text);    
};

SOTE.widget.List.prototype.setCategoryDynamicText = function(id, text) {
    $("#" + id + "dynamictext").html(text);    
};

SOTE.widget.List.act = function(e){
	var self = e.data.self;
	self.action.callback(self.args);
};

SOTE.widget.List.handleCategorySelection = function(e){
	var self = e.data.self;
	self.selectableCategories.callback(e.target.value,self);
};

SOTE.widget.List.setCategory = function(e){
	e.data.self.selectedCategory = e.target.value;
	$("#"+e.data.self.id+"search").keyup();
};

SOTE.widget.List.prototype.selectCategory = function(id) {
    $("#" + this.id + " input[value='" + id + "']").prop("checked", "true");
};

SOTE.widget.List.search = function(e){
	var self = e.data.self;
	var val = e.target.value.toUpperCase();	
	self.keyword = val;
	self.update();
};

SOTE.widget.List.toggleValue = function(e){
	var self = e.data.self;
	var targetEl = e.target;
	var category = $(e.target).parents('.'+self.id+'category').attr("id");
	category = category.replace(self.id,"");
	var value = $(e.target).attr("value");
	value = value.replace(/colon/,":");
	var checked = (targetEl.checked);

	if(!self.values[category]){
			self.values[category] = new Object();
	}
	if(checked !== undefined && checked){
			self.values[category][value] = 1;	
	}
	else{
			delete self.values[category][value];
	}
			
	self.trigger();
};

SOTE.widget.List.prototype.setActionText = function(newText){
	$("#"+this.id+"action").value = newText;
};

SOTE.widget.List.prototype.setCategoryText = function(category,newText){
	$("#"+category+"dynamictext").html = newText;
};


SOTE.widget.List.adjustCategoryHeights = function(args){
	var self = args.self;
	var heights = new Array;
	var facets_height = (self.search)? $("#"+self.id+"facetedSearch").outerHeight(true): 0;
	var actions_height = (self.action)? $("#"+self.id+"action").outerHeight(true): 0;

	var container_height = $("#"+self.id).outerHeight(true) - facets_height - actions_height;
	$('#'+self.id+"content").height(container_height);
	var labelHeight = 0;
	$('#'+self.id+'content .head').each(function(){
		labelHeight += $(this).outerHeight(true);
	});
	container_height -= labelHeight;

	for(var key in self.data){
		var actual_height = 0;
		var count = 0;
		$('#' + self.id + key + ' li').each(function(){
			actual_height += $(this).outerHeight(true);
			count++;
		});

		heights.push({name:self.id+key,height:actual_height,count:count});
	}
	
	if(heights.length > 1){
		if(heights[0].height + heights[1].height > container_height){
			if(heights[0].height > container_height/2) { 
				heights[0].height = container_height/2;
			}
	
			heights[1].height = container_height - heights[0].height;
	
		}
		
		$("#" + heights[0].name).css("height",heights[0].height+"px");
		$("#" + heights[1].name).css("height",heights[1].height+"px");
		
	}
	else if ( heights.length === 1 ) {
		heights[0].height = container_height;
		$("#" + heights[0].name).css("height",heights[0].height+"px");
	}
	SOTE.widget.List.reinitializeScrollbars(self);
};

SOTE.widget.List.reinitializeScrollbars = function(self) {
	var pane = $("."+self.id+"category").each(function(){
    	var api = $(this).data('jsp');
    	if(api) api.reinitialise();
	});  
};

SOTE.widget.List.initiateSort = function(e,ui){
	$(ui.item).css('background-color','#fff5da');
};

SOTE.widget.List.handleSort = function(e,ui){
	var self = e.data.self;
	self.values = new Object;
	$(ui.item).css('background-color','rgba(238, 238, 238, 0.85)');
	for(var key in self.data){
		self.values[key] = new Array();
		jQuery('li[id|="'+key+'"]').each(function() {
        	var item = jQuery( this );
        	var id = item.attr("id");
        	var vals = id.split("-");
        	var val = vals.splice(0,1);
        	val = vals.join("-");
			if(!self.filter || val in self.selected)
	        	self.values[key][val] = 1;
    	});
	}	
	self.trigger();
};

SOTE.widget.List.removeItem = function(e){
	var self = e.data.self;
	var srcData = e.target.id.replace(/colon/g,":").replace(/close/g,"");
	var t = srcData.split(/-/);
	var category = t[0];
	var val = t[1];

	delete self.values[category][val];
		
	var formattedVal = "close"+val.replace(/:/g,"colon");
	$("#"+self.id+" #"+e.target.id).parent().parent().remove();

	self.count--;
	setTimeout(SOTE.widget.List.adjustCategoryHeights,1,{self:self});
	self.trigger();
};

SOTE.widget.List.hideItem = function(e){
	var self = e.data.self;
	var srcData = e.target.id.replace(/colon/g,":").replace(/hide/g,"");
	var t = srcData.split(/-/);
	var category = t[0];
	var val = t[1];

	if(val in self.hidden){
		delete self.hidden[val];
		e.target.src = 'images/visible.png';
		$("#"+e.target.id).attr("title","Hide Layer");
	}
	else {
		self.hidden[val] = 1;
		e.target.src = 'images/invisible.png';
		$("#"+e.target.id).attr("title","Show Layer");					
	}
	self.trigger();
};

/**
  * Sets the selected option(s) in the List from the passed in value(s), if valid 
  *     [containerId]=[options] (options is a dot delimited string with the first item containing
  *     a single select item, and the remaining items containing the multi-select items).
  *
  * @this {List}
  * @param {String} value is a dot delimited string of the key(s) of the option(s) to be set as selected
  * @returns {boolean} true or false depending on if the new value(s) validates
  *
*/
SOTE.widget.List.prototype.setValue = function(valString, selector){

	this.selected = this.unserialize(valString, selector)[1];
    
	this.render();	
	this.trigger();
};

SOTE.widget.List.prototype.currCount = function(){
	return this.count;
};

/**
  * Gets the currently selected option(s) [containerId]=[options]
  *
  * @this {List}
  * @returns {String} [container]=[options], options being a dot delimited string 
  *     representing the key(s) of the currently selected option(s)
  *
*/
SOTE.widget.List.prototype.getValue = function(){
		
	var value = this.serialize(this.values);
	return value;
};

SOTE.widget.List.prototype.serialize = function(values){
	var categories = [];
	if(!values)
		return "";
	for(var category in values){
		var catStr = [category];  
		for(var item in values[category]){
			if(item in this.hidden)
				catStr.push("!" + item);
			else
				catStr.push(item);
		}
		categories.push(catStr.join(","));
	}
	
	return categories.join("~");
};

SOTE.widget.List.prototype.unserialize = function(string, selector){
	var unserialized = new Object;
	var hideIndicator = /^!/;
	var categories = string.split("~");
	var values = new Object;
	this.count = 0;
	
	
	for(var i=0; i<categories.length; i++){
		var items = categories[i].split(/[\.,]/);
		unserialized[items[0]] = new Object;
		for(var j=1; j<items.length; j++){
	    	if(hideIndicator.test(items[j])){
				items[j] = items[j].replace(/!/g, "");  	
		    	this.hidden[items[j]] = 1;
		    }
		    else {
		    	if(!selector){
		    		delete this.hidden[items[j]];
		    	}
		    }

		    unserialized[items[0]][items[j]] = 1;
		    values[items[j]] = 1;
			this.count++;
		}
		
	}
	
	for(var key in this.hidden){
		if( !key in values ){
			delete this.hidden[key];
		}
	}
	
	return [unserialized,values];
};

SOTE.widget.List.prototype.setHeight = function(height){
	$("#"+this.id).css("height",height+"px");
	SOTE.widget.List.adjustCategoryHeights({self:this});
};

/**
  * Sets the data accessor that provides state change instructions given dependencies
  *
  * @this {List}
  * @param {String} datasourceurl is the relative location of the data accessor 
  *
*/
SOTE.widget.List.prototype.setDataSourceUrl = function(dataSourceUrl){
	this.dataSourceUrl = dataSourceUrl;
};

/**
  * Gets the data accessor
  * 
  * @this {List}
  * @returns {String} the relative location of the accessor
  *
*/
SOTE.widget.List.prototype.getDataSourceUrl = function(){
	return this.dataSourceUrl;
};

/**
  * Sets the status of the component
  *
  * @this {List}
  * @param {String} s the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.List.prototype.setStatus = function(s){
	this.statusStr = s;
};

/**
  * Gets the status of the component
  *
  * @this {List}
  * @returns {String} the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.List.prototype.getStatus = function(){
	return this.statusStr;
};

