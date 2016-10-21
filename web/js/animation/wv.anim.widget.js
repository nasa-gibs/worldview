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
    var zooms = ['yearly', 'monthly', 'daily'];
    var self = {};
    var timeline = ui.timeline;
    var model = models.anim;
    var widgetFactory = React.createFactory(WVTC.AnimationWidget);
    var $timelineFooter;
    var $animateButton;
    /*
     * set listeners and initiate
     * widget
     * 
     * @method init
     * @static
     *
     * @returns {void}
     *
     */
    self.init = function() {
        var speed = Number(model.rangeState.speed) || 5;
        var Widget = widgetFactory({
            onPushPlay: self.onPressPlay,
            onPushLoop: self.onPressLoop,
            onPushPause: self.onPressPause,
            onPushGIF: self.onPressGIF,
            looping: model.rangeState.loop,
            increment: self.getIncrements(), // config.currentZoom is a number: 1,2,3
            incrementArray: _.without(zooms, self.getIncrements()), // array of zooms without current zoom
            onDateChange: self.dateUpdate,
            sliderLabel: 'Frames Per Second',
            sliderSpeed: speed,
            onZoomSelect: self.onZoomSelect,
            onSlide: self.onRateChange,
            startDate: new Date(model.rangeState.startDate),
            endDate: new Date(model.rangeState.endDate),
            minDate: models.date.minDate(),
            maxDate: models.date.maxDate(),
            onClose: self.toggleAnimationWidget
        });
        //mount react component
        $animateButton = $('#animate-button');
        self.reactComponent = ReactDOM.render(Widget, $('#wv-animation-widet-case')[0]);

        $timelineFooter = $('#timeline-footer');
        $animateButton.on('click', self.toggleAnimationWidget);
        if(model.rangeState.state === 'on') { // show animation widget if active in permalink
            $timelineFooter.toggleClass('wv-anim-active');
        }
        $('.wv-date-selector-widget input').on('keydown', function(e){
            // A bit of a hack
            e.stopPropagation(); // needed to correct event bubbling between react and Document
        });
        model.rangeState.speed = speed;
        model.events.trigger('change');
        model.events.on('change', self.update);
        model.events.on('timeline-change', self.update);
        models.data.events.on('activate', function() {
            self.toggleAnimationWidget();
            self.onDataActivate();
        });
        models.data.events.on('deactivate', function() {
            self.onDataDeactivate();
        });

        //hack for react bug https://github.com/facebook/react/issues/1920
        $('.wv-date-selector-widget input').keydown(function(e) {
            if(e.keyCode == 13 || e.keyCode == 9) {
                e.preventDefault();
            }
        });
        // Space bar event listener
        $(window).keypress(function(e) {
            if ((e.keyCode == 32 ||
                 e.charCode == 32 ) && // space click
                !$( "#layer-modal" ).dialog( "isOpen" )) {//layer selector is not open
                e.preventDefault();
                self.onSpaceBar();
            }
        });
    };
    /*
     * Determines whether to play
     * animation or pause animation
     *
     * @method onSpaceBar
     * @static
     *
     * @returns {void}
     *
     */
    self.onSpaceBar = function() {
        if(model.rangeState.state === 'on') {
            if(model.rangeState.playing) {
                self.onPressPause();
                return;
            }
            self.onPressPlay();
            self.update();
            return;
        }
    };

    /*
     * Updates the state of the
     * widget react component
     *
     * @method update
     * @static
     *
     * @returns {void}
     *
     */
    self.update = function() {
        var state = model.rangeState;
        self.reactComponent.setState({
            startDate: new Date(state.startDate),
            endDate: new Date(state.endDate),
            playing: state.playing,
            increment: self.getIncrements(), // config.currentZoom is a number: 1,2,3
            incrementArray: _.without(zooms, self.getIncrements()) // array of zooms without current zoom
        });
    };

    /*
     * Gets zoom increment
     *
     * @method getIncrements
     * @static
     *
     * @returns {string} timeline interval
     *
     */
    self.getIncrements = function() {
        return zooms[timeline.config.currentZoom - 1];
    };

    /*
     * A handler that responds to
     * a zoom change and triggers
     * the proper change
     *
     * @method onZoomSelect
     * @static
     *
     * @param increment {number} Timeline zoom
     *  level number
     *
     * @returns {string} timeline interval
     *
     */
    self.onZoomSelect = function(increment) {
        var zoomLevel = _.indexOf(zooms, increment);
        return timeline.config.zoom(zoomLevel + 1);
    };

    /*
     * Updates the state and triggers
     * change events.
     *
     * @method dateUpdate
     * @static
     *
     * @param startDate {obj} Start Date
     *
     * @param endDate {obj} End Date
     *
     * @returns {void}
     *
     */
    self.dateUpdate = function(startDate, endDate) {
        model.rangeState.startDate = wv.util.toISOStringDate(startDate) || 0;
        model.rangeState.endDate = wv.util.toISOStringDate(endDate);
        model.rangeState.playing = false;
        model.events.trigger('change');
        model.events.trigger('datechange');
    };

    /*
     * Toggles the visibility of the
     * widget
     *
     * @method toggleAnimationWidget
     * @static
     *
     * @returns {void}
     *
     */
    self.toggleAnimationWidget = function() {
        if(model.rangeState.state === 'off' && models.data.active) {
            return; // Keep animation off when data-download is active.
        }
        model.toggleActive(); // sets anim state to on or off
        model.events.trigger('change');
        model.events.trigger('toggle-widget');
        return $timelineFooter.toggleClass('wv-anim-active');
    };

    /*
     * Press play button event handler
     *
     * @method onPressPlay
     * @static
     *
     * @returns {void}
     *
     */
    self.onPressPlay = function() {
        model.rangeState.playing = true;
        model.events.trigger('play');
    };

    /*
     * Play button event handler
     *
     * @method onPressPlay
     *
     * @param speed {number} speed in frames
     *  per second
     *
     * @static
     *
     * @returns {void}
     *
     */
    self.onRateChange = function(speed) {
        model.rangeState.speed = speed;
        model.events.trigger('change');
    };

    /*
     * Pause button event handler
     *
     * @method onPressPause
     *
     * @static
     *
     * @returns {void}
     *
     */
    self.onPressPause = function() {
        var state = model.rangeState;
        state.playing = false;
        model.events.trigger('change');
    };

    /*
     * Deactivate widget when data download
     * is active
     *
     * @method onDataActivate
     *
     * @static
     *
     * @returns {void}
     *
     */
    self.onDataActivate = function() {
        $animateButton.addClass('wv-disabled-button');
        $animateButton.prop('title', 'Animation feature is deactivated when data download feature is active');
    };

    /*
     * reActivate widget when data download
     * is deactivated
     *
     * @method onDataDeactivate
     *
     * @static
     *
     * @returns {void}
     *
     */
    self.onDataDeactivate = function() {
        $animateButton.removeClass('wv-disabled-button');
        $animateButton.prop('title', 'Setup animation');
    };

    /*
     * Adjusts state when loop is triggered
     *
     * @method onPressLoop
     *
     * @static
     *
     * @param loop {boolean}
     *
     * @returns {void}
     *
     */
    self.onPressLoop = function(loop) {
        var state = model.rangeState;
        state.loop = loop;
        model.events.trigger('change');
    };

    /*
     * Gif icon event handler: Triggers
     * gif area selection
     *
     * @method onPressGIF
     *
     * @static
     *
     * @returns {void}
     *
     */
    self.onPressGIF = function() {
        model.events.trigger('gif-click');
    };
    self.init();
    return self;
};