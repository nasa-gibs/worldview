/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2014 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 *
 * Licensed under the NASA Open Source Agreement, Version 1.3
 * http://opensource.gsfc.nasa.gov/nosa.php
 */
 /** @jsx React.DOM */

var wv = wv || {};
wv.date = wv.date || {};

wv.date.anim = wv.date.anim || {};

wv.date.anim.ui = wv.date.anim.ui || function(models) {
    var self = this;
    var Factory = React.createFactory(Animate.AnimationWidget);
    var widget = Factory({
        callback: this.onPressPlay,
        label: 'Frames Per Second'
    });
    var $animateButton = $('#animate-button')
    self.init = function() {
      ReactDOM.render(widget, $('#wv-animation-widet-case')[0]);
      self.$widgetCase = $('#wv-animation-widget');
      $animateButton.on('click', self.toggleAnimationWidget)
    };
    self.toggleAnimationWidget = function() {
        return self.$widgetCase.toggleClass('wv-active');
    };
    self.onPressPlay = function(args) {
        console.log(args)
    } 
    self.init();
}