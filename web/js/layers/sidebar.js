import $ from 'jquery';
import 'jquery-ui/tabs';
import 'jquery-ui/dialog';
import 'perfect-scrollbar/jquery';
import util from '../util/util';
import { GA as googleAnalytics } from 'worldview-components';

export function layersSidebar(models, config) {
  var collapsed = false;
  var collapseRequested = false;
  var productsIsOverflow = false;
  var mobile = false;
  var self = {};

  self.id = 'productsHolder';
  self.selector = '#productsHolder';
  self.events = util.events();

  var init = function () {
    render();
    $(window)
      .resize(resize);
    models.proj.events.on('select', onProjectionChange);
    resize();

    if (util.browser.localStorage) {
      if (localStorage.getItem('sidebarState') === 'collapsed') {
        self.collapseNow();
        collapseRequested = true;
      }
    }
  };

  self.selectTab = function (tabName) {
    if (tabName === 'active') {
      $(self.selector)
        .tabs('option', 'active', 0);
    } else if (tabName === 'events') {
      $(self.selector)
        .tabs('option', 'active', 1);
    } else if (tabName === 'download') {
      $(self.selector)
        .tabs('option', 'active', 2);
    } else {
      throw new Error('Invalid tab: ' + tabName);
    }
  };

  self.collapse = function (now) {
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
      .attr('title', 'Show Layer Selector');
    $('.accordionToggler')
      .html('Layers (' + models.layers.get()
        .length + ')');

    var speed = (now) ? undefined : 'fast';
    $('.products')
      .hide(speed);
    $('#' + self.id)
      .after($('.accordionToggler'));

    if (util.browser.localStorage) {
      localStorage.setItem('sidebarState', 'collapsed');
    }
  };

  self.collapseNow = function () {
    self.collapse(true);
  };

  self.expand = function (now) {
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
      .attr('title', 'Hide Layer Selector');
    $('.accordionToggler')
      .empty();
    var speed = (now) ? undefined : 'fast';
    $('.products')
      .show(speed, function () {
        models.wv.events.trigger('sidebar-expand');
      });
    $('.accordionToggler')
      .appendTo('#' + self.id + 'toggleButtonHolder');

    if (util.browser.localStorage) {
      localStorage.setItem('sidebarState', 'expanded');
    }
    // Resize after browser repaints
    setTimeout(function () {
      self.sizeEventsTab();
    }, 100);
  };

  self.expandNow = function () {
    self.expand(true);
  };

  self.toggle = function () {
    if (collapsed) {
      self.expand();
      collapseRequested = false;
    } else {
      self.collapse();
      collapseRequested = true;
    }
  };

  self.sizeEventsTab = function () {
    var $tabPanel = $('#wv-events');
    var $tabFooter = $tabPanel.find('footer');
    var footerIsVisible = $tabFooter.css('display') === 'block';
    var windowHeight = $(window).outerHeight(true);
    var tabBarHeight = $('ul#productsHolder-tabs').outerHeight(true);
    var distanceFromTop = $('#productsHolder').offset().top;
    var timelineHeight = $('#timeline').outerHeight(true);
    var footerHeight = footerIsVisible ? $tabFooter.outerHeight(true) : 0;
    $tabPanel.css('padding-bottom', footerHeight);
    var tabPadding = $tabPanel.outerHeight(true) - $tabPanel.height();

    // FIXME: -10 here is the timeline's bottom position from page, fix
    // after timeline markup is corrected to be loaded first
    var maxHeight = windowHeight - tabBarHeight - distanceFromTop - tabPadding;
    if (!util.browser.small) {
      maxHeight = maxHeight - timelineHeight - 10 - 5;
    }
    $tabPanel.css('max-height', maxHeight);
    $('.wv-eventslist').css('min-height', 1);

    var childrenHeight = $('#wv-eventscontent').outerHeight(true);

    if ((maxHeight <= childrenHeight)) {
      $('.wv-eventslist').css('height', maxHeight).css('padding-right', '10px');
      if (productsIsOverflow) {
        $('.wv-eventslist').perfectScrollbar('update');
      } else {
        $('.wv-eventslist').perfectScrollbar();
        productsIsOverflow = true;
      }
    } else {
      $('.wv-eventslist').css('height', '').css('padding-right', '');
      if (productsIsOverflow) {
        $('.wv-eventslist').perfectScrollbar('destroy');
        productsIsOverflow = false;
      }
    }
  };

  var render = function () {
    var $container = $(self.selector);
    $container.addClass('products');

    var $tabs = $('ul#productsHolder-tabs');

    var $activeTab = $('<li></li>')
      .addClass('layerPicker')
      .addClass('first')
      .attr('data-tab', 'active');

    var $activeLink = $('<a></a>')
      .attr('href', '#products')
      .addClass('activetab')
      .addClass('tab')
      .html('<i class=\'productsIcon selected icon-layers\' title=\'Layers\'></i> Layers');

    $activeTab.append($activeLink);
    $tabs.append($activeTab);

    if (config.features.naturalEvents) {
      var $eventsTab = $('<li></li>')
        .addClass('layerPicker')
        .addClass('second')
        .attr('data-tab', 'events');
      var $eventsLink = $('<a></a>')
        .attr('href', '#wv-events')
        .addClass('tab')
        .html('<i class=\'productsIcon selected icon-events\' title=\'Events\'></i> Events');
      $eventsTab.append($eventsLink);
      $tabs.append($eventsTab);
    }
    if (config.features.dataDownload) {
      var $downloadTab = $('<li></li>')
        .addClass('layerPicker')
        .addClass('third')
        .attr('data-tab', 'download');
      var $downloadLink = $('<a></a>')
        .attr('href', '#wv-data')
        .addClass('tab')
        .html('<i class=\'productsIcon selected icon-download\' title=\'Data\'></i> Data');
      $downloadTab.append($downloadLink);
      $tabs.append($downloadTab);
    }

    var $collapseContainer = $('div#productsHoldertoggleButtonHolder')
      .addClass('toggleButtonHolder');

    var $collapseButton = $('<a></a>')
      .addClass('accordionToggler')
      .addClass('atcollapse')
      .addClass('arrow')
      .attr('title', 'Hide');

    $collapseContainer.append($collapseButton);

    $container.tabs({
      beforeActivate: onBeforeTabChange,
      activate: onTabChange
    });

    $('.accordionToggler')
      .bind('click', self.toggle);
  };

  var onTabChange = function (e, ui) {
    var tab = ui.newTab.attr('data-tab');
    if (tab === 'events' || tab === 'download') {
      $('#wv-layers-options-dialog')
        .dialog('close');
    }
    self.events.trigger('selectTab', ui.newTab.attr('data-tab'));
    if (e.currentTarget) {
      e.currentTarget.blur();
    }
  };

  var onBeforeTabChange = function (e, ui) {
    var tab = ui.newTab.attr('data-tab');
    $('.ui-tabs-nav li.second').removeClass('ui-state-active');
    if (tab === 'active') {
      $('.ui-tabs-nav li.first').addClass('ui-state-active');
    } else if (tab === 'events') {
      googleAnalytics.event('Natural Events', 'Click', 'Events Tab');
      $('.ui-tabs-nav li.second').addClass('ui-state-active');
    } else if (tab === 'download') {
      $('.ui-tabs-nav li.third').addClass('ui-state-active');
    } else {
      throw new Error('Invalid tab index: ' + ui.index);
    }
    self.events.trigger('before-select', tab);
    return true;
  };

  var resize = function () {
    if (!mobile && util.browser.small) {
      self.collapseNow();
      mobile = true;
    } else if (mobile && !util.browser.small && !collapseRequested) {
      self.expandNow();
      mobile = false;
    }
  };

  var onProjectionChange = function () {
    if (collapsed) {
      $('.accordionToggler')
        .html('Layers (' + models.layers.get()
          .length + ')');
    }
  };

  init();
  return self;
};
