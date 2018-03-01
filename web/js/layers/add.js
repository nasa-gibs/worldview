import $ from 'jquery';
import 'icheck';
import 'jscrollpane';
import lodashEach from 'lodash/each';
import lodashFind from 'lodash/find';
import lodashThrottle from 'lodash/throttle';
import util from '../util/util';

export function layersAdd(models, ui, config) {
  var jsp = null;

  var model = models.layers;
  var self = {};

  self.selector = '#selectorbox';
  self.id = 'selectorbox';

  var visible = {};

  var init = function () {
    lodashEach(config.layers, function (layer) {
      visible[layer.id] = true;
    });

    $(window)
      .resize(resize);

    model.events
      .on('add', onLayerAdded)
      .on('remove', onLayerRemoved);
    models.proj.events.on('select', onProjectionChange);
    models.wv.events.on('sidebar-expand', resize);
    ui.sidebar.events.on('selectTab', function (tab) {
      if (tab === 'add') {
        resize();
      }
    });
    // Rendering all the layers can take a half second or so. Place
    // in a timeout to make startup look fast. This should all be
    // replaced in the next version.
    setTimeout(function () {
      render();
      filter();
      resize();
    }, 1);
  };

  var render = function () {
    $(self.selector)
      .empty();

    var tabsHeight = $('.ui-tabs-nav')
      .outerHeight(true);
    $(self.selector)
      .addClass('selector');

    $(self.selector)
      .height(
        $(self.selector)
          .parent()
          .outerHeight() - tabsHeight
      );

    var $form = $('<div></div>')
      .attr('id', self.id + 'facetedSearch')
      .addClass('facetedSearch');

    var $search = $('<input>')
      .attr('id', self.id + 'search')
      .addClass('search')
      .attr('type', 'text')
      .attr('name', 'search')
      .attr('placeholder', 'Search ("aqua", "fire")')
      .attr('autocomplete', 'off');

    $form.append($search);
    $(self.selector)
      .append($form);

    var $content = $('<div></div>')
      .attr('id', self.id + 'content');

    renderType($content, 'baselayers', 'Base Layers', 'BaseLayers');
    renderType($content, 'overlays', 'Overlays', 'Overlays');
    $(self.selector)
      .append($content);
    $(self.selector + ' .selectorItem, ' + self.selector +
        ' .selectorItem input')
      .on('ifChecked', addLayer);
    $(self.selector + ' .selectorItem, ' + self.selector +
        ' .selectorItem input')
      .on('ifUnchecked', removeLayer);
    $(self.selector + 'select')
      .on('change', filter);
    $(self.selector + 'search')
      .on('keyup', filter);
    $(self.selector + 'search')
      .focus();

    $(self.selector)
      .iCheck({
        checkboxClass: 'iCheck iCheck-checkbox icheckbox_square-grey'
      });

    setTimeout(resize, 1);
  };

  var renderType = function ($parent, group, header, camelCase) {
    var $container = $('<div></div>')
      .attr('id', self.id + camelCase)
      .addClass('categoryContainer');

    var $header = $('<h3></h3>')
      .addClass('head')
      .html(header);

    var $element = $('<ul></ul>')
      .attr('id', self.id + group)
      .addClass(self.id + 'category')
      .addClass('category')
      .addClass('scroll-pane');

    lodashEach(config.layerOrder, function (layerId) {
      var layer = config.layers[layerId];
      if (!layer) {
        console.warn('In layer order but not defined', layerId);
      } else if (layer.group === group) {
        renderLayer($element, group, layerId);
      }
    });

    $container.append($header);
    $container.append($element);
    $parent.append($container);
  };

  var renderLayer = function ($parent, group, layerId) {
    var layer = config.layers[layerId];
    if (!layer) {
      console.warn('Skipping unknown layer', layerId);
      return;
    }
    var $label = $('<label></label>')
      .attr('data-layer', encodeURIComponent(layer.id));
    var $element = $('<li></li>')
      .addClass('selectorItem')
      .attr('data-layer', encodeURIComponent(layer.id))
      .addClass('item');

    var names = models.layers.getTitles(layer.id);
    var $name = $('<h4></h4>')
      .addClass('title')
      .html(names.title);
    if (config.parameters.markPalettes) {
      if (layer.palette) {
        $name.addClass('mark');
      }
    }
    if (config.parameters.markDownloads) {
      if (layer.product) {
        $name.addClass('mark');
      }
    }
    var $description = $('<p></p>')
      .addClass('subtitle')
      .html(names.subtitle);

    var $checkbox = $('<input></input>')
      .attr('id', encodeURIComponent(layer.id))
      .attr('value', layer.id)
      .attr('type', 'checkbox')
      .attr('data-layer', layer.id);
    if (group === 'baselayers') {
      $checkbox.attr('name', group);
    }
    if (lodashFind(model.active, {
      id: layer.id
    })) {
      $checkbox.attr('checked', 'checked');
    }

    $element.append($checkbox);
    $element.append($name);
    $element.append($description);

    $label.append($element);
    $parent.append($label);
  };

  var adjustCategoryHeights = function () {
    var heights = [];
    var facetsHeight =
      $(self.selector + 'facetedSearch')
        .outerHeight(true);
    var containerHeight =
      $(self.selector)
        .outerHeight(true) - facetsHeight;
    $(self.selector + 'content')
      .height(containerHeight);
    var labelHeight = 0;
    $(self.selector + 'content .head')
      .each(function () {
        labelHeight += $(this)
          .outerHeight(true);
      });
    containerHeight -= labelHeight;

    $.each(['baselayers', 'overlays'], function (i, group) {
      var actualHeight = 0;
      var count = 0;
      $(self.selector + group + ' li')
        .each(function () {
          var layerId = decodeURIComponent($(this)
            .attr('data-layer'));
          if (visible[layerId]) {
            actualHeight += $(this)
              .outerHeight(true);
            count++;
          }
        });

      heights.push({
        name: self.id + group,
        height: actualHeight,
        count: count
      });
    });

    if (heights[0].height + heights[1].height > containerHeight) {
      if (heights[0].height > containerHeight / 2) {
        heights[0].height = containerHeight / 2;
      }
      heights[1].height = containerHeight - heights[0].height;
    }
    $('#' + heights[0].name)
      .css('height', heights[0].height + 'px');
    $('#' + heights[1].name)
      .css('height', heights[1].height + 'px');
    reinitializeScrollbars();
  };

  var reinitializeScrollbars = function () {
    $('.' + self.id + 'category')
      .each(function () {
        var api = $(this)
          .data('jsp');
        if (api) {
          api.reinitialise();
        }
      });
  };

  var resize = function () {
    var tabsHeight = $('.ui-tabs-nav')
      .outerHeight(true);
    $(self.selector)
      .height($(self.selector)
        .parent()
        .outerHeight() - tabsHeight);

    if (jsp) {
      var api = jsp.data('jsp');
      if (api) {
        api.destroy();
      }
    }
    if (util.browser.ie) {
      jsp = $('.' + self.id + 'category')
        .jScrollPane({
          verticalDragMinHeight: 20,
          autoReinitialise: false,
          verticalGutter: 0,
          mouseWheelSpeed: 60
        });
    } else {
      jsp = $('.' + self.id + 'category')
        .jScrollPane({
          verticalDragMinHeight: 20,
          autoReinitialise: false,
          verticalGutter: 0
        });
    }
    adjustCategoryHeights();
  };

  var addLayer = function () {
    model.add(decodeURIComponent($(this)
      .attr('data-layer')));
  };

  var removeLayer = function () {
    model.remove(decodeURIComponent($(this)
      .attr('data-layer')));
  };

  var onLayerAdded = function (layer) {
    var $element = $('#selectorbox [data-layer=\'' +
      util.jqueryEscape(layer.id) + '\']');
    $element.iCheck('check');
  };

  var onLayerRemoved = function (layer) {
    var $element = $('#selectorbox [data-layer=\'' +
      util.jqueryEscape(layer.id) + '\']');
    $element.iCheck('uncheck');
  };

  var onProjectionChange = function () {
    adjustTitles();
    filter();
  };

  var adjustTitles = function () {
    lodashEach(config.layers, function (def) {
      var names = models.layers.getTitles(def.id);
      $('#selectorbox [data-layer=\'' + encodeURIComponent(def.id) +
          '\'] .title')
        .html(names.title);
      $('#selectorbox [data-layer=\'' + encodeURIComponent(def.id) +
          '\'] .subtitle')
        .html(names.subtitle);
    });
  };

  var searchTerms = function () {
    var search = $(self.selector + 'search')
      .val()
      .toLowerCase();
    var terms = search.split(/ +/);
    return terms;
  };

  var filterProjection = function (layer) {
    return !layer.projections[models.proj.selected.id];
  };

  var filterSearch = function (layer, terms) {
    var search = $(self.selector + 'search')
      .val();
    if (search === '') {
      return false;
    }
    var filtered = false;
    var names = models.layers.getTitles(layer.id);
    $.each(terms, function (index, term) {
      filtered = !names.title.toLowerCase()
        .contains(term) &&
        !names.subtitle.toLowerCase()
          .contains(term) &&
        !names.tags.toLowerCase()
          .contains(term);
      if (filtered) {
        return false;
      }
    });
    return filtered;
  };

  var filter = lodashThrottle(function () {
    var search = searchTerms();
    $.each(config.layers, function (layerId, layer) {
      var fproj = filterProjection(layer);
      var fterms = filterSearch(layer, search);
      var filtered = fproj || fterms;
      var display = filtered ? 'none' : 'block';
      var selector = '#selectorbox li[data-layer=\'' +
        util.jqueryEscape(layerId) + '\']';
      $(selector)
        .css('display', display);
      visible[layer.id] = !filtered;
    });
    adjustCategoryHeights();
  }, 250, {
    trailing: true
  });

  init();
  return self;
};
