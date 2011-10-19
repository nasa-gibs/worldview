SOTE.widget.MenuPicker.prototype = new SOTE.widget.Component;

/**
  * Instantiate the menuPicker  
  *
  * @class A selection device with similar functionality to a drop-down selection list, but built with HTML
  *     elements for maximum styling and flexibility.
  * @constructor
  * @this {menuPicker}
  * @param {String} containerId is the container id of the div in which to render the object 
  * @param {Object} [config] is a hash allowing configuration of this component
  * @config {Object[]} [items] a JS Array of JS Objects: items[i..n].key, items[i..n].value pairs representing the available options
  * @config {String} [selected] the key of the initially selected option
  * @augments SOTE.widget.Component
  * 
*/
SOTE.widget.MenuPicker = function(containerId, config){
  // Content
};

/**
  * Displays all options in HTML with the selected option indicated with styles.
  * All callbacks should be set.  The component UI should be rendered with controllers to call the events.
  * 
  * @this {menuPicker}
  * 
*/
SOTE.widget.MenuPicker.prototype.init = function(){
  // Content
};

/**
  * Sets the selected option in the menuPicker to the passed in value, if valid ([containerId]=[key])
  *
  * @this {menuPicker}
  * @param {String} value is the key of the option to be set as selected ([containerId]=[key])
  * @returns {boolean} true or false depending on if the value validates
  *
*/
SOTE.widget.MenuPicker.prototype.setValue = function(value){
  // Content
};

/**
  * Gets the currently selected option ([containerId]=[key])
  *
  * @this {menuPicker}
  * @returns {String} a string representing the key of the currently selected option ([containerId]=[key])
  *
*/
SOTE.widget.MenuPicker.prototype.getValue = function(){
  // Content
};

/**
  * Change the component based on dependencies (i.e. Available Options, Selected)
  * 
  * @this {menuPicker}
  * @param {String} querystring contains all values of dependencies (from registry)
  * @returns {boolean} true or false depending on if the selected value still validates with modified criteria
  * 
*/
SOTE.widget.MenuPicker.prototype.updateComponent = function(querystring){
  // Content
};

/**
  * Sets the selection option from the query string ([containerId]=[key])
  * 
  * @this {menuPicker}
  * @param {String} qs contains the querystring ([containerId]=[key])
  *
*/
SOTE.widget.MenuPicker.prototype.loadFromQuery = function(qs){
  // Content
};

/**
  * Validates that the selected option is not null and  is one of the available options
  * 
  * @this {menuPicker}
  * @returns {boolean} true or false depending on whether the selected option is not null and
  *    is one of the available options
*/
SOTE.widget.MenuPicker.prototype.validate = function(){
  // Content
};

/**
  * Sets the data accessor that provides state change instructions given dependencies
  *
  * @this {menuPicker}
  * @param {String} datasourceurl is the relative location of the data accessor 
  *
*/
SOTE.widget.MenuPicker.prototype.setDataSourceUrl = function(datasourceurl){
  // Content
};

/**
  * Gets the data accessor
  * 
  * @this {menuPicker}
  * @returns {String} the relative location of the accessor
  *
*/
SOTE.widget.MenuPicker.prototype.getDataSourceUrl = function(){
  // Content
};

/**
  * Sets the status of the component
  *
  * @this {menuPicker}
  * @param {String} s the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.MenuPicker.prototype.setStatus = function(s){
  // Content
};

/**
  * Gets the status of the component
  *
  * @this {menuPicker}
  * @returns {String} the current status of the component (user prompts, error messages)
  *
*/
SOTE.widget.MenuPicker.prototype.getStatus = function(){
  // Content
};

/**
  * Add an item to the options list
  *
  * @this {menuPicker}
  * @param {Object} item is a key/value pair 
  * @returns {boolean} true or false depending on if the item was successfully added
  *
*/
SOTE.widget.MenuPicker.prototype.addItem = function(item){
  // Content
};

/**
  * Remove an item from the options list
  *
  * @this {menuPicker}
  * @param {String} the key of the item to be removed 
  * @returns {boolean} true or false depending on if the operation was successful
  *
*/
SOTE.widget.MenuPicker.prototype.removeItem = function(item){
  // Content
};

/**
  * Returns the total number of items currently in the options list
  *
  * @this {menuPicker}
  * @returns {Number} the number of items currently in the options list
  *
*/
SOTE.widget.MenuPicker.prototype.length = function(){
  // Content
};


// Additional Functions
// clear, addMultipleItems 








