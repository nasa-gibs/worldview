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
    var self = this;
    var timeline = ui.timeline;
    var rangeSelectionFactory = React.createFactory(Animate.RangeSelector); 

    self.init = function() {
        var pick = d3.select('#guitarpick');
        var pickWidth = pick.node().getBoundingClientRect().width;
        var animEndLocation = (d3.transform(pick.attr("transform")).translate[0] - (pickWidth/2)); // getting guitar pick location
        var ticHeight = $('.end-tick').height();
        var $animateButton = $('#animate-button');

        var RangeSelection = rangeSelectionFactory({
            startLocation: animEndLocation - 100, // or zero
            endLocation: animEndLocation,
            startColor: '#40a9db',
            endColor: '#295f92',
            rangeColor: '#45bdff',
            rangeOpacity: 0.3,
            pinWidth: 5,
            height: 45,
            onDrag: self.showDateOnDrag,
            onDragStop: self.updateRange
      });
      //mount react components
      ReactDOM.render(RangeSelection, $('#wv-rangeselector-case')[0]);
    };
    self.showDateOnDrag = function(firstLocation, secondLocation) {
        var date = timeline.x.invert(firstLocation);
        timeline.pick.hoverDate(date)

    }
    self.updateRange = function(startLocation, EndLocation) {
        var startDate = timeline.x.invert(startLocation);
        var endDate = timeline.x.invert(EndLocation);
        timeline.ticks.label.remove();
    }

    self.init();
    return self;
}