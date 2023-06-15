import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Button,
  UncontrolledTooltip,
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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

  // eslint-disable-next-line react/prop-types
  function DropdownComponent({ channel }) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggle = () => setDropdownOpen(!dropdownOpen);
    const bandValue = bandSelection[channel] || layer.bandCombo[0];

    const bandChoices = ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08', 'B8A', 'B09', 'B10', 'B11', 'B12'];

    const handleSelection = (band) => {
      setBandSelection({
        ...bandSelection,
        [channel]: band,
      });
    };

    return (
      <Dropdown isOpen={dropdownOpen} toggle={toggle} size="sm">
        <DropdownToggle style={{ backgroundColor: '#d54e21' }} caret>
          {bandValue}
        </DropdownToggle>
        <DropdownMenu style={{ transform: 'translate3d(-30px, 0px, 0px)' }}>
          {bandChoices.map((band) => (
            <DropdownItem key={band} onClick={() => handleSelection(band)}>
              {band}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
    );
  }

  const rwbInfo = (
    <div className="band-selection-rwb-info">
      <p>Resolution = 10m/px</p>
      <p>Wavelength = 490nm</p>
      <p>Bandwidth = 65nm</p>
    </div>
  );

  return (
    <div className="customize-bands-container">
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
        <DropdownComponent channel="r" />
        {rwbInfo}
      </div>
      <div className="band-selection-row">
        <p className="band-selection-color-header">G:</p>
        <DropdownComponent channel="g" />
        {rwbInfo}
      </div>
      <div className="band-selection-row">
        <p className="band-selection-color-header">B:</p>
        <DropdownComponent channel="b" />
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
  updateBandCombination: PropTypes.func,
  removeLayer: PropTypes.func,
  closeModal: PropTypes.func,
};
