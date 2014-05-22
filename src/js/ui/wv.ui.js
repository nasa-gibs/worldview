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

        self.notify(
            "<div class='error-header'>" +
            "<i class='error-icon fa fa-exclamation-triangle fa-3x'></i>" +
            "An unexpected error has occurred" +
            "</div>" +
            "<div class='error-body'>Please reload the page and try " +
            "again. If you continue to have problems, contact us at " +
            "<a href='mailto:@MAIL@'>" +
            "@MAIL@</a>" +
            "</div>", "Error"
        );
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
        var $dialog = self.getDialog();
        title = title || "Notice";
        $dialog.html(message).dialog({
            title: title,
            show: { effect: "fade" },
            hide: { effect: "fade" },
            width: 300,
            minHeight: 1,
            height: "auto"
        });
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
        var $dialog = self.getDialog("wv-dialog-ask");
        var cancelText = spec.cancelButton || "Cancel";
        var okText = spec.okButton || "OK";
        var buttons = {};
        buttons[cancelText] = function() {
            $(this).dialog("close");
            if ( spec.onCancel ) { spec.onCancel(); }
        };
        buttons[okText] = function() {
            $(this).dialog("close");
            if ( spec.onOk ) { spec.onOk(); }
        };
        $dialog.dialog({
            title: spec.header || "Notice",
            resizable: false,
            modal: true,
            buttons: buttons
        }).html(spec.message)
        .on("dialogclose", function() {
            if ( spec.onCancel ) { spec.onCancel(); }
        });
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

    self.getDialog = function(marker) {
        marker = marker || "wv-dialog";
        var selector = "." + marker;
        var $dialog = $(selector);
        if ( $dialog.length !== 0 ) {
            if ( $dialog.dialog ) {
                $dialog.dialog("close");
            }
            $dialog.remove();
        }
        $dialog = $("<div></div>").addClass(marker);
        $("body").append($dialog);
        return $dialog;
    };

    self.closeDialog = function(marker) {
        marker = marker || "wv-dialog";
        var selector = "." + marker;
        var $dialog = $(selector);
        if ( $dialog.length !== 0 ) {
            if ( $dialog.dialog ) {
                $dialog.dialog("close");
            }
        }
    };

    return self;

})(wv.ui = wv.ui || {});
