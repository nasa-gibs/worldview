/* eslint-disable quote-props */
import { useEffect } from 'react';
import OlTileGridWMTS from 'ol/tilegrid/WMTS';
import OlSourceWMTS from 'ol/source/WMTS';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { toggleCheckedAnimationAvailability as toggleCheckedAnimationAvailabilityAction } from '../../../modules/ui/actions';
import util from '../../../util/util';
import {
  LEFT_WING_EXTENT, RIGHT_WING_EXTENT, LEFT_WING_ORIGIN, RIGHT_WING_ORIGIN,
} from '../../../modules/map/constants';

// Layers to be checked for tile availability need to have manually determined content-length thresholds.
// Any active layers that are not listed in this object will NOT be checked for tile availability.
// This represents a TOTAL content-length for all tiles for a single date for a single layer
// To find a good value for the total content-length:
// 1. Find a visibly verifiabled date range where the layer has full tiles for the entire range
// 2. Add the layer id to the contentLengthThresholds object below with a value of 1
// 3. Place a console statement in getAvailability() for console.log(resolvedLayersAvailability)
// 4. Create a permalink with the kiosk parameter with kiosk=true && (eic='sa' || eic='da')
// 5. Use the permalink & open the console
// 6. Look through the conentLengthSum values for each layer/date to find a good value
// Currently can only be used for WMTS tiles.
const contentLengthThresholds = {
  'GOES-East_ABI_GeoColor': 160000,
  'GOES-West_ABI_GeoColor': 160000,
  'AMSRU2_Sea_Ice_Concentration_12km': 10000,
};

