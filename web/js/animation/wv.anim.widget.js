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
    var self = {};
    var timeline = ui.timeline;
    var model = models.anim;
    var widgetFactory = React.createFactory(Animate.AnimationWidget);
    self.init = function() {
        var $animateButton = $('#animate-button');
        var Widget = widgetFactory({
            onPushPlay: self.onPressPlay,
            onDateChange: self.dateUpdate,
            label: 'Frames Per Second',
            startDate: new Date(model.rangeState.startDate),
            endDate: new Date(model.rangeState.endDate)
        });
        //mount react component
        self.reactComponent = ReactDOM.render(Widget, $('#wv-animation-widet-case')[0]);

        self.$widgetCase = $('#wv-animation-widget');
        $animateButton.on('click', self.toggleAnimationWidget);
        model.events.on('change', self.update)
    };
    self.update = function() {
        self.reactComponent.setState({
            startDate: new Date(model.rangeState.startDate),
            endDate: new Date(model.rangeState.endDate)
        });
    }
    self.dateUpdate = function(startDate, endDate) {
        var state = model.rangeState;
        state.startDate = wv.util.toISOStringDate(startDate) || 0;
        state.endDate = wv.util.toISOStringDate(endDate);
        models.events.trigger('change');
    }
    self.toggleAnimationWidget = function() {
        return self.$widgetCase.toggleClass('wv-active');
    };
    self.onPressPlay = function(args) {
        console.log(args)
    };
    self.init();
    return self;
}