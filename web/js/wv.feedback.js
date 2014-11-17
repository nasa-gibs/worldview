/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2014 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 *
 * Licensed under the NASA Open Source Agreement, Version 1.3
 * http://opensource.gsfc.nasa.gov/nosa.php
 */

var wv = wv || {};
wv.feedback = wv.feedback || (function() {

    var self = {};
    var feedbackInit = false;

    self.decorate = function($element) {
        $element
            .attr("href", "mailto:@MAIL@?subject=Feedback for @LONG_NAME@ tool")
            .attr("target", "_blank");

        $element.click(function(event) {
            if ( !wv.util.browser.small && window.feedback ) {
                event.preventDefault();
                if ( !feedbackInit ) {
                    feedback.init({showIcon: false});
                }
                feedback.showForm();
                feedbackInit = true;
            }
        });
    };

    return self;

})();
