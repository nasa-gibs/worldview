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
	this.container=document.getElementById(containerId);	
	this.coords = null;
	if (this.container==null){
		this.setStatus("Error: element '"+containerId+"' not found!",true);
		return;
	}
	
	if(config===undefined) {
		 config={};
	}
	this.projectionSwitch="geographic";
	this.id = containerId;
	this.jcropAPI = null;
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
	if(REGISTRY){
 		REGISTRY.register(this.id,this);
 		REGISTRY.markComponentReady(this.id); 
	}
	else{
		alert("No REGISTRY found!  Cannot register Rubber Band!");
	}
};

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
	var returnVal = this.id + "=" + this.coords.x+","+this.coords.y+","+this.coords.x2+","+this.coords.y2+","+this.coords.w+","+this.coords.h;
	return returnVal;
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
SOTE.widget.RubberBand.prototype.draw =  function(mapId) {
  
   if(this.projectionSwitch !="geographic"){
   	alert("The download feature is currently available for geograpic projection only.");
   	return -1;
   }
  
 
   
  var self=this;
  
  jQuery(function($){  
   if(document.getElementById('imagedownload').style.display != "block") {
   	   $("#cameraIcon").css('border', "solid 2px red");
       //$("#imagedownload").show("slow");
        $("#imagedownload").show('slide', {direction: 'right'}, 1000);
   	    $("#rbImageHolder").css("z-index", 1000);
   	    $("#rbImageHolder").css("width", "100%"); 
   	    $("#rbImageHolder").css("height", "100%"); 
   	    $("#rbImageHolder").show();
   	  //  $("#rbImage").show();
  		//document.getElementById('rbImage').style.display='block';
 
    	$("#rbImage").Jcrop({			
        	bgColor:     'black',
            bgOpacity:   0.0,
            onSelect:  function(c){SOTE.widget.RubberBand.handleChange(c, self);},
            onChange: function(c){SOTE.widget.RubberBand.handleChange(c, self);}
            },function(){
              self.jcropAPI = this;
         }); 
            //self.jcropAPI.setOptions({ bgOpacity: 0.0 });
            self.jcropAPI.setSelect([($(window).width()/2)-100,($(window).height()/2)-100,($(window).width()/2)+100,($(window).height()/2)+100]);  
        //    self.jcropAPI.enable();
    }
     else { 
     	
     	//self.jcropAPI.release(); 
     	//self.jcropAPI.disable(); 
     	$("#cameraIcon").css('border','none');
     	$("#rbImageHolder").css("z-index", -10);
		$("#imagedownload").hide('slide', {direction: 'right'}, 1000);
     	$('#rbImageHolder').hide();
  	 //	$('#rbImage').hide();
          
     }	 
  });     
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




