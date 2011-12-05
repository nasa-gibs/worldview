window.onload = function(){// Initialize "static" vars
	// Create map
	var m = new SOTE.widget.MapSote("map",{baseLayer:"Aqua_MODIS",time:"2011-11-26"});
	var a = new SOTE.widget.AccordionPicker("products",{dataSourceUrl:"data/ap.json"});
	var h = new SOTE.widget.MenuPicker("hazard",{dataSourceUrl:"data/mp_hazard.json"});
	//var tr = new SOTE.widget.MenuPicker("transition",{dataSourceUrl:"data/mp_transition.json",selected:"sta"});
	var map = new SOTE.widget.DateSpan("time");

}

function showOverlay(){
	var overlay = new YAHOO.widget.Panel("panel1", { fixedcenter:true,
														 visible:false,
														 width:"300px"} );
	overlay.setBody("<p>Hello World</p>");
	overlay.render(document.body);
	overlay.show();
}
