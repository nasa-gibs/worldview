var rb;

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
				"Version: " + Worldview.VERSION + " - " + Worldview.BUILD_TIMESTAMP + " (<a href='release_notes.txt' target='_blank'>release notes</a>)<br />"+
				"Front-End Lead/Architect: <a href='mailto:tilak.joshi@nasa.gov'>Tilak Joshi</a><br />"+ 
				"Responsible NASA Official:  <a href='mailto:ryan.a.boller@nasa.gov'>Ryan Boller</a><br />"+
			"</p>"+ 	
		"</div>";
		
		this.overlay.setBody(item);
		this.overlay.render(document.body);
	}
	
	this.overlay.show();
	this.overlay.center();
	var overlay_id = this.overlay.id;
	this.overlay.beforeHideEvent.subscribe(function(e){$("#"+overlay_id).css("display","none");});
	this.overlay.beforeShowEvent.subscribe(function(e){$("#"+overlay_id).css("display","block");})
}


function showRubberBand(){
	rb.draw("map");
	
}
