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
 * @class wv.layers.add
 */
wv.layers.add = wv.layers.add || function(models, ui, config) {

  var jsp = null;

  var model = models.layers;
  var self = {};

  self.selector = "#selectorbox";
  self.id = "selectorbox";

  var visible = {};

  var init = function() {
    _.each(config.layers, function(layer) {
      visible[layer.id] = true;
    });

    $(window)
      .resize(resize);

    model.events
      .on("add", onLayerAdded)
      .on("remove", onLayerRemoved);
    models.proj.events.on("select", onProjectionChange);
    models.wv.events.on("sidebar-expand", resize);
    ui.sidebar.events.on("selectTab", function(tab) {
      if (tab === "add") {
        resize();
      }
    });
    // Rendering all the layers can take a half second or so. Place
    // in a timeout to make startup look fast. This should all be
    // replaced in the next version.
    setTimeout(function() {
      render();
      filter();
      resize();
    }, 1);
  };

  var render = function() {
    $(self.selector)
      .empty();

    var tabs_height = $(".ui-tabs-nav")
      .outerHeight(true);
    $(self.selector)
      .addClass('selector');

    $(self.selector)
      .height(
        $(self.selector)
          .parent()
          .outerHeight() - tabs_height
      );

    var $form = $("<div></div>")
      .attr("id", self.id + "facetedSearch")
      .addClass("facetedSearch");

    if (config.aoi) {
      var $select = $("<select></select>")
        .attr("id", self.id + "select")
        .addClass("select");

      $form.append($select);
    }

    var $search = $("<input>")
      .attr("id", self.id + "search")
      .addClass("search")
      .attr("type", "text")
      .attr("name", "search")
      .attr("placeholder", 'Search ("aqua", "fire")')
      .attr("autocomplete", "off");

    $form.append($search);
    $(self.selector)
      .append($form);

    var $content = $("<div></div>")
      .attr("id", self.id + "content");

    renderType($content, "baselayers", "Base Layers", "BaseLayers");
    renderType($content, "overlays", "Overlays", "Overlays");
    $(self.selector)
      .append($content);
    $(self.selector + " .selectorItem, " + self.selector +
        " .selectorItem input")
      .on('ifChecked', addLayer);
    $(self.selector + " .selectorItem, " + self.selector +
        " .selectorItem input")
      .on('ifUnchecked', removeLayer);
    $(self.selector + "select")
      .on('change', filter);
    $(self.selector + "search")
      .on('keyup', filter);
    $(self.selector + "search")
      .focus();

    $(self.selector)
      .iCheck({
        checkboxClass: 'icheckbox_square-grey'
      });

    updateAreasOfInterest();
    setTimeout(resize, 1);
  };

  var renderType = function($parent, group, header, camelCase) {
    var $container = $("<div></div>")
      .attr("id", self.id + camelCase)
      .addClass("categoryContainer");

    var $header = $("<h3></h3>")
      .addClass("head")
      .html(header);

    var $element = $("<ul></ul>")
      .attr("id", self.id + group)
      .addClass(self.id + "category")
      .addClass("category")
      .addClass("scroll-pane");

    _.each(config.layerOrder, function(layerId) {
      var layer = config.layers[layerId];
      if (!layer) {
        console.warn("In layer order but not defined", layerId);
      } else if (layer.group === group) {
        renderLayer($element, group, layerId);
      }
    });

    $container.append($header);
    $container.append($element);
    $parent.append($container);
  };

  var renderLayer = function($parent, group, layerId) {
    var layer = config.layers[layerId];
    if (!layer) {
      console.warn("Skipping unknown layer", layerId);
      return;
    }
    var $label = $("<label></label>")
      .attr("data-layer", encodeURIComponent(layer.id));
    var $element = $("<li></li>")
      .addClass("selectorItem")
      .attr("data-layer", encodeURIComponent(layer.id))
      .addClass("item");

    var names = models.layers.getTitles(layer.id);
    var $name = $("<h4></h4>")
      .addClass("title")
      .html(names.title);
    if (config.parameters.markPalettes) {
      if (layer.palette) {
        $name.addClass("mark");
      }
    }
    if (config.parameters.markDownloads) {
      if (layer.product) {
        $name.addClass("mark");
      }
    }
    var $description = $("<p></p>")
      .addClass("subtitle")
      .html(names.subtitle);

    var $checkbox = $("<input></input>")
      .attr("id", encodeURIComponent(layer.id))
      .attr("value", layer.id)
      .attr("type", "checkbox")
      .attr("data-layer", layer.id);
    if (group === "baselayers") {
      $checkbox.attr("name", group);
    }
    if (_.find(model.active, {
      id: layer.id
    })) {
      $checkbox.attr("checked", "checked");
    }

    $element.append($checkbox);
    $element.append($name);
    $element.append($description);

    $label.append($element);
    $parent.append($label);
  };

  var adjustCategoryHeights = function() {
    var heights = [];
    var facets_height =
      $(self.selector + "facetedSearch")
        .outerHeight(true);
    var container_height =
      $(self.selector)
        .outerHeight(true) - facets_height;
    $(self.selector + "content")
      .height(container_height);
    var labelHeight = 0;
    $(self.selector + 'content .head')
      .each(function() {
        labelHeight += $(this)
          .outerHeight(true);
      });
    container_height -= labelHeight;

    $.each(["baselayers", "overlays"], function(i, group) {
      var actual_height = 0;
      var count = 0;
      $(self.selector + group + ' li')
        .each(function() {
          var layerId = decodeURIComponent($(this)
            .attr("data-layer"));
          if (visible[layerId]) {
            actual_height += $(this)
              .outerHeight(true);
            count++;
          }
        });

      heights.push({
        name: self.id + group,
        height: actual_height,
        count: count
      });
    });

    if (heights[0].height + heights[1].height > container_height) {
      if (heights[0].height > container_height / 2) {
        heights[0].height = container_height / 2;
      }
      heights[1].height = container_height - heights[0].height;
    }
    $("#" + heights[0].name)
      .css("height", heights[0].height + "px");
    $("#" + heights[1].name)
      .css("height", heights[1].height + "px");
    reinitializeScrollbars();
  };

  var reinitializeScrollbars = function() {
    var pane = $("." + self.id + "category")
      .each(function() {
        var api = $(this)
          .data('jsp');
        if (api) {
          api.reinitialise();
        }
      });
  };

  var resize = function() {

    var tabs_height = $(".ui-tabs-nav")
      .outerHeight(true);
    $(self.selector)
      .height($(self.selector)
        .parent()
        .outerHeight() - tabs_height);

    if (!wv.util.browser.small || true /* Use on mobile too for now */ ) {
      if (jsp) {
        var api = jsp.data('jsp');
        if (api) {
          api.destroy();
        }
      }
      if (wv.util.browser.ie) {
        jsp = $("." + self.id + "category")
          .jScrollPane({
            verticalDragMinHeight: 20,
            autoReinitialise: false,
            verticalGutter: 0,
            mouseWheelSpeed: 60
          });
      } else {
        jsp = $("." + self.id + "category")
          .jScrollPane({
            verticalDragMinHeight: 20,
            autoReinitialise: false,
            verticalGutter: 0
          });
      }
    }
    //setTimeout(adjustCategoryHeights, 1);
    adjustCategoryHeights();
  };

  var addLayer = function(event) {
    model.add(decodeURIComponent($(this)
      .attr("data-layer")));

  };

  var removeLayer = function(event) {
    model.remove(decodeURIComponent($(this)
      .attr("data-layer")));
  };

  var onLayerAdded = function(layer) {
    var $element = $("#selectorbox [data-layer='" +
      wv.util.jqueryEscape(layer.id) + "']");
    $element.iCheck("check");
  };

  var onLayerRemoved = function(layer) {
    var $element = $("#selectorbox [data-layer='" +
      wv.util.jqueryEscape(layer.id) + "']");
    $element.iCheck("uncheck");
  };

  var onProjectionChange = function() {
    adjustTitles();
    updateAreasOfInterest();
    filter();
  };

  var adjustTitles = function() {
    var proj = models.proj.selected.id;
    _.each(config.layers, function(def) {
      var names = models.layers.getTitles(def.id);
      $("#selectorbox [data-layer='" + encodeURIComponent(def.id) +
          "'] .title")
        .html(names.title);
      $("#selectorbox [data-layer='" + encodeURIComponent(def.id) +
          "'] .subtitle")
        .html(names.subtitle);
    });
  };

  var updateAreasOfInterest = function() {
    if (!config.aoi) {
      return;
    }
    $select = $("#" + self.id + "select");
    var previous = $(self.selector + "select")
      .val();

    $select.empty();
    var $option = $("<option></option>")
      .attr("value", "All")
      .html("All");
    $select.append($option);

    var aois = [];
    $.each(config.aoi, function(name, info) {
      if ($.inArray(models.proj.selected.id,
        info.projections) >= 0) {
        if (info.index === 0 || info.index) {
          aois.splice(info.index, 0, name);
        } else {
          aois.push(name);
        }
      }
    });

    $.each(aois, function(index, name) {
      var $option = $("<option></option>")
        .attr("value", name)
        .html(name);
      if (previous === name) {
        $option.attr("selected", "selected");
      }
      $select.append($option);
    });
    filter();
  };

  var searchTerms = function() {
    var search = $(self.selector + "search")
      .val()
      .toLowerCase();
    var terms = search.split(/ +/);
    return terms;
  };

  var filterAreaOfInterest = function(layerId) {
    if (!config.aoi) {
      return false;
    }
    var aoi = $(self.selector + "select")
      .val();
    if (aoi === "All") {
      return false;
    }
    return $.inArray(layerId, config.aoi[aoi].baselayers) < 0 &&
      $.inArray(layerId, config.aoi[aoi].overlays) < 0;
  };

  var filterProjection = function(layer) {
    return !layer.projections[models.proj.selected.id];
  };

  var filterSearch = function(layer, terms) {
    var search = $(self.selector + "search")
      .val();
    if (search === "") {
      return false;
    }
    var filtered = false;
    var names = models.layers.getTitles(layer.id);
    $.each(terms, function(index, term) {
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

  var filter = _.throttle(function() {
    var search = searchTerms();
    $.each(config.layers, function(layerId, layer) {
      //var faoi = filterAreaOfInterest(layerId);
      var fproj = filterProjection(layer);
      var fterms = filterSearch(layer, search);
      /*
      if ( layerId.startsWith("carto") ) {
          console.log(layerId, "faoi", faoi, "fproj", fproj, "fterms", fterms);
          console.log(wv.util.jqueryEscape(layerId));
      }
      */
      var filtered = fproj || fterms;
      var display = filtered ? "none" : "block";
      var selector = "#selectorbox li[data-layer='" +
        wv.util.jqueryEscape(layerId) + "']";
      $(selector)
        .css("display", display);
      visible[layer.id] = !filtered;
    });
    adjustCategoryHeights();
  }, 250, {
    trailing: true
  });

  init();
  return self;
};
