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
        //console.log('changing zoom!');
        //TODO: Below
        /*
        zoomLvl += -amount;
        if ( zoomLvl < 0 ) {
            zoomLvl = 0;
        }
        if ( zoomLvl > 2 ) {
            zoomLvl = 2;
        }

        setZoom.call(this, zoomLvl, event);
        */
    };

    self.drawTicks = function(count, max, aEnd, w, i, s, f){
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

        wv.ui.mouse.wheel(tl.axisZoom, ui).change(self.change);

        tl.svg.call(tl.axisZoom);

        tl.pan.toSelection();

        //??need to remove first?
        tl.axis.selectAll('.tick').remove();

        tl.axis.call(tl.xAxis);
        
    };

    var init = function(){
        
        //self.level3();
    };

    init();
    return self;
};
