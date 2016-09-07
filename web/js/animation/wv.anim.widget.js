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

wv.anim.widget = wv.anim.widget || function(models, config, ui) {
    var zooms = ['yearly', 'monthly', 'daily']
    var self = {};
    var timeline = ui.timeline;
    var model = models.anim;
    var widgetFactory = React.createFactory(Animate.AnimationWidget);
    var $timelineFooter;
    self.init = function() {
        var $animateButton = $('#animate-button');
        var Widget = widgetFactory({
            onPushPlay: self.onPressPlay,
            onPushLoop: self.onPressLoop,
            onPushPause: self.onPressPause,
            onPushGIF: self.onPressGIF,
            looping: model.rangeState.loop,
            header: 'Animate Map in ' + zooms[timeline.config.currentZoom - 1] + ' Increments', // config.currentZoom is a number: 1,2,3
            onDateChange: self.dateUpdate,
            sliderLabel: 'Frames Per Second',
            sliderSpeed: 10,
            onSlide: self.onRateChange,
            startDate: new Date(model.rangeState.startDate),
            endDate: new Date(model.rangeState.endDate),
            minDate: models.date.minDate(),
            maxDate: models.date.maxDate()
        });
        //mount react component
        self.reactComponent = ReactDOM.render(Widget, $('#wv-animation-widet-case')[0]);

        $timelineFooter = $('#timeline-footer');
        $animateButton.on('click', self.toggleAnimationWidget);
        model.rangeState.speed = 10;
        model.events.on('change', self.update);
        model.events.on('timeline-change', self.update);

    };
    self.update = function() {
        var state = model.rangeState;
        self.reactComponent.setState({
            startDate: new Date(state.startDate),
            endDate: new Date(state.endDate),
            playing: state.playing,
            header: 'Animate Map in ' + zooms[timeline.config.currentZoom - 1] + ' Increments' // config.currentZoom is a number: 1,2,3
        });
        model.rangeState.playIndex = null;
    }
    self.dateUpdate = function(startDate, endDate) {
        model.rangeState.startDate = wv.util.toISOStringDate(startDate) || 0;
        model.rangeState.endDate = wv.util.toISOStringDate(endDate);
        model.events.trigger('change');
        model.events.trigger('datechange');
    }
    self.toggleAnimationWidget = function() {
        return $timelineFooter.toggleClass('wv-anim-active');
    };
    self.onPressPlay = function() {
        model.rangeState.playing = true;
        model.events.trigger('play');
    };
    self.onRateChange = function(speed) {
        model.rangeState.speed = speed;
        model.events.trigger('change');
    }
    self.onPressPause = function() {
        var state = model.rangeState;
        state.playing = false;
        model.events.trigger('change');
    }
    /*
     * adjust state when loop is pressed
     */
    self.onPressLoop = function(loop) {
        var state = model.rangeState;
        state.loop = loop;
        model.events.trigger('change');
    }
    self.onPressGIF = function() {
        model.events.trigger('gif-click');
    }
    self.init();
    return self;
}