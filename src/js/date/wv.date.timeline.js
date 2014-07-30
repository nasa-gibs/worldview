
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
    var zoomLevels = function(){
        
    };
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

            //for Decades:
            .domain([new Date(1800,0,1), new Date(2200,0,1)])

            //for Years:
            //.domain([new Date(1970,0,1), new Date(2020,0,1)])
            
            //for Months:
            //.domain([new Date(2000,0,1), new Date(2014,12,31)])

            //.nice(d3.time.year)
            .range([-2000, 3600]);
        /* FIXME: Fix this to be ordinal in place of linear
        y = d3.scale.ordinal()
            .domain(["Data1","Data2","Data3"]) //loaded product data goes here
            .rangeBands([0,height]);
        */
        y = d3.scale.linear()
            .domain([0,6])
            .range([-height,0]);

        xAxis = d3.svg.axis()
            .scale(x)
            //.tickValues(model.start,model.end)
            .orient("bottom")

            //for Decades
            .ticks(d3.time.year.utc,10)

            //for Years
            //.ticks(d3.time.year.utc,1)
            
            //for Months
            //.ticks(d3.time.month.utc,1)
            
            //for Days
            //.ticks(d3.time.day.utc,1)
            
            //.tickFormat(d3.time.format.multi([["%b %Y", function(d) { return d.getUTCMonth(); }], ["%b %Y", function() { return true; }]]));
            .tickFormat(customTimeFormat2);
        yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");
    
        zoom = d3.behavior.zoom()
            .x(x)
            //for Decades
            .scale(1)
            
            //for Years
            //.scale(10)

            //for Months
            //.scale(170)

            //for Days
            //.scale(3070)

            //.translate()
            //.scaleExtent([1, 100]) //FIXME: fix scale
            .on("zoom", zoomable, d3.event);
        
    };

    var redrawAxis = function(){
        timeline.select(".x.axis").call(xAxis.tickSize(-height).tickPadding(10));


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
        //.call(zoom);

        timeline.append("svg:g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis.tickSize(-height).tickPadding(10))
            .insert("line",":first-child")
                .attr("x1",0)
                .attr("x2",width);

        var ticks = timeline.selectAll('.x.axis .tick');

        ticks.insert("svg:circle","text").attr("r","6");

        ticks.insert("svg:rect", "circle")
            .attr("x","0")
            .attr("y","0")
            .attr("width","130")
            .attr("height",height);
        
        ticks.selectAll("line")
            .attr("y1",-height)
            .attr("y2",margin.bottom);

        timeline.append("svg:g")
            .attr("class", "y axis")
            .attr("transform", "translate(0,0)")
            .call(yAxis);
        
        timeline.select(".x.axis").append("svg:path")
            .datum(data2)
            .attr("class", "selection")
            .attr("d", selection);
                
        d3.selectAll('.x.axis .tick text').attr('x',5).attr().attr('style','text-anchor:left;');
        console.log("#######################################");
        console.log(d3.event);
        console.log(timeline);
        console.log(d3.select("#timeline-footer svg"));

        
        //bind click action to interval radio buttons
        var buttons = $('.button-input-group');
        buttons.on('focus',function(e){
            buttons.removeClass('button-input-group-selected');
            $(this).addClass('button-input-group-selected');
            /*
            jumpInterval = $(this).attr('id');
            switch(jumpInterval){
                case 'year-input-group':
                    buttonInterval = "year";
                    break;
                case 'month-input-group':
                    buttonInterval = "month";
                    break;
                case 'day-input-group':
                    buttonInterval = "day";
                    break;
                default:
                    alert("cannot find selected interval!");
                    break;
            }
            */
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
/*
        $(".zoom-btn").on("click",function(){
            console.log("test click");
            //zoom.scale(100);
            console.log(zoom.scale());
            zoom.scale(40);
            
        });
  */      
    }; // /init

    var customTimeFormat2 = d3.time.format.utc.multi([
        [".%L", function(d) { return d.getUTCMilliseconds(); }],
        [":%S", function(d) { return d.getUTCSeconds(); }],
        ["%I:%M", function(d) { return d.getUTCMinutes(); }],
        ["%I %p", function(d) { return d.getUTCHours(); }],
        //["%a %d", function(d) { return d.getUTCDay() && d.getDate() != 1; }],
        ["%d", function(d) { return d.getUTCDate() != 1; }],
        ["%Y %b", function(d) { return d.getUTCMonth(); }],
        ["%Y %b", function(d) { return true; }],
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
        console.log(zoom.scale());
        //console.log(d3.behavior.zoom());
        console.log(x.domain());
        console.log(x.range());
        console.log("###################");
        console.log(x.ticks());
        var tempVal;
        var sliderVal = parseInt($("#timeline-zoom input").val());

        var evt = window.event || d3.event.sourceEvent || e;
        var deltaY=evt.deltaY ? evt.deltaY : evt.wheelDeltaY || evt.detail ? evt.detail*(-120) : evt.wheelDelta;
        var deltaX=evt.deltaX ? evt.deltaY : evt.wheelDeltaX;
        if (deltaY < 0){
            //console.log("Up");
            tempVal = sliderVal + 1;
        }
        else{
            //console.log("Down")
            tempVal = sliderVal - 1;
        }
        if ((tempVal >= 0) && (tempVal <= 4)){
            $("#timeline-zoom input").val(tempVal).trigger("input");
        }
        else
            return;
    };
    self.test = "TESTING VAR";
    init();
    $(window).resize(resizeWindow);

    return self;
};
