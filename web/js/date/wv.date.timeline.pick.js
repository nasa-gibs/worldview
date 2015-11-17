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
    var ANIM_OUTOFBOUNDS = 5, ANIM_OFFSET = 8, POS2DATE_OFFSET = 10, animDragOffset;

    var mousedown = false;
    var nextChange, prevChange;
    var tipDate;

    //FIXME: Optimize a lot, this is terrible
    var dragmove = function(){
        if(ui.anim.doAnimation) //stop animation
            ui.anim.stop();

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
                self.offset = tl.x(nextChange) - width / 2;
                tipDate = nextChange;
                change.call(this);
                updateChanges(tempPickTipDate);
            }
            else if( nextChange > tl.data.end() ) {
                tipDate = new Date( Date.UTC( tl.data.end().getUTCFullYear(),
                                              model.selected.getUTCMonth(),
                                              model.selected.getUTCDate() ) );
                self.offset = tl.x(tipDate) - width / 2;
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
                self.offset = tl.x(prevChange) - width / 2;
                tipDate = prevChange;
                change.call(this);
                updateChanges(tempPickTipDate);
            }
            else {
                updateChanges(tempPickTipDate);
            }
        }
    };

    //TODO:Snapping, and below day zoom level, picker can't reach today's date (not a offset issue)
    //Listener function when a animation datepicker moves
    var animdrag = function() {
        //Get zoom level and set drag offset for choosing date
        switch(tl.config.currentZoom) {
            case 1: //years
                animDragOffset = 0;
                POS2DATE_OFFSET = 20;
                break;
            case 2: //months
                animDragOffset = 0;
                POS2DATE_OFFSET = 20;
                break;
            default: //3, days
                animDragOffset = 12;
                POS2DATE_OFFSET = 10;
        }

        //Here we have access to information in the d3.event object
        //Use it to acquire the date
        var tempPickTipOffset = Math.max( 0, Math.min( tl.width, d3.event.x ) );
        var tempPickOffset = tempPickTipOffset - POS2DATE_OFFSET; //we want the x coordinate of left corner
        var tempPickTipDate = tl.x.invert(tempPickTipOffset); //date chosen should match tip area

        //Check for future date, if so don't move the pickers past timeline
        var today = new Date();
        if(tempPickTipDate.valueOf() < today.valueOf()) {
            tempPickTipDate = wv.util.clearTimeUTC(tempPickTipDate);//set it to midnight
            //It is offset by one so change date so slider is dragged in the middle
            tempPickTipDate.setUTCDate(tempPickTipDate.getUTCDate() + 1);

            //HACK: Due to weird Date object behaviour, we need to set fromDate and toDate one day back
            if (d3.select(this).attr("id") === d3.select("#fromPick").attr("id")) { //compare their ids
                tl.input.fromDate = new Date(tempPickTipDate);
                tl.input.fromDate.setUTCDate(tl.input.fromDate.getUTCDate() - 1);
                $("#from").datepicker("setDate", tempPickTipDate);
            } else {
                tl.input.toDate = new Date(tempPickTipDate);
                tl.input.toDate.setUTCDate(tl.input.toDate.getUTCDate() - 1);
                $("#to").datepicker("setDate", tempPickTipDate);
            }

            //update position of selected date picker. animDragOffset (5) needed to put in right position
            d3.select(this).attr("transform", "translate(" + (tempPickOffset - animDragOffset) + " 20)");
            updateChanges(tempPickTipDate);
            model.events.trigger("change"); //update animation state on URL
        }
    };

    //Handling drag gestures with the guitarpick
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

    //Handling drag gestures with the animation date pickers
    var animDrag = d3.behavior.drag()
        .on("dragstart", function() {
            mousedown = true;
            d3.event.sourceEvent.preventDefault();
            d3.event.sourceEvent.stopPropagation();
        })
        .on("drag", animdrag)
        .on("dragend", function() {
            mousedown = false;
            prevChange = undefined;
            nextChange = undefined;
        });

    var change = function(){
        var d;
        var newDate = tipDate;
        var tickBg;

        tl.guitarPick
            .attr("transform", 'translate('+ self.offset +','+ 0 +')');

        tl.guitarPick
            .data([{x: self.offset, y:0}])
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

    // Pan the timeline if the pick is dragged off the side
    // or if the date input goes outside of the shown range
    self.shiftView = function(){
        var zt = tl.pan.xPosition;
        if( tl.x( model.selected ) >= ( tl.width - 15 ) ) {
            if ( mousedown ) {
                tl.axisZoom.translate( [zt - tl.x( model.selected ) +
                                        ( tl.width - 15), 0] );
            }
            else {
                tl.axisZoom.translate( [zt - tl.x( model.selected ) +
                                        ( tl.width / 8 ) * 7, 0] );
            }
            tl.pan.xPosition = tl.axisZoom.translate()[0];
            tl.pan.axis();
        }
        else if( tl.x( model.selected ) < 15 ) {
            if ( mousedown ){
                tl.axisZoom.translate( [zt - tl.x( model.selected ) + 15, 0] );
            }
            else{
                tl.axisZoom.translate( [zt - tl.x( model.selected ) +
                                        tl.width / 8, 0] );
            }

            tl.pan.xPosition = tl.axisZoom.translate()[0];
            tl.pan.axis();
        }
        $('#guitarpick').show();
    };

    // Hide/show pick if it goes off/on the timeline
    self.checkLocation = function(){
        if ( ( self.offset - width / 2 ) >=
             ( tl.width - tl.margin.left - tl.margin.right ) ||
             ( self.offset <= -30 ) )
        {
            $('#guitarpick').hide();
        }
        else{
            $('#guitarpick').show();
        }
    };

    self.checkAnimPickers = function() {
        //get positions of datepickers and check if there are outside the
        var fromPos = tl.x(tl.input.fromDate), toPos = tl.x(tl.input.toDate);
        if(fromPos >= ( tl.width + ANIM_OUTOFBOUNDS ) || fromPos <= 0)
            $('#fromPick').hide();
        else
            $('#fromPick').show();

        if(toPos >= ( tl.width + ANIM_OUTOFBOUNDS ) || toPos <= 0)
            $('#toPick').hide();
        else
            $('#toPick').show();
    };

    // Simple update the position of the pick
    self.update = function(){

        if ( mousedown === false ) {
            self.offset = tl.x(model.selected) - width/2;
        }

        tl.guitarPick
            .data( [{ x: self.offset, y: 0 }] )
            .attr("transform","translate(" + self.offset + ",0)")
            .call(drag);

        prevChange = undefined;
        nextChange = undefined;
    };

    //Given a date, returns a transform string to translate a date picker
    //we want to move the picker to the correct x position
    self.updateAnimPickers = function(date) {
        if(tl.config) //need to check because this function runs at startup
            switch(tl.config.currentZoom) { //offset corrects the positioning
                case 1: //year
                    ANIM_OFFSET = 10;
                    break;
                case 2: //month
                    ANIM_OFFSET = 10;
                    break;
                default: //day
                    ANIM_OFFSET = 8;
                    break;
            }

        var xVal = (tl.x(date) - width/2) + ANIM_OFFSET;
        return "translate(" + xVal + " 20)";
    };

    var init = function(){

        //Draw the pick
        tl.guitarPick = tl.svg
            .append("svg:g")
            .attr("id","guitarpick")
            .attr("style","clip-path:url(#guitarpick-boundary);");

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

        //stop guitarpick if mouseup anywhere on document
        d3.select(document).on("mouseup",function(){
            if (mousedown){
                mousedown = false;
                tl.guitarPick.classed('pick-clicked',false);
                tl.ticks.label.remove();
            }
        });
    };

    self.turnOnDrag = function() {
        //register drag behaviour with the date pickers here to guarantee it is called
        d3.select("#fromPick").call(animDrag);
        d3.select("#toPick").call(animDrag);
    };

    //Create animation pickers and translate them
    //Translation must be applied to a selected SVG path (underlying path in animPick1/2)
    var animPicks = function() {
        tl.animPick1 = tl.svg
            .append("svg:svg")
            .attr("class","animpick");

        tl.animPick2 = tl.svg
            .append("svg:svg")
            .attr("class","animpick");

        //Default positions for pickers set at ui.timeline.config.init()
        tl.animPick1.append("svg:path")
            .attr("id", "fromPick")
            .attr("d", "M0 0 L40 0 L20 40 Z")
            .attr("style","fill:rgb(0,255,0)");

        tl.animPick2.append("svg:path")
            .attr("id", "toPick")
            .attr("d", "M0 0 L40 0 L20 40 Z")
            .attr("style","fill:rgb(255,0,0)");

        self.turnOnDrag();
        $(".animpick").hide();
    };

    init();
    animPicks();
    return self;
};
