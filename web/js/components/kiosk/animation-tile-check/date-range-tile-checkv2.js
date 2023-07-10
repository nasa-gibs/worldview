import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { transformExtent } from 'ol/proj';
import {
  setAnimationDates as setAnimationDatesAction,
} from '../../../modules/ui/actions';
import fetchWMSImage from '../../../mapUI/components/kiosk/tile-measurement/utils/image-api-request';
import calculatePixels from '../../../mapUI/components/kiosk/tile-measurement/utils/calculate-pixels';
import { layersToMeasure, layerPixelData } from '../../../mapUI/components/kiosk/tile-measurement/utils/layer-data-eic';
import { arrayOfDateObjectsToDateStrings } from '../../../mapUI/components/kiosk/tile-measurement/utils/date-util';
import EICPlayQueue from '../../animation-widget/eic-play-queue';
import EICPlayQueueTwo from '../../animation-widget/eic-play-queue-2';

function DateRangeTileCheckVersionTwo(props) {
  const {
    frameDates,
    activeLayers,
    measurementStarted,
    setMeasurementStarted,
    setMeasurementFinished,
    measurementFinished,
  } = props;
  const dispatch = useDispatch();
  const setAnimationDates = (dates) => { dispatch(setAnimationDatesAction(dates)); };

  const map = useSelector((state) => state.map.ui.selected);

  useEffect(() => {
    if (frameDates.length && !measurementStarted) {
      setMeasurementStarted(true);
      calculateMeasurements();
    }
  }, [frameDates]);

  const findLayersToMeasure = () => {
    console.log('#2 Finding layers to measure...')
    const measurementLayers = activeLayers.reduce((accumulator, layer) => {
      if (layersToMeasure.includes(layer.id)) {
        accumulator.push({ id: layer.id, period: layer.period });
      }
      return accumulator;
    }, []);

    if (measurementLayers.length) console.log(`#2-1: ${measurementLayers.length} EIC layer(s) found to measure...`);
    return measurementLayers;
  }

  const checkImagery = async (layers) => {
    console.log('#3 Checking imagery for each layer...');

    const frameDatesAsStrings = arrayOfDateObjectsToDateStrings(frameDates);
    console.log('frameDatesToString ', frameDatesAsStrings)

    const layersPerDate = layers.length;
    const datesToCheck = frameDates.length;
    const datesWithFullImagery = [];
    let currentDateImageryCount = 0;

    const currentExtent = map.getView().calculateExtent(map.getSize());
    const mercatorExtent = transformExtent(currentExtent, 'EPSG:4326', 'EPSG:3857');

    for (let i = 0; i < datesToCheck; i += 1){
      for (let j = 0; j < layersPerDate; j += 1){
        try {
          const wmsImage = await fetchWMSImage(layers[j].id, frameDatesAsStrings[i], mercatorExtent)
          const blackPixelRatio = await calculatePixels(wmsImage);
          const { threshold } = layerPixelData[layers[j].id];
          if (blackPixelRatio < threshold) {
            currentDateImageryCount += 1;
            console.log(`${layers[j].id} is BELOW the threshold of ${threshold * 100}% for ${frameDates[i]} with a black pixel ratio of ${blackPixelRatio.toFixed(2) * 100}%.`);
          } else {
            console.log(`${layers[j].id} is BREAKING the threshold of ${threshold * 100}% for -- ${dates[i]} -- with a black ratio of ${blackPixelRatio.toFixed(2) * 100}%.`);
            currentDateImageryCount = 0;
            break;
          }
        } catch (error) {
          console.error(`Error while processing layer ${layers[j].id} for date ${frameDates[i]}: `, error);
          currentDateImageryCount = 0;
          break;
        }
      }
      if (currentDateImageryCount === layersPerDate) {
        datesWithFullImagery.push(frameDates[i]);
      } else {
        currentDateImageryCount = 0;
      }
      console.log(`${frameDates.length - (i + 1)} dates left to check...`)
    }

    return frameDates;
  }

  const calculateMeasurements = async () => {
    console.log('#1 calculating animation measurements...');
    const measurementLayers = findLayersToMeasure();
    console.log('#2-2: measurementLayers: ', measurementLayers);
    const datesWithFullyImagery = await checkImagery(measurementLayers);
    console.log('#3-1: datesWithFullyImagery: ', datesWithFullyImagery);
    const isoStringDates = datesWithFullyImagery.map((date) => date.toISOString());
    console.log('#3-2: isoStringDates: ', isoStringDates);
    setAnimationDates(isoStringDates);
    setMeasurementFinished(true);
  };

  return measurementFinished && <EICPlayQueueTwo />;
}

export default DateRangeTileCheckVersionTwo;