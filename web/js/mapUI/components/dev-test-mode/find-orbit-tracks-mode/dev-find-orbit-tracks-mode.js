import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getIntersection, getArea, isEmpty } from 'ol/extent';
import {
  Button, ButtonGroup, UncontrolledTooltip, FormGroup, Label, Badge, Spinner,
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { transformExtent } from 'ol/proj';
import DropdownSelector from '../pixel-test-mode/tile-image-test-dropdown-selection';
import { selectDate as selectDateAction } from '../../../../modules/date/actions';
import { getActiveLayers } from '../../../../modules/layers/selectors';
import { formatReduxDailyDate, getOrbitalDates } from '../../kiosk/tile-measurement/utils/date-util';
import fetchWMSImageExperimental from '../utils/image-api-request-experimental';
import calculatePixels from '../../kiosk/tile-measurement/utils/calculate-pixels';
import { layerPixelData } from '../../kiosk/tile-measurement/utils/layer-data-eic';
import usePrevious from '../../../../util/customHooks';

function FindOrbitTracksMode () {
  const dispatch = useDispatch();
  const selectDate = (date) => { dispatch(selectDateAction(date)); };
  const {
    currentExtent,
    orbitalLayers,
    selectedDate,
    latestDate,
    zoom,
  } = useSelector((state) => ({
    currentExtent: state.map.ui.selected.getView().calculateExtent(state.map.ui.selected.getSize()),
    orbitalLayers: getActiveLayers(state, state.compare.activeString).filter((layer) => layer.layergroup === 'Orbital Track'),
    selectedDate: state.date.selected,
    latestDate: state.date.appNow,
    zoom: state.map.ui.selected.getView().getZoom(),
  }));

  const prevDate = usePrevious(selectedDate);
  const placeHolderLayerSelection = { id: 'Select Layer', period: 'daily' };
  const [layerSelection, setLayerSelection] = useState(placeHolderLayerSelection);
  const [searchMethod, setSearchMethod] = useState(0);
  const [dateFound, setDateFound] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedDate !== prevDate && dateFound !== null) {
      setDateFound(null);
    }
  });

  const buttonDisabled = layerSelection.id === 'Select Layer' || searchMethod === 0 || zoom < 7 || isLoading;

  const moveToDate = () => {
    const parts = dateFound.split('-');
    const year = parts[0];
    const month = parts[1] - 1;
    const day = parts[2];

    const date = new Date(year, month, day, 12, 0, 0);
    selectDate(date);
  };

  const verifyExtent = () => {
    // This is a very loose measurement.. Should find a better way to find values...
    const unitedStatesExtent = [-125.0799167388867, 22.176358212699427, -62.489596269417106, 57.01542814447728];
    const intersection = getIntersection(unitedStatesExtent, currentExtent);
    const intersectionArea = getArea(intersection);
    if (isEmpty(intersection)) {
      console.log('No intersection');
      return false;
    }
    const mapViewArea = getArea(currentExtent);
    const percentOfMapView = (intersectionArea / mapViewArea) * 100;
    console.log('percentOfMapView', percentOfMapView);
    const extentQualifies = percentOfMapView > 25;
    if (!extentQualifies) console.log(`Only ${percentOfMapView}% of map extent within United States.`);
    return extentQualifies;
  };

  const getOrbitalDateRange = () => {
    const formattedSelectedDate = formatReduxDailyDate(selectedDate);
    const formattedLatestDate = formatReduxDailyDate(latestDate);
    const dateRange = getOrbitalDates(formattedSelectedDate, formattedLatestDate, searchMethod);
    console.log(dateRange);
    return dateRange;
  };

  const makeMeasurementRequest = async (date) => {
    const mercatorExtent = transformExtent(currentExtent, 'EPSG:4326', 'EPSG:3857');
    try {
      const wmsImage = await fetchWMSImageExperimental(layerSelection.id, date, mercatorExtent);
      // Create an image and handle its loading and error events
      const img = new Image();
      // Create and return a Promise
      return new Promise((resolve, reject) => {
        img.onload = async () => {
          // Process the loaded image here
          const blackPixelRatio = parseFloat((await calculatePixels(wmsImage) * 100).toFixed(2));
          // eslint-disable-next-line no-unsafe-optional-chaining
          const currentThreshold = layerPixelData?.[layerSelection?.id]?.threshold * 100 ?? null;
          const pixelMessage = `${blackPixelRatio}% of pixels are black for ${layerSelection.id} on ${date}... `;
          const thresholdMessage = currentThreshold ? `The current threshold for ${layerSelection.id} is ${currentThreshold}%` : `There is no current threshold for ${layerSelection.id} ...`;
          console.log(pixelMessage + thresholdMessage);
          // Resolve the Promise with the result
          resolve(blackPixelRatio);
        };
        img.onerror = (error) => {
          console.error(`No image available for ${layerSelection.id} on ${date}: `, error);
          // Reject the Promise with the error
          reject(error);
        };
        // Try to load the image
        img.src = wmsImage;
      });
    } catch (error) {
      console.error(`No image available for ${layerSelection.id} on ${date}: `, error);
    }
  };

  const findOrbitalImagery = async () => {
    setIsLoading(true);
    const verifyQuery = verifyExtent();
    if (!verifyQuery) {
      setIsLoading(false);
      return;
    }
    const dateRange = getOrbitalDateRange();
    for (let i = 0; i < dateRange.length; i += 1) {
      const date = dateRange[i];
      // eslint-disable-next-line no-await-in-loop
      const imageryRequest = await makeMeasurementRequest(date);
      if (imageryRequest === 100 || !imageryRequest) {
        console.log('No imagery found for ', date);
      } else {
        setIsLoading(false);
        console.log('Imagery found for ', date, ' with ', imageryRequest, '% black pixels');
        return setDateFound(date);
      }
    }
    setIsLoading(false);
  };

  const orangeStyle = { backgroundColor: '#d54e21' };

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
      <div className="d-flex flex-row justify-content-center align-items-center mb-2">
        <h5>Minimum Zoom: </h5>
        <Badge color="primary" className="ms-2 me-4 px-3 py-2 fs-6">7</Badge>
        <h5>Current Zoom: </h5>
        <Badge color={zoom < 7 ? 'danger' : 'success'} className="ms-2 me-4 px-3 py-2 fs-6">{zoom.toFixed(2)}</Badge>
      </div>
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
        style={orangeStyle}
        onClick={findOrbitalImagery}
        className="mb-3"
        disabled={buttonDisabled}
      >
        {isLoading ? <Spinner size="sm" color="light" /> : 'Search For Imagery'}
      </Button>
      <div className="d-flex flex-row justify-content-center align-items-center mb-2">
        <h5>Date Found:</h5>
        <Badge color="primary" className="ms-2 me-4 px-3 py-2 fs-6">{dateFound || 'No date found'}</Badge>
        <Button
          onClick={moveToDate}
          disabled={!dateFound}
          style={orangeStyle}
        >
          {isLoading ? <Spinner size="sm" color="light" /> : 'Take Me There'}
        </Button>
      </div>
    </div>
  );
}

export default FindOrbitTracksMode;
