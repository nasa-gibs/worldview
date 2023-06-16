import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Button, UncontrolledTooltip } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BandsDropdown from './menu-components/band-dropdown';
import PresetOptions from './menu-components/preset-options';
import {
  updateBandCombination as updateBandCombinationAction,
  removeLayer as removeLayerAction,
} from '../../../../modules/layers/actions';
import { onClose } from '../../../../modules/modal/actions';

export default function BandSelection({ layer }) {
  const dispatch = useDispatch();
  const updateBandCombination = (id, bandCombo) => { dispatch(updateBandCombinationAction(id, bandCombo)); };
  const removeLayer = (id) => { dispatch(removeLayerAction(id)); };
  const closeModal = () => { dispatch(onClose()); };

  const [selectedPreset, setSelectedPreset] = useState(null);
  const [bandSelection, setBandSelection] = useState({
    r: layer.bandCombo.r,
    g: layer.bandCombo.g,
    b: layer.bandCombo.b,
  });

  const confirmSelection = () => {
    removeLayer(layer.id);
    updateBandCombination(layer.id, bandSelection);
    closeModal();
  };

  const rwbInfo = (
    <div className="band-selection-rwb-info">
      <p>Resolution = 10m/px</p>
      <p>Wavelength = 490nm</p>
      <p>Bandwidth = 65nm</p>
    </div>
  );

  return (
    <div className="customize-bands-container">
      <PresetOptions
        selectedPreset={selectedPreset}
        setSelectedPreset={setSelectedPreset}
        setBandSelection={setBandSelection}
      />
      <div className="band-selection-title-row">
        <h3>Select a band for each channel:</h3>
        <span><FontAwesomeIcon id="band-selection-title-info-icon" icon="info-circle" /></span>
        <UncontrolledTooltip
          id="band-selection-title-tooltip"
          target="band-selection-title-info-icon"
          placement="right"
        >
          Apply custom band combinations
        </UncontrolledTooltip>
      </div>

      <div className="band-selection-row">
        <p className="band-selection-color-header">R:</p>
        <BandsDropdown
          channel="r"
          bandSelection={bandSelection}
          setBandSelection={setBandSelection}
          setSelectedPreset={setSelectedPreset}
          layer={layer}
        />
        {rwbInfo}
      </div>
      <div className="band-selection-row">
        <p className="band-selection-color-header">G:</p>
        <BandsDropdown
          channel="g"
          bandSelection={bandSelection}
          setBandSelection={setBandSelection}
          setSelectedPreset={setSelectedPreset}
          layer={layer}
        />
        {rwbInfo}
      </div>
      <div className="band-selection-row">
        <p className="band-selection-color-header">B:</p>
        <BandsDropdown
          channel="b"
          bandSelection={bandSelection}
          setBandSelection={setBandSelection}
          setSelectedPreset={setSelectedPreset}
          layer={layer}
        />
        {rwbInfo}
      </div>
      <div className="band-selection-button-row">
        <Button
          id="confirm-band-selection"
          aria-label="Confirm band selection"
          className="wv-button red"
          onClick={() => confirmSelection()}
        >
          <span className="button-text">
            Confirm Band Selection
          </span>
        </Button>
      </div>
    </div>
  );
}

BandSelection.propTypes = {
  layer: PropTypes.object,
};
