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
 * @module wv.date.timeline
 */
var wv = wv || {};
wv.date = wv.date || {};
wv.date.timeline = wv.date.timeline || {};

/**
 * Perform timeline data functions
 *
 * @class wv.date.timeline.data
 */
wv.date.timeline.data = wv.date.timeline.data || function(models, config, ui) {

    var tl = ui.timeline;

    var self = {};

    self.start = function(){
        return new Date( config.startDate );
    };

    self.end = function(){
        return new Date(
            new Date( wv.util.today() )
                .setUTCDate( wv.util.today()
                             .getUTCDate() + 1 ) );
    };
    self.set = function(){
        
    };
    var init = function(){
        tl.axisZoom
            .xExtent( [self.start(), self.end()] );
    };

    init();
    return self;
};
