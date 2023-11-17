import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, UncontrolledTooltip } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import TileLayer from 'ol/layer/Tile';
import { transformExtent } from 'ol/proj';
import { layersToMeasure } from '../kiosk/tile-measurement/utils/layer-data-eic';

function ConsoleTest () {
  // eslint-disable-next-line no-unused-vars
  const dispatch = useDispatch();
  const {
    map,
  } = useSelector((state) => ({
    map: state.map.ui.selected,
  }));

  // Match only the layers that are in the layersToMeasure array
  const matchLayers = () => map.getLayers().getArray().filter((layer) => layer.wv && layer.wv.id && layersToMeasure.includes(layer.wv.id));

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

      if (isTransparent) {
        console.log('Image is fully transparent');
      } else if (isSingleColor) {
        console.log('Image is a single color');
      } else {
        console.log('Image has multiple colors');
      }

      return isSingleColor || isTransparent;
    }
    console.log('Image invalid.');
    return false;
  };

  const countTiles = (layer) => {
    const view = map.getView();
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
    let errorTiles = 0; // 3
    let emptyTiles = 0; // 4
    let tilesLoadedWithBadImage = 0; // 2 but image is invalid
    const otherTileStates = [];

    const tileCoordFunction = async (tileCoord) => {
      const tile = source.getTile(tileCoord[0], tileCoord[1], tileCoord[2], 1, sourceProjection);
      const tileState = tile.getState();
      expectedTileCount += 1;
      if (tileState === 2) {
        const image = tile.image_;
        const isTileImageValid = checkTileImage(image);
        if (!isTileImageValid) {
          console.log('Tile image is invalid');
          loadedTileCount += 1;
        } else {
          console.log('Tile loaded with bad image');
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

  const findSubLayers = (layer) => {
    if (layer instanceof TileLayer) {
      const layerId = layer.wv.id;
      console.log(`${layerId} is a TileLayer`);
      const {
        expectedTileCount,
        loadedTileCount,
        errorTiles,
        emptyTiles,
        otherTileStates,
        tilesLoadedWithBadImage,
      } = countTiles(layer);

      console.log(`${layerId} loaded ${loadedTileCount} out of ${expectedTileCount} tiles`);
      console.log(`${layerId} had ${errorTiles} error tiles and ${emptyTiles} empty tiles. There were ${tilesLoadedWithBadImage} tiles loaded with bad images`);
      if (otherTileStates.length) {
        const statesString = otherTileStates.join(', ');
        console.log(`${layerId} has other tile states of `, statesString);
      }
    } else if (layer.getLayers) {
      const layerId = layer.wv.id;
      const subLayers = layer.getLayers().getArray();
      console.log(`${layerId} is a LayerGroup with ${subLayers.length} sublayers`);

      subLayers.forEach((layer, index) => {
        const {
          expectedTileCount,
          loadedTileCount,
          errorTiles,
          emptyTiles,
          otherTileStates,
          tilesLoadedWithBadImage,
        } = countTiles(layer);

        console.log(`Subarray #${index + 1} of ${layerId} loaded ${loadedTileCount} out of ${expectedTileCount} tiles`);
        console.log(`Subarray #${index + 1} had ${errorTiles} error tiles and ${emptyTiles} empty tiles. There were ${tilesLoadedWithBadImage} tiles loaded with bad images`);
        if (otherTileStates.length) {
          const statesString = otherTileStates.join(', ');
          console.log(`Subarray #${index + 1} ${layerId} has other tile states of `, statesString);
        }
      });
    }
  };

  const consoleResponse = () => {
    // Air qual layers return as "LayerGroup" instead of "TileLayer"
    // Other layers do this as well that work in EIC mode.. GeoColor, Sea Surface..
    const matchingLayers = matchLayers();
    console.log('Matching Layers:', matchingLayers);
    matchingLayers.forEach(findSubLayers);
  };

  return (
    <div className="d-flex flex-column justify-content-center align-items-center w-100 mt-3">
      <div className="d-flex flex-row justify-content-center align-items-center">
        <h5 className="h5 fw-bold d-inline-block me-1">Console Test Mode</h5>
        <span><FontAwesomeIcon id="console-test-info-icon" icon="info-circle" className="pb-2" /></span>
        <UncontrolledTooltip
          id="console-test-tooltip"
          target="console-test-info-icon"
          placement="right"
        >
          Console any response. See the ConsoleTest component
        </UncontrolledTooltip>
      </div>
      <span className="border-top border-white-50 mb-2 w-100" />
      <Button
        style={{ backgroundColor: '#d54e21' }}
        onClick={consoleResponse}
      >
        Console test
      </Button>
    </div>
  );
}

export default ConsoleTest;
