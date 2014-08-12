
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
 * @class wv.date.timeline
 */
wv.date.timeline = wv.date.timeline || function(models, config, ui) {

    var id = "timeline";
    var selector = "#" + id;
    var DAY_IN_MS = 24*60*60*1000;
    var $container;
    var model = models.date;
    var selectedDateMs = model.selected.getTime();
    var startDateMs = ( model.start ) ? model.start.getTime() : undefined;
    var endDateMs = ( model.end ) ? model.end.getTime() : undefined;
    var jumpInterval, selectedDateObj, x,y,line,zoom,xAxis, yAxis, timeline, data2;
    var zoomLvl = 2;
    var zoomInterval = d3.time.month.utc;
    var zoomStep = 1;
    var subInterval = d3.time.day.utc;
    var subStep = 1;
    var zoomScale,axisBgWidth,subAxisBgWidth,smallTicks;
    var margin = {
            top: 0,
            right: 0,
            bottom: 35,
            left: 10
        };

    //subtract the datepicker from the width of the screen
    var width = window.innerWidth - $("#timeline-header").outerWidth() - 60 -50;
    var height = 85 - margin.top - margin.bottom;

    var monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
    var self = {};
    self.NAME = "TEST NAME";
    // TODO: Prefix names with $ to indicate they are jQuery objects
    var incrementBtn = $("#right-arrow-group");
    var decrementBtn = $("#left-arrow-group");

    var throttleSelect = _.throttle(function(date) {
        model.select(date);
    }, 100, { trailing: true });

    var selection = d3.svg.line()
        .x(function(d){
            return x(d.x);
        })
        .y(function(d){
            return y(d.y);
        });
    var setData = function(){
        data2 = [
            {
                "x": model.selected.getTime(),
                "y": "0" 
            },
            {
                "x": model.selected.getTime(),
                "y": "6"
            }
        ];
        x = d3.time.scale.utc()
            .domain([new Date(1800,0,1), new Date(2200,0,1)])

            //.nice(d3.time.year)
            .range([-2000, 3600]);
        /* FIXME: Fix this to be ordinal in place of linear
        y = d3.scale.ordinal()
            .domain(["Data1","Data2","Data3"]) //loaded product data goes here
            .rangeBands([0,height]);
        */
        y = d3.scale.linear()
            .domain([0,6])
            .range([0,height]);

        xAxis = d3.svg.axis()
            .scale(x)
            //.tickValues(model.start,model.end)
            .orient("bottom")

            //.tickFormat(d3.time.format.multi([["%b %Y", function(d) { return d.getUTCMonth(); }], ["%b %Y", function() { return true; }]]));
            .tickFormat(customTimeFormat2);
        
        yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");
    
        zoom = d3.behavior.zoom()
            .x(x)
            .scale(170)
            //.translate([-700,0])
            .scaleExtent([1, 3070]) //FIXME: fix scale
            .on("zoom", zoomable, d3.event);
        zoomScale = 1;
    };

    var redrawAxis = function(interval, step){
        timeline.select(".x.axis").call(xAxis.ticks(0));

        if (interval) { 
            zoomInterval = interval; 
            zoomStep = step;
        }
        timeline.select(".x.axis")
            .call(xAxis.tickSize(-height)
                  .tickPadding(10)
                  .ticks(zoomInterval,zoomStep));

        var ticks = timeline.selectAll('.x.axis>.tick');

        ticks.insert("svg:circle","text").attr("r","6");

        setAxisBgWidth();
        ticks.insert("svg:rect", "circle")
            .attr("x","0")
            .attr("y","0")
            .attr("width",axisBgWidth)
            .attr("height",height)
            .attr("class","axis-background");
        
        ticks.selectAll("line")
            .attr("y1",-height)
            .attr("y2",margin.bottom);


        //Draw sub axes for smaller intervals, each tick has date attached
        //FIXME: Optimize, probably dont need to redraw
        for (i=0;i<ticks.data().length-1;i++){

            var tickDate = ticks.data()[i];
            var nextTickDate = ticks.data()[i+1];

            var x2 = d3.time.scale.utc()
                .domain([tickDate,nextTickDate])
                .range([0,x(nextTickDate)-x(tickDate)]);

            var xSmallAxis = d3.svg.axis()
                .scale(x2);

            var smallAxis = timeline.select('.x.axis>.tick:nth-child('+ (i+2) + ')').insert("svg:g","line")
                .attr("class", "subtick")
                .attr("transform", "translate(0,"+ -height +")")
                .call(xSmallAxis.tickSize(height-1).ticks(subInterval,subStep));
            smallAxis.selectAll("text").remove();

            var smallAxisTicks = smallAxis.selectAll('g.subtick > .tick');

            //get background width from one subtick to the next FIXME: probably can be condensed
            var subTickBgWidth =  x(timeline.select('.x.axis > g.tick:nth-child('+(i+2)+') > g.subtick > g.tick:nth-child(2)').data()[0]) -
                    x(timeline.select('.x.axis > g.tick:nth-child('+(i+2)+') > g.subtick > g.tick:nth-child(1)').data()[0]);


            //draw background (rect) for each subtick
            for (j=1;j<smallAxisTicks.data().length;j++){
                timeline.select('.x.axis > g.tick:nth-child('+(i+2)+') > g.subtick > g.tick:nth-child('+j+')').append("svg:rect")
                    .attr("class","subtick-background")
                    .attr("height",height-1)
                    .attr("width",subTickBgWidth);
            }
        }


        
        timeline.select(".selection")
            .attr("d",selection);
        
        d3.selectAll('.x.axis>.tick text')
            .attr('x',5)
            .attr()
            .attr('style','text-anchor:left;');


    };
    
    var updateTime = function() {
        $('#year-input-group').val(model.selected.getUTCFullYear());
        $('#month-input-group').val(monthNames[model.selected.getUTCMonth()]);
        if (model.selected.getUTCDate()<10){
            $('#day-input-group').val("0" + model.selected.getUTCDate());
        }
        else {
            $('#day-input-group').val(model.selected.getUTCDate());
        }
        // Don't grab focus to allow arrow keys to work

        //$('.button-input-group-selected').select();
        //data2[0].date = model.selected.getTime();
        //data2[1].date = data2[0].date;

    };

    var resizeWindow = function(){
        width = window.innerWidth - $("#timeline-header").outerWidth() - 60 -50;
        d3.select('#timeline-footer svg')
            .attr('width', width + margin.left + margin.right);
        timeline.select(".x.axis line:first-child").attr("x2",width);
        //redrawAxis();
    };

    var init = function() {
        setData(); //x,y,xAxis,yAxis,zoom
        incrementBtn
            .mousedown(function() {
                animateForward("day");
            })
            .mouseup(animateEnd);
        decrementBtn
            .mousedown(function() {
                animateReverse("day");
            })
            .mouseup(animateEnd);
        $(document)
            .keydown(function(event) {
                if ( event.target.nodeName === "INPUT" ) {
                    return;
                }
                switch ( event.keyCode ) {
                    case wv.util.key.LEFT:
                        animateReverse("day");
                        event.preventDefault();
                        break;
                    case wv.util.key.RIGHT:
                        animateForward("day");
                        event.preventDefault();
                        break;
                    case wv.util.key.UP:
                        animateForward("month");
                        event.preventDefault();
                        break;
                    case wv.util.key.DOWN:
                        animateReverse("month");
                        event.preventDefault();
                        break;
                }
            })
            .keyup(function(event) {
                if ( event.target.nodeName === "INPUT" ) {
                    return;
                }
                switch ( event.keyCode ) { 
                    case wv.util.key.LEFT:
                    case wv.util.key.RIGHT:
                    case wv.util.key.UP:
                    case wv.util.key.DOWN:
                        animateEnd();
                        event.preventDefault();
                        break;
                }
            });
        
        timeline = d3.select('#timeline-footer')
            .append("svg:svg")
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .call(zoom)
            .append("svg:g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        zoom.translate([width/2 - x(model.selected),0]);

        timeline.append("svg:g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis.tickSize(-height).tickPadding(10).ticks(zoomInterval,zoomStep))
            .insert("line",":first-child")
                .attr("x1",0)
                .attr("x2",width);

        var ticks = timeline.selectAll('.x.axis>.tick');

        ticks.insert("svg:circle","text").attr("r","6");
        
        setAxisBgWidth();
        
        ticks.insert("svg:rect", "text")
            .attr("x","0")
            .attr("y","0")
            .attr("width",axisBgWidth)
            .attr("height",height)
            .attr("class","axis-background");

        ticks.selectAll("line:first-child")
            .attr("y1",-height)
            .attr("y2",margin.bottom);

        //Draw sub axes for smaller intervals, each tick has date attached
        for (i=0;i<ticks.data().length-1;i++){

            var tickDate = ticks.data()[i];
            var nextTickDate = ticks.data()[i+1];

            var x2 = d3.time.scale.utc()
                .domain([tickDate,nextTickDate])
                .range([0,x(nextTickDate)-x(tickDate)]);

            var xSmallAxis = d3.svg.axis()
                .scale(x2);

            var smallAxis = timeline.select('.x.axis>.tick:nth-child('+ (i+2) + ')').insert("svg:g","line")
                .attr("class", "subtick")
                .attr("transform", "translate(0,"+ -height +")")
                .call(xSmallAxis.tickSize(height-1).ticks(subInterval,subStep));
            smallAxis.selectAll("text").remove();

            var smallAxisTicks = smallAxis.selectAll('g.subtick > .tick');

            //get background width from one subtick to the next FIXME: probably can be condensed
            var subTickBgWidth =  x(timeline.select('.x.axis > g.tick:nth-child('+(i+2)+') > g.subtick > g.tick:nth-child(2)').data()[0]) -
                    x(timeline.select('.x.axis > g.tick:nth-child('+(i+2)+') > g.subtick > g.tick:nth-child(1)').data()[0]);


            //draw background (rect) for each subtick
            for (j=1;j<smallAxisTicks.data().length;j++){
                timeline.select('.x.axis > g.tick:nth-child('+(i+2)+') > g.subtick > g.tick:nth-child('+j+')').append("svg:rect")
                    .attr("class","subtick-background")
                    .attr("height",height-1)
                    .attr("width",subTickBgWidth);
            }
        }
/* FIXME:  Garbage I might want to keep until the end, in case I need to reference something I did earlier
/*            ticks.append("svg:g")
                .attr("class", "subtick")
                .attr("transform","translate(" + xPos  + ",0)")
                .append("svg:rect")
                    .attr("class","subtick-background")
                    .attr("height",height)
                    .attr("width",subAxisBgWidth)
                    .attr("y",-height)
                    .attr("x",0);
            xPos += subAxisBgWidth;
*/


            //ticks.data[0];

//            ticks.append("svg:g")
//                .attr('class','subtick');
        
    // }
        /* I'm probably working too hard for this below.  Going to try another method
        var xPos = 0;
        for (var i=0; i<10;i++){
            ticks.append("svg:g")
                .attr("class", "subtick")
                .attr("transform","translate(" + xPos  + ",0)")
                .append("svg:rect")
                    .attr("class","subtick-background")
                    .attr("height",height)
                    .attr("width",subAxisBgWidth)
                    .attr("y",-height)
                    .attr("x",0);
            xPos += subAxisBgWidth;
            
        }
        //FIXME: remove line from all first subticks

        timeline.selectAll('.x.axis .subtick')
            .append("svg:line")
                .attr("class","subtick-border")
                .attr("y1",-height)
                .attr("y2","-1");
        //console.log($(".subtick:first-child"));        
        d3.selectAll('.subtick:nth-child(5) .subtick-border').remove();        
        ticks.selectAll("line:first-child")
            .attr("y1",-height)
            .attr("y2",margin.bottom);

//        timeline.selectAll(".subtick:first-child line").remove();
*/
        verticalAxis = timeline.append("svg:g")
            .attr("class", "y axis")
            .attr("transform", "translate(0,0)")
            .call(yAxis);

        verticalAxis.selectAll("text").remove();

        timeline.select(".x.axis").append("svg:path")
            .datum(data2)
            .attr("class", "selection")
            .attr("d", selection);
                
        d3.selectAll('.x.axis>.tick text').attr('x',5).attr().attr('style','text-anchor:left;');

        //bind click action to interval radio buttons
        var buttons = $('.button-input-group');
        buttons.on('focus',function(e){
            buttons.removeClass('button-input-group-selected');
            $(this).addClass('button-input-group-selected');
            $(this).select();
        });

        model.events.on("select", function(){
            updateTime();
        });
        models.layers.events.on("change",function(){
            if(model.start && model.start.getTime() !== startDateMs){
                startDateMs = model.start.getTime();
                setData();            
            }
        });

        $("#focus-guard-1").on('focus',function(){
           $("#day-input-group").focus().select(); 
        });
        $("#focus-guard-2").on('focus',function(){
           $("#year-input-group").focus().select(); 
        });
        
        updateTime();
        $('#day-input-group').addClass('button-input-group-selected');
        $('#day-input-group').select();
        $('.button-input-group').change(function(){
            if($(this).hasClass('button-input-group-selected')){
                var selected = $(".button-input-group-selected");
                var YMDInterval = selected.attr('id');
                var newInput = selected.val();
                switch(YMDInterval){
                    case 'year-input-group':
                        selectedDateObj = new Date((new Date(model.selected)).setUTCFullYear(newInput));
                        model.select(selectedDateObj);
                        break;
                    case 'month-input-group':
                        for(var i=0;i<monthNames.length;i++){
                            if(newInput===monthNames[i] || (newInput==i+1) || (newInput===("0"+(i+1)))){
                               selectedDateObj = new Date((new Date(model.selected)).setUTCMonth(i));
                               model.select(selectedDateObj);
                            }
                        }
                        break;
                    case 'day-input-group':
                        if(newInput>0 && newInput<=(new Date(model.selected.getYear(),model.selected.getMonth()+1,0).getDate())){
                            selectedDateObj = new Date((new Date(model.selected)).setUTCDate(newInput));
                            try {
                                model.select(selectedDateObj);
                             }
                            catch(e){
                             //TODO: error catching
                             }
                        }
                        else{
                            //TODO: notice to user goes here
                        }
                        break;
                }
            }        
        });

        $("#day-input-group").blur();

        $("#zoom-decades").on("click",function(e){
            zoomLevels(0);
        });
        $("#zoom-years").on("click",function(e){
            zoomLevels(1);
        }); 
        $("#zoom-months").on("click",function(e){
            zoomLevels(2);
        }); 
        $("#zoom-days").on("click",function(e){
            zoomLevels(3);
        });

    }; // /init
    var zoomLevels = function(interval){
        //console.log(interval);
        zoomLvl = interval;
        switch(zoomLvl){
            case 'decades':
            case 0:
            zoomInterval = d3.time.year.utc;
            subInterval = d3.time.year.utc;
            subStep = 1;
            zoomStep = 10;
            zoomScale = 1;
            break;
            case 'years':
            case 1:
            zoomInterval = d3.time.year.utc;
            subInterval = d3.time.month.utc;
            subStep = 1;
            zoomStep = 1;
            zoomScale = 10;
            break;
            case 'months':
            case 2:
            zoomInterval = d3.time.month.utc;
            subInterval = d3.time.day.utc;
            subStep = 1;
            zoomStep = 1;
            zoomScale = 170;
            break;
            case 'days':
            case 3:
            zoomInterval = d3.time.day.utc;
            subInterval = d3.time.hour.utc;
            subStep = 1;
            zoomStep = 1;
            zoomScale = 3070;
            break;
            default:
            console.log("went to default");
            zoomInterval = d3.time.year.utc;
            subInterval = d3.time.year.utc;
            subStep = 1;
            zoomStep = 10;
            zoomScale = 1;
        }
        zoom.scale(zoomScale);
        zoom.translate([0,0]);
        zoom.translate([-x(model.selected)+width/2,0]);

        redrawAxis(zoomInterval,zoomStep);

    };
    var setAxisBgWidth = function(){
        var axisYear = model.selected.getUTCFullYear();
        var axisMonth = model.selected.getUTCMonth();
        var axisDate = model.selected.getUTCDate();
        var axisHours = model.selected.getUTCHours();
        switch (zoomLvl){
            case 0:
            axisBgWidth = x(new Date(axisYear+10,axisMonth,axisDate)) -
                x(new Date(axisYear,axisMonth,axisDate));
            subAxisBgWidth = x(new Date(axisYear+1,axisMonth,axisDate)) -
                x(new Date(axisYear,axisMonth,axisDate));
            break;
            case 1:
            axisBgWidth = x(new Date(axisYear+1,axisMonth,axisDate)) -
                x(new Date(axisYear,axisMonth,axisDate));
            subAxisBgWidth = x(new Date(axisYear,axisMonth+1,axisDate)) - 
                x(new Date(axisYear,axisMonth,axisDate));
            break;
            case 2:
            axisBgWidth = x(new Date(axisYear,axisMonth+1,axisDate)) -
                x(new Date(axisYear,axisMonth,axisDate));
            subAxisBgWidth = x(new Date(axisYear,axisMonth,axisDate+1)) - 
                x(new Date(axisYear,axisMonth,axisDate));
            break;
            case 3:
            axisBgWidth = x(new Date(axisYear,axisMonth,axisDate+1)) -
                x(new Date(axisYear,axisMonth,axisDate));
            subAxisBgWidth = x(new Date(axisYear,axisMonth,axisDate,axisHours+1)) -
                x(new Date(axisYear,axisMonth,axisDate,axisHours));
            break;
        }
    };
    var setSmallAxisTickNumbers = function(ticks,i){

        switch (zoomLvl){
            case 0:
            smallTickWidth = ticks.data()[i+1] - ticks.data()[i]/1000/60/60/24/365;
            break;
            case 1:
            smallTickWidth = Math.floor((ticks.data()[i+1].getTime() - ticks.data()[i].getTime())/1000/60/60/24/30);
            break;
            case 2:
            smallTickWidth = Math.floor((ticks.data()[i+1].getTime() - ticks.data()[i].getTime())/1000/60/60/24);            
            break;
            case 3:
            smallTickWidth = Math.floor((ticks.data()[i+1].getTime() - ticks.data()[i].getTime())/1000/60/60);
            break;
            
            default:
            
            break;
        }
//        console.log("Date: " + ticks.data()[i].toUTCString() + ", days to next interval: " + Math.floor(answer/1000/60/60/24));


    }
    var customTimeFormat2 = d3.time.format.utc.multi([
        [".%L", function(d) { return d.getUTCMilliseconds(); }],
        [":%S", function(d) { return d.getUTCSeconds(); }],
        ["%I:%M", function(d) { return d.getUTCMinutes(); }],
        ["%I %p", function(d) { return d.getUTCHours(); }],
        //["%a %d", function(d) { return d.getUTCDay() && d.getDate() != 1; }],
        ["%d %b", function(d) { return d.getUTCDate() != 1; }],
        ["%b %Y", function(d) { return d.getUTCMonth(); }],
        ["%Y", function(d) { return true; }],
    ]);

    var animateForward = function(interval) {
        if ( ui.anim.active ) {
            return;
        }
        models.date.add(interval, 1);
        ui.anim.interval = interval;
        ui.anim.play("forward");
    };
    
    var animateReverse = function(interval) {
        if ( ui.anim.active ) {
            return;
        }
        models.date.add(interval, -1);
        ui.anim.interval = interval;
        ui.anim.play("reverse");
    };
    
    var animateEnd = function() {
        ui.anim.stop();
    };
    
    var zoomable = function(e){

        console.log(d3.event.sourceEvent);
        //redrawAxis();
        var evt = window.event || d3.event.sourceEvent || e;
        var deltaY=evt.deltaY ? evt.deltaY : evt.wheelDeltaY || evt.detail ? evt.detail*(-120) : evt.wheelDelta;
        var deltaX=evt.deltaX ? evt.deltaY : evt.wheelDeltaX;
        if (deltaY < 0){
            //console.log("Up");
            if (zoomLvl < 3){
                zoomLvl++;
                zoomLevels(zoomLvl);
            }
        }
        else if (deltaY > 0){
            //console.log("Down")
            if (zoomLvl > 0){
                zoomLvl--;
                zoomLevels(zoomLvl);
            }
        }
        else{
            redrawAxis();
        }
    };
    self.test = "TESTING VAR";
    init();
    $(window).resize(resizeWindow);

    return self;
};
