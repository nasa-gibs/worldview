SOTE.widget.Superview.prototype = new SOTE.widget.Component;

/**
  * Instantiate the superview  
  *
  * @class A series of dateSpans each with the same min/max bounds, range, and start date.  Allows
  *    visual selection of date and data product
  * @constructor
  * @this {superview}
  * @param {String} containerId is the container id of the div in which to render the object 
  * @param {Object} [config] is a hash allowing configuration of this component
  * @config {String} [minDate] an ISO8601 formatted date string containing the minimum bound for the dateSpan
  * @config {String} [maxDate] an ISO8601 formatted date string containing the maximum bound for the dateSpan
  * @config {String} [thumbSource] the address of a script producing thumbnails
  * @config {String} [extent] the extent of the current map (bbox=w,s,e,n)
  * @config {String} [startDate] an ISO8601 formatted date string containing the start date of the dateSpan
  * @config {String} [selectedDate] an ISO8601 formatted date string containing the initially selected date
  * @config {Number} [range] the total number of days displayed to the user
  * @config {boolean} [slideToSelect] whether the selection slider is visible or not
  * @config {boolean} [isExpanded] whether the dateSpan thumbnails should be visible or not
  * @config {Object[]} [content] content[i..n].product, content[i..n].anchorId pairs for each product to be included
  * @augments SOTE.widget.Component
  * 
*/
SOTE.widget.Superview = function(containerId, config){
  // Content
};

/**
  * Displays a series of datespans with scrolling if dateSpans cross the maximum vertical viewport.
  * All callbacks should be set.  The component UI should be rendered with controllers to call the events.
  * 
  * @this {superview}
  * @requires SOTE.widget.DateSpan
*/
SOTE.widget.Superview.prototype.init = function(){
  // Content
};

/**
  * Sets the selected date to passed in date, and deselects any other datespan dates
  *
  * @this {superview}
  * @param {String} a date product pair specifying the date to be selected (i.e. [containerId]=[date].[product])
  * @returns {boolean} true or false depending on whether the passed in date validates
  * 
*/
SOTE.widget.Superview.prototype.setValue = function(value){
  // Content
};

/**
  * Gets the currently selected date in ISO8601 format, and the product represented by the dateSpan
  *
  * @this {superview}
  * @returns {String} [containerId]=[selectedDate].[selectedProduct]
  *
*/
SOTE.widget.Superview.prototype.getValue = function(){
  // Content
};

/**
  * Modifies contained dateSpans based on dependencies specified in querystring argument
  * 
  * @this {superview}
  * @param {String} querystring contains all values of dependencies (from registry)
  * @returns {boolean} true or false depending on whether the current selected date validate under the new criteria
  * 
*/
SOTE.widget.Superview.prototype.updateComponent = function(querystring){
  // Content
};

/**
  * Sets the selected date from the querystring, requires both date and product
  * 
  * @this {superview}
  * @param {String} qs contains [containerId]=[date].[product]
  * @returns {boolean} true or false depending on if the date specified in the qs validates
  *
*/
SOTE.widget.Superview.prototype.loadFromQuery = function(qs){
  // Content
};

/**
  * Validates that the selected date is between the mindate and maxdate, and the product is one of the available products
  * 
  * @this {superview}
  * @returns {boolean} true or false based on whether or not validation conditions are passed
*/
SOTE.widget.Superview.prototype.validate = function(){
  // Content
};

/**
  * Sets the data accessor that provides state change instructions given dependencies
  *
  * @this {superview}
  * @param {String} datasourceurl is the relative location of the data accessor 
  *
*/
SOTE.widget.Superview.prototype.setDataSourceUrl = function(datasourceurl){
  // Content
};

/**
  * Gets the data accessor
  * 
  * @this {superview}
  * @returns {String} the relative location of the accessor
  *
*/
SOTE.widget.Superview.prototype.getDataSourceUrl = function(){
  // Content
};

/**
  * Sets the status of the component
  *
  * @this {superview}
  * @param {String} s the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.Superview.prototype.setStatus = function(s){
  // Content
};

/**
  * Gets the status of the component
  *
  * @this {superview}
  * @returns {String} the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.Superview.prototype.getStatus = function(){
  // Content
};

/**
  * Shows the specified dateSpan in the superview
  *
  * @this {superview}
  * @param {String} p is the product name representing the datespan 
  *
*/
SOTE.widget.Superview.prototype.show = function(p){
  // Content
};

/**
  * Hides the specified dateSpan from the superview.  Entire superview is hidden if all
  * contained datespans are hidden
  *
  * @this {superview}
  * @param {String} p is the product name representing the datespan
  *
*/
SOTE.widget.Superview.prototype.hide = function(p){
  // Content
};

// Additional Optional Functions:
// getAvailableProducts, getAvailableDates, showAll, hideAll, setBounds, setStart, setExtent






