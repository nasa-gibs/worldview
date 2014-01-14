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
wv.date.sliders = wv.date.sliders || function(models, config) {

    var id = "timeds";
    var selector = "#" + id;
    var SLIDER_WIDTH = 1000;
    var DAY_IN_MS = 24*60*60*1000;
    var sliders = {};
    var ranges = {};
    var months = [31,28,31,30,31,30,31,31,30,31,30,31];
    var sliderContent = [];
    var $container;
    var model = models.date;

    var self = {};
    self.isCollapsed = false;

    var init = function() {
        sliders.Year = [];
        var currentYear = wv.util.now().getUTCFullYear();
        sliders.Year = _.range(2000, currentYear + 1);
        sliders.Month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug',
                            'Sep','Oct','Nov','Dec'];
        sliders.Day = _.range(1, 31 + 1);

        $container = $(selector);
        render();

        model.events.on("select", function(date) {
            update();
        });
        model.events.on("range", function() {
            validate();
        });
        $(window).on("resize", refreshSliders);
        update();
    };

    var render = function() {
        if ( wv.util.browser.small ) {
            $("#timeds").css("display","none");
        }
        $container.addClass("datespan");

        var $ecbutton = $("<a></a>")
                .addClass("ecbutton")
                .addClass("collapse")
                .attr("id", id + "ecbutton");
        $container.append($ecbutton);

        createSlider("Year");
        createSlider("Month");
        createSlider("Day");

        $(selector + "ecbutton").on("click", toggle);
    };

    var createSlider = function(type) {
        var $slider = $("<div></div>")
                .attr("id", id + "sliderDiv" + type)
                .addClass("sliderDiv" + type)
                .addClass("slider");

        var $sliderInput = $("<input></input>")
                .attr("type", "range")
                .attr("name", "slider")
                .attr("id", id + "slider" + type)
                .addClass("dateSpanSlider")
                .attr("value", SLIDER_WIDTH)
                .attr("min", 0)
                .attr("max", SLIDER_WIDTH)
                .attr("step", 1);
        $slider.append($sliderInput);
        $container.append($slider);

        var width = 0;
        var wwidth = $(window).width() - 10;
        var labels = sliders[type];

        width = 50/labels.length;
        width = width.toFixed(1);
        var pwidth = width/100;
        var pwwidth = Math.floor(pwidth*wwidth);
        var spacer = 50/labels.length;
        spacer = spacer.toFixed(1);
        var pspacer = spacer/100;
        var pwspacer = Math.floor(wwidth*pspacer/2);
        var finalwidth = (pwwidth+pwspacer+pwspacer);

        var $label = $("<ul></ul>")
                .addClass("sliderLabel")
                .attr("id", id + "sliderLabel" + type);
        for ( var i = 0; i < labels.length; ++i ) {
            var $item = $("<li></li>")
                    .attr("id", id + type + "sliderItem" + i)
                    .html(labels[i])
                    .css("width", Math.floor(wwidth*pwidth) + "px")
                    .css("margin-left", Math.floor(wwidth*pspacer/2) + "px")
                    .css("margin-right", Math.floor(wwidth*pspacer/2) + "px");
            $label.append($item);
        }
        $container.append($label);

        var labelslength = labels.length;
        $('#' + id + 'slider' + type)
                .slider()
                .bind("change", { type: type }, handleSlide);
        var labelWidth = finalwidth * labels.length;
        $('#' + id + 'slider' + type)
                .siblings('.ui-slider')
                .css('width', labelWidth + "px");
        $('#' + id + 'slider' + type)
                .siblings('.ui-slider')
                .bind("vmouseup", { type:type }, snap);
        if ( width !== 0 ) {
            var handleWidth = (width * 1.1).toFixed(1);
            $('.sliderDiv'+type+' a.ui-slider-handle')
                    .css('width', handleWidth + "%");
        }
    };

    var refreshSlider = function(type) {
        var labels = sliders[type];
        var wwidth = $(window).width() - 10;

        var width = 50/labels.length;
        width = width.toFixed(1);
        var pwidth = width/100;
        var pwwidth = Math.floor(pwidth*wwidth);
        var spacer = 50/labels.length;
        spacer = spacer.toFixed(1);
        var pspacer = spacer/100;
        var pwspacer = Math.floor(wwidth*pspacer/2);
        var finalwidth = (pwwidth+pwspacer+pwspacer);
        $('#' + id + 'sliderLabel' + type)
            .children()
            .css('width', Math.floor(wwidth*pwidth) + "px");
        $('#' + id + 'sliderLabel' + type)
            .children()
            .css('margin-left', Math.floor(wwidth*pspacer/2) + "px");
        $('#' + id + 'sliderLabel' + type)
            .children()
            .css('margin-right', Math.floor(wwidth*pspacer/2) + "px");
        var handleWidth = finalwidth*labels.length;
        $('#' + id + 'slider' + type)
            .siblings('.ui-slider')
            .css('width', handleWidth + "px");
    };

    var resetting = {
        Year: false,
        Month: false,
        Day: false
    };
    var handleSlide = function(e, ui) {
        if ( !models.date.start || !models.date.end ) {
            return;
        }
        var value = e.target.value;
        var type = e.data.type;
        var oldDate = model.selected;
        var newDate = new Date(oldDate.getTime());
        var numitems = sliders[type].length;
        var displacement = Math.floor(value*(numitems/SLIDER_WIDTH));

        if ( sliders[type][displacement] && displacement >= ranges[type].min && displacement <= ranges[type].max ) {
            if ( type === "Year" ) {
                newDate.setUTCFullYear(sliders[type][displacement]);
            }
            else if ( type === "Month" ) {
                if ( oldDate.getUTCDate() > months[displacement]) {
                    newDate.setUTCDate(months[displacement]);
                }
                newDate.setUTCMonth(displacement);
            }
            else if ( type === "Day" ) {
                if ( sliders[type][displacement] <= months[oldDate.getUTCMonth()] ) {
                    newDate.setUTCDate(sliders[type][displacement]);
                }
            }
            model.select(newDate);
        } else {
            if ( !resetting[type] ) {
                resetting[type] = true;
                update();
                resetting[type] = false;
            }
        }
        validate();

    };

    var toggle = function(e, ui) {
        if ( self.isCollapsed ) {
            $('.ecbutton').removeClass('expand').addClass('collapse');
            $('.ecbutton').attr("title","Hide Date Slider");
            $(".horizontalContainer").css("width","100%");
            self.isCollapsed = false;
            showSliders();
        } else {
            $('.ecbutton').removeClass('collapse').addClass('expand');
            $('.ecbutton').attr("title","Show Date Slider");
            $(".horizontalContainer").css("width","auto");
            self.isCollapsed = true;
            hideSliders();
        }
    };

    var hideSliders = function() {
        for ( var i in sliders ) {
            $("#" + id + "sliderDiv" + i).css('display','none');
        }
        $('.sliderLabel').css("display","none");
    };

    var showSliders = function() {
        for ( var i in sliders ) {
            $("#" + id + "sliderDiv" + i).css('display','block');
        }
        $('.sliderLabel').css("display","block");
    };

    var update = function() {
        validate();
        var value = model.selected;
        var values = {};
        values.Year = sliders.Year.indexOf(value.getUTCFullYear());
        values.Month = value.getUTCMonth();
        values.Day = sliders.Day.indexOf(value.getUTCDate());

        _.each(values, function(x, type) {
            var numitems = sliders[type].length;
            var displacement = values[type];
            var width = SLIDER_WIDTH / numitems;
            var move = displacement * width + (width / 4) - (width * 0.05);
            move = move.toFixed(1);
            $("#" + id + "slider" + type).val(move).slider("refresh");
        });
    };

    var refreshSliders = function() {
        if ( wv.util.browser.small ) {
            $container.hide();
        } else {
            $container.show();
            setTimeout(function() {
                refreshSlider("Year");
                refreshSlider("Month");
                refreshSlider("Day");
            },100);
        }
    };

    var validate = function() {
        var curr = new Date(model.selected.getTime());
        var disabled = false;
        var startYear, startMonth, startDay, endYear, endMonth, endDay;
        if ( !models.date.start || !models.date.end ) {
            disabled = true;
        } else {
            startYear = models.date.start.getUTCFullYear();
            startMonth = models.date.start.getUTCMonth();
            startDay = models.date.start.getUTCDate();
            endYear = models.date.end.getUTCFullYear();
            endMonth = models.date.end.getUTCMonth();
            endDay = models.date.end.getUTCDate();
        }
        for ( var type in sliders ) {
            ranges[type] = { min: Number.MAX_VALUE, max: -Number.MAX_VALUE };
            for ( var i = 0; i < sliders[type].length; ++i ) {
                var descriptor = id + type + "sliderItem" + i;
                if ( type === "Year" ) {
                    var year = sliders[type][i];
                    if ( disabled || year < startYear || year > endYear) {
                        $("#" + descriptor).addClass("disabledItem");
                    }
                    else {
                        ranges[type].min = Math.min(ranges[type].min, i);
                        ranges[type].max = Math.max(ranges[type].max, i);
                        $("#" + descriptor).removeClass("disabledItem");
                    }
                }
                if ( type === "Month"){
                    if ( disabled || (curr.getUTCFullYear() == startYear && i < startMonth) || (curr.getUTCFullYear() == endYear && i > endMonth) ) {
                        $("#" + descriptor).addClass("disabledItem");
                    }
                    else {
                        ranges[type].min = Math.min(ranges[type].min, i);
                        ranges[type].max = Math.max(ranges[type].max, i);
                        $("#" + descriptor).removeClass("disabledItem");
                    }
                }
                if ( type === "Day" ) {
                    if( disabled || (sliders[type][i] > months[curr.getUTCMonth()]) || (curr.getUTCFullYear() == startYear && curr.getUTCMonth() == startMonth && sliders[type][i] < startDay) ||  (curr.getUTCFullYear() == endYear && curr.getUTCMonth() == endMonth && sliders[type][i] > endDay) ){
                        $("#" + descriptor).addClass("disabledItem");
                    }
                    else {
                        ranges[type].min = Math.min(ranges[type].min, i);
                        ranges[type].max = Math.max(ranges[type].max, i);
                        $("#" + descriptor).removeClass("disabledItem");
                    }
                }
            }
        }
    };

    var snap = function() {
        update();
    };

    init();
    return self;
};
