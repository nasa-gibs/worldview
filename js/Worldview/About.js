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
        html = [
            "<div class='about about-title'>" + Worldview.NAME + "</div>",
            "<div class='about about-version'>Version " + Worldview.VERSION + "</div>",
            "<div class='about about-build'>" + Worldview.BUILD_TIMESTAMP + "</div>",
            "<br/>",
            "<div class='about'>",
                "<a href='about.html' target='_blank'>Welcome to Worldview</a>",
            "</div>",
            "<div class='about'>",
                "<a href='about.html#imagery-use' target='_blank'>Imagery Use</a>",
            "</div>",
            "<div class='about'>",
                "<a href='about.html#acknowledgements' target='_blank'>Acknowledgements</a>",
            "</div>",
            "<div class='about'>",
                "<a href='about.html#disclaimer' target='_blank'>Disclaimer</a>",
            "</div>",
            "<div class='about'>",
                "<a href='release_notes.txt' target='_blank'>Release Notes</a>",
            "</div>",
        ].join("\n");
        Worldview.notify(html, "&nbsp;");     
    }
});

