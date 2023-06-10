import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getActiveLayers } from '../../../../modules/layers/selectors';
import { getDates } from './util';
import { fetchWMSImage } from './api-calls';
import calculatePixels from './calculate-pixels'
import { layersToMeasure, layerPixelData } from './layer-data-eic';

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

    const wmsImage = await fetchWMSImage(layers[0].id, dates[0])
    console.log(wmsImage)

    const blackPixelRatio = await calculatePixels(wmsImage)
    console.log(blackPixelRatio)
  }

  // #1 Parent function that is called from useEffect.
  const calculateMeasurements = async () => {
    try {
      const measurementLayers = findLayersToMeasure();
      const dateRange = findDateRange(measurementLayers);
      console.log(measurementLayers)
      console.log(dateRange)

      const fullImageryDate = await findFullImageryDate(measurementLayers, dateRange)

      setMeasurementsCompleted(true)
    } catch (error) {
      console.error("Error calculating measurements:", error);
    }
  }

  return null;
}

export default TileMeasurement;