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
    self.error = function() {
        console.error.apply(console, arguments);

        if ( window.YAHOO && window.YAHOO.widget &&
                window.YAHOO.widget.Panel ) {
            o = new YAHOO.widget.Panel("WVerror", {
                width: "300px",
                zIndex: 1020,
                visible: false,
                constraintoviewport: true
            });
            o.setHeader('Error');
            o.setBody("An unexpected error has occurred.<br/><br/>" +
                "Please reload the page and try again. If you " +
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

    /**
     * Displays a message to the end user in a dialog box.
     *
     * @method notify
     * @static
     *
     * @param {string} The message to display to the user.
     *
     * @param [title="Notice"] {string} Title for the dialog box.
     */
    self.notify = function(message, title) {
        var width = "300px";
        if ( window.YAHOO && window.YAHOO.widget &&
                window.YAHOO.widget.Panel ) {
            o = new YAHOO.widget.Panel("WVerror", {
                width: width,
                zIndex: 1020,
                visible: false,
                constraintoviewport: true
            });
            title = title || "Notice";
            o.setHeader(title);
            o.setBody(message);
            o.render(document.body);
            o.show();
            o.center();
            o.hideEvent.subscribe(function(i) {
                setTimeout(function() {o.destroy();}, 25);
            });
        }
    };

    /**
     * Asks the end user a yes or no question in a dialog box.
     *
     * @method ask
     * @static
     *
     * @param [spec.header="Notice"] {string} Header text to be displayed in
     * the dialog box.
     *
     * @param [spec.message="Are you sure?"] {string} Message text to be
     * displayed in the dialog box.
     *
     * @param [spec.okButton="OK"] {string} Text to be used in the no button.
     *
     * @param [spec.cancelButton="Cancel"] {string} Text to be used in the yes
     * button.
     *
     * @param [spec.onOk] {function} Function to execute when the OK button is
     * pressed. If not specified, the dialog box simply closes.
     *
     * @parma [spec.onCancel] {function} Function to execute when the Cancel
     * button is pressed. If not specified, the dialog box simply closes.
     */
    self.ask = function(spec) {
        var dialog = new YAHOO.widget.SimpleDialog("dialog", {
            width: "20em",
            effect: {
                effect: YAHOO.widget.ContainerEffect.FADE,
                duration: 0.25
            },
            fixedcenter: true,
            modal: true,
            visible: false,
            draggable: false
        });

        var header = spec.header || "Notice";
        dialog.setHeader(header);
        dialog.setBody(spec.message || "Are you sure?");

        var handleOk = function() {
            try {
                this.hide();
                if ( spec.onOk) {
                    spec.onOk();
                }
            } catch ( error ) {
                wv.util.error(error);
            }
        };
        var handleCancel = function() {
            try {
                this.hide();
                if ( spec.onCancel ) {
                    spec.onCancel();
                }
            } catch ( error ) {
                wv.util.error(error);
            }
        };

        var buttons = [
            { text: spec.cancelButton || "Cancel", handler: handleCancel },
            { text: spec.okButton || "OK", handler: handleOk }
        ];
        dialog.cfg.queueProperty("buttons", buttons);
        dialog.render(document.body);
        dialog.show();
    };

    /**
     * Displays a message to the end user that the feature is not supported
     * in this web browser.
     *
     * @method unsupported
     * @static
     *
     * @param {String} [featureName] If specified, the message will state
     * "The <featureName> feature is not supported...". Otherwise  it will
     * state "This feature..."
     */
    self.unsupported = function(featureName) {
        var prefix;
        if ( !featureName ) {
            prefix = "This feature";
        } else {
            prefix = "The " + featureName + " feature";
        }
        wv.ui.notify(prefix + " is not supported with your web " +
                "browser. Upgrade or try again in a different browser.");
    };

    return self;

})(wv.ui = wv.ui || {});