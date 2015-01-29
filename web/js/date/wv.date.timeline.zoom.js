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
 * Perform timeline zooming functions
 *
 * @class wv.date.timeline.zoom
 */
wv.date.timeline.zoom = wv.date.timeline.zoom || function(models, config, ui) {

    var tl = ui.timeline;

    var self = {};

    self.level1 = function(){
        
    };
    self.level2 = function(){
        
    };
    self.level3 = function(){
        var altEnd,
            fNormData,
            labelFormat = d3.time.format.utc("%b"),
            dateInterval = d3.time.day.utc,
            dateStep = 1,
            tickCount = (tl.data.end() - tl.data.start())/1000/60/60/24,
            tickCountMax,
            tickWidth = 11;

        tickCountMax = Math.ceil(tl.width/tickWidth);

        altEnd = new Date(tl.data.start().getUTCFullYear(),
                          tl.data.start().getUTCMonth(),
                          tl.data.start().getUTCDate() + tickCountMax);

        drawTicks(tickCount,
                  tickCountMax,
                  altEnd,
                  tickWidth,
                  dateInterval,
                  dateStep,
                  labelFormat);

        tl.ticks.refresh('day','month');

    };

    var drawTicks = function(count, max, aEnd, w, i, s, f){
        var d1 = tl.data.start(),
            d2,
            r1 = (tl.width/2)-((count*w)/2),
            r2 = (tl.width/2)+((count*w)/2);

        if (max > count){
            tl.isCropped = false;
            d2 = tl.data.end();
            r1 = (tl.width/2)-((count*w)/2);
            r2 = (tl.width/2)+((count*w)/2);
        }
        else{
            tl.isCropped = true;
            d2 = aEnd;
            r1 = 0;
            r2 = tl.width;
        }

        //console.log(tl.isCropped + ' ' + d1 + ' ' + d2 + ' ' + r1 + ' ' + r2);
        update(d1, d2, r1, r2, i, s, f);
    };

    var update = function(d1, d2, r1, r2, i, s, f){

        tl.x.domain([d1,d2])
            .range([r1,r2]);

        tl.xAxis.scale(tl.x)
            .ticks(i, s)
            .tickFormat(f);

        tl.axisZoom
            .x(tl.x);

        tl.svg.call(tl.axisZoom);

        //??need to remove first?
        tl.boundary.select(".x.axis")
            .call(tl.xAxis);

    };

    var init = function(){
               
        
        self.level3();
    };

    init();
    return self;
};
