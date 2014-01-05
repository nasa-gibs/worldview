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
 * @class wv.date.label
 */
wv.date.label = wv.date.label || function(models) {

    var id = "timedsdateHolder";
    var $container = $("#" + id);
    var model = models.date;

    var self = {};

    var init = function() {
        model.events.on("select", update);
        update();
    };

    var update = function() {
        $container.html(wv.util.toISOStringDate(model.selected));
    };

    init();
    return self;
};

