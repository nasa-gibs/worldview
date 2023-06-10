import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getActiveLayers } from '../../../../modules/layers/selectors';
import { getDates } from './utils/date-util';
import { fetchWMSImage } from './utils/image-api-request';
import calculatePixels from './utils/calculate-pixels'
import { layersToMeasure, layerPixelData } from './utils/layer-data-eic';

function TileMeasurement() {
  const {
    activeLayers,
    eic,
    selectedDate,
  } = useSelector((state) => ({
    activeLayers: getActiveLayers(state, state.compare.activeString).map((layer) => layer),
    eic: state.ui.eic,
    selectedDate: state.date.selected,
  }));

  const [measurementsStarted, setMeasurementsStarted] = useState(false);
  const [measurementsCompleted, setMeasurementsCompleted] = useState(false);

  useEffect(() => {
    if (!measurementsCompleted && !measurementsStarted && activeLayers && eic === 'alt') {
      calculateMeasurements();
    }
  })

  // #2 Filter all of the active layers that are also in the layersToMeasure array
  const findLayersToMeasure = () => {
    setMeasurementsStarted(true)
    const measurementLayersExtra = activeLayers.filter(layer => layersToMeasure.includes(layer.id))
    // console.log(measurementLayersExtra)
    // condense this step into the above filter later
    const measurementLayers = measurementLayersExtra.map(layer => ({  id: layer.id, period: layer.period }))
    // console.log(measurementLayers)

    return measurementLayers;
  }

  // #3 Find the date range for each layer depending on the period (daily or subdaily)
  const findDateRange = (measurementLayers) => {
    // there should be no situation where there are multiple layers with different periods
    const datePeriod = measurementLayers[0].period
    const dates = getDates(selectedDate, datePeriod)
    return dates
  }

  // #4 Loop through layers and dates to find the first date that satisfies full imagery thresholds
  const findFullImageryDate = async (layers, dates) => {
    // #1 Loop through dates starting with the current date
    for (let i = 0; i < dates.length; i++) {
      // Keep track of how many layers meet pixel threshold requirements for date
      // This value should be equal to the number of layers being measured to determine a date
      let layersMeetingThresholdForDate = 0;

      // #2 Loop through each layer that we want to measure and fetch the image for the i'th date
      for (let j = 0; j < layers.length; j++) {
        const wmsImage = await fetchWMSImage(layers[j].id, dates[i])
        const blackPixelRatio = await calculatePixels(wmsImage)
        // Find the pixel threshold for the current layer
        const threshold = layerPixelData[layers[j].id].threshold
        // If the amount of black pixels is less than the threshold, increment count, otherwise break loop
        if (blackPixelRatio < threshold) {
          layersMeetingThresholdForDate += 1;
        } else {
          break;
        }
      }
      // #3 After inner loop, check if count is equal to number of layers being measured
      if (layersMeetingThresholdForDate === layers.length) {
        return dates[i]
      } else {
        layersMeetingThresholdForDate = 0;
      }
    }
  }

  // #1 Parent function that is called from useEffect.
  const calculateMeasurements = async () => {
    try {
      const measurementLayers = findLayersToMeasure();
      const dateRange = findDateRange(measurementLayers);
      console.log(measurementLayers)
      console.log(dateRange)

      const fullImageryDate = await findFullImageryDate(measurementLayers, dateRange)
      console.log(fullImageryDate)

      setMeasurementsCompleted(true)
    } catch (error) {
      console.error("Error calculating measurements:", error);
    }
  }

  return null;
}

export default TileMeasurement;