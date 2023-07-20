import React, { useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import googleTagManager from 'googleTagManager';
import Button from '../util/button';
import Checkbox from '../util/checkbox';
import safeLocalStorage from '../../util/local-storage';
import { getConceptUrl } from '../../modules/smart-handoff/selectors';

const STD_NRT_MAP = {
  STD: 'Standard',
  NRT: 'Near Real-Time',
};

/**
 * The Smart-Handoff components replaces the existing data download capability
 * by directing users to select specific layer products within Worldview and 'hand' them 'off'
 * to NASA's Earthdata Search web tool that will proceed in fetching corresponding
 * layer data and granule files that are available for download.
 */
function SmartHandoffModal({
  displayDate, selectedLayer, selectedCollection, continueToEDS, cmrSearchDetailURL,
}) {
  // Hides Earthdata Search information by default
  const [showMoreInfo, toggleInfo] = useState(false);
  const { HIDE_EDS_WARNING } = safeLocalStorage.keys;
  const [hideModal, setHideModal] = useState(safeLocalStorage.getItem(HIDE_EDS_WARNING) || false);
  const { title, type, version } = selectedCollection;
  const { dateRanges } = selectedLayer;

  const onCheck = () => {
    if (!hideModal) {
      safeLocalStorage.setItem(HIDE_EDS_WARNING, true);
      googleTagManager.pushEvent({
        event: 'smart_handoffs_toggle_true_hide_warning',
      });
    } else {
      safeLocalStorage.removeItem(HIDE_EDS_WARNING);
    }
    setHideModal(!hideModal);
  };

  return (

    <div>

      <div className="smart-handoff-heading">
        <a href="https://search.earthdata.nasa.gov" target="_blank" rel="noopener noreferrer">
          <img src="images/nasa-logo.png" style={{ maxHeight: '38px' }} />
          <img src="images/earthdata-search.png" />
        </a>
      </div>

      <div className="smart-handoff-message">
        You are about to be transferred to the NASA Earthdata Search tool. This tool is used to download
        data granules using the selected layer, area of interest, and current date.
      </div>

      { showMoreInfo
      && (
      <div className="smart-handoff-about">
        <hr />
        <h1 className="about-heading">About Earthdata Search</h1>
        <div className="about-section">
          <p>
            Earthdata Search provides the only means for data discovery, filtering, visualization, and
            access across all of NASA Earth science data holdings. The current selected layer and the designated
            viewport region in @NAME@ will be used to derive data granules within Earthdata Search.
          </p>

          <img className="earth-data-gif" src="images/earth-data-search-preview.gif" />
          <p className="earth-data-caption">
            Granules that are available to download will be listed in the white pull out menu. Each granule listed can be
            downloaded individually or the entire set contained within the bounding box can be downloaded as a zip file.
          </p>

          <p>
            To leverage the use of Earthdata Search, users must register at
            {' '}
            <a href="https://urs.earthdata.nasa.gov/home" target="_blank" rel="noopener noreferrer">urs.earthdata.nasa.gov</a>
            . The registration is provided free of charge. The user needs to set up a user ID, password, and provide
            additional information, such as, user name, affiliation, country and a valid e-mail address, in order to complete
            the registration process.
          </p>

          <h1 className="about-heading">Why must I register?</h1>
          <p>
            As noted on the Earthdata homepage, the Earthdata Login provides a single mechanism for user registration and profile
            management for all EOSDIS system components (DAACs, Tools, Services). Your Earthdata login also helps the EOSDIS program
            better understand the usage of EOSDIS services to improve user experience through customization of tools and improvement
            of services. EOSDIS data are openly available to all and free of charge except where governed by international agreements.
          </p>
        </div>
      </div>
      )}

      <div className="toggle-more-info" onClick={() => toggleInfo(!showMoreInfo)}>
        <h2><span>{showMoreInfo ? 'Hide Info' : 'Show More Info'}</span></h2>
      </div>

      <div className="smart-handoff-layer-info">

        <h1> Collection: </h1>
        <div className="handoff-modal-link">
          {STD_NRT_MAP[type] + (version ? ` - v${version}` : '')}
          <br />
          <a href={cmrSearchDetailURL} target="_blank" rel="noopener noreferrer">
            {title || 'Details'}
          </a>
        </div>

        <h1> Layer: </h1>
        <div className="handoff-modal-layer-title">
          {selectedLayer.title}
        </div>
        <div className="handoff-modal-layer-subtitle">
          {selectedLayer.subtitle}
        </div>

        {dateRanges && (
          <>
            <h1> Date:</h1>
            <div className="handoff-modal-date">{displayDate}</div>
          </>
        )}

      </div>

      <div className="smart-handoff-button-group">
        <Button
          onClick={continueToEDS}
          id="continue-btn"
          text="Continue"
          className="red"
        />
      </div>

      <div className="checkbox-footer">
        <div className="checkbox-footer-container">
          <Checkbox
            id="hide-eds-checkbox"
            name="hide-eds"
            onCheck={onCheck}
            checked={hideModal}
            color="gray"
            aria-label="Do not show the Earthdata Search message again."
            label="Do not show this message again."
          />
        </div>
      </div>

    </div>

  );
}

function mapStateToProps(state, ownProps) {
  const { selectedCollection: { value } } = ownProps;
  const url = value && getConceptUrl(state)(value);
  return {
    cmrSearchDetailURL: url,
  };
}

SmartHandoffModal.propTypes = {
  continueToEDS: PropTypes.func,
  displayDate: PropTypes.string,
  cmrSearchDetailURL: PropTypes.string,
  selectedCollection: PropTypes.object,
  selectedLayer: PropTypes.object,
};

export default connect(mapStateToProps)(SmartHandoffModal);
