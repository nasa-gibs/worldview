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
 * @class wv.date.sliders
 */
wv.date.timeline = wv.date.timeline || function(models, config) {

    Element.prototype.hasClass = function (className) {
  return new RegExp('(\\s|^)' + className + '(\\s|$)').test(this.getAttribute('class'));
};

Element.prototype.addClass = function (className) {
  if (!this.hasClass(className)) {
    this.setAttribute('class', this.getAttribute('class') + ' ' + className);
  }
};

Element.prototype.removeClass = function (className) {
  var removedClass = this.getAttribute('class').replace(new RegExp('(\\s|^)' + className + '(\\s|$)', 'g'), '$2');
  if (this.hasClass(className)) {
    this.setAttribute('class', removedClass);
  }
};

Element.prototype.toggleClass = function (className) {
  if (this.hasClass(className)) {
    this.removeClass(className);
  } else {
    this.addClass(className);
  }
};

    var id = "timeline";
    var selector = "#" + id;
    var DAY_IN_MS = 24*60*60*1000;

    var sliderContent = [];
    var $container;
    var model = models.date;
    var svg;
    var todayDateMs = model.selected.getTime();
    var startDateMs = model.start.getTime();
    console.log("todays date is : " + todayDateMs + " and the start date is : " + model.start.getTime());
    //this is where the data would go for showing available dates
    var data = [
        {
            "date": startDateMs,
            "value": "5"
        }, {
            "date": todayDateMs,
                "value": "5"
        }
    ];
    //Current date line
    var data2 = [
        {
            "date": Date.now(),
            "value": "0"
        }, {
            "date": Date.now(),
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
    console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ = " + width);
    height = 60 - margin.top - margin.bottom;
    var currentDate = new Date(data2[0].date);
    var monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
    var self = {};
    
        
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
    
    var zoomed = function(){
        console.log("HERERERERERER###################");
        var t = zoom.translate(),
        s = zoom.scale();

        tx = Math.min(0, Math.max(width * (1 - s), t[0]));
        ty = Math.min(0, Math.max(height * (1 - s), t[1]));

        zoom.translate([tx, ty]);

        d3.event.translate;
        d3.event.scale;
        //console.log(d3.event.translate);
        //console.log(d3.event.scale);
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
        d3.selectAll('.x.axis .tick text').attr('x',5).attr('style','text-anchor:left;');
    };
    
    var zoom = d3.behavior.zoom()
            .x(x)
            .scaleExtent([1, 1500])
            .on("zoom", zoomed);
    
    var make_x_axis = function (x) {
        return d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .ticks(10);
    };

    var make_y_axis = function (y) {
        return d3.svg.axis()
            .scale(y)
            .orient("left")
            .ticks(5);
    };

    var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .ticks(10);
            
    var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .ticks(5);

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
            .tickSize(-60, 0, 0)
            .tickFormat(""));

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
        
        
        updateTime();

        
        // Add mouseover events.
        d3.select('#timeline footer').on("mouseover", function() { 
          //console.log('mouseover')
        }).on("mousemove", function() {
          //console.log('mousemove', d3.mouse(this));
          var mouse_x = d3.mouse(this)[0];
          var mouse_y = d3.mouse(this)[1];
          var graph_y = y.invert(mouse_y);
          var graph_x = x.invert(mouse_x);
          //console.log("########### " + x.invert(mouse_x) + "######## " + x(graph_x));
          var format = d3.time.format('%e %b');
          //format.parse(graph_x)
          var stringDate = String(graph_x).split(' ');
          hoverDate.text(stringDate[3] + " " + stringDate[1] + " " + stringDate[2]);
          hoverDate.attr('x', mouse_x + 5);
          hoverLine.attr("x1", mouse_x).attr("x2", mouse_x);
          hoverLineGroup.style("opacity", 1);
            
        }).on("mouseleave", function() {
            //console.log('mouseout');
            hoverLineGroup.style("opacity", 1e-6);

        }).on("click", function(){
            var mouse_x = d3.mouse(this)[0];
            data2[0].date = Date.parse(x.invert(mouse_x));
            data2[1].date = Date.parse(x.invert(mouse_x));
            svg.select(".line2")
                .attr("d", line);
            currentDate = new Date(data2[0].date);
            console.log("#################### Current date:  " + currentDate);
            updateTime();
        });
        
        
        //bind click action to interval radio buttons
        var buttons = document.getElementsByClassName('button-input-group');
        
        for (var i=0;i<buttons.length; i++) { //FIXME: Convert bindings and toggling to jquery
            buttons[i].onclick = function(){
                //console.log("click");
                for (var j=0;j<buttons.length;j++){
                    buttons[j].removeClass('button-input-group-selected');
                }
                
                this.toggleClass('button-input-group-selected');
                this.select();
            };
        }
        document.getElementById("right-arrow-group").onclick = increment_time;
        document.getElementById("left-arrow-group").onclick = decrement_time;
        document.querySelector('#day-input-group').addClass('button-input-group-selected');
        
        
        
    };

    self.collapse = function() {
        // Do the "opposite" since the toggle will swap states
        self.isCollapsed = false;
        toggle();
    };

    self.expand = function() {
        if ( !self.isCollapsed ) {
            return false;
        }
        // Do the "opposite" since the toggle will swap states
        self.isCollapsed = true;
        toggle();
    };

    var render = function() {
        
    };
    var updateTime = function() {
    
        var changeMapDate = new Date(data2[0].date);
        console.log(changeMapDate + " ####################");
        models.date.select(changeMapDate);
        document.querySelector('#year-input-group').value = currentDate.getFullYear();
        document.querySelector('#month-input-group').value = monthNames[currentDate.getMonth()];
        if (currentDate.getDate()<10){
            document.querySelector('#day-input-group').value = "0" + currentDate.getDate();
        }
        else {
            document.querySelector('#day-input-group').value = currentDate.getDate();
        }
        
    };
    
    //increments the time depending on which interval is selected and updates in timeline/datepicker
    var increment_time = function(){
        
        //bind interval radio buttons, find currently selected, increment it by 1
        var hoverDate = document.querySelectorAll(".button-input-group");
        for (var i=0;i<hoverDate.length;i++){
            if (hoverDate[i].hasClass("button-input-group-selected")){
                //var selectedInt = hoverDate[i].querySelector("tspan");

                var interval = hoverDate[i].getAttribute('id');
                console.log(hoverDate[i]);
                switch(interval){
                    case 'year-input-group':
                        newDate = currentDate.setFullYear(currentDate.getFullYear()+1);
                        break;
                    case 'month-input-group':
                        newDate = currentDate.setMonth(currentDate.getMonth()+1);
                        break;
                    case 'day-input-group':
                        newDate = currentDate.setDate(currentDate.getDate()+1);
                        break;
                    default:
                        break;
                } //switch
                data2[0].date = newDate;
                data2[1].date = newDate;
                var newTimeBar = x(new Date(data2[0].date));
                //update timeline line
                svg.select(".line2").attr("d", line);
                currentDate = new Date(data2[0].date);
                updateTime();

            }//if
        }//for
        
    };// end increment_time

    var decrement_time = function(){
        
        //bind interval radio buttons, find currently selected, increment it by 1
        var hoverDate = document.querySelectorAll(".button-input-group");
        for (var i=0;i<hoverDate.length;i++){
            if (hoverDate[i].hasClass("button-input-group-selected")){
                //var selectedInt = hoverDate[i].querySelector("tspan");

                var interval = hoverDate[i].getAttribute('id');
                switch(interval){
                    case 'year-input-group':
                        newDate = currentDate.setFullYear(currentDate.getFullYear()-1);
                        break;
                    case 'month-input-group':
                        newDate = currentDate.setMonth(currentDate.getMonth()-1);
                        break;
                    case 'day-input-group':
                        newDate = currentDate.setDate(currentDate.getDate()-1);
                        break;
                    default:
                        break;
                } //switch
                data2[0].date = newDate;
                data2[1].date = newDate;
                var newTimeBar = x(new Date(data2[0].date));
                //update timeline line
                svg.select(".line2").attr("d", line);
                currentDate = new Date(data2[0].date);
                updateTime();
            }//if
        }//for
        
        
    };//end decrement_time
    
    

    init();
    return self;
};
