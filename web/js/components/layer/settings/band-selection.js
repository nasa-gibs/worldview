import React, { useState } from 'react';
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Button,
} from 'reactstrap';

const BandSelection = () => {
  const [bandSelection, setBandSelection] = useState({
    r: 'B07',
    g: 'B05',
    b: 'B04',
  });

  const confirmSelection = () => {
    console.log(bandSelection);
  };

  // eslint-disable-next-line react/prop-types
  const DropdownComponent = ({ channel }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggle = () => setDropdownOpen(!dropdownOpen);
    const bandValue = bandSelection[channel];

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
  };

  return (
    <>
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
    </>
  );
};

export default BandSelection;



