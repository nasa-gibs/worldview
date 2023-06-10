import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getActiveLayers } from '../../../../modules/layers/selectors';
import { getDates } from './util';
import { fetchWMSImage } from './api-calls';

const layersToMeasure = [
  'VIIRS_SNPP_Thermal_Anomalies_375m_Day',
  'GOES-East_ABI_GeoColor',
  'GOES-West_ABI_GeoColor',
  'Himawari_AHI_Band3_Red_Visible_1km',
]

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

  // #2 We filter all of the active layers that are also in the layersToMeasure array
  const findLayersToMeasure = () => {
    setMeasurementsStarted(true)
    const measurementLayersExtra = activeLayers.filter(layer => layersToMeasure.includes(layer.id))
    console.log(measurementLayersExtra)
    // condense this step into the above filter later
    const measurementLayers = measurementLayersExtra.map(layer => ({  id: layer.id, period: layer.period }))
    // console.log(measurementLayers)

    return measurementLayers;
  }

  // #3 Then we find the date range for each layer depending on the period (daily or subdaily)
  const findDateRange = (measurementLayers) => {
    // there should be no situation where there are multiple layers with different periods
    const datePeriod = measurementLayers[0].period
    const dates = getDates(selectedDate, datePeriod)
    return dates
  }

  const getWMSImages = (layers, dates) => {

    return null;
  }

  // #1 Parent function that is called from useEffect.
  const calculateMeasurements = async () => {
    const measurementLayers = findLayersToMeasure();
    const dateRange = findDateRange(measurementLayers);
    console.log(measurementLayers)
    console.log(dateRange)

    const wmsImage = await fetchWMSImage(measurementLayers[0].id, dateRange[0])

    console.log(wmsImage)



    setMeasurementsCompleted(true)
  }

  return null;
}

export default TileMeasurement;