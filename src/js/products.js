SOTE.namespace("SOTE.widget.Products"); 

SOTE.widget.Products.prototype = new SOTE.widget.Component;

/**
  * A selection device classifying radio buttons/checkboxes into categories that are displayed in Accordion form.
  *     Radio buttons allow single selection accross categories.  Checkboxes allow multiple selections accross categories.
  *     Radio selections cannot span multiple categories.  
  * 
  * @module SOTE.widget
  * @class Products
  * @constructor
  * @this {Products}
  * @param {String} containerId is the container id of the div in which to render the object 
  * @param {Object} [config] is a hash allowing configuration of this component
  * @config {Object[]} [items] a JS Array of JS Objects: items.category[i..n].key, items.category[i..n].value 
  *     , items.category[i..n].action, items.type[i..n] representing the available options
  * @config {String} [selected] the key of the initially selected option(s)
  * @augments SOTE.widget.Component
  * 
*/
SOTE.widget.Products = function(containerId, config){
    this.log = Logging.getLogger("Worldview.Widget.Products");
    //this.VALID_PROJECTIONS = ["geographic", "arctic", "antarctic"];
    
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
	    config.title = "My Products";
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
	this.isCollapsed = false;
    this.dataSourceUrl = config.dataSourceUrl;
    this.categories = config.categories;
	this.initRenderComplete = false;
	this.paletteWidget = config.paletteWidget;
	this.config = config.config;
	this.init();

}

/**
  * Displays all options in HTML in an Accordion format (see JQuery UI Accordion) with the selected states being indicated
  * by radio button and checkbox selection.  All callbacks should be set.  The component UI should be rendered 
  * with controllers to call the events.
  *
  *  
  * @this {Products}
  * 
*/
SOTE.widget.Products.prototype.init = function(){
	
	this.render();
    if(REGISTRY){
 		REGISTRY.register(this.id,this);
	}
	else{
		alert("No REGISTRY found!  Cannot register Products!");
	}
	
	
};

/**
  * Renders the UI accordion from this.items
  *
  *  
  * @this {Products}
  * 
*/
SOTE.widget.Products.prototype.render = function(){

	this.container.innerHTML = "";
	//var productContainer = document.createElement("div");
	//this.container.setAttribute("id",this.id+"prods");
	this.container.setAttribute("class","products");

	var tabs = document.createElement("ul");
	tabs.setAttribute("id",this.id+"tabs");
	tabs.innerHTML = "<li class='first'><a href='#products' class='activetab tab'>Active</a></li><li class='second'><a class='addlayerstab tab' href='#selectorbox'>Add Layers +</a></li>";
	this.container.appendChild(tabs);
	//$('#'+this.id).addClass('products');
	var toggleButtonHolder = document.createElement("div");
	toggleButtonHolder.setAttribute("id",this.id+"toggleButtonHolder");
	toggleButtonHolder.setAttribute("class","toggleButtonHolder");
	var accordionToggler = document.createElement("a");
	accordionToggler.setAttribute("class","accordionToggler atcollapse arrow");
	accordionToggler.setAttribute("title","Hide Products");
	this.isCollapsed = false;
	toggleButtonHolder.appendChild(accordionToggler);
	this.container.appendChild(toggleButtonHolder);

	var container = document.createElement("div");
	container.setAttribute("id","products");
	this.container.appendChild(container);

	var selectorbox = document.createElement("div");
	selectorbox.setAttribute("id","selectorbox");
	this.container.appendChild(selectorbox);



	//this.container.appendChild(productContainer);
	$('#'+this.id).tabs({show: SOTE.widget.Products.change});
	this.b = new SOTE.widget.Bank("products", {
	    paletteWidget: this.paletteWidget, 
	    dataSourceUrl: "ap_products.php",
	    title: "My Layers",
	    selected: {
	        antarctic: "baselayers,!MODIS_Aqua_CorrectedReflectance_TrueColor,MODIS_Terra_CorrectedReflectance_TrueColor~overlays,antarctic_coastlines", 
	        arctic:"baselayers,!MODIS_Aqua_CorrectedReflectance_TrueColor,MODIS_Terra_CorrectedReflectance_TrueColor~overlays,arctic_coastlines",
	        geographic:"baselayers,!MODIS_Aqua_CorrectedReflectance_TrueColor,MODIS_Terra_CorrectedReflectance_TrueColor~overlays,sedac_bound"
        },
        categories:["Base Layers","Overlays"],
        config: this.config
    });
    this.s = new SOTE.widget.Selector("selectorbox", {
        dataSourceUrl: "ap_products.php",
        categories: ["Base Layers","Overlays"], 
        selected: {
            antarctic: "baselayers,!MODIS_Aqua_CorrectedReflectance_TrueColor,MODIS_Terra_CorrectedReflectance_TrueColor~overlays,antarctic_coastlines", 
            arctic:"baselayers,!MODIS_Aqua_CorrectedReflectance_TrueColor,MODIS_Terra_CorrectedReflectance_TrueColor~overlays,arctic_coastlines",
            geographic:"baselayers,!MODIS_Aqua_CorrectedReflectance_TrueColor,MODIS_Terra_CorrectedReflectance_TrueColor~overlays,sedac_bound"
        },
        config: this.config
    });	
    
    //$('#'+this.id+"prods").on("tabsshow",SOTE.widget.Products.change);
   	$('.accordionToggler').bind('click',{self:this},SOTE.widget.Products.toggle);
	
	if($(window).width() < 720){
		SOTE.widget.Products.toggle({data: {self:this}});
	}


	//setTimeout(SOTE.forceResize();

	// Mark the component as ready in the registry if called via init() 
	if ((this.initRenderComplete === false) && REGISTRY) {
		this.initRenderComplete = true;
		REGISTRY.markComponentReady(this.id);
	}
	var self = this;
	$(window).resize(function(){
		self.b.render();
		self.s.resize();
		self.adjustAlignment();
	});
	
	$("#products").bind("fire", {self:this}, SOTE.widget.Products.handleFire);

};

