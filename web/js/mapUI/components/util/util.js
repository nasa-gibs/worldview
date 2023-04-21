import { each as lodashEach } from 'lodash';
import TileLayer from 'ol/layer/Tile';
import { transformExtent } from 'ol/proj';

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

// count active tiles vs the expected amount
export const countTiles = (ui) => {
  const map = ui.selected;

  const view = map.getView();
  const layerGroup = map.getLayers().item(0);
  const layers = layerGroup.getLayers().getArray();

  let totalExpectedTileCount = 0;
  let totalLoadedTileCount = 0;

  layers.forEach((layer) => {
    if (layer instanceof TileLayer) {
      const source = layer.getSource();
      const size = map.getSize();
      const extent = view.calculateExtent(size);
      const zoom = view.getZoom();
      const sourceProjection = source.getProjection() || view.getProjection();

      // Transform the extent to the source projection
      const transformedExtent = transformExtent(extent, view.getProjection(), sourceProjection);

      // Get the tile grid for the given projection
      const tileGrid = source.getTileGridForProjection(sourceProjection);

      // Get the resolution for the current zoom level
      const resolution = view.getResolutionForZoom(zoom);

      const currentZ = tileGrid.getZForResolution(resolution);

      let expectedTileCount = 0;
      let loadedTileCount = 0;

      const tileCoordFunction = (tileCoord) => {
        console.log('tileCoordFunction', tileCoord);
        expectedTileCount += 1;
        const tile = source.getTile(tileCoord[0], tileCoord[1], tileCoord[2], 1, sourceProjection);
        if (tile.getState() === 2) loadedTileCount += 1;
      };

      tileGrid.forEachTileCoord(transformedExtent, currentZ, tileCoordFunction);

      totalExpectedTileCount += expectedTileCount;
      totalLoadedTileCount += loadedTileCount;
    }
  });

  return {
    totalExpectedTileCount: totalExpectedTileCount / 3,
    totalLoadedTileCount,
  };
};
