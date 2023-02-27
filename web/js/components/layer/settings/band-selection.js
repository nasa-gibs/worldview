import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Button,
} from 'reactstrap';
import { connect } from 'react-redux';
import { updateBandCombination, removeLayer } from '../../../modules/layers/actions';
import { onClose } from '../../../modules/modal/actions';

function BandSelection({
  layer, updateBandCombination, removeLayer, closeModal,
}) {
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

    const bandChoices = ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08'];

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

  return (
    <div className="d-flex justify-content-center align-items-center flex-column">
      <h3>Select a band combination</h3>
      <div className="d-flex justify-content-between align-items-center mt-4 categories-dropdown-header">
        <p className="mr-2">R:</p>
        <DropdownComponent channel="r" />
      </div>
      <div className="d-flex justify-content-between align-items-center mt-4">
        <p className="mr-2">G:</p>
        <DropdownComponent channel="g" />
      </div>
      <div className="d-flex justify-content-between align-items-center mt-4">
        <p className="mr-2">B:</p>
        <DropdownComponent channel="b" />
      </div>
      <div className="mt-4">
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

const mapDispatchToProps = (dispatch) => ({
  updateBandCombination: (id, bandCombo) => {
    dispatch(updateBandCombination(id, bandCombo));
  },
  removeLayer: (id) => {
    dispatch(removeLayer(id));
  },
  closeModal: () => {
    dispatch(onClose());
  },
});

export default connect(
  null,
  mapDispatchToProps,
)(BandSelection);

BandSelection.propTypes = {
  layer: PropTypes.object,
  updateBandCombination: PropTypes.func,
  removeLayer: PropTypes.func,
  closeModal: PropTypes.func,
};
