SOTE.widget.Map.prototype = new SOTE.widget.Component;

/**
  * Instantiate the map  
  *
  * @class Instantiates a map projection layered with images retrieved from the specified client
  *     derived from the given bounding box, date, and data product
  * @constructor
  * @this {map}
  * @param {String} containerId is the container id of the div in which to render the object 
  * @param {Object} [config] is a hash allowing configuration of this component
  * @config {boolean} [hasControls] whether or not the produced map should have zoom and pan controls
  * @config {boolean} [isSelectable] whether or not a bounding box selection is allowed
  * @config {String} [bbox] the extent of the map as w,s,e,n
  * @augments SOTE.widget.Component
  * 
*/
SOTE.widget.Map = function(containerId, config){
  // Content
};

/**
  * Displays the map with a base layer and pan and zoom controls (if hasControls is true)
  * All callbacks should be set.  The component UI should be rendered 
  * with controllers to call the events.
  *
  *  
  * @this {map}
  * 
*/
SOTE.widget.Map.prototype.init = function(){
  // Content
};

/**
  * Sets the visible extent in the map from the passed in value, if valid.  formatted as [containerId]=w,s,e,n
  *
  * @this {map}
  * @param {String} value is [containerId]=w,s,e,n
  * @returns {boolean} true or false depending on if the new extent validates
  *
*/
SOTE.widget.Map.prototype.setValue = function(value){
  // Content
};

/**
  * Gets the currently visible extent [containerId]=w,s,e,n
  *
  * @this {map}
  * @returns {String} [containerId]=w,s,e,n represents the current visible extent of the map
  *
*/
SOTE.widget.Map.prototype.getValue = function(){
  // Content
};

/**
  * Change the base layers based on dependencies (i.e. extent, date, data product)
  * 
  * @this {map}
  * @param {String} querystring contains all values of dependencies (from registry)
  * @returns {boolean} true or false depending on if the component still validates with the new criteria
  * 
*/
SOTE.widget.Map.prototype.updateComponent = function(querystring){
  // Content
};

/**
  * Sets the selected option(s) from the query string [containerId]=w,s,e,n
  * 
  * @this {map}
  * @param {String} qs contains the querystring ([containerId]=w,s,e,n)
  * @returns {boolean} true or false depending on whether the new extent validates
  *
*/
SOTE.widget.Map.prototype.loadFromQuery = function(qs){
  // Content
};

/**
  * Validates that the w,s,e,n coordinates are not null, both lat coordinates (n,s) are between -90,90, and both
  * lon coordinates (w,e) are between -180,180
  * 
  * @this {map}
  * @returns {boolean} true or false depending on whether the selected option(s) meet the validation criteria
*/
SOTE.widget.Map.prototype.validate = function(){
  // Content
};

/**
  * Sets the data accessor that provides state change instructions given dependencies
  *
  * @this {map}
  * @param {String} datasourceurl is the relative location of the data accessor 
  *
*/
SOTE.widget.Map.prototype.setDataSourceUrl = function(datasourceurl){
  // Content
};

/**
  * Gets the data accessor
  * 
  * @this {map}
  * @returns {String} the relative location of the accessor
  *
*/
SOTE.widget.Map.prototype.getDataSourceUrl = function(){
  // Content
};

/**
  * Sets the status of the component
  *
  * @this {map}
  * @param {String} s the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.Map.prototype.setStatus = function(s){
  // Content
};

/**
  * Gets the status of the component
  *
  * @this {map}
  * @returns {String} the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.Map.prototype.getStatus = function(){
  // Content
};

/**
  * Sets the visible extent of the map
  *
  * @this {map}
  * @param {String} extent is formatted as [containerId]=w,s,e,n
  * @returns {boolean} true or false depending on if the component validates with the new extent
  *
*/
SOTE.widget.Map.prototype.setExtent = function(extent){
  // Content
};

