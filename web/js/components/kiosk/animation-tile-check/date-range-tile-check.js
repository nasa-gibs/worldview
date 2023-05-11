import { useEffect } from 'react';
import OlTileGridWMTS from 'ol/tilegrid/WMTS';
import OlSourceWMTS from 'ol/source/WMTS';
import PropTypes from 'prop-types';
import util from '../../../util/util';
import {
  LEFT_WING_EXTENT, RIGHT_WING_EXTENT, LEFT_WING_ORIGIN, RIGHT_WING_ORIGIN,
} from '../../../modules/map/constants';

const contentLengthThresholds = {
  'GOES-East_ABI_GeoColor': 160000,
};

function DateRangeTileCheck(props) {
  const {
    frameDates,
    activeLayers,
    config,
    proj,
    zoom,
  } = props;

  useEffect(() => {
    if (frameDates.length) {
      getAvailability();
    }
  }, [frameDates]);

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

    // If number of set limits doesn't match sets, we are assuming this product
    // crosses the anti-meridian and don't have a reliable way to calculate a single
    // extent based on multiple set limits.
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

  // child function that accepts one layer and returns results for that layer
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

  // parent function that accepts activeLayers and returns final results
  async function getAvailability() {
    const allLayersAvailability = activeLayers.map((layer) => {
      const layerAvailability = getAvailabilityForLayer(layer);
      return layerAvailability;
    });

    const resolvedAllLayersAvailability = await Promise.all(allLayersAvailability);

    const datesBelowThreshold = resolvedAllLayersAvailability.map((layer) => {
      const threshold = contentLengthThresholds[layer.layerName];

      return layer.dates.reduce((accumulator, date) => {
        if (date.contentLengthSum < threshold) {
          accumulator.push({
            layerName: layer.layerName,
            date: date.date,
            threshold: date.contentLengthSum,
          });
        }
        return accumulator;
      }, []);
    });

    console.log(datesBelowThreshold);
  }

  return null;
}

DateRangeTileCheck.propTypes = {
  proj: PropTypes.object,
  config: PropTypes.object,
  activeLayers: PropTypes.array,
  frameDates: PropTypes.array,
  zoom: PropTypes.integer,
};

export default DateRangeTileCheck;
