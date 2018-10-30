import AnimationWidget from '../components/animation-widget/animation-widget';
import googleTagManager from 'googleTagManager';
import React from 'react';
import ReactDOM from 'react-dom';
import lodashWithout from 'lodash/without';
import lodashIndexOf from 'lodash/indexOf';
import util from '../util/util';

export function animationWidget(models, config, ui) {
  var zooms = ['yearly', 'monthly', 'daily', '10-Minute'];
  var self = {};
  var timeline = ui.timeline;
  var model = models.anim;
  var $timelineFooter;
  var $animateButton;
  var dataModel;

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
    $animateButton = $('#animate-button');

    var props = {
      onPushPlay: self.onPressPlay,
      onPushLoop: self.onPressLoop,
      onPushPause: self.onPressPause,
      onPushGIF: self.onPressGIF,
      looping: model.rangeState.loop,
      increment: self.getIncrements(), // config.currentZoom is a number: 1,2,3
      incrementArray: lodashWithout(zooms, self.getIncrements()), // array of zooms without current zoom
      onDateChange: self.dateUpdate,
      sliderLabel: 'Frames Per Second',
      sliderSpeed: model.rangeState.speed,
      onZoomSelect: self.onZoomSelect,
      onSlide: self.onRateChange,
      startDate: new Date(model.rangeState.startDate),
      endDate: new Date(model.rangeState.endDate),
      minDate: models.date.minDate(),
      maxDate: models.date.maxDate(),
      maxZoom: models.date.maxZoom,
      onClose: self.toggleAnimationWidget
    };

    self.reactComponent = ReactDOM.render(
      React.createElement(AnimationWidget, props),
      $('#wv-animation-widet-case')[0]
    );
    $timelineFooter = $('#timeline-footer');
    $animateButton.on('click', function() {
      googleTagManager.pushEvent({ 'event': 'GIF_setup_animation_button' });
      self.toggleAnimationWidget();
    });
    if (model.rangeState.state === 'on') {
      // show animation widget if active in permalink
      $timelineFooter.toggleClass('wv-anim-active');
    }
    $('.wv-date-selector-widget input').on('keydown', function(e) {
      // A bit of a hack
      e.stopPropagation(); // needed to correct event bubbling between react and Document
    });
    model.events.trigger('change');
    model.events.on('change', self.update);
    models.date.events.on('timeline-change', self.update);
    if (models.data) {
      dataModel = models.data;
      dataModel.events.on('activate', function() {
        self.toggleAnimationWidget();
        self.disableButton('Data Download');
      });
      dataModel.events.on('deactivate', function() {
        self.enableButton();
      });
    } else {
      dataModel = {};
      dataModel.active = false;
    }
    if (models.compare) {
      let compareModel = models.compare;
      if (compareModel.active) {
        self.disableButton('Compare');
      }
      compareModel.events.on('toggle', () => {
        if (compareModel.active) {
          if (model.rangeState.state === 'on') self.toggleAnimationWidget();
          self.disableButton('Compare');
        } else {
          self.enableButton();
        }
      });
    }

    // hack for react bug https://github.com/facebook/react/issues/1920
    $('.wv-date-selector-widget input').keydown(function(e) {
      if (e.keyCode === 13 || e.keyCode === 9) {
        e.preventDefault();
      }
    });
    // Space bar event listener
    $(window).keypress(function(e) {
      if (
        (e.keyCode === 32 || e.charCode === 32) && // space click
        !ui.addModal.isOpen()
      ) {
        // layer selector is not open
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
    if (model.rangeState.state === 'on') {
      if (model.rangeState.playing) {
        self.onPressPause();
        return;
      }
      self.onPressPlay();
      self.update();
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
      maxZoom: models.date.maxZoom,
      playing: state.playing,
      increment: self.getIncrements(), // config.currentZoom is a number: 1,2,3
      incrementArray: lodashWithout(zooms, self.getIncrements()) // array of zooms without current zoom
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
    if (models.date.maxZoom > 3) {
      zooms = ['yearly', 'monthly', 'daily', '10-Minute'];
    } else {
      zooms = ['yearly', 'monthly', 'daily'];
    }
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
    var zoomLevel = lodashIndexOf(zooms, increment);
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
    model.rangeState.startDate = util.toISOStringSeconds(startDate) || 0;
    model.rangeState.endDate = util.toISOStringSeconds(endDate);
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
    // If timeline is hidden, pressing
    // the anim icon will open the
    // timeline and the anim widget
    if (model.rangeState.state === null) {
      // widget hasn't been clicked before
      model.rangeState.state = 'off';
      self.makeDateGuess();
    }
    if ($timelineFooter.is(':hidden') && !dataModel.active) {
      ui.timeline.toggle(); // toggle
      if (model.rangeState.state === 'on') {
        // activate anim if not already
        return;
      }
      setTimeout(function() {
        model.events.trigger('change');
        model.events.trigger('toggle-widget');
      }, 500);
    }
    if (model.rangeState.state === 'off' && dataModel.active) {
      return; // Keep animation off when data-download is active.
    }
    model.toggleActive(); // sets anim state to on or off
    model.events.trigger('change');
    model.events.trigger('toggle-widget');

    return $timelineFooter.toggleClass('wv-anim-active');
  };

  self.makeDateGuess = function() {
    var day, intervalStep;
    var today = new Date();
    var dateModel = models.date;
    var currentDate = new Date(dateModel[dateModel.activeDate]);
    var interval = ui.anim.ui.getInterval();
    if (dateModel.selectedZoom === 4) {
      intervalStep = 70;
    } else {
      intervalStep = 7;
    }
    day = util.dateAdd(currentDate, interval, intervalStep);
    if (day > today) {
      model.rangeState.endDate = util.toISOStringSeconds(currentDate);
      model.rangeState.startDate = util.toISOStringSeconds(
        util.dateAdd(currentDate, interval, -intervalStep)
      );
    } else {
      model.rangeState.startDate = util.toISOStringSeconds(currentDate);
      model.rangeState.endDate = util.toISOStringSeconds(
        util.dateAdd(currentDate, interval, intervalStep)
      );
    }
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
    let zoomLevel = ui.anim.ui.getInterval();
    if (zoomLevel !== 'minute') {
      // zero out start/end date times
      self.setZeroDateTimes();
    }
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
  self.disableButton = function(featureThatIsDisabling) {
    $animateButton.addClass('wv-disabled-button');
    $animateButton.prop(
      'title',
      'Animation feature is deactivated when ' +
        featureThatIsDisabling +
        ' feature is active'
    );
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
  self.enableButton = function() {
    $animateButton.removeClass('wv-disabled-button');
    $animateButton.prop('title', 'Set up animation');
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
    let zoomLevel = ui.anim.ui.getInterval();
    let looping = ui.anim.widget.reactComponent.state.looping;
    if (zoomLevel !== 'minute') {
      // zero out start/end date times
      self.setZeroDateTimes();
    }

    let increment = self.getIncrements();
    let frameSpeed = model.rangeState.speed;
    googleTagManager.pushEvent({
      'event': 'GIF_create_animated_button',
      'GIF': {
        'increment': increment,
        'frameSpeed': frameSpeed,
        'looping': looping
      }
    });
    model.events.trigger('gif-click');
  };

  /*
   * Zero out hours/min/sec for start/end dates
   * will snap draggers into place on timeline
   * and zero out GIF Animation preview modal and url time data
   *
   * used with onPressPlay and onPressGIF
   *
   * @method setZeroDateTimes
   *
   * @static
   *
   * @returns {void}
   *
   */
  self.setZeroDateTimes = function() {
    let state = model.rangeState;
    let startDate = util.parseDateUTC(state.startDate);
    let endDate = util.parseDateUTC(state.endDate);

    util.clearTimeUTC(startDate);
    util.clearTimeUTC(endDate);

    // save changes to model
    model.rangeState.startDate = util.toISOStringSeconds(startDate);
    model.rangeState.endDate = util.toISOStringSeconds(endDate);
    model.events.trigger('change');
  };

  self.init();
  return self;
}
