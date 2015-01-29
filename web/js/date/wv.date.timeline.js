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
 * Setup the timeline
 *
 * @class wv.date.timeline
 */
wv.date.timeline = wv.date.timeline || function(models, config, ui) {
    var self = {};

    self.margin = {
        top: 0,
        right: 30,
        bottom: 20,
        left: 30
    };

    self.getWidth = function(){
        self.width = $(window).outerWidth(true)
            - $("#timeline-header").outerWidth(true)
            - $("#timeline-zoom").outerWidth(true)
            - $("#timeline-hide").outerWidth(true)
            - self.margin.left - self.margin.right - 22;
        return self.width;
    };

    self.height = 65 - self.margin.top - self.margin.bottom;

    self.isCropped = true;

    self.toggle = function(){
        
    };

    self.expand = function(){
        
    };

    self.expandNow = function(){
        
    };
    var init = function(){
        
        drawContainers();

        self.x = d3.time.scale.utc();

        self.xAxis = d3.svg.axis()
            .orient("bottom")
            .tickSize(-self.height)
            .tickPadding(5);

        self.axisZoom = d3.behavior.zoom()
            .scale(1)
            .scaleExtent([1,1]);
    };

    init();
    return self;
};
