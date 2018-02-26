import $ from 'jquery';
import 'jquery-ui/sortable';
import 'jquery-ui/button';
import 'jquery-ui/dialog';
import 'jquery-ui/widget';
import 'jquery-ui/mouse';
import 'jquery-ui-touch-punch';
import 'perfect-scrollbar/jquery';
import d3 from 'd3';
import lodashEach from 'lodash/each';
import lodashEachRight from 'lodash/eachRight';
import util from '../util/util';
import wvui from '../ui/ui';
import { layersInfo } from './info';
import { layersOptions } from './options';
import { palettesLegend } from '../palettes/legend';

export function layersActive(models, ui, config) {
  var model = models.layers;
  var groups = util.LAYER_GROUPS;
  var legends = {};
  var self = {};
  self.id = 'products';
  self.selector = '#products';

  var init = function () {
    render();
    model.events
      .on('add', onLayerAdded)
      .on('remove', onLayerRemoved)
      .on('update', onLayerUpdate)
      .on('visibility', onLayerVisibility)
      .on('toggle-subdaily', toggleSubdaily)
      .on('set-zoom', setMaxZoomlevel);
    models.proj.events
      .on('select', onProjectionChanged);
    models.palettes.events
      .on('set-custom', onPaletteUpdate)
      .on('clear-custom', onPaletteUpdate)
      .on('range', onPaletteUpdate)
      .on('update', onPaletteUpdateAll);
    models.date.events
      .on('select', onDateChange);
    models.wv.events.on('sidebar-expand', sizeProductsTab);
    $(window)
      .resize(sizeProductsTab);
    ui.sidebar.events.on('selectTab', function (tab) {
      if (tab === 'active') {
        sizeProductsTab();
      }
    });

    ui.map.selected.getView()
      .on('change:resolution', onZoomChange);
  };

  var render = function () {
    legends = {};
    var $container = $('<div />', { class: 'layer-container bank' });
    $(self.selector).empty().append($container);

    lodashEachRight(groups, function (group) {
      renderGroup($container, group);
    });

    var $footer = $('<footer />');
    $footer.append($('<button />', {
      id: 'layers-add',
      class: 'action',
      text: '+ Add Layers'
    }));
    $('#products').append($footer);

    var $addBtn = $('#layers-add');
    $addBtn.button();
    $addBtn.click(function (e) {
      $('#layer-modal').dialog('open');
    });

    $('.layer-container .close')
      .off('click');
    $('.layer-container .hideReg')
      .off('click');

    $('.layer-container .close')
      .on('click', removeLayer);
    $('.layer-container .hideReg')
      .on('click', toggleVisibility);

    $('.layer-container ul.category')
      .sortable({
        items: 'li:not(.head)',
        cancel: 'a',
        axis: 'y',
        containment: 'parent',
        tolerance: 'pointer',
        placeholder: 'state-saver',
        cursorAt: { bottom: 20 }
      });
    $('.layer-container ul.category li')
      .disableSelection();
    $('.layer-container ul.category')
      .bind('sortstop', moveLayer);

    lodashEach(model.get({
      group: 'overlays'
    }), function (layer) {
      if (layer.palette) {
        renderLegendCanvas(layer);
      }
    });

    setTimeout(sizeProductsTab, 1000);
  };

  var renderGroup = function ($parent, group) {
    var $container = $('<ul></ul>')
      .attr('id', group.id)
      .addClass('category');

    var $header = $('<h3></h3>')
      .addClass('head')
      .attr('id', group.id + '-header')
      .html(group.description);

    $parent.append($header);

    lodashEach(model.get({
      group: group.id
    }), function (layer) {
      renderLayer($container, group, layer);
    });
    $parent.append($container);
  };

  var renderLayer = function ($parent, group, layer, top) {
    var $layer = $('<li></li>')
      .attr('id', group.id + '-' + encodeURIComponent(layer.id))
      .addClass(self.id + 'item')
      .addClass('item')
      .attr('data-layer', layer.id);

    var $visibleButton = $('<a></a>')
      .addClass('hdanchor hide hideReg bank-item-img')
      .attr('id', 'hide' + encodeURIComponent(layer.id))
      .attr('data-layer', layer.id)
      .on('click', toggleVisibility);

    var $visibleImage = $('<i></i>')
      .on('click', function () {
        $visibleButton.trigger('click');
      });

    $visibleButton.append($visibleImage);
    $layer.append($visibleButton);
    if (!model.available(layer.id)) {
      $layer
        .removeClass('layer-visible')
        .addClass('disabled')
        .addClass('layer-hidden');
      $visibleButton
        .attr('title', 'No data on selected date for this layer');
    } else {
      $layer
        .removeClass('disabled')
        .addClass('layer-enabled')
        .removeClass('layer-hidden');
      if (!layer.visible) {
        $visibleButton
          .attr('title', 'Show Layer')
          .attr('data-action', 'show')
          .parent()
          .addClass('layer-hidden');
      } else {
        $visibleButton
          .attr('title', 'Hide Layer')
          .attr('data-action', 'hide')
          .parent()
          .addClass('layer-visible');
      }
    }
    $layer.append($('<div></div>')
      .addClass('zot')
      .append('<b>!</b>'));
    if (model.available(layer.id)) {
      if (!layer.visible) {
        $visibleButton
          .attr('title', 'Show Layer')
          .attr('data-action', 'show')
          .parent()
          .addClass('layer-hidden');
      } else {
        $visibleButton
          .attr('title', 'Hide Layer')
          .attr('data-action', 'hide')
          .parent()
          .addClass('layer-visible');
      }
    }

    checkZots($layer, layer);

    var names = models.layers.getTitles(layer.id);

    var $removeButton = $('<a></a>')
      .attr('id', 'close' + group.id + encodeURIComponent(layer.id))
      .addClass('button close bank-item-img')
      .attr('data-layer', layer.id)
      .attr('title', 'Remove Layer')
      .on('click', removeLayer);
    var $removeImage = $('<i></i>');

    $removeButton.append($removeImage);

    var $infoButton = $('<a></a>')
      .attr('data-layer', layer.id)
      .attr('title', 'Layer description for ' + names.title)
      .addClass('wv-layers-info');
    if (!layer.description) {
      $infoButton
        .addClass('disabled')
        .attr('title', 'No layer description');
    } else {
      $infoButton.on('click', toggleInfoPanel);
    }
    if (util.browser.small) {
      $infoButton.hide();
    }

    var $infoIcon = $('<i></i>')
      .addClass('fa fa-info wv-layers-info-icon');

    $infoButton.append($infoIcon);

    var $editButton = $('<a></a>')
      .attr('data-layer', layer.id)
      .attr('title', 'Layer options for ' + names.title)
      .addClass('wv-layers-options');
    $editButton.on('click', toggleOptionsPanel);
    if (util.browser.small) {
      $editButton.hide();
    }

    var $gearIcon = $('<i></i>')
      .addClass('wv-layers-options-icon');

    $editButton.append($gearIcon);

    var $mainLayerDiv = $('<div></div>')
      .addClass('layer-main')
      .attr('data-layer', layer.id)
      .append($('<h4></h4>')
        .html(names.title)
        .attr('title', names.title))
      .append($('<p></p>')
        .html(names.subtitle));

    $layer.hover(function () {
      d3.select('#timeline-footer svg g.plot rect[data-layer="' + layer.id + '"]')
        .classed('data-bar-hovered', true);
    }, function () {
      d3.select('#timeline-footer svg g.plot rect[data-layer="' + layer.id + '"]')
        .classed('data-bar-hovered', false);
    });

    $mainLayerDiv.prepend($infoButton);
    $mainLayerDiv.prepend($editButton);
    $mainLayerDiv.prepend($removeButton);
    $layer.append($mainLayerDiv);

    if (layer.palette) {
      renderLegend($layer.find('.layer-main'), group, layer);
    }
    if (top) {
      $parent.prepend($layer);
    } else {
      $parent.append($layer);
    }
  };

  var toggleInfoPanel = function (e) {
    e.stopPropagation();
    var $i = $('#wv-layers-info-dialog');
    var thisLayerId = $(this)
      .attr('data-layer');
    var thisLayer = config.layers[thisLayerId];

    if ($i.length === 0) {
      layersInfo(config, models, thisLayer);
    } else if ($i.attr('data-layer') !== thisLayerId) {
      wvui.closeDialog();
      layersInfo(config, models, thisLayer);
    } else {
      wvui.closeDialog();
    }
  };

  var toggleOptionsPanel = function (e) {
    e.stopPropagation();
    var $d = $('#wv-layers-options-dialog');
    var thisLayerId = $(this)
      .attr('data-layer');
    var thisLayer = config.layers[thisLayerId];
    if ($d.length === 0) {
      layersOptions(config, models, thisLayer);
    } else if ($d.attr('data-layer') !== thisLayerId) {
      wvui.closeDialog();
      layersOptions(config, models, thisLayer);
    } else {
      wvui.closeDialog();
    }
  };

  var renderLegend = function ($parent, group, layer) {
    var $container = $('<div></div>')
      .addClass('wv-palette')
      .attr('data-layer', encodeURIComponent(layer.id));
    $parent.append($container);
  };

  var renderLegendCanvas = function (layer) {
    var selector = '.wv-palette[data-layer=\'' +
      util.jqueryEscape(layer.id) + '\']';
    legends[layer.id] = palettesLegend({
      selector: selector,
      config: config,
      models: models,
      layer: layer,
      ui: ui
    });
  };
  var productsIsOverflow = false;
  var sizeProductsTab = function () {
    var $tabPanel = $('#products');
    var $tabFooter = $tabPanel.find('footer');
    var windowHeight = $(window).outerHeight(true);
    var tabBarHeight = $('#productsHolder-tabs').outerHeight(true);
    var footerHeight = $tabFooter.outerHeight(true);
    var distanceFromTop = $('#productsHolder').offset().top;
    var overlaysHeight = $('#overlays').outerHeight(true);
    var baseLayersHeight = $('#baselayers').outerHeight(true);
    var layerGroupHeight = 26; // Height of layer group titles
    var contentHeight = overlaysHeight + baseLayersHeight + layerGroupHeight;
    var maxHeight;

    // If on a mobile device, use the native scroll bars
    if (!util.browser.small) {
      $('.wv-layers-options').show();
      $('.wv-layers-info').show();
    } else {
      $('.wv-layers-options').hide();
      $('.wv-layers-info').hide();
      wvui.closeDialog();
    }

    // FIXME: -10 here is the timeline's bottom position from page, fix
    // after timeline markup is corrected to be loaded first
    if (util.browser.small) {
      maxHeight = windowHeight - tabBarHeight - footerHeight - distanceFromTop - 10 - 5;
    } else {
      // FIXME: Hack, the timeline sometimes renders twice as large of a height and
      // creates a miscalculation here for timelineHeight
      maxHeight = windowHeight - tabBarHeight - footerHeight - distanceFromTop - /* timelineHeight */ 67 - 10 - 5;
    }

    $tabPanel.css('max-height', maxHeight);

    if ((maxHeight <= contentHeight)) {
      $('.layer-container').css('height', maxHeight).css('padding-right', '10px');
      $('.layer-container').perfectScrollbar();
      if (productsIsOverflow === false) productsIsOverflow = true;
    } else {
      $('.layer-container').css('height', '').css('padding-right', '');
      if (productsIsOverflow) {
        $('.layer-container').perfectScrollbar('destroy');
        productsIsOverflow = false;
      }
    }
  };

  var removeLayer = function (event) {
    var layerId = $(event.target)
      .attr('data-layer');
    setTimeout(function () {
      model.remove(layerId);
    }, 50);
  };

  var onLayerRemoved = function (layer) {
    var layerSelector = '#' + layer.group + '-' +
      util.jqueryEscape(layer.id);
    $(layerSelector)
      .remove();
    if (legends[layer.id]) {
      delete legends[layer.id];
    }
    toggleSubdaily();
    sizeProductsTab();
  };

  var onLayerAdded = function (layer) {
    var $container = $('#' + layer.group);

    renderLayer($container, groups[layer.group], layer, 'top');
    if (layer.palette) {
      renderLegendCanvas(layer);
    }
    toggleSubdaily();
    model.events.trigger('timeline-change');
    sizeProductsTab();
  };

  var subdailyCheck = function () {
    var activeLayers = models.layers.active;
    var currentProjection = models.proj.selected.id;
    var check;
    lodashEach(activeLayers, function(activeLayer) {
      if (Object.keys(activeLayer.projections).some(function(k) { return ~k.indexOf(currentProjection); })) {
        if (activeLayer.period === 'subdaily' && activeLayer.projections[currentProjection]) check = true;
      }
    });
    return check;
  };

  var setMaxZoomlevel = function (zoomLevel) {
    models.date.maxZoom = zoomLevel;
  };

  var toggleSubdaily = function () {
    if (subdailyCheck()) {
      document.getElementById('zoom-minutes').style.display = null;
      document.getElementById('input-wrapper-hour').style.display = null;
      document.getElementById('input-wrapper-minute').style.display = null;
      document.getElementById('timeline-header').classList.add('subdaily');
      setMaxZoomlevel(4);
      models.date.events.trigger('select');
      models.anim.events.trigger('change');
    } else {
      document.getElementById('zoom-minutes').style.display = 'none';
      document.getElementById('input-wrapper-hour').style.display = 'none';
      document.getElementById('input-wrapper-minute').style.display = 'none';
      document.getElementById('timeline-header').classList.remove('subdaily');
      document.getElementById('zoom-days').click(); // Switch back to 'Days' view
      setMaxZoomlevel(3);
      models.date.events.trigger('select');
      models.anim.events.trigger('change');
    }
  };

  var toggleVisibility = function () {
    if ($(this)
      .parent()
      .hasClass('disabled')) { return; }
    if ($(this)
      .attr('data-action') === 'show') {
      model.setVisibility($(this)
        .attr('data-layer'), true);
    } else {
      model.setVisibility($(this)
        .attr('data-layer'), false);
    }
  };

  var moveLayer = function (event, ui) {
    var $target = ui.item;
    var $next = $target.next();
    if ($next.length) {
      model.moveBefore($target.attr('data-layer'),
        $next.attr('data-layer'));
    } else {
      model.pushToBottom($target.attr('data-layer'));
    }
  };

  var onLayerUpdate = function () {
    // Timeout prevents redraw artifacts
    setTimeout(render, 1);
  };

  var onLayerVisibility = function (layer, visible) {
    var $element = $('.hideReg[data-layer=\'' + layer.id + '\']');
    if (visible) {
      $element.attr('data-action', 'hide')
        .attr('title', 'Hide Layer')
        .parent()
        .removeClass('layer-hidden')
        .addClass('layer-visible');
    } else {
      $element.attr('data-action', 'show')
        .attr('title', 'Show Layer')
        .parent()
        .removeClass('layer-visible')
        .addClass('layer-hidden');
    }
    onZoomChange();
  };

  var onPaletteUpdate = function (layerId) {
    if (legends[layerId]) {
      legends[layerId].update();
    }
  };

  var onPaletteUpdateAll = function () {
    lodashEach(legends, function (legend) {
      legend.update();
    });
  };

  var onProjectionChanged = function () {
    toggleSubdaily();
    // Timeout prevents redraw artifacts
    ui.map.selected.getView()
      .on('change:resolution', onZoomChange);
    setTimeout(render, 1);
  };
  var onZoomChange = function () {
    lodashEach(groups, function (group) {
      lodashEach(model.get({
        group: group.id
      }), function (layer) {
        var $layer = $('#products li.productsitem[data-layer="' +
          layer.id + '"]');
        checkZots($layer, layer);
      });
    });
  };
  var onDateChange = function () {
    lodashEach(groups, function (group) {
      lodashEach(model.get({
        group: group.id
      }), function (layer) {
        var $layer = $('#' + group.id + '-' + encodeURIComponent(layer.id));

        var $visibleButton = $('#' + 'hide' + encodeURIComponent(layer.id));

        if (!model.available(layer.id)) {
          $layer
            .removeClass('layer-visible')
            .removeClass('layer-enabled')
            .addClass('disabled')
            .addClass('layer-hidden');
          $visibleButton
            .attr('title', 'No data on selected date for this layer');
        } else {
          $layer
            .removeClass('layer-visible')
            .removeClass('disabled')
            .addClass('layer-enabled')
            .removeClass('layer-hidden');
          if (!layer.visible) {
            $visibleButton
              .attr('title', 'Show Layer')
              .attr('data-action', 'show')
              .parent()
              .addClass('layer-hidden');
          } else {
            $visibleButton
              .attr('title', 'Hide Layer')
              .attr('data-action', 'hide')
              .parent()
              .addClass('layer-visible');
          }
        }
        checkZots($layer, layer);
      });
    });
  };

  var checkZots = function ($layer, layer) {
    var map = ui.map;
    var zoom = map.selected.getView()
      .getZoom();
    var sources = config.sources;
    var proj = models.proj.selected.id;

    // Account for offset between the map's top zoom level and the
    // lowest-resolution TileMatrix in polar layers
    var zoomOffset = ((proj === 'arctic') || (proj === 'antarctic')) ? 1 : 0;

    var matrixSet = layer.projections[proj].matrixSet;

    if (matrixSet !== undefined) {
      var source = layer.projections[proj].source;
      var zoomLimit = sources[source]
        .matrixSets[matrixSet]
        .resolutions.length - 1 + zoomOffset;
      var $zot = $layer.find('div.zot');
      if (zoom > zoomLimit) {
        $zot.attr('title', 'Layer is overzoomed by ' +
          Math.round((zoom - zoomLimit) * 100) / 100 + 'x its maximum zoom level'
        );

        if (!($layer.hasClass('layer-hidden')) &&
          !($layer.hasClass('zotted'))) {
          $layer.addClass('zotted');
        } else if (($layer.hasClass('layer-hidden')) &&
          ($layer.hasClass('zotted'))) {
          $layer.removeClass('zotted');
        }
      } else {
        $zot.attr('title', 'Layer is overzoomed by ' +
          Math.round((zoom - zoomLimit) * 100) / 100 + 'x its maximum zoom level'
        );
        if ($layer.hasClass('zotted')) {
          $layer.removeClass('zotted');
        }
      }
    }
  };

  init();
  return self;
};
