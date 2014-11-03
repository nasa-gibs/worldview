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

    var id = "timewheels";
    var $container = $("#" + id);
    var MSEC_TO_MIN = 1000*60;
    var model = models.date;

    var self = {};
    self.enabled = false;
    self.startDate = null;
    self.endDate = null;

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
            .html("<div id='wv-date-mobile-label'></div><input type='hidden' id='linkmode' readonly>");

        $("#linkmode").mobiscroll().date({
            display: "bottom",
            onChange: function(valueText) {
                var d = wv.util.parseDateUTC(valueText);
                model.select(d);
            },
            onShow: function(){
                $("#wv-date-mobile-label").css("display","none");
            },
            onClose: function(){
                $("#wv-date-mobile-label").css("display","block");
            },
            dateFormat: 'yyyy-mm-dd',
            setText: 'OK'
        });
        $("#linkmode").mobiscroll('setDate', UTCToLocal(model.selected),true);
        $("#wv-date-mobile-label").click(function(e) {
            $("#linkmode").mobiscroll("show");
        });
    };

    var UTCToLocal = function(d) {
        var timezoneOffset = d.getTimezoneOffset() * MSEC_TO_MIN;
        return new Date(d.getTime() + timezoneOffset);
    };

    var resize = function() {
        if ( !self.enabled && wv.util.browser.small ) {
            console.log("wheels", "***** enable");
            self.enabled = true;
            $container.show();
        } else if ( self.enabled && !wv.util.browser.small ) {
            console.log("wheels", "***** disable");
            self.enabled = false;
            $container.hide();
        }
        console.log("wheels state", self.enabled);
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
        $("#wv-date-mobile-label").html(wv.util.toISOStringDate(model.selected));
        $("#linkmode").mobiscroll('setDate', UTCToLocal(model.selected), true);
    };

    init();
    return self;
};
