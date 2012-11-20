var rb;
window.onload = function(){// Initialize "static" vars

	// Test for IE and show warning, if necessary
	if (/MSIE (\d+\.\d+);/.test(navigator.userAgent))
	{
		var ieWarningOverlay = new YAHOO.widget.Panel("iewarning", { zIndex:1020, visible:false, underlay:"matte" } );
		var msg = "<div>" + 
			"<h4>Internet Explorer is not currently supported</h4>"+
			"<br /><p>Worldview uses a set of browser technologies that are not currently supported by Internet Explorer.  " +
			"We are awaiting the release of IE version 10 and are hopeful that it will load Worldview properly.  " +
			"In the meantime, please try loading this page in Mozilla Firefox, Google Chrome, Apple Safari, or a tablet device.  " +
			"<br /><br />Thanks for your patience.</p>" +
			"<br /><p>-The Worldview development team";
			
		ieWarningOverlay.setBody(msg);
		ieWarningOverlay.render(document.body);
		ieWarningOverlay.show();
		ieWarningOverlay.center();
	}

	this.selector = new YAHOO.widget.Panel("selector", { zIndex:1019, visible:false } );
	this.selector.setBody("<div id='selectorbox'></div>");
	this.selector.render(document.body);

	// Create map 
	var m = new SOTE.widget.MapSote("map",{baseLayer:"MODIS_Terra_CorrectedReflectance_TrueColor"});
	var ss = new SOTE.widget.Switch("switch",{dataSourceUrl:"a",selected:"geographic"});
	var a = new SOTE.widget.Bank("products",{dataSourceUrl:"ap_products.php",title:"My Layers",selected:{antarctic:"baselayers.MODIS_Terra_CorrectedReflectance_TrueColor~overlays.polarview:coastS10", arctic:"baselayers.MODIS_Terra_CorrectedReflectance_TrueColor~overlays.polarview:coastArctic10",geographic:"baselayers.MODIS_Terra_CorrectedReflectance_TrueColor~overlays.sedac_bound"},categories:["Base Layers","Overlays"],callback:this.showSelector,selector:this.selector});
	var s = new SOTE.widget.Selector("selectorbox",{dataSourceUrl:"ap_products.php",categories:["Base Layers","Overlays"]});
	//var h = new SOTE.widget.MenuPicker("hazard",{dataSourceUrl:"data/mp_hazard.php"});
	//var tr = new SOTE.widget.MenuPicker("transition",{dataSourceUrl:"data/mp_transition.php"});
	var map = new SOTE.widget.DateSpan("time",{hasThumbnail:false});
	//Image download variables
	rb = new SOTE.widget.RubberBand("rubberband");
    var id = new SOTE.widget.ImageDownload("imagedownload",{baseLayer:"MODIS_Terra_CorrectedReflectance_TrueColor"});


};

function showSelector(e){
	var selector = e.data.selector;
	selector.show();
	selector.center();
}

