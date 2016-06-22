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
    var model = models.date;

    var self = {};

    self.current = {
        ticks: {
            //Placeholders
            boundary: {
                
            },
            normal: {
                
            },
        },
        pick: {
            //Placeholder
        }
    };

    self.change = function(amount, event) {

        var zoom = tl.config.currentZoom;

        zoom += -amount;
        if ( zoom < 1 ) {
            zoom = 1;
        }
        if ( zoom > 3 ) {
            zoom = 3;
        }

        tl.config.zoom.call(this, zoom, event);

    };

    self.drawTicks = function(count, max, aEnd, w, i, s, f, e, p){
        var mouseOffset, mousePos;

        if(e){
            var relX = e.clientX - $('#timeline-footer').offset().left;
            mousePos = tl.x.invert(relX);
            mouseOffset = (tl.width-tl.margin.left-tl.margin.right)/2 - relX;
        }

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

        tl.x.domain([d1,d2])
            .range([r1,r2]);

        tl.xAxis.scale(tl.x)
            .ticks(i, s)
            .tickFormat(f);

        tl.axisZoom = d3.behavior.zoom()
            .scale(1)
            .scaleExtent([1,1])
            .x(tl.x);

        if(tl.isCropped){
            tl.axisZoom.xExtent(p);
        }
        else{
            tl.axisZoom.xExtent([tl.data.start(),tl.data.end()]);
        }

        wv.ui.mouse.wheel(tl.axisZoom, ui).change(self.change);

        tl.svg.call(tl.axisZoom);

        if(e){
            tl.pan.toCursor(mousePos, mouseOffset);
        } else {
            tl.pan.toSelection();
        }

        tl.axis.selectAll('.tick').remove();

        tl.axis.call(tl.xAxis);

    };

    self.refresh = function(){
        tl.config.zoom(tl.config.currentZoom);
    };

    var init = function(){
        
    };

    init();
    return self;
};
