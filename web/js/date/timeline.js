import util from '../util/util';
import React from 'react';
import ReactDOM from 'react-dom';
import googleTagManager from 'googleTagManager';
import Timeline from '../components/timeline/timeline';

const timeScaleFromNumberKey = {
  '0': 'custom',
  '1': 'year',
  '2': 'month',
  '3': 'day',
  '4': 'hour',
  '5': 'minute'
};

const timeScaleToNumberKey = {
  'custom': '0',
  'year': '1',
  'month': '2',
  'day': '3',
  'hour': '4',
  'minute': '5'
};

export function timeline(models, config, ui) {
  var self = {};
  var model = models.date;
  let subdaily = models.layers.hasSubDaily();
  self.enabled = false;
  self.startDate = new Date(config.startDate);
  self.parentOffset = (subdaily ? 404 : 310) + 10;

  self.active = false;
  self.delay = 500;
  var animator = null;
  var keyDown;

  let animationInProcess = false;
  var initInput = function() {
    // models.layers.events.on('subdaily-updated', updateMaxZoom);
    // handle LEFT/RIGHT date input change from document level
    document.addEventListener('keydown', function(event) {
      if (event.target.nodeName === 'INPUT' || keyDown === event.keyCode) {
        return;
      }
      // get selected interval and customDelta or default of 1
      let interval = models.date.interval;
      let delta = models.date.customSelected === true ? models.date.customDelta : 1;
      switch (event.keyCode) {
        case util.key.LEFT:
          // prevent quick LEFT/RIGHT arrow conflicting animations
          if (keyDown !== event.keyCode) {
            stopper();
          }
          self.animateByIncrement(-delta, timeScaleFromNumberKey[interval]);
          event.preventDefault();
          break;
        case util.key.RIGHT:
          // prevent quick LEFT/RIGHT arrow conflicting animations
          if (keyDown !== event.keyCode) {
            stopper();
          }
          self.animateByIncrement(delta, timeScaleFromNumberKey[interval]);
          event.preventDefault();
          break;
      }
      keyDown = event.keyCode;
    });

    document.addEventListener('keyup', function(event) {
      switch (event.keyCode) {
        case util.key.LEFT:
        case util.key.RIGHT:
          stopper();
          event.preventDefault();
          break;
      }
      keyDown = null;
    });
  };

  /**
   * @param  {Number} delta Date and direction to change
   * @param  {Number} increment Zoom level of change
   *                  e.g. months,minutes, years, days
   * @return {Object} JS Date Object
   */
  var getNextTimeSelection = function(delta, increment) {
    var prevDate = model[model.activeDate];
    switch (increment) {
      case 'year':
        return new Date(
          new Date(prevDate).setUTCFullYear(prevDate.getUTCFullYear() + delta)
        );
      case 'month':
        return new Date(
          new Date(prevDate).setUTCMonth(prevDate.getUTCMonth() + delta)
        );
      case 'day':
        return new Date(
          new Date(prevDate).setUTCDate(prevDate.getUTCDate() + delta)
        );
      case 'hour':
        return new Date(
          new Date(prevDate).setUTCHours(prevDate.getUTCHours() + delta)
        );
      case 'minute':
        return new Date(
          new Date(prevDate).setUTCMinutes(prevDate.getUTCMinutes() + delta)
        );
    }
  };

  /**
   * Add timeout to date change when buttons are being held so that
   * date changes don't happen too quickly
   *
   * @todo Create smart precaching so animation is smooth
   *
   * @param  {number} delta Amount of time to change
   * @param  {String} increment Zoom level of timeline
   *                  e.g. months,minutes, years, days
   * @return {void}
   */
  self.animateByIncrement = function(delta, increment) {
    var endTime = models.layers.lastDateTime();
    var endDate = models.layers.lastDate();

    let subdaily = models.layers.hasSubDaily();
    function animate() {
      var nextTime = getNextTimeSelection(delta, increment);
      if (subdaily) {
        if (self.startDate <= nextTime && nextTime <= endTime) {
          models.date.add(increment, delta);
        }
      } else {
        if (self.startDate <= nextTime && nextTime <= endDate) {
          models.date.add(increment, delta);
        }
      }
      animationInProcess = true;
      animator = setTimeout(animate, self.delay);
    }
    animate();
  };

  /**
   *  Clear animateByIncrement's Timeout
   *
   * @return {void}
   */
  var stopper = function() {
    if (animationInProcess) {
      animationInProcess = false;
      clearInterval(animator);
      animator = 0;
    }
  };

  var getInputProps = function() {
    var model = models.date;
    var min = model.minDate();
    var max = model.maxDate();
    var date = model[model.activeDate];

    return {
      width: '120',
      height: '30',
      id: 'main',
      idSuffix: 'animation-widget-main',
      minDate: min,
      maxDate: max,
      date: date,
      fontSize: null
    };
  };

  // ? INPUT ABOVE
  self.margin = {
    top: 0,
    right: 50,
    bottom: 20,
    left: 30
  };

  self.getPadding = function() {
    self.padding = self.width / 4;
    return self.padding;
  };

  self.getWidth = function() {
    // check for compare mode
    let isCompareModeActive = models.compare.active;

    // if compare mode is active, check for subdaily in either A or B
    let hasSubDaily;
    if (isCompareModeActive) {
      hasSubDaily = models.layers.hasSubDaily('active') || models.layers.hasSubDaily('activeB');
    } else {
      hasSubDaily = models.layers.hasSubDaily();
    }
    self.parentOffset = (hasSubDaily ? 404 : 310) + 10;

    self.width =
      // $(window).outerWidth(true) -
      window.innerWidth -
      self.parentOffset -
      20 -
      20 -
      self.margin.left -
      self.margin.right +
      28;
    return self.width;
  };

  self.height = 65 - self.margin.top - self.margin.bottom;
  // self.isCropped = true;

  self.toggle = function(now) {
    var tl = $('#timeline-footer');
    // var tlg = self.boundary;
    // var gp = d3.select('#guitarpick');
    if (tl.is(':hidden')) {
      var afterShow = function() {
        // tlg.attr('style', 'clip-path:url("#timeline-boundary")');
        // gp.attr('style', 'clip-path:url(#guitarpick-boundary);');
      };
      if (now) {
        tl.show();
        afterShow();
      } else {
        tl.show('slow', afterShow);
      }
      $('#timeline').removeClass('closed');
    } else {
      // tlg.attr('style', 'clip-path:none');
      // gp.attr('style', 'display:none;clip-path:none');
      tl.hide('slow');
      $('#timeline').addClass('closed');
    }
  };

  self.expand = function(now) {
    now = now || false;
    var tl = $('#timeline-footer');
    if (tl.is(':hidden')) {
      self.toggle(now);
    }
  };

  self.collapse = function(now) {
    now = now || false;
    var tl = $('#timeline-footer');
    if (!tl.is(':hidden')) {
      self.toggle(now);
    }
  };

  self.resize = function() {
    var small = util.browser.small || util.browser.constrained;
    if (self.enabled && small) {
      self.enabled = false;
      $('#timeline').hide();
    } else if (!self.enabled && !small) {
      self.enabled = true;
      $('#timeline').show();
    }

    if (self.enabled) {
      self.getWidth();

    //   self.svg
    //     .attr('width', self.width)
    //     .attr(
    //       'viewBox',
    //       '0 9 ' +
    //         self.width +
    //         ' ' +
    //         (self.height + self.margin.top + self.margin.bottom + 26)
    //     );

    //   d3.select('#timeline-boundary rect').attr('width', self.width);

    //   d3.select('#guitarpick-boundary rect').attr(
    //     'width',
    //     self.width + self.margin.left + self.margin.right
    //   );

    //   self.axis.select('line:first-child').attr('x2', self.width);
    }
    self.reactComponent.setState({
      axisWidth: self.getWidth(),
      parentOffset: self.parentOffset
    });
  };

  self.setClip = function() {
    // This is a hack until Firefox fixes their svg rendering problems
    // d3.select('#timeline-footer svg > g:nth-child(2)').attr(
    //   'visibility',
    //   'hidden'
    // );
    // d3.select('#timeline-footer svg > g:nth-child(2)').attr('style', '');
    // setTimeout(function() {
    //   d3.select('#timeline-footer svg > g:nth-child(2)').attr(
    //     'style',
    //     'clip-path:url("#timeline-boundary")'
    //   );
    //   d3.select('#timeline-footer svg > g:nth-child(2)').attr('visibility', '');
    // }, 50);
  };

  var incrementDate = (increment, timeScale) => {
    self.animateByIncrement(increment, timeScale);
  };

  // invoked when compare mode is toggled
  var onCompareModeToggle = () => {
    self.getWidth();
    let isCompareModeActive = models.compare.active;
    if (!isCompareModeActive) {
      let activeDate = models.date.activeDate;
      let active = activeDate === 'selected' ? 'active' : 'activeB';
      let hasSubDaily = models.layers.hasSubDaily(active);
      self.reactComponent.setState({
        compareModeActive: isCompareModeActive,
        draggerSelected: activeDate,
        axisWidth: self.width,
        parentOffset: self.parentOffset,
        hasSubdailyLayers: hasSubDaily
      });
    } else {
      // timeScale zoom and reset if subdaily zoom in permalink
      let selectedTimeScaleState = models.date.selectedZoom;
      let selectedTimeScale = selectedTimeScaleState ? timeScaleFromNumberKey[selectedTimeScaleState] : 'day';

      let hasSubDaily = models.layers.hasSubDaily('active') || models.layers.hasSubDaily('activeB');
      let selectedDate = models.date.selected;

      // default 7 timeScale units away for B dragger if not selected at compare init
      let selectedDateB = models.date.selectedB ? models.date.selectedB : util.dateAdd(selectedDate, selectedTimeScale, -7);
      let dateFormattedB = new Date(selectedDateB).toISOString();
      self.reactComponent.setState({
        compareModeActive: isCompareModeActive,
        selectedDateB: selectedDateB,
        dateFormattedB: dateFormattedB,
        axisWidth: self.width,
        parentOffset: self.parentOffset,
        hasSubdailyLayers: hasSubDaily
      });
    }
  };

  // select active dragger from A to B
  var onChangeSelectedDragger = (selectionStr) => {
    let isCompareModeActive = models.compare.active;
    if (isCompareModeActive) {
      models.compare.toggleState();
    }
    self.reactComponent.setState({
      draggerSelected: selectionStr
    });
  };

  // TEST updateRange
  var updateAnimationRange = (startDate, endDate) => {
    ui.anim.rangeselect.updateRange(startDate, endDate, true);
  };

  // update date in model
  var updateDate = (date, selectionStr) => {
    let updatedDate = new Date(date);
    models.date.select(updatedDate, selectionStr);
  };

  // set custom interval
  var setIntervalInput = (intervalValue, zoomLevel) => {
    console.log(intervalValue, zoomLevel)
    models.date.setCustomInterval(intervalValue, timeScaleToNumberKey[zoomLevel]);
    let zoomCustomText = document.querySelector('#zoom-custom');
    zoomCustomText.textContent = `${intervalValue} ${zoomLevel.toUpperCase().substr(0, 3)}`;
    // model.events.trigger('zoom-change');
    self.reactComponent.setState({
      timeScaleChangeUnit: zoomLevel,
      customIntervalValue: intervalValue,
      customIntervalZoomLevel: zoomLevel,
      intervalChangeAmt: intervalValue,
      // customIntervalModalOpen: false
    });
  };

  // set selected interval either custom or standard delta of 1
  var setSelectedInterval = (interval, intervalChangeAmt, customSelected) => {
    console.log(interval, intervalChangeAmt, customSelected)
    models.date.setSelectedInterval(timeScaleToNumberKey[interval], customSelected);
    self.reactComponent.setState({
      timeScaleChangeUnit: interval,
      customSelected: customSelected,
      intervalChangeAmt: intervalChangeAmt,
      customIntervalModalOpen: customSelected
    });
  };

  // switch to selected interval
  var changeToSelectedInterval = () => {
    let customSelected = models.date.customSelected;
    let timeScaleInterval = timeScaleFromNumberKey[models.date.interval];
    let timeScaleChangeUnit = timeScaleFromNumberKey[models.date.customInterval];
    let intervalChangeAmt = models.date.customDelta;

    if (customSelected) {
      let customIntervalModalOpen = false;
      if (!models.date.customDelta || !models.date.customInterval) {
        customIntervalModalOpen = true;
      }
      self.reactComponent.setState({
        timeScaleChangeUnit: timeScaleChangeUnit,
        customIntervalValue: intervalChangeAmt,
        intervalChangeAmt: intervalChangeAmt,
        customIntervalModalOpen: customIntervalModalOpen,
        customSelected: true
      });
    } else {
      self.reactComponent.setState({
        timeScaleChangeUnit: timeScaleInterval,
        intervalChangeAmt: 1,
        customIntervalModalOpen: false,
        customSelected: false
      });
    }
  };

  // TODO: refactor how this is invoked
  var clickAnimationButton = () => {
  };

  // change time scale
  var changeTimeScale = (timeScale) => {
    models.date.setSelectedZoom(timeScaleToNumberKey[timeScale]);
    updateTimeScaleState();
  };

  // update timeline component with time scale
  var updateTimeScaleState = () => {
    let timeScale = timeScaleFromNumberKey[models.date.selectedZoom];
    self.reactComponent.setState({
      timeScale: timeScale
    });
  };

  var getInitialProps = () => {
    // check for compare mode and what dragger is active
    let isCompareModeActive = models.compare.active;
    let draggerSelected = models.date.activeDate;
    // if compare mode is active, check for subdaily in either A or B
    let subdaily;
    if (isCompareModeActive) {
      subdaily = models.layers.hasSubDaily('active') || models.layers.hasSubDaily('activeB');
    } else {
      subdaily = models.layers.hasSubDaily();
    }

    // timeScale zoom and reset if subdaily zoom in permalink
    let selectedTimeScaleState = models.date.selectedZoom;
    if (!subdaily && selectedTimeScaleState > 3) {
      selectedTimeScaleState = 3;
    }
    let selectedTimeScale = selectedTimeScaleState ? timeScaleFromNumberKey[selectedTimeScaleState] : 'day';

    // get selected dates, start, and end dates
    let selectedDate = models.date.selected;
    let selectedDateB = models.date.selectedB ? models.date.selectedB : null;
    // TODO: date formatted props necessary in dev to handle model.select date rounding - remove now?
    let dateFormatted = selectedDate ? new Date(selectedDate).toISOString() : '';
    let dateFormattedB = selectedDateB ? new Date(selectedDateB).toISOString() : '';
    let timelineStartDateLimit = config.startDate;
    let timelineEndDateLimit = models.layers.lastDate().toISOString();

    // make custom interval, custom delta available and determine currently selected interval
    let intervalTimeScale = models.date.customInterval ? timeScaleFromNumberKey[models.date.customInterval] : selectedTimeScale;
    let intervalDelta = models.date.customDelta ? models.date.customDelta : 1;

    let customSelected = models.date.customSelected ? Boolean(models.date.customSelected) : false;
    let intervalSelected = models.date.interval ? timeScaleFromNumberKey[models.date.interval] : selectedTimeScale;

    // get separate input props
    // TODO: combined props cleaner or too long?
    let inputProps = getInputProps();
    return { ...inputProps,
      customIntervalZoomLevel: intervalTimeScale,
      compareModeActive: isCompareModeActive,
      onChangeSelectedDragger: onChangeSelectedDragger,
      draggerSelected: draggerSelected,
      axisWidth: self.width,
      parentOffset: self.parentOffset,
      hasSubdailyLayers: subdaily,
      timelineHeight: self.height,
      selectedDate: selectedDate,
      selectedDateB: selectedDateB,
      timelineStartDateLimit: timelineStartDateLimit,
      timelineEndDateLimit: timelineEndDateLimit,
      timeScale: selectedTimeScale,
      incrementDate: incrementDate,
      updateDate: updateDate,
      setIntervalInput: setIntervalInput,
      dateFormatted: dateFormatted,
      dateFormattedB: dateFormattedB,
      stopper: stopper,
      clickAnimationButton: clickAnimationButton,
      toggleHideTimeline: self.toggle,
      changeTimeScale: changeTimeScale,
      intervalTimeScale: intervalSelected,
      intervalDelta: intervalDelta,
      setSelectedInterval: setSelectedInterval,
      customSelected: customSelected,
      updateAnimationRange: updateAnimationRange
    };
  };

  var drawContainers = function() {
    self.getWidth();
    let initialProps = getInitialProps();
    self.reactComponent = ReactDOM.render(
      React.createElement(Timeline, initialProps),
      document.getElementById('timeline')
    );

    // self.svg = d3
    //   .select('#timeline-footer')
    //   .append('svg:svg')
    //   .attr('width', self.width) // + margin.left + margin.right)
    //   .attr('height', self.height + self.margin.top + self.margin.bottom + 42)
    //   .attr('id', 'timeline-footer-svg')
    //   .attr(
    //     'viewBox',
    //     '0 9 ' +
    //       self.width +
    //       ' ' +
    //       (self.height + self.margin.top + self.margin.bottom + 26)
    //   );

    // self.svg
    //   .append('svg:defs')
    //   .append('svg:clipPath')
    //   .attr('id', 'timeline-boundary')
    //   .append('svg:rect')
    //   .attr('width', self.width) // + margin.left + margin.right)
    //   .attr('height', self.height + self.margin.top + self.margin.bottom);

    // d3.select('#timeline-footer svg defs')
    //   .append('svg:clipPath')
    //   .attr('id', 'guitarpick-boundary')
    //   .append('svg:rect')
    //   .attr('width', self.width + self.margin.left + self.margin.right) // + margin.left + margin.right)
    //   .attr('height', self.height + self.margin.top + self.margin.bottom)
    //   .attr('x', -self.margin.left);

    // self.boundary = self.svg
    //   .append('svg:g')
    //   .attr('clip-path', 'url(#timeline-boundary)')
    //   .attr('style', 'clip-path:url(#timeline-boundary)')
    //   .attr('transform', 'translate(0,1)');

    // self.axis = self.boundary
    //   .append('svg:g')
    //   .attr('class', 'x axis')
    //   .attr('transform', 'translate(0,' + self.height + ')');

    // self.axis
    //   .insert('line', ':first-child')
    //   .attr('x1', 0)
    //   .attr('x2', self.width); // +margin.left+margin.right);

    // self.dataBars = self.boundary
    //   .insert('svg:g', '.x.axis')
    //   .attr('height', self.height)
    //   .classed('plot', true);

    // self.verticalAxis = self.boundary
    //   .append('svg:g')
    //   .attr('class', 'y axis')
    //   .attr('transform', 'translate(0,0)');
    // self.animboundary = self.svg
    //   .append('svg:g')
    //   .attr('clip-path', '#timeline-boundary')
    //   .attr('transform', 'translate(0,16)');
    // self.animboundary.append('g').attr('id', 'wv-rangeselector-case');
  };

  // arguments passed as date (date object) and selectionStr ('selected' or 'selectedB')
  var updateReactTimelineDate = function(date, selectionStr) {
    let selectedDate = models.date.selected;
    let selectedDateB = models.date.selectedB;
    let draggerSelected = models.date.activeDate;

    let dateFormatted = selectedDate ? new Date(selectedDate).toISOString() : '';
    let dateFormattedB = selectedDateB ? new Date(selectedDateB).toISOString() : '';

    self.reactComponent.setState({
      selectedDate: selectedDate,
      dateFormatted: dateFormatted,
      draggerSelected: draggerSelected,
      selectedDateB: selectedDateB,
      dateFormattedB: dateFormattedB
    });
  };

  // Update status of subdaily layers being in sidebar
  var updateSubdailyState = function() {
    // check for compare mode
    let isCompareModeActive = models.compare.active;

    // if compare mode is active, check for subdaily in either A or B
    let subdaily;
    if (isCompareModeActive) {
      subdaily = models.layers.hasSubDaily('active') || models.layers.hasSubDaily('activeB');
    } else {
      subdaily = models.layers.hasSubDaily();
    }
console.log(models.date.selectedZoom)

console.log(models.date.customInterval, timeScaleFromNumberKey[models.date.customInterval], models.date.interval, timeScaleFromNumberKey[models.date.interval])
    // let subdaily = models.layers.hasSubDaily();
    if (!subdaily && (models.date.customInterval > 3 || models.date.interval > 3)) {
      setIntervalInput(1, 'day')
      self.reactComponent.setState({
        hasSubdailyLayers: subdaily
      }, changeTimeScale('day'));
    } else {
      self.reactComponent.setState({
        hasSubdailyLayers: subdaily
      });
    }
  };

  var onLayerUpdate = function() {
    self.data.set();
    self.resize();
    ui.anim.widget.update();
    updateSubdailyState();
  };

  var init = function() {
    var $timelineFooter = $('#timeline-footer');
    models.layers.events.trigger('toggle-subdaily');

    // check for compare mode
    let isCompareModeActive = models.compare.active;

    // if compare mode is active, check for subdaily in either A or B
    if (isCompareModeActive) {
      subdaily = models.layers.hasSubDaily('active') || models.layers.hasSubDaily('activeB');
    } else {
      subdaily = models.layers.hasSubDaily();
    }

    drawContainers();
    initInput();

    $('#zoom-custom').on('click', function() {
      self.reactComponent.setState({
        customIntervalModalOpen: true
      });
    });

    if (!models.anim) {
      // Hack: margin if anim is present
      $('#animate-button').hide();
      $timelineFooter.css('margin-left', self.margin.left - 1 + 'px');
      $timelineFooter.css('margin-right', self.margin.right - 1 + 'px');
    } else {
      $timelineFooter.css('margin-left', '0');
      $timelineFooter.css(
        'margin-right',
        self.margin.right + self.margin.left - 32 + 'px'
      );
    }

    // self.x = d3.time.scale.utc();
    self.resize();

    if (util.browser.localStorage) {
      if (localStorage.getItem('timesliderState') === 'collapsed') {
        self.collapse(true);
      }
    }

    // $('#timeline-hide').click(function() {
    //   googleTagManager.pushEvent({
    //     event: 'timeline_hamburger'
    //   });
    //   self.toggle();
    // });

    $(window).resize(function() {
      self.resize();
      // self.zoom.refresh();
      // self.setClip();
    });
    model.events.on('select', updateReactTimelineDate);
    model.events.on('state-update', updateReactTimelineDate);
    if (models.compare) {
      models.compare.events.on('toggle-state', onLayerUpdate);
      models.compare.events.on('toggle', onCompareModeToggle);
    }

    // model.events.on('zoom-change', updateTimeScaleState);
    model.events.on('interval-change', changeToSelectedInterval);

    models.layers.events.on('change', onLayerUpdate);

    // Determine maximum end date and move tl pick there if selected date is
    // greater than the max end date
    models.layers.events.on('remove', function() {
      var endDate = models.date.maxDate();
      var selectedDate = models.date[models.date.activeDate];
      onLayerUpdate();
      if (selectedDate > endDate) {
        models.date.select(endDate);
      }
    });

    models.proj.events.on('select', function() {
      self.resize();
      // self.setClip();
      onLayerUpdate();
    });
  };

  init();
  return self;
}
