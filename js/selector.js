SOTE.namespace("SOTE.widget.Selector"); 

SOTE.widget.Selector.prototype = new SOTE.widget.Component;

/**
  * Instantiate the Selector  
  *
  * @class A selection device classifying radio buttons/checkboxes into categories that are displayed in Accordion form.
  *     Radio buttons allow single selection accross categories.  Checkboxes allow multiple selections accross categories.
  * 	Radio selections cannot span multiple categories.
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
    this.values = this.unserialize(this.selected[this.state]);
    
    this.meta = new Object;
    this.categories = config.categories;
	this.initRenderComplete = false;
	this.dataSourceUrl = config.dataSourceUrl;
	this.statusStr = "";
	this.init();
	//this.updateComponent(this.id+"=baselayers.MODIS_Terra_CorrectedReflectance_TrueColor-overlays.fires48.AIRS_Dust_Score.OMI_Aerosol_Index")

}

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
	SOTE.util.getJSON(
		"data/" + this.state + "_" + this.dataSourceUrl,
		{self:this},
		SOTE.widget.Selector.handleLoadSuccess,
		SOTE.widget.Selector.handleUpdateFailure
	);
};

SOTE.widget.Selector.handleLoadSuccess = function(data,status,xhr,args){
	var self = args.self;
	self.data = data;
	self.render();

}

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

	
	var catList = document.createElement("ul");
	catList.setAttribute("class","toplevel");

//<div id="selectorbox"><h1>Choose Your Interest Area</h1><ul><li><a>Text 1</a></li></ul><a>Skip this step</a></div>
	var titleContainer = document.createElement("div");
	var title = document.createElement("h2");
	title.innerHTML = "Choose Your Interest Area";
	titleContainer.appendChild(title);
	this.container.appendChild(titleContainer);
	var count = 0;

	SOTE.widget.Selector.loadCategory({ data: {self:this,category:"All"}, back: false });
	
	
	// Mark the component as ready in the registry if called via init() 
	if ((this.initRenderComplete === false) && REGISTRY) {
		this.initRenderComplete = true;
		REGISTRY.markComponentReady(this.id);
	}
	
	
	
};

SOTE.widget.Selector.prototype.resize = function (){
	var tabs_height = $(".ui-tabs-nav").outerHeight(true);
	$('#'+this.id).height($('#'+this.id).parent().outerHeight() - tabs_height);	
	setTimeout(SOTE.widget.Selector.adjustCategoryHeights,1,{self:this});
};

SOTE.widget.Selector.callRender = function (e){
	e.data.self.openCat = null;
	e.data.self.render();
};

SOTE.widget.Selector.prototype.reloadCategory = function(){
	var e = new Object;
	e.data = new Object;
	e.data.self = this;
	e.data.category = this.openCat;
	SOTE.widget.Selector.loadCategory(e);
};

SOTE.widget.Selector.loadCategory = function(e){
	
	var self = e.data.self;
	var cat = e.data.category;
	self.openCat = cat;
	var back = false;

	
	var categories = new Object;
	//self.container.innerHTML = "";
    $("#"+self.id).empty();
	
	var form = document.createElement("div");
	form.setAttribute("class","facetedSearch");
	form.setAttribute("id",self.id+"facetedSearch");
	
	var select = document.createElement("select");
	select.setAttribute("id",self.id+"select");
	select.setAttribute("class","select");
	for (var c in self.data){
		if(c != 'palettes'){
			var opt = document.createElement("option");
			opt.setAttribute("value",c);
			opt.text = c;
			select.add(opt);
		}
	}
	
	form.appendChild(select);
	
	
	var search = document.createElement("input");
	search.setAttribute("type","text");
	search.setAttribute("name","search");
	search.setAttribute("id",self.id+"search");
	search.setAttribute("class","search");
	search.setAttribute("placeholder","ex. modis, terra, fire");
	search.setAttribute("autocomplete","off");
	
	form.appendChild(search);
	
	var content = document.createElement("div");
	content.setAttribute("id",self.id+"content");
	
	var categoryTitles = [];
	
	for(var i=0; i<self.categories.length; i++){
		var formattedCategoryName = self.categories[i].replace(/\s/g, "");
		
		
		var categoryTitle = document.createElement("h3");
		categoryTitle.setAttribute("class","head");
		categoryTitle.innerHTML = self.categories[i];
		categoryTitles.push(categoryTitle);
		
		categories[formattedCategoryName.toLowerCase()] = document.createElement("ul");
		categories[formattedCategoryName.toLowerCase()].setAttribute("id",self.id + formattedCategoryName.toLowerCase());
		categories[formattedCategoryName.toLowerCase()].setAttribute("class",self.id + "category category scroll-pane");
		
	}
		
		
	for(var i=0; i< self.data[cat].length; i++){
		var item = self.data[cat][i];
		var subItem = document.createElement("li");
		subItem.setAttribute("class","selectorItem item");
		var itemHead = document.createElement("h4");
		var formatted = item.value.replace(/:/g,"colon");
		itemHead.innerHTML = item.label;
		var itemP = document.createElement("p");
		itemP.innerHTML = item.sublabel;
		var itemInput = document.createElement("input");
		if(item.type === "single"){
			itemInput.setAttribute("type","checkbox");
			itemInput.setAttribute("name",cat);
		}
		else {
			itemInput.setAttribute("type","checkbox");
		}
		itemInput.setAttribute("id",formatted);
		itemInput.setAttribute("value",item.value);
		subItem.appendChild(itemInput);
		subItem.appendChild(itemHead);
		subItem.appendChild(itemP);
		
		categories[item.category].appendChild(subItem);
		$("#"+self.id).delegate("#" + formatted,'click',{self:self},SOTE.widget.Selector.toggleValue);
	}
	
	for(var i=0; i<self.categories.length; i++){
		var formattedCategoryName = self.categories[i].replace(/\s/g, "");
		var catContainer = document.createElement("div");
		catContainer.setAttribute("id",self.id+formattedCategoryName);
		catContainer.setAttribute("class","categoryContainer");
		catContainer.appendChild(categoryTitles[i]);
		catContainer.appendChild(categories[formattedCategoryName.toLowerCase()]);
		content.appendChild(catContainer);
	}
	
	self.container.appendChild(form);
	self.container.appendChild(content);
	//self.renderCanvases(cat);	
	if(back){
		var subBack = document.createElement("a");
		subBack.setAttribute("id","subback");
		subBack.setAttribute("class","flowbutton");
		subBack.setAttribute("href","javascript:void(0);");
		subBack.innerHTML = "<< <b>go back</b> and reselect my interest area";
		self.container.appendChild(subBack);
        $("#"+self.id).undelegate("#" + "subback",'click');
		$("#"+self.id).delegate("#" + "subback",'click',{self:self},SOTE.widget.Selector.callRender);
	}
	
    //$("#"+self.id+"search").undelegate('keypress');
    $("#"+self.id+"select").on('change',{self:self,select:true},SOTE.widget.Selector.selectCat);
	$('#'+self.id+"select").val("All");

    $("#"+self.id+"search").on('keyup',{self:self,select:false},SOTE.widget.Selector.search);
	$("#"+self.id+"search").focus();
	
	if($(window).width() > 720){
		if(self.jsp){
			var api = self.jsp.data('jsp');
			if(api) {api.destroy()};
		}	
		self.jsp = $( ".category" ).jScrollPane({autoReinitialise: true, verticalGutter:0});
	}
	setTimeout(SOTE.widget.Selector.adjustCategoryHeights,1,{self:self});
	
	self.adjustSelected();
	
	
};

SOTE.widget.Selector.selectCat = function(e){
	e.data.self.openCat = e.target.value;
	$("#"+e.data.self.id+"search").keyup();
};

SOTE.widget.Selector.search = function(e){
	var self = e.data.self;
	var cat = self.openCat;
	var val = e.target.value.toUpperCase();
	val = val.replace(/[\(\)\"\'!\$\%\&\?\+\*\\\@\=]/g,"");
	var valArr = val.split(/\s/);
	//var re = new RegExp(val);
	var content = document.getElementById(self.id+"content");
	content.innerHTML = "";

	var categories = new Object;

	var categoryTitles = [];
	
	for(var i=0; i<self.categories.length; i++){
		var formattedCategoryName = self.categories[i].replace(/\s/g, "");
		
		
		var categoryTitle = document.createElement("h3");
		categoryTitle.setAttribute("class","head");
		categoryTitle.innerHTML = self.categories[i];
		categoryTitles.push(categoryTitle);
		
		categories[formattedCategoryName.toLowerCase()] = document.createElement("ul");
		categories[formattedCategoryName.toLowerCase()].setAttribute("id",self.id + formattedCategoryName.toLowerCase());
		categories[formattedCategoryName.toLowerCase()].setAttribute("class",self.id + "category category scroll-pane");
		
	}


	for(var i=0; i< self.data[cat].length; i++){
		var item = self.data[cat][i];
		
		//var matched = false;
		var count = 0;
		for(var j=0; j<valArr.length; ++j){
			var myVal = new RegExp(valArr[j]);
			if(item.label.toUpperCase().match(myVal) || item.sublabel.toUpperCase().match(myVal) || item.tags && item.tags.toUpperCase().match(myVal)) {
					count++;	
			}
		}
		
		if(count == valArr.length) { //item.label.toUpperCase().match(val) || item.sublabel.toUpperCase().match(val)){
		
			var subItem = document.createElement("li");
			subItem.setAttribute("class","selectorItem item");
			var itemHead = document.createElement("h4");
			var formatted = item.value.replace(/:/g,"colon");
			itemHead.innerHTML = item.label;
			var itemP = document.createElement("p");
			itemP.innerHTML = item.sublabel;
			var itemInput = document.createElement("input");
			if(item.type === "single"){
				itemInput.setAttribute("type","checkbox");
				itemInput.setAttribute("name",cat);
			}
			else {
				itemInput.setAttribute("type","checkbox");
			}
			itemInput.setAttribute("class","css-checkbox");
			itemInput.setAttribute("id",formatted);
			itemInput.setAttribute("value",item.value);
			subItem.appendChild(itemInput);
			subItem.appendChild(itemHead);
			subItem.appendChild(itemP);
			
			categories[item.category].appendChild(subItem);
			//ul.appendChild(subItem);
			$("#"+self.id).delegate("#" + formatted,'click',{self:self},SOTE.widget.Selector.toggleValue);
		}
	}		
	
	for(var i=0; i<self.categories.length; i++){
		var formattedCategoryName = self.categories[i].replace(/\s/g, "");
		var catContainer = document.createElement("div");
		catContainer.setAttribute("id",self.id+formattedCategoryName);
		catContainer.setAttribute("class","categoryContainer");
		catContainer.appendChild(categoryTitles[i]);
		catContainer.appendChild(categories[formattedCategoryName.toLowerCase()]);
		content.appendChild(catContainer);
	}
	
	if($(window).width() > 720){
		if(self.jsp){
			var api = self.jsp.data('jsp');
			if(api) api.destroy();
		}	
		self.jsp = $( ".category" ).jScrollPane({autoReinitialise: true, verticalGutter:0});
	}
	setTimeout(SOTE.widget.Selector.adjustCategoryHeights,1,{self:self});

	self.adjustSelected();

	//content.appendChild(ul);
	
};

SOTE.widget.Selector.prototype.renderCanvases = function(cat){
	for(var i=0; i< this.data[cat].length; i++){
		var item = this.data[cat][i];
		if(this.data.palettes[item.value]){
			var p = this.data.palettes[item.value];
			var width = 100/p.palette.length;
			var canvas = document.getElementById("canvas"+this.id+item.value);
			var context = canvas.getContext('2d');
			for(var k=0; k<p.palette.length; ++k){
				context.fillStyle = "rgba("+ p.palette[k] +")";
				context.fillRect (width*k,0,width,14);
			}
		}
	}

};

SOTE.widget.Selector.adjustCategoryHeights = function(args){
	var self = args.self;
	var heights = new Array;
	var facets_height = $("#"+self.id+"facetedSearch").outerHeight(true);
	var container_height = $("#"+self.id).outerHeight() - facets_height;
	$('#'+self.id+"content").height(container_height);
	var labelHeight = 0;
	$('#'+self.id+'content .head').each(function(){
		labelHeight += $(this).outerHeight(true);
	});
	container_height -= labelHeight;
	//console.log("This.id: " + container_height);
	for(var i=0; i<self.categories.length; i++){
		var formattedCategoryName = self.categories[i].replace(/\s/g, "");
		var actual_height = 0;
		var count = 0;
		$('#' + self.id + formattedCategoryName.toLowerCase() + ' li').each(function(){
			//console.log(document.getElementById(", " + $(this).outerHeight()));
			actual_height += $(this).outerHeight();
			count++;
		});

		heights.push({name:self.id + formattedCategoryName.toLowerCase(),height:actual_height,count:count});
	}
	
	if(heights[0].height + heights[1].height > container_height){
		if(heights[0].height > container_height/2) { 
			heights[0].height = container_height/2;
		}

		heights[1].height = container_height - heights[0].height;

	}
	
	$("#" + heights[0].name).css("height",heights[0].height+"px");
	$("#" + heights[1].name).css("height",heights[1].height+"px");
	
	
};

SOTE.widget.Selector.prototype.adjustSelected = function(){
	var inputs = document.getElementsByTagName("input");
	for(var i=0; i<inputs.length; i++){
		inputs[i].checked = "";	
	}
	for(var j=0; j<this.categories.length; j++){
		var formatted = this.categories[j].replace(/\s/g, "");
		formatted = formatted.toLowerCase();
		if(this.values[formatted]){
			for(var k=0; k < this.values[formatted].length; k++){
				var val = this.values[formatted][k].value.replace(/:/g,"colon");
				var el = document.getElementById(val);
				if(el)
					el.checked = "checked";
			}
		}
	}
};

SOTE.widget.Selector.toggleValue = function(e){
	var self = e.data.self;
	var targetEl = e.target;
	var category = $("#"+targetEl.id).parents('.category').attr("id");
	category = category.replace(self.id,"");
	var value = $("#"+targetEl.id).attr("value");
	value = value.replace(/colon/,":");
	var checked = $("#"+targetEl.id).attr("checked");

	if(!self.values[category]){
			self.values[category] = new Array();
	}
	if(checked !== undefined && checked == "checked"){
			self.removeItem(category,value); 
			self.values[category].unshift({"value":value});	
	}
	else{
			self.removeItem(category,value);
	}
			
	self.fire();
};

SOTE.widget.Selector.prototype.removeItem = function(cat,val){
	for(var i=0; i<this.values[cat].length; i++){
		if(this.values[cat][i].value == val){
			this.values[cat].splice(i,1);
		}
	}
};

/**
  * Fires an event to the registry when the state of the component is changed
  *
  * @this {Selector}
  *
*/
SOTE.widget.Selector.prototype.fire = function(){
	setTimeout(SOTE.widget.Selector.adjustCategoryHeights,1,{self:this});

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

	this.values = this.unserialize(valString);
	return this.validate();
	
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
		
	var value = this.serialize(this.values);
	return this.id + "=" + value;
};

SOTE.widget.Selector.prototype.serialize = function(values){
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
				serialized += "," + values[formatted][j].value;
			}
		}
	}
	return serialized;
};

SOTE.widget.Selector.prototype.unserialize = function(string){
	var unserialized = new Object;
	var hideIndicator = /^!/;
	var categories = string.split("~");
	for(var i=0; i<categories.length; i++){
		var items = categories[i].split(/[\.,]/);
		unserialized[items[0]] = new Array;
		for(var j=1; j<items.length; j++){
			if(hideIndicator.test(items[j])){
				items[j] = items[j].replace(/!/g,"");
			}
			unserialized[items[0]].push({"value":items[j]});
		}
		
	}
	return unserialized;
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
		self.values = self.unserialize(vals);
		if(self.openCat !== undefined && self.openCat !== null){
			self.adjustSelected();
		}
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

