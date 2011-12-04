window.onload = function(){// Initialize "static" vars
	// Create map
	var m = new SOTE.widget.MapSote("map",{baseLayer:"Terra_MODIS",time:"2011-11-30"});
	var a = new SOTE.widget.AccordionPicker("products",{dataSourceUrl:"data/ap.json"});
	var h = new SOTE.widget.MenuPicker("hazard",{dataSourceUrl:"data/mp_hazard.json"});
	var tr = new SOTE.widget.MenuPicker("transition",{dataSourceUrl:"data/mp_transition.json",selected:"sta"});
	var map = new SOTE.widget.DateSpan("time");

}