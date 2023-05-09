import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import OlTileGridWMTS from 'ol/tilegrid/WMTS';
import OlSourceWMTS from 'ol/source/WMTS';
import OlLayerTile from 'ol/layer/Tile';
import TileState from 'ol/TileState';
import OlTileGridTileGrid from 'ol/tilegrid/TileGrid';
import PropTypes from 'prop-types';
import util from '../../../util/util';

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

  const createWmtsSource = (def, date) => {

    const {
      id, layer, format, matrixIds, matrixSet, matrixSetLimits, projections, period, style, wrapadjacentdays, type,
    } = def;

    const projectionsAttributes = projections[proj.id];
    const projSource = projectionsAttributes.source
    const configSource = config.sources[projSource];
    const urlParameters = `?TIME=${util.toISOStringSeconds(util.roundTimeOneMinute(date))}`;
    const sourceURL = def.sourceOverride || configSource.url;


    console.log(sourceURL + urlParameters)


    const wmtsSource = new OlSourceWMTS({
      url: sourceURL + urlParameters,
      // layer: layer.id,
      // matrixSet: layer.matrixSet,
      // format: layer.format,
      // projection: layer.projection,
      // tileGrid: new OlTileGridWMTS({
      //   origin: layer.origin,
      //   resolutions: layer.resolutions,
      //   matrixIds: layer.matrixIds,
      // }),
      // style: layer.style,
      // wrapX: true,
    });
    return wmtsSource;

  }



  const checkAvailability = (layer, date) => async function(tile, src) {

    console.log(src)

    try {
      const response = await fetch(src)
      const data = await response.blob()

      console.log(data)

      if (data !== undefined ){
        return true
      } else {
        return false
      }

    } catch (e) {
      return false
    }

  }

  // #3 child function that accepts an array of frame dates and a layer and returns availability for the range
  async function checkTilesForDates(dates, layer) {
    const availability = {
      availableTiles: [],
      unavailableTiles: [],
    };

    for (const date of dates) {

      const getWMTSsource = createWmtsSource(layer, date)

      const tileAvailability = checkAvailability(layer, date); // Replace with your tile URL generation logic

      if (tileAvailability) {
        availability.availableTiles.push(date);
      } else {
        availability.unavailableTiles.push(date);
      }
    }
    return availability;
  }

  // #2 child function that accepts one layer and returns results for that layer
  async function getAvailabilityForLayer(layer) {
    console.log(layer)

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
