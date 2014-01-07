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
 * @module wv.ui
 */
var wv = wv || {};
wv.ui = wv.ui || {};

/**
 * Displays the Worldview about box. If this is a desktop device, a full
 * dialog box is shown with all the relevant information. If this is a mobile
 * device, a small dialog box is shown with links to a page that contains
 * the full information.
 *
 * @class wv.ui.about
 * @static
 */
wv.ui.about = wv.ui.about || (function() {

    var self = {};
    var overlay;

    /**
     * Show the about dialog box.
     *
     * @method show
     */
    self.show = function() {
        if ( wv.util.browser.small ) {
            showMobile();
        } else {
            showDesktop();
        }
    };

    var showDesktop = function() {
         if ( !overlay ) {
                overlay = new YAHOO.widget.Panel("panel1", {
                    zIndex:1020,
                    visible:false,
                    constraintoviewport: true
                });

                //=============================================================
                // NOTE: pages/about.html MUST also be updated!
                //=============================================================
                var item = "<div >"+
                        "<h3>Welcome to Worldview</h3>"+
                        "<p>This tool from NASA's <a href='https://earthdata.nasa.gov/about-eosdis' target='_blank'>EOSDIS</a> provides the capability to interactively browse global, full-resolution satellite imagery and then download the underlying data.  Most of the 100+ available products are updated within three hours of observation, essentially showing the entire Earth as it looks \"right now\".  This supports time-critical application areas such as wildfire management, air quality measurements, and flood monitoring.  Arctic and Antarctic views of several products are also available for a \"full globe\" perspective.  Browsing on tablet and smartphone devices is generally supported for mobile access to the imagery.</p>"+
                        "<br /><p>Worldview uses the <a href='https://earthdata.nasa.gov/gibs' target='_blank'>Global Imagery Browse Services (GIBS)</a> to rapidly retrieve its imagery for an interactive browsing experience.  While Worldview uses <a href='http://openlayers.org/' target='_blank'>OpenLayers</a> as its mapping library, GIBS imagery can also be accessed from Google Earth, NASA World Wind, and several other clients.  We encourage interested developers to build their own clients or integrate NASA imagery into their existing ones using these services.</p>"+

                        "<br /><h3>Imagery Use</h3>"+
                        "<p>NASA supports an <a href='http://science.nasa.gov/earth-science/earth-science-data/data-information-policy/' target='_blank'>open data policy</a> and we encourage publication of imagery from Worldview;  when doing so, please cite it as \"NASA Worldview\" and also consider including a permalink (such as <a href='https://earthdata.nasa.gov/labs/worldview/?map=-126.907471,36.373535,-117.415283,42.815918&products=baselayers,MODIS_Aqua_CorrectedReflectance_TrueColor~overlays,MODIS_Fires_All,sedac_bound&time=2012-08-23&switch=geographic' target='_blank'>this one</a>) to allow others to explore the imagery.</p>"+
                        "<br /><h3>Acknowledgements</h3>"+
                        "<p>Near-real time data is courtesy of <a href='http://lance.nasa.gov/' target='_blank'>LANCE</a> data providers: <a href='http://lance.nasa.gov/home/about/amsr-e-sips/' target='_blank'>AMSR-E SIPS</a>, <a href='http://lance.nasa.gov/home/about/ges-disc/' target='_blank'>GES DISC</a>, <a href='http://lance.nasa.gov/home/about/modaps/' target='_blank'>MODAPS</a>, <a href='http://lance.nasa.gov/home/about/omi-sips/' target='_blank'>OMI SIPS</a>, and <a href='http://earthdata.nasa.gov/data/near-real-time-data/firms' target='_blank'>FIRMS</a>.  Ocean color and temperature data provided by <a href='http://oceancolor.gsfc.nasa.gov/' target='_blank'>OBPG</a> and <a href='http://podaac.jpl.nasa.gov/' target='_blank'>PO.DAAC</a>.  Socioeconomic data supplied by <a href='http://sedac.ciesin.org/' target='_blank'>SEDAC</a>.  Orbit tracks provided by <a href='https://www.space-track.org' target='_blank'>space-track.org</a>. Polar coastlines and graticules courtesy of <a href='http://www.add.scar.org/' target='_blank'>ADD SCAR</a>, <a href='http://www.openstreetmap.org/' target='_blank'>OpenStreetMap</a>, and <a href='http://www.polarview.aq/' target='_blank'>PolarView</a>. User-selectable color palettes are primarily derived from <a href='http://neo.sci.gsfc.nasa.gov/' target='_blank'>NEO</a>. The imagery ingest and serving system (GIBS) is built by NASA/JPL and operated by NASA/GSFC.  Worldview is built by the NASA/GSFC Earth Science Data Information System (<a href='http://earthdata.nasa.gov/esdis' target='_blank'>ESDIS</a>) Project and is grateful for the use of many <a href='pages/worldview-opensourcelibs.html' target='_blank'>open source projects</a>.</p>"+
                        "<br /><h3>Disclaimer</h3>"+
                        "<p>The information presented through this interface is provided \"as is\" and users bear all responsibility and liability for their use of the data.  Please read the <a href='https://earthdata.nasa.gov/data/nrt-data/disclaimer' target='_blank'>full disclaimer</a>.</p>"+
                        "<br /><p>"+
                                "Version: " + wv.brand.VERSION + " - " + wv.brand.BUILD_TIMESTAMP + " (<a href='pages/release_notes.html' target='_blank'>release notes</a>)<br />"+
                                "Release Manager: <a href='mailto:mike.mcgann@nasa.gov'>Mike McGann</a><br />"+
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
                }, 25);
            });
        }
    };


    var showMobile = function() {
        html = [
            "<div class='about about-title'>" + wv.brand.NAME + "</div>",
            "<div class='about about-version'>Version " + wv.brand.VERSION + "</div>",
            "<div class='about about-build'>" + wv.brand.BUILD_TIMESTAMP + "</div>",
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
        wv.ui.notify(html, "&nbsp;");
    };

    return self;

})();

