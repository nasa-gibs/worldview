import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Button, UncontrolledTooltip } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { transformExtent } from 'ol/proj';
import { getActiveLayers } from '../../../../modules/layers/selectors';
import fetchWMSImageExperimental from '../utils/image-api-request-experimental';
import calculatePixels from '../../kiosk/tile-measurement/utils/calculate-pixels';
import { layerPixelData } from '../../kiosk/tile-measurement/utils/layer-data-eic';
import { formatReduxDailyDate, formatReduxSubdailyDate } from '../../kiosk/tile-measurement/utils/date-util';
import Switch from '../../../../components/util/switch';
import DropdownSelector from './tile-image-test-dropdown-selection';

function PixelTestMode () {
  const {
    activeLayers,
    selectedDate,
    currentExtent,
  } = useSelector((state) => ({
    activeLayers: getActiveLayers(state, state.compare.activeString).map((layer) => layer),
    selectedDate: state.date.selected,
    currentExtent: state.map.ui.selected.getView().calculateExtent(state.map.ui.selected.getSize()),
  }));

  const placeHolderLayerSelection = { id: 'Select Layer', period: 'daily' };
  const [layerSelection, setLayerSelection] = useState(placeHolderLayerSelection);

  const [visualMapExtentSetting, setVisualMapExtentSetting] = useState(false);

  const buttonDisabled = layerSelection.id === 'Select Layer';

  const formatDate = () => {
    if (layerSelection.period === 'daily') {
      return formatReduxDailyDate(selectedDate);
    }
    return formatReduxSubdailyDate(selectedDate);
  };

  const makeMeasurementRequest = async () => {
    const formattedDate = formatDate();
    let mercatorExtent;
    if (visualMapExtentSetting) mercatorExtent = transformExtent(currentExtent, 'EPSG:4326', 'EPSG:3857');
    try {
      const wmsImage = await fetchWMSImageExperimental(layerSelection.id, formattedDate, mercatorExtent);

      // Create an image and handle its loading and error events
      const img = new Image();

      img.onload = async () => {
        // Process the loaded image here
        const blackPixelRatio = parseFloat((await calculatePixels(wmsImage) * 100).toFixed(2));
        // eslint-disable-next-line no-unsafe-optional-chaining
        const currentThreshold = layerPixelData?.[layerSelection?.id]?.threshold * 100 ?? null;

        const pixelMessage = `${blackPixelRatio}% of pixels are black for ${layerSelection.id} on ${formattedDate}... `;
        const thresholdMessage = currentThreshold ? `The current threshold for ${layerSelection.id} is ${currentThreshold}%` : `There is no current threshold for ${layerSelection.id} ...`;

        console.log(pixelMessage + thresholdMessage);
      };

      img.onerror = (error) => {
        console.error(`No image available for ${layerSelection.id} on ${formattedDate}: `, error);
      };

      // Try to load the image
      img.src = wmsImage;
    } catch (error) {
      console.error(`No image available for ${layerSelection.id} on ${formattedDate}: `, error);
    }
  };

  return (
    <div className="d-flex flex-column justify-content-center align-items-center mt-3">
      <div className="d-flex flex-row justify-content-center align-items-center">
        <h5 className="h5 fw-bold me-1">Pixel Test Mode</h5>
        <span><FontAwesomeIcon id="pixel-test-info-icon" icon="info-circle" className="pb-2" /></span>
        <UncontrolledTooltip
          id="pixel-test-tooltip"
          target="pixel-test-info-icon"
          placement="right"
        >
          Used to test the ratio of black pixels in an image tile. See PixelTestMode component.
        </UncontrolledTooltip>
      </div>
      <span className="border-top border-white-50 mb-2 w-100" />
      <Button
        color="primary"
        disabled={buttonDisabled}
        onClick={makeMeasurementRequest}
        className="mb-3"
      >
        Pixel Test
      </Button>
      <DropdownSelector
        activeLayers={activeLayers}
        layerSelection={layerSelection}
        setLayerSelection={setLayerSelection}
      />
      <Switch
        id="visual-extent-bbox-switch"
        key="visual-extent-bbox-switch"
        label="Use current visual extent as bounding box"
        active={visualMapExtentSetting}
        toggle={() => {
          setVisualMapExtentSetting(!visualMapExtentSetting);
        }}
      />
    </div>
  );
}

export default PixelTestMode;