function showOverlay(){
	if(this.overlay === undefined){ 
		this.overlay = new YAHOO.widget.Panel("panel1", { zIndex:1020, visible:false } );
		var item = 	"<div >"+
			"<h3>Welcome to Worldview</h3>"+
			"<p>This new tool from NASA's <a href='http://earthdata.nasa.gov/about-eosdis' target='_blank'>EOSDIS</a> provides the capability to interactively browse full-resolution, global, near real-time satellite imagery from 50+ data products from <a href='http://lance.nasa.gov/' target='_blank'>LANCE</a>.  In essence, this shows the entire Earth as it looks \"right now\" - or at least as it has looked within the past few hours.  This supports time-critical application areas such as wildfire management, air quality measurements, and weather forecasting. The data is generally available within three hours of observation and can be compared to observations since May 2012 - just click or drag the blue time sliders at the bottom of the screen to change the currently-displayed date.  Arctic and Antarctic projections of several products are also available for a \"full globe\" perspective.  Browsing on tablet devices is currently supported (iPad 2+ recommended) for mobile access to this spacecraft imagery while in the field or on the couch. Please note, however, that this is an alpha (preview) release and many features are still under development.</p>"+ 
			"<br /><p>Worldview uses the newly-developed <a href='http://earthdata.nasa.gov/gibs' target='_blank'>Global Image Browse Services (GIBS)</a> to rapidly retrieve its full-resolution imagery to provide an interactive browsing experience.  While Worldview uses <a href='http://openlayers.org/' target='_blank'>OpenLayers</a> as its mapping library, GIBS also supports Google Earth, NASA World Wind, and several other clients.  We encourage interested developers to build their own clients or integrate NASA imagery into their existing ones using these services.</p>"+
			"<h3>Acknowledgements</h3>"+
			"<p>Near-real time data is courtesy of LANCE data providers: <a href='http://lance.nasa.gov/home/about/amsr-e-sips/' target='_blank'>AMSR-E SIPS</a>, <a href='http://lance.nasa.gov/home/about/ges-disc/' target='_blank'>GES DISC</a>, <a href='http://lance.nasa.gov/home/about/modaps/' target='_blank'>MODAPS</a>, and <a href='http://lance.nasa.gov/home/about/omi-sips/' target='_blank'>OMI SIPS</a>.  Socioeconomic data supplied by <a href='http://sedac.ciesin.org/' target='_blank'>SEDAC</a>.  Credit for development of the data ingest and serving system belongs to the Tiled WMS development team at NASA/JPL's Physical Oceanography Distributed Active Archive Center (<a href='http://podaac.jpl.nasa.gov/' target='_blank'>PO.DAAC</a>).  Special thanks to the NASA/GSFC <a href='http://svs.gsfc.nasa.gov/' target='_blank'>Scientific Visualization Studio</a>, Steve Romalewski and Dave Burgoon/<a href='http://www.urbanresearch.org/' target='_blank'>CUNY CUR</a>, Bruce Campbell/<a href='http://www.risd.edu/' target='_blank'>RISD</a>, and Ben Fry/<a href='http://www.fathom.info/' target='_blank'>Fathom Information Design</a> for their invaluable feedback, much of which is still to be implemented.  Additional thanks to Katie Lewis, NASA/GSFC, for graphic design and nomenclature support.</p>"+
			"<h3>Disclaimer</h3>"+
			"<p>The LANCE system is operated by the NASA/GSFC Earth Science Data Information System (ESDIS). The information presented through the LANCE Rapid Response system and the LANCE FIRMS are provided “as is” and users bear all responsibility and liability for their use of data, and for any loss of business or profits, or for any indirect, incidental or consequential damages arising out of any use of, or inability to use, the data, even if NASA or ESDIS were previously advised of the possibility of such damages, or for any other claim by you or any other person. Please read the full disclaimer <a href='http://earthdata.nasa.gov/data/nrt-data/disclaimer' target='_blank'>here</a>.</p>"+
			"<h3>Support</h3>"+
			"<p>Comments/suggestions/problem reports are welcome via <a href='mailto:support@earthdata.nasa.gov?subject=Feedback%20for%20EOSDIS%20Worldview%20tool'>support@earthdata.nasa.gov</a>.  Please note that Internet Explorer is not currently supported and we are working to determine if and when it can be.</p>"+			
			"<br /><p>"+
				"Version: 0.2.0 (<a href='release_notes.txt' target='_blank'>release notes</a>)<br />"+
				"Front-End Lead/Architect: <a href='mailto:tilak.joshi@nasa.gov'>Tilak Joshi</a><br />"+ 
				"Responsible NASA Official:  <a href='mailto:ryan.a.boller@nasa.gov'>Ryan Boller</a><br />"+
			"</p>"+ 	
		"</div>";
		
		this.overlay.setBody(item);
		this.overlay.render(document.body);
	}
	
	this.overlay.show();
	this.overlay.center();

}

function showPermalink(){
	if(this.permOverlay === undefined){
		this.permOverlay = new YAHOO.widget.Panel("panel_perm", {width:"300px", zIndex:1020, visible:false } );
		var item = 	"<div id='permpanel' >"+
			"<!-- <h3>Permalink:</h3> -->"+
			"<span style='font-weight:400; font-size:12px; line-spacing:24px; '>Copy and paste the following link to share this view:</span>" + 
			"<input type='text' value='' name='permalink_content' id='permalink_content' />" +
		"</div>";
		this.permOverlay.setHeader('&nbsp;&nbsp;&nbsp;&nbsp;Permalink');
		this.permOverlay.setBody(item);
		this.permOverlay.render(document.body);
	}
	var qs = "?";
	var comps = REGISTRY.getComponents();
  	for (var i=0; i < comps.length; i++) {
  		if(typeof comps[i].obj.getValue == 'function'){
    		qs+= comps[i].obj.getValue() + "&";
   		}
  	}
  	
  	var map = SOTE.util.extractFromQuery("map",qs);
  	var products = SOTE.util.extractFromQuery("products",qs);
  	var time = SOTE.util.extractFromQuery("time",qs);
  	var s = SOTE.util.extractFromQuery("switch",qs);

  	
  	qs = "?map="+map+"&products="+products+"&time="+time+"&switch="+s;
  	
  	var url = window.location.href;
  	var prefix = url.split("?")[0];
  	//alert(prefix);
  	prefix = (prefix !== null && prefix !== undefined)? prefix: url;
  	
  	$('#permalink_content').val(prefix+qs);

	this.permOverlay.show();
	this.permOverlay.center();
	
	document.getElementById('permalink_content').focus();
  	document.getElementById('permalink_content').select();

}


function showRubberBand(){
	rb.draw("map");
	
}
