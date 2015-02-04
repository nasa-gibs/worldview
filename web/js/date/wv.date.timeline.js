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
        self.width = $(window).outerWidth(true) -
             $("#timeline-header").outerWidth(true) -
             $("#timeline-zoom").outerWidth(true) -
             $("#timeline-hide").outerWidth(true) -
             self.margin.left - self.margin.right - 22;
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

    self.collapse = function(){
        
    };

    var drawContainers = function(){
        self.getWidth();

        self.svg = d3.select('#timeline-footer')
            .append("svg:svg")
            .attr('width', self.width)// + margin.left + margin.right)
            .attr('height', self.height + self.margin.top + self.margin.bottom + 16);

        self.svg
            .append("svg:defs")
            .append("svg:clipPath")
            .attr("id","timeline-boundary")
            .append("svg:rect")
            .attr('width', self.width)// + margin.left + margin.right)
            .attr('height', self.height + self.margin.top + self.margin.bottom);

        d3.select("#timeline-footer svg defs")
            .append("svg:clipPath")
            .attr("id","guitarpick-boundary")
            .append("svg:rect")
            .attr('width', self.width + self.margin.left + self.margin.right)// + margin.left + margin.right)
            .attr('height', self.height + self.margin.top + self.margin.bottom)
            .attr("x",-self.margin.left);

        self.boundary = d3.select("#timeline-footer svg")
            .append("svg:g")
            .attr("clip-path","#timeline-boundary")
            .attr("style","clip-path:url(#timeline-boundary)")
            .attr("transform","translate(0,16)");

        self.axis = self.boundary.append("svg:g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + self.height + ")");

        self.axis
            .insert("line",":first-child")
            .attr("x1",0)
            .attr("x2",self.width);//+margin.left+margin.right);
        
        self.dataBars = self.boundary.insert("svg:g",'.x.axis')
            .attr("height",self.height)
            .classed('plot',true);

        self.verticalAxis = self.boundary.append("svg:g")
            .attr("class", "y axis")
            .attr("transform", "translate(0,0)");

        self.guitarPick = d3.select("#timeline-footer svg")
            .append("svg:g")
            .attr("id","guitarpick")
            .attr("style","clip-path:url(#guitarpick-boundary);");

        self.guitarPick.append("svg:rect")
            .attr("width","4")
            .attr("height","20")
            .attr("x","21")
            .attr("y","11");
        self.guitarPick.append("svg:rect")
            .attr("width","4")
            .attr("height","20")
            .attr("x","28")
            .attr("y","11");
        self.guitarPick.append("svg:rect")
            .attr("width","4")
            .attr("height","20")
            .attr("x","35")
            .attr("y","11");
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
