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

Worldview.namespace("Indicator");

/**
 * Displays an indicator on the screen.
 * 
 * The indicator has an image and text associated with it. Use show to 
 * display and hide to remove. Example:
 * 
 *      Worldview.Indicator.show("Please Wait", "images/wait.png");
 * 
 * Only one indicator can be visibile at a time. If show is called while
 * another indicator is already active, it will be replaced.
 * 
 * @module Worldview
 * @class Indicator
 * @static
 */
$(function() {
    
    var ns = Worldview.Indicator;
    
    /**
     * Shows the indicator with a message and an icon. If another indicator
     * is already active, this call will replace the other one.
     * 
     * @method show
     * @static
     * 
     * @param message {string} The message to display
     * @param icon {string} URL to the icon to display
     */
    ns.show = function(message, icon) {
        ns.hide();
        if ( icon ) {
            $("body").append([
                "<div id='indicator'>",
                 "<img src='" + icon + "'></img>",
                    "<span>" + message + "</span>",
                "</div>"
            ].join("\n"));
        } else {
            $("body").append([
                "<div id='indicator' class='message'>",
                message,
                "</div>"
            ].join("\n"));            
        }
    };
    
    /**
     * Hides the indicator. If no indicator is displayed, this method does
     * nothing.
     * 
     * @method hide
     * @static
     */
    ns.hide = function() {
        $("#indicator").remove();
    };
                
    /**
     * Displays a "Searching" indicator. This is a convenience method for:
     * 
     *      Worldview.Indicator.show("Searching", "images/activity.gif")
     * 
     * @method searching
     * @static
     */
    ns.searching = function() {
        ns.show("Searching ECHO for Data", "images/activity.gif");
    };

    /**
     * Displays a "No data available" indicator. This is a convenience method 
     * for:
     * 
     *      Worldview.Indicator.show("No data available", "images/red-x.svg")
     * 
     * @method noData
     * @static
     */
    ns.noData = function() {
        ns.show("No Data Avaialble", "images/red-x.svg");
    };        
    
});
