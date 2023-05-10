import React, { useEffect, useState } from 'react';
import OlTileGridWMTS from 'ol/tilegrid/WMTS';
import OlSourceWMTS from 'ol/source/WMTS';
import OlLayerTile from 'ol/layer/Tile';
import PropTypes from 'prop-types';
import util from '../../../util/util';
import {
  LEFT_WING_EXTENT, RIGHT_WING_EXTENT, LEFT_WING_ORIGIN, RIGHT_WING_ORIGIN, CENTER_MAP_ORIGIN
} from '../../../modules/map/constants';

function DateRangeTileCheck(props) {
  const {
    frameDates,
    activeLayers,
    config,
    proj
  } = props;

  useEffect(() => {
    if (frameDates.length){
      parentFunction(activeLayers)
    }
  }, [frameDates])

  const calcExtentsFromLimits = (matrixSet, matrixSetLimits, day, proj) => {
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
      id, layer, format, matrixIds, matrixSet, matrixSetLimits, projections, period, style, wrapadjacentdays, type,
    } = def;

    const tilesObject = {
      date,
      availableTiles: [],
      unavailableTiles: [],
    }

    const isSubdaily = period === 'subdaily';
    const isGranule = type === 'granule';
    const projectionsAttributes = projections[proj.id];
    const projSource = projectionsAttributes.source
    const configSource = config.sources[projSource];
    const urlParameters = `?TIME=${util.toISOStringSeconds(util.roundTimeOneMinute(date))}`;
    const sourceURL = def.sourceOverride || configSource.url;
    const configMatrixSet = configSource.matrixSets[projectionsAttributes.matrixSet];

    const { tileMatrices, resolutions, tileSize } = configMatrixSet;
    const { origin, extent } = calcExtentsFromLimits(configMatrixSet, matrixSetLimits, null, proj);
    const sizes = !tileMatrices ? [] : tileMatrices.map(({ matrixWidth, matrixHeight }) => [matrixWidth, matrixHeight]);

    const tileGridOptions = {
      origin: RIGHT_WING_ORIGIN,
      extent: RIGHT_WING_EXTENT,
      sizes,
      resolutions,
      matrixIds: matrixIds || resolutions.map((set, index) => index),
      tileSize: tileSize[0],
    }

    const tileLoadFunction = (layer, layerDate) => async function(tile, src) {
      return new Promise(async (resolve) => {
        try {
          const response = await fetch(src);
          const data = await response.blob();

          if (response.status === 200 && data !== undefined) {
            tilesObject.availableTiles.push(tile);
          } else {
            tilesObject.unavailableTiles.push(tile);
          }
        } catch (e) {
          tilesObject.unavailableTiles.push(tile);
        } finally {
          resolve();
        }
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
      tileLoadFunction: tileLoadFunction(def, date),
    });

    const totalTiles = 3
    const z = 0
    const promises = []

    for (let x = 0; x < totalTiles; x++) {
      for (let y = 0; y < totalTiles; y++) {
        const tileCoord = [z, x, y];
        const tileUrl = wmtsSource.tileUrlFunction(tileCoord, 1, proj);
        if (tileUrl !== undefined) {
          const promise = wmtsSource.getTileLoadFunction()(tileCoord, tileUrl);
          promises.push(promise);
        }
      }
    }

    await Promise.all(promises);
    return {
      tilesObject,
    }
  }

  // #3 child function that accepts an array of frame dates and a layer and returns availability for the range
  async function checkTilesForDates(dates, layer) {
    const availability = []

    for (const date of dates) {
      const tiles = await requestTilesWMTS(layer, date)
      availability.push(tiles)
    }

    return availability;
  }

  // #2 child function that accepts one layer and returns results for that layer
  async function getAvailabilityForLayer(layer) {

    const availability = await checkTilesForDates(frameDates, layer);

    const id = layer.id

    const layerAvailability = {
      [id]: availability,
    };


    return layerAvailability
  }

  // parent function that accepts activeLayers and returns final results
  async function parentFunction(activeLayers) {

    const allLayersAvailability = activeLayers.map((layer) => {
      const layerAvailability = getAvailabilityForLayer(layer)
      return layerAvailability;
    })

    const resolvedAllLayersAvailability = await Promise.all(allLayersAvailability);
    console.log(resolvedAllLayersAvailability);
  }


  return null;
}

export default DateRangeTileCheck;
