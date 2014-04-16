/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2014 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

/**
 * @module @wv
 */
var wv = wv || {};

wv.tour = wv.tour || function(models, ui) {

    var self = {};

    var conclusionPanel = null;
    var splashOverlay = null;
    var active = false;

    var init = function() {
        $("#wv-tour").click(function() {
            self.start();
        });
        self.introduction();
    };

    self.introduction = function() {
        // Don't start tour if coming in via a permalink
        if ( window.location.search ) { return; }

        // Tour does not work on IE 9 or below
        if ( wv.util.browser.ie && wv.util.browser.version <= 9 ) { return; }

        // Don't annoy with the tour if they cannot opt out in the future
        if ( !wv.util.browser.localStorage ) { return ; }

        // Don't show tour if the user has opted out
        if ( wv.util.localStorage("hideSplash") ) { return; }

        // Don't show tour on small screens
        if ( !validScreenSize() ) { return; }

        self.start(true);
    };

    /**
     * Create the splash screen and tour panels and control iteration over them.
     */
    self.start = function(introduction) {
        if ( wv.util.browser.ie && wv.util.browser.version <= 9) {
            wv.ui.unsupported("tour");
            return;
        }

        if ( !validScreenSize() ) {
            wv.ui.notify("Unfortunately the @NAME@ tour can only be viewed in larger web browser windows.");
            return;
        }

        /* --- Set Up --- */
        if ( active ) {
            $('#joyRideTipContent').joyride("destroy");
        }

        var padding = 15; // padding - used for all of the tour windows
        var pos, width, height, xval, yval; // helpful calculation vars

        var finalRow = "";
        if(introduction) {
            finalRow = "<td colspan='2'><p id='dontShowP' class=\"splash\"><input id='dontShowAgain' type='checkbox'>Do not show again (Access from <i class='fa fa-info-circle fa-fw'></i> menu)</p></td>";
        }
        var item = "<div class=\"splash\">"+
                       "<h3>Welcome to @NAME@!</h3>"+
                       "</br></br>"+
                       "<center>"+
                           "<p class=\"splashwelcome\">This tool from NASA's <a href='http://earthdata.nasa.gov/about-eosdis' target='_blank'>EOSDIS</a> allows you to interactively browse global satellite imagery within hours of it being acquired. Use the features described below to find interesting imagery, then save and share what you find.</p>"+
                           "</br></br>"+
                           "<table id=\"splashTable\" class=\"splash\">"+
                               "<tr>"+
                                   "<td><img src=\"images/tour-picker-0.6.png\" alt=\"Product Picker\" width=\"100\" height=\"85\" class=\"splash\"/></td>"+
                                   "<td><img src=\"images/tour-date.png\" alt=\"Date Slider\" width=\"100\" class=\"splash\"/></td>"+
                                   "<td><img src=\"images/tour-toolbar.png\" alt=\"Toolbar\" width=\"100\" class=\"splash\"/></td>"+
                                   "<td><img src=\"images/tour-map.png\" alt=\"Map\" width=\"100\" class=\"splash\"/></td>"+
                               "</tr>"+
                               "<tr class='splash-info'>"+
                                   "<td class='splash-info'><p class=\"splash\">Use the <span class=\"highlight\">Product Picker</span> on the left to choose the type of imagery to display on the map.</p></td>"+
                                   "<td class='splash-info'><p class=\"splash\">Use the <span class=\"highlight\">Date Slider</span> on the bottom to choose the date of the observations.</p></td>"+
                                   "<td class='splash-info'><p class=\"splash\">Use the <span class=\"highlight\">Tool Bar</span> at the top to see other tools for changing and saving the view.</p></td>"+
                                   "<td class='splash-info'><p class=\"splash\">Use the <span class=\"highlight\">Map</span> itself to pan or zoom in on an area.</p></td>"+
                               "</tr>"+
                               "<tr>"+
                               "<td><p></p></td>"+
                               "</tr>"+
                               "<tr>"+
                                   "<td rowspan=\"2\" colspan=\"4\"><p style='text-align:center;'><button id='takeTour' type='button' class=\"takeTour\"; background-image:url('../images/splash-button.png')\">Take Tour</button><button id='skipTour' type='button' class=\"skipTour\">Skip Tour</button></p></td>"+
                                   //"<td rowspan=\"2\" colspan=\"2\"><button id='skipTour' type='button' class=\"skipTour\">Skip Tour</button></td>"+
                               "</tr>"+
                               "<tr></tr>"+
                               "<tr>"+
                                   finalRow +
                               "</tr>"+
                           "</table>"+
                       "</center>"+
                   "</div>";

        var $startDialog = wv.ui.getDialog();
        $startDialog
            .html(item)
            .dialog({
                dialogClass: "tour",
                modal: true,
                width: 700,
                height: 550,
                draggable: false,
                resizable: false
            });
        active = true;
        /*
        splashOverlay = new YAHOO.widget.Panel("splash", { zIndex:1020, visible:false, modal:true, draggable:false,  } );

        splashOverlay.setBody(item);
        splashOverlay.show();
        */

        /* set up all of the callout panels */
        var productText = "<div>"+
                              "<h3>Layer Picker - Base Layers</h3>"+
                              "</br></br>"+
                              "<p class='tour'>A <span class='highlight'>Base Layer</span> is an opaque background image - you can have multiple active base layers, but you can only show one at a time.</p>"+
                              "<p class='tour'>There are several ways to interact with the layers: </p>" +
                              "<ul class='tour'>"+
                                  "<li>Use the <img style='height: 14px' src=\"images/visible.png\"/> icon to show and hide layers.</li>" +
                                  "<li>Use the <img style='height: 14px' src=\"images/close-x.png\"/> icon to remove layers.</li>"+
                                  "<li>Drag the layers to rearrange them.</li>" +
                              "</ul>"+
                              "<p class='tour'> <span class='tryIt'>Try It!</span></p>"+
                              "<ul class='tour'>"+
                                  "<li>Click on the <img style='height: 14px' src='images/visible.png'/> for \"Corrected Reflectance (True Color) Aqua / MODIS\" under Base Layers.</li>" +
                                  "<li>Drag \"Corrected Reflectance (True Color) Aqua / MODIS\" to the bottom of the list.  Notice how the map changes.</li>" +
                                  "<li>Drag \"Corrected Reflectance (True Color) Aqua / MODIS\" back to the top of the list.</li>" +
                              "</ul>"+
                              "</br>"+
                          "</div>";
        document.getElementById("productBasePanel").innerHTML = productText;

        var overlayText = "<div>"+
                              "<h3>Layer Picker - Continued</h3>"+
                              "</br></br>"+
                              "<p class='tour'>An <span class='highlight'>Overlay</span> is a partially transparent layer to view on top of the background - you can view multiple overlays at once.  If an overlay has a color bar, you can click the color bar and select a new color palette."+
                              "<p>On the <i class=\"productsIcon selected icon-add\"></i> tab, you can use the drop down list or the search bar to find and add layers.</p> "+
                              "<p>On the <i class=\"productsIcon selected icon-download\"></i> tab, you can download data for layers you are currently viewing.</p> "+
                              "<p class='tour'> <span class='tryIt'>Try It!</span></p>"+
                              "<ul class='tour'>"+
                                  "<li>Click on the <i class=\"productsIcon selected icon-add\"></i> tab.</li>"+
                                  "<li>Select \"Fires\" from the drop down list.</li>"+
                                  "<li>Type \"aqua\" in the search box.</li>"+
                                  "<li>Add the \"Fires (Day and Night) Aqua/MODIS Fire and Thermal Anomalies\" overlay.</li>"+
                                  "<li>Click on the <i class=\"productsIcon selected icon-download\"></i> tab to see what data can be downloaded.</li>"+
                                  "<li>Click on the <i class=\"productsIcon selected icon-active\"></i> tab to see the layers that have been added.</li>"+
                              "</ul>"+
                              "</br>"+
                          "</div>";
        document.getElementById("productOverlayPanel").innerHTML = overlayText;

        var dateText = "<div class=\"tour\">"+
                           "<h3>Date Slider</h3>"+
                           "</br></br>"+
                           "<p class='tour'>The <span class='highlight'>Date Slider</span> is used to show imagery that was observed on a specific date.  You can click the slider to choose a date or drag the slider to view changes over time.</p>"+
                           "<p class='tour'><span class='tryIt'>Try It!</span></p>"+
                           "<p class='tour'>Use the date slider to change the date to 2012 Aug 23.</p>"+
                       "</div>";
        document.getElementById("datePanel").innerHTML = dateText;

        var toolbarText = "<div>"+
                              "<h3>Toolbar</h3>"+
                              "</br></br>"+
                              "<p>The toolbar provides several additional utilities for interacting with @NAME@.</p>"+
                              "<table class=\"tour\">"+
                                  "<tr>" +
                                      "<td><img src=\"images/permalinkon.png\"/></td>"+
                                      "<td><p class=\"tour\">The permalink icon lets you create a permanent, shareable link to a particular view in @NAME@.</p></td>"+
                                  "</tr>" +
                                  "<tr>" +
                                      "<td><img src=\"images/globe.png\"/></td>"+
                                      "<td><p class=\"tour\">The globe icon lets you change between Arctic, geographic, and Antarctic projections of the world.</p></td>"+
                                  "</tr>" +
                                  "<tr>" +
                                      "<td><img src=\"images/camera.png\"/></td>"+
                                      "<td><p class=\"tour\">The camera icon lets you download an image of your current view in @NAME@. User-selected palettes are not yet supported with this feature.</p></td>"+
                                  "</tr>" +
                                  "<tr>" +
                                      "<td><img src=\"images/informationon.png\"/></td>"+
                                      "<td><p class=\"tour\">The information icon provides you with more information on @NAME@ and its data sources.</p></td>"+
                                  "</tr>" +
                              "</table>" +
                              "</br>"+
                          "</div>";
        document.getElementById("toolbarPanel").innerHTML = toolbarText;

        var mapText = "<div>"+
                          "<h3>Map</h3>"+
                          "</br></br>"+
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

        var mapAnchor = document.getElementById("mapPanelTourAnchor");
        if(!mapAnchor) {
            //console.log("creating mapanchor");
            var owner = document.getElementById("map");
            mapAnchor = document.createElement("div");
            mapAnchor.setAttribute("id", "mapPanelTourAnchor");
            mapAnchor.setAttribute("style", "float:right; height:68px; right:14px; top:90px; width:36px; position:relative; z-index:-1");
            owner.appendChild(mapAnchor);
        }

        var endTour = function() {
            var $dialog = wv.ui.getDialog();
            var conclusionText = "<div class=\"splash\">"+
                                 "<center>"+
                                     "<h3>Finished!</h3>"+
                                     "</br></br>"+
                                     "<p class='splashwelcome'>You have now completed a tour of @NAME@!  If you followed the “Try It” steps, you’re now looking at fires in northern California as they were observed by satellites on August 23, 2012.   You can use the tools in any order.  We hope you continue exploring!  <p>"+
                                     "</br>"+
                                     "<table class='tour'>"+
                                         "<tr>"+
                                             "<td rowspan=\"2\" colspan=\"2\"><button id='repeat' type='button' class='repeatTour'>Repeat Tour</button></td>"+
                                             "<td rowspan=\"2\" colspan=\"2\"><button id='done' type='button' class='done'>Done!</button></td>"+
                                         "</tr>"+
                                     "</table>"+
                                    "</center>"+
                                "</div>";
            $dialog
                .html(conclusionText)
                .dialog({
                    dialogClass: "tour",
                    modal: true,
                    width: 600,
                    height: 215,
                    draggable: false,
                    resizable: false
                });
            $("#repeat").click(repeatTour);
            $("#done").click(handleDone);
            active = false;
        };

        /*
         * Restart the tour at the beginning.
         */
        var repeatTour = function(e) {
            e.stopPropagation();
            $(".ui-dialog-content").dialog("close");
            $('#joyRideTipContent').joyride({adjustForPhone:false,
                                             bordered:true,
                                             includepage:true,
                                             template : {'link':'<a href="#" class="joyride-close-tip">X</a>'},
                                             postStepCallback : function (index, tip) {
                                                 if(index == 4) {
                                                     endTour();
                                                 }
                                             }});
        };

        /*
         * Hide the tour.
         */
        var handleDone = function(e) {
            e.stopPropagation();
            $(".ui-dialog-content").dialog("close");
        };

        /*
         * Close the splash and go straight to worldview.
         */
        var handleSkipTour = function() {
            active = false;
            $(".ui-dialog-content").dialog("close");
        };

        var onStop = function(index, tip, button) {
            //console.log(index, tip, button);
            setTourState();
            if(index == 4 && button !== "previous") {
                endTour();
            }
        };

        /*
         * Close the splash and start the tour.
         */
        var handleTakeTour = function(e) {
            e.stopPropagation();
            $(".ui-dialog-content").dialog("close");
            initTourState();

            $('#joyRideTipContent').joyride({adjustForPhone:false,
                                             bordered:true,
                                             includepage:true,
                                             template : {'link':'<a href="#" class="joyride-close-tip">X</a>'},
                                             postStepCallback : onStop});
        };

        /*
         * Toggle the value of the "hideSplash" flag.
         */
        var setDoNotShow = function() {
            var hideSplash = wv.util.localStorage('hideSplash');
            wv.util.localStorage('hideSplash', !hideSplash);
        };


        $(window).resize(function() {
             splashOverlay.center();
             conclusionPanel.center();
        });

        // assign events and start
        $("#takeTour").click(handleTakeTour);
        $("#skipTour").click(handleSkipTour);
        $("#dontShowAgain").click(setDoNotShow);

        /*
        YAHOO.util.Event.on('takeTour', 'click', handleTakeTour);
        YAHOO.util.Event.on('skipTour', 'click', handleSkipTour);
        YAHOO.util.Event.on('dontShowAgain', 'click', setDoNotShow);
        YAHOO.util.Event.on('repeat', 'click', repeatTour);
        YAHOO.util.Event.on('done', 'click', handleDone);
        */
    };

    var initTourState = function() {
        models.proj.selectDefault();
        models.date.select(wv.util.today());
        models.layers.reset();
        models.map.setExtentToLeading();
        setTourState();
    };

    var setTourState = function() {
        ui.sidebar.expandNow();
        ui.sidebar.selectTab("active");
        //ui.dateSliders.expand();
        models.proj.selectDefault();
    };

    var validScreenSize = function() {
        var viewWidth = $(window).width();
        var viewHeight = $(window).height();

        return viewWidth >= 768 && viewHeight >= 680;
    };

    init();
    return self;
};
