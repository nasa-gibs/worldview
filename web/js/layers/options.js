import React from 'react';
import { render } from 'react-dom';
import styles from '../styles/styles';
import { palettesTranslate, getCheckerboard } from '../styles/util';
import LayerSettings from '../components/layer/settings/settings';
import Promise from 'bluebird';

export function layersOptions(models, ui, config) {
  var self = {};
  self.layerId = null;
  var canvas, checkerboard;

  var init = function() {
    canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 10;
    checkerboard = getCheckerboard();

    if (config.features.customPalettes) {
      styles.loadCustom(config).done(loaded);
    } else {
      loaded();
    }
  };
  self.close = function(timeout) {
    timeout = timeout || 0;
    self.reactComponent.setState({ isOpen: false });
    self.layerId = null;
    return new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, timeout);
    });
  };
  /**
   * Open react component with new layer info
   * @param {Object} layer | Active layer object
   */
  self.createNewLayer = function(layer) {
    if (layer.id === self.layerId) {
      self.close();
      return;
    }
    const timeout = layer.id ? 300 : 0;
    self.close(timeout).then(() => {
      const names = models.layers.getTitles(layer.id);
      self.layerId = layer.id;
      self.reactComponent.setState({
        layer: layer,
        title: names.title,
        palettedAllowed: models.palettes.allowed(layer.id),
        isOpen: true
      });
    });
  };
  /**
   * Mount component once customs Config is loaded
   */
  var loaded = function() {
    self.reactComponent = render(
      <LayerSettings
        setCustom={models.palettes.setCustom}
        clearCustom={models.palettes.clearCustom}
        getLegends={models.palettes.getLegends}
        getPalette={models.palettes.get}
        getLegend={models.palettes.getLegend}
        getDefaultLegend={models.palettes.getDefaultLegend}
        getCustomPalette={models.palettes.getCustomPalette}
        setRange={models.palettes.setRange}
        palettedAllowed={false}
        canvas={canvas}
        isOpen={false}
        checkerboard={checkerboard}
        setOpacity={models.layers.setOpacity}
        customPalettesIsActive={!!config.features.customPalettes}
        palettesTranslate={palettesTranslate}
        paletteOrder={config.paletteOrder}
        close={self.close}
      />,
      document.getElementById('layer-settings-modal')
    );
    models.layers.events.on('remove', onLayerRemoved);
    models.proj.events.on('change', self.close);
    ui.sidebar.events.on('selectTab', self.close);
    if (models.compare) models.compare.events.on('change', self.close);
  };

  var onLayerRemoved = function(removedLayer) {
    if (self.layerId === removedLayer.id) {
      self.close();
    }
  };
  init();
  return self;
}
