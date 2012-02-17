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
	

	// Create map
	var m = new SOTE.widget.MapSote("map",{baseLayer:"MODIS_Terra_CorrectedReflectance_TrueColor"});
	var a = new SOTE.widget.AccordionPicker("products",{dataSourceUrl:"data/ap.json"});
	//var h = new SOTE.widget.MenuPicker("hazard",{dataSourceUrl:"data/mp_hazard.php"});
	//var tr = new SOTE.widget.MenuPicker("transition",{dataSourceUrl:"data/mp_transition.php"});
	var map = new SOTE.widget.DateSpan("time",{hasThumbnail:false});

}

function showOverlay(){
	if(this.overlay === undefined){
		this.overlay = new YAHOO.widget.Panel("panel1", { zIndex:1020, visible:false } );
		var item = 	"<div >"+
			"<h3>Welcome to Worldview</h3>"+
			"<p>This new tool from NASA's <a href='http://earthdata.nasa.gov/about-eosdis'>EOSDIS</a> provides the capability to interactively browse full-resolution, global, near real-time satellite imagery from 50+ data products from <a href='http://lance.nasa.gov/'>LANCE</a>.  In essence, this shows the entire Earth as it looks \"right now\" - or at least as it has looked within the past few hours.  This will support time-critical application areas such as wildfire management, air quality measurements, and weather forecasting. The data is generally available within three hours of observation and can be compared to observations from the past week - just drag the orange time slider at the bottom of the screen to change the currently-displayed date.  Browsing on tablet devices is currently supported for mobile access to this spacecraft imagery while in the field or on the couch. Please note, however, that this is an alpha (preview) release and many features are still under development.</p>"+ 
			"<br /><p>For more functionality, please use the <a href='http://lance.nasa.gov/imagery/rapid-response/'>LANCE WMS client</a> or, for a more hazards-and-disasters-specific experience, <a href='http://lancedev.eosdis.nasa.gov/tools/hazards-and-disasters/'>this introduction</a> to the LANCE WMS client.</p>"+
			"<h3>Acknowledgements</h3>"+
			"<p>Near-real time data is courtesy of LANCE data providers: <a href='http://lance.nasa.gov/home/about/amsr-e-sips/'>AMSR-E SIPS</a>, <a href='http://lance.nasa.gov/home/about/ges-disc/'>GES DISC</a>, <a href='http://lance.nasa.gov/home/about/modaps/'>MODAPS</a>, and <a href='http://lance.nasa.gov/home/about/omi-sips/'>OMI SIPS</a>.  Credit for development of the data ingest and serving system belongs to the Tiled WMS development team at NASA/JPL's Physical Oceanography Distributed Active Archive Center (<a href='http://podaac.jpl.nasa.gov/'>PO.DAAC</a>).  Special thanks to the NASA/GSFC <a href='http://svs.gsfc.nasa.gov/'>Scientific Visualization Studio</a>, Steve Romalewski and Dave Burgoon/<a href='http://www.urbanresearch.org/'>CUNY CUR</a>, Bruce Campbell/<a href='http://www.risd.edu/'>RISD</a>, and Ben Fry/<a href='http://www.fathom.info/'>Fathom Information Design</a> for their invaluable feedback, much of which is still to be implemented.  Additional thanks to Katie Lewis, NASA/GSFC, for graphic design and nomenclature support.</p>"+
			"<h3>Disclaimer</h3>"+
			"<p>The LANCE system is operated by the NASA/GSFC Earth Science Data Information System (ESDIS). The information presented through the LANCE Rapid Response system and the LANCE FIRMS are provided “as is” and users bear all responsibility and liability for their use of data, and for any loss of business or profits, or for any indirect, incidental or consequential damages arising out of any use of, or inability to use, the data, even if NASA or ESDIS were previously advised of the possibility of such damages, or for any other claim by you or any other person. Please read the full disclaimer <a href='http://earthdata.nasa.gov/data/nrt-data/disclaimer'>here</a>.</p>"+
			"<h3>Support</h3>"+
			"<p>Comments/suggestions/problem reports are welcome via <a href='mailto:eosdis-usersupport@lists.nasa.gov?subject=Feedback%20for%20EOSDIS%20Worldview%20tool'>eosdis-usersupport@lists.nasa.gov</a>.  Please note that Internet Explorer is not currently supported and we are working to determine if and when it can be.</p>"+			
			"<br /><p>"+
				"Page Editor: <a href='mailto:tilak.joshi@nasa.gov'>Tilak Joshi</a><br />"+ 
				"Responsible NASA Official:  <a href='mailto:ryan.a.boller@nasa.gov'>Ryan Boller</a>"+
			"</p>"+ 	
		"</div>";
		
		this.overlay.setBody(item);
		this.overlay.render(document.body);
	}
	
	this.overlay.show();
	this.overlay.center();

}

