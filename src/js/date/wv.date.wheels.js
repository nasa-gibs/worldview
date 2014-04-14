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
    self.startDate = null;
    self.endDate = null;
    self.isCollapsed = false;

    var init = function() {
        render();
        model.events.on("select", update);
        models.layers.events.on("change", updateRange);
        $(window).on("resize", resize);
        updateRange();
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
            setText: 'OK'
        });
        $("#linkmode").mobiscroll('setDate', UTCToLocal(model.selected),true);
    };

    var UTCToLocal = function(d) {
        var timezoneOffset = d.getTimezoneOffset() * MSEC_TO_MIN;
        return new Date(d.getTime() + timezoneOffset);
    };

    var resize = function() {
        /*
        if ( wv.util.browser.small ) {
            $container.show();
        } else {
            $container.hide();
        }
        */
       $container.show();
    };

    var updateRange = function() {
        var range = models.layers.dateRange();
        if ( !range ) {
            self.startDate = null;
            self.endDate = null;
            $("#linkmode").mobiscroll("option", "disabled", true);
            return;
        }
        self.startDate = range.start;
        self.endDate = range.end;
        $("#linkmode").mobiscroll("option", "disabled", false);
        $("#linkmode").mobiscroll("option", "minDate", UTCToLocal(self.startDate));
        $("#linkmode").mobiscroll("option", "maxDate", UTCToLocal(self.endDate));
    };

    var update = function() {
        $("#linkmode").mobiscroll('setDate', UTCToLocal(model.selected), true);
    };

    init();
    return self;
};