function DateRangeTileCheck(props) {
  const {
    frameDates,
    activeLayers,
    config,
    proj,
    zoom,
  } = props;

  const dispatch = useDispatch();
  const toggleCheckedAnimationAvailability = (available) => { dispatch(toggleCheckedAnimationAvailabilityAction(available)); };

  const calcExtentsFromLimits = (matrixSet, matrixSetLimits, day) => {
    let extent;
    let origin;

    switch (day) {
      case 1:
        extent = LEFT_WING_EXTENT;
        origin = LEFT_WING_ORIGIN;
        break;
      case -1:
        extent = RIGHT_WING_EXTENT;
        origin = RIGHT_WING_ORIGIN;
        break;
      default:
        extent = proj.maxExtent;
        origin = [extent[0], extent[3]];
        break;
    }

    const resolutionLen = matrixSet.resolutions.length;
    const setlimitsLen = matrixSetLimits && matrixSetLimits.length;

    if (!matrixSetLimits || setlimitsLen !== resolutionLen || day) {
      return { origin, extent };
    }

    const limitIndex = resolutionLen - 1;
    const resolution = matrixSet.resolutions[limitIndex];
    const tileWidth = matrixSet.tileSize[0] * resolution;
    const tileHeight = matrixSet.tileSize[1] * resolution;
    const {
      minTileCol,
      maxTileRow,
      maxTileCol,
      minTileRow,
    } = matrixSetLimits[limitIndex];
    const minX = extent[0] + (minTileCol * tileWidth);
    const minY = extent[3] - ((maxTileRow + 1) * tileHeight);
    const maxX = extent[0] + ((maxTileCol + 1) * tileWidth);
    const maxY = extent[3] - (minTileRow * tileHeight);

    return {
      origin,
      extent: [minX, minY, maxX, maxY],
    };
  };

  const requestTilesWMTS = async (def, date) => {
    const {
      id, format, matrixIds, matrixSetLimits, projections, style, type,
    } = def;

    let contentLengthSum = 0;

    const isGranule = type === 'granule';
    const projectionsAttributes = projections[proj.id];
    const projSource = projectionsAttributes.source;
    const configSource = config.sources[projSource];
    const urlParameters = `?TIME=${util.toISOStringSeconds(util.roundTimeOneMinute(date))}`;
    const sourceURL = def.sourceOverride || configSource.url;
    const configMatrixSet = configSource.matrixSets[projectionsAttributes.matrixSet];

    const { tileMatrices, resolutions, tileSize } = configMatrixSet;
    const { origin, extent } = calcExtentsFromLimits(configMatrixSet, matrixSetLimits, null);
    const sizes = !tileMatrices ? [] : tileMatrices.map(({ matrixWidth, matrixHeight }) => [matrixWidth, matrixHeight]);

    const tileGridOptions = {
      origin,
      extent,
      sizes,
      resolutions,
      matrixIds: matrixIds || resolutions.map((set, index) => index),
      tileSize: tileSize[0],
    };

    const tileLoadFunction = function(tile, src) {
      return new Promise((resolve) => {
        fetch(src)
          .then((response) => response.blob().then((data) => [response, data]))
          .then(([response, data]) => {
            const contentLength = response.headers.get('content-length');
            if (response.status === 200 && data !== undefined) {
              contentLengthSum += parseInt(contentLength, 10);
            }
            resolve();
          })
          .catch((e) => {
            console.error('Error loading tile', e);
            resolve();
          });
      });
    };


    const wmtsSource = new OlSourceWMTS({
      url: sourceURL + urlParameters,
      layer: id,
      cacheSize: 4096,
      crossOrigin: 'anonymous',
      format,
      transition: isGranule ? 350 : 0,
      matrixSet: configMatrixSet.id,
      tileGrid: new OlTileGridWMTS(tileGridOptions),
      wrapX: false,
      style: typeof style === 'undefined' ? 'default' : style,
      tileLoadFunction,
    });

    const [matrixWidth, matrixHeight] = sizes[zoom];

    const promises = [];

    for (let x = 0; x < matrixWidth; x += 1) {
      for (let y = 0; y < matrixHeight; y += 1) {
        const tileCoord = [zoom, x, y];
        const tileUrl = wmtsSource.tileUrlFunction(tileCoord, 1, proj);
        if (tileUrl !== undefined) {
          const promise = wmtsSource.getTileLoadFunction()(tileCoord, tileUrl);
          promises.push(promise);
        }
      }
    }

    await Promise.all(promises);
    return {
      date,
      contentLengthSum,
    };
  };

  // Invoked from getAvailability, accepts one layer and returns results for that layer
  // Each layer will have a nested array of each frameDate with a content-length value
  async function getAvailabilityForLayer(layer) {
    const layerName = layer.id.toString();

    // Start all the tile requests concurrently
    const tilePromises = frameDates.map((date) => requestTilesWMTS(layer, date));

    // Wait for all the requests to finish and gather the results
    const tiles = await Promise.all(tilePromises);

    const availability = {
      layerName,
      dates: tiles,
    };

    return availability;
  }

  // Parent function called when frameDates are calculated
  async function getAvailability() {
    // An array of layers that are eligible to be checked
    const layersToBeChecked = activeLayers.filter((layer) => contentLengthThresholds[layer.id]);

    // Map through each eligible layer and request availability
    const layersAvailability = layersToBeChecked.map((layer) => {
      const layerAvailability = getAvailabilityForLayer(layer);
      return layerAvailability;
    });

    // Wait for all the requests to finish and gather the results with promise
    const resolvedLayersAvailability = await Promise.all(layersAvailability);

    // Create a set of unique dates that are below the threshold
    // The size of this set will determine how many frames are missing tiles
    const uniqueDatesBelowThreshold = new Set();

    resolvedLayersAvailability.forEach((layer) => {
      const threshold = contentLengthThresholds[layer.layerName];

      layer.dates.forEach((date) => {
        if (date.contentLengthSum < threshold) {
          const dateStr = date.date.toISOString(); // Convert date to string for use as an object key
          uniqueDatesBelowThreshold.add(dateStr); // Add the date to the set. If it's already there, it won't be added again.
        }
      });
    });

    const framesWithMissingTiles = uniqueDatesBelowThreshold.size;

    // Calculate how many frames are missing tiles as a percentage
    const percentMissing = (framesWithMissingTiles / frameDates.length) * 100;

    // If there are less than 40% of frames with missing tiles we dispatch action to allow animation to play
    // Else we do not do anything which means we display static imagery of the first frame
    // The imagery at this date should already be satisfactory because the errorTile process has already been completed
    // The percentMissing conditional value is completely arbitrary and can be changed
    if (percentMissing < 40) {
      console.log('Good Check:', percentMissing, '% ', 'of dates with missing frames');
      toggleCheckedAnimationAvailability(true);
    } else {
      // THIS ELSE BLOCK IS ONLY FOR TESTING
      console.log('Bad Check: ', percentMissing, '% ', ' of dates with missing frames. Aborting animation.');
    }
  }

  useEffect(() => {
    if (frameDates.length) {
      getAvailability();
    }
  }, [frameDates]);

  return null;
}

DateRangeTileCheck.propTypes = {
  proj: PropTypes.object,
  config: PropTypes.object,
  activeLayers: PropTypes.array,
  frameDates: PropTypes.array,
  zoom: PropTypes.number,
};

export default DateRangeTileCheck;
