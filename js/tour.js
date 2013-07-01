Worldview.namespace("Tour");

(function(ns) {
    
    var log = Logging.getLogger("Worldview.Tour");
    
    // ns = Worldview.Tour
    
    // Keep these around in a closure so we can dispose of them as needed
    var conclusionPanel = null;
    var splashOverlay = null;

    /**
     * Create the splash screen and tour panels and control iteration over them.
     */        
    ns.start = function(noDisable) {
                    
        // determine screen size - don't show if too small
        var devWidth = window.screen.availWidth;
        var devHeight = window.screen.availHeight;
        
        var viewWidth = $(window).width();
        var viewHeight = $(window).height();
        
        if(viewWidth < 768 || viewHeight < 600) {
            if(noDisable) {
                Worldview.notify("Unfortunately the Worldview tour can only be viewed in larger web browser windows.");
            }
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
        if(hideSplash && !noDisable) {   
            return;
        }
        
        /* --- Set Up --- */
    
        var padding = 15; // padding - used for all of the tour windows
        var pos, width, height, xval, yval; // helpful calulation vars
        
        // splash screen overlay
        if(splashOverlay){
            splashOverlay.destroy();
        }
        splashOverlay = new YAHOO.widget.Panel("splash", { zIndex:1020, visible:false, modal:true, draggable:false,  } );
    
        var item = "<div class=\"splash\">"+
                       "<h3>Welcome to Worldview!</h3>"+
                       "</br>"+
                       "<center>"+
                           "<p class=\"splash\">This new tool from NASA's <a href='http://earthdata.nasa.gov/about-eosdis' target='_blank'>EOSDIS</a> allows users to interactively browse satellite imagery in near real-time, generally within 3 hours of observation.  Use the tools described below to change the imagery on the map and compare it to past observations.</p>"+  
                           "</br></br>"+
                           "<table class=\"splash\">"+
                               "<tr>"+
                                   "<td><img src=\"images/tour-picker.png\" alt=\"Product Picker\" width=\"100\" height=\"108\" class=\"splash\"/></td>"+
                                   "<td><img src=\"images/tour-date.png\" alt=\"Date Slider\" width=\"100\" class=\"splash\"/></td>"+
                                   "<td><img src=\"images/tour-toolbar.png\" alt=\"Toolbar\" width=\"100\" class=\"splash\"/></td>"+
                                   "<td><img src=\"images/tour-map.png\" alt=\"Map\" width=\"100\" class=\"splash\"/></td>"+
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
        splashOverlay.show();
        
        /* set up all of the callout panels */
        var productText = "<div>"+
                              "<h3>Product Picker</h3>"+
                              "</br>"+
                              "<p class='tour'>A <span class='highlight'>Base Layer</span> is an opaque background image - you can have multiple active base layers, but you can only show one at a time. An <span class='highlight'>Overlay</span> is a partially transparent layer to view on top of the background - you can view multiple overlays at once.  Use the <img src=\"images/visible.png\"/> icon to show and hide layers and the <img src=\"images/close.png\"/> icon to remove them.</p>"+
                              "<p class='tour'>On the \"Add Layers\" tab, you can use the drop down list or the search bar to find layers.</p>"+
                              "<p class='tour'> <span class='tryIt'>Try It!</span></p>"+
                              "<p class='tour'>Under the \"Add Layers\" tab:</p>"+
                              "<ul class='tour'>"+
                                  "<li>Enter \"aqua\" in the search bar.</li>" +
                                  "<li>Select the \"Corrected Reflectance (True Color) Aqua/MODIS\" base layer.</li>" +
                                  "<li>Select the \"Fires\" category from the drop down list.</li>"+
                                  "<li>Add the \"Fires (Day and Night) Aqua/MODIS Fire and Thermal Anomalies\" overlay.</li>"+
                                  "<li>Add the \"Carbon Monoxide (Total Column, Day) Aqua/AIRS\" overlay.</li>"+
                              "</ul>"+
                              "</br>"+
                          "</div>";
        document.getElementById("productPanel").innerHTML = productText;
         
        var dateText = "<div class=\"tour\">"+
                           "<h3>Date Slider</h3>"+
                           "</br>"+
                           "<p class='tour'>The <span class='highlight'>Date Slider</span> is used to show imagery that was observed on a specific date.  You can click the slider to choose a date or drag the slider to view changes over time.</p>"+
                           "<p class='tour'><span class='tryIt'>Try It!</span></p>"+
                           "<p class='tour'>Use the date slider to change the date to 2012 Aug 23.</p>"+
                       "</div>";
        document.getElementById("datePanel").innerHTML = dateText;
        
        var toolbarText = "<div>"+
                              "<h3>Toolbar</h3>"+
                              "</br>"+
                              "<p>The toolbar provides several additional utilities for interacting with Worldview.</p>"+
                              "<table class=\"tour\">"+
                                  "<tr>" +
                                      "<td><img src=\"images/permalinkon.png\"/></td>"+
                                      "<td><p class=\"tour\">The permalink icon lets you create a permanent, shareable link to a particular view in Worldview.</p></td>"+
                                  "</tr>" + 
                                  "<tr>" +
                                      "<td><img src=\"images/globe.png\"/></td>"+
                                      "<td><p class=\"tour\">The globe icon lets you change between Arctic, geographic, and Antarctic projections of the world.</p></td>"+
                                  "</tr>" +
                                  "<tr>" +
                                      "<td><img src=\"images/camera.png\"/></td>"+
                                      "<td><p class=\"tour\">The camera icon lets you download an image of your current view in Worldview. User-selected palettes are not yet supported with this feature.</p></td>"+
                                  "</tr>" + 
                                  "<tr>" +
                                      "<td><img src=\"images/informationon.png\"/></td>"+
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
                          "<img src=\"images/tour-fire-location.png\" alt=\"Location\" width=\"200\" class=\"splash\"/>"+
                          "</br>"+
                      "</div>";
                      
        document.getElementById("mapPanel").innerHTML = mapText;   
    
    
        /* conclusion screen after completing the tour */
        if(conclusionPanel){
            conclusionPanel.destroy();
        }
        conclusionPanel = new YAHOO.widget.Panel("conclusionPanel", { zIndex:1020, 
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
            log.debug("repeating tour");
            e.stopPropagation();
            $('#joyRideTipContent').joyride({adjustForPhone:false,
            								 bordered:true,
            								 template : {'link':'<a href="#" class="joyride-close-tip">X</a>'},
                                             postStepCallback : function (index, tip) {
                                                 if(index == 3) {
                                                     log.debug("finished tour");
                                                     conclusionPanel.show();
                                                     conclusionPanel.center();
                                                 }
                                             }});   
            conclusionPanel.hide();
            log.debug("exiting repeat");
        }
        
        /*
         * Hide the tour.
         */
        var handleDone = function(e) {
            e.stopPropagation();
            log.debug("tour done");
            conclusionPanel.hide();
            log.debug("exiting tour done");
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
            log.debug("handleTakeTour " + e.target.id);
            e.stopPropagation();
            splashOverlay.hide();
            
            $('#joyRideTipContent').joyride({adjustForPhone:false,
            								 bordered:true,
            								 template : {'link':'<a href="#" class="joyride-close-tip">X</a>'},
                                             postStepCallback : function (index, tip) {
                                                 if(index == 3) {
                                                     log.debug("finished tour");
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
            
            
        $(window).resize(function() {
        	 splashOverlay.center();
        	 conclusionPanel.center();
        });
        
        // assign events and start
        YAHOO.util.Event.on('takeTour', 'click', handleTakeTour);
        YAHOO.util.Event.on('skipTour', 'click', handleSkipTour);
        YAHOO.util.Event.on('dontShowAgain', 'click', setDoNotShow);
        YAHOO.util.Event.on('repeat', 'click', repeatTour);
        YAHOO.util.Event.on('done', 'click', handleDone);
        log.debug("set all handlers");
        
        splashOverlay.render(document.body);
        conclusionPanel.render(document.body);
        splashOverlay.show();
        splashOverlay.center();
    }
        
})(Worldview.Tour);

	

