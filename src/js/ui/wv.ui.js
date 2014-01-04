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

/**
 * UI utilities
 *
 * @class wv.ui
 * @static
 */
wv.ui = (function(self) {

    /**
     * General error handler.
     *
     * Displays a dialog box with the error message. If an exception object
     * is passed in, its contents will be printed to the console.
     *
     * @method error
     * @static
     *
     * @param {string} message Message to display to the end user.
     * @param {exception} cause The exception object that caused the error
     */
    self.error = function(message, cause) {
        if ( cause ) {
            console.error(cause);
        } else {
            console.error(message);
        }

        if ( window.YAHOO && window.YAHOO.widget &&
                window.YAHOO.widget.Panel ) {
            o = new YAHOO.widget.Panel("WVerror", {
                width: "300px",
                zIndex: 1020,
                visible: false,
                constraintoviewport: true
            });
            o.setHeader('Warning');
            o.setBody("An unexpected error has occurred.<br/><br/>" + message +
                "<br/><br/>Please reload the page and try again. If you " +
                "continue to have problems, contact us at " +
                "<a href='mailto:support@earthdata.nasa.gov'>" +
                "support@earthdata.nasa.gov</a>");
            o.render(document.body);
            o.show();
            o.center();
            o.hideEvent.subscribe(function(i) {
                setTimeout(function() {o.destroy();}, 25);
            });
        }
    };

    return self;

})(wv.ui || {});