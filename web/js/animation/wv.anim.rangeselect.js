/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2016 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 *
 * Licensed under the NASA Open Source Agreement, Version 1.3
 * http://opensource.gsfc.nasa.gov/nosa.php
 */
var wv = wv || {};

wv.anim = wv.anim || {};

wv.anim.rangeselect = wv.anim.rangeselect || function(models, config, ui) {
    var self = {};
    var model;
    var timeline = ui.timeline;
    var widgetOptions = ui.anim.options;
    var rangeSelectionFactory = React.createFactory(Animate.RangeSelector); 
    var $mountLocation = $('#wv-rangeselector-case')[0];
    var reactGlobal = {};
    var $footer =  $('#timeline-footer');

    ui.anim.rangeOptions = ui.anim.rangeOptions || {};

    self.init = function() {
        var startLocation;
        var EndLocation;
        var pick = d3.select('#guitarpick');
        var pickWidth = pick.node().getBoundingClientRect().width;
        var animEndLocation = (d3.transform(pick.attr("transform")).translate[0] - (pickWidth / 2)); // getting guitar pick location
        var ticHeight = $('.end-tick').height();
        var $animateButton = $('#animate-button');
        var options;

        model = models.anim || {};
        model.rangeState = model.rangeState || {};
        model.rangeState.state = model.rangeState.state || 'off';

        if(model.rangeState.startDate) {
            startLocation = self.getLocationFromStringDate(model.rangeState.startDate);
            endLocation = self.getLocationFromStringDate(model.rangeState.endDate);
        } else {
            startLocation = animEndLocation - 100;
            endLocation = animEndLocation;
            self.updateRange(startLocation, endLocation);
        }

        self.options = {
            startLocation: startLocation, // or zero
            endLocation: endLocation,
            max: self.getMaxWidth(),
            startColor: '#40a9db',
            endColor: '#295f92',
            rangeColor: '#45bdff',
            rangeOpacity: 0.3,
            pinWidth: 5,
            height: 45,
            onDrag: self.updateRange,
            onRangeClick: self.onRangeClick
        };
        model.events.on('timeline-change', self.update);
        model.events.on('change', self.update);
      self.render(self.options);
    };
    self.render = function(options) {
        self.reactComponent = ReactDOM.render(rangeSelectionFactory(options), $mountLocation);
    };
    self.getLocationFromStringDate = function(date) {
        return timeline.x(new Date(date));
    };
    self.update = function() { // being called from timeline.config.js
        var props = self.updateOptions();
        self.reactComponent.setState(props);
    };
    self.getMaxWidth = function() {
        var $elWidth = $footer.width();
        var $dataWidth = timeline.x(timeline.data.end());
        if($elWidth > $dataWidth) {
            return $dataWidth;
        }
        return $elWidth;
    };
    self.updateOptions = function() {
        var max;
        var state = model.rangeState;
        var props = {};
        props.startLocation = self.getLocationFromStringDate(state.startDate);
        props.endLocation = self.getLocationFromStringDate(state.endDate);
        props.max = self.getMaxWidth();

        return props;
    };
    self.onRangeClick = function(offsetX) {
        var date = timeline.x.invert(offsetX);
        models.date.select(date);
    };
    self.updateRange = function(startLocation, EndLocation) {
        var startDate = timeline.x.invert(startLocation);
        var endDate = timeline.x.invert(EndLocation);
        var state = model.rangeState;
        state.startDate = wv.util.toISOStringDate(startDate) || 0;
        state.endDate = wv.util.toISOStringDate(endDate);
        model.rangeState.playing = false;
        model.events.trigger('change');
        model.events.trigger('datechange');
    };
    self.init();
    return self;
};