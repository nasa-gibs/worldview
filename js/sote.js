var rb;

function showSelector(e){
	
	//console.log("show selector");
	var selector = e.data.selector;
	selector.show();
	var myid = "selector_c";
	
	// force center
	selector.center();
	var viewWidth = $(window).width();
	var selWidth = parseInt(YAHOO.util.Dom.getStyle(myid, 'width'), 10);
	var newX = (viewWidth - selWidth)/2;
	YAHOO.util.Dom.setX(myid, newX);
	//console.log("selWidth = " + selWidth);
	//console.log("newX = " + newX);
	
	// get screen width
	var devWidth = window.screen.availWidth;

	if(devWidth >= 1260 && viewWidth >= 1260) {
	
		// move if tour window is showing
		var classList = document.getElementsByClassName('joyride-tip-guide bordered');
		if(classList.length > 2) {
			if((classList[0].style.display === "block") || (classList[1].style.display === "block")){
	   			var tourWidth = $(".joyride-tip-guide").width();
				var pos = YAHOO.util.Dom.getX(myid);
				var newX = parseInt(pos, 10) + tourWidth - 20;
				YAHOO.util.Dom.setX(myid, newX);
			}
		}
	}
}

/**
 * Before closing the selector, move the product picker back to its
 * original place if it's showing.
 *//*
function closeSelector(e){
	
	console.log("close selector");
	var selector = e.data.selector;
	
	// force center
	selector.center();
	var viewWidth = $(window).width();
	var selWidth = parseInt(YAHOO.util.Dom.getStyle(myid, 'width'), 10);
	var newX = (viewWidth - selWidth)/2;
	YAHOO.util.Dom.setX(myid, newX);
	console.log("selWidth = " + selWidth);
	console.log("newX = " + 0);
}*/

function showOverlay(){
	if(this.overlay === undefined){ 
		this.overlay = new YAHOO.widget.Panel("panel1", { zIndex:1020, visible:false } );
		var item = 	"<div >"+
			"<h3>Welcome to Worldview</h3>"+
			"<p>This new tool from NASA's <a href='http://earthdata.nasa.gov/about-eosdis' target='_blank'>EOSDIS</a> provides the capability to interactively browse full-resolution, global, near real-time satellite imagery from 50+ data products from <a href='http://lance.nasa.gov/' target='_blank'>LANCE</a>.  In essence, this shows the entire Earth as it looks \"right now\" - or at least as it has looked within the past few hours.  This supports time-critical application areas such as wildfire management, air quality measurements, and weather forecasting. The data is generally available within three hours of observation and can be compared to observations since May 2012 - just click or drag the blue time sliders at the bottom of the screen to change the currently-displayed date.  Arctic and Antarctic projections of several products are also available for a \"full globe\" perspective.  Browsing on tablet devices is currently supported (iPad 2+ recommended) for mobile access. Please note, however, that this is an alpha (preview) release and many features are still under development.</p>"+
			"<br /><p>Worldview uses the newly-developed <a href='http://earthdata.nasa.gov/gibs' target='_blank'>Global Image Browse Services (GIBS)</a> to rapidly retrieve its full-resolution imagery to provide an interactive browsing experience.  While Worldview uses <a href='http://openlayers.org/' target='_blank'>OpenLayers</a> as its mapping library, GIBS also supports Google Earth, NASA World Wind, and several other clients.  We encourage interested developers to build their own clients or integrate NASA imagery into their existing ones using these services.</p>"+
			"<br /><h3>Imagery Use</h3>"+
			"<p>NASA supports an <a href='http://science.nasa.gov/earth-science/earth-science-data/data-information-policy/' target='_blank'>open data policy</a> and we encourage publication of imagery from Worldview;  when doing so, please cite it as \"NASA Worldview\" and also consider including a permalink (such as <a href='http://earthdata.nasa.gov/labs/worldview/?map=-126.87670898439,36.417480468755,-117.44604492189,42.771972656255&products=baselayers.MODIS_Aqua_CorrectedReflectance_TrueColor~overlays.sedac_bound&time=2012-08-23T12:00:00&switch=geographic' target='_blank'>this one</a>) to allow others to explore the imagery.</p>"+
			"<br /><h3>Acknowledgements</h3>"+
			"<p>Near-real time data is courtesy of LANCE data providers: <a href='http://lance.nasa.gov/home/about/amsr-e-sips/' target='_blank'>AMSR-E SIPS</a>, <a href='http://lance.nasa.gov/home/about/ges-disc/' target='_blank'>GES DISC</a>, <a href='http://lance.nasa.gov/home/about/modaps/' target='_blank'>MODAPS</a>, <a href='http://lance.nasa.gov/home/about/omi-sips/' target='_blank'>OMI SIPS</a>, and <a href='http://earthdata.nasa.gov/data/near-real-time-data/firms' target='_blank'>FIRMS</a>.  Socioeconomic data supplied by <a href='http://sedac.ciesin.org/' target='_blank'>SEDAC</a>.  User-selectable color palettes are primarily derived from <a href='http://neo.sci.gsfc.nasa.gov/' target='_blank'>NEO</a>. The imagery ingest and serving system (GIBS) is built by NASA/JPL and operated by NASA/GSFC.  Worldview is built by the NASA/GSFC Earth Science Data Information System (<a href='http://earthdata.nasa.gov/esdis' target='_blank'>ESDIS</a>) Project and is grateful for the use of many <a href='worldview-opensourcelibs.txt' target='_blank'>open source projects</a>.</p>"+
			"<br /><h3>Disclaimer</h3>"+
			"<p>The LANCE, GIBS, and FIRMS systems are operated by the NASA/GSFC ESDIS Project. The information presented through these interfaces are provided “as is” and users bear all responsibility and liability for their use of data, and for any loss of business or profits, or for any indirect, incidental or consequential damages arising out of any use of, or inability to use, the data, even if NASA or ESDIS were previously advised of the possibility of such damages, or for any other claim by you or any other person. Please read the full disclaimer <a href='http://earthdata.nasa.gov/data/nrt-data/disclaimer' target='_blank'>here</a>.</p>"+
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
