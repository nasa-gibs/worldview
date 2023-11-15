import TileLayer from 'ol/layer/Tile';
import { transformExtent } from 'ol/proj';

// Helper function to process the tile layer
const processTileLayer = (layer, map, view) => {
  const source = layer.getSource();
  const size = map.getSize();
  const extent = view.calculateExtent(size);
  const zoom = view.getZoom();
  const sourceProjection = source.getProjection() || view.getProjection();
  const transformedExtent = transformExtent(extent, view.getProjection(), sourceProjection);
  const tileGrid = source.getTileGridForProjection(sourceProjection);
  const resolution = view.getResolutionForZoom(zoom);
  const currentZ = tileGrid.getZForResolution(resolution);

  let expectedTileCount = 0;
  let loadedTileCount = 0;

  const tileCoordFunction = (tileCoord) => {
    const tile = source.getTile(tileCoord[0], tileCoord[1], tileCoord[2], 1, sourceProjection);
    const tileState = tile.getState();
    if (tileState === 2) {
      loadedTileCount += 1;
      expectedTileCount += 1;
    } else if (tileState === 3) {
      expectedTileCount += 1;
    }
  };

  tileGrid.forEachTileCoord(transformedExtent, currentZ, tileCoordFunction);

  return {
    expectedTileCount,
    loadedTileCount,
  };
};

export default function countTilesForSpecifiedLayers (ui, layersToCheck) {
  const map = ui.selected;
  const view = map.getView();
  const layers = map.getLayers().getArray();
  const matchingLayers = layers.filter((layer) => {
    if (layer.wv && layer.wv.id) {
      const layerId = layer.wv.id;
      return layersToCheck.includes(layerId);
    }
    return false;
  });


  let totalExpectedTileCount = 0;
  let totalLoadedTileCount = 0;

  const processLayer = (layer) => {
    if (layer instanceof TileLayer) {
      const { expectedTileCount, loadedTileCount } = processTileLayer(layer, map, view);
      totalExpectedTileCount += expectedTileCount;
      totalLoadedTileCount += loadedTileCount;
    } else if (layer.getLayers) {
      const subLayers = layer.getLayers().getArray();
      subLayers.forEach(processLayer);
    }
  };

  matchingLayers.forEach(processLayer);

  return {
    totalExpectedTileCount,
    totalLoadedTileCount,
  };
}
