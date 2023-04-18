import { each as lodashEach } from 'lodash';

// removes all of the layers from the openlayers map object
// eslint-disable-next-line import/prefer-default-export
export const clearLayers = function(ui) {
  const activeLayersUI = ui.selected
    .getLayers()
    .getArray()
    .slice(0);
  lodashEach(activeLayersUI, (mapLayer) => {
    ui.selected.removeLayer(mapLayer);
  });
  ui.cache.clear();
};
