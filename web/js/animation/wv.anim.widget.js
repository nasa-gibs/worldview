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
    self.init = function() {
        var $animateButton = $('#animate-button');
        var Widget = widgetFactory({
            onPushPlay: self.onPressPlay,
            onPushLoop: self.onPressLoop,
            onPushPause: self.onPressPause,
            looping: model.rangeState.loop,
            header: 'Animate Map in ' + zooms[timeline.config.currentZoom - 1] + ' Increments', // config.currentZoom is a number: 1,2,3
            onDateChange: self.dateUpdate,
            sliderLabel: 'Frames Per Second',
            sliderSpeed: model.rangeState.speed || 0.16,
            onSlide: self.onRateChange,
            startDate: new Date(model.rangeState.startDate),
            endDate: new Date(model.rangeState.endDate)
        });
        //mount react component
        self.reactComponent = ReactDOM.render(Widget, $('#wv-animation-widet-case')[0]);

        self.$widgetCase = $('#wv-animation-widget');
        $animateButton.on('click', self.toggleAnimationWidget);
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
        var state = model.rangeState;
        state.startDate = wv.util.toISOStringDate(startDate) || 0;
        state.endDate = wv.util.toISOStringDate(endDate);
        model.events.trigger('change');
    }
    self.toggleAnimationWidget = function() {
        return self.$widgetCase.toggleClass('wv-active');
    };
    self.onPressPlay = function() {
        model.rangeState.playing = true;
        model.events.trigger('play');
    };
    self.onRateChange = function(speed) {
        model.rangeState.speed = speed / 60;
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
    self.init();
    return self;
}