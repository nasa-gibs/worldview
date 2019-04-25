import util from '../util/util';
import d3 from 'd3';
import React from 'react';
import ReactDOM from 'react-dom';
import googleTagManager from 'googleTagManager';
import Timeline from '../components/timeline/timeline';

export function timeline(models, config, ui) {
  var self = {};
  var model = models.date;
  let subdaily = models.layers.hasSubDaily();
  self.enabled = false;
  self.startDate = new Date(config.startDate);
  self.parentOffset = (subdaily ? 404 : 310) + 10;

  // self.delta = 1;
  self.active = false;
  self.delay = 500;
  var animator = null;
  var keyDown;

  let animationInProcess = false;

  var $incrementBtn = $('#right-arrow-group');
  var $decrementBtn = $('#left-arrow-group');

  var initInput = function() {
    models.layers.events.on('subdaily-updated', updateMaxZoom);
    document.addEventListener('keydown', function(event) {
      if (event.target.nodeName === 'INPUT' || keyDown === event.keyCode) {
        return;
      }
      // get selected interval and customDelta or default of 1
      let interval = models.date.interval;
      let delta = models.date.customSelected === true ? models.date.customDelta : 1;
      switch (event.keyCode) {
        case util.key.LEFT:
          // prevent quick LEFT/RIGHT arrow switch bug
          if (keyDown !== event.keyCode) {
            stopper();
          }
          self.animateByIncrement(-delta, timeScaleFromNumberKey[interval]);
          event.preventDefault();
          break;
        case util.key.RIGHT:
          // prevent quick LEFT/RIGHT arrow switch bug
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

    if (config.features.compare) {
      let dateModel = models.date;
      dateModel.events.on('state-update', () => {
        self.reactComponent.setState({
          date: dateModel[dateModel.activeDate]
        });
        updateInput();
      });
    }
    updateInput();
  };

  var updateMaxZoom = function() {
    let subdaily = models.layers.hasSubDaily();

    // if (model.maxZoom >= 4) {
    if (subdaily) {
      // document.getElementById('timeline-header').classList.add('subdaily');
    } else {
      // if (ui.timeline && ui.timeline.config.currentZoom > 3) {
      if (ui.timeline && !subdaily) {
        document.getElementById('zoom-days').click();
      }
      // document.getElementById('timeline-header').classList.remove('subdaily');
    }

    // self.reactComponent.setState({ maxZoom: model.maxZoom });
    // model.events.trigger('update-timewheel');
  };

  var updateInput = function(date) {
    var ms = date || new Date(model[model.activeDate]);
    var endDate = models.layers.lastDate();
    var endDateTime = models.layers.lastDateTime();
    let nt = new Date(ms);
    let nd = new Date(ms);
    let pd = new Date(ms);

    nt = new Date(nt.setUTCMinutes(nt.getUTCMinutes() + 10));
    nd = new Date(nd.setUTCDate(nd.getUTCDate() + 1));
    pd = new Date(pd.setUTCDate(pd.getUTCDate() - 1));

    // Disable arrows if nothing before/after selection
    if (model.selectedZoom > 3 && nt >= endDateTime) {
      $incrementBtn.addClass('button-disabled');
    } else if (model.selectedZoom < 4 && nd > endDate) {
      $incrementBtn.addClass('button-disabled');
    } else {
      $incrementBtn.removeClass('button-disabled');
    }
    if (pd.toUTCString() === self.startDate.toUTCString()) {
      $decrementBtn.addClass('button-disabled');
    } else {
      $decrementBtn.removeClass('button-disabled');
    }

    // tl.pick.update();
  };

  /**
   * @param  {Number} delta Date and direction to change
   * @param  {Number} increment Zoom level of change
   *                  e.g. months,minutes, years, days
   * @return {Object} JS Date Object
   */
  var getNextTimeSelection = function(delta, increment) {
    var prevDate = model[model.activeDate];
    console.log(prevDate)
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
    console.log(delta, increment)
    var endTime = models.layers.lastDateTime();
    var endDate = models.layers.lastDate();
    // self.delta = Math.abs(delta);

    let subdaily = models.layers.hasSubDaily();
    function animate() {
      var nextTime = getNextTimeSelection(delta, increment);
      console.log(nextTime)
      // console.log(tl.data.start(), nextTime, endTime, increment)
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
    console.log(animationInProcess)
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
    // var maxZoom = model.maxZoom;
    // if (model.maxZoom >= 4 || config.parameters.showSubdaily) {
    //   document.getElementById('timeline-header').classList.add('subdaily');
    //   maxZoom = 4;
    // }

    return {
      width: '120',
      height: '30',
      id: 'main',
      idSuffix: 'animation-widget-main',
      minDate: min,
      maxDate: max,
      // maxZoom: maxZoom,
      // onDateChange: onDateSelect,
      date: date,
      fontSize: null
    };
  };

  // var onDateSelect = function(date) {
  //   console.log(date)
  //   models.date.select(date);
  // };

  // ? INPUT ABOVE
  // ? INPUT ABOVE
  // ? INPUT ABOVE
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
    // let subdaily = models.layers.hasSubDaily();
    // check for compare mode
    let isCompareModeActive = models.compare.active;

    // if compare mode is active, check for subdaily in either A or B
    let subdaily;
    if (isCompareModeActive) {
      subdaily = models.layers.hasSubDaily('active') || models.layers.hasSubDaily('activeB');
    } else {
      subdaily = models.layers.hasSubDaily();
    }
    self.parentOffset = (subdaily ? 404 : 310) + 10;

    self.width =
      $(window).outerWidth(true) -
      // $('#timeline-header').outerWidth(true) -
      // $('#timeline-hide').outerWidth(true) -
      self.parentOffset -
      20 -
      20 -
      self.margin.left -
      self.margin.right +
      28;
    return self.width;
  };

  self.height = 65 - self.margin.top - self.margin.bottom;

  self.isCropped = true;

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

  // self.expandNow = function() {
  //   self.expand(true);
  // };

  self.collapse = function(now) {
    now = now || false;
    var tl = $('#timeline-footer');
    if (!tl.is(':hidden')) {
      self.toggle(now);
    }
  };

  // self.collapseNow = function() {
  //   self.collapse(true);
  // };

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
    // self.expand(true);
    console.log(increment, timeScale)
    self.animateByIncrement(increment, timeScale);
    // let newDate = models.date[models.date.activeDate];
    // models.date.add(timeScale, increment);
    // self.input.animateByIncrement(increment, timeScale);
    // models.date.select(date);
    // self.reactComponent.setState({
    //   selectedDate: newDate,
    //   dateFormatted: new Date(newDate).toISOString()
    // });
  };

  // invoked when compare mode is toggled

  // # rework in order to allow A and B dates to persist on reopening dialog
  var onCompareModeToggle = () => {
    self.getWidth();
    let isCompareModeActive = models.compare.active;
    if (!isCompareModeActive) {
      let activeDate = models.date.activeDate;
      let active = activeDate === 'selected' ? 'active' : 'activeB';
      let hasSubDaily = models.layers.hasSubDaily(active);
      // let date = models.date[activeDate];
      // let dateFormatted = new Date(date).toISOString();
      self.reactComponent.setState({
        compareModeActive: isCompareModeActive,
        // selectedDate: date,
        // dateFormatted: dateFormatted,
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

  var onChangeSelectedDragger = (selectionStr) => {
    console.log(selectionStr, models.date.selected, models.date.selectedB)
    let isCompareModeActive = models.compare.active;
    if (isCompareModeActive) {
      models.compare.toggleState();
    }
    self.reactComponent.setState({
      draggerSelected: selectionStr
    });
  };

  var updateDate = (date, selectionStr) => {
    console.log(date, selectionStr, models.date.selected, models.date.selectedB)

    // console.log(date, selectionStr)
    let updatedDate = new Date(date);
    // console.log(models)
    // self.input.update(updatedDate);
    // models.date.setActiveDate(updatedDate);
    // console.log('updateDate', date, updatedDate)
    //# ALLOWS UPDATE OF MODELS DATE WHICH LAYERS IS CONNECTED TO
    models.date.select(updatedDate, selectionStr);
  };

  var setIntervalInput = (intervalValue, zoomLevel) => {
    models.date.setCustomInterval(intervalValue, timeScaleToNumberKey[zoomLevel]);
    let zoomCustomText = document.querySelector('#zoom-custom');
    zoomCustomText.textContent = `${intervalValue} ${zoomLevel.toUpperCase().substr(0, 3)}`;
    // model.events.trigger('zoom-change');
    self.reactComponent.setState({
      timeScaleChangeUnit: zoomLevel,
      customIntervalValue: intervalValue,
      customIntervalZoomLevel: zoomLevel,
      intervalChangeAmt: intervalValue,
      customIntervalModalOpen: false
    });
  };

  var setSelectedInterval = (interval, intervalChangeAmt, customSelected) => {
    models.date.setSelectedInterval(timeScaleToNumberKey[interval], customSelected);
    self.reactComponent.setState({
      timeScaleChangeUnit: interval,
      customSelected: customSelected,
      intervalChangeAmt: intervalChangeAmt,
      customIntervalModalOpen: customSelected
    });
  };

  var changeToSelectedInterval = () => {
    // debugger
    console.log(models.date)
    let customSelected = models.date.customSelected;
    let timeScaleInterval = timeScaleFromNumberKey[models.date.interval];
    let timeScaleChangeUnit = timeScaleFromNumberKey[models.date.customInterval];
    let intervalChangeAmt = models.date.customDelta;

    // let valueText = customSelected ? intervalChangeAmt : 1;
    // let intervalUnitText = customSelected ? timeScaleChangeUnit.toUpperCase().substr(0, 3) : timeScaleInterval.toUpperCase().substr(0, 3);

    // let zoomCustomText = document.querySelector('#zoom-custom');
    // zoomCustomText.textContent = `${valueText} ${intervalUnitText}`;

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

    // let zoomCustomText = document.querySelector('#zoom-custom');
    // zoomCustomText.textContent = `${intervalValue} ${zoomLevel.toUpperCase().substr(0, 3)}`;
    // // model.events.trigger('zoom-change');
    // self.reactComponent.setState({
    //   timeScaleChangeUnit: zoomLevel,
    //   customIntervalValue: intervalValue,
    //   customIntervalZoomLevel: zoomLevel,
    //   intervalChangeAmt: intervalValue,
    //   customIntervalModalOpen: false
    // });


    // // check if selected interval is custom

    // // if custom, check if custom has been set or if still 'custom' text/null state

    // // open custom panel
    // let customIntervalModalOpen = false;

    // let timeScaleChangeUnit = self.customInterval;
    // let customSelected = true;
    // let intervalChangeAmt = self.customDelta;

    // self.customSelected = null; // boolean
    // self.customDelta = null; // number
    // self.customInterval = null;
  };

  var clickAnimationButton = () => {
    // console.log(ui);
  };

  var changeTimeScale = (timeScale) => {
    // console.log(timeScale, timeScaleToNumberKey[timeScale])
    // models.date.selectedZoom = timeScaleToNumberKey[timeScale];
    models.date.setSelectedZoom(timeScaleToNumberKey[timeScale]);
    // model.events.trigger('zoom-change');
    // self.reactComponent.setState({
    //   timeScale: timeScale
    // });
    updateTimeScaleState();
  };

  var updateTimeScaleState = () => {
    let timeScale = timeScaleFromNumberKey[models.date.selectedZoom];
    self.reactComponent.setState({
      timeScale: timeScale
    });
  };

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

  var getInitialProps = () => {
    // check for compare mode
    let isCompareModeActive = models.compare.active;
    console.log(models.date.customSelected)
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

    let selectedDate = models.date.selected;
    let selectedDateB = models.date.selectedB ? models.date.selectedB : null;


    // custom interval
    let intervalTimeScale = models.date.customInterval ? timeScaleFromNumberKey[models.date.customInterval] : selectedTimeScale;
    let intervalDelta = models.date.customDelta ? models.date.customDelta : 1;

    let customSelected = models.date.customSelected ? Boolean(models.date.customSelected) : false;

    let intervalSelected = models.date.interval ? timeScaleFromNumberKey[models.date.interval] : selectedTimeScale;

    let draggerSelected = models.date.activeDate;
    let inputProps = getInputProps();

    let dateFormatted = selectedDate ? new Date(selectedDate).toISOString() : '';
    let dateFormattedB = selectedDateB ? new Date(selectedDateB).toISOString() : '';
    return Object.assign(inputProps, {
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
      customSelected: customSelected
    });
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

  // arguments passed as date (date object) and selectionStr ('selected' or 'selectedB')
  var updateTimeUi = function(date, selectionStr) {
    updateReactTimelineDate(date, selectionStr);
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

    // let subdaily = models.layers.hasSubDaily();
    if (!subdaily && models.date.selectedZoom > 3) {
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
    model.events.on('select', updateTimeUi);
    model.events.on('state-update', updateTimeUi);
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
