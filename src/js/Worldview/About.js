/*
 * NASA Worldview
 * 
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project. 
 *
 * Copyright (C) 2013 United States Government as represented by the 
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

/**
 * Namespace: Worldview.Palette
 * Visualization of science data.
 */
Worldview.namespace("About");

$(function() {
    
    var ns = Worldview.About;
    var overlay;
    
    ns.show = function() {
        if ( $(window).width() < 750 ) {
            showMobile();
        } else {
            showDesktop();
        }
    };
    
    var showDesktop = function() {
         if ( !overlay ) { 
                overlay = new YAHOO.widget.Panel("panel1", { zIndex:1020, visible:false } );
                var item =      "<div >"+
                        "<h3>Welcome to Worldview</h3>"+
                        "<p>This new tool from NASA's <a href='http://earthdata.nasa.gov/about-eosdis' target='_blank'>EOSDIS</a> provides the capability to interactively browse full-resolution, global, near real-time satellite imagery from 50+ data products from <a href='http://lance.nasa.gov/' target='_blank'>LANCE</a>.  In essence, this shows the entire Earth as it looks \"right now\" - or at least as it has looked within the past few hours.  This supports time-critical application areas such as wildfire management, air quality measurements, and weather forecasting. The data is generally available within three hours of observation and can be compared to observations since May 2012 - just click or drag the blue time sliders at the bottom of the screen to change the currently-displayed date.  Arctic and Antarctic projections of several products are also available for a \"full globe\" perspective.  Browsing on tablet devices is currently supported (iPad 2+ recommended) for mobile access. Please note, however, that this is an alpha (preview) release and many features are still under development.</p>"+
                        "<br /><p>Worldview uses the newly-developed <a href='http://earthdata.nasa.gov/gibs' target='_blank'>Global Image Browse Services (GIBS)</a> to rapidly retrieve its full-resolution imagery to provide an interactive browsing experience.  While Worldview uses <a href='http://openlayers.org/' target='_blank'>OpenLayers</a> as its mapping library, GIBS also supports Google Earth, NASA World Wind, and several other clients.  We encourage interested developers to build their own clients or integrate NASA imagery into their existing ones using these services.</p>"+
                        "<br /><h3>Imagery Use</h3>"+
                        "<p>NASA supports an <a href='http://science.nasa.gov/earth-science/earth-science-data/data-information-policy/' target='_blank'>open data policy</a> and we encourage publication of imagery from Worldview;  when doing so, please cite it as \"NASA Worldview\" and also consider including a permalink (such as <a href='http://earthdata.nasa.gov/labs/worldview/?map=-126.87670898439,36.417480468755,-117.44604492189,42.771972656255&products=baselayers.MODIS_Aqua_CorrectedReflectance_TrueColor~overlays.sedac_bound&time=2012-08-23T12:00:00&switch=geographic' target='_blank'>this one</a>) to allow others to explore the imagery.</p>"+
                        "<br /><h3>Acknowledgements</h3>"+
                        "<p>Near-real time data is courtesy of LANCE data providers: <a href='http://lance.nasa.gov/home/about/amsr-e-sips/' target='_blank'>AMSR-E SIPS</a>, <a href='http://lance.nasa.gov/home/about/ges-disc/' target='_blank'>GES DISC</a>, <a href='http://lance.nasa.gov/home/about/modaps/' target='_blank'>MODAPS</a>, <a href='http://lance.nasa.gov/home/about/omi-sips/' target='_blank'>OMI SIPS</a>, and <a href='http://earthdata.nasa.gov/data/near-real-time-data/firms' target='_blank'>FIRMS</a>.  Socioeconomic data supplied by <a href='http://sedac.ciesin.org/' target='_blank'>SEDAC</a>.  User-selectable color palettes are primarily derived from <a href='http://neo.sci.gsfc.nasa.gov/' target='_blank'>NEO</a>. The imagery ingest and serving system (GIBS) is built by NASA/JPL and operated by NASA/GSFC.  Worldview is built by the NASA/GSFC Earth Science Data Information System (<a href='http://earthdata.nasa.gov/esdis' target='_blank'>ESDIS</a>) Project and is grateful for the use of many <a href='pages/worldview-opensourcelibs.html' target='_blank'>open source projects</a>.</p>"+
                        "<br /><h3>Disclaimer</h3>"+
                        "<p>The LANCE, GIBS, and FIRMS systems are operated by the NASA/GSFC ESDIS Project. The information presented through these interfaces are provided “as is” and users bear all responsibility and liability for their use of data, and for any loss of business or profits, or for any indirect, incidental or consequential damages arising out of any use of, or inability to use, the data, even if NASA or ESDIS were previously advised of the possibility of such damages, or for any other claim by you or any other person. Please read the full disclaimer <a href='http://earthdata.nasa.gov/data/nrt-data/disclaimer' target='_blank'>here</a>.</p>"+
                        "<br /><p>"+
                                "Version: " + Worldview.VERSION + " - " + Worldview.BUILD_TIMESTAMP + " (<a href='pages/release_notes.html' target='_blank'>release notes</a>)<br />"+
                                "Front-End Lead/Architect: <a href='mailto:tilak.joshi@nasa.gov'>Tilak Joshi</a><br />"+ 
                                "Responsible NASA Official:  <a href='mailto:ryan.a.boller@nasa.gov'>Ryan Boller</a><br />"+
                        "</p>"+         
                "</div>";
                
                overlay.setBody(item);
                overlay.render(document.body);
        
            overlay.show();
            overlay.center();
            overlay.hideEvent.subscribe(function() {
                setTimeout(function() { 
                    overlay.destroy(); 
                    overlay = null;
                }, 25)
            });
        }
    };
    
        
    var showMobile = function() {        
        html = [
            "<div class='about about-title'>" + Worldview.NAME + "</div>",
            "<div class='about about-version'>Version " + Worldview.VERSION + "</div>",
            "<div class='about about-build'>" + Worldview.BUILD_TIMESTAMP + "</div>",
            "<br/>",
            "<div class='about'>",
                "<a href='pages/about.html' target='_blank'>Welcome to Worldview</a>",
            "</div>",
            "<div class='about'>",
                "<a href='pages/about.html#imagery-use' target='_blank'>Imagery Use</a>",
            "</div>",
            "<div class='about'>",
                "<a href='pages/about.html#acknowledgements' target='_blank'>Acknowledgements</a>",
            "</div>",
            "<div class='about'>",
                "<a href='pages/about.html#disclaimer' target='_blank'>Disclaimer</a>",
            "</div>",
            "<div class='about'>",
                "<a href='pages/release_notes.html' target='_blank'>Release Notes</a>",
            "</div>",
        ].join("\n");
        Worldview.notify(html, "&nbsp;");     
    };
});

