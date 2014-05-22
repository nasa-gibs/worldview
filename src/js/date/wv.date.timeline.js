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
wv.date.timeline = wv.date.timeline || function(models, config) {



    var id = "timeline";
    var selector = "#" + id;
    var DAY_IN_MS = 24*60*60*1000;

    var sliderContent = [];
    var $container;
    var model = models.date;
    var svg;
    var timelineJumpInPix;
    var jumpInterval;
    var todayDateMs = model.selected.getTime();
    var startDateMs = model.start.getTime();
    var endDateMs = model.end.getTime();

    //this is where the data would go for showing available dates
    var data = [
        {
            "date": startDateMs,
            "value": "5"
        }, {
            "date": endDateMs,
                "value": "5"
        }
    ];
    //Current date line
    var data2 = [
        {
            "date": todayDateMs,
            "value": "0" 
        }, {
            "date": todayDateMs,
            "value": "6"
        }
    ];
    
    
    //margins for the timeline
    margin = {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        };
    
    //subtract the datepicker from the width of the screen
    width = window.innerWidth - $("#timeline header").outerWidth() - 30;
    height = 60 - margin.top - margin.bottom;
    var currentDate = new Date(data2[0].date);
    var dateTimestamp;
    var monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
    var self = {};
    
    var incrementBtn = $("#right-arrow-group");
    var decrementBtn = $("#left-arrow-group");
    var x = d3.time.scale()
            .domain([
                d3.min(data, function(d) { return d.date; }),
                d3.max(data, function(d) { return d.date; })
            ])
            .range([0, width]);
    
    var y = d3.scale.linear()
            .domain(d3.extent(data2, function (d) {
                return d.value;
            }))
            .range([height, 0]);
    
    var line = d3.svg.line()
            .x(function (d) {
                return x(d.date);
            })
            .y(function (d) {
                return y(d.value);
            });
    var redraw = function(){
        //resizing window redrawing goes here
        
        width = window.innerWidth - $("#timeline header").outerWidth() - 30;
        
        d3.select('#timeline footer svg')
            .attr('width', width + margin.left + margin.right);
            
        d3.select("rect.plot")
            .attr("width", width);
        d3.select("#clip")
            .attr("width", width);
            
        x.range([0, width]);
        
        d3.select(".axis").call(xAxis);
        d3.select(".grid").call(make_x_axis(x).tickSize(-60, 0, 0));
        d3.selectAll('.x.axis .tick text').attr('x',5).attr('style','text-anchor:left;');
        
        d3.select(".line").datum(data).attr("d", line);
        d3.select(".line2").datum(data2).attr("d", line);
        
        updateTimeline();
        
    };
    
    var zoomed = function(){
        var t = zoom.translate(),
        s = zoom.scale();

        tx = Math.min(0, Math.max(width * (1 - s), t[0]));
        ty = Math.min(0, Math.max(height * (1 - s), t[1]));

        zoom.translate([tx, ty]);

        svg.select(".x.axis").call(xAxis);

        svg.select(".x.grid")
            .call(make_x_axis(x)
            .tickSize(-60, 0, 0)
            .tickFormat(""));
        svg.select(".line")
            .attr("class", "line")
            .attr("d", line);
        svg.select(".line2")
            .attr("class", "line2")
            .attr("d", line);
            
        updateTimeline();
        
        if(($("svg#now-line").offset().left) < ($("#timeline footer").offset().left)){
            $("svg#now-line").css("visibility","hidden");

        }
        else{
            $("svg#now-line").css("visibility","visible");

        }
        d3.selectAll('.x.axis .tick text').attr('x',5).attr('style','text-anchor:left;');
        
        
    };
    
    var zoom = d3.behavior.zoom()
            .x(x)
            .scaleExtent([1, 100])
            .on("zoom", zoomed);
    
    var make_x_axis = function (x) {
        return d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .ticks(10);
    };

    var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .ticks(10);
            
    var init = function() {
        
        svg = d3.select('#timeline footer')
            .append("svg:svg")
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append("svg:g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .call(zoom);

        svg.append("svg:rect")
            .attr("width", width)
            .attr("height", 60)
            .attr("class", "plot");

        

        svg.append("svg:g")
            .attr("class", "x axis")
            .attr("transform", "translate(0, " + 35 + ")")
            .call(xAxis);

        

        svg.append("g")
            .attr("class", "x grid")
            .attr("transform", "translate(0," + 60 + ")")
            .call(make_x_axis(x)
                .tickSize(-60, 0, 0));

        var clip = svg.append("svg:clipPath")
            .attr("id", "clip")
            .append("svg:rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width)
            .attr("height", 60);

        var chartBody = svg.append("g")
            .attr("clip-path", "url(#clip)").attr("height", 60);

        chartBody.append("svg:path")
            .datum(data)
            .attr("class", "line")
            .attr("d", line);

        chartBody.append("svg:path")
            .datum(data2)
            .attr("class", "line2")
            .attr("d", line);
        
        updateTimeline();
        
        d3.selectAll('.x.axis .tick text').attr('x',5).attr('style','text-anchor:left;');
        
        // Hover line. 
        var hoverLineGroup = svg.append("g")
                            .attr("class", "hover-line");
        var hoverLine = hoverLineGroup
            .append("line")
                    .attr("x1", 10).attr("x2", 10)
                    .attr("y1", 0).attr("y2", height);

        var hoverDate = hoverLineGroup.append('text')
           .attr("class", "hover-text")
           .attr('y', height-40);
        
        // Hide hover line by default.
        hoverLineGroup.style("opacity", 1e-6);
        
        /****************************** TIMELINE LINES ************************************/
        
        d3.select("#timeline footer").on("mouseenter", function() { 
            $("#timeline-text").show();
            hoverLineGroup.style("opacity", 1);
        }).on("mousemove", function() {
          
            var mouse_x = d3.mouse(this)[0];
            var mouse_y = d3.mouse(this)[1];
            var graph_y = y.invert(mouse_y);
            var graph_x = x.invert(mouse_x);
            var format = d3.time.format('%e %b');
            //format.parse(graph_x)
            var stringDate = String(graph_x).split(' ');
            $("#timeline-text").text(stringDate[3] + " " + stringDate[1] + " " + stringDate[2]);
            hoverLine.attr("x1", mouse_x).attr("x2", mouse_x);
            if ((mouse_x > (x(data2[0].date)- 3)) && (mouse_x < (x(data2[0].date) + 6))){
                hoverLineGroup.style("opacity", 1e-6);
                $("#timeline-text").hide();
                $(".line2").css("stroke","#fff");
            }else {
                $("#timeline-text").show();
                hoverLineGroup.style("opacity", 1);
                $(".line2").css("stroke","transparent");
            }
            $("#timeline-text").css({"left": d3.event.pageX});
        }).on("mouseleave", function() {
            hoverLineGroup.style("opacity", 1e-6);
            $("#timeline-text").hide();

        }).on("click", function(){
            var mouse_x = d3.mouse(this)[0];
            data2[0].date = Date.parse(x.invert(mouse_x));
            data2[1].date = Date.parse(x.invert(mouse_x));
            svg.select(".line2")
                .attr("d", line);
            updateTimeline();
            currentDate = new Date(data2[0].date);
            updateTime();
            
            
        })/*.on("mousedown",function(){
            mouse_x_start = d3.mouse(this)[0];
            var mouse_x_jump = mouse_x_start + timelineJump;
            console.log("$$$$$$$$$$$$ ");
        })*/;
        $("svg#now-line").mousedown(function(e){
            e.preventDefault();
            
            d3.select("#timeline footer").on("mousemove", function(){
                var mouse_x = d3.mouse(this)[0];
                data2[0].date = Date.parse(x.invert(mouse_x));
                data2[1].date = Date.parse(x.invert(mouse_x));
                svg.select(".line2")
                    .attr("d", line);
                updateTimeline();
                currentDate = new Date(data2[0].date);
                updateTime();
                
                
            });
            }).mouseup(function(){
                d3.select("#timeline footer").on("mousemove", null);
                d3.select("#timeline footer").on("mousemove", function() {
          
                  var mouse_x = d3.mouse(this)[0];
                  var mouse_y = d3.mouse(this)[1];
                  var graph_y = y.invert(mouse_y);
                  var graph_x = x.invert(mouse_x);
                  var format = d3.time.format('%e %b');
                  //format.parse(graph_x)
                  var stringDate = String(graph_x).split(' ');
                  $("#timeline-text").text(stringDate[3] + " " + stringDate[1] + " " + stringDate[2]);
                  hoverLine.attr("x1", mouse_x).attr("x2", mouse_x);
                  if ((mouse_x > (x(data2[0].date)- 3)) && (mouse_x < (x(data2[0].date) + 6))){
                    hoverLineGroup.style("opacity", 1e-6);
                    $("#timeline-text").hide();
                    $(".line2").css("stroke","#fff");
                  }else {
                    $("#timeline-text").show();
                    hoverLineGroup.style("opacity", 1);
                    $(".line2").css("stroke","transparent");
                  }
                  $("#timeline-text").css({"left": d3.event.pageX});
                });
                
            });
        /**************************END TIMELINE LINES****************************/
        
        //bind click action to interval radio buttons
        var buttons = $('.button-input-group');
        buttons.click(function(e){
            buttons.removeClass('button-input-group-selected');
            $(this).addClass("button-input-group-selected");
            
            jumpInterval = $(this).attr('id');
            switch(jumpInterval){
                case 'year-input-group':
                    bindBtnsToYear();
                    break;
                case 'month-input-group':
                    bindBtnsToMonth();
                    break;
                case 'day-input-group':
                    bindBtnsToDay();
                    break;
                default:
                    alert("cannot find selected interval!");
                    break;
            }
            
            $(this).select();
            updateBarSpeed();
        });
        model.events.on("select", updateTime);
        updateTime();
        $('#day-input-group').addClass('button-input-group-selected');
        bindBtnsToDay();
        
    }; // /init
    
    var bindBtnsToYear = function(){
        incrementBtn.unbind();
        decrementBtn.unbind();
        incrementBtn.click(function(e){
            dateTimestamp = currentDate.setFullYear(currentDate.getFullYear()+1);
            data2[0].date = dateTimestamp;
            data2[1].date = dateTimestamp;
            model.select(new Date(dateTimestamp));
            updateTime();
        });
        decrementBtn.click(function(e){
            dateTimestamp = currentDate.setFullYear(currentDate.getFullYear()-1);
            data2[0].date = dateTimestamp;
            data2[1].date = dateTimestamp;
            model.select(new Date(dateTimestamp));
            updateTime();
        });
        
    };
    var bindBtnsToMonth = function(){
        incrementBtn.unbind();
        decrementBtn.unbind();
        incrementBtn.click(function(e){
            dateTimestamp = currentDate.setMonth(currentDate.getMonth()+1);
            data2[0].date = dateTimestamp;
            data2[1].date = dateTimestamp;
            model.select(new Date(dateTimestamp));
            updateTime();
        });
        decrementBtn.click(function(e){
            dateTimestamp = currentDate.setMonth(currentDate.getMonth()-1);
            data2[0].date = dateTimestamp;
            data2[1].date = dateTimestamp;
            model.select(new Date(dateTimestamp));
            updateTime();
        });
        
    };
    var bindBtnsToDay = function(){
        incrementBtn.unbind();
        decrementBtn.unbind();
        incrementBtn.click(function(e){
            dateTimestamp = currentDate.setDate(currentDate.getDate()+1);
            data2[0].date = dateTimestamp;
            data2[1].date = dateTimestamp;
            model.select(new Date(dateTimestamp));
            updateTime();
        });
        decrementBtn.click(function(e){
            dateTimestamp = currentDate.setDate(currentDate.getDate()-1);
            data2[0].date = dateTimestamp;
            data2[1].date = dateTimestamp;
            model.select(new Date(dateTimestamp));
            updateTime();
        });
    };

    var updateTimeline = function(){
            
            //update timeline line
            svg.select(".line2").attr("d", line);
            var makeFill = d3.select('.line2').attr("d");
            d3.select(".line2").attr("d", makeFill + "l3,0l0,60z");
            var makeFillPos = $(".line2").offset();
            $("svg#now-line").css("left", (makeFillPos.left-3) + "px");
            
    };
    
    var updateTime = function() {
        
        var changeMapDate = new Date(data2[0].date);
        model.select(changeMapDate);
        $('#year-input-group').val(changeMapDate.getFullYear());
        $('#month-input-group').val(monthNames[changeMapDate.getMonth()]);
        if (changeMapDate.getDate()<10){
            $('#day-input-group').val("0" + changeMapDate.getDate());
        }
        else {
            $('#day-input-group').val(changeMapDate.getDate());
        }
        
        currentDate = changeMapDate;
        updateTimeline();
        
    };
    
    var updateBarSpeed = function(){
        var currentElement = $(".button-input-group-selected").attr("id");
        var dateNow = new Date(data2[0].date);
        switch (currentElement)
        {
            case 'year-input-group':
                timelineJumpInPix = x(dateNow) - x( dateNow.setFullYear(dateNow.getFullYear() - 1) );
                console.log("YEAR!!!");
                break;
            case 'month-input-group':
                timelineJumpInPix = x(dateNow) - x( dateNow.setMonth(dateNow.getMonth() - 1) );
                break;
            case 'day-input-group':
                timelineJumpInPix = x(dateNow) - x( dateNow.setDate(dateNow.getDate() - 1) );
                break;
        }
        console.log("%%%%%%%%%%%%%%% " + timelineJumpInPix);
    };

    init();
    $(window).resize(redraw);

    return self;
};
