window.onload = function(){// Initialize "static" vars
	// Create map
	var m = new SOTE.widget.MapSote("map",{baseLayer:"Terra_MODIS"});
	var a = new SOTE.widget.AccordionPicker("products",{dataSourceUrl:"data/ap.json"});
	var h = new SOTE.widget.MenuPicker("hazard",{isCollapsible: true, dataSourceUrl:"data/mp_hazard.php"});
	//var tr = new SOTE.widget.MenuPicker("transition",{dataSourceUrl:"data/mp_transition.php"});
	var map = new SOTE.widget.DateSpan("time");

}

function showOverlay(){
	if(this.overlay === undefined){
		this.overlay = new YAHOO.widget.Panel("panel1", { zIndex:1020, visible:false } );
		var item = 	"<div >"+
			"<h3>Welcome to Worldview</h3>"+
			"<p>This new tool from NASA's <a href='http://earthdata.nasa.gov/about-eosdis'>EOSDIS</a> provides the capability to interactively browse full-resolution, global, near real-time spacecraft imagery from 3 (eventually 30+) data products from <a href='http://lance.nasa.gov/'>LANCE</a>.  In essence, this shows the entire Earth as it looks \"right now\" - or at least as it has looked within the past few hours.  This will support time-critical application areas such as wildfire management, air quality measurements, and weather forecasting - \"dust storms\" is the only category currently supported. The data is generally available within three hours of observation and can be compared to observations from the past week - just drag the time slider at the bottom of the screen to change the currently-displayed date.  Browsing on tablet devices is currently supported for mobile access to this spacecraft imagery while in the field or on the couch. Please note, however, that this is an alpha (preview) release and many features are still under development.  Please also note that Internet Explorer is not currently supported and we are working to determine if and when it can be.  Comments/suggestions/problem reports are welcome via <a href='mailto:eosdis-usersupport@lists.nasa.gov?subject=Feedback%20for%20EOSDIS%20Worldview%20tool'>eosdis-usersupport@lists.nasa.gov</a>.</p>"+ 
			"<br /><p>For more functionality and support for many more data products, please use the <a href='http://lance.nasa.gov/imagery/rapid-response/'>LANCE WMS client</a> or, for a more hazards-and-disasters-specific experience, <a href='http://lancedev.eosdis.nasa.gov/tools/hazards-and-disasters/'>this introduction</a> to the LANCE WMS client.  As we move forward, these data products and additional functionality will be migrated to Worldview and its Tiled WMS backend.</p>"+
			"<br /><p>Special thanks to the NASA/GSFC <a href='http://svs.gsfc.nasa.gov/'>Scientific Visualization Studio</a>, Steve Romalewski and Dave Burgoon/<a href='http://www.urbanresearch.org/'>CUNY CUR</a>, Bruce Campbell/<a href='http://www.risd.edu/'>RISD</a>, and Ben Fry/<a href='http://www.fathom.info/'>Fathom Information Design</a> for their invaluable feedback, much of which is still to be implemented.  Additional thanks to Katie Lewis, NASA/GSFC, for nomenclature support.</p>"+			
			"<h3>Disclaimer</h3>"+
			"<p>The LANCE system is operated by the NASA/GSFC Earth Science Data Information System (ESDIS). The information presented through the LANCE Rapid Response system and the LANCE FIRMS are provided “as is” and users bear all responsibility and liability for their use of data, and for any loss of business or profits, or for any indirect, incidental or consequential damages arising out of any use of, or inability to use, the data, even if NASA or ESDIS were previously advised of the possibility of such damages, or for any other claim by you or any other person. ESDIS makes no representations or warranties of any kind, express or implied, including implied warranties of fitness for a particular purpose or merchantability, or with respect to the accuracy of or the absence or the presence or defects or errors in data, databases of other information. The designations employed in the data do not imply the expression of any opinion whatsoever on the part of ESDIS concerning the legal or development status of any country, territory, city or area or of its authorities, or concerning the delimitation of its frontiers or boundaries. For more information please contact the LANCE User Services at <a href='mailto:lance-support@lists.nasa.gov'>lance-support@lists.nasa.gov</a>.</p>"+
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

