SOTE.namespace("SOTE.util");

/**
  * Given a key and a querystring, it extracts the value of the given key from the querystring
  * Usage: SOTE.util.extractFromQuery(<key>,<qs>);
  * 
  * @param {String,String} key is the item to be extracted, qs is the query string to extract from
  * @returns value associated with the given key in the querystring
  * 
*/
SOTE.util.extractFromQuery = function(key,qs){
	//if (default_==null) default_="";
	//key = key.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regex = new RegExp("[\\?&#]"+key+"=([^&#]*)");
	var val = regex.exec(qs);
	if(val == null)
    	return "";
	else
		return val[1];
};