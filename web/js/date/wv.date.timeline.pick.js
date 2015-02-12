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
 * Implements the timeline pick
 *
 * @class wv.date.timeline.pick
 */
wv.date.timeline.pick = wv.date.timeline.pick || function(models, config, ui) {

    var tl = ui.timeline;
    var model = models.date;

    var self = {};

    var width = 60;
    var offset = tl.x(model.selected) - width/2;

    var mousedown = false;
    var nextChange, prevChange;
    var tipDate;

    //FIXME: Optimize a lot, this is terrible
    var dragmove = function(d){
        var tempPickOffset = Math.max( -(width / 2),
                                       Math.min( tl.width - (width / 2), d3.event.x ) );
        var tempPickTipOffset = tempPickOffset + (width / 2);
        var tempPickTipDate = tl.x.invert(tempPickTipOffset);

        if( d3.event.dx > 0 ) {
            if( nextChange === undefined ) {
                updateChanges(tempPickTipDate);
            }
            else if( ( tempPickTipDate >= nextChange ) &&
                     ( nextChange <= tl.data.end() ) &&
                     ( nextChange > tl.data.start() ) )
            {
                offset = tl.x(nextChange) - width / 2;
                tipDate = nextChange;
                change.call(this);
                updateChanges(tempPickTipDate);
            }
            else if( nextChange > tl.data.end() ) {
                tipDate = new Date( Date.UTC( tl.data.end().getUTCFullYear(),
                                              model.selected.getUTCMonth(),
                                              model.selected.getUTCDate() ) );
                offset = tl.x(pickTipDate) - width / 2;
                change.call(this);
                updateChanges(tempPickTipDate);
            }
            else if( nextChange < tl.data.start() ) {
                nextChange = new Date( Date.UTC( tl.data.start().getUTCFullYear(),
                                                 model.selected.getUTCMonth(),
                                                 model.selected.getUTCDate() ) );
            }
        }
        else if( d3.event.dx < 0 ) {
            if( prevChange === undefined ){
                updateChanges(tempPickTipDate);
            }
            else if( ( tempPickTipDate <= prevChange ) &&
                     ( prevChange >= tl.data.start() ) &&
                     ( prevChange < tl.data.end() ) )
            {
                offset = tl.x(prevChange) - width / 2;
                tipDate = prevChange;
                change.call(this);
                updateChanges(tempPickTipDate);
            }
            else {
                updateChanges(tempPickTipDate);
            }
        }
    };

    var drag = d3.behavior.drag()
        .origin(function(d) { return d; })
        .on("dragstart", function(){
            mousedown = true;
            d3.event.sourceEvent.preventDefault();
            d3.event.sourceEvent.stopPropagation();
            tl.guitarPick.classed('pick-clicked',true);
        })
        .on("drag", dragmove)
        .on("dragend",function(){
            mousedown = false;
            prevChange = undefined;
            nextChange = undefined;
            tl.guitarPick.classed('pick-clicked',false);
        });

    var change = function(){
        var d;
        var newDate = tipDate;
        var tick, tickBg;
        
        d3.select(this)
            .attr("transform", 'translate('+ offset +','+ 0 +')');

        tl.guitarPick
            .data([{x: offset, y:0}])
            .call(drag);

        model.select(newDate);

        tl.zoom.current.pick.hoverTick(newDate);

        tickBg = tl.zoom.current.pick.hoveredTick
            .select('rect.normaltick-background')[0][0];

        d = d3.select(tl.zoom.current.pick.hoveredTick[0][0]).data()[0];

        tl.ticks.label.remove();
        tl.ticks.normal.hover.call(tickBg,d);

    };

    var updateChanges = function(d){
        prevChange = tl.zoom.current.pick.prevChange(d);
        nextChange = tl.zoom.current.pick.nextChange(d);
    };

    var init = function(){
        //Draw the pick
        tl.guitarPick = tl.svg
            .append("svg:g")
            .data( [{ x: offset, y: 0 }] )
            .attr("id","guitarpick")
            .attr("style","clip-path:url(#guitarpick-boundary);")
            .attr("transform","translate(" + offset + ",0)")
            .call(drag);

        tl.guitarPick.append("svg:path")
            .attr("d", "M 7.3151,0.7426 C 3.5507,0.7426 0.5,3.7926 0.5,7.5553 l 0,21.2724 14.6038,15.7112 14.6039,15.7111 14.6038,-15.7111 14.6037,-15.7112 0,-21.2724 c 0,-3.7627 -3.051,-6.8127 -6.8151,-6.8127 l -44.785,0 z");
        tl.guitarPick.append("svg:rect")
            .attr("width","4")
            .attr("height","20")
            .attr("x","21")
            .attr("y","11");
        tl.guitarPick.append("svg:rect")
            .attr("width","4")
            .attr("height","20")
            .attr("x","28")
            .attr("y","11");
        tl.guitarPick.append("svg:rect")
            .attr("width","4")
            .attr("height","20")
            .attr("x","35")
            .attr("y","11");

    };

    init();
    return self;
};
