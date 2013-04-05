/**
 * Create the splash screen and tour panels and control iteration over them.
 */
function startTour() {
	
	// determine screen size - don't show if too small
	var devWidth = window.screen.availWidth;
	var devHeight = window.screen.availHeight;
	
	var viewWidth = $(window).width();
	var viewHeight = $(window).height();
	
	console.log("DEVICE:  width = " + devWidth + ", height = " + devHeight);
	console.log("VIEWPORT:  width = " + viewWidth + ", height = " + viewHeight);
	
	if(devWidth < 500 || viewWidth < 500 || devHeight < 500 || viewHeight < 500) {
		return;
	}
	
	
	// set up storage and decide whether to show the splash
	var storageEngine;
	try {
	 	storageEngine = YAHOO.util.StorageManager.get(
    		YAHOO.util.StorageEngineHTML5.ENGINE_NAME,
    		YAHOO.util.StorageManager.LOCATION_LOCAL,
    		{
        		force: false,
        		order: [
            		YAHOO.util.StorageEngineHTML5
        		]
    		});
    } catch(e) {
   		alert("No supported storage mechanism present");
   		storageEngine = false;
    }
	
	var hideSplash;
	if(storageEngine) {
		storageEngine.subscribe(storageEngine.CE_READY, function() {
    		hideSplash = storageEngine.getItem('hideSplash');
		});
	}
	
    // return if the user has disabled the splash
	if(hideSplash) {	
		return;
	}
	
	/* --- Set Up --- */

	var padding = 15; // padding - used for all of the tour windows
	var pos, width, height, xval, yval; // helpful calulation vars
	
	// splash screen overlay
	var splashOverlay = new YAHOO.widget.Panel("splash", { zIndex:1020, visible:false, modal:true, draggable:false,  } );
	var item = "<div class=\"splash\">"+
		           "<h3>Welcome to Worldview!</h3>"+
		           "</br>"+
		           "<center>"+
		               "<p class=\"splash\">This new tool from NASA's <a href='http://earthdata.nasa.gov/about-eosdis' target='_blank'>EOSDIS</a> allows users to interactively browse satellite imagery in near real-time, generally within 3 hours of observation.  Use the tools described below to change the imagery on the map and compare it to past observations.</p>"+  
		               "</br></br>"+
		               "<table class=\"splash\">"+
		                   "<tr>"+
		                       "<td><img src=\"images/picker-mini.png\" alt=\"Product Picker\" width=\"100\" class=\"splash\"/></td>"+
		                       "<td><img src=\"images/date-mini.png\" alt=\"Date Slider\" width=\"100\" class=\"splash\"/></td>"+
		                       "<td><img src=\"images/toolbar-mini.png\" alt=\"Toolbar\" width=\"100\" class=\"splash\"/></td>"+
		                       "<td><img src=\"images/map-mini.png\" alt=\"Map\" width=\"100\" class=\"splash\"/></td>"+
		                   "</tr>"+
		                   "<tr>"+
		                       "<td><p class=\"splash\">Use the <span class=\"highlight\">Product Picker</span> on the left to choose the type of imagery to display on the map.</p></td>"+
		               	       "<td><p class=\"splash\">Use the <span class=\"highlight\">Date Slider</span> on the bottom to choose the date of the observations.</p></td>"+
		               	       "<td><p class=\"splash\">Use the <span class=\"highlight\">Tool Bar</span> at the top to see other tools for changing and saving the view.</p></td>"+
		               	       "<td><p class=\"splash\">Use the <span class=\"highlight\">Map</span> itself to pan or zoom in on an area.</p></td>"+
		                   "</tr>"+
		                   "<tr>"+
		                   "<td><p></p></td>"+
		                   "</tr>"+
		                   "<tr>"+
		                       "<td rowspan=\"2\" colspan=\"2\"><button id='takeTour' type='button' class=\"takeTour\"; background-image:url('../images/splash-button.png')\">Take Tour</button></td>"+
		                       "<td rowspan=\"2\" colspan=\"2\"><button id='skipTour' type='button' class=\"skipTour\">Skip Tour</button></td>"+
					       "</tr>"+
					       "<tr></tr>"+
					       "<tr>"+
					   	       "<td><p class=\"splash\"><input id='dontShowAgain' value=\"false\" type='checkbox'>Do not show again</p></td>"+
					       "</tr>"+ 
					   "</table>"+
				   "</center>"+
			   "</div>";
	
	splashOverlay.setBody(item);
	
	/* set up all of the callout panels */
	var productText = "<div id=\"productDiv\">"+
	                      "<h3>Product Picker</h3>"+
	                      "</br>"+
	                      "<p class='tour'>A <span class='highlight'>Base Layer</span> is an opaque background image - you can show one at a time. An <span class='highlight'>Overlay</span> is a partially transparent layer to view on top of the background - you can stack overlays.</p>"+
	                      "<p class='tour'>By using the <img src=\"images/addLayers.png\" alt=\"Add Layers\" class=\"tour\"/> icon, you can browse all layers or choose an interest area.  After choosing your overlays, you can drag them up and down to reorder them.</p>"+
	                      "<p class='tour'> <span class='tryIt'>Try It!</span></p>"+
	                      "<p class='tour'>Click the \"Add Layers\" icon, select the \"Fires\" interest area, and choose the following layers.</p>"+
	                      "<p class='tour'>Base Layer: </p>"+
	                      "<ul class='tour'>"+
	                          "<li>Corrected Reflectance (True Color) Aqua/MODIS</li>"+
	                      "</ul>"+
	                      "<p class='tour'>Overlays: </p>"+
	                      "<ul class='tour'>"+
	                          "<li>Fires (Day and Night) Aqua/MODIS Fire and Thermal Anomalies</li>"+
	                          "<li>Carbon Monoxide (Total Column, Day) Aqua/AIRS</li>"+
	                      "</ul>"+
	                      "</br>"+
		              "</div>";
	document.getElementById("productPanel").innerHTML = productText;
     
	var dateText = "<div class=\"tour\">"+
	                   "<h3>Date Slider</h3>"+
	                   "</br>"+
	                   "<p class='tour'>The <span class='highlight'>Date Slider</span> is used to show imagery that was observed on a specific date.  You can click the slider to choose a date or drag the slider to view changes over time.</p>"+
	                   "<p class='tour'><span class='tryIt'>Try It!</span></p>"+
	                   "<p class='tour'>Use the date slider to change the date to August 23, 2012.</p>"+
		      	   "</div>";
	document.getElementById("datePanel").innerHTML = dateText;
	
	var toolbarText = "<div>"+
	                      "<h3>Toolbar</h3>"+
	                      "</br>"+
	                 	  "<p>The toolbar provides several additional utilities for interacting with Worldview.</p>"+
	                      "<table class=\"tour\">"+
	                          "<tr>" +
	                              "<td><img src=\"images/permalinkon.png\"</td>"+
	                              "<td><p class=\"tour\">The permalink icon lets you create a permanent, shareable link to a particular view in Worldview.</p></td>"+
	                          "</tr>" + 
	                          "<tr>" +
	                              "<td><img src=\"images/globe.png\"</td>"+
	                              "<td><p class=\"tour\">The globe icon lets you change between Arctic, geographic, and Antarctic projections of the world.</p></td>"+
	                          "</tr>" +
	                          "<tr>" +
	                              "<td><img src=\"images/camera.png\"</td>"+
	                              "<td><p class=\"tour\">The camera icon lets you download an image of your current view in Worldview. Palettes are not yet supporoted with this feature.</p></td>"+
	                          "</tr>" + 
	                          "<tr>" +
	                              "<td><img src=\"images/informationon.png\"</td>"+
	                              "<td><p class=\"tour\">The information icon provides you with more information on Worldview and its data sources.</p></td>"+
	                          "</tr>" +
	                      "</table>" +
	                      "</br>"+
		      	      "</div>";
	document.getElementById("toolbarPanel").innerHTML = toolbarText;
	
	var mapText = "<div>"+
	                  "<h3>Map</h3>"+
	                  "</br>"+
	                  "<p class='tour\'>There are several ways you can interact with the map to pan or zoom.</p>"+
	                  "<p class='tour\'>To pan, drag the map.</p>"+
	                  "<p class='tour\'>To zoom:</p>"+
	                  "<ul class='tour\'>"+
	                      "<li>Use the mouse wheel</li>"+
	                      "<li>Use the +/- icons on the right</li>"+
	                      "<li>Double-click (centers and zooms)</li>"+
	                      "<li>Shift-click-drag (zooms in on a box)</li>"+
	                  "</ul>"+
	                  "</br>"+
	                  "<p class='tour'><span class='tryIt'>Try It!</span></p>"+
	                  "<p class='tour\'>Move the map to North America and zoom in on northern California, USA.</p>"+
	                  "<img src=\"images/fire-location.png\" alt=\"Location\" width=\"200\" class=\"splash\"/>"+
	                  "</br>"+
		      	  "</div>";
		      	  
	document.getElementById("mapPanel").innerHTML = mapText;   


	/* conclusion screen after completing the tour */
	var conclusionPanel = new YAHOO.widget.Panel("conclusionPanel", { zIndex:1020, 
																	  visible:false, 
																	  modal:true,
																	  draggable:false});
	var conclusionText = "<div class=\"splash\">"+
							 "<center>"+
	                             "<h3>Finished!</h3>"+
	                             "</br>"+
	                             "<p class='tour'>You have now completed a tour of Worldview!  If you followed the “Try It” steps, you’re now looking at fires in northern California as they were observed by satellites on August 23, 2012.   You can use the tools in any order.  We hope you continue exploring!  <p>"+
		      	 	             "</br>"+
		      	 	             "<table class='tour'>"+
		      	 	                 "<tr>"+
		                                 "<td rowspan=\"2\" colspan=\"2\"><button id='repeat' type='button' class='repeatTour'>Repeat Tour</button></td>"+
		                                 "<td rowspan=\"2\" colspan=\"2\"><button id='done' type='button' class='done'>Done!</button></td>"+
					   	             "</tr>"+
					   	         "</table>"+
		      	 	         "</center>"+
		      	         "</div>";
		      	  
	conclusionPanel.setBody(conclusionText);

	/*
	 * Restart the tour at the beginning.
	 */
	var repeatTour = function(e) {
		console.log("repeating tour");
		e.stopPropagation();
		$('#joyRideTipContent').joyride({template : {'link':'<a href="#" class="joyride-close-tip">X</a>'},
                                         postStepCallback : function (index, tip) {
                                         	 if(index == 3) {
                                                 console.log("finished tour");
    										     conclusionPanel.show();
    										     conclusionPanel.center();
    										 }
                                         }});	
		conclusionPanel.hide();
		console.log("exiting repeat");
	}
	
	/*
	 * Hide the tour.
	 */
	var handleDone = function(e) {
		e.stopPropagation();
		console.log("tour done");
		conclusionPanel.hide();
		console.log("exiting tour done");
	}

	/*
	 * Close the splash and go straight to worldview.
	 */
	var handleSkipTour = function() {
	    splashOverlay.hide();
	};
	
	/*
	 * Close the splash and start the tour.
	 */
	var handleTakeTour = function(e) {
		console.log("handleTakeTour " + e.target.id);
		e.stopPropagation();
		splashOverlay.hide();
		
		$('#joyRideTipContent').joyride({template : {'link':'<a href="#" class="joyride-close-tip">X</a>'},
                                         postStepCallback : function (index, tip) {
                                         	 if(index == 3) {
                                                 console.log("finished tour");
    										     conclusionPanel.show();
    										     conclusionPanel.center();
    										 }
                                         }});	
	}
	 
	/* 
	 * Toggle the value of the "hideSplash" flag.
	 */
	var setDoNotShow = function() {
	    hideSplash = storageEngine.getItem('hideSplash');
	    storageEngine.setItem('hideSplash', !hideSplash);
	};
	    
	
	// assign events and start
	YAHOO.util.Event.on('takeTour', 'click', handleTakeTour);
	YAHOO.util.Event.on('skipTour', 'click', handleSkipTour);
	YAHOO.util.Event.on('dontShowAgain', 'click', setDoNotShow);
    YAHOO.util.Event.on('repeat', 'click', repeatTour);
    YAHOO.util.Event.on('done', 'click', handleDone);
    console.log("set all handlers");
    
    splashOverlay.render(document.body);
    conclusionPanel.render(document.body);
    splashOverlay.show();
    splashOverlay.center();
}
