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
var wv = wv || {};
wv.date = wv.date || {};

wv.date.anim = wv.date.anim || {};

wv.date.anim.ui = wv.date.anim.ui || function(models) {
    var self = this;
    var widgetFactory = React.createFactory(Animate.AnimationWidget);
    var rangeSelectionFactory = React.createFactory(Animate.RangeSelector); 

    self.init = function() {
        var pick = d3.select('#guitarpick');
        var pickWidth = pick.node().getBoundingClientRect().width;
        var animEndLocation = (d3.transform(pick.attr("transform")).translate[0] - (pickWidth/2)); // setting guitar pick location
        var ticHeight = $('.end-tick').height();
        var $animateButton = $('#animate-button');
        var Widget = widgetFactory({
            callback: self.onPressPlay,
            label: 'Frames Per Second'
        });
        var RangeSelection = rangeSelectionFactory({
            startLocation: animEndLocation - 100, // or zero
            endLocation: animEndLocation,
            startColor: '#40a9db',
            endColor: '#295f92',
            rangeColor: '#45bdff',
            rangeOpacity: 0.3,
            pinWidth: 10,
            height: 40
      })
      //mount react components
      ReactDOM.render(Widget, $('#wv-animation-widet-case')[0]);
      ReactDOM.render(RangeSelection, $('#wv-rangeselector-case')[0]);

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