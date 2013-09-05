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

    this.hidden = new Object;
    this.values = new Object;
       
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
	$("#"+this.id).trigger("listchange");	
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

	$(this.container).empty().addClass('list');
	
	for(var key in this.data){
		var title = this.data[key].title;
				
		$(this.container).append($("<h3 class='head'></h3>").html(title));
		$category = $("<ul id='"+key+"'></ul>").addClass('category');
		
		this.values[key] = new Object;		
		
		for(var i=0; i<this.data[key].items.length; ++i){
			
			var item = this.data[key].items[i];
			var label = item.label;
			var fLabel = item.label.replace(" ","-").toLowerCase();
			
			if(item.value in this.selected) {
				
				this.values[key][item.value] = 1;
				
				$item = $("<li id='"+key+"-"+item.value+"' class='item'></li>");
				$item.append("<a><img class='close bank-item-img' id='close"+key+"-"+item.value.replace(/:/g,"colon")+"' title='Remove Layer' src='images/close-red-x.png' /></a>");
				if (item.value in this.hidden){
					$item.append("<a class='hdanchor'><img class='hide bank-item-img' title='Show Layer' id='hide"+key+"-"+item.value.replace(/:/g,"colon")+"' src='images/invisible.png' /></a>");
				}
				else {
					$item.append("<a class='hdanchor'><img class='hide bank-item-img' title='Hide Layer' id='hide"+key+"-"+item.value.replace(/:/g,"colon")+"' src='images/visible.png' /></a>");
				}
				$item.append("<h4>"+label+"</h4>");
				$item.append("<p>"+item.sublabel+"</p>");
				
				$category.append($item);		
			
			}	
		}
		
		$(this.container).append($category);
	}

	$("#"+this.id).undelegate(".close" ,'click');
	$("#"+this.id).undelegate(".hide" ,'click');	
	$("#"+this.id).delegate(".close" ,'click',{self:this},SOTE.widget.List.removeItem);
	$("#"+this.id).delegate(".hide" ,'click',{self:this},SOTE.widget.List.hideItem);	
	$( ".category" ).sortable({items: "li:not(.head)"});
	
	if($(window).width() > 720)
	{
		if(this.jsp){
			var api = this.jsp.data('jsp');
			if(api) api.destroy();
		}	
		this.jsp = $( "." + this.id + "category" ).jScrollPane({autoReinitialise: false, verticalGutter:0});
	}
	
	$( "." + this.id + "category li" ).disableSelection();	
	$( ".category" ).bind('sortstart',{self:this},SOTE.widget.List.initiateSort);
	$( ".category" ).bind('sortstop',{self:this},SOTE.widget.List.handleSort);

	setTimeout(SOTE.widget.List.adjustCategoryHeights,1,{self:this});
	
};

SOTE.widget.List.adjustCategoryHeights = function(args){
	var self = args.self;
	var heights = new Array;
	var container_height = $("#"+self.id).outerHeight(true);
	var labelHeight = 0;
	$('#'+self.id+' .head').each(function(){
		labelHeight += $(this).outerHeight(true);
	});
	container_height -= labelHeight;

	for(var key in self.values){
		var actual_height = 0;
		var count = 0;
		$('#' + key + ' li').each(function(){
			actual_height += $(this).outerHeight(true);
			count++;
		});

		heights.push({name:key,height:actual_height,count:count});
	}
	
	if(heights[0].height + heights[1].height > container_height){
		if(heights[0].height > container_height/2) { 
			heights[0].height = container_height/2;
		}

		heights[1].height = container_height - heights[0].height;

	}
	
	$("#" + heights[0].name).css("height",heights[0].height+"px");
	$("#" + heights[1].name).css("height",heights[1].height+"px");
	
	SOTE.widget.List.reinitializeScrollbars(self);
};

SOTE.widget.List.reinitializeScrollbars = function(self) {
	var pane = $(".category").each(function(){
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
		unserialized[items[0]] = new Array;
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

		    unserialized[items[0]].push(items[j]);
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

