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
 * @module wv.date
 */
var wv = wv || {};
wv.date = wv.date || {};

/**
 * Undocumented.
 *
 * @class wv.date.wheels
 */
wv.date.wheels = wv.date.wheels || function(models, config) {

    var id = "timemds";
    var $container = $("#" + id);
    var MSEC_TO_MIN = 1000*60;
    var model = models.date;

    var self = {};
    self.startDate = new Date(Date.UTC(2012, 4, 8));
    self.endDate = wv.util.today();
    self.isCollapsed = false;

    var init = function() {
        render();
        model.events.on("select", update);
        $(window).on("resize", resize);
        update();
        resize();
    };

    var render = function() {
        $container
            .addClass("datespan")
            .html("<input name='linkmode' id='linkmode' />");

        $("#linkmode").mobiscroll().date({
            display: "bottom",
            onChange: function(valueText) {
                var d = wv.util.parseDateUTC(valueText);
                model.select(d);
            },
            onShow: function(){
                $("#linkmode").css("display","none");
            },
            onClose: function(){
                $("#linkmode").css("display","block");
            },
            dateFormat: 'yyyy-mm-dd',
            minDate: UTCToLocal(self.startDate),
            maxDate: UTCToLocal(self.endDate),
            setText: 'OK'
        });
        $("#linkmode").mobiscroll('setDate', UTCToLocal(model.selected),true);
    };

    var UTCToLocal = function(d) {
        var timezoneOffset = d.getTimezoneOffset() * MSEC_TO_MIN;
        return new Date(d.getTime() + timezoneOffset);
    };

    var resize = function() {
        if ( wv.util.browser.small ) {
            $container.show();
        } else {
            $container.hide();
        }
    };

    var update = function() {
        $("#linkmode").mobiscroll('setDate', UTCToLocal(model.selected), true);
    };

    init();
    return self;
};
