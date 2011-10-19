SOTE.widget.AccordianPicker.prototype = new SOTE.widget.Component;

/**
  * Instantiate the accordianPicker  
  *
  * @class A selection device classifying radio buttons/checkboxes into categories that are displayed in accordian form.
  *     Radio buttons allow single selection accross categories.  Checkboxes allow multiple selections accross categories.
  * 	Radio selections cannot span multiple categories.
  * @constructor
  * @this {accordianPicker}
  * @param {String} containerId is the container id of the div in which to render the object 
  * @param {Object} [config] is a hash allowing configuration of this component
  * @config {Object[]} [items] a JS Array of JS Objects: items.category[i..n].key, items.category[i..n].value 
  *     , items.category[i..n].action representing the available options
  * @config {String} [selected] the key of the initially selected option(s)
  * @augments SOTE.widget.Component
  * 
*/
SOTE.widget.AccordianPicker = function(containerId, config){
  // Content
};

/**
  * Displays all options in HTML in an accordian format (see JQuery UI Accordian) with the selected states being indicated
  * by radio button and checkbox selection.  All callbacks should be set.  The component UI should be rendered 
  * with controllers to call the events.
  *
  *  
  * @this {accordianPicker}
  * 
*/
SOTE.widget.AccordianPicker.prototype.init = function(){
  // Content
};

/**
  * Sets the selected option(s) in the accordianPicker from the passed in value(s), if valid 
  *     [containerId]=[options] (options is a dot delimited string with the first item containing
  *     a single select item, and the remaining items containing the multi-select items).
  *
  * @this {accordianPicker}
  * @param {String} value is a dot delimited string of the key(s) of the option(s) to be set as selected
  * @returns {boolean} true or false depending on if the new value(s) validates
  *
*/
SOTE.widget.AccordianPicker.prototype.setValue = function(values){
  // Content
};

/**
  * Gets the currently selected option(s) [containerId]=[options]
  *
  * @this {accordianPicker}
  * @returns {String} [container]=[options], options being a dot delimited string 
  *     representing the key(s) of the currently selected option(s)
  *
*/
SOTE.widget.AccordianPicker.prototype.getValue = function(){
  // Content
};

/**
  * Change the component based on dependencies (i.e. Available Options, Selected)
  * 
  * @this {accordianPicker}
  * @param {String} querystring contains all values of dependencies (from registry)
  * @returns {boolean} true or false depending on if the selected value still validats with criteria change
  * 
*/
SOTE.widget.AccordianPicker.prototype.updateComponent = function(querystring){
  // Content
};

/**
  * Sets the selected option(s) from the query string [containerId]=[options]
  * 
  * @this {accordianPicker}
  * @param {String} qs contains the querystring
  * @returns {boolean} true or false depending on whether the new option validates
  *
*/
SOTE.widget.AccordianPicker.prototype.loadFromQuery = function(qs){
  // Content
};

/**
  * Validates that the selected option(s) is not null, only one radio button is selected cross category
  * and all options are within the scope of available options
  * 
  * @this {accordianPicker}
  * @returns {boolean} true or false depending on whether the selected option(s) meet the validation criteria
*/
SOTE.widget.AccordianPicker.prototype.validate = function(){
  // Content
};

/**
  * Sets the data accessor that provides state change instructions given dependencies
  *
  * @this {accordianPicker}
  * @param {String} datasourceurl is the relative location of the data accessor 
  *
*/
SOTE.widget.AccordianPicker.prototype.setDataSourceUrl = function(datasourceurl){
  // Content
};

/**
  * Gets the data accessor
  * 
  * @this {accordianPicker}
  * @returns {String} the relative location of the accessor
  *
*/
SOTE.widget.AccordianPicker.prototype.getDataSourceUrl = function(){
  // Content
};

/**
  * Sets the status of the component
  *
  * @this {accordianPicker}
  * @param {String} s the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.AccordianPicker.prototype.setStatus = function(s){
  // Content
};

/**
  * Gets the status of the component
  *
  * @this {accordianPicker}
  * @returns {String} the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.AccordianPicker.prototype.getStatus = function(){
  // Content
};


// Additional Functions
// removeOptions, addOptions
