import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Button } from 'reactstrap';
import { getActiveLayers } from '../../../../../modules/layers/selectors';
import { fetchWMSImage } from '../utils/image-api-request';
import calculatePixels from '../utils/calculate-pixels'
import { layerPixelData } from '../utils/layer-data-eic';
import DropdownSelector from './tile-image-test-dropdown-selection'
import { formatReduxDailyDate, formatReduxSubdailyDate } from '../utils/date-util';

// Use this component to test the black pixel ratio of a single image
// You will need to set the the 'tileImageTestMode' state to true in mapUI
// Remember to set it back to false when you are done testing

function TileImagePixelTest() {
  const {
    activeLayers,
    selectedDate,
  } = useSelector((state) => ({
    activeLayers: getActiveLayers(state, state.compare.activeString).map((layer) => layer),
    selectedDate: state.date.selected,
  }));

  const placeHolderLayerSelection = { id: 'Select Layer', period: 'daily' }
  const [layerSelection, setLayerSelection] = useState(placeHolderLayerSelection);

  const buttonDisabled = layerSelection.id === 'Select Layer'

  const formatDate = () => {
    if (layerSelection.period === 'daily') {
      return formatReduxDailyDate(selectedDate)
    } else {
      return formatReduxSubdailyDate(selectedDate)
    }
  }

  const  makeMeasurementRequest = async () => {
    const formattedDate = formatDate()
    const wmsImage = await fetchWMSImage(layerSelection.id, formattedDate, true)
    if (!wmsImage) {
      console.error('No image returned from WMS request')
      return;
    }
    const blackPixelRatio = parseFloat((await calculatePixels(wmsImage) * 100).toFixed(2));

    const currentThreshold = layerPixelData?.[layerSelection?.id]?.threshold ?? null;

    const pixelMessage = `${blackPixelRatio}% of pixels are black for ${layerSelection.id} on ${formattedDate}... `
    const thresholdMessage = currentThreshold ? `The current threshold for ${layerSelection.id} is ${currentThreshold}%` : `There is no current threshold for ${layerSelection.id} ...`
    console.log(pixelMessage + thresholdMessage)
  }

  return (
    <div id="dev-block" className="d-flex justify-content-center">
      <Button
      color="primary"
      style={ { zIndex: "999" } }
      disabled={buttonDisabled}
      onClick={makeMeasurementRequest}
      >
        Pixel Test
      </Button>
      <DropdownSelector activeLayers={activeLayers} layerSelection={layerSelection} setLayerSelection={setLayerSelection} />

    </div>
  )
}

export default TileImagePixelTest;