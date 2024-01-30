import TileLayer from 'ol/layer/Tile';
import { transformExtent } from 'ol/proj';

// We cannot rely on the invidual tile's state to determine if the image truely loaded with imagery
// We draw the image to a canvas and check the pixels to see if it is a single color or transparent
const checkTileImage = (image) => {
  if (image.complete && image.naturalWidth !== 0) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    context.drawImage(image, 0, 0);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const { data } = imageData;

    let isSingleColor = true;
    let isTransparent = true;
    const firstPixel = [data[0], data[1], data[2], data[3]];

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] !== 0) { // If alpha is not 0
        isTransparent = false;
        if (data[i] !== firstPixel[0] || data[i + 1] !== firstPixel[1] || data[i + 2] !== firstPixel[2] || data[i + 3] !== firstPixel[3]) {
          isSingleColor = false;
          break;
        }
      }
    }

    return isSingleColor || isTransparent;
  }
  console.log('Image invalid.');
  return false;
};

// Process each individual tile for a given TileLayer
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

  /*
  0 - ol.TileState.IDLE: The tile has not started loading yet. It is in the initial state.
  1 - ol.TileState.LOADING: The tile is currently in the process of loading.
  2 - ol.TileState.LOADED: The tile has finished loading successfully.
  3 - ol.TileState.ERROR: There was an error in loading the tile.
  4 - ol.TileState.EMPTY: The tile is empty, indicating there's no data for this tile.
  5 - ol.TileState.ABORT: The loading of the tile was aborted.
  */

  let expectedTileCount = 0; // all tiles
  let loadedTileCount = 0; // 2
  let tilesLoadedWithBadImage = 0; // 2 but image is invalid
  let errorTiles = 0; // 3
  let emptyTiles = 0; // 4
  const otherTileStates = [];

  const tileCoordFunction = async (tileCoord) => {
    const tile = source.getTile(tileCoord[0], tileCoord[1], tileCoord[2], 1, sourceProjection);
    const tileState = tile.getState();
    expectedTileCount += 1;
    if (tileState === 2) {
      const image = tile.image_;
      const isTileImageValid = checkTileImage(image);
      if (!isTileImageValid) {
        loadedTileCount += 1;
      } else {
        tilesLoadedWithBadImage += 1;
      }
    } else if (tileState === 3) {
      errorTiles += 1;
    } else if (tileState === 4) {
      emptyTiles += 1;
    } else {
      otherTileStates.push(tileState);
    }
  };

  tileGrid.forEachTileCoord(transformedExtent, currentZ, tileCoordFunction);

  return {
    expectedTileCount,
    loadedTileCount,
    errorTiles,
    emptyTiles,
    otherTileStates,
    tilesLoadedWithBadImage,
  };
};

export default function countTilesForSpecifiedLayers (ui, layersToCheck) {
  const map = ui.selected;
  const view = map.getView();
  // Match only the layers that are in the layersToMeasure array
  const matchingLayers = map.getLayers().getArray().filter((layer) => layer.wv && layer.wv.id && layersToCheck.includes(layer.wv.id));

  let totalExpectedTileCount = 0;
  let totalLoadedTileCount = 0;
  let totalTilesLoadedWithBadImage = 0;
  let totalErrorTiles = 0;
  let totalEmptyTiles = 0;
  let totalOtherTileStates = [];

  // Layers can be a single TileLayer or a LayerGroup consisting of 2 or more TileLayers
  const processLayer = (layer) => {
    if (layer instanceof TileLayer) {
      const {
        expectedTileCount,
        loadedTileCount,
        errorTiles,
        emptyTiles,
        otherTileStates,
        tilesLoadedWithBadImage,
      } = processTileLayer(layer, map, view);
      totalExpectedTileCount += expectedTileCount;
      totalLoadedTileCount += loadedTileCount;
      totalTilesLoadedWithBadImage += tilesLoadedWithBadImage;
      totalErrorTiles += errorTiles;
      totalEmptyTiles += emptyTiles;
      totalOtherTileStates = totalOtherTileStates.concat(otherTileStates);
    } else if (layer.getLayers) {
      const subLayers = layer.getLayers().getArray();
      subLayers.forEach(processLayer);
    } else {
      console.error('Layer is not an instance of a TileLayer or LayerGroup');
    }
  };

  matchingLayers.forEach(processLayer);

  return {
    totalExpectedTileCount,
    totalLoadedTileCount,
    totalTilesLoadedWithBadImage,
    totalErrorTiles,
    totalEmptyTiles,
    totalOtherTileStates,
  };
}
