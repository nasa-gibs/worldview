SOTE.namespace("SOTE.widget.MapSote");

//MapSote.prototype = new SOTE.widget.Map;


/**
  * Instantiate the map;  subclass of SOTE.widget.Map that is SOTE-specific
  *   
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
//SOTE.widget.MapSote.prototype.constructor = function(containerId, config){
SOTE.widget.MapSote = function(containerId, config)
//function MapSote(containerId, config)
{		
	// ie,  super(containerId, config);
	SOTE.widget.Map.call(this, containerId, config);

};

SOTE.widget.MapSote.prototype = new SOTE.widget.Map;

/**
  * Change the base layers based on dependencies (i.e. extent, date, data product)
  * 
  * Update component with QS.  
  * 
  * @this {map}
  * @param {String} querystring contains all values of dependencies (from registry)
  * @returns {boolean} true or false depending on if the component still validates with the new criteria
  * 
*/
//SOTE.widget.Map.prototype.updateComponent = function(qs){
function updateComponent(qs)
{
    if(this.dataSourceUrl === null){
	alert("There is no external data source url specified.  Cannot update component!");
        return false;
    }
    
	var qs = (querystring === undefined)? "":querystring;
	SOTE.util.getJSON(
		this.dataSourceUrl+querystring,
		{self:this},
		SOTE.widget.Map.handleUpdateSuccess,
		SOTE.widget.Map.handleUpdateFailure
	); 
};

