import $ from 'jquery';

import React from 'react';
import ReactDOM from 'react-dom';
import LayerList from '../components/layer/product-picker';
import lodashIndexOf from 'lodash/indexOf';
import lodashSortBy from 'lodash/sortBy';
import lodashValues from 'lodash/values';
import lodashDebounce from 'lodash/debounce';

export function layersModal(models, ui, config) {
  var model = models.layers;
  var self = {};
  self.selector = '#layer-modal';
  self.metadata = {};

  var gridItemWidth = 310; // with of grid item + spacing
  var modalHeight;
  var modalWidth;
  var sizeMultiplier;
  var init = function() {
    self.reactList = ReactDOM.render(
      React.createElement(LayerList, getInitialProps(models.proj.selected.id)),
      $(self.selector)[0]
    );
    if (models.compare) {
      models.compare.events.on('change', () => {
        self.reactList.setState({
          activeLayers: model[model.activeLayers],
          listType: 'category',
          inputValue: ''
        });
      });
    }
    models.proj.events.on('select', () => {
      const allLayers = getLayersForProjection(models.proj.selected.id);
      self.reactList.setState({
        selectedProjection: models.proj.selected.id,
        allLayers: allLayers,
        filteredRows: allLayers,
        listType: 'category',
        inputValue: '',
        category: null
      });
    });

    $(window).resize(lodashDebounce(resize, 100));
  };
  var getInitialProps = function(proj) {
    setModalSize();
    return {
      addLayer: layerId => model.add(layerId, {}),
      removeLayer: layerId => model.remove(layerId),
      allLayers: getLayersForProjection(proj),
      activeLayers: model[model.activeLayers],
      selectedProjection: proj,
      filterProjections: filterProjections,
      filterSearch: filterSearch,
      filteredRows: getLayersForProjection(proj),
      getModalHeight: getModalHeight,
      hasMeasurementSource: hasMeasurementSource,
      hasMeasurementSetting: hasMeasurementSetting,
      measurementConfig: config.measurements,
      layerConfig: config.layers,
      categoryConfig: config.categories,
      width: modalWidth,
      height: modalHeight,
      onToggleModal: boo => {
        model.events.trigger('modal', boo);
      }
    };
  };
  var getLayersForProjection = function(projection) {
    var filteredRows = lodashValues(config.layers)
      .filter(function(layer) {
        // Only use the layers for the active projection
        return layer.projections[projection];
      })
      .map(function(layer) {
        // If there is metadata for the current projection, use that
        var projectionMeta = layer.projections[projection];
        if (projectionMeta.title) layer.title = projectionMeta.title;
        if (projectionMeta.subtitle) layer.subtitle = projectionMeta.subtitle;
        // Decode HTML entities in the subtitle
        if (layer.subtitle) layer.subtitle = decodeHtml(layer.subtitle);
        return layer;
      });
    return lodashSortBy(filteredRows, function(layer) {
      return lodashIndexOf(config.layerOrder, layer.id);
    });
  };

  var decodeHtml = function(html) {
    var txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  };

  /**
   * var hasMeasurementSetting - Checks the (current) measurement's source
   *  for a setting and returns true if present.
   *
   * @param  {string} current The current config.measurements measurement.
   * @param  {string} source  The current measurement source.
   * @return {boolean}         Return true if the source contains settings.
   *
   */
  var hasMeasurementSetting = function(current, source) {
    var projection = models.proj.selected.id;
    var hasSetting;
    lodashValues(source.settings).forEach(function(setting) {
      var layer = config.layers[setting];
      if (layer) {
        var proj = layer.projections;
        if (
          layer.id === setting &&
          Object.keys(proj).indexOf(projection) > -1
        ) {
          if (
            layer.layergroup &&
            layer.layergroup.indexOf('reference_orbits') !== -1
          ) {
            if (current.id === 'orbital-track') {
              hasSetting = true;
            }
            // Don't output sources with only orbit tracks
          } else {
            hasSetting = true;
          }
        }
      }
    });
    return hasSetting;
  };

  /**
   * var hasMeasurementSource - Checks each (current) measurement's sources
   *  and run hasMeasurementSetting to see if these sources contain settings.
   *  If a source contains settings, also sets a hasMeasurement flag to be checked
   *  when drawing categories.
   *
   * @param  {string} current The current config.measurements measurement.
   * @return {boolean}         Return true if the measurement has sources with settings.
   */

  var hasMeasurementSource = function(current) {
    var hasSource;
    lodashValues(current.sources).forEach(function(source) {
      if (hasMeasurementSetting(current, source)) {
        hasSource = true;
      }
    });
    return hasSource;
  };

  var getModalHeight = function() {
    return $(window).height() - 100;
  };
  var setModalSize = function() {
    var availableWidth = $(window).width() - $(window).width() * 0.15;
    sizeMultiplier = Math.floor(availableWidth / gridItemWidth);
    if (sizeMultiplier < 1) {
      sizeMultiplier = 1;
    }
    if (sizeMultiplier > 3) {
      sizeMultiplier = 3;
    }
    const gutterSpace = (sizeMultiplier - 1) * 10;
    const modalPadding = 26;
    modalHeight = getModalHeight();
    modalWidth = gridItemWidth * sizeMultiplier + gutterSpace + modalPadding;
  };

  var resize = function() {
    setModalSize();
    self.reactList.setState({ height: modalHeight, width: modalWidth });
  };
  self.open = function() {
    self.reactList.setState({
      isOpen: true,
      selectedProjection: models.proj.selected.id
    });
    model.events.trigger('modal', true);
  };
  self.isOpen = function() {
    return self.reactList.state.isOpen;
  };

  var filterProjections = function(layer) {
    return !layer.projections[models.proj.selected.id];
  };
  // // Takes the terms and returns true if the layer isnt part of search
  var filterSearch = function(layer, val, terms) {
    if (!val) return false;
    var filtered = false;
    var names = models.layers.getTitles(layer.id);

    $.each(terms, function(index, term) {
      filtered =
        !names.title.toLowerCase().contains(term) &&
        !names.subtitle.toLowerCase().contains(term) &&
        !names.tags.toLowerCase().contains(term) &&
        !config.layers[layer.id].id.toLowerCase().contains(term);

      if (filtered) return false;
    });
    return filtered;
  };

  init();
  return self;
}
