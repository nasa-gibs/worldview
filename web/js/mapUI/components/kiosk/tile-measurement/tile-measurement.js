/* eslint-disable no-await-in-loop */
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getActiveLayers } from '../../../../modules/layers/selectors';
import { selectDate as selectDateAction } from '../../../../modules/date/actions';
import { setEICMeasurementComplete as setEICMeasurementCompleteAction } from '../../../../modules/ui/actions';
import { getDates } from './utils/date-util';
import fetchWMSImage from './utils/image-api-request';
import calculatePixels from './utils/calculate-pixels';
import { layersToMeasure, layerPixelData, bestDates } from './utils/layer-data-eic';

function TileMeasurement() {
  const dispatch = useDispatch();
  const selectDate = (date) => { dispatch(selectDateAction(date)); };
  const setEICMeasurementComplete = () => { dispatch(setEICMeasurementCompleteAction()); };
  const {
    activeLayers,
    eic,
    realTime,
  } = useSelector((state) => ({
    activeLayers: getActiveLayers(state, state.compare.activeString).map((layer) => layer),
    eic: state.ui.eic,
    realTime: state.date.appNow,
  }));

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

    return measurementLayers;
  };

  // #3 Find the date range for each layer depending on the period (daily or subdaily)
  const findDateRange = (layerPeriod) => {
    const dates = getDates(realTime, layerPeriod);
    return dates;
  };

  // #4 Loop through layers and dates to find the first date that satisfies full imagery thresholds
  const findFullImageryDate = async (layers, dates) => {
    console.log('Part #4: Finding Full Imagery Date');
    for (let i = 0; i < dates.length; i += 1) {
      let layersMeetingThresholdForDate = 0;
      console.log(`-----Loop #${i} for date ${dates[i]}-----`);
      for (let j = 0; j < layers.length; j += 1) {
        try {
          const wmsImage = await fetchWMSImage(layers[j].id, dates[i]);
          const blackPixelRatio = await calculatePixels(wmsImage);
          const { threshold } = layerPixelData[layers[j].id];
          if (blackPixelRatio < threshold) {
            layersMeetingThresholdForDate += 1;
            console.log(`${layers[j].id} is BELOW the threshold of ${threshold * 100} for ${dates[i]} with a black pixel % of ${blackPixelRatio.toFixed(2) * 100}. This is ${layersMeetingThresholdForDate} of ${layers.length} needed for this date.`);
          } else {
            console.log(`${layers[j].id} is BREAKING the threshold of ${threshold * 100} for -- ${dates[i]} -- with a black pixel % of ${blackPixelRatio.toFixed(2) * 100}.`);
            break;
          }
        } catch (error) {
          console.error(`Error while processing layer ${layers[j].id} for date ${dates[i]}: `, error);
          break;
        }
      }
      if (layersMeetingThresholdForDate === layers.length) {
        console.log(`All layers meet the threshold for ${dates[i]}.`);
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
    console.error(`No date found that satisfies the full imagery thresholds.  Returning best date for ${layers[0].id} on ${firstLayerWithBestDate}.`);
    return firstLayerWithBestDate;
  };

  // #5 Update the date of the map to the date that satisfies the full imagery threshold
  const updateDate = (fullImageryDate, layerPeriod) => {
    if (layerPeriod === 'daily') {
      const parts = fullImageryDate.split('-');
      const year = parts[0];
      const month = parts[1] - 1;
      const day = parts[2];

      const date = new Date(year, month, day, 12, 0, 0);
      console.log('Final Date EDT', date);
      selectDate(date);
    } else {
      console.log('Part #5: Attempting to format fullImageryDate: ', fullImageryDate);

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
      console.log('Final Date EDT', date);
      selectDate(date);
    }
  };

  // #1 Parent function that is called from useEffect.
  const calculateMeasurements = async () => {
    try {
      setMeasurementsStarted(true);

      const measurementLayers = findLayersToMeasure();
      if (!measurementLayers) {
        console.error('No active layers are setup to be measured.');
        return;
      }

      const layersIncludeSubdaily = measurementLayers.some((layer) => layer.period === 'subdaily');
      const layerPeriod = layersIncludeSubdaily ? 'subdaily' : 'daily';

      const dateRange = findDateRange(layerPeriod);

      const fullImageryDate = await findFullImageryDate(measurementLayers, dateRange);
      if (!fullImageryDate) return;

      // Format date based on period and dispatch redux action
      updateDate(fullImageryDate, layerPeriod);

      setEICMeasurementComplete();
    } catch (error) {
      console.error('Error calculating measurements:', error);
    }
  };

  return null;
}

export default TileMeasurement;
