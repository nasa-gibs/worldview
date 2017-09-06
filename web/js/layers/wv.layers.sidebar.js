/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

/**
 * @module wv.layers
 */
var wv = wv || {};
wv.layers = wv.layers || {};

/**
 * @class wv.layers.sidebar
 */
wv.layers.sidebar = wv.layers.sidebar || function(models, config) {

  var HTML_TAB_ACTIVE_SELECTED =
    "<i class='productsIcon selected icon-layers'></i>" +
    "Layers";

  var HTML_TAB_ACTIVE_UNSELECTED =
    "<i class='productsIcon selected icon-layers' title='Active Layers'></i>" +
    "Layers";

  var HTML_TAB_EVENTS_SELECTED =
    "<i class='selected icon-events'></i>" +
    "Events";

  var HTML_TAB_EVENTS_UNSELECTED =
    "<i class='selected icon-events' title='Events'></i>" +
    "Events";

  var HTML_TAB_DOWNLOAD_SELECTED =
    "<i class='productsIcon selected icon-download'></i>" +
    "Data";

  var HTML_TAB_DOWNLOAD_UNSELECTED =
    "<i class='productsIcon selected icon-download' title='Data'></i>" +
    "Data";

  var collapsed = false;
  var collapseRequested = false;
  var productsIsOverflow = false;
  var portrait = false;
  var mobile = false;
  var self = {};

  self.id = "productsHolder";
  self.selector = "#productsHolder";
  self.events = wv.util.events();

  var init = function() {
    render();
    $(window)
      .resize(resize);
    models.proj.events.on("select", onProjectionChange);
    resize();

    if (wv.util.browser.localStorage) {
      if (localStorage.getItem("sidebarState") === "collapsed") {
        self.collapseNow();
        collapseRequested = true;
      }
    }
  };

  self.selectTab = function(tabName) {

    if (tabName === "active") {
      $(self.selector)
        .tabs("option", "active", 0);
    } else if (tabName === "events") {
      $(self.selector)
        .tabs("option", "active", 1);
    } else if (tabName === "download") {
      $(self.selector)
        .tabs("option", "active", 2);
    } else {
      throw new Error("Invalid tab: " + tabName);
    }
  };

  self.collapse = function(now) {
    if (collapsed) {
      return;
    }
    collapsed = true;
    $('.accordionToggler')
      .removeClass('atcollapse')
      .addClass('dateHolder')
      .removeClass('arrow')
      .addClass('staticLayers');
    $('.accordionToggler')
      .attr("title", "Show Layer Selector");
    $('.accordionToggler')
      .html("Layers (" + models.layers.get()
        .length + ")");

    var speed = (now) ? undefined : "fast";
    $('.products')
      .hide(speed);
    $("#" + self.id)
      .after($('.accordionToggler'));

    if (wv.util.browser.localStorage) {
      localStorage.setItem("sidebarState", "collapsed");
    }
  };

  self.collapseNow = function() {
    self.collapse(true);
  };

  self.expand = function(now) {
    if (!collapsed) {
      return;
    }
    collapsed = false;
    $('.accordionToggler')
      .removeClass('atexpand')
      .addClass('atcollapse')
      .removeClass('staticLayers dateHolder')
      .addClass('arrow');
    $('.accordionToggler')
      .attr("title", "Hide Layer Selector");
    $('.accordionToggler')
      .empty();
    var speed = (now) ? undefined : "fast";
    $('.products')
      .show(speed, function() {
        models.wv.events.trigger("sidebar-expand");
      });
    $('.accordionToggler')
      .appendTo("#" + self.id + "toggleButtonHolder");

    if (wv.util.browser.localStorage) {
      localStorage.setItem("sidebarState", "expanded");
    }
  };

  self.expandNow = function() {
    self.expand(true);
  };

  self.toggle = function() {
    if (collapsed) {
      self.expand();
      collapseRequested = false;
    } else {
      self.collapse();
      collapseRequested = true;
    }
  };

  self.sizeEventsTab = function() {
    var winSize = $(window).outerHeight(true);
    var headSize = $('ul#productsHolder-tabs').outerHeight(true);
    var head2Size = $('#wv-events-facets').outerHeight(true);
    var secSize = $('#productsHolder').innerHeight() - $('#productsHolder').height();
    var offset = $('#productsHolder').offset();
    var timeSize = $('#timeline').outerHeight(true);
    var footerSize = $('#productsHolder footer').outerHeight(true);

    //FIXME: -10 here is the timeline's bottom position from page, fix
    // after timeline markup is corrected to be loaded first
    var maxHeight = winSize - headSize - head2Size -
      offset.top - secSize - footerSize;
    if (!wv.util.browser.small) {
      maxHeight = maxHeight - timeSize - 10 - 5;
    }
    $('#wv-events').css('max-height', maxHeight);

    var childrenHeight =
      $('#wv-eventscontent').outerHeight(true);

    if ((maxHeight <= childrenHeight)) {
      $('#wv-events').css('height', maxHeight).css('padding-right', '10px');
      if (productsIsOverflow) {
        $('#wv-events').perfectScrollbar('update');
      } else {
        $('#wv-events').perfectScrollbar();
        productsIsOverflow = true;
      }
    } else {
      $('#wv-events').css('height', '').css('padding-right', '');
      if (productsIsOverflow) {
        $('#wv-events').perfectScrollbar('destroy');
        productsIsOverflow = false;
      }
    }
  };

  var render = function() {

    var $container = $(self.selector);
    $container.addClass("products");

    var $tabs = $("ul#productsHolder-tabs");

    var $activeTab = $("<li></li>")
      .addClass("layerPicker")
      .addClass("first")
      .attr("data-tab", "active");

    $(self.selector + " footer button")
      .hide();
    $("#layers-add")
      .show();

    var $activeLink = $("<a></a>")
      .attr("href", "#products")
      .addClass("activetab")
      .addClass("tab")
      .html(HTML_TAB_ACTIVE_SELECTED);

    $activeTab.append($activeLink);
    $tabs.append($activeTab);

    if (config.features.naturalEvents) {
      var $eventsTab = $("<li></li>")
        .addClass("layerPicker")
        .addClass("second")
        .attr("data-tab", "events");
      var $eventsLink = $("<a></a>")
        .attr("href", "#wv-events")
        .addClass("tab")
        .html(HTML_TAB_EVENTS_UNSELECTED);
      $eventsTab.append($eventsLink);
      $tabs.append($eventsTab);
    }
    if (config.features.dataDownload) {
      var $downloadTab = $("<li></li>")
        .addClass("layerPicker")
        .addClass("third")
        .attr("data-tab", "download");
      var $downloadLink = $("<a></a>")
        .attr("href", "#wv-data")
        .addClass("tab")
        .html(HTML_TAB_DOWNLOAD_UNSELECTED);
      $downloadTab.append($downloadLink);
      $tabs.append($downloadTab);
    }

    //$container.append($tabs);
    var $collapseContainer = $("div#productsHoldertoggleButtonHolder")
      .addClass("toggleButtonHolder");

    var $collapseButton = $("<a></a>")
      .addClass("accordionToggler")
      .addClass("atcollapse")
      .addClass("arrow")
      .attr("title", "Hide");

    $collapseContainer.append($collapseButton);

    $container.tabs({
      beforeActivate: onBeforeTabChange,
      activate: onTabChange
    });

    $('.accordionToggler')
      .bind('click', self.toggle);
  };

  var onTabChange = function(e, ui) {
    var tab = ui.newTab.attr("data-tab");
    if (tab === "events" || tab === "download") {
      $("#wv-layers-options-dialog")
        .dialog("close");
    }
    self.events.trigger('selectTab', ui.newTab.attr("data-tab"));
    if (e.currentTarget) {
      e.currentTarget.blur();
    }
  };

  var onBeforeTabChange = function(e, ui) {
    var $footerBtns = $(self.selector + " footer");
    // FIXME: This code is very clunky.
    var tab = ui.newTab.attr("data-tab");
    if (tab === "active") {
      $('.ui-tabs-nav')
        .addClass('firstselected')
        .removeClass('secondselected')
        .removeClass('thirdselected');
      $('.ui-tabs-nav li.first')
        .addClass("ui-state-active");
      $('.ui-tabs-nav li.second')
        .removeClass("ui-state-active");
      $('.ui-tabs-nav li.third')
        .removeClass("ui-state-active");
      $footerBtns.find('.footer-content').hide();
      $("#layers-add").show();
    } else if (tab === "events") {
      WVC.GA.event('Natural Events', 'Click', 'Events Tab');
      $('.ui-tabs-nav')
        .removeClass('firstselected')
        .addClass('secondselected')
        .removeClass('thirdselected');
      $('.ui-tabs-nav li.first')
        .removeClass("ui-state-active");
      $('.ui-tabs-nav li.second')
        .addClass("ui-state-active");
      $('.ui-tabs-nav li.third')
        .removeClass("ui-state-active");
      $footerBtns.find('.footer-content').hide();
      $("#show-all-events").show();
      $("#show-all-events-note").show();
    } else if (tab === "download") {
      $('.ui-tabs-nav')
        .removeClass('firstselected')
        .removeClass('secondselected')
        .addClass('thirdselected');
      $('.ui-tabs-nav li.first')
        .removeClass("ui-state-active");
      $('.ui-tabs-nav li.second')
        .removeClass("ui-state-active");
      $('.ui-tabs-nav li.third')
        .addClass("ui-state-active");
      $footerBtns.find('.footer-content').hide();
      $("#wv-data-download-button").show();
    } else {
      throw new Error("Invalid tab index: " + ui.index);
    }

    var tab1 = (tab === "active") ?
      HTML_TAB_ACTIVE_SELECTED : HTML_TAB_ACTIVE_UNSELECTED;
    var tab2 = (tab === "events") ?
      HTML_TAB_EVENTS_SELECTED : HTML_TAB_EVENTS_UNSELECTED;
    var tab3 = (tab === "download") ?
      HTML_TAB_DOWNLOAD_SELECTED : HTML_TAB_DOWNLOAD_UNSELECTED;

    self.events.trigger("before-select", tab);

    $('.ui-tabs-nav li.first a')
      .html(tab1);
    $('.ui-tabs-nav li.second a')
      .html(tab2);
    $('.ui-tabs-nav li.third a')
      .html(tab3);

    return true;
  };

  var resize = function() {
    if (!mobile && wv.util.browser.small) {
      self.collapseNow();
      mobile = true;
    } else if (mobile && !wv.util.browser.small && !collapseRequested) {
      self.expandNow();
      mobile = false;
    }
  };

  var onProjectionChange = function() {
    if (collapsed) {
      $('.accordionToggler')
        .html("Layers (" + models.layers.get()
          .length + ")");
    }
  };

  init();
  return self;

};