SOTE.widget.Products.handleFire = function(e){
	var self = e.data.self;
	if(self.isCollapsed){
		$('.accordionToggler').html("Active ("+ self.b.currCount()+")");
	}
};

SOTE.widget.Products.prototype.adjustAlignment = function(){
	if($(window).width() < 720 && this.isCollapsed){
		var w = $('.products').outerWidth();	
		$('.products').css("left", "-"+w+"px");
	}
};

SOTE.widget.Products.forceResize = function(self){
	var outerHeight = $("#"+self.id).outerHeight();
	var tabHeight = $("#"+self.id+"tabs").outerHeight();
	self.b.setHeight(outerHeight - tabHeight);
	self.s.setHeight(outerHeight - tabHeight);
};

SOTE.widget.Products.stopLink = function(e){
	//e.stopPropagation();
};

SOTE.widget.Products.change = function(e,ui){	
	if(ui.index){
		$('.ui-tabs-nav').addClass('secondselected').removeClass('firstselected');
	}
	else {
		$('.ui-tabs-nav').addClass('firstselected').removeClass('secondselected');
	}

	return false;
};

SOTE.widget.Products.toggle = function(e,ui){
	var self = e.data.self;
	if(self.isCollapsed){
		$('.accordionToggler').removeClass('atexpand').addClass('atcollapse').removeClass('staticLayers dateHolder').addClass('arrow');
		$('.accordionToggler').attr("title","Hide Products");
		$('.accordionToggler').empty();
		//$('.products').css("left","0");
		$('.products').animate({left:'0'}, 300);
		self.isCollapsed = false;
		$('.accordionToggler').appendTo("#"+self.id+"toggleButtonHolder");
	}
	else{
		$('.accordionToggler').removeClass('atcollapse').addClass('dateHolder').removeClass('arrow').addClass('staticLayers');
		$('.accordionToggler').attr("title","Show Products");
		$('.accordionToggler').html("Active ("+ self.b.currCount()+")");

		var w = $('.products').outerWidth();
		$('.products').animate({left:'-'+w+"px"}, 300);
		self.isCollapsed = true;
		$("#"+self.id).after($('.accordionToggler'));
	} 	
};

/**
  * Fires an event to the registry when the state of the component is changed
  *
  * @this {Products}
  *
*/
SOTE.widget.Products.prototype.fire = function(){

	if(REGISTRY){
		REGISTRY.fire(this);
	}
	else{
		alert("No REGISTRY found! Cannot fire to REGISTRY from Products!");
	}

};

/**
  * Gets the currently selected option(s) [containerId]=[options]
  *
  * @this {Products}
  * @returns {String} [container]=[options], options being a dot delimited string 
  *     representing the key(s) of the currently selected option(s)
  *
*/
SOTE.widget.Products.prototype.getValue = function(){
	return this.id + "=" + this.b.value();
};

/**
  * Change the component based on dependencies (i.e. Available Options, Selected)
  * 
  * @this {Bank}
  * @param {String} querystring contains all values of dependencies (from registry)
  * @returns {boolean} true or false depending on if the selected value still validats with criteria change
  * 
*/
SOTE.widget.Products.prototype.updateComponent = function(querystring){
	var qs = (querystring === undefined)? "":querystring;
	this.fire();
};