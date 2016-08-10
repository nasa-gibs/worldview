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
wv.date = wv.date || {};

wv.date.anim = wv.date.anim || {};

wv.date.anim.widget = wv.date.anim.widget || function(models, config, ui) {
    var self = this;
    var timeline = ui.timeline;
    var widgetFactory = React.createFactory(Animate.AnimationWidget);
    self.init = function() {
        var $animateButton = $('#animate-button');
        var Widget = widgetFactory({
            callback: self.onPressPlay,
            label: 'Frames Per Second'
        });
      //mount react component
      ReactDOM.render(Widget, $('#wv-animation-widet-case')[0]);

      self.$widgetCase = $('#wv-animation-widget');
      $animateButton.on('click', self.toggleAnimationWidget)
    };
    self.toggleAnimationWidget = function() {
        return self.$widgetCase.toggleClass('wv-active');
    };
    self.onPressPlay = function(args) {
        console.log(args)
    };
    self.init();
    return self;
}