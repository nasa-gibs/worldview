SOTE.namespace("SOTE.widget.RubberBand");


/**
  * Instantiate the rubberBand
  *
  * @class A "rubberband" tool class. Uses the JCrop library.
  * @constructor
  * @this {RBand}
  * @param {String} containerId is the container id of the div in which to render the object 
  * @param {String} config contains the id of the map div element.
  * 
  * 
*/


SOTE.widget.RubberBand = function (containerId, config){  
    this.PALETTE_WARNING = 
        "Image download does not support the custom palette that you have " +
        "applied. Would you like to reset the palette back to the default?";
        
	this.container=document.getElementById(containerId);	
	this.coords = null;
	if (this.container==null){
		this.setStatus("Error: element '"+containerId+"' not found!",true);
		return;
	}
	
	if(config===undefined) {
		 config={};
	}
	this.icon = config.icon;
	this.onicon = config.onicon;
	this.cropee = config.cropee;
	this.projectionSwitch="geographic";
	this.id = containerId;
	this.state = "off";
	this.jcropAPI = null;
	this.mapWidget = config.mapWidget;
	this.paletteWidget = config.paletteWidget;
	this.palettesActive = false;
	//this.windowURL = "";
	
	this.init();
};


SOTE.widget.RubberBand.prototype = new SOTE.widget.Component;

/**
  * Initializes the RubberBand component. 
  * 
  * @this {RubberBand}
  * @requires SOTE.widget.Map
*/
SOTE.widget.RubberBand.prototype.init = function(){
	this.container.setAttribute("class","rubberband");
	
	this.container.innerHTML = "<a id='"+this.id+"camera_link' class='toolbaricon' title='Take a snapshot'><img src='"+this.icon+"' /></a>";
	$('#'+this.id+"camera_link").bind('click',{self:this},SOTE.widget.RubberBand.toggle);
	
	if(REGISTRY){
 		REGISTRY.register(this.id,this);
 		REGISTRY.markComponentReady(this.id); 
	}
	else{
		alert("No REGISTRY found!  Cannot register Rubber Band!");
	}
};

SOTE.widget.RubberBand.toggle = function(o){
	var self = o.data.self;

    var toggleOn = function() {
        self.state = "on";
        $("#"+self.id+"camera_link img").attr("src",self.onicon);
        $("#imagedownload").show('slide', {direction: 'up'}, 1000); 
        self.draw(); 
    };		
    
    var disablePalettes = function() {
        var map = self.mapWidget.productMap.map;
        var handler = function() {
            map.events.unregister("maploadend", map, handler);
            toggleOn();
        };
        map.events.register("maploadend", map, handler);
        self.paletteWidget.setValue("");        
    };
    
	if(self.state == "off" && self.projectionSwitch == "geographic"){
	    if (self.palettesActive) {
	        Worldview.ask({
	            header: "Notice",
	            message: self.PALETTE_WARNING,
	            onYes: disablePalettes
	        });
	    } else {
            toggleOn();
        }
	}
	else if(self.projectionSwitch == "geographic"){
		self.state = "off";
		$("#"+self.id+"camera_link img").attr("src",self.icon);
		self.jcropAPI.destroy(); 
		$("#imagedownload").hide('slide', {direction: 'up'}, 1000); 	
	}
	else {
  		SOTE.util.throwError("The download feature is currently available for geographic projection only.");
	}
}

/**
  * Sets the values for the rubberband (x1, y1, x2, y2, width, height) from the passed "coordinates" object of JCrop  *
  * @this {RBand}
  * @param {String} coordinates object of JCrop
  * 
*/
SOTE.widget.RubberBand.prototype.setValue = function(c) {
	 
	this.coords = c;
	 this.fire();   
};

/**
  * Gets the JCrop coordinates object, which holds the current rubberband box's x,y,x2,y2,height, width values.
  * @this {RBand}
  * @returns {String} an object containing the x,y,x2,y2, width, and height values for the rubberband.
  *
*/
SOTE.widget.RubberBand.prototype.getValue = function() {
	if(this.coords){
		var returnVal = this.id + "=" + this.coords.x+","+this.coords.y+","+this.coords.x2+","+this.coords.y2+","+this.coords.w+","+this.coords.h;
		return returnVal;
	}
	else {
		return;
	}
};

/**
  * Modify the component based on dependencies 
  * 
  * @this {RBand}
  * @param {String} querystring contains all values of dependencies (from registry)
  * @returns {boolean} true or false depending on if the selected date validates against the updated criteria
  * 
*/
SOTE.widget.RubberBand.prototype.updateComponent = function(qs){
		this.projectionSwitch =   SOTE.util.extractFromQuery("switch",qs);
		if(SOTE.util.extractFromQuery("palettes",qs)){
		  this.palettesActive = true;  
		} else {
          this.palettesActive = false;		  
		}
};

/**
  * Sets the selected date from the querystring, [containerId]=[selectedDate]
  * 
  * @this {RBand}
  * @param {String} qs contains the querystring (must contain [containerId]=[selectedDate] in the string)
  * @returns {boolean} true or false depending on if the extracted date validates
  *
*/
SOTE.widget.RubberBand.prototype.loadFromQuery = function(qs){
	return this.setValue(SOTE.util.extractFromQuery(this.id,qs));
};

/**
  * Validates
  * 
  * @this {RBand}
  * @returns {boolean} true or false depending on whether the date is not null and within bounds
*/
SOTE.widget.RubberBand.prototype.validate = function(){
  // Content
};

/**
  * Sets the  accessor that provides state change instructions given dependencies
  *
  * @this {RBand}
  * @param {String} sourceurl is the relative location of the  accessor 
  *
*/
SOTE.widget.RubberBand.prototype.setSourceUrl = function(sourceurl){
  // Content
};

/**
  * Gets the  accessor
  * 
  * @this {RBand}
  * @returns {String} the relative location of the accessor
  *
*/
SOTE.widget.RubberBand.prototype.getSourceUrl = function(){
  // Content
};

/**
  * Sets the status of the component
  *
  * @this {RBand}
  * @param {String} s the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.RubberBand.prototype.setStatus = function(s){
  // Content
};

/**
  * Gets the status of the component
  *
  * @this {RBand}
  * @returns {String} the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.RubberBand.prototype.getStatus = function(){
 
};

/**
  * Activates the drawing on the map.
  *
  * @this {RBand}
  * 
  *
*/
SOTE.widget.RubberBand.prototype.draw =  function() {

    var self = this;
    
    $("#"+this.cropee).Jcrop({          
            bgColor:     'black',
            bgOpacity:   0.3,
            onSelect:  function(c){SOTE.widget.RubberBand.handleChange(c, self);},
            onChange: function(c){SOTE.widget.RubberBand.handleChange(c, self);},
            onRelease: function(c){SOTE.widget.RubberBand.toggle({data: {self:self} }); },
            fullScreen: true
            }); 
    
    this.jcropAPI = $('#'+this.cropee).data('Jcrop');
            
    this.jcropAPI.setSelect([($(window).width()/2)-100,($(window).height()/2)-100,($(window).width()/2)+100,($(window).height()/2)+100]);         
    
};


SOTE.widget.RubberBand.handleChange = function(c, self){
	
	self.setValue(c);
	
	
};


/**
 * Fires an event in the registry when the component value is changed 
 */

SOTE.widget.RubberBand.prototype.fire = function(){
 
	if(REGISTRY){
		REGISTRY.fire(this);
	}
	else{
		alert("No REGISTRY found! Cannot fire to REGISTRY from Map!");
	}

};




