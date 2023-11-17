/* eslint-disable no-await-in-loop */
import { useEffect, useState } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { transformExtent } from 'ol/proj';
import { getActiveLayers } from '../../../../modules/layers/selectors';
import { selectDate as selectDateAction } from '../../../../modules/date/actions';
import {
  setEICMeasurementComplete as setEICMeasurementCompleteAction,
  setEICMeasurementAborted as setEICMeasurementAbortedAction,
  toggleStaticMap as toggleStaticMapAction,
} from '../../../../modules/ui/actions';
import { toggleGroupVisibility as toggleGroupVisiblityAction } from '../../../../modules/layers/actions';
import { getDates } from './utils/date-util';
import fetchWMSImage from './utils/image-api-request';
import calculatePixels from './utils/calculate-pixels';
import { layersToMeasure, layerPixelData, bestDates } from './utils/layer-data-eic';
import countTilesForSpecifiedLayers from './utils/verify-map-tiles';

function TileMeasurement({ ui }) {
  const dispatch = useDispatch();
  const selectDate = (date) => { dispatch(selectDateAction(date)); };
  const setEICMeasurementComplete = () => { dispatch(setEICMeasurementCompleteAction()); };
  const setEICMeasurementAborted = () => { dispatch(setEICMeasurementAbortedAction()); };
  const toggleStaticMap = (isActive) => { dispatch(toggleStaticMapAction(isActive)); };
  const toggleGroupVisibility = (ids, visible) => { dispatch(toggleGroupVisiblityAction(ids, visible)); };

  const eic = useSelector((state) => state.ui.eic);
  const realTime = useSelector((state) => state.date.appNow);
  const activeLayers = useSelector((state) => getActiveLayers(state, state.compare.activeString), shallowEqual);

  const [measurementsStarted, setMeasurementsStarted] = useState(false);

  // #2 Filter all of the active layers that are also in the layersToMeasure array
  const findLayersToMeasure = () => {
    const measurementLayersExtra = activeLayers.filter((layer) => layersToMeasure.includes(layer.id));

    const measurementLayers = measurementLayersExtra.map((layer) => ({ id: layer.id, period: layer.period }));
    if (measurementLayers.length) console.log(`${measurementLayers.length} EIC layer(s) found to measure...`);
    return measurementLayers;
  };

  // #3 Find the date range for each layer depending on the period (daily or subdaily)
  const findDateRange = (layerPeriod) => {
    const dates = getDates(realTime, layerPeriod);
    return dates;
  };

  // returns the date of the first layer that has a best date
  function findBestDate(layers, bestDates) {
    // eslint-disable-next-line no-restricted-syntax
    for (const layer of layers) {
      if (bestDates[layer.id]) {
        return bestDates[layer.id].date;
      }
    }
  }

  // #4 Loop through layers and dates to find the first date that satisfies full imagery thresholds
  const findFullImageryDate = async (layers, dates) => {
    console.log('Date range found... Finding date with satisfactory imagery...');
    for (let i = 0; i < dates.length; i += 1) {
      let layersMeetingThresholdForDate = 0;
      console.log(`-----Loop #${i + 1} for date ${dates[i]}-----`);
      for (let j = 0; j < layers.length; j += 1) {
        try {
          const currentExtent = ui.selected.getView().calculateExtent(ui.selected.getSize());
          const mercatorExtent = transformExtent(currentExtent, 'EPSG:4326', 'EPSG:3857');
          const wmsImage = await fetchWMSImage(layers[j].id, dates[i], mercatorExtent);
          const blackPixelRatio = await calculatePixels(wmsImage);
          const { threshold } = layerPixelData[layers[j].id];
          if (blackPixelRatio < threshold) {
            layersMeetingThresholdForDate += 1;
            console.log(`${layers[j].id} is BELOW the threshold of ${threshold * 100}% for ${dates[i]} with a black pixel ratio of ${blackPixelRatio.toFixed(2) * 100}%. This is ${layersMeetingThresholdForDate} of ${layers.length} checks needed for this date.`);
          } else {
            console.log(`${layers[j].id} is BREAKING the threshold of ${threshold * 100}% for -- ${dates[i]} -- with a black ratio of ${blackPixelRatio.toFixed(2) * 100}%.`);
            break;
          }
        } catch (error) {
          console.error(`No WMS image tile available for layer ${layers[j].id} on date ${dates[i]}: `, error);
          break;
        }
      }
      if (layersMeetingThresholdForDate === layers.length) {
        console.log(`All layers meet thresholds for ${dates[i]}.`);
        return dates[i];
      }
      layersMeetingThresholdForDate = 0;
    }

    const firstLayerWithBestDate = findBestDate(layers, bestDates);

    if (!firstLayerWithBestDate) {
      console.error(`No date found that satisfies the full imagery thresholds. There is no best date selected for ${layers[0].id}.`);
      return dates[0];
    }
    console.error(`No date found that satisfies imagery thresholds. Returning best date for ${layers[0].id} on ${firstLayerWithBestDate}.`);
    return firstLayerWithBestDate;
  };


  // #5 Update the date of the map to the date that satisfies the full imagery threshold
  const updateDate = (fullImageryDate, layerPeriod) => {
    console.log('Updating application date...');
    if (layerPeriod === 'daily') {
      const parts = fullImageryDate.split('-');
      const year = parts[0];
      const month = parts[1] - 1;
      const day = parts[2];

      const date = new Date(year, month, day, 12, 0, 0);
      selectDate(date);
    } else {
      const [datePart, timePart] = fullImageryDate.split('T');

      const dateParts = datePart.split('-');
      const year = +dateParts[0];
      const month = +dateParts[1] - 1;
      const day = +dateParts[2];

      // eslint-disable-next-line prefer-const
      let [hour, minute, second] = timePart.split(':');
      // Remove any fractional seconds if present and the 'Z' at the end
      second = second.includes('.') ? second.split('.')[0] : second;
      second = second.includes('Z') ? second.split('Z')[0] : second;

      const date = new Date(Date.UTC(year, month, day, +hour, +minute, +second));
      selectDate(date);
    }
  };

  const verifyTilesAndHandleErrors = (abortProceedure) => {
    console.log('Verifying tiles on map...');

    // most of these variables are purely for debugging purposes
    const {
      totalExpectedTileCount,
      totalLoadedTileCount,
      totalTilesLoadedWithBadImage,
      totalErrorTiles,
      totalEmptyTiles,
      totalOtherTileStates,
    } = countTilesForSpecifiedLayers(ui, layersToMeasure);

    const loadedTiles = totalLoadedTileCount > 0;
    const tileStatus = `Out of an expected ${totalExpectedTileCount} tiles, ${totalLoadedTileCount} were loaded. There were ${totalTilesLoadedWithBadImage} tiles loaded with bad images, ${totalErrorTiles} error tiles, and ${totalEmptyTiles} empty tiles. There were ${totalOtherTileStates.length} other tile states: ${totalOtherTileStates.join(', ')}`;
    console.log(tileStatus);

    if ((eic === 'da' || eic === 'sa') && !abortProceedure) {
      setEICMeasurementComplete();
    }
    if (loadedTiles && !abortProceedure) {
      setEICMeasurementComplete();
      console.log('Tile verified... EIC measure process complete...');
    } else if (loadedTiles && abortProceedure) {
      console.log('EIC measure process aborted... Loaded map tiles found... Leaving map as is...');
      setEICMeasurementAborted();
    } else if (!loadedTiles && abortProceedure) {
      console.log('EIC measure process aborted... No tiles found on map... Displaying static map...');
      toggleStaticMap(true);
      const activeLayerIds = activeLayers.map((layer) => layer.id);
      toggleGroupVisibility(activeLayerIds, false);
      setEICMeasurementAborted();
    }
  };

  // #1 Parent function that is called from useEffect.
  const calculateMeasurements = async () => {
    console.log('Entering EIC mode...');
    try {
      const measurementLayers = findLayersToMeasure();
      if (!measurementLayers.length) {
        console.error('No layers found to be measured... Aborting...');
        return verifyTilesAndHandleErrors(true);
      }

      const layersIncludeSubdaily = measurementLayers.some((layer) => layer.period === 'subdaily');
      const layerPeriod = layersIncludeSubdaily ? 'subdaily' : 'daily';

      const dateRange = findDateRange(layerPeriod);
      if (!dateRange) {
        console.error('No date range found... Aborting..');
        return verifyTilesAndHandleErrors(true);
      }

      const fullImageryDate = await findFullImageryDate(measurementLayers, dateRange);

      // If we are using the best date, we need to make sure there are tiles on the map so we include the abort prodcedure parameter
      // This allows us to fall back to the static map if the best date fails as a last resort
      const bestDate = findBestDate(measurementLayers, bestDates);
      if (!fullImageryDate || bestDate === fullImageryDate) return verifyTilesAndHandleErrors(true);

      // Format date based on period and dispatch redux action
      updateDate(fullImageryDate, layerPeriod);

      verifyTilesAndHandleErrors(false);
    } catch (error) {
      console.error('Error calculating measurements:', error);
    }
  };

  useEffect(() => {
    if (!measurementsStarted && activeLayers && eic && ui.selected) {
      setMeasurementsStarted(true);
      calculateMeasurements();
    }
  }, [ui.selected]);

  return null;
}

export default TileMeasurement;
