import TileLayer from 'ol/layer/Tile';
import { transformExtent } from 'ol/proj';

// formats date for kiosk mode and updates to EST
export function formatKioskDate(date, subdaily) {
  const options = {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/New_York',
  };

  const formatter = new Intl.DateTimeFormat('en-US', options);
  const dateParts = formatter.formatToParts(date);

  const year = dateParts.find((part) => part.type === 'year').value;
  const month = dateParts.find((part) => part.type === 'month').value.slice(0, 3);
  const day = dateParts.find((part) => part.type === 'day').value;
  const hours = dateParts.find((part) => part.type === 'hour').value;
  const minutes = dateParts.find((part) => part.type === 'minute').value;

  const formattedDate = subdaily ? `${day} ${month} ${year} ${hours}:${minutes}:00 EDT` : `${day} ${month} ${year}`;

  return formattedDate;
}


// export const calculateExpectedTiles = (ui, layerGroup) => {
//   const map = ui.selected;
//   const layers = layerGroup.getLayers().getArray()
//   const layer = layers[0];
//   const source = layer.getSource();
//   const view = map.getView();
//   const sourceProjection = source.getProjection() || view.getProjection();
//   const tileGrid = source.getTileGridForProjection(sourceProjection);
//   const zoom = view.getZoom();
//   const resolution = view.getResolutionForZoom(zoom);
//   const currentZ = tileGrid.getZForResolution(resolution);

//   const extent = view.calculateExtent();
//   const transformedExtent = transformExtent(extent, view.getProjection(), sourceProjection);

//   const tileRange = tileGrid.getTileRangeForExtentAndZ(transformedExtent, currentZ);
//   const minX = tileRange.minX;
//   const maxX = tileRange.maxX;
//   const minY = tileRange.minY;
//   const maxY = tileRange.maxY;

//   const tilesX = maxX - minX + 1;
//   const tilesY = maxY - minY + 1;

//   const totalTiles = tilesX * tilesY;

//   return totalTiles;

// }


export const calculateExpectedTiles = (ui, layerGroup) => {
  const map = ui.selected;
  const layers = layerGroup.getLayers().getArray()
  const layer = layers[0];
  const source = layer.getSource();
  const size = map.getSize();
  const view = map.getView();
  const sourceProjection = source.getProjection() || view.getProjection();
  const tileGrid = source.getTileGridForProjection(sourceProjection);
  const zoom = view.getZoom();
  const resolution = view.getResolutionForZoom(zoom);
  const currentZ = tileGrid.getZForResolution(resolution);

  const extent = view.calculateExtent(size);
  const transformedExtent = transformExtent(extent, view.getProjection(), sourceProjection);

  let expectedTileCount = 0;
  let tileCoords = [];

  const tileCoordFunction = (tileCoord) => {
    expectedTileCount += 1;
    tileCoords.push(tileCoord);
  };

  tileGrid.forEachTileCoord(transformedExtent, currentZ, tileCoordFunction);

  return {
    expectedTileCount,
    tileCoords
  };

}





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
  let tileCoords = [];

  let expectedTileCount = 0;
  let loadedTileCount = 0;

  const tileCoordFunction = (tileCoord) => {
    tileCoords.push(tileCoord);
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
    tileCoords,
  };
};

export const countTiles = (ui) => {
  const map = ui.selected;
  const view = map.getView();
  const layers = map.getLayers().getArray();

  let totalExpectedTileCount = 0;
  let totalLoadedTileCount = 0;
  let expectedTileCoords = [];

  const processLayer = (layer) => {
    if (layer instanceof TileLayer) {
      const { expectedTileCount, loadedTileCount, tileCoords } = processTileLayer(layer, map, view);
      totalExpectedTileCount += expectedTileCount;
      totalLoadedTileCount += loadedTileCount;
      expectedTileCoords = [...expectedTileCoords, ...tileCoords];
    } else if (layer.getLayers) {
      const subLayers = layer.getLayers().getArray();
      subLayers.forEach(processLayer);
    }
  };

  layers.forEach(processLayer);

  return {
    totalExpectedTileCount,
    totalLoadedTileCount,
    expectedTileCoords,
  };
};
