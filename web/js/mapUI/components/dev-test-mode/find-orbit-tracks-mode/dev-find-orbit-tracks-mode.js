import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Button, ButtonGroup, UncontrolledTooltip, FormGroup, Label,
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { transformExtent } from 'ol/proj';
import DropdownSelector from '../pixel-test-mode/tile-image-test-dropdown-selection';
import { getActiveLayers } from '../../../../modules/layers/selectors';
import { formatReduxDailyDate, getOrbitalDates } from '../../kiosk/tile-measurement/utils/date-util';
import fetchWMSImageExperimental from '../utils/image-api-request-experimental';
import calculatePixels from '../../kiosk/tile-measurement/utils/calculate-pixels';
import { layerPixelData } from '../../kiosk/tile-measurement/utils/layer-data-eic';

function FindOrbitTracksMode () {
  const {
    currentExtent,
    orbitalLayers,
    selectedDate,
    latestDate,
  } = useSelector((state) => ({
    currentExtent: state.map.ui.selected.getView().calculateExtent(state.map.ui.selected.getSize()),
    orbitalLayers: getActiveLayers(state, state.compare.activeString).filter((layer) => layer.layergroup === 'Orbital Track'),
    selectedDate: state.date.selected,
    latestDate: state.date.appNow,
  }));

  const placeHolderLayerSelection = { id: 'Select Layer', period: 'daily' };
  const [layerSelection, setLayerSelection] = useState(placeHolderLayerSelection);
  const [searchMethod, setSearchMethod] = useState(0);

  const buttonDisabled = layerSelection.id === 'Select Layer' || searchMethod === 0;

  const makeMeasurementRequest = async () => {
    const formattedSelectedDate = formatReduxDailyDate(selectedDate);
    const formattedLatestDate = formatReduxDailyDate(latestDate);
    const mercatorExtent = transformExtent(currentExtent, 'EPSG:4326', 'EPSG:3857');

    const dateRange = getOrbitalDates(formattedSelectedDate, formattedLatestDate, searchMethod);
    console.log(dateRange);

    try {
      const wmsImage = await fetchWMSImageExperimental(layerSelection.id, formattedSelectedDate, mercatorExtent);

      // Create an image and handle its loading and error events
      const img = new Image();

      img.onload = async () => {
        // Process the loaded image here
        const blackPixelRatio = parseFloat((await calculatePixels(wmsImage) * 100).toFixed(2));
        // eslint-disable-next-line no-unsafe-optional-chaining
        const currentThreshold = layerPixelData?.[layerSelection?.id]?.threshold * 100 ?? null;

        const pixelMessage = `${blackPixelRatio}% of pixels are black for ${layerSelection.id} on ${formattedSelectedDate}... `;
        const thresholdMessage = currentThreshold ? `The current threshold for ${layerSelection.id} is ${currentThreshold}%` : `There is no current threshold for ${layerSelection.id} ...`;

        console.log(pixelMessage + thresholdMessage);
      };

      img.onerror = (error) => {
        console.error(`No image available for ${layerSelection.id} on ${formattedSelectedDate}: `, error);
      };

      // Try to load the image
      img.src = wmsImage;
    } catch (error) {
      console.error(`No image available for ${layerSelection.id} on ${formattedSelectedDate}: `, error);
    }
  };

  return (
    <div className="d-flex flex-column justify-content-center align-items-center mt-3">
      <div className="d-flex flex-row justify-content-center align-items-center">
        <h5 className="h5 fw-bold me-1">Orbit Track Test Mode</h5>
        <span><FontAwesomeIcon id="orbit-track-test-info-icon" icon="info-circle" className="pb-2" /></span>
        <UncontrolledTooltip
          id="orbit-track-test-tooltip"
          target="orbit-track-test-info-icon"
          placement="right"
        >
          Find nearest imagery date with orbit tracks for current extent
        </UncontrolledTooltip>
      </div>
      <span className="border-top border-white-50 mb-2 w-100" />
      <DropdownSelector
        activeLayers={orbitalLayers}
        layerSelection={layerSelection}
        setLayerSelection={setLayerSelection}
      />
      <FormGroup className="d-flex justify-content-center">
        <Label for="searchMethod"><h4>Select a date search method</h4></Label>
      </FormGroup>
      <FormGroup className="d-flex justify-content-center">
        <ButtonGroup>
          <Button
            color="primary"
            outline
            onClick={() => setSearchMethod(1)}
            active={searchMethod === 1}
          >
            Forwards
          </Button>
          <Button
            color="primary"
            outline
            onClick={() => setSearchMethod(2)}
            active={searchMethod === 2}
          >
            Backwards
          </Button>
          <Button
            color="primary"
            outline
            onClick={() => setSearchMethod(3)}
            active={searchMethod === 3}
          >
            Both
          </Button>
        </ButtonGroup>
      </FormGroup>
      <Button
        color="primary"
        onClick={makeMeasurementRequest}
        className="mb-3"
        disabled={buttonDisabled}
      >
        Pixel Test
      </Button>
    </div>
  );
}

export default FindOrbitTracksMode;
