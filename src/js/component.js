if (typeof SOTE=="undefined") {

  /**
    *
    * #namespace Takes out all SOTE components, widgets, and utilities out of the global namespace.
    * #description Takes out all SOTE components, widgets, and utilities out of the global namespace.
    *
  */
  var SOTE = new Object();
}

// Creates namespace(s) under SOTE
SOTE.namespace = function()
{
  var obj;
  for (var i=0; i<arguments.length; i++)
  {
    var list=(""+arguments[i]).split(".");
    obj = SOTE;
    for(var j=(list[0]=="SOTE")?1:0; j<list.length; j++)
    {
      obj[list[j]] = obj[list[j]] || {};
      obj = obj[list[j]];
    }
  }
  return obj;
};

SOTE.namespace("widget");

/**
  * An abstract class to define common methods across all SOTE components
  * @constructor 
  *
  * @module SOTE.widget
  * @class Component
  * @this {component}
  * @param {String} containerId is the container id of the div in which to render the object 
  * @param {Object} [config] is a hash allowing configuration of this component
  * 
*/
SOTE.widget.Component = function(containerId, config){
  // Content
};

/**
  * Initializes component user interface (View).  All callbacks should be set
  * The entire UI should be displayed with controllers to call the events
  * 
  * @this {component}
  * 
*/
SOTE.widget.Component.prototype.init = function(){
  // Content
};

/**
  * Sets the value (Model) of the component
  *
  * @this {component}
  * @param {String} value to set the component
  *
*/
SOTE.widget.Component.prototype.setValue = function(value){
  // Content
};

/**
  * Gets the value (Model) of the component
  *
  * @this {component}
  * @returns {String} the value of the component
  *
*/
SOTE.widget.Component.prototype.getValue = function(){
  // Content
};

/**
  * Change the component based on dependencies
  * 
  * @this {component}
  * @param {String} querystring contains all values of dependencies (from registry)
  * 
*/
SOTE.widget.Component.prototype.updateComponent = function(querystring){
  // Content
};

/**
  * Sets the value from the querystring
  * 
  * @this {component}
  * @param {String} qs contains the querystring
  *
*/
SOTE.widget.Component.prototype.loadFromQuery = function(qs){
  // Content
};

/**
  * Validates the value of the component given the component constraints
  * 
  * @this {component}
  * @returns {boolean} true or false depending on whether the value of the component is valid
*/
SOTE.widget.Component.prototype.validate = function(){
  // Content
};

/**
  * Sets the data accessor that provides state change instructions given dependencies
  *
  * @this {component}
  * @param {String} datasourceurl is the relative location of the data accessor 
  *
*/
SOTE.widget.Component.prototype.setDataSourceUrl = function(datasourceurl){
  // Content
};

/**
  * Gets the data accessor
  * 
  * @this {component}
  * @returns {String} the relative location of the accessor
  *
*/
SOTE.widget.Component.prototype.getDataSourceUrl = function(){
  // Content
};

/**
  * Sets the status of the component
  *
  * @this {component}
  * @param {String} s the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.Component.prototype.setStatus = function(s){
  // Content
};

/**
  * Gets the status of the component
  *
  * @this {component}
  * @returns {String} the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.Component.prototype.getStatus = function(){
  // Content
};














