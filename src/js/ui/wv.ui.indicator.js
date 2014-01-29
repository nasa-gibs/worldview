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
 * @module wv.ui
 */
var wv = wv || {};
wv.ui = wv.ui || {};

/**
 * Displays an indicator on the screen.
 *
 * The indicator has an image and text associated with it. Use show to
 * display and hide to remove. Example:
 *
 *      wv.ui.indicator.show("Please Wait", "images/wait.png");
 *
 * Only one indicator can be visibile at a time. If show is called while
 * another indicator is already active, it will be replaced.
 *
 * @class wv.ui.indicator
 * @static
 */
wv.ui.indicator = wv.ui.indicator || (function() {

    var self = {};

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
    self.show = function(message, icon) {
        self.hide();
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
    self.hide = function() {
        $("#indicator").remove();
    };

    /**
     * Displays a "Searching" indicator. This is a convenience method for:
     *
     *      wv.ui.indicator.show("Searching", "images/activity.gif")
     *
     * @method searching
     * @static
     */
    self.searching = function() {
        self.show("Searching ECHO for Data", "images/activity.gif");
    };

    /**
     * Displays a "Loading" indicator. This is a convenience method for:
     *
     *      wv.ui.indicator.show("Loading", "images/activity.gif")
     *
     * @method searching
     * @static
     */
    self.loading = function() {
        self.show("Loading", "images/activity.gif");
    };

    /**
     * Displays a "No data available" indicator. This is a convenience method
     * for:
     *
     *      wv.ui.indicator.show("No data available", "images/red-x.svg")
     *
     * @method noData
     * @static
     */
    self.noData = function() {
        self.show("No Data Avaialble", "images/red-x.svg");
    };

    /**
     * Displays a "Loading" indicator if the specified promise is not
     * fulfilled in a certain amount of time. Once the promise is fulfilled,
     * any active indicator is hidden.
     *
     * @method delayed
     * @static
     * @param {jQuery.Deferred} The active promise
     * @param [int] Time, in milliseconds, to wait until showing the
     * indicator. If not specified, a delay of one second is used.
     */
    self.delayed = function(promise, delay) {
        delay = delay || 1000;
        var timeout = setTimeout(function() {
            self.loading();
        }, delay);
        promise.always(function() {
            clearTimeout(timeout);
            self.hide();
        });
    };

    return self;

})();
