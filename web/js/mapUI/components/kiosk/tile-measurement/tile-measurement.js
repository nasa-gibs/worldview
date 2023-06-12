/* eslint-disable no-await-in-loop */
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
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

  const {
    activeString,
    activeLayers,
    eic,
    realTime,
  } = useSelector((state) => ({
    activeLayers: getActiveLayers(state, state.compare.activeString).map((layer) => layer),
    eic: state.ui.eic,
    realTime: state.date.appNow,
    activeString: state.compare.activeString,
  }));
  const activeLayerIds = useSelector((state) => getActiveLayers(state, activeString).map((layer) => layer.id));

  const [measurementsStarted, setMeasurementsStarted] = useState(false);

  useEffect(() => {
    if (!measurementsStarted && activeLayers && eic) {
      calculateMeasurements();
    }
  });

  // #2 Filter all of the active layers that are also in the layersToMeasure array
  const findLayersToMeasure = () => {
    const measurementLayersExtra = activeLayers.filter((layer) => layersToMeasure.includes(layer.id));
    // condense this step into the above filter later
    const measurementLayers = measurementLayersExtra.map((layer) => ({ id: layer.id, period: layer.period }));
    if (measurementLayers.length) console.log(`${measurementLayers.length} EIC layer(s) found to measure...`);
    return measurementLayers;
  };

  // #3 Find the date range for each layer depending on the period (daily or subdaily)
  const findDateRange = (layerPeriod) => {
    const dates = getDates(realTime, layerPeriod);
    return dates;
  };

  // #4 Loop through layers and dates to find the first date that satisfies full imagery thresholds
  const findFullImageryDate = async (layers, dates) => {
    console.log('Date range found... Finding date with satisfactory imagery...');
    for (let i = 0; i < dates.length; i += 1) {
      let layersMeetingThresholdForDate = 0;
      console.log(`-----Loop #${i + 1} for date ${dates[i]}-----`);
      for (let j = 0; j < layers.length; j += 1) {
        try {
          const wmsImage = await fetchWMSImage(layers[j].id, dates[i]);
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
          console.error(`Error while processing layer ${layers[j].id} for date ${dates[i]}: `, error);
          break;
        }
      }
      if (layersMeetingThresholdForDate === layers.length) {
        console.log(`All layers meet thresholds for ${dates[i]}.`);
        return dates[i];
      }
      layersMeetingThresholdForDate = 0;
    }
    // returns the date of the first layer that has a best date
    const firstLayerWithBestDate = layers.find((layer) => bestDates[layer.id]?.date);
    if (!firstLayerWithBestDate) {
      console.error(`No date found that satisfies the full imagery thresholds. There is no best date selected for ${layers[0].id}.`);
      // display static map??
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
    const tileCount = countTilesForSpecifiedLayers(ui, layersToMeasure);
    const loadedTiles = tileCount.totalLoadedTileCount > 0;
    if (loadedTiles && !abortProceedure) {
      setEICMeasurementComplete();
      console.log('Tile verified... EIC measure process complete...');
    } else if (loadedTiles && abortProceedure) {
      console.log('EIC measure process aborted... Loaded map tiles found... Leaving map as is...');
      setEICMeasurementAborted();
    } else if (!loadedTiles && abortProceedure) {
      console.log('EIC measure process aborted... No tiles found on map... Displaying static map...');
      toggleStaticMap(true);
      toggleGroupVisibility(activeLayerIds, false);
      setEICMeasurementAborted();
    }
  };


  // #1 Parent function that is called from useEffect.
  const calculateMeasurements = async () => {
    try {
      console.log('Entering EIC mode...');

      setMeasurementsStarted(true);

      const measurementLayers = findLayersToMeasure();
      if (!measurementLayers) {
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
      if (!fullImageryDate) return verifyTilesAndHandleErrors(true);

      // Format date based on period and dispatch redux action
      updateDate(fullImageryDate, layerPeriod);

      verifyTilesAndHandleErrors();
    } catch (error) {
      console.error('Error calculating measurements:', error);
      verifyTilesAndHandleErrors(true);
    }
  };

  return null;
}

export default TileMeasurement;
